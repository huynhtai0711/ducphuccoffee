from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.entities import LedgerReason, SegmentEnum, Settings, StockLedger, VatTypeEnum


def add_ledger(
    db: Session,
    *,
    segment: SegmentEnum,
    bean_type_id: int | None,
    product_id: int | None,
    vat_type: VatTypeEnum,
    quantity_kg: float,
    unit_cost: float,
    reason: LedgerReason,
    reference_type: str,
    reference_id: int,
    rollback_of_id: int | None = None,
):
    row = StockLedger(
        segment=segment,
        bean_type_id=bean_type_id,
        product_id=product_id,
        vat_type=vat_type,
        quantity_kg=quantity_kg,
        unit_cost=unit_cost,
        reason=reason,
        reference_type=reference_type,
        reference_id=reference_id,
        rollback_of_id=rollback_of_id,
    )
    db.add(row)
    db.flush()
    return row


def current_stock(db: Session):
    rows = (
        db.query(
            StockLedger.segment,
            StockLedger.bean_type_id,
            StockLedger.product_id,
            StockLedger.vat_type,
            func.sum(StockLedger.quantity_kg).label("qty"),
        )
        .group_by(StockLedger.segment, StockLedger.bean_type_id, StockLedger.product_id, StockLedger.vat_type)
        .all()
    )
    return [
        {
            "segment": r.segment.value,
            "bean_type_id": r.bean_type_id,
            "product_id": r.product_id,
            "vat_type": r.vat_type.value,
            "quantity_kg": round(float(r.qty or 0), 3),
        }
        for r in rows
    ]


def get_available_batches(db: Session, *, segment: SegmentEnum, bean_type_id=None, product_id=None):
    q = db.query(StockLedger).filter(StockLedger.segment == segment)
    if bean_type_id:
        q = q.filter(StockLedger.bean_type_id == bean_type_id)
    if product_id:
        q = q.filter(StockLedger.product_id == product_id)
    entries = q.order_by(StockLedger.created_at, StockLedger.id).all()
    positive = [e for e in entries if e.quantity_kg > 0]

    available = []
    for p in positive:
        consumed = (
            db.query(func.sum(StockLedger.quantity_kg))
            .filter(StockLedger.rollback_of_id == p.id)
            .scalar()
            or 0
        )
        remain = p.quantity_kg + consumed
        if remain > 1e-6:
            available.append({"entry": p, "remaining": remain})
    return available


def consume_fifo(
    db: Session,
    *,
    segment: SegmentEnum,
    quantity_kg: float,
    bean_type_id: int | None = None,
    product_id: int | None = None,
):
    settings = db.query(Settings).first()
    batches = get_available_batches(db, segment=segment, bean_type_id=bean_type_id, product_id=product_id)
    remaining_need = quantity_kg
    consumed = []
    for item in batches:
        if remaining_need <= 0:
            break
        take = min(item["remaining"], remaining_need)
        consumed.append((item["entry"], take))
        remaining_need -= take

    if remaining_need > 1e-6 and not settings.allow_negative_inventory:
        raise HTTPException(status_code=400, detail="Không đủ tồn kho")

    total_cost = sum(qty * entry.unit_cost for entry, qty in consumed)
    avg_cost = (total_cost / quantity_kg) if quantity_kg else 0
    return consumed, avg_cost
