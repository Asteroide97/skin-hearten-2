"""Add routine builder tables.

Revision ID: 20260701_01
Revises: 20260626_01
Create Date: 2026-07-01 09:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260701_01"
down_revision = "20260626_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "routines" not in existing_tables:
        op.create_table(
            "routines",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("image_url", sa.String(length=512), nullable=True),
            sa.Column("color", sa.String(length=64), nullable=True),
            sa.Column("goal_key", sa.String(length=80), nullable=True),
            sa.Column("category_key", sa.String(length=120), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_routines_slug", "routines", ["slug"], unique=True)
        op.create_index("ix_routines_goal_key", "routines", ["goal_key"], unique=False)
        op.create_index("ix_routines_category_key", "routines", ["category_key"], unique=False)

    existing_tables = set(sa.inspect(bind).get_table_names())
    if "routine_steps" not in existing_tables:
        op.create_table(
            "routine_steps",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("routine_id", sa.Integer(), sa.ForeignKey("routines.id"), nullable=False),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("short_description", sa.Text(), nullable=False),
            sa.Column("image_url", sa.String(length=512), nullable=True),
            sa.Column("badge", sa.String(length=80), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_routine_steps_routine_id", "routine_steps", ["routine_id"], unique=False)
        op.create_index("ix_routine_steps_product_id", "routine_steps", ["product_id"], unique=False)

    existing_tables = set(sa.inspect(bind).get_table_names())
    if "routine_product_links" not in existing_tables:
        op.create_table(
            "routine_product_links",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("routine_id", sa.Integer(), sa.ForeignKey("routines.id"), nullable=False),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index(
            "ix_routine_product_links_routine_id",
            "routine_product_links",
            ["routine_id"],
            unique=False,
        )
        op.create_index(
            "ix_routine_product_links_product_id",
            "routine_product_links",
            ["product_id"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "routine_product_links" in existing_tables:
        existing_indexes = {index["name"] for index in inspector.get_indexes("routine_product_links")}
        if "ix_routine_product_links_product_id" in existing_indexes:
            op.drop_index("ix_routine_product_links_product_id", table_name="routine_product_links")
        if "ix_routine_product_links_routine_id" in existing_indexes:
            op.drop_index("ix_routine_product_links_routine_id", table_name="routine_product_links")
        op.drop_table("routine_product_links")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "routine_steps" in existing_tables:
        existing_indexes = {index["name"] for index in inspector.get_indexes("routine_steps")}
        if "ix_routine_steps_product_id" in existing_indexes:
            op.drop_index("ix_routine_steps_product_id", table_name="routine_steps")
        if "ix_routine_steps_routine_id" in existing_indexes:
            op.drop_index("ix_routine_steps_routine_id", table_name="routine_steps")
        op.drop_table("routine_steps")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "routines" in existing_tables:
        existing_indexes = {index["name"] for index in inspector.get_indexes("routines")}
        if "ix_routines_category_key" in existing_indexes:
            op.drop_index("ix_routines_category_key", table_name="routines")
        if "ix_routines_goal_key" in existing_indexes:
            op.drop_index("ix_routines_goal_key", table_name="routines")
        if "ix_routines_slug" in existing_indexes:
            op.drop_index("ix_routines_slug", table_name="routines")
        op.drop_table("routines")
