from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import engine
from app.models import Base, Customer, Order, OrderItem, Product, ProductReview, ReviewInvitation
from app.models.enums import ProductReviewSource, ProductReviewStatus, ReviewInvitationStatus
from app.schemas.review import AdminReviewInvitationCreate, ReviewInvitationSubmit
from app.services.mock_store import (
    create_product_review as create_mock_product_review,
    create_review_invitation as create_mock_review_invitation,
    get_order_by_number as get_mock_order_by_number,
    get_product as get_mock_product,
    get_review_invitation_by_token as get_mock_review_invitation_by_token,
    list_product_reviews as list_mock_product_reviews,
    list_review_invitations as list_mock_review_invitations,
    update_review_invitation as update_mock_review_invitation,
)

DEFAULT_REVIEW_INVITATION_DAYS = 30

_review_invitations_table_initialized = False


def _ensure_review_invitations_table() -> None:
    global _review_invitations_table_initialized

    if _review_invitations_table_initialized:
        return

    Base.metadata.create_all(bind=engine, tables=[ProductReview.__table__, ReviewInvitation.__table__])
    _review_invitations_table_initialized = True


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
    normalized = value.strip()
    return normalized or None


def _phone_tokens(value: str | None) -> set[str]:
    normalized = _normalize_phone(value)
    if not normalized:
        return set()

    tokens = {normalized}
    if len(normalized) >= 10:
        tokens.add(normalized[-10:])
    return tokens


def _phones_match(first: str | None, second: str | None) -> bool:
    return bool(_phone_tokens(first) & _phone_tokens(second))


def _contact_matches(
    *,
    customer_email: str | None,
    customer_phone: str | None,
    email: str | None,
    phone: str | None,
) -> bool:
    normalized_email = _normalize_email(email)
    if normalized_email and _normalize_email(customer_email) == normalized_email:
        return True
    if phone and _phones_match(customer_phone, phone):
        return True
    return False


def _get_customer_name(*, order: Order | None = None, customer: Customer | None = None, fallback: dict | None = None) -> str | None:
    if order is not None:
        shipping_name = getattr(order, "shipping_name", None)
        if isinstance(shipping_name, str) and shipping_name.strip():
            return shipping_name.strip()
    if customer is not None:
        full_name = " ".join(part for part in [customer.first_name, customer.last_name] if part).strip()
        if full_name:
            return full_name
    if fallback is not None:
        shipping_name = str(fallback.get("shipping_name") or "").strip()
        if shipping_name:
            return shipping_name
    return None


def _get_customer_contact(
    *,
    order: Order | None = None,
    customer: Customer | None = None,
    fallback: dict | None = None,
) -> tuple[str | None, str | None]:
    order_email = getattr(order, "customer_email", None) if order is not None else None
    order_phone = getattr(order, "shipping_phone", None) if order is not None else None
    customer_email = customer.email if customer is not None else None
    customer_phone = customer.phone if customer is not None else None

    if fallback is not None:
        order_email = fallback.get("customer_email") or order_email
        order_phone = fallback.get("shipping_phone") or order_phone

    return (_normalize_email(order_email or customer_email), order_phone or customer_phone)


def _derive_status(
    status_value: ReviewInvitationStatus | str | None,
    expires_at: datetime | None,
) -> ReviewInvitationStatus:
    current = ReviewInvitationStatus(str(status_value or ReviewInvitationStatus.PENDING))
    if current == ReviewInvitationStatus.PENDING and expires_at and expires_at <= datetime.now(timezone.utc):
        return ReviewInvitationStatus.EXPIRED
    return current


def _review_duplicate_exists(
    *,
    reviews: list[dict[str, Any]],
    order_id: int,
    product_id: int,
    customer_email: str | None,
) -> bool:
    normalized_email = _normalize_email(customer_email)
    for review in reviews:
        if int(review.get("order_id") or 0) != order_id:
            continue
        if int(review.get("product_id") or 0) != product_id:
            continue
        if not bool(review.get("verified_purchase", False)):
            continue
        if normalized_email and _normalize_email(review.get("customer_email")) != normalized_email:
            continue
        return True
    return False


def _serialize_item(product_id: int, product_name: str, product_slug: str | None) -> dict[str, Any]:
    return {
        "product_id": product_id,
        "product_name": product_name,
        "product_slug": product_slug,
    }


def _serialize_public_invitation(
    invitation: dict[str, Any],
    *,
    items: list[dict[str, Any]],
    order_number: str,
    customer_name: str | None,
) -> dict[str, Any]:
    return {
        "id": int(invitation["id"]),
        "token": invitation["token"],
        "status": str(invitation["status"]),
        "order_number": order_number,
        "customer_name": customer_name,
        "expires_at": invitation.get("expires_at"),
        "submitted_at": invitation.get("submitted_at"),
        "created_at": invitation["created_at"],
        "selected_product_id": invitation.get("product_id"),
        "items": items,
    }


def _serialize_admin_invitation(
    invitation: dict[str, Any],
    *,
    order_number: str,
    product_name: str | None,
) -> dict[str, Any]:
    return {
        "id": int(invitation["id"]),
        "token": invitation["token"],
        "status": str(invitation["status"]),
        "order_id": int(invitation["order_id"]),
        "order_number": order_number,
        "customer_email": invitation.get("customer_email"),
        "customer_phone": invitation.get("customer_phone"),
        "product_id": invitation.get("product_id"),
        "product_name": product_name,
        "expires_at": invitation.get("expires_at"),
        "submitted_at": invitation.get("submitted_at"),
        "created_at": invitation["created_at"],
    }


def _collect_db_items(db: Session, order_id: int, selected_product_id: int | None = None) -> list[dict[str, Any]]:
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    product_ids = sorted({int(item.product_id) for item in order_items})
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    product_by_id = {int(product.id): product for product in products}

    seen: set[int] = set()
    serialized: list[dict[str, Any]] = []
    for item in order_items:
        product_id = int(item.product_id)
        if selected_product_id is not None and product_id != selected_product_id:
            continue
        if product_id in seen:
            continue
        seen.add(product_id)
        product_model = product_by_id.get(product_id)
        serialized.append(
            _serialize_item(
                product_id,
                item.product_name,
                product_model.slug if product_model else None,
            )
        )
    return serialized


def _collect_mock_items(order: dict[str, Any], selected_product_id: int | None = None) -> list[dict[str, Any]]:
    seen: set[int] = set()
    serialized: list[dict[str, Any]] = []
    for item in order.get("items", []):
        product_id = int(item.get("product_id") or 0)
        if product_id <= 0:
            continue
        if selected_product_id is not None and product_id != selected_product_id:
            continue
        if product_id in seen:
            continue
        seen.add(product_id)
        product_model = get_mock_product(product_id)
        serialized.append(
            _serialize_item(
                product_id,
                str(item.get("product_name") or (product_model.get("name") if product_model else "Producto")),
                product_model.get("slug") if product_model else None,
            )
        )
    return serialized


def _mark_db_invitation_expired(db: Session, invitation: ReviewInvitation) -> None:
    if _derive_status(invitation.status, invitation.expires_at) != ReviewInvitationStatus.EXPIRED:
        return
    if invitation.status == ReviewInvitationStatus.EXPIRED:
        return
    invitation.status = ReviewInvitationStatus.EXPIRED
    db.add(invitation)
    db.commit()
    db.refresh(invitation)


def get_review_invitation(db: Session, token: str) -> dict[str, Any] | None:
    normalized_token = token.strip()

    try:
        _ensure_review_invitations_table()
        invitation = db.query(ReviewInvitation).filter(ReviewInvitation.token == normalized_token).first()
        if not invitation:
            return None

        if _derive_status(invitation.status, invitation.expires_at) == ReviewInvitationStatus.EXPIRED:
            _mark_db_invitation_expired(db, invitation)

        order = db.query(Order).filter(Order.id == invitation.order_id).first()
        if not order:
            return None

        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        items = _collect_db_items(db, int(order.id), invitation.product_id)
        return _serialize_public_invitation(
            {
                "id": invitation.id,
                "token": invitation.token,
                "status": _derive_status(invitation.status, invitation.expires_at),
                "product_id": invitation.product_id,
                "expires_at": invitation.expires_at,
                "submitted_at": invitation.submitted_at,
                "created_at": invitation.created_at,
            },
            items=items,
            order_number=order.order_number,
            customer_name=_get_customer_name(order=order, customer=customer),
        )
    except SQLAlchemyError:
        db.rollback()

    invitation = get_mock_review_invitation_by_token(normalized_token)
    if not invitation:
        return None

    derived_status = _derive_status(invitation.get("status"), invitation.get("expires_at"))
    if derived_status != invitation.get("status"):
        invitation = update_mock_review_invitation(int(invitation["id"]), {"status": str(derived_status)}) or invitation

    order = get_mock_order_by_number(str(invitation.get("order_number") or ""))
    if not order:
        return None

    return _serialize_public_invitation(
        {
            **invitation,
            "status": derived_status,
        },
        items=_collect_mock_items(order, invitation.get("product_id")),
        order_number=str(order["order_number"]),
        customer_name=_get_customer_name(fallback=order),
    )


def submit_review_invitation(db: Session, token: str, payload: ReviewInvitationSubmit) -> dict[str, Any]:
    normalized_token = token.strip()

    try:
        _ensure_review_invitations_table()
        invitation = db.query(ReviewInvitation).filter(ReviewInvitation.token == normalized_token).first()
        if not invitation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

        derived_status = _derive_status(invitation.status, invitation.expires_at)
        if derived_status == ReviewInvitationStatus.EXPIRED:
            _mark_db_invitation_expired(db, invitation)
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Esta invitacion ya expiro.")
        if derived_status == ReviewInvitationStatus.SUBMITTED:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta invitacion ya fue utilizada.")

        order = db.query(Order).filter(Order.id == invitation.order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        selected_product_id = invitation.product_id or payload.product_id
        if not selected_product_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecciona un producto del pedido.")

        order_item = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order.id, OrderItem.product_id == selected_product_id)
            .first()
        )
        if not order_item:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese producto no forma parte del pedido.")

        customer_email, _customer_phone = _get_customer_contact(order=order, customer=customer)
        duplicate_reviews = (
            db.query(ProductReview)
            .filter(
                ProductReview.order_id == order.id,
                ProductReview.product_id == selected_product_id,
                ProductReview.verified_purchase.is_(True),
            )
            .all()
        )
        if _review_duplicate_exists(
            reviews=[
                {
                    "order_id": review.order_id,
                    "product_id": review.product_id,
                    "verified_purchase": review.verified_purchase,
                    "customer_email": review.customer_email,
                }
                for review in duplicate_reviews
            ],
            order_id=int(order.id),
            product_id=int(selected_product_id),
            customer_email=customer_email or invitation.customer_email,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya recibimos una resena verificada para este producto y pedido.",
            )

        review = ProductReview(
            product_id=selected_product_id,
            order_id=order.id,
            customer_name=payload.customer_name
            or _get_customer_name(order=order, customer=customer)
            or "Clienta verificada",
            customer_email=customer_email or _normalize_email(invitation.customer_email),
            rating=payload.rating,
            title=_normalize_text(payload.title),
            body=payload.body.strip(),
            verified_purchase=True,
            status=ProductReviewStatus.PENDING,
            source=ProductReviewSource.CUSTOMER,
            created_at=datetime.now(timezone.utc),
            approved_at=None,
        )
        invitation.status = ReviewInvitationStatus.SUBMITTED
        invitation.submitted_at = datetime.now(timezone.utc)
        db.add(review)
        db.add(invitation)
        db.commit()
        db.refresh(review)
        db.refresh(invitation)
        return {
            "review_id": review.id,
            "status": str(review.status),
            "submitted_at": invitation.submitted_at,
            "created_at": review.created_at,
        }
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()

    invitation = get_mock_review_invitation_by_token(normalized_token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

    derived_status = _derive_status(invitation.get("status"), invitation.get("expires_at"))
    if derived_status == ReviewInvitationStatus.EXPIRED:
        update_mock_review_invitation(int(invitation["id"]), {"status": str(ReviewInvitationStatus.EXPIRED)})
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Esta invitacion ya expiro.")
    if derived_status == ReviewInvitationStatus.SUBMITTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta invitacion ya fue utilizada.")

    order = get_mock_order_by_number(str(invitation.get("order_number") or ""))
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    selected_product_id = invitation.get("product_id") or payload.product_id
    if not selected_product_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecciona un producto del pedido.")

    if not any(int(item.get("product_id") or 0) == int(selected_product_id) for item in order.get("items", [])):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese producto no forma parte del pedido.")

    duplicate_reviews = list_mock_product_reviews(product_id=int(selected_product_id))
    if _review_duplicate_exists(
        reviews=duplicate_reviews,
        order_id=int(order["id"]),
        product_id=int(selected_product_id),
        customer_email=invitation.get("customer_email"),
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya recibimos una resena verificada para este producto y pedido.",
        )

    review = create_mock_product_review(
        {
            "product_id": int(selected_product_id),
            "order_id": int(order["id"]),
            "customer_name": payload.customer_name or _get_customer_name(fallback=order) or "Clienta verificada",
            "customer_email": _normalize_email(invitation.get("customer_email")),
            "rating": payload.rating,
            "title": _normalize_text(payload.title),
            "body": payload.body.strip(),
            "verified_purchase": True,
            "status": ProductReviewStatus.PENDING,
            "source": ProductReviewSource.CUSTOMER,
            "approved_at": None,
        }
    )
    updated_invitation = update_mock_review_invitation(
        int(invitation["id"]),
        {
            "status": str(ReviewInvitationStatus.SUBMITTED),
            "submitted_at": datetime.now(timezone.utc),
        },
    ) or invitation
    return {
        "review_id": int(review["id"]),
        "status": str(review.get("status") or ProductReviewStatus.PENDING),
        "submitted_at": updated_invitation.get("submitted_at") or datetime.now(timezone.utc),
        "created_at": review["created_at"],
    }


def list_admin_review_invitations(db: Session) -> list[dict[str, Any]]:
    try:
        _ensure_review_invitations_table()
        invitations = db.query(ReviewInvitation).order_by(desc(ReviewInvitation.created_at)).all()
        order_ids = sorted({int(invitation.order_id) for invitation in invitations})
        product_ids = sorted({int(invitation.product_id) for invitation in invitations if invitation.product_id is not None})
        orders = db.query(Order).filter(Order.id.in_(order_ids)).all() if order_ids else []
        products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
        order_by_id = {int(order.id): order for order in orders}
        product_by_id = {int(product.id): product for product in products}

        results: list[dict[str, Any]] = []
        for invitation in invitations:
            derived_status = _derive_status(invitation.status, invitation.expires_at)
            if derived_status == ReviewInvitationStatus.EXPIRED and invitation.status != ReviewInvitationStatus.EXPIRED:
                invitation.status = ReviewInvitationStatus.EXPIRED

            order = order_by_id.get(int(invitation.order_id))
            if not order:
                continue

            product_name = None
            if invitation.product_id is not None:
                product_model = product_by_id.get(int(invitation.product_id))
                product_name = product_model.name if product_model else None

            results.append(
                _serialize_admin_invitation(
                    {
                        "id": invitation.id,
                        "token": invitation.token,
                        "status": derived_status,
                        "order_id": invitation.order_id,
                        "customer_email": invitation.customer_email,
                        "customer_phone": invitation.customer_phone,
                        "product_id": invitation.product_id,
                        "expires_at": invitation.expires_at,
                        "submitted_at": invitation.submitted_at,
                        "created_at": invitation.created_at,
                    },
                    order_number=order.order_number,
                    product_name=product_name,
                )
            )

        db.commit()
        return results
    except SQLAlchemyError:
        db.rollback()

    results: list[dict[str, Any]] = []
    for invitation in list_mock_review_invitations():
        derived_status = _derive_status(invitation.get("status"), invitation.get("expires_at"))
        if derived_status != invitation.get("status"):
            invitation = update_mock_review_invitation(int(invitation["id"]), {"status": str(derived_status)}) or invitation
        order = get_mock_order_by_number(str(invitation.get("order_number") or ""))
        if not order:
            continue
        product_name = None
        if invitation.get("product_id") is not None:
            product = get_mock_product(int(invitation["product_id"]))
            product_name = product.get("name") if product else None

        results.append(
            _serialize_admin_invitation(
                {
                    **invitation,
                    "status": derived_status,
                },
                order_number=str(order["order_number"]),
                product_name=product_name,
            )
        )
    return results


def create_admin_review_invitation(db: Session, payload: AdminReviewInvitationCreate) -> dict[str, Any]:
    normalized_order_number = payload.order_number.strip()
    normalized_email = _normalize_email(str(payload.email)) if payload.email else None
    normalized_phone = payload.phone.strip() if payload.phone else None

    try:
        _ensure_review_invitations_table()
        order = db.query(Order).filter(Order.order_number == normalized_order_number).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        customer_email, customer_phone = _get_customer_contact(order=order, customer=customer)
        if not _contact_matches(
            customer_email=customer_email,
            customer_phone=customer_phone,
            email=normalized_email,
            phone=normalized_phone,
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pudimos validar ese pedido con los datos proporcionados.",
            )

        items = _collect_db_items(db, int(order.id))
        if not items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese pedido no tiene productos para reseña.")

        if payload.product_id is not None and not any(item["product_id"] == payload.product_id for item in items):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese producto no forma parte del pedido.")

        invitation_query = db.query(ReviewInvitation).filter(ReviewInvitation.order_id == order.id)
        if payload.product_id is None:
            invitation_query = invitation_query.filter(ReviewInvitation.product_id.is_(None))
        else:
            invitation_query = invitation_query.filter(ReviewInvitation.product_id == payload.product_id)

        existing = invitation_query.order_by(desc(ReviewInvitation.created_at)).first()
        if existing and _derive_status(existing.status, existing.expires_at) == ReviewInvitationStatus.EXPIRED:
            _mark_db_invitation_expired(db, existing)
            existing = None

        if existing and existing.status == ReviewInvitationStatus.PENDING:
            product_name = next(
                (item["product_name"] for item in items if item["product_id"] == existing.product_id),
                None,
            )
            return _serialize_admin_invitation(
                {
                    "id": existing.id,
                    "token": existing.token,
                    "status": existing.status,
                    "order_id": existing.order_id,
                    "customer_email": existing.customer_email,
                    "customer_phone": existing.customer_phone,
                    "product_id": existing.product_id,
                    "expires_at": existing.expires_at,
                    "submitted_at": existing.submitted_at,
                    "created_at": existing.created_at,
                },
                order_number=order.order_number,
                product_name=product_name,
            )

        invitation = ReviewInvitation(
            token=token_urlsafe(24),
            order_id=order.id,
            customer_email=customer_email or normalized_email,
            customer_phone=customer_phone or normalized_phone,
            product_id=payload.product_id,
            status=ReviewInvitationStatus.PENDING,
            expires_at=datetime.now(timezone.utc) + timedelta(days=DEFAULT_REVIEW_INVITATION_DAYS),
            submitted_at=None,
            created_at=datetime.now(timezone.utc),
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        product_name = next(
            (item["product_name"] for item in items if item["product_id"] == invitation.product_id),
            None,
        )
        return _serialize_admin_invitation(
            {
                "id": invitation.id,
                "token": invitation.token,
                "status": invitation.status,
                "order_id": invitation.order_id,
                "customer_email": invitation.customer_email,
                "customer_phone": invitation.customer_phone,
                "product_id": invitation.product_id,
                "expires_at": invitation.expires_at,
                "submitted_at": invitation.submitted_at,
                "created_at": invitation.created_at,
            },
            order_number=order.order_number,
            product_name=product_name,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()

    order = get_mock_order_by_number(normalized_order_number)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    customer_email = _normalize_email(order.get("customer_email"))
    customer_phone = order.get("shipping_phone")
    if not _contact_matches(
        customer_email=customer_email,
        customer_phone=customer_phone,
        email=normalized_email,
        phone=normalized_phone,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pudimos validar ese pedido con los datos proporcionados.",
        )

    items = _collect_mock_items(order)
    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese pedido no tiene productos para reseña.")

    if payload.product_id is not None and not any(item["product_id"] == payload.product_id for item in items):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese producto no forma parte del pedido.")

    existing = next(
        (
            invitation
            for invitation in list_mock_review_invitations()
            if int(invitation["order_id"]) == int(order["id"])
            and invitation.get("product_id") == payload.product_id
            and _derive_status(invitation.get("status"), invitation.get("expires_at")) == ReviewInvitationStatus.PENDING
        ),
        None,
    )
    if existing:
        product_name = next(
            (item["product_name"] for item in items if item["product_id"] == existing.get("product_id")),
            None,
        )
        return _serialize_admin_invitation(existing, order_number=str(order["order_number"]), product_name=product_name)

    invitation = create_mock_review_invitation(
        {
            "token": token_urlsafe(24),
            "order_id": int(order["id"]),
            "order_number": str(order["order_number"]),
            "customer_email": customer_email or normalized_email,
            "customer_phone": customer_phone or normalized_phone,
            "product_id": payload.product_id,
            "status": str(ReviewInvitationStatus.PENDING),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=DEFAULT_REVIEW_INVITATION_DAYS),
            "submitted_at": None,
        }
    )
    product_name = next(
        (item["product_name"] for item in items if item["product_id"] == invitation.get("product_id")),
        None,
    )
    return _serialize_admin_invitation(
        invitation,
        order_number=str(order["order_number"]),
        product_name=product_name,
    )
