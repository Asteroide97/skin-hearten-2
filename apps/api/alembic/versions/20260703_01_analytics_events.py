"""Add analytics events table.

Revision ID: 20260703_01
Revises: 20260701_01
Create Date: 2026-07-03 17:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260703_01"
down_revision = "20260701_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "analytics_events" not in existing_tables:
        op.create_table(
            "analytics_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("event_name", sa.String(length=80), nullable=False),
            sa.Column("session_id", sa.String(length=120), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("customer_email", sa.String(length=255), nullable=True),
            sa.Column("product_id", sa.Integer(), nullable=True),
            sa.Column("order_id", sa.Integer(), nullable=True),
            sa.Column("routine_id", sa.Integer(), nullable=True),
            sa.Column("source", sa.String(length=120), nullable=True),
            sa.Column("path", sa.String(length=512), nullable=True),
            sa.Column("metadata_json", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )

    inspector = sa.inspect(bind)
    existing_indexes = {index["name"] for index in inspector.get_indexes("analytics_events")}

    if "ix_analytics_events_event_name" not in existing_indexes:
        op.create_index("ix_analytics_events_event_name", "analytics_events", ["event_name"], unique=False)
    if "ix_analytics_events_session_id" not in existing_indexes:
        op.create_index("ix_analytics_events_session_id", "analytics_events", ["session_id"], unique=False)
    if "ix_analytics_events_product_id" not in existing_indexes:
        op.create_index("ix_analytics_events_product_id", "analytics_events", ["product_id"], unique=False)
    if "ix_analytics_events_order_id" not in existing_indexes:
        op.create_index("ix_analytics_events_order_id", "analytics_events", ["order_id"], unique=False)
    if "ix_analytics_events_routine_id" not in existing_indexes:
        op.create_index("ix_analytics_events_routine_id", "analytics_events", ["routine_id"], unique=False)
    if "ix_analytics_events_source" not in existing_indexes:
        op.create_index("ix_analytics_events_source", "analytics_events", ["source"], unique=False)
    if "ix_analytics_events_created_at" not in existing_indexes:
        op.create_index("ix_analytics_events_created_at", "analytics_events", ["created_at"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "analytics_events" not in existing_tables:
        return

    existing_indexes = {index["name"] for index in inspector.get_indexes("analytics_events")}
    for index_name in [
        "ix_analytics_events_created_at",
        "ix_analytics_events_source",
        "ix_analytics_events_routine_id",
        "ix_analytics_events_order_id",
        "ix_analytics_events_product_id",
        "ix_analytics_events_session_id",
        "ix_analytics_events_event_name",
    ]:
        if index_name in existing_indexes:
            op.drop_index(index_name, table_name="analytics_events")

    op.drop_table("analytics_events")
