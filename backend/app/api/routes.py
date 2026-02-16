import csv
import hashlib
import io
import json
import os
import shutil
import zipfile
from datetime import date, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_permission
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.entities import (
    AuditLog,
    BeanType,
    Customer,
    FollowUp,
    LedgerReason,
    Payment,
    Product,
    ProductRecipe,
    PurchaseOrder,
    RoastBatch,
    RoleEnum,
    SalesOrder,
    SegmentEnum,
    Settings,
    StockLedger,
    UpdateLog,
    User,
    VatTypeEnum,
)
from app.schemas.common import BeanIn, CustomerIn, FollowUpIn, LoginIn, ProductIn, PurchaseIn, RoastIn, SalesIn
from app.services.inventory import add_ledger, consume_fifo, current_stock

router = APIRouter()


def audit(db: Session, user_id: int | None, action: str, details: str):
    db.add(AuditLog(user_id=user_id, action=action, details=details))


@router.post("/auth/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username, User.active.is_(True)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")
    return {"access_token": create_access_token(user.username), "token_type": "bearer"}


@router.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "can_adjust_inventory": current_user.can_adjust_inventory,
        "can_delete_sales": current_user.can_delete_sales,
        "can_view_cost": current_user.can_view_cost,
        "can_manage_users": current_user.can_manage_users,
    }


@router.get("/beans")
def list_beans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(BeanType).all()


@router.post("/beans")
def create_bean(payload: BeanIn, db: Session = Depends(get_db), user: User = Depends(require_permission("can_adjust_inventory"))):
    bean = BeanType(**payload.model_dump())
    db.add(bean)
    audit(db, user.id, "bean.create", payload.name)
    db.commit()
    return bean


@router.get("/products")
def list_products(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Product).filter(Product.archived.is_(False)).all()


@router.post("/products")
def create_product(payload: ProductIn, db: Session = Depends(get_db), user: User = Depends(require_permission("can_adjust_inventory"))):
    product = Product(name=payload.name, vat_type=VatTypeEnum(payload.vat_type))
    db.add(product)
    db.flush()
    for r in payload.recipes:
        db.add(ProductRecipe(product_id=product.id, bean_type_id=r.bean_type_id, ratio_percent=r.ratio_percent))
    audit(db, user.id, "product.create", product.name)
    db.commit()
    return product


@router.post("/purchases")
def create_purchase(payload: PurchaseIn, db: Session = Depends(get_db), user: User = Depends(require_permission("can_adjust_inventory"))):
    po = PurchaseOrder(**payload.model_dump())
    db.add(po)
    db.flush()
    add_ledger(
        db,
        segment=SegmentEnum.GREEN,
        bean_type_id=po.bean_type_id,
        product_id=None,
        vat_type=VatTypeEnum(po.vat_type),
        quantity_kg=po.quantity_kg,
        unit_cost=po.price_per_kg,
        reason=LedgerReason.PURCHASE,
        reference_type="purchase",
        reference_id=po.id,
    )
    audit(db, user.id, "purchase.create", f"PO#{po.id}")
    db.commit()
    return po


@router.post("/roasts")
def create_roast(payload: RoastIn, db: Session = Depends(get_db), user: User = Depends(require_permission("can_adjust_inventory"))):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm")

    consumed_rows = []
    total_cost = 0.0
    for recipe in product.recipes:
        need = payload.input_green_kg * recipe.ratio_percent / 100
        consumed, _ = consume_fifo(db, segment=SegmentEnum.GREEN, quantity_kg=need, bean_type_id=recipe.bean_type_id)
        for entry, qty in consumed:
            total_cost += qty * entry.unit_cost
            consumed_rows.append((entry, qty, recipe.bean_type_id, entry.vat_type))

    roast = RoastBatch(
        product_id=payload.product_id,
        input_green_kg=payload.input_green_kg,
        output_finished_kg=payload.output_finished_kg,
        yield_percent=(payload.output_finished_kg / payload.input_green_kg) * 100,
        cost_per_kg=total_cost / payload.output_finished_kg,
    )
    db.add(roast)
    db.flush()

    for source_entry, qty, bean_type_id, vat_type in consumed_rows:
        add_ledger(
            db,
            segment=SegmentEnum.GREEN,
            bean_type_id=bean_type_id,
            product_id=None,
            vat_type=vat_type,
            quantity_kg=-qty,
            unit_cost=source_entry.unit_cost,
            reason=LedgerReason.ROAST_CONSUME,
            reference_type="roast",
            reference_id=roast.id,
            rollback_of_id=source_entry.id,
        )

    vat_type = VatTypeEnum.VAT if product.vat_type == VatTypeEnum.VAT else VatTypeEnum.NOVAT
    add_ledger(
        db,
        segment=SegmentEnum.FINISHED,
        bean_type_id=None,
        product_id=payload.product_id,
        vat_type=vat_type,
        quantity_kg=payload.output_finished_kg,
        unit_cost=roast.cost_per_kg,
        reason=LedgerReason.ROAST_OUTPUT,
        reference_type="roast",
        reference_id=roast.id,
    )
    audit(db, user.id, "roast.create", f"Roast#{roast.id}")
    db.commit()
    return roast


@router.get("/inventory")
def inventory(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"current": current_stock(db), "ledger": db.query(StockLedger).order_by(StockLedger.id.desc()).limit(200).all()}


@router.post("/customers")
def create_customer(payload: CustomerIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == RoleEnum.SALES_CRM and payload.assigned_user_id not in (None, user.id):
        raise HTTPException(403, "Chỉ được gán khách của bạn")
    customer = Customer(**payload.model_dump())
    db.add(customer)
    audit(db, user.id, "customer.create", customer.name)
    db.commit()
    return customer


@router.get("/customers")
def list_customers(status: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Customer).filter(Customer.archived.is_(False))
    if status:
        q = q.filter(Customer.status == status)
    if user.role == RoleEnum.SALES_CRM:
        q = q.filter(Customer.assigned_user_id == user.id)
    return q.all()


@router.post("/crm/followups")
def create_followup(payload: FollowUpIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    f = FollowUp(**payload.model_dump())
    db.add(f)
    audit(db, user.id, "followup.create", f"Customer#{payload.customer_id}")
    db.commit()
    return f


@router.get("/crm/dashboard")
def crm_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = date.today()
    q = db.query(FollowUp)
    if user.role == RoleEnum.SALES_CRM:
        q = q.join(Customer, Customer.id == FollowUp.customer_id).filter(Customer.assigned_user_id == user.id)
    all_f = q.all()
    return {
        "today_tasks": [f for f in all_f if f.next_follow_up_date == today],
        "overdue": [f for f in all_f if f.next_follow_up_date and f.next_follow_up_date < today],
    }


@router.post("/sales")
def create_sale(payload: SalesIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    consumed, avg_cost = consume_fifo(db, segment=SegmentEnum.FINISHED, quantity_kg=payload.quantity_kg, product_id=payload.product_id)
    cogs = avg_cost * payload.quantity_kg
    revenue = payload.price_per_kg * payload.quantity_kg
    packaging_cost = payload.packaging_cost_per_kg * payload.quantity_kg
    vat_percent = 8 if product.vat_type == VatTypeEnum.VAT else 0
    vat_amount = revenue * vat_percent / 100
    gross_profit = revenue - cogs
    net_profit = gross_profit - packaging_cost - vat_amount

    so = SalesOrder(
        customer_id=payload.customer_id,
        product_id=payload.product_id,
        quantity_kg=payload.quantity_kg,
        price_per_kg=payload.price_per_kg,
        packaging_cost_per_kg=payload.packaging_cost_per_kg,
        vat_percent=vat_percent,
        gross_profit=gross_profit,
        net_profit=net_profit,
        cogs=cogs,
        sold_at=payload.sold_at or datetime.utcnow(),
    )
    db.add(so)
    db.flush()

    for entry, qty in consumed:
        add_ledger(
            db,
            segment=SegmentEnum.FINISHED,
            bean_type_id=None,
            product_id=payload.product_id,
            vat_type=entry.vat_type,
            quantity_kg=-qty,
            unit_cost=entry.unit_cost,
            reason=LedgerReason.SALE,
            reference_type="sale",
            reference_id=so.id,
            rollback_of_id=entry.id,
        )

    for p in payload.payments:
        db.add(Payment(sales_order_id=so.id, amount=p.amount, method=p.method))

    audit(db, user.id, "sale.create", f"Sale#{so.id}")
    db.commit()
    return so


@router.delete("/sales/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db), user: User = Depends(require_permission("can_delete_sales"))):
    sale = db.get(SalesOrder, sale_id)
    if not sale or sale.deleted:
        raise HTTPException(404, "Không tìm thấy đơn")
    sale.deleted = True
    sale_ledgers = db.query(StockLedger).filter(StockLedger.reference_type == "sale", StockLedger.reference_id == sale_id).all()
    for row in sale_ledgers:
        add_ledger(
            db,
            segment=row.segment,
            bean_type_id=row.bean_type_id,
            product_id=row.product_id,
            vat_type=row.vat_type,
            quantity_kg=-row.quantity_kg,
            unit_cost=row.unit_cost,
            reason=LedgerReason.ROLLBACK,
            reference_type="sale_rollback",
            reference_id=sale_id,
            rollback_of_id=row.id,
        )
    audit(db, user.id, "sale.delete", f"Sale#{sale_id}")
    db.commit()
    return {"ok": True}


@router.get("/reports/sales")
def sales_report(start: date, end: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(SalesOrder)
        .filter(and_(func.date(SalesOrder.sold_at) >= start, func.date(SalesOrder.sold_at) <= end, SalesOrder.deleted.is_(False)))
        .all()
    )
    revenue = sum(r.quantity_kg * r.price_per_kg for r in rows)
    packaging = sum(r.quantity_kg * r.packaging_cost_per_kg for r in rows)
    gross = sum(r.gross_profit for r in rows)
    top_products = (
        db.query(Product.name, func.sum(SalesOrder.quantity_kg).label("kg"))
        .join(Product, Product.id == SalesOrder.product_id)
        .filter(and_(func.date(SalesOrder.sold_at) >= start, func.date(SalesOrder.sold_at) <= end, SalesOrder.deleted.is_(False)))
        .group_by(Product.name)
        .order_by(func.sum(SalesOrder.quantity_kg).desc())
        .limit(5)
        .all()
    )
    return {
        "revenue": revenue,
        "packaging_cost": packaging,
        "gross_profit": gross,
        "top_products": [{"name": n, "kg": kg} for n, kg in top_products],
    }


@router.get("/reports/export/sales.csv")
def export_sales_csv(start: date, end: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(SalesOrder)
        .filter(and_(func.date(SalesOrder.sold_at) >= start, func.date(SalesOrder.sold_at) <= end, SalesOrder.deleted.is_(False)))
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "customer_id", "product_id", "kg", "price_per_kg", "gross_profit", "net_profit"])
    for row in rows:
        writer.writerow([row.id, row.customer_id, row.product_id, row.quantity_kg, row.price_per_kg, row.gross_profit, row.net_profit])
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv")


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = date.today()
    month_sales = db.query(SalesOrder).filter(func.strftime("%Y-%m", SalesOrder.sold_at) == today.strftime("%Y-%m"), SalesOrder.deleted.is_(False)).all()
    revenue = sum(s.quantity_kg * s.price_per_kg for s in month_sales)
    gross = sum(s.gross_profit for s in month_sales)
    packaging = sum(s.quantity_kg * s.packaging_cost_per_kg for s in month_sales)
    receivables = 0.0
    for s in month_sales:
        paid = db.query(func.sum(Payment.amount)).filter(Payment.sales_order_id == s.id).scalar() or 0
        receivables += max(0, s.quantity_kg * s.price_per_kg - paid)

    config = db.query(Settings).first()
    stock = current_stock(db)
    alerts = [
        x
        for x in stock
        if x["segment"] == "FINISHED" and x["quantity_kg"] < config.low_stock_threshold_kg
    ]
    return {
        "revenue": revenue,
        "gross_profit": gross,
        "packaging_cost": packaging,
        "receivables": receivables,
        "alerts": alerts,
    }


@router.get("/system/update/info")
def system_info(db: Session = Depends(get_db), user: User = Depends(require_permission("can_manage_users"))):
    s = db.query(Settings).first()
    return {"app_version": s.app_version, "schema_version": s.schema_version}


@router.post("/system/update/backup")
def backup_db(db: Session = Depends(get_db), user: User = Depends(require_permission("can_manage_users"))):
    db_path = Path("data/roastery.db")
    if not db_path.exists():
        raise HTTPException(404, "Database chưa tồn tại")
    backup_dir = Path("backups")
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / f"roastery-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.db"
    shutil.copy2(db_path, target)
    backups = sorted(backup_dir.glob("roastery-*.db"), reverse=True)
    for stale in backups[30:]:
        stale.unlink()
    audit(db, user.id, "system.backup", str(target.name))
    db.commit()
    return {"backup": target.name}


@router.post("/system/update/upload")
def upload_update(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(require_permission("can_manage_users"))):
    raw = file.file.read()
    checksum = hashlib.sha256(raw).hexdigest()
    zf = zipfile.ZipFile(io.BytesIO(raw))
    if "manifest.json" not in zf.namelist():
        raise HTTPException(400, "Thiếu manifest.json")
    manifest = json.loads(zf.read("manifest.json").decode())
    required = {"version", "min_schema", "checksum"}
    if not required.issubset(manifest.keys()):
        raise HTTPException(400, "Manifest không hợp lệ")
    if manifest["checksum"] != checksum:
        raise HTTPException(400, "Checksum không khớp")
    setting = db.query(Settings).first()
    before = setting.app_version
    setting.app_version = manifest["version"]
    db.add(UpdateLog(before_version=before, after_version=manifest["version"], manifest_checksum=checksum))
    audit(db, user.id, "system.update", manifest["version"])
    db.commit()
    return {"ok": True, "restart_cmd": "docker compose restart"}
