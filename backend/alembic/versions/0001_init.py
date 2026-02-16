"""init

Revision ID: 0001
Revises: 
Create Date: 2026-01-01
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.Integer, primary_key=True), sa.Column("username", sa.String(50), nullable=False, unique=True), sa.Column("hashed_password", sa.String(255), nullable=False), sa.Column("full_name", sa.String(120), nullable=False), sa.Column("role", sa.Enum("ADMIN", "WAREHOUSE", "SALES_CRM", name="roleenum"), nullable=False), sa.Column("can_adjust_inventory", sa.Boolean, default=False), sa.Column("can_delete_sales", sa.Boolean, default=False), sa.Column("can_view_cost", sa.Boolean, default=False), sa.Column("can_manage_users", sa.Boolean, default=False), sa.Column("active", sa.Boolean, default=True))
    op.create_table("bean_types", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String(100), unique=True, nullable=False), sa.Column("enabled", sa.Boolean, default=True))
    op.create_table("products", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String(120), unique=True, nullable=False), sa.Column("vat_type", sa.Enum("NOVAT", "VAT", name="vattypeenum"), nullable=False), sa.Column("archived", sa.Boolean, default=False))
    op.create_table("product_recipes", sa.Column("id", sa.Integer, primary_key=True), sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False), sa.Column("bean_type_id", sa.Integer, sa.ForeignKey("bean_types.id"), nullable=False), sa.Column("ratio_percent", sa.Float, nullable=False))
    op.create_table("purchase_orders", sa.Column("id", sa.Integer, primary_key=True), sa.Column("bean_type_id", sa.Integer, sa.ForeignKey("bean_types.id"), nullable=False), sa.Column("quantity_kg", sa.Float, nullable=False), sa.Column("price_per_kg", sa.Float, nullable=False), sa.Column("vat_type", sa.Enum("NOVAT", "VAT", name="vattypeenum"), nullable=False), sa.Column("purchased_at", sa.DateTime), sa.Column("deleted", sa.Boolean, default=False))
    op.create_table("roast_batches", sa.Column("id", sa.Integer, primary_key=True), sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False), sa.Column("input_green_kg", sa.Float, nullable=False), sa.Column("output_finished_kg", sa.Float, nullable=False), sa.Column("yield_percent", sa.Float, nullable=False), sa.Column("cost_per_kg", sa.Float, nullable=False), sa.Column("roasted_at", sa.DateTime), sa.Column("deleted", sa.Boolean, default=False))
    op.create_table("customers", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String(120), nullable=False), sa.Column("status", sa.String(20), default="active"), sa.Column("assigned_user_id", sa.Integer, sa.ForeignKey("users.id")), sa.Column("notes", sa.Text), sa.Column("archived", sa.Boolean, default=False))
    op.create_table("follow_ups", sa.Column("id", sa.Integer, primary_key=True), sa.Column("customer_id", sa.Integer, sa.ForeignKey("customers.id"), nullable=False), sa.Column("note", sa.Text, nullable=False), sa.Column("next_follow_up_date", sa.Date), sa.Column("created_at", sa.DateTime))
    op.create_table("sales_orders", sa.Column("id", sa.Integer, primary_key=True), sa.Column("customer_id", sa.Integer, sa.ForeignKey("customers.id"), nullable=False), sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id"), nullable=False), sa.Column("quantity_kg", sa.Float, nullable=False), sa.Column("price_per_kg", sa.Float, nullable=False), sa.Column("packaging_cost_per_kg", sa.Float, default=0), sa.Column("vat_percent", sa.Float, nullable=False), sa.Column("gross_profit", sa.Float, nullable=False), sa.Column("net_profit", sa.Float, nullable=False), sa.Column("cogs", sa.Float, nullable=False), sa.Column("sold_at", sa.DateTime), sa.Column("deleted", sa.Boolean, default=False))
    op.create_table("payments", sa.Column("id", sa.Integer, primary_key=True), sa.Column("sales_order_id", sa.Integer, sa.ForeignKey("sales_orders.id"), nullable=False), sa.Column("amount", sa.Float, nullable=False), sa.Column("paid_at", sa.DateTime), sa.Column("method", sa.String(30), default="cash"))
    op.create_table("stock_ledger", sa.Column("id", sa.Integer, primary_key=True), sa.Column("segment", sa.Enum("GREEN", "FINISHED", name="segmentenum"), nullable=False), sa.Column("bean_type_id", sa.Integer, sa.ForeignKey("bean_types.id")), sa.Column("product_id", sa.Integer, sa.ForeignKey("products.id")), sa.Column("vat_type", sa.Enum("NOVAT", "VAT", name="vattypeenum"), nullable=False), sa.Column("quantity_kg", sa.Float, nullable=False), sa.Column("unit_cost", sa.Float, default=0), sa.Column("reason", sa.Enum("PURCHASE", "ROAST_CONSUME", "ROAST_OUTPUT", "SALE", "ROLLBACK", "ADJUSTMENT", name="ledgerreason"), nullable=False), sa.Column("reference_type", sa.String(30), nullable=False), sa.Column("reference_id", sa.Integer, nullable=False), sa.Column("rollback_of_id", sa.Integer), sa.Column("created_at", sa.DateTime))
    op.create_table("settings", sa.Column("id", sa.Integer, primary_key=True), sa.Column("allow_negative_inventory", sa.Boolean, default=False), sa.Column("low_stock_threshold_kg", sa.Float, default=60), sa.Column("vat_default_percent", sa.Float, default=8), sa.Column("app_version", sa.String(20), default="1.0.0"), sa.Column("schema_version", sa.String(20), default="1"))
    op.create_table("audit_logs", sa.Column("id", sa.Integer, primary_key=True), sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id")), sa.Column("action", sa.String(100), nullable=False), sa.Column("details", sa.Text, nullable=False), sa.Column("created_at", sa.DateTime))
    op.create_table("update_logs", sa.Column("id", sa.Integer, primary_key=True), sa.Column("before_version", sa.String(20), nullable=False), sa.Column("after_version", sa.String(20), nullable=False), sa.Column("manifest_checksum", sa.String(120), nullable=False), sa.Column("created_at", sa.DateTime))


def downgrade() -> None:
    for t in ["update_logs", "audit_logs", "settings", "stock_ledger", "payments", "sales_orders", "follow_ups", "customers", "roast_batches", "purchase_orders", "product_recipes", "products", "bean_types", "users"]:
        op.drop_table(t)
