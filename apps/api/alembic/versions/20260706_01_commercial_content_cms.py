"""Add commercial content CMS tables.

Revision ID: 20260706_01
Revises: 20260703_01
Create Date: 2026-07-06 10:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260706_01"
down_revision = "20260703_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "commercial_content" not in existing_tables:
        op.create_table(
            "commercial_content",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("store_key", sa.String(length=80), nullable=False),
            sa.Column("logo_text", sa.String(length=120), nullable=False, server_default="Skin Hearten"),
            sa.Column("logo_image_url", sa.String(length=512), nullable=True),
            sa.Column("top_left_text", sa.String(length=255), nullable=True),
            sa.Column("top_right_text", sa.String(length=255), nullable=True),
            sa.Column("support_whatsapp_url", sa.String(length=512), nullable=True),
            sa.Column("hero_title", sa.Text(), nullable=False, server_default=""),
            sa.Column("hero_subtitle", sa.Text(), nullable=True),
            sa.Column("hero_primary_button_label", sa.String(length=120), nullable=True),
            sa.Column("hero_primary_button_type", sa.String(length=40), nullable=True),
            sa.Column("hero_primary_button_value", sa.String(length=512), nullable=True),
            sa.Column("hero_secondary_button_label", sa.String(length=120), nullable=True),
            sa.Column("hero_secondary_button_type", sa.String(length=40), nullable=True),
            sa.Column("hero_secondary_button_value", sa.String(length=512), nullable=True),
            sa.Column("hero_tertiary_button_label", sa.String(length=120), nullable=True),
            sa.Column("hero_tertiary_button_type", sa.String(length=40), nullable=True),
            sa.Column("hero_tertiary_button_value", sa.String(length=512), nullable=True),
            sa.Column("hero_image_url", sa.String(length=512), nullable=True),
            sa.Column("hero_video_url", sa.String(length=512), nullable=True),
            sa.Column("hero_background_color", sa.String(length=64), nullable=True),
            sa.Column("hero_is_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("hero_trust_signals_json", sa.JSON(), nullable=True),
            sa.Column("routine_guide_steps_json", sa.JSON(), nullable=True),
            sa.Column("science_points_json", sa.JSON(), nullable=True),
            sa.Column("home_testimonials_json", sa.JSON(), nullable=True),
            sa.Column("footer_intro_text", sa.Text(), nullable=True),
            sa.Column("footer_contact_lines_json", sa.JSON(), nullable=True),
            sa.Column("footer_columns_json", sa.JSON(), nullable=True),
            sa.Column("footer_legal_links_json", sa.JSON(), nullable=True),
            sa.Column("footer_social_links_json", sa.JSON(), nullable=True),
            sa.Column("footer_notice_text", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_commercial_content_store_key", "commercial_content", ["store_key"], unique=True)

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_navigation" not in existing_tables:
        op.create_table(
            "commercial_navigation",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("commercial_content.id"), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("item_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("item_type", sa.String(length=40), nullable=False, server_default="url"),
            sa.Column("value", sa.String(length=512), nullable=False, server_default="/"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_commercial_navigation_content_id", "commercial_navigation", ["content_id"], unique=False)

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_quick_links" not in existing_tables:
        op.create_table(
            "commercial_quick_links",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("commercial_content.id"), nullable=False),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("icon", sa.String(length=40), nullable=True),
            sa.Column("item_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("action_type", sa.String(length=40), nullable=False, server_default="url"),
            sa.Column("value", sa.String(length=512), nullable=False, server_default="/"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_commercial_quick_links_content_id", "commercial_quick_links", ["content_id"], unique=False)

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_sections" not in existing_tables:
        op.create_table(
            "commercial_sections",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("commercial_content.id"), nullable=False),
            sa.Column("section_key", sa.String(length=80), nullable=False),
            sa.Column("item_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("eyebrow", sa.String(length=120), nullable=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("cta_label", sa.String(length=120), nullable=True),
            sa.Column("cta_type", sa.String(length=40), nullable=True),
            sa.Column("cta_value", sa.String(length=512), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_commercial_sections_content_id", "commercial_sections", ["content_id"], unique=False)
        op.create_index("ix_commercial_sections_section_key", "commercial_sections", ["section_key"], unique=False)

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_banners" not in existing_tables:
        op.create_table(
            "commercial_banners",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("content_id", sa.Integer(), sa.ForeignKey("commercial_content.id"), nullable=False),
            sa.Column("banner_key", sa.String(length=80), nullable=False),
            sa.Column("title", sa.String(length=120), nullable=False),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("value", sa.String(length=512), nullable=True),
            sa.Column("item_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_commercial_banners_content_id", "commercial_banners", ["content_id"], unique=False)
        op.create_index("ix_commercial_banners_banner_key", "commercial_banners", ["banner_key"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "commercial_banners" in existing_tables:
        indexes = {index["name"] for index in inspector.get_indexes("commercial_banners")}
        for index_name in ["ix_commercial_banners_banner_key", "ix_commercial_banners_content_id"]:
            if index_name in indexes:
                op.drop_index(index_name, table_name="commercial_banners")
        op.drop_table("commercial_banners")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_sections" in existing_tables:
        indexes = {index["name"] for index in inspector.get_indexes("commercial_sections")}
        for index_name in ["ix_commercial_sections_section_key", "ix_commercial_sections_content_id"]:
            if index_name in indexes:
                op.drop_index(index_name, table_name="commercial_sections")
        op.drop_table("commercial_sections")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_quick_links" in existing_tables:
        indexes = {index["name"] for index in inspector.get_indexes("commercial_quick_links")}
        if "ix_commercial_quick_links_content_id" in indexes:
            op.drop_index("ix_commercial_quick_links_content_id", table_name="commercial_quick_links")
        op.drop_table("commercial_quick_links")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_navigation" in existing_tables:
        indexes = {index["name"] for index in inspector.get_indexes("commercial_navigation")}
        if "ix_commercial_navigation_content_id" in indexes:
            op.drop_index("ix_commercial_navigation_content_id", table_name="commercial_navigation")
        op.drop_table("commercial_navigation")

    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())
    if "commercial_content" in existing_tables:
        indexes = {index["name"] for index in inspector.get_indexes("commercial_content")}
        if "ix_commercial_content_store_key" in indexes:
            op.drop_index("ix_commercial_content_store_key", table_name="commercial_content")
        op.drop_table("commercial_content")
