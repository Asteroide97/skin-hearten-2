from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin


class Routine(TimestampMixin, Base):
    __tablename__ = "routines"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    color: Mapped[str | None] = mapped_column(String(64), nullable=True)
    goal_key: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    category_key: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)

    steps: Mapped[list["RoutineStep"]] = relationship(
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineStep.sort_order",
    )
    product_links: Mapped[list["RoutineProductLink"]] = relationship(
        back_populates="routine",
        cascade="all, delete-orphan",
        order_by="RoutineProductLink.priority",
    )


class RoutineStep(TimestampMixin, Base):
    __tablename__ = "routine_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.id"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    short_description: Mapped[str] = mapped_column(Text())
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    badge: Mapped[str | None] = mapped_column(String(80), nullable=True)

    routine: Mapped["Routine"] = relationship(back_populates="steps")


class RoutineProductLink(TimestampMixin, Base):
    __tablename__ = "routine_product_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[int] = mapped_column(Integer, default=0)

    routine: Mapped["Routine"] = relationship(back_populates="product_links")
