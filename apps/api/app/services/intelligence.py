from __future__ import annotations

from collections import Counter, defaultdict
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Brand,
    Category,
    Coupon,
    CouponRedemption,
    CRMContact,
    CRMEvent,
    CRMReminder,
    CRMTask,
    Customer,
    InventoryMovement,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductReview,
    Routine,
    SkinQuizLead,
)
from app.services.mock_store import (
    COUPON_REDEMPTIONS,
    COUPONS,
    CRM_CONTACTS,
    CRM_EVENTS,
    CRM_REMINDERS,
    CRM_TASKS,
    CUSTOMERS,
    INVENTORY_MOVEMENTS,
    ORDERS,
    PAYMENTS,
    PRODUCTS,
    PRODUCT_REVIEWS,
    ROUTINES,
    SKIN_QUIZ_LEADS,
)

_INTELLIGENCE_SUGGESTED_QUESTIONS = [
    "Por que bajaron las ventas?",
    "Que rutina vende mas?",
    "Que clientes debo contactar?",
    "Que producto deberia promocionar?",
]

_GOAL_LABELS = {
    "manchas": "manchas",
    "acne": "acne",
    "lineas_expresion": "lineas de expresion",
    "hidratacion": "hidratacion",
    "luminosidad": "luminosidad",
    "proteccion_solar": "proteccion solar",
}

_SKIN_TYPE_LABELS = {
    "seca": "seca",
    "mixta": "mixta",
    "grasa": "grasa",
    "sensible": "sensible",
    "no_segura": "no estoy segura",
}

_AGE_RANGE_LABELS = {
    "18_24": "18 a 24",
    "25_34": "25 a 34",
    "35_44": "35 a 44",
    "45_plus": "45+",
}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _to_float(value: Any) -> float:
    return round(float(value or 0), 2)


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _normalize_email(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower()
    return normalized or None


def _normalize_phone(value: str | None) -> str | None:
    if not value:
        return None
    normalized = "".join(character for character in value if character.isdigit())
    return normalized or None


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


def _split_values(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        items = [str(item).strip() for item in value if str(item).strip()]
        return items
    normalized = str(value).replace(";", ",")
    return [item.strip() for item in normalized.split(",") if item.strip()]


def _build_name(first_name: str | None, last_name: str | None, fallback: str | None = None) -> str:
    name = " ".join(part for part in [first_name or "", last_name or ""] if part).strip()
    if name:
        return name
    if fallback:
        return fallback
    return "Cliente"


def _goal_label(value: str | None) -> str | None:
    if not value:
        return None
    return _GOAL_LABELS.get(value, value.replace("_", " "))


def _skin_type_label(value: str | None) -> str | None:
    if not value:
        return None
    return _SKIN_TYPE_LABELS.get(value, value.replace("_", " "))


def _age_range_label(value: str | None) -> str | None:
    if not value:
        return None
    return _AGE_RANGE_LABELS.get(value, value.replace("_", " "))


def _score_band(score: int) -> str:
    if score >= 80:
        return "alto"
    if score >= 60:
        return "medio"
    return "bajo"


def _format_currency(value: float) -> str:
    return f"${value:,.0f} MXN"


def _format_percent(value: float) -> str:
    return f"{value:.0f}%"


def _format_percent_precise(value: float) -> str:
    return f"{value:.1f}%"


def _format_delta(current: float, previous: float) -> float | None:
    if previous == 0:
        return None if current == 0 else 100.0
    return round(((current - previous) / previous) * 100, 1)


def _counter_to_ranked_items(
    counter: Counter[str],
    *,
    limit: int = 5,
    total: int | None = None,
    helper_lookup: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    denominator = total if total and total > 0 else None
    items: list[dict[str, Any]] = []
    for label, count in counter.most_common(limit):
        items.append(
            {
                "label": label,
                "count": int(count),
                "share": round((count / denominator) * 100, 1) if denominator else None,
                "helper": helper_lookup.get(label) if helper_lookup else None,
            }
        )
    return items


def _safe_load(
    db: Session,
    loader: Any,
    fallback: Any,
) -> list[dict[str, Any]]:
    try:
        return loader()
    except SQLAlchemyError:
        db.rollback()
        return fallback()


def _load_products(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = (
            db.query(Product, Brand, Category)
            .outerjoin(Brand, Brand.id == Product.brand_id)
            .outerjoin(Category, Category.id == Product.category_id)
            .all()
        )
        return [
            {
                "id": int(product.id),
                "name": product.name,
                "slug": product.slug,
                "brand": brand.name if brand else "Sin marca",
                "category": category.name if category else "Sin categoria",
                "price": _to_float(product.price),
                "discount_price": _to_float(product.discount_price) if product.discount_price is not None else None,
                "cost": _to_float(product.cost) if product.cost is not None else None,
                "stock": int(product.stock or 0),
                "skin_types": _split_values(product.skin_type),
                "concerns": _split_values(product.concern),
                "is_active": bool(product.is_active),
                "created_at": _normalize_datetime(product.created_at),
            }
            for product, brand, category in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(product["id"]),
                "name": str(product.get("name") or "Producto"),
                "slug": str(product.get("slug") or f"producto-{product['id']}"),
                "brand": str(product.get("brand_name") or "Sin marca"),
                "category": str(product.get("category_name") or "Sin categoria"),
                "price": _to_float(product.get("price")),
                "discount_price": _to_float(product.get("discount_price")) if product.get("discount_price") is not None else None,
                "cost": _to_float(product.get("cost")) if product.get("cost") is not None else None,
                "stock": int(product.get("stock") or 0),
                "skin_types": _split_values(product.get("skin_type")),
                "concerns": _split_values(product.get("concern")),
                "is_active": bool(product.get("is_active", True)),
                "created_at": _normalize_datetime(product.get("created_at")),
            }
            for product in deepcopy(PRODUCTS)
        ]

    return _safe_load(db, loader, fallback)


def _load_customers(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(Customer).all()
        return [
            {
                "id": int(customer.id),
                "first_name": customer.first_name,
                "last_name": customer.last_name,
                "email": customer.email,
                "phone": customer.phone,
                "created_at": _normalize_datetime(customer.created_at),
                "updated_at": _normalize_datetime(customer.updated_at),
            }
            for customer in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(customer["id"]),
                "first_name": str(customer.get("first_name") or "Cliente"),
                "last_name": customer.get("last_name"),
                "email": customer.get("email"),
                "phone": customer.get("phone"),
                "created_at": _normalize_datetime(customer.get("created_at")),
                "updated_at": _normalize_datetime(customer.get("updated_at")),
            }
            for customer in deepcopy(CUSTOMERS)
        ]

    return _safe_load(db, loader, fallback)


def _load_orders(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(Order).all()
        return [
            {
                "id": int(order.id),
                "order_number": order.order_number,
                "customer_id": int(order.customer_id),
                "status": str(order.status),
                "subtotal": _to_float(order.subtotal),
                "discount_total": _to_float(order.discount_total),
                "shipping_total": _to_float(order.shipping_total),
                "grand_total": _to_float(order.grand_total),
                "coupon_code": order.coupon_code,
                "coupon_discount_amount": _to_float(order.coupon_discount_amount),
                "shipping_name": order.shipping_name,
                "shipping_address": order.shipping_address,
                "tracking_number": order.tracking_number,
                "shipping_carrier": order.shipping_carrier,
                "created_at": _normalize_datetime(order.created_at),
                "updated_at": _normalize_datetime(order.updated_at),
                "shipped_at": _normalize_datetime(order.shipped_at),
                "delivered_at": _normalize_datetime(order.delivered_at),
                "cancelled_at": _normalize_datetime(order.cancelled_at),
                "refunded_at": _normalize_datetime(order.refunded_at),
            }
            for order in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(order["id"]),
                "order_number": str(order.get("order_number") or f"SH-{order['id']}"),
                "customer_id": int(order.get("customer_id") or 0),
                "status": str(order.get("status") or "pending"),
                "subtotal": _to_float(order.get("subtotal")),
                "discount_total": _to_float(order.get("discount_total")),
                "shipping_total": _to_float(order.get("shipping_total")),
                "grand_total": _to_float(order.get("grand_total")),
                "coupon_code": order.get("coupon_code"),
                "coupon_discount_amount": _to_float(order.get("coupon_discount_amount")),
                "shipping_name": order.get("shipping_name"),
                "shipping_address": order.get("shipping_address"),
                "tracking_number": order.get("tracking_number"),
                "shipping_carrier": order.get("shipping_carrier"),
                "created_at": _normalize_datetime(order.get("created_at")),
                "updated_at": _normalize_datetime(order.get("updated_at")),
                "shipped_at": _normalize_datetime(order.get("shipped_at")),
                "delivered_at": _normalize_datetime(order.get("delivered_at")),
                "cancelled_at": _normalize_datetime(order.get("cancelled_at")),
                "refunded_at": _normalize_datetime(order.get("refunded_at")),
                "customer_email": order.get("customer_email"),
                "customer_phone": order.get("shipping_phone"),
            }
            for order in deepcopy(ORDERS)
        ]

    return _safe_load(db, loader, fallback)


def _load_order_items(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(OrderItem).all()
        return [
            {
                "order_id": int(item.order_id),
                "product_id": int(item.product_id),
                "product_name": item.product_name,
                "quantity": int(item.quantity or 0),
                "unit_price": _to_float(item.unit_price),
                "created_at": _normalize_datetime(item.created_at),
            }
            for item in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for order in deepcopy(ORDERS):
            order_created_at = _normalize_datetime(order.get("created_at"))
            for item in order.get("items", []):
                items.append(
                    {
                        "order_id": int(order["id"]),
                        "product_id": int(item.get("product_id") or 0),
                        "product_name": str(item.get("product_name") or "Producto"),
                        "quantity": int(item.get("quantity") or 0),
                        "unit_price": _to_float(item.get("unit_price")),
                        "created_at": order_created_at,
                    }
                )
        return items

    return _safe_load(db, loader, fallback)


def _load_payments(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(Payment).all()
        return [
            {
                "order_id": int(payment.order_id),
                "provider": str(payment.provider),
                "status": str(payment.status),
                "paid_at": _normalize_datetime(payment.paid_at),
                "created_at": _normalize_datetime(payment.created_at),
            }
            for payment in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "order_id": int(payment.get("order_id") or 0),
                "provider": str(payment.get("provider") or "mock"),
                "status": str(payment.get("status") or "pending"),
                "paid_at": _normalize_datetime(payment.get("paid_at")),
                "created_at": _normalize_datetime(payment.get("created_at")),
            }
            for payment in deepcopy(PAYMENTS)
        ]

    return _safe_load(db, loader, fallback)


def _load_crm_contacts(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(CRMContact).all()
        return [
            {
                "id": int(contact.id),
                "first_name": contact.first_name,
                "last_name": contact.last_name,
                "email": contact.email,
                "whatsapp": contact.whatsapp,
                "source": contact.source,
                "lifecycle_status": str(contact.lifecycle_status),
                "skin_type": contact.skin_type,
                "main_goal": contact.main_goal,
                "age_range": contact.age_range,
                "accepted_marketing": bool(contact.accepted_marketing),
                "first_seen_at": _normalize_datetime(contact.first_seen_at),
                "last_seen_at": _normalize_datetime(contact.last_seen_at),
                "created_at": _normalize_datetime(contact.created_at),
                "updated_at": _normalize_datetime(contact.updated_at),
            }
            for contact in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(contact["id"]),
                "first_name": str(contact.get("first_name") or "Contacto"),
                "last_name": contact.get("last_name"),
                "email": contact.get("email"),
                "whatsapp": contact.get("whatsapp"),
                "source": str(contact.get("source") or "crm"),
                "lifecycle_status": str(contact.get("lifecycle_status") or "lead"),
                "skin_type": contact.get("skin_type"),
                "main_goal": contact.get("main_goal"),
                "age_range": contact.get("age_range"),
                "accepted_marketing": bool(contact.get("accepted_marketing")),
                "first_seen_at": _normalize_datetime(contact.get("first_seen_at")),
                "last_seen_at": _normalize_datetime(contact.get("last_seen_at")),
                "created_at": _normalize_datetime(contact.get("created_at")),
                "updated_at": _normalize_datetime(contact.get("updated_at")),
            }
            for contact in deepcopy(CRM_CONTACTS)
        ]

    return _safe_load(db, loader, fallback)


def _load_crm_tasks(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(CRMTask).all()
        return [
            {
                "id": int(task.id),
                "contact_id": int(task.contact_id),
                "title": task.title,
                "due_at": _normalize_datetime(task.due_at),
                "status": str(task.status),
                "task_type": str(task.task_type),
                "created_at": _normalize_datetime(task.created_at),
            }
            for task in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(task["id"]),
                "contact_id": int(task.get("contact_id") or 0),
                "title": str(task.get("title") or "Tarea"),
                "due_at": _normalize_datetime(task.get("due_at")),
                "status": str(task.get("status") or "pending"),
                "task_type": str(task.get("task_type") or "manual"),
                "created_at": _normalize_datetime(task.get("created_at")),
            }
            for task in deepcopy(CRM_TASKS)
        ]

    return _safe_load(db, loader, fallback)


def _load_crm_reminders(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(CRMReminder).all()
        return [
            {
                "id": int(reminder.id),
                "contact_id": int(reminder.contact_id),
                "channel": str(reminder.channel),
                "reminder_type": str(reminder.reminder_type),
                "status": str(reminder.status),
                "scheduled_for": _normalize_datetime(reminder.scheduled_for),
                "created_at": _normalize_datetime(reminder.created_at),
            }
            for reminder in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(reminder["id"]),
                "contact_id": int(reminder.get("contact_id") or 0),
                "channel": str(reminder.get("channel") or "whatsapp"),
                "reminder_type": str(reminder.get("reminder_type") or "manual"),
                "status": str(reminder.get("status") or "pending"),
                "scheduled_for": _normalize_datetime(reminder.get("scheduled_for")),
                "created_at": _normalize_datetime(reminder.get("created_at")),
            }
            for reminder in deepcopy(CRM_REMINDERS)
        ]

    return _safe_load(db, loader, fallback)


def _load_crm_events(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(CRMEvent).all()
        return [
            {
                "id": int(event.id),
                "contact_id": int(event.contact_id) if event.contact_id is not None else None,
                "anonymous_id": event.anonymous_id,
                "event_type": event.event_type,
                "payload_json": event.payload_json or {},
                "source": event.source,
                "created_at": _normalize_datetime(event.created_at),
            }
            for event in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(event["id"]),
                "contact_id": int(event["contact_id"]) if event.get("contact_id") is not None else None,
                "anonymous_id": event.get("anonymous_id"),
                "event_type": str(event.get("event_type") or "unknown"),
                "payload_json": deepcopy(event.get("payload_json") or {}),
                "source": str(event.get("source") or "crm"),
                "created_at": _normalize_datetime(event.get("created_at")),
            }
            for event in deepcopy(CRM_EVENTS)
        ]

    return _safe_load(db, loader, fallback)


def _load_skin_quiz_leads(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(SkinQuizLead).all()
        return [
            {
                "id": int(lead.id),
                "name": lead.name,
                "email": lead.email,
                "whatsapp": lead.whatsapp,
                "accepted_marketing": bool(lead.accepted_marketing),
                "status": lead.status,
                "source": lead.source,
                "answers_json": lead.answers_json or {},
                "result_json": lead.result_json or {},
                "created_at": _normalize_datetime(lead.created_at),
            }
            for lead in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(lead["id"]),
                "name": str(lead.get("name") or "Lead"),
                "email": lead.get("email"),
                "whatsapp": lead.get("whatsapp"),
                "accepted_marketing": bool(lead.get("accepted_marketing")),
                "status": str(lead.get("status") or "new"),
                "source": str(lead.get("source") or "skin_quiz"),
                "answers_json": deepcopy(lead.get("answers_json") or {}),
                "result_json": deepcopy(lead.get("result_json") or {}),
                "created_at": _normalize_datetime(lead.get("created_at")),
            }
            for lead in deepcopy(SKIN_QUIZ_LEADS)
        ]

    return _safe_load(db, loader, fallback)


def _load_routines(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .all()
        )
        return [
            {
                "id": int(routine.id),
                "name": routine.name,
                "slug": routine.slug,
                "description": routine.description,
                "goal_key": routine.goal_key,
                "category_key": routine.category_key,
                "is_active": bool(routine.is_active),
                "steps": [
                    {
                        "id": int(step.id),
                        "product_id": int(step.product_id),
                        "sort_order": int(step.sort_order or 0),
                        "title": step.title,
                        "short_description": step.short_description,
                        "badge": step.badge,
                    }
                    for step in routine.steps
                ],
                "linked_products": [
                    {
                        "id": int(link.id),
                        "product_id": int(link.product_id),
                        "is_primary": bool(link.is_primary),
                        "priority": int(link.priority or 0),
                    }
                    for link in routine.product_links
                ],
            }
            for routine in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [deepcopy(routine) for routine in ROUTINES]

    return _safe_load(db, loader, fallback)


def _load_coupons(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(Coupon).all()
        return [
            {
                "id": int(coupon.id),
                "code": coupon.code,
                "discount_type": str(coupon.discount_type),
                "usage_count": int(coupon.usage_count or 0),
                "is_active": bool(coupon.is_active),
                "created_at": _normalize_datetime(coupon.created_at),
                "usage_limit": int(coupon.usage_limit) if coupon.usage_limit is not None else None,
            }
            for coupon in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "id": int(coupon["id"]),
                "code": str(coupon.get("code") or f"CUPON-{coupon['id']}"),
                "discount_type": str(coupon.get("discount_type") or "percentage"),
                "usage_count": int(coupon.get("usage_count") or 0),
                "is_active": bool(coupon.get("is_active", True)),
                "created_at": _normalize_datetime(coupon.get("created_at")),
                "usage_limit": int(coupon["usage_limit"]) if coupon.get("usage_limit") is not None else None,
            }
            for coupon in deepcopy(COUPONS)
        ]

    return _safe_load(db, loader, fallback)


def _load_coupon_redemptions(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(CouponRedemption).all()
        return [
            {
                "coupon_id": int(redemption.coupon_id),
                "order_id": int(redemption.order_id) if redemption.order_id is not None else None,
                "customer_email": redemption.customer_email,
                "customer_phone": redemption.customer_phone,
                "discount_amount": _to_float(redemption.discount_amount),
                "created_at": _normalize_datetime(redemption.created_at),
            }
            for redemption in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "coupon_id": int(redemption.get("coupon_id") or 0),
                "order_id": int(redemption["order_id"]) if redemption.get("order_id") is not None else None,
                "customer_email": redemption.get("customer_email"),
                "customer_phone": redemption.get("customer_phone"),
                "discount_amount": _to_float(redemption.get("discount_amount")),
                "created_at": _normalize_datetime(redemption.get("created_at")),
            }
            for redemption in deepcopy(COUPON_REDEMPTIONS)
        ]

    return _safe_load(db, loader, fallback)


def _load_inventory_movements(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(InventoryMovement).all()
        return [
            {
                "product_id": int(movement.product_id),
                "movement_type": str(movement.movement_type),
                "quantity": int(movement.quantity or 0),
                "reason": movement.reason,
                "created_at": _normalize_datetime(movement.created_at),
            }
            for movement in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "product_id": int(movement.get("product_id") or 0),
                "movement_type": str(movement.get("movement_type") or "adjustment"),
                "quantity": int(movement.get("quantity") or 0),
                "reason": movement.get("reason"),
                "created_at": _normalize_datetime(movement.get("created_at")),
            }
            for movement in deepcopy(INVENTORY_MOVEMENTS)
        ]

    return _safe_load(db, loader, fallback)


def _load_reviews(db: Session) -> list[dict[str, Any]]:
    def loader() -> list[dict[str, Any]]:
        rows = db.query(ProductReview).all()
        return [
            {
                "product_id": int(review.product_id),
                "rating": int(review.rating or 0),
                "status": str(review.status),
                "created_at": _normalize_datetime(review.created_at),
            }
            for review in rows
        ]

    def fallback() -> list[dict[str, Any]]:
        return [
            {
                "product_id": int(review.get("product_id") or 0),
                "rating": int(review.get("rating") or 0),
                "status": str(review.get("status") or "pending"),
                "created_at": _normalize_datetime(review.get("created_at")),
            }
            for review in deepcopy(PRODUCT_REVIEWS)
        ]

    return _safe_load(db, loader, fallback)


def _is_realized_order(order: dict[str, Any], payment: dict[str, Any] | None) -> bool:
    payment_status = str((payment or {}).get("status") or "pending")
    order_status = str(order.get("status") or "pending")
    if payment_status == "paid":
        return True
    return order_status in {"paid", "preparing", "shipped", "delivered"}


def _build_data_bundle(db: Session) -> dict[str, Any]:
    products = _load_products(db)
    customers = _load_customers(db)
    orders = _load_orders(db)
    order_items = _load_order_items(db)
    payments = _load_payments(db)
    crm_contacts = _load_crm_contacts(db)
    crm_tasks = _load_crm_tasks(db)
    crm_reminders = _load_crm_reminders(db)
    crm_events = _load_crm_events(db)
    skin_quiz_leads = _load_skin_quiz_leads(db)
    routines = _load_routines(db)
    coupons = _load_coupons(db)
    coupon_redemptions = _load_coupon_redemptions(db)
    inventory_movements = _load_inventory_movements(db)
    reviews = _load_reviews(db)
    return {
        "products": products,
        "customers": customers,
        "orders": orders,
        "order_items": order_items,
        "payments": payments,
        "crm_contacts": crm_contacts,
        "crm_tasks": crm_tasks,
        "crm_reminders": crm_reminders,
        "crm_events": crm_events,
        "skin_quiz_leads": skin_quiz_leads,
        "routines": routines,
        "coupons": coupons,
        "coupon_redemptions": coupon_redemptions,
        "inventory_movements": inventory_movements,
        "reviews": reviews,
    }


def _build_profiles(bundle: dict[str, Any], now: datetime) -> list[dict[str, Any]]:
    profiles: list[dict[str, Any]] = []
    by_email: dict[str, dict[str, Any]] = {}
    by_phone: dict[str, dict[str, Any]] = {}

    def get_or_create_profile(
        *,
        email: str | None,
        phone: str | None,
        fallback_name: str | None = None,
    ) -> dict[str, Any]:
        normalized_email = _normalize_email(email)
        normalized_phone = _normalize_phone(phone)
        profile: dict[str, Any] | None = None
        if normalized_email:
            profile = by_email.get(normalized_email)
        if profile is None and normalized_phone:
            profile = by_phone.get(normalized_phone)
        if profile is not None:
            return profile

        profile = {
            "contact_id": None,
            "customer_id": None,
            "name": fallback_name or "Cliente",
            "first_name": None,
            "last_name": None,
            "email": normalized_email or email,
            "whatsapp": phone,
            "lifecycle_status": None,
            "main_goal": None,
            "skin_type": None,
            "age_range": None,
            "accepted_marketing": False,
            "sources": set(),
            "orders_count": 0,
            "total_spent": 0.0,
            "average_ticket": 0.0,
            "last_order_at": None,
            "categories": set(),
            "product_ids": set(),
            "quiz_completed_at": None,
            "crm_open_tasks": 0,
            "crm_ready_reminders": 0,
            "crm_pending_reminders": 0,
        }
        profiles.append(profile)
        if normalized_email:
            by_email[normalized_email] = profile
        if normalized_phone:
            by_phone[normalized_phone] = profile
        return profile

    for customer in bundle["customers"]:
        profile = get_or_create_profile(
            email=customer.get("email"),
            phone=customer.get("phone"),
            fallback_name=_build_name(customer.get("first_name"), customer.get("last_name"), "Cliente"),
        )
        profile["customer_id"] = customer["id"]
        profile["name"] = _build_name(customer.get("first_name"), customer.get("last_name"), profile["name"])
        profile["first_name"] = customer.get("first_name") or profile["first_name"]
        profile["last_name"] = customer.get("last_name") or profile["last_name"]
        profile["email"] = profile["email"] or customer.get("email")
        profile["whatsapp"] = profile["whatsapp"] or customer.get("phone")
        profile["sources"].add("customer")

    for contact in bundle["crm_contacts"]:
        profile = get_or_create_profile(
            email=contact.get("email"),
            phone=contact.get("whatsapp"),
            fallback_name=_build_name(contact.get("first_name"), contact.get("last_name"), "Contacto"),
        )
        profile["contact_id"] = contact["id"]
        profile["name"] = _build_name(contact.get("first_name"), contact.get("last_name"), profile["name"])
        profile["first_name"] = contact.get("first_name") or profile["first_name"]
        profile["last_name"] = contact.get("last_name") or profile["last_name"]
        profile["email"] = profile["email"] or contact.get("email")
        profile["whatsapp"] = profile["whatsapp"] or contact.get("whatsapp")
        profile["lifecycle_status"] = contact.get("lifecycle_status") or profile["lifecycle_status"]
        profile["main_goal"] = contact.get("main_goal") or profile["main_goal"]
        profile["skin_type"] = contact.get("skin_type") or profile["skin_type"]
        profile["age_range"] = contact.get("age_range") or profile["age_range"]
        profile["accepted_marketing"] = bool(contact.get("accepted_marketing")) or profile["accepted_marketing"]
        profile["sources"].add(contact.get("source") or "crm")

    latest_lead_by_identity: dict[str, dict[str, Any]] = {}
    for lead in bundle["skin_quiz_leads"]:
        identity = _normalize_email(lead.get("email")) or _normalize_phone(lead.get("whatsapp")) or f"lead:{lead['id']}"
        existing = latest_lead_by_identity.get(identity)
        if existing is None or (lead.get("created_at") or datetime.min.replace(tzinfo=timezone.utc)) > (
            existing.get("created_at") or datetime.min.replace(tzinfo=timezone.utc)
        ):
            latest_lead_by_identity[identity] = lead

    for lead in latest_lead_by_identity.values():
        answers = lead.get("answers_json") or {}
        profile = get_or_create_profile(
            email=lead.get("email"),
            phone=lead.get("whatsapp"),
            fallback_name=lead.get("name"),
        )
        if lead.get("name"):
            profile["name"] = str(lead["name"])
            if not profile["first_name"]:
                profile["first_name"] = str(lead["name"]).split(" ")[0]
        profile["email"] = profile["email"] or lead.get("email")
        profile["whatsapp"] = profile["whatsapp"] or lead.get("whatsapp")
        profile["main_goal"] = profile["main_goal"] or answers.get("goal")
        profile["skin_type"] = profile["skin_type"] or answers.get("skinType")
        profile["age_range"] = profile["age_range"] or answers.get("ageRange")
        profile["accepted_marketing"] = bool(lead.get("accepted_marketing")) or profile["accepted_marketing"]
        profile["quiz_completed_at"] = lead.get("created_at") or profile["quiz_completed_at"]
        profile["sources"].add(lead.get("source") or "skin_quiz")

    product_by_id = {product["id"]: product for product in bundle["products"]}
    items_by_order_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for item in bundle["order_items"]:
        items_by_order_id[int(item["order_id"])].append(item)
    payment_by_order_id = {int(payment["order_id"]): payment for payment in bundle["payments"]}
    customer_by_id = {int(customer["id"]): customer for customer in bundle["customers"]}

    for order in bundle["orders"]:
        payment = payment_by_order_id.get(int(order["id"]))
        if not _is_realized_order(order, payment):
            continue

        customer = customer_by_id.get(int(order.get("customer_id") or 0))
        email = (customer or {}).get("email") or order.get("customer_email")
        phone = (customer or {}).get("phone") or order.get("customer_phone")
        fallback_name = (customer and _build_name(customer.get("first_name"), customer.get("last_name"))) or order.get("shipping_name") or "Cliente"
        profile = get_or_create_profile(email=email, phone=phone, fallback_name=fallback_name)
        profile["customer_id"] = profile["customer_id"] or int(order.get("customer_id") or 0) or None
        profile["name"] = fallback_name or profile["name"]
        profile["email"] = profile["email"] or email
        profile["whatsapp"] = profile["whatsapp"] or phone
        profile["orders_count"] += 1
        profile["total_spent"] = round(profile["total_spent"] + _to_float(order.get("grand_total")), 2)
        created_at = order.get("created_at")
        if created_at and (profile["last_order_at"] is None or created_at > profile["last_order_at"]):
            profile["last_order_at"] = created_at
        for item in items_by_order_id.get(int(order["id"]), []):
            profile["product_ids"].add(int(item.get("product_id") or 0))
            product = product_by_id.get(int(item.get("product_id") or 0))
            if product:
                profile["categories"].add(product["category"])
        profile["sources"].add("order")

    tasks_by_contact_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for task in bundle["crm_tasks"]:
        tasks_by_contact_id[int(task.get("contact_id") or 0)].append(task)

    reminders_by_contact_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for reminder in bundle["crm_reminders"]:
        reminders_by_contact_id[int(reminder.get("contact_id") or 0)].append(reminder)

    for profile in profiles:
        if profile["orders_count"] > 0:
            profile["average_ticket"] = round(profile["total_spent"] / profile["orders_count"], 2)
            if not profile["lifecycle_status"]:
                profile["lifecycle_status"] = "repeat_customer" if profile["orders_count"] > 1 else "customer"
        else:
            profile["average_ticket"] = 0.0
            profile["lifecycle_status"] = profile["lifecycle_status"] or "lead"

        contact_id = int(profile["contact_id"] or 0)
        if contact_id > 0:
            tasks = tasks_by_contact_id.get(contact_id, [])
            reminders = reminders_by_contact_id.get(contact_id, [])
            profile["crm_open_tasks"] = sum(1 for task in tasks if task.get("status") == "pending")
            profile["crm_ready_reminders"] = sum(1 for reminder in reminders if reminder.get("status") == "ready")
            profile["crm_pending_reminders"] = sum(
                1 for reminder in reminders if reminder.get("status") in {"pending", "ready"}
            )

        profile["days_since_last_order"] = (
            (now - profile["last_order_at"]).days if profile["last_order_at"] else None
        )

    return profiles


def _build_customer_scores(profiles: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    scored: list[dict[str, Any]] = []

    for profile in profiles:
        if int(profile["orders_count"]) <= 0:
            continue

        days = profile.get("days_since_last_order")
        recency_score = 0
        recency_reason = "Sin fecha de ultima compra."
        if days is not None:
            if days <= 30:
                recency_score = 38
                recency_reason = f"Compro hace {days} dias, en ventana fuerte de recompra."
            elif days <= 45:
                recency_score = 32
                recency_reason = f"Compro hace {days} dias y ya es buen momento para refill."
            elif days <= 60:
                recency_score = 26
                recency_reason = f"Compro hace {days} dias y su rutina puede estar por acabarse."
            elif days <= 90:
                recency_score = 18
                recency_reason = f"Compro hace {days} dias; necesita reactivacion suave."
            else:
                recency_score = 8
                recency_reason = f"Su ultima compra fue hace {days} dias."

        order_count = int(profile["orders_count"])
        frequency_score = 6 if order_count == 1 else 12 if order_count == 2 else 17 if order_count == 3 else 20
        avg_ticket = _to_float(profile["average_ticket"])
        if avg_ticket >= 1500:
            ticket_score = 15
        elif avg_ticket >= 1000:
            ticket_score = 12
        elif avg_ticket >= 700:
            ticket_score = 9
        elif avg_ticket >= 400:
            ticket_score = 6
        else:
            ticket_score = 3

        routine_score = min(15, len(profile["categories"]) * 4 + (3 if "Protector Solar" in profile["categories"] else 0))
        engagement_score = 0
        if profile.get("accepted_marketing"):
            engagement_score += 4
        if profile.get("main_goal") or profile.get("skin_type"):
            engagement_score += 2
        if profile.get("quiz_completed_at"):
            engagement_score += 2
        if int(profile.get("crm_open_tasks") or 0) > 0 or int(profile.get("crm_ready_reminders") or 0) > 0:
            engagement_score += 2

        score = min(100, recency_score + frequency_score + ticket_score + routine_score + engagement_score)
        reasons = [
            recency_reason,
            f"{order_count} compra(s) historica(s) con ticket promedio de {_format_currency(avg_ticket)}.",
        ]
        if profile["categories"]:
            reasons.append(
                f"Ya compro {len(profile['categories'])} categoria(s), lo que facilita proponer una rutina completa."
            )
        if profile.get("main_goal"):
            reasons.append(f"Su objetivo principal sigue siendo {_goal_label(profile.get('main_goal'))}.")

        if score >= 80:
            suggested_action = "Enviar seguimiento premium de recompra por WhatsApp hoy."
        elif score >= 60:
            suggested_action = "Activar recordatorio de refill con bundle sugerido."
        else:
            suggested_action = "Mantener en seguimiento y esperar mejor momento comercial."

        scored.append(
            {
                "contact_id": profile.get("contact_id"),
                "customer_id": profile.get("customer_id"),
                "name": profile["name"],
                "email": profile.get("email"),
                "whatsapp": profile.get("whatsapp"),
                "lifecycle_status": str(profile.get("lifecycle_status") or "customer"),
                "repurchase_score": score,
                "score_band": _score_band(score),
                "main_goal": profile.get("main_goal"),
                "skin_type": profile.get("skin_type"),
                "last_order_at": profile.get("last_order_at"),
                "order_count": order_count,
                "average_ticket": avg_ticket,
                "total_spent": _to_float(profile.get("total_spent")),
                "suggested_action": suggested_action,
                "reasons": reasons[:3],
            }
        )

    scored.sort(
        key=lambda item: (
            -int(item["repurchase_score"]),
            -(item["last_order_at"].timestamp() if item.get("last_order_at") else 0),
        )
    )
    high_probability_count = sum(1 for item in scored if int(item["repurchase_score"]) >= 70)
    return scored[:12], high_probability_count


def _build_product_scores(bundle: dict[str, Any], now: datetime) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    products = bundle["products"]
    orders = bundle["orders"]
    items_by_order_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for item in bundle["order_items"]:
        items_by_order_id[int(item["order_id"])].append(item)
    payment_by_order_id = {int(payment["order_id"]): payment for payment in bundle["payments"]}

    product_stats: dict[int, dict[str, Any]] = {
        int(product["id"]): {
            "units_sold": 0,
            "revenue": 0.0,
            "orders_count": 0,
            "units_30d": 0,
            "gross_profit": 0.0,
        }
        for product in products
    }

    for order in orders:
        payment = payment_by_order_id.get(int(order["id"]))
        if not _is_realized_order(order, payment):
            continue
        order_created_at = order.get("created_at") or now
        for item in items_by_order_id.get(int(order["id"]), []):
            product_id = int(item.get("product_id") or 0)
            if product_id not in product_stats:
                continue
            quantity = int(item.get("quantity") or 0)
            unit_price = _to_float(item.get("unit_price"))
            stats = product_stats[product_id]
            stats["units_sold"] += quantity
            stats["revenue"] = round(stats["revenue"] + quantity * unit_price, 2)
            stats["orders_count"] += 1
            if order_created_at >= now - timedelta(days=30):
                stats["units_30d"] += quantity

    review_stats: dict[int, dict[str, Any]] = defaultdict(lambda: {"count": 0, "sum": 0})
    for review in bundle["reviews"]:
        if str(review.get("status") or "") != "approved":
            continue
        product_id = int(review.get("product_id") or 0)
        review_stats[product_id]["count"] += 1
        review_stats[product_id]["sum"] += int(review.get("rating") or 0)

    realized_orders_count = 0
    for order in orders:
        payment = payment_by_order_id.get(int(order["id"]))
        if _is_realized_order(order, payment):
            realized_orders_count += 1

    max_units = max([stats["units_sold"] for stats in product_stats.values()] or [1])
    max_penetration = max(
        [
            (stats["orders_count"] / realized_orders_count) if realized_orders_count > 0 else 0
            for stats in product_stats.values()
        ]
        or [1]
    )

    scored_products: list[dict[str, Any]] = []
    critical_products: list[dict[str, Any]] = []

    for product in products:
        product_id = int(product["id"])
        stats = product_stats.get(product_id, {"units_sold": 0, "revenue": 0.0, "orders_count": 0, "units_30d": 0})
        review = review_stats.get(product_id, {"count": 0, "sum": 0})
        price = _to_float(product.get("discount_price") or product.get("price"))
        stock = int(product.get("stock") or 0)
        cost = product.get("cost")
        margin_source = "real" if cost is not None else "estimated"
        effective_cost = _to_float(cost) if cost is not None else round(price * 0.45, 2)
        margin_per_unit = max(0.0, round(price - effective_cost, 2))
        margin_percent = round((margin_per_unit / price) * 100, 1) if price > 0 else 0.0
        average_rating = round(review["sum"] / review["count"], 1) if review["count"] else 0.0
        velocity_30d = stats["units_30d"] / 30 if stats["units_30d"] > 0 else 0.0
        days_of_cover = round(stock / velocity_30d, 1) if velocity_30d > 0 else None

        rotation_score = round((stats["units_sold"] / max_units) * 100) if max_units > 0 else 0
        penetration = (stats["orders_count"] / realized_orders_count) if realized_orders_count > 0 else 0.0
        conversion_score = round((penetration / max_penetration) * 100) if max_penetration > 0 else 0
        review_score = min(100, round((average_rating / 5) * 70 + min(review["count"], 15) * 2))
        if stock <= 5 or (days_of_cover is not None and days_of_cover < 12):
            inventory_score = 25
            critical_products.append(
                {
                    "product_id": product_id,
                    "name": product["name"],
                    "stock": stock,
                    "units_30d": stats["units_30d"],
                }
            )
        elif stock >= 25 and stats["units_30d"] <= 2:
            inventory_score = 35
        elif days_of_cover is not None and days_of_cover > 120:
            inventory_score = 40
        else:
            inventory_score = 82

        margin_score = max(0, min(100, round((margin_percent / 70) * 100)))
        intelligence_score = round(
            rotation_score * 0.25
            + conversion_score * 0.2
            + review_score * 0.2
            + inventory_score * 0.15
            + margin_score * 0.2
        )

        if inventory_score <= 25:
            recommended_action = "Subir inventario antes de perder demanda."
        elif stats["units_sold"] >= 5 and review["count"] <= 2:
            recommended_action = "Solicitar resenas para reforzar confianza."
        elif stock >= 25 and stats["units_30d"] <= 2:
            recommended_action = "Crear promocion o bundle para mover inventario lento."
        elif margin_score <= 35 and conversion_score <= 35:
            recommended_action = "Revisar precio o propuesta de valor."
        else:
            recommended_action = "Mantener empuje comercial y monitorear."

        scored_products.append(
            {
                "product_id": product_id,
                "name": product["name"],
                "slug": product["slug"],
                "brand": product["brand"],
                "category": product["category"],
                "intelligence_score": intelligence_score,
                "score_band": _score_band(intelligence_score),
                "rotation_score": int(rotation_score),
                "conversion_score": int(conversion_score),
                "review_score": int(review_score),
                "inventory_score": int(inventory_score),
                "margin_score": int(margin_score),
                "units_sold": int(stats["units_sold"]),
                "revenue": _to_float(stats["revenue"]),
                "stock": stock,
                "average_rating": average_rating,
                "review_count": int(review["count"]),
                "margin_percent": margin_percent,
                "margin_source": margin_source,
                "recommended_action": recommended_action,
                "_gross_profit": round(stats["units_sold"] * margin_per_unit, 2),
            }
        )

    scored_products.sort(key=lambda item: (-int(item["intelligence_score"]), -float(item["revenue"])))
    critical_products.sort(key=lambda item: (item["stock"], -item["units_30d"]))
    return scored_products, critical_products


def _build_kpis(context: dict[str, Any]) -> list[dict[str, Any]]:
    sales = context["sales"]
    crm = context["crm"]
    skin_quiz = context["skin_quiz"]
    inventory = context["inventory"]

    return [
        {
            "id": "revenue_24h",
            "label": "Ventas cobradas 24h",
            "value": sales["revenue_24h"],
            "display_value": _format_currency(sales["revenue_24h"]),
            "helper": sales["revenue_delta_text"],
            "tone": "positive" if sales["revenue_delta"] and sales["revenue_delta"] > 0 else "neutral",
        },
        {
            "id": "orders_24h",
            "label": "Ordenes realizadas 24h",
            "value": float(sales["orders_24h"]),
            "display_value": str(sales["orders_24h"]),
            "helper": f"Ticket promedio {_format_currency(sales['average_ticket_30d'])}",
            "tone": "neutral",
        },
        {
            "id": "repurchase_candidates",
            "label": "Clientes con recompra alta",
            "value": float(context["high_repurchase_customers"]),
            "display_value": str(context["high_repurchase_customers"]),
            "helper": "Score de recompra >= 70",
            "tone": "positive" if context["high_repurchase_customers"] > 0 else "neutral",
        },
        {
            "id": "skin_quiz_hot_leads",
            "label": "Leads calientes Skin Quiz",
            "value": float(skin_quiz["fresh_leads"]),
            "display_value": str(skin_quiz["fresh_leads"]),
            "helper": "Con marketing aceptado y menos de 7 dias",
            "tone": "warning" if skin_quiz["fresh_leads"] > 0 else "neutral",
        },
        {
            "id": "crm_follow_up",
            "label": "Seguimientos pendientes",
            "value": float(crm["pending_follow_ups"]),
            "display_value": str(crm["pending_follow_ups"]),
            "helper": f"{crm['ready_reminders']} recordatorio(s) listos para hoy",
            "tone": "warning" if crm["pending_follow_ups"] > 0 else "neutral",
        },
        {
            "id": "critical_inventory",
            "label": "Productos con inventario critico",
            "value": float(inventory["critical_count"]),
            "display_value": str(inventory["critical_count"]),
            "helper": inventory["critical_helper"],
            "tone": "critical" if inventory["critical_count"] > 0 else "neutral",
        },
    ]


def _build_snapshots(context: dict[str, Any]) -> list[dict[str, Any]]:
    sales = context["sales"]
    customers = context["customers"]
    crm = context["crm"]
    skin_quiz = context["skin_quiz"]
    coupons = context["coupons"]
    inventory = context["inventory"]

    return [
        {
            "id": "sales",
            "title": "Ventas y pedidos",
            "headline": f"{sales['realized_orders_30d']} ordenes cobradas en 30 dias con ticket promedio de {_format_currency(sales['average_ticket_30d'])}.",
            "details": [
                sales["revenue_delta_text"],
                f"Top venta por ingresos: {sales['top_revenue_product_name']}.",
                f"Descuento aplicado en {_format_currency(sales['discount_30d'])} durante 30 dias.",
            ],
        },
        {
            "id": "customers",
            "title": "Clientes y recompra",
            "headline": f"{customers['repeat_customers']} clientes ya compraron mas de una vez.",
            "details": [
                f"{context['high_repurchase_customers']} clienta(s) tienen score alto de recompra.",
                f"Objetivo dominante en la base: {customers['top_goal']}.",
                f"Tipo de piel mas frecuente: {customers['top_skin_type']}.",
            ],
        },
        {
            "id": "crm",
            "title": "CRM y seguimiento",
            "headline": f"{crm['pending_follow_ups']} seguimientos comerciales siguen abiertos.",
            "details": [
                f"{crm['open_tasks']} tarea(s) pendientes y {crm['ready_reminders']} reminder(s) listos.",
                f"WhatsApp domina como canal sugerido en {crm['whatsapp_ready']} caso(s).",
                "El tablero puede priorizar recompra, post compra y reactivacion sin salir del admin.",
            ],
        },
        {
            "id": "skin_quiz",
            "title": "Skin Quiz",
            "headline": f"{skin_quiz['leads_this_week']} lead(s) entraron esta semana desde el quiz.",
            "details": [
                f"{skin_quiz['fresh_leads']} siguen recientes y con permiso de marketing.",
                f"Objetivo principal mas comun: {skin_quiz['top_goal']}.",
                f"Fuente dominante: {skin_quiz['top_source']}.",
            ],
        },
        {
            "id": "coupons",
            "title": "Cupones y promociones",
            "headline": f"{coupons['active_coupons']} cupon(es) activos y {coupons['redemptions_30d']} redencion(es) en 30 dias.",
            "details": [
                f"Cupon mas usado: {coupons['top_coupon']}.",
                f"Descuento concedido: {_format_currency(coupons['discount_amount_30d'])}.",
                "La capa de inteligencia puede sugerir bundles o promociones cuando detecta stock lento.",
            ],
        },
        {
            "id": "inventory",
            "title": "Inventario",
            "headline": f"{inventory['critical_count']} producto(s) estan en nivel critico.",
            "details": [
                inventory["critical_helper"],
                f"{inventory['slow_stock_count']} producto(s) muestran rotacion lenta con stock alto.",
                f"{inventory['recent_exit_movements']} salida(s) de inventario registradas en 30 dias.",
            ],
        },
    ]


def _build_recommendations(context: dict[str, Any]) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    high_repurchase = context["high_repurchase_customers"]
    top_customer = context["customer_scores"][0] if context["customer_scores"] else None
    critical_products = context["critical_products"]
    product_scores = context["product_scores"]
    skin_quiz = context["skin_quiz"]
    crm = context["crm"]
    coupons = context["coupons"]

    if high_repurchase > 0 and top_customer:
        recommendations.append(
            {
                "id": "repurchase_campaign",
                "title": "Activar campana de recompra",
                "description": f"{high_repurchase} clienta(s) ya estan en ventana alta de refill; {top_customer['name']} lidera la prioridad.",
                "priority": "high" if high_repurchase < 6 else "critical",
                "source": "clientes",
                "impact_label": "Recompra alta",
                "impact_value": str(high_repurchase),
                "suggested_action": "Contactar hoy por WhatsApp con sugerencia de rutina o bundle.",
            }
        )

    if critical_products:
        product = critical_products[0]
        recommendations.append(
            {
                "id": "critical_inventory",
                "title": "Subir inventario del catalogo critico",
                "description": f"{product['name']} quedo en {product['stock']} pieza(s) con {product['units_30d']} unidades vendidas en 30 dias.",
                "priority": "critical",
                "source": "inventario",
                "impact_label": "SKU criticos",
                "impact_value": str(len(critical_products)),
                "suggested_action": "Reponer inventario o frenar campanas de ese SKU hasta normalizar stock.",
            }
        )

    low_review_candidate = next(
        (
            product
            for product in product_scores
            if int(product["units_sold"]) >= 3 and int(product["review_count"]) <= 2
        ),
        None,
    )
    if low_review_candidate:
        recommendations.append(
            {
                "id": "request_reviews",
                "title": "Solicitar resenas para reforzar conversion",
                "description": f"{low_review_candidate['name']} ya genero ventas, pero todavia tiene pocas opiniones publicadas.",
                "priority": "medium",
                "source": "resenas",
                "impact_label": "Reviews",
                "impact_value": str(low_review_candidate["review_count"]),
                "suggested_action": "Disparar seguimiento post compra y pedir testimonio validado.",
            }
        )

    if skin_quiz["fresh_leads"] > 0:
        recommendations.append(
            {
                "id": "close_skin_quiz_leads",
                "title": "Cerrar leads del Skin Quiz",
                "description": f"{skin_quiz['fresh_leads']} lead(s) recientes dieron permiso de marketing y ya esperan orientacion.",
                "priority": "high",
                "source": "skin_quiz",
                "impact_label": "Leads recientes",
                "impact_value": str(skin_quiz["fresh_leads"]),
                "suggested_action": "Enviar seguimiento manual con rutina recomendada y productos clave.",
            }
        )

    if crm["pending_follow_ups"] > 0:
        recommendations.append(
            {
                "id": "clear_followups",
                "title": "Destrabar seguimiento comercial",
                "description": f"El CRM acumula {crm['pending_follow_ups']} pendiente(s) entre tareas y reminders.",
                "priority": "medium",
                "source": "crm",
                "impact_label": "Pendientes",
                "impact_value": str(crm["pending_follow_ups"]),
                "suggested_action": "Atender primero reminders listos y luego tareas vencidas.",
            }
        )

    slow_stock_products = [
        product
        for product in product_scores
        if int(product["stock"]) >= 25 and int(product["units_sold"]) <= 2
    ]
    if slow_stock_products:
        product = slow_stock_products[0]
        recommendations.append(
            {
                "id": "promo_slow_stock",
                "title": "Mover inventario lento con promocion",
                "description": f"{product['name']} tiene inventario alto y poca salida real.",
                "priority": "medium",
                "source": "cupones",
                "impact_label": "Stock lento",
                "impact_value": str(len(slow_stock_products)),
                "suggested_action": f"Crear bundle o incentivo controlado; {coupons['top_coupon']} puede servir como punto de partida.",
            }
        )

    priority_weight = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    recommendations.sort(key=lambda item: priority_weight[item["priority"]])
    return recommendations[:6]


def _build_executive_summary(context: dict[str, Any]) -> dict[str, Any]:
    sales = context["sales"]
    customers = context["customers"]
    inventory = context["inventory"]
    skin_quiz = context["skin_quiz"]
    crm = context["crm"]

    delta = sales["revenue_delta"]
    if delta is None:
        delta_phrase = "todavia no hay suficiente historial para comparar ventas contra el dia anterior"
    elif delta > 0:
        delta_phrase = f"las ventas cobradas crecieron {abs(delta):.0f}% vs. el dia anterior"
    elif delta < 0:
        delta_phrase = f"las ventas cobradas cayeron {abs(delta):.0f}% vs. el dia anterior"
    else:
        delta_phrase = "las ventas cobradas se mantuvieron planas vs. el dia anterior"

    top_margin_product = context["top_margin_product_name"]
    critical_count = inventory["critical_count"]
    summary = (
        f"En las ultimas 24 horas {delta_phrase}. "
        f"Hay {context['high_repurchase_customers']} clienta(s) con alta probabilidad de recompra, "
        f"{skin_quiz['fresh_leads']} lead(s) recientes del Skin Quiz y {crm['pending_follow_ups']} seguimiento(s) comerciales abiertos. "
        f"El producto mas rentable por margen bruto es {top_margin_product} y el inventario critico afecta a {critical_count} SKU(s)."
    )

    bullets = [
        sales["revenue_delta_text"],
        f"{customers['repeat_customers']} clienta(s) ya compraron mas de una vez y {context['high_repurchase_customers']} estan listas para refill.",
        f"{skin_quiz['fresh_leads']} lead(s) del Skin Quiz siguen calientes y con permiso de marketing.",
        inventory["critical_helper"],
    ]

    return {
        "headline": "Centro de Inteligencia Skin Hearten",
        "summary": summary,
        "bullets": bullets,
    }


def _build_context(bundle: dict[str, Any], now: datetime) -> dict[str, Any]:
    profiles = _build_profiles(bundle, now)
    customer_scores, high_repurchase_customers = _build_customer_scores(profiles)
    product_scores, critical_products = _build_product_scores(bundle, now)

    payments_by_order_id = {int(payment["order_id"]): payment for payment in bundle["payments"]}
    realized_orders = [
        order for order in bundle["orders"] if _is_realized_order(order, payments_by_order_id.get(int(order["id"])))
    ]
    realized_orders_30d = [order for order in realized_orders if (order.get("created_at") or now) >= now - timedelta(days=30)]
    revenue_24h = round(
        sum(
            _to_float(order.get("grand_total"))
            for order in realized_orders
            if (order.get("created_at") or now) >= now - timedelta(hours=24)
        ),
        2,
    )
    revenue_prev_24h = round(
        sum(
            _to_float(order.get("grand_total"))
            for order in realized_orders
            if now - timedelta(hours=48) <= (order.get("created_at") or now) < now - timedelta(hours=24)
        ),
        2,
    )
    orders_24h = sum(
        1 for order in realized_orders if (order.get("created_at") or now) >= now - timedelta(hours=24)
    )
    total_revenue_30d = round(sum(_to_float(order.get("grand_total")) for order in realized_orders_30d), 2)
    total_discount_30d = round(sum(_to_float(order.get("discount_total")) for order in realized_orders_30d), 2)
    average_ticket_30d = round(total_revenue_30d / len(realized_orders_30d), 2) if realized_orders_30d else 0.0
    revenue_delta = _format_delta(revenue_24h, revenue_prev_24h)
    revenue_delta_text = (
        "Sin cambio reciente suficiente para comparar ventas de 24 horas."
        if revenue_delta is None
        else f"Comparativo 24h vs 24h anterior: {revenue_delta:+.0f}%."
    )

    top_revenue_product = max(product_scores, key=lambda item: (float(item["revenue"]), int(item["units_sold"])), default=None)
    top_margin_product = max(product_scores, key=lambda item: float(item["_gross_profit"]), default=None)

    repeat_customers = sum(1 for profile in profiles if int(profile["orders_count"]) > 1)
    goal_counter = Counter(_goal_label(profile.get("main_goal")) or "sin definir" for profile in profiles if profile.get("main_goal"))
    skin_type_counter = Counter(_skin_type_label(profile.get("skin_type")) or "sin definir" for profile in profiles if profile.get("skin_type"))

    open_tasks = sum(1 for task in bundle["crm_tasks"] if task.get("status") == "pending")
    ready_reminders = sum(1 for reminder in bundle["crm_reminders"] if reminder.get("status") == "ready")
    whatsapp_ready = sum(
        1
        for reminder in bundle["crm_reminders"]
        if reminder.get("status") == "ready" and reminder.get("channel") == "whatsapp"
    )
    pending_follow_ups = open_tasks + sum(
        1 for reminder in bundle["crm_reminders"] if reminder.get("status") in {"pending", "ready"}
    )

    leads_this_week = sum(
        1
        for lead in bundle["skin_quiz_leads"]
        if (lead.get("created_at") or now) >= now - timedelta(days=7)
    )
    fresh_leads = sum(
        1
        for lead in bundle["skin_quiz_leads"]
        if bool(lead.get("accepted_marketing")) and (lead.get("created_at") or now) >= now - timedelta(days=7)
    )
    quiz_goal_counter = Counter(
        _goal_label((lead.get("answers_json") or {}).get("goal")) or "sin definir"
        for lead in bundle["skin_quiz_leads"]
    )
    quiz_source_counter = Counter(str(lead.get("source") or "skin_quiz") for lead in bundle["skin_quiz_leads"])

    coupon_by_id = {int(coupon["id"]): coupon for coupon in bundle["coupons"]}
    redemptions_30d = [
        redemption
        for redemption in bundle["coupon_redemptions"]
        if (redemption.get("created_at") or now) >= now - timedelta(days=30)
    ]
    coupon_counter = Counter(
        coupon_by_id.get(int(redemption.get("coupon_id") or 0), {}).get("code", "Sin cupon")
        for redemption in redemptions_30d
    )
    discount_amount_30d = round(sum(_to_float(redemption.get("discount_amount")) for redemption in redemptions_30d), 2)

    slow_stock_count = sum(
        1
        for product in product_scores
        if int(product["stock"]) >= 25 and int(product["units_sold"]) <= 2
    )
    recent_exit_movements = sum(
        1
        for movement in bundle["inventory_movements"]
        if movement.get("movement_type") == "exit" and (movement.get("created_at") or now) >= now - timedelta(days=30)
    )
    critical_helper = (
        "No hay SKU criticos en este momento."
        if not critical_products
        else f"El SKU mas comprometido es {critical_products[0]['name']} con {critical_products[0]['stock']} pieza(s)."
    )

    context = {
        "bundle": bundle,
        "profiles": profiles,
        "generated_at": now,
        "sales": {
            "revenue_24h": revenue_24h,
            "revenue_prev_24h": revenue_prev_24h,
            "revenue_delta": revenue_delta,
            "revenue_delta_text": revenue_delta_text,
            "orders_24h": orders_24h,
            "average_ticket_30d": average_ticket_30d,
            "realized_orders_30d": len(realized_orders_30d),
            "discount_30d": total_discount_30d,
            "top_revenue_product_name": top_revenue_product["name"] if top_revenue_product else "Sin suficientes ventas",
        },
        "customers": {
            "repeat_customers": repeat_customers,
            "top_goal": goal_counter.most_common(1)[0][0] if goal_counter else "sin definir",
            "top_skin_type": skin_type_counter.most_common(1)[0][0] if skin_type_counter else "sin definir",
        },
        "crm": {
            "open_tasks": open_tasks,
            "ready_reminders": ready_reminders,
            "whatsapp_ready": whatsapp_ready,
            "pending_follow_ups": pending_follow_ups,
        },
        "skin_quiz": {
            "leads_this_week": leads_this_week,
            "fresh_leads": fresh_leads,
            "top_goal": quiz_goal_counter.most_common(1)[0][0] if quiz_goal_counter else "sin definir",
            "top_source": quiz_source_counter.most_common(1)[0][0] if quiz_source_counter else "skin_quiz",
        },
        "coupons": {
            "active_coupons": sum(1 for coupon in bundle["coupons"] if bool(coupon.get("is_active"))),
            "redemptions_30d": len(redemptions_30d),
            "top_coupon": coupon_counter.most_common(1)[0][0] if coupon_counter else "Sin redenciones",
            "discount_amount_30d": discount_amount_30d,
        },
        "inventory": {
            "critical_count": len(critical_products),
            "critical_helper": critical_helper,
            "slow_stock_count": slow_stock_count,
            "recent_exit_movements": recent_exit_movements,
        },
        "high_repurchase_customers": high_repurchase_customers,
        "customer_scores": customer_scores,
        "product_scores": product_scores,
        "critical_products": critical_products,
        "top_margin_product_name": top_margin_product["name"] if top_margin_product else "Sin datos suficientes",
        "top_margin_product": top_margin_product,
        "top_revenue_product": top_revenue_product,
        "realized_orders": realized_orders,
        "realized_orders_30d": realized_orders_30d,
        "payments_by_order_id": payments_by_order_id,
    }
    return context


def _build_profile_identity_maps(
    profiles: list[dict[str, Any]],
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    by_email: dict[str, dict[str, Any]] = {}
    by_phone: dict[str, dict[str, Any]] = {}
    for profile in profiles:
        normalized_email = _normalize_email(profile.get("email"))
        normalized_phone = _normalize_phone(profile.get("whatsapp"))
        if normalized_email:
            by_email[normalized_email] = profile
        if normalized_phone:
            by_phone[normalized_phone] = profile
    return by_email, by_phone


def _find_profile_for_identity(
    *,
    email: str | None,
    phone: str | None,
    by_email: dict[str, dict[str, Any]],
    by_phone: dict[str, dict[str, Any]],
) -> dict[str, Any] | None:
    normalized_email = _normalize_email(email)
    normalized_phone = _normalize_phone(phone)
    if normalized_email and normalized_email in by_email:
        return by_email[normalized_email]
    if normalized_phone and normalized_phone in by_phone:
        return by_phone[normalized_phone]
    return None


def _build_period_block(
    *,
    id: str,
    label: str,
    current_orders: list[dict[str, Any]],
    previous_orders: list[dict[str, Any]],
    context: dict[str, Any],
    now: datetime,
) -> dict[str, Any]:
    current_revenue = round(sum(_to_float(order.get("grand_total")) for order in current_orders), 2)
    previous_revenue = round(sum(_to_float(order.get("grand_total")) for order in previous_orders), 2)
    current_ticket = round(current_revenue / len(current_orders), 2) if current_orders else 0.0
    previous_ticket = round(previous_revenue / len(previous_orders), 2) if previous_orders else 0.0
    revenue_delta = _format_delta(current_revenue, previous_revenue)
    ticket_delta = _format_delta(current_ticket, previous_ticket)

    high_repurchase = sum(
        1
        for customer in context["customer_scores"]
        if customer.get("last_order_at")
        and customer["last_order_at"] >= min((order.get("created_at") or now) for order in current_orders)
        and int(customer["repurchase_score"]) >= 70
    ) if current_orders else 0

    if not current_orders:
        headline = f"{label} no registra ventas cobradas todavia."
        tone = "warning"
    else:
        revenue_phrase = (
            "sin comparativo previo"
            if revenue_delta is None
            else f"ventas {'subieron' if revenue_delta >= 0 else 'cayeron'} {abs(revenue_delta):.0f}%"
        )
        ticket_phrase = (
            "ticket sin comparativo"
            if ticket_delta is None
            else f"ticket {'subio' if ticket_delta >= 0 else 'cayo'} {abs(ticket_delta):.0f}%"
        )
        headline = f"{label}: {revenue_phrase} y el ticket promedio {ticket_phrase}."
        tone = "positive" if revenue_delta and revenue_delta > 0 else "neutral"

    details = [
        f"{len(current_orders)} orden(es) cobradas por {_format_currency(current_revenue)}.",
        f"Ticket promedio de {_format_currency(current_ticket)}.",
        (
            "No hay productos con stock critico."
            if context["inventory"]["critical_count"] == 0
            else f"{context['inventory']['critical_count']} SKU(s) siguen en inventario critico."
        ),
    ]
    if high_repurchase > 0:
        details.append(f"{high_repurchase} clienta(s) de este periodo ya quedaron listas para recompra.")

    return {
        "id": id,
        "label": label,
        "headline": headline,
        "details": details[:4],
        "tone": tone,
    }


def _build_executive_periods(context: dict[str, Any], now: datetime) -> list[dict[str, Any]]:
    realized_orders = context["realized_orders"]
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = start_today - timedelta(days=start_today.weekday())
    start_month = start_today.replace(day=1)

    def orders_between(start: datetime, end: datetime) -> list[dict[str, Any]]:
        return [order for order in realized_orders if start <= (order.get("created_at") or now) < end]

    return [
        _build_period_block(
            id="today",
            label="Hoy",
            current_orders=orders_between(start_today, now + timedelta(seconds=1)),
            previous_orders=orders_between(start_today - timedelta(days=1), start_today),
            context=context,
            now=now,
        ),
        _build_period_block(
            id="week",
            label="Esta semana",
            current_orders=orders_between(start_week, now + timedelta(seconds=1)),
            previous_orders=orders_between(start_week - timedelta(days=7), start_week),
            context=context,
            now=now,
        ),
        _build_period_block(
            id="month",
            label="Este mes",
            current_orders=orders_between(start_month, now + timedelta(seconds=1)),
            previous_orders=orders_between((start_month - timedelta(days=1)).replace(day=1), start_month),
            context=context,
            now=now,
        ),
    ]


def _build_routine_maps(bundle: dict[str, Any]) -> tuple[dict[int, dict[str, Any]], dict[int, set[int]]]:
    active_routines = {
        int(routine["id"]): routine
        for routine in bundle["routines"]
        if bool(routine.get("is_active", True))
    }
    routine_product_ids: dict[int, set[int]] = {}
    for routine_id, routine in active_routines.items():
        product_ids = {
            int(step.get("product_id") or 0)
            for step in routine.get("steps", [])
            if int(step.get("product_id") or 0) > 0
        }
        product_ids.update(
            int(link.get("product_id") or 0)
            for link in routine.get("linked_products", [])
            if int(link.get("product_id") or 0) > 0
        )
        routine_product_ids[routine_id] = product_ids
    return active_routines, routine_product_ids


def _match_routine_name_for_lead(
    lead: dict[str, Any],
    *,
    routines: dict[int, dict[str, Any]],
    routine_product_ids: dict[int, set[int]],
) -> str | None:
    answers = lead.get("answers_json") or {}
    result = lead.get("result_json") or {}
    lead_goal = str(answers.get("goal") or "").strip()
    recommended_ids = {int(product_id) for product_id in result.get("recommendedProductIds", []) if str(product_id).isdigit()}
    best_name: str | None = None
    best_score = 0

    for routine_id, routine in routines.items():
        score = 0
        if lead_goal and str(routine.get("goal_key") or "") == lead_goal:
            score += 4
        overlap = len(recommended_ids & routine_product_ids.get(routine_id, set()))
        score += overlap
        if score > best_score:
            best_score = score
            best_name = str(routine.get("name") or "")

    return best_name if best_score > 0 and best_name else None


def _match_routine_for_order(
    product_ids: set[int],
    *,
    routines: dict[int, dict[str, Any]],
    routine_product_ids: dict[int, set[int]],
) -> tuple[dict[str, Any] | None, int]:
    best_routine: dict[str, Any] | None = None
    best_overlap = 0
    for routine_id, routine in routines.items():
        overlap = len(product_ids & routine_product_ids.get(routine_id, set()))
        if overlap > best_overlap:
            best_overlap = overlap
            best_routine = routine
    return best_routine, best_overlap


def _build_skin_quiz_analysis(context: dict[str, Any], now: datetime) -> dict[str, Any]:
    bundle = context["bundle"]
    leads = bundle["skin_quiz_leads"]
    events = [event for event in bundle["crm_events"] if str(event.get("event_type")) == "skin_quiz_completed"]
    profiles = context["profiles"]
    by_email, by_phone = _build_profile_identity_maps(profiles)
    product_by_id = {int(product["id"]): product for product in bundle["products"]}
    routines, routine_product_ids = _build_routine_maps(bundle)

    started_count = None
    completed_count = len(events) if events else len(leads)
    lead_count = len(leads)
    completion_rate = round((completed_count / started_count) * 100, 1) if started_count else None

    skin_type_counter: Counter[str] = Counter()
    goal_counter: Counter[str] = Counter()
    age_counter: Counter[str] = Counter()
    routine_counter: Counter[str] = Counter()
    recommended_counter: Counter[str] = Counter()
    purchased_counter: Counter[str] = Counter()
    recommended_shares: Counter[str] = Counter()
    purchased_shares: Counter[str] = Counter()

    for lead in leads:
        answers = lead.get("answers_json") or {}
        result = lead.get("result_json") or {}
        skin_type_counter[_skin_type_label(answers.get("skinType")) or "sin definir"] += 1
        goal_counter[_goal_label(answers.get("goal")) or "sin definir"] += 1
        age_counter[_age_range_label(answers.get("ageRange")) or "sin definir"] += 1

        routine_name = _match_routine_name_for_lead(
            lead,
            routines=routines,
            routine_product_ids=routine_product_ids,
        )
        if routine_name:
            routine_counter[routine_name] += 1

        recommended_ids = {
            int(product_id)
            for product_id in result.get("recommendedProductIds", [])
            if str(product_id).isdigit()
        }
        for product_id in recommended_ids:
            product = product_by_id.get(product_id)
            if product:
                recommended_counter[str(product["name"])] += 1

        profile = _find_profile_for_identity(
            email=lead.get("email"),
            phone=lead.get("whatsapp"),
            by_email=by_email,
            by_phone=by_phone,
        )
        if not profile:
            continue

        purchased_after_lead = set()
        for product_id in profile.get("product_ids", set()):
            if int(product_id) in recommended_ids:
                product = product_by_id.get(int(product_id))
                if product:
                    purchased_after_lead.add(str(product["name"]))
        for product_name in purchased_after_lead:
            purchased_counter[product_name] += 1

    top_recommended_product = recommended_counter.most_common(1)[0] if recommended_counter else None
    top_purchased_product = purchased_counter.most_common(1)[0] if purchased_counter else None
    recommended_share = (
        round((top_recommended_product[1] / lead_count) * 100, 1)
        if top_recommended_product and lead_count > 0
        else None
    )
    purchased_share = (
        round((top_purchased_product[1] / lead_count) * 100, 1)
        if top_purchased_product and lead_count > 0
        else None
    )
    share_gap = (
        round(recommended_share - purchased_share, 1)
        if recommended_share is not None and purchased_share is not None
        else None
    )

    metrics = [
        {
            "id": "quiz_started",
            "label": "Iniciaron",
            "value": float(started_count) if started_count is not None else None,
            "displayValue": str(started_count) if started_count is not None else "Sin telemetria",
            "helper": "La tienda todavia no persiste aperturas ni arranques del quiz.",
            "isEstimated": True,
            "tone": "warning",
        },
        {
            "id": "quiz_completed",
            "label": "Terminaron",
            "value": float(completed_count),
            "displayValue": str(completed_count),
            "helper": "Quizzes completados que quedaron persistidos en backend.",
            "isEstimated": not bool(events),
            "tone": "neutral",
        },
        {
            "id": "quiz_leads",
            "label": "Dejaron lead",
            "value": float(lead_count),
            "displayValue": str(lead_count),
            "helper": "Leads capturados y sincronizados con FastAPI.",
            "isEstimated": False,
            "tone": "positive" if lead_count > 0 else "neutral",
        },
        {
            "id": "quiz_conversion",
            "label": "Conversion",
            "value": completion_rate,
            "displayValue": _format_percent_precise(completion_rate) if completion_rate is not None else "Sin base",
            "helper": "Se activara cuando exista telemetria persistida de inicios.",
            "isEstimated": True,
            "tone": "neutral",
        },
    ]

    answers = [
        {
            "id": "quiz_skin_type",
            "question": "Que tipo de piel domina?",
            "answer": skin_type_counter.most_common(1)[0][0] if skin_type_counter else "Sin dato suficiente",
            "detail": (
                f"{skin_type_counter.most_common(1)[0][1]} respuesta(s) registradas."
                if skin_type_counter
                else None
            ),
            "tone": "neutral",
        },
        {
            "id": "quiz_goal",
            "question": "Que problema domina?",
            "answer": goal_counter.most_common(1)[0][0] if goal_counter else "Sin dato suficiente",
            "detail": (
                f"{goal_counter.most_common(1)[0][1]} quiz(es) llegan con ese objetivo."
                if goal_counter
                else None
            ),
            "tone": "neutral",
        },
        {
            "id": "quiz_age",
            "question": "Que rango de edad destaca?",
            "answer": age_counter.most_common(1)[0][0] if age_counter else "Sin dato suficiente",
            "detail": (
                f"{age_counter.most_common(1)[0][1]} respuesta(s) en ese rango."
                if age_counter
                else None
            ),
            "tone": "neutral",
        },
        {
            "id": "quiz_routine",
            "question": "Que rutina termina recomendandose mas?",
            "answer": routine_counter.most_common(1)[0][0] if routine_counter else "Sin rutina dominante todavia",
            "detail": (
                f"{routine_counter.most_common(1)[0][1]} recomendacion(es) con match fuerte."
                if routine_counter
                else "Se infiere por objetivo del quiz y productos sugeridos."
            ),
            "tone": "positive" if routine_counter else "warning",
        },
        {
            "id": "quiz_gap",
            "question": "Donde esta la mayor diferencia entre recomendacion y compra?",
            "answer": (
                f"{top_recommended_product[0]} aparece en {_format_percent_precise(recommended_share)} de las recomendaciones y {_format_percent_precise(purchased_share)} de las compras relacionadas."
                if top_recommended_product and top_purchased_product and recommended_share is not None and purchased_share is not None
                else "Todavia no hay suficientes pedidos ligados a quizzes para medir la brecha real."
            ),
            "detail": (
                f"Brecha de {abs(share_gap):.1f} puntos porcentuales."
                if share_gap is not None
                else "La comparativa crecera conforme entren mas leads con compra."
            ),
            "tone": "warning" if share_gap and share_gap > 10 else "neutral",
        },
    ]

    return {
        "metrics": metrics,
        "answers": answers,
        "recommended_products": _counter_to_ranked_items(recommended_counter, total=lead_count),
        "purchased_products": _counter_to_ranked_items(purchased_counter, total=lead_count),
        "measurement_note": "Sin telemetria persistida de aperturas e inicios, esta lectura se basa en quizzes completados y leads sincronizados.",
    }


def _build_routine_builder_analysis(context: dict[str, Any]) -> dict[str, Any]:
    bundle = context["bundle"]
    routines, routine_product_ids = _build_routine_maps(bundle)
    realized_orders = context["realized_orders"]
    items_by_order_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for item in bundle["order_items"]:
        items_by_order_id[int(item["order_id"])].append(item)

    full_routine_orders = 0
    single_product_orders = 0
    full_routine_value = 0.0
    single_product_value = 0.0
    routine_counter: Counter[str] = Counter()

    for order in realized_orders:
        order_items = items_by_order_id.get(int(order["id"]), [])
        product_ids = {int(item.get("product_id") or 0) for item in order_items if int(item.get("product_id") or 0) > 0}
        if not product_ids:
            continue
        matched_routine, overlap = _match_routine_for_order(
            product_ids,
            routines=routines,
            routine_product_ids=routine_product_ids,
        )
        if not matched_routine or overlap <= 0:
            continue

        order_total = _to_float(order.get("grand_total"))
        threshold = min(3, len(routine_product_ids.get(int(matched_routine["id"]), set())) or 1)
        if overlap >= threshold:
            full_routine_orders += 1
            full_routine_value = round(full_routine_value + order_total, 2)
            routine_counter[str(matched_routine.get("name") or "Rutina")] += 1
        elif len(product_ids) == 1 or overlap == 1:
            single_product_orders += 1
            single_product_value = round(single_product_value + order_total, 2)

    average_full_routine_value = round(full_routine_value / full_routine_orders, 2) if full_routine_orders else 0.0
    average_single_product_value = round(single_product_value / single_product_orders, 2) if single_product_orders else 0.0
    ticket_lift = (
        round(((average_full_routine_value - average_single_product_value) / average_single_product_value) * 100, 1)
        if average_full_routine_value > 0 and average_single_product_value > 0
        else None
    )

    metrics = [
        {
            "id": "routine_modal_opened",
            "label": "Modal abierto",
            "value": None,
            "displayValue": "Sin telemetria",
            "helper": "La apertura del modal todavia no se guarda de forma persistente.",
            "isEstimated": True,
            "tone": "warning",
        },
        {
            "id": "routine_full_orders",
            "label": "Rutina completa",
            "value": float(full_routine_orders),
            "displayValue": str(full_routine_orders),
            "helper": "Pedidos con 3 o mas pasos de una misma rutina.",
            "isEstimated": True,
            "tone": "positive" if full_routine_orders > 0 else "neutral",
        },
        {
            "id": "routine_single_orders",
            "label": "Solo un producto",
            "value": float(single_product_orders),
            "displayValue": str(single_product_orders),
            "helper": "Pedidos donde solo entro el producto principal de una rutina.",
            "isEstimated": True,
            "tone": "neutral",
        },
        {
            "id": "routine_ticket_lift",
            "label": "Lift en ticket",
            "value": ticket_lift,
            "displayValue": _format_percent_precise(ticket_lift) if ticket_lift is not None else "Sin base",
            "helper": "Comparativo entre pedido de rutina completa vs producto unico.",
            "isEstimated": True,
            "tone": "positive" if ticket_lift and ticket_lift > 0 else "neutral",
        },
    ]

    answers = [
        {
            "id": "routine_top",
            "question": "Que rutina termina vendiendo mas?",
            "answer": routine_counter.most_common(1)[0][0] if routine_counter else "Todavia no hay una rutina con masa critica",
            "detail": (
                f"{routine_counter.most_common(1)[0][1]} pedido(s) atribuidos."
                if routine_counter
                else "La atribucion se infiere por coincidencia de pasos comprados."
            ),
            "tone": "positive" if routine_counter else "warning",
        },
        {
            "id": "routine_value",
            "question": "Cuanto vale cada flujo?",
            "answer": (
                f"Rutina completa {_format_currency(average_full_routine_value)} vs producto unico {_format_currency(average_single_product_value)}."
                if average_full_routine_value or average_single_product_value
                else "Todavia no hay suficiente volumen para comparar tickets por rutina."
            ),
            "detail": (
                f"Las rutinas elevan el ticket {abs(ticket_lift):.1f}%."
                if ticket_lift is not None
                else "Hace falta mas historial para medir el efecto sobre ticket."
            ),
            "tone": "positive" if ticket_lift and ticket_lift > 0 else "neutral",
        },
        {
            "id": "routine_measurement",
            "question": "Que parte falta medir mejor?",
            "answer": "Aun no existe telemetria persistida de aperturas o agregado de rutina completa.",
            "detail": "Hoy la lectura se apoya en pedidos atribuidos a secuencias de rutina, no en clics previos.",
            "tone": "warning",
        },
    ]

    return {
        "metrics": metrics,
        "answers": answers,
        "routines": _counter_to_ranked_items(routine_counter, total=max(full_routine_orders, 1)),
        "measurement_note": "Routine Builder se interpreta con atribucion por pedidos, no con aperturas del modal.",
        "full_routine_orders": full_routine_orders,
        "single_product_orders": single_product_orders,
    }


def _build_product_analysis(context: dict[str, Any], now: datetime) -> list[dict[str, Any]]:
    bundle = context["bundle"]
    product_scores = context["product_scores"]
    items_by_order_id: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for item in bundle["order_items"]:
        items_by_order_id[int(item["order_id"])].append(item)

    current_units: Counter[int] = Counter()
    previous_units: Counter[int] = Counter()
    current_revenue: Counter[int] = Counter()
    previous_revenue: Counter[int] = Counter()
    for order in bundle["orders"]:
        payment = context["payments_by_order_id"].get(int(order["id"]))
        if not _is_realized_order(order, payment):
            continue
        created_at = order.get("created_at") or now
        bucket = None
        if created_at >= now - timedelta(days=30):
            bucket = "current"
        elif now - timedelta(days=60) <= created_at < now - timedelta(days=30):
            bucket = "previous"
        if bucket is None:
            continue
        for item in items_by_order_id.get(int(order["id"]), []):
            product_id = int(item.get("product_id") or 0)
            quantity = int(item.get("quantity") or 0)
            line_revenue = quantity * _to_float(item.get("unit_price"))
            if bucket == "current":
                current_units[product_id] += quantity
                current_revenue[product_id] += line_revenue
            else:
                previous_units[product_id] += quantity
                previous_revenue[product_id] += line_revenue

    product_by_id = {int(product["product_id"]): product for product in product_scores}
    most_sold = max(product_scores, key=lambda item: (int(item["units_sold"]), float(item["revenue"])), default=None)
    highest_margin = max(product_scores, key=lambda item: float(item.get("_gross_profit", 0)), default=None)
    most_reviewed = max(product_scores, key=lambda item: (int(item["review_count"]), float(item["average_rating"])), default=None)

    growth_candidates = []
    drop_candidates = []
    for product in product_scores:
        product_id = int(product["product_id"])
        current_value = float(current_revenue.get(product_id, 0))
        previous_value = float(previous_revenue.get(product_id, 0))
        delta = current_value - previous_value
        delta_percent = _format_delta(current_value, previous_value)
        growth_candidates.append((delta, delta_percent if delta_percent is not None else -9999, product))
        drop_candidates.append((delta, delta_percent if delta_percent is not None else 9999, product))

    biggest_growth = max(growth_candidates, key=lambda item: (item[0], item[1]), default=None)
    biggest_drop = min(drop_candidates, key=lambda item: (item[0], item[1]), default=None)

    product_view_events = Counter()
    for event in bundle["crm_events"]:
        if str(event.get("event_type")) != "product_view":
            continue
        payload = event.get("payload_json") or {}
        product_name = str(payload.get("product_name") or payload.get("productName") or "Producto")
        product_view_events[product_name] += 1

    non_realized_product_counter = Counter()
    for order in bundle["orders"]:
        payment = context["payments_by_order_id"].get(int(order["id"]))
        if _is_realized_order(order, payment):
            continue
        for item in items_by_order_id.get(int(order["id"]), []):
            non_realized_product_counter[str(item.get("product_name") or "Producto")] += int(item.get("quantity") or 0)

    most_viewed = product_view_events.most_common(1)[0] if product_view_events else None
    highest_abandonment = non_realized_product_counter.most_common(1)[0] if non_realized_product_counter else None

    return [
        {
            "id": "product_best_seller",
            "question": "Cual es el producto mas vendido?",
            "answer": (
                f"{most_sold['name']} con {most_sold['units_sold']} unidad(es) y {_format_currency(most_sold['revenue'])}."
                if most_sold
                else "Sin ventas suficientes todavia."
            ),
            "detail": most_sold["recommended_action"] if most_sold else None,
            "tone": "positive",
        },
        {
            "id": "product_growth",
            "question": "Cual muestra mayor crecimiento?",
            "answer": (
                f"{biggest_growth[2]['name']} con {biggest_growth[0]:+.0f} MXN vs. los 30 dias previos."
                if biggest_growth and biggest_growth[0] > 0
                else "No hay un crecimiento claro contra el periodo anterior."
            ),
            "detail": (
                f"Variacion relativa de {biggest_growth[1]:+.1f}%."
                if biggest_growth and biggest_growth[1] != -9999
                else "Falta mas historial para comparar mejor."
            ),
            "tone": "positive" if biggest_growth and biggest_growth[0] > 0 else "neutral",
        },
        {
            "id": "product_drop",
            "question": "Cual muestra mayor caida?",
            "answer": (
                f"{biggest_drop[2]['name']} con {biggest_drop[0]:+.0f} MXN frente al periodo previo."
                if biggest_drop and biggest_drop[0] < 0
                else "No se detecta una caida relevante en el periodo."
            ),
            "detail": (
                f"Variacion relativa de {biggest_drop[1]:+.1f}%."
                if biggest_drop and biggest_drop[1] != 9999
                else "El comparativo seguira mejorando con mas ventas."
            ),
            "tone": "warning" if biggest_drop and biggest_drop[0] < 0 else "neutral",
        },
        {
            "id": "product_margin",
            "question": "Cual deja mayor margen?",
            "answer": (
                f"{highest_margin['name']} lidera por margen bruto estimado."
                if highest_margin
                else "Sin costos suficientes para comparar."
            ),
            "detail": (
                f"Margen {highest_margin['marginPercent']:.0f}% y accion sugerida: {highest_margin['recommended_action']}"
                if highest_margin
                else None
            ),
            "tone": "positive",
        },
        {
            "id": "product_reviews",
            "question": "Cual concentra mas resenas?",
            "answer": (
                f"{most_reviewed['name']} con {most_reviewed['reviewCount']} resena(s) y rating {most_reviewed['averageRating']:.1f}/5."
                if most_reviewed and most_reviewed["reviewCount"] > 0
                else "Aun no hay resenas suficientes para una lectura fuerte."
            ),
            "detail": "Las resenas aprobadas sostienen confianza y conversion." if most_reviewed else None,
            "tone": "neutral",
        },
        {
            "id": "product_views",
            "question": "Cual es el mas visto?",
            "answer": (
                f"{most_viewed[0]} con {most_viewed[1]} vista(s) persistidas."
                if most_viewed
                else "Todavia no existe telemetria persistida de vistas de producto."
            ),
            "detail": "La lectura se activara automaticamente si esos eventos empiezan a llegar al backend.",
            "tone": "warning" if not most_viewed else "neutral",
        },
        {
            "id": "product_abandonment",
            "question": "Cual tiene mayor abandono?",
            "answer": (
                f"{highest_abandonment[0]} aparece en {highest_abandonment[1]} unidad(es) de pedidos no cobrados."
                if highest_abandonment
                else "No hay abandono medible en ordenes pendientes o fallidas."
            ),
            "detail": "Se calcula con pedidos no realizados, no con vistas o clicks.",
            "tone": "warning" if highest_abandonment else "neutral",
        },
    ]


def _build_customer_analysis(context: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    profiles = context["profiles"]
    scores = context["customer_scores"]

    new_customers = sum(
        1
        for profile in profiles
        if int(profile.get("orders_count") or 0) == 1 and (profile.get("days_since_last_order") or 10_000) <= 30
    )
    active_customers = sum(
        1
        for profile in profiles
        if int(profile.get("orders_count") or 0) > 0 and (profile.get("days_since_last_order") or 10_000) <= 90
    )
    vip_customers = sum(
        1
        for profile in profiles
        if _to_float(profile.get("total_spent")) >= 2500 or int(profile.get("orders_count") or 0) >= 3
    )
    lost_customers = sum(
        1
        for profile in profiles
        if int(profile.get("orders_count") or 0) > 0 and (profile.get("days_since_last_order") or 0) > 120
    )
    at_risk_customers = sum(
        1
        for profile in profiles
        if int(profile.get("orders_count") or 0) > 0 and 60 <= (profile.get("days_since_last_order") or 0) <= 120
    )
    ready_repurchase = sum(1 for customer in scores if int(customer["repurchase_score"]) >= 70)

    answers = [
        {
            "id": "customers_new",
            "question": "Cuantos clientes nuevos entraron?",
            "answer": f"{new_customers} clienta(s) hicieron su primera compra en la ventana reciente.",
            "detail": "Se toma como nueva a quien solo tiene una compra y esta dentro de los ultimos 30 dias.",
            "tone": "positive" if new_customers > 0 else "neutral",
        },
        {
            "id": "customers_active",
            "question": "Cuantos siguen activos?",
            "answer": f"{active_customers} clienta(s) mantienen compra o actividad en los ultimos 90 dias.",
            "detail": "La base activa es la que mejor responde a recompra y bundles.",
            "tone": "neutral",
        },
        {
            "id": "customers_vip",
            "question": "Cuantos son VIP?",
            "answer": f"{vip_customers} clienta(s) ya ameritan trato VIP por recurrencia o gasto acumulado.",
            "detail": "Conviene darles seguimiento personalizado y anticipar refill.",
            "tone": "positive" if vip_customers > 0 else "neutral",
        },
        {
            "id": "customers_lost",
            "question": "Cuantos clientes se consideran perdidos?",
            "answer": f"{lost_customers} clienta(s) llevan mas de 120 dias sin compra.",
            "detail": "Requieren reactivacion con mensaje mas editorial que promocional.",
            "tone": "warning" if lost_customers > 0 else "neutral",
        },
        {
            "id": "customers_risk",
            "question": "Cuantos estan en riesgo?",
            "answer": f"{at_risk_customers} clienta(s) estan entrando en ventana de riesgo.",
            "detail": "La oportunidad esta antes de que pasen a perdida total.",
            "tone": "warning" if at_risk_customers > 0 else "neutral",
        },
        {
            "id": "customers_repurchase",
            "question": "Cuantos ya estan listos para recompra?",
            "answer": f"{ready_repurchase} clienta(s) ya tienen score de recompra alto.",
            "detail": "El score combina recencia, frecuencia, ticket y afinidad con rutina.",
            "tone": "positive" if ready_repurchase > 0 else "neutral",
        },
    ]

    return answers, scores[:6]


def _classify_order_origin(
    *,
    order: dict[str, Any],
    profile: dict[str, Any] | None,
    lead_before_order: dict[str, Any] | None,
) -> str:
    raw_sources = set()
    if profile:
        raw_sources.update(str(source or "").lower() for source in profile.get("sources", set()))
    if lead_before_order:
        raw_sources.add(str(lead_before_order.get("source") or "").lower())
    raw_sources.add(str(order.get("source") or "").lower())

    if any("quiz" in source for source in raw_sources):
        return "Quiz"
    if any("search" in source or "busqueda" in source for source in raw_sources):
        return "Busqueda"
    if any("category" in source or "categoria" in source for source in raw_sources):
        return "Categoria"
    if any("blog" in source or "article" in source for source in raw_sources):
        return "Blog"
    return "Directo"


def _build_marketing_analysis(context: dict[str, Any], now: datetime) -> dict[str, Any]:
    bundle = context["bundle"]
    profiles = context["profiles"]
    realized_orders = context["realized_orders"]
    by_email, by_phone = _build_profile_identity_maps(profiles)

    coupon_by_id = {int(coupon["id"]): coupon for coupon in bundle["coupons"]}
    coupon_counter: Counter[str] = Counter()
    for redemption in bundle["coupon_redemptions"]:
        if (redemption.get("created_at") or now) < now - timedelta(days=30):
            continue
        coupon = coupon_by_id.get(int(redemption.get("coupon_id") or 0))
        if coupon:
            coupon_counter[str(coupon.get("code") or "Sin cupon")] += 1

    lead_by_identity: dict[str, dict[str, Any]] = {}
    for lead in bundle["skin_quiz_leads"]:
        identity = _normalize_email(lead.get("email")) or _normalize_phone(lead.get("whatsapp")) or f"lead:{lead['id']}"
        current = lead_by_identity.get(identity)
        lead_created_at = lead.get("created_at") or now
        if current is None or lead_created_at > (current.get("created_at") or now):
            lead_by_identity[identity] = lead

    source_counter: Counter[str] = Counter()
    for order in realized_orders:
        profile = _find_profile_for_identity(
            email=order.get("customer_email"),
            phone=order.get("customer_phone"),
            by_email=by_email,
            by_phone=by_phone,
        )
        lead_key = _normalize_email(order.get("customer_email")) or _normalize_phone(order.get("customer_phone"))
        lead = lead_by_identity.get(lead_key) if lead_key else None
        if lead and (lead.get("created_at") or now) > (order.get("created_at") or now):
            lead = None
        source_counter[_classify_order_origin(order=order, profile=profile, lead_before_order=lead)] += 1

    top_source = source_counter.most_common(1)[0][0] if source_counter else "Directo"

    answers = [
        {
            "id": "marketing_coupons_used",
            "question": "Cuantos cupones se usaron?",
            "answer": f"{context['coupons']['redemptions_30d']} redencion(es) en 30 dias.",
            "detail": f"Descuento total entregado: {_format_currency(context['coupons']['discount_amount_30d'])}.",
            "tone": "neutral",
        },
        {
            "id": "marketing_coupon_conversion",
            "question": "Que cupon convierte mejor?",
            "answer": (
                f"{coupon_counter.most_common(1)[0][0]} lidera con {coupon_counter.most_common(1)[0][1]} uso(s)."
                if coupon_counter
                else "Todavia no hay un cupon con traccion suficiente."
            ),
            "detail": "La lectura actual usa redenciones creadas al generar la orden, no clicks promocionales.",
            "tone": "positive" if coupon_counter else "neutral",
        },
        {
            "id": "marketing_origin",
            "question": "De donde vienen las compras?",
            "answer": f"El origen dominante hoy es {top_source.lower()}.",
            "detail": "El origen se infiere con señales persistidas de lead, contacto y orden.",
            "tone": "neutral",
        },
    ]

    return {
        "answers": answers,
        "sources": _counter_to_ranked_items(source_counter, total=len(realized_orders)),
        "coupons": _counter_to_ranked_items(coupon_counter, total=max(context["coupons"]["redemptions_30d"], 1)),
    }


def _build_funnel_analysis(context: dict[str, Any]) -> dict[str, Any]:
    bundle = context["bundle"]
    realized_orders = context["realized_orders"]
    skin_quiz_completed = len([event for event in bundle["crm_events"] if str(event.get("event_type")) == "skin_quiz_completed"]) or len(bundle["skin_quiz_leads"])
    routine_orders = 0
    for recommendation in _build_routine_builder_analysis(context)["routines"]:
        routine_orders += int(recommendation["count"])
    checkout_count = len(bundle["orders"])
    purchase_count = len(realized_orders)

    product_view_count = len([event for event in bundle["crm_events"] if str(event.get("event_type")) == "product_view"])
    add_to_cart_count = len([event for event in bundle["crm_events"] if str(event.get("event_type")) == "add_to_cart"])
    visits_count = len([event for event in bundle["crm_events"] if str(event.get("event_type")) in {"page_view", "session_started", "home_view"}])

    raw_steps = [
        ("visits", "Visitas", visits_count if visits_count > 0 else None, "measured" if visits_count > 0 else "unavailable"),
        ("skin_quiz", "Skin Quiz", skin_quiz_completed if skin_quiz_completed > 0 else None, "measured" if skin_quiz_completed > 0 else "unavailable"),
        ("routine", "Rutina", routine_orders if routine_orders > 0 else None, "proxy" if routine_orders > 0 else "unavailable"),
        ("product", "Producto", product_view_count if product_view_count > 0 else None, "measured" if product_view_count > 0 else "unavailable"),
        ("routine_builder", "Routine Builder", routine_orders if routine_orders > 0 else None, "proxy" if routine_orders > 0 else "unavailable"),
        ("cart", "Carrito", add_to_cart_count if add_to_cart_count > 0 else None, "measured" if add_to_cart_count > 0 else "unavailable"),
        ("checkout", "Checkout", checkout_count if checkout_count > 0 else None, "measured"),
        ("purchase", "Compra", purchase_count if purchase_count > 0 else None, "measured" if purchase_count > 0 else "unavailable"),
    ]

    steps: list[dict[str, Any]] = []
    previous_count: int | None = None
    for step_id, label, count, measurement in raw_steps:
        if previous_count is not None and count is not None and previous_count > 0:
            conversion = round((count / previous_count) * 100, 1)
            loss = max(previous_count - count, 0)
        else:
            conversion = None
            loss = None
        steps.append(
            {
                "id": step_id,
                "label": label,
                "count": count,
                "displayValue": str(count) if count is not None else "Sin dato",
                "conversionFromPrevious": conversion,
                "lossFromPrevious": loss,
                "measurement": measurement,
            }
        )
        previous_count = count if count is not None else previous_count

    funnel_insights = [
        (
            f"Checkout a compra: {_format_percent_precise((purchase_count / checkout_count) * 100)}."
            if checkout_count > 0
            else "Todavia no hay checkouts persistidos para medir cierre."
        ),
        (
            f"Skin Quiz a rutina atribuida: {_format_percent_precise((routine_orders / skin_quiz_completed) * 100)}."
            if skin_quiz_completed > 0 and routine_orders > 0
            else "La capa media del embudo todavia depende de proxies, no de eventos completos."
        ),
        "Las etapas de visitas, producto y carrito se llenaran automaticamente cuando esos eventos se persistan en backend.",
    ]

    return {
        "steps": steps,
        "insights": funnel_insights,
    }


def _build_analysis(context: dict[str, Any], now: datetime) -> dict[str, Any]:
    skin_quiz = _build_skin_quiz_analysis(context, now)
    routine_builder = _build_routine_builder_analysis(context)
    customer_answers, priority_customers = _build_customer_analysis(context)
    marketing = _build_marketing_analysis(context, now)
    funnel = _build_funnel_analysis(context)

    measurement_notes = [
        skin_quiz["measurement_note"],
        routine_builder["measurement_note"],
        "Origen de compra, embudo medio y abandono usan senales persistidas o proxies; no se fabrican datos inexistentes.",
    ]

    return {
        "executive_periods": _build_executive_periods(context, now),
        "skin_quiz_metrics": skin_quiz["metrics"],
        "skin_quiz_answers": skin_quiz["answers"],
        "skin_quiz_recommended_products": skin_quiz["recommended_products"],
        "skin_quiz_purchased_products": skin_quiz["purchased_products"],
        "routine_builder_metrics": routine_builder["metrics"],
        "routine_builder_answers": routine_builder["answers"],
        "routine_builder_routines": routine_builder["routines"],
        "product_answers": _build_product_analysis(context, now),
        "customer_answers": customer_answers,
        "priority_customers": priority_customers,
        "marketing_answers": marketing["answers"],
        "marketing_sources": marketing["sources"],
        "marketing_coupons": marketing["coupons"],
        "funnel_steps": funnel["steps"],
        "funnel_insights": funnel["insights"],
        "measurement_notes": measurement_notes,
    }


def get_admin_intelligence_dashboard(db: Session) -> dict[str, Any]:
    now = _now_utc()
    bundle = _build_data_bundle(db)
    context = _build_context(bundle, now)
    analysis = _build_analysis(context, now)

    return {
        "generated_at": context["generated_at"],
        "executive_summary": _build_executive_summary(context),
        "kpis": _build_kpis(context),
        "snapshots": _build_snapshots(context),
        "recommendations": _build_recommendations(context),
        "customer_scores": context["customer_scores"],
        "product_scores": [
            {key: value for key, value in product.items() if not key.startswith("_")}
            for product in context["product_scores"][:12]
        ],
        "ai_module": {
            "title": "Preguntale a Skin Hearten AI",
            "description": "Responde con reglas, contexto comercial y senales persistidas. La capa queda lista para conectar OpenAI despues, pero hoy ya prioriza decisiones utiles.",
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
            "provider": "rules",
            "open_ai_ready": True,
        },
        "analysis": analysis,
    }


def ask_admin_intelligence_question(db: Session, question: str) -> dict[str, Any]:
    normalized_question = question.strip().lower()
    now = _now_utc()
    context = _build_context(_build_data_bundle(db), now)
    summary = _build_executive_summary(context)
    recommendations = _build_recommendations(context)
    analysis = _build_analysis(context, now)
    customer_scores = context["customer_scores"]
    product_scores = context["product_scores"]

    supporting_facts: list[str] = []
    suggested_actions: list[str] = []

    if any(keyword in normalized_question for keyword in ["por que", "bajaron", "ventas", "cayeron"]):
        today_block = analysis["executive_periods"][0] if analysis["executive_periods"] else None
        return {
            "provider": "rules",
            "open_ai_ready": True,
            "answer": today_block["headline"] if today_block else summary["summary"],
            "supporting_facts": today_block["details"] if today_block else summary["bullets"],
            "suggested_actions": [
                item["suggested_action"]
                for item in recommendations
                if item["priority"] in {"critical", "high"}
            ][:3]
            or [item["suggested_action"] for item in recommendations[:3]],
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
        }

    if any(keyword in normalized_question for keyword in ["contactar", "seguir", "follow up"]):
        top_customer = customer_scores[0] if customer_scores else None
        return {
            "provider": "rules",
            "open_ai_ready": True,
            "answer": (
                f"La mejor oportunidad inmediata es {top_customer['name']} con score de recompra {top_customer['repurchase_score']}/100."
                if top_customer
                else "Todavia no hay suficientes compras cobradas para priorizar contactos."
            ),
            "supporting_facts": top_customer["reasons"] if top_customer else summary["bullets"],
            "suggested_actions": [
                top_customer["suggested_action"],
                "Priorizar WhatsApp en clientas con score alto y marketing aceptado.",
            ]
            if top_customer
            else [item["suggested_action"] for item in recommendations[:2]],
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
        }

    if any(keyword in normalized_question for keyword in ["rutina", "routine builder"]):
        top_routine = analysis["routine_builder_routines"][0] if analysis["routine_builder_routines"] else None
        routine_value = next(
            (item for item in analysis["routine_builder_answers"] if item["id"] == "routine_value"),
            None,
        )
        return {
            "provider": "rules",
            "open_ai_ready": True,
            "answer": (
                f"La rutina con mejor salida hoy es {top_routine['label']} con {top_routine['count']} pedido(s) atribuidos."
                if top_routine
                else "Todavia no hay suficiente evidencia persistida para declarar una rutina ganadora."
            ),
            "supporting_facts": [
                routine_value["answer"] if routine_value else analysis["measurement_notes"][1],
                routine_value["detail"] if routine_value else "La atribucion se apoya en pedidos reales, no en aperturas del modal.",
            ],
            "suggested_actions": [
                "Usar esa rutina como ancla comercial en quiz, PDP y seguimiento.",
                "Comparar su ticket contra el flujo de producto unico antes de empujar mas trafico.",
            ],
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
        }

    if any(keyword in normalized_question for keyword in ["promocionar", "promo", "impulsar"]):
        promotable_product = next(
            (
                product
                for product in product_scores
                if product["inventory_score"] > 25 and product["intelligence_score"] >= 70
            ),
            product_scores[0] if product_scores else None,
        )
        return {
            "provider": "rules",
            "open_ai_ready": True,
            "answer": (
                f"Hoy conviene empujar {promotable_product['name']}."
                if promotable_product
                else "Todavia no hay suficiente catalogo o ventas para decidir que promocionar."
            ),
            "supporting_facts": [
                f"Score comercial {promotable_product['intelligence_score']}/100.",
                f"Margen {promotable_product['margin_percent']:.0f}% con stock {promotable_product['stock']} pieza(s).",
                promotable_product["recommended_action"],
            ]
            if promotable_product
            else summary["bullets"],
            "suggested_actions": [
                "Impulsarlo con narrativa editorial, no con descuento agresivo.",
                "Acompanarlo con prueba social o resenas si la conversion todavia puede subir.",
            ],
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
        }

    if any(keyword in normalized_question for keyword in ["quiz", "lead"]):
        return {
            "provider": "rules",
            "open_ai_ready": True,
            "answer": "El Skin Quiz ya deja una lectura comercial util, aunque todavia falta telemetria durable del inicio del flujo.",
            "supporting_facts": [item["answer"] for item in analysis["skin_quiz_answers"][:4]],
            "suggested_actions": [
                "Contactar primero leads recientes con marketing aceptado.",
                "Usar la rutina recomendada como ancla para cerrar venta.",
            ],
            "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
        }

    if any(keyword in normalized_question for keyword in ["recompra", "cliente", "customers", "crm"]):
        top_customer = customer_scores[0] if customer_scores else None
        if top_customer:
            answer = (
                f"La mejor oportunidad inmediata es {top_customer['name']} con score de recompra "
                f"{top_customer['repurchase_score']}/100. La base tiene {sum(1 for item in customer_scores if item['repurchase_score'] >= 70)} clienta(s) "
                "con señal alta de refill."
            )
            supporting_facts = top_customer["reasons"]
            suggested_actions = [
                top_customer["suggested_action"],
                "Priorizar WhatsApp en clientas con score alto y marketing aceptado.",
            ]
        else:
            answer = "Todavia no hay suficientes compras cobradas para estimar recompra real."
    elif any(keyword in normalized_question for keyword in ["inventario", "stock", "sku", "producto"]):
        critical_product = next(
            (product for product in product_scores if product["inventory_score"] <= 25),
            None,
        )
        if critical_product:
            answer = (
                f"El riesgo operativo principal esta en {critical_product['name']}: stock actual de "
                f"{critical_product['stock']} con rotacion que ya justifica reposicion."
            )
            supporting_facts = [
                f"Score de inventario: {critical_product['inventory_score']}/100.",
                f"Accion sugerida: {critical_product['recommended_action']}",
                f"Ingreso generado: {_format_currency(critical_product['revenue'])}.",
            ]
            suggested_actions = [
                "Reponer el SKU critico primero.",
                "Pausar empuje comercial del producto hasta confirmar abastecimiento.",
            ]
        else:
            best_product = product_scores[0] if product_scores else None
            answer = (
                f"No hay un SKU critico hoy. El producto mas sano para seguir empujando es {best_product['name']}."
                if best_product
                else "Todavia no hay suficiente catalogo o ventas para analizar productos."
            )
    elif any(keyword in normalized_question for keyword in ["quiz", "lead", "rutina"]):
        quiz_snapshot = next(snapshot for snapshot in snapshots if snapshot["id"] == "skin_quiz")
        answer = (
            f"El Skin Quiz sigue siendo una fuente comercial util: {quiz_snapshot['headline'].lower()}"
        )
        supporting_facts = quiz_snapshot["details"]
        suggested_actions = [
            "Contactar primero leads recientes con marketing aceptado.",
            "Usar la rutina recomendada como ancla para cerrar venta.",
        ]
    elif any(keyword in normalized_question for keyword in ["cupon", "promoc", "descuento"]):
        coupons_snapshot = next(snapshot for snapshot in snapshots if snapshot["id"] == "coupons")
        answer = coupons_snapshot["headline"]
        supporting_facts = coupons_snapshot["details"]
        suggested_actions = [
            "Usar promociones sobre stock lento, no sobre productos ya tensionados por inventario.",
            "Duplicar el cupon ganador solo si la rotacion lo justifica.",
        ]
    else:
        answer = summary["summary"]
        supporting_facts = summary["bullets"]
        suggested_actions = [item["suggested_action"] for item in recommendations[:3]]

    return {
        "provider": "rules",
        "open_ai_ready": True,
        "answer": answer,
        "supporting_facts": supporting_facts,
        "suggested_actions": suggested_actions,
        "suggested_questions": _INTELLIGENCE_SUGGESTED_QUESTIONS,
    }
