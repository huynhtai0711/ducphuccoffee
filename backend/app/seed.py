from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.entities import BeanType, RoleEnum, Settings, User


DEFAULT_BEANS = ["Robusta S18", "Culi Robusta S18", "Robusta Honey S18", "Arabica S18"]


def seed_data(db: Session):
    if not db.query(Settings).first():
        db.add(Settings())
    if db.query(BeanType).count() == 0:
        for name in DEFAULT_BEANS:
            db.add(BeanType(name=name, enabled=True))
    if db.query(User).count() == 0:
        db.add(
            User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Quản trị viên",
                role=RoleEnum.ADMIN,
                can_adjust_inventory=True,
                can_delete_sales=True,
                can_view_cost=True,
                can_manage_users=True,
            )
        )
        db.add(
            User(
                username="warehouse",
                hashed_password=get_password_hash("warehouse123"),
                full_name="Kho",
                role=RoleEnum.WAREHOUSE,
                can_adjust_inventory=True,
                can_delete_sales=False,
                can_view_cost=True,
                can_manage_users=False,
            )
        )
        db.add(
            User(
                username="sales",
                hashed_password=get_password_hash("sales123"),
                full_name="Sales CRM",
                role=RoleEnum.SALES,
                can_adjust_inventory=False,
                can_delete_sales=False,
                can_view_cost=False,
                can_manage_users=False,
            )
        )
    db.commit()
