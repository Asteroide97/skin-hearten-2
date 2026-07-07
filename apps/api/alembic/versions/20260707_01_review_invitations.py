"""Add review invitations table.

Revision ID: 20260707_01
Revises: 20260706_01
Create Date: 2026-07-07 10:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260707_01"
down_revision = "20260706_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "review_invitations" not in existing_tables:
        op.create_table(
            "review_invitations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("token", sa.String(length=255), nullable=False),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
            sa.Column("customer_email", sa.String(length=255), nullable=True),
            sa.Column("customer_phone", sa.String(length=40), nullable=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=True),
            sa.Column(
                "status",
                sa.Enum(
                    "pending",
                    "submitted",
                    "expired",
                    name="reviewinvitationstatus",
                    native_enum=False,
                ),
                nullable=False,
                server_default="pending",
            ),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_review_invitations_token", "review_invitations", ["token"], unique=True)
        op.create_index("ix_review_invitations_order_id", "review_invitations", ["order_id"], unique=False)
        op.create_index("ix_review_invitations_product_id", "review_invitations", ["product_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "review_invitations" not in existing_tables:
        return

    indexes = {index["name"] for index in inspector.get_indexes("review_invitations")}
    for index_name in [
        "ix_review_invitations_product_id",
        "ix_review_invitations_order_id",
        "ix_review_invitations_token",
    ]:
        if index_name in indexes:
            op.drop_index(index_name, table_name="review_invitations")

    op.drop_table("review_invitations")
