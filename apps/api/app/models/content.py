from __future__ import annotations

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin


class BlogPost(TimestampMixin, Base):
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    cover_image_url: Mapped[str | None] = mapped_column(String(255))
    author: Mapped[str] = mapped_column(String(120))
    content: Mapped[str] = mapped_column(Text())
    meta_title: Mapped[str | None] = mapped_column(String(255))
    meta_description: Mapped[str | None] = mapped_column(String(255))


class Setting(TimestampMixin, Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True)
    value: Mapped[str] = mapped_column(Text())


class CommercialContent(TimestampMixin, Base):
    __tablename__ = "commercial_content"

    id: Mapped[int] = mapped_column(primary_key=True)
    store_key: Mapped[str] = mapped_column(String(80), unique=True, index=True, default="default")
    logo_text: Mapped[str] = mapped_column(String(120), default="Skin Hearten")
    logo_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    top_left_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    top_right_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_whatsapp_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_title: Mapped[str] = mapped_column(Text(), default="")
    hero_subtitle: Mapped[str | None] = mapped_column(Text(), nullable=True)
    hero_primary_button_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hero_primary_button_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    hero_primary_button_value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_secondary_button_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hero_secondary_button_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    hero_secondary_button_value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_tertiary_button_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    hero_tertiary_button_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    hero_tertiary_button_value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_video_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    hero_background_color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    hero_is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    hero_trust_signals_json: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    routine_guide_steps_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    science_points_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    home_testimonials_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    footer_intro_text: Mapped[str | None] = mapped_column(Text(), nullable=True)
    footer_contact_lines_json: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    footer_columns_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    footer_legal_links_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    footer_social_links_json: Mapped[list[dict] | None] = mapped_column(JSON, default=list)
    footer_notice_text: Mapped[str | None] = mapped_column(Text(), nullable=True)

    navigation_items: Mapped[list["CommercialNavigation"]] = relationship(
        back_populates="content",
        cascade="all, delete-orphan",
        order_by="CommercialNavigation.item_order",
    )
    quick_links: Mapped[list["CommercialQuickLink"]] = relationship(
        back_populates="content",
        cascade="all, delete-orphan",
        order_by="CommercialQuickLink.item_order",
    )
    sections: Mapped[list["CommercialSection"]] = relationship(
        back_populates="content",
        cascade="all, delete-orphan",
        order_by="CommercialSection.item_order",
    )
    banners: Mapped[list["CommercialBanner"]] = relationship(
        back_populates="content",
        cascade="all, delete-orphan",
        order_by="CommercialBanner.item_order",
    )


class CommercialNavigation(TimestampMixin, Base):
    __tablename__ = "commercial_navigation"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("commercial_content.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    item_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    item_type: Mapped[str] = mapped_column(String(40), default="url")
    value: Mapped[str] = mapped_column(String(512), default="/")

    content: Mapped["CommercialContent"] = relationship(back_populates="navigation_items")


class CommercialQuickLink(TimestampMixin, Base):
    __tablename__ = "commercial_quick_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("commercial_content.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str | None] = mapped_column(String(40), nullable=True)
    item_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    action_type: Mapped[str] = mapped_column(String(40), default="url")
    value: Mapped[str] = mapped_column(String(512), default="/")

    content: Mapped["CommercialContent"] = relationship(back_populates="quick_links")


class CommercialSection(TimestampMixin, Base):
    __tablename__ = "commercial_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("commercial_content.id"), index=True)
    section_key: Mapped[str] = mapped_column(String(80), index=True)
    item_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    eyebrow: Mapped[str | None] = mapped_column(String(120), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text(), nullable=True)
    cta_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cta_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    cta_value: Mapped[str | None] = mapped_column(String(512), nullable=True)

    content: Mapped["CommercialContent"] = relationship(back_populates="sections")


class CommercialBanner(TimestampMixin, Base):
    __tablename__ = "commercial_banners"

    id: Mapped[int] = mapped_column(primary_key=True)
    content_id: Mapped[int] = mapped_column(ForeignKey("commercial_content.id"), index=True)
    banner_key: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str | None] = mapped_column(Text(), nullable=True)
    value: Mapped[str | None] = mapped_column(String(512), nullable=True)
    item_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    content: Mapped["CommercialContent"] = relationship(back_populates="banners")
