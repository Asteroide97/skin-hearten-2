from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Iterable

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import engine
from app.models import AnalyticsEvent, Base
from app.schemas.analytics import AnalyticsEventCreate

_analytics_events_initialized = False
_analytics_events_memory: list[dict[str, Any]] = []
_analytics_events_lock = Lock()
_analytics_events_memory_id = 0


def _ensure_analytics_events_table() -> None:
    global _analytics_events_initialized

    if _analytics_events_initialized:
        return

    Base.metadata.create_all(bind=engine, tables=[AnalyticsEvent.__table__])
    _analytics_events_initialized = True


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _event_to_dict(event: AnalyticsEvent) -> dict[str, Any]:
    return {
        "id": int(event.id),
        "event_name": event.event_name,
        "session_id": event.session_id,
        "user_id": event.user_id,
        "customer_email": event.customer_email,
        "product_id": event.product_id,
        "order_id": event.order_id,
        "routine_id": event.routine_id,
        "source": event.source,
        "path": event.path,
        "metadata_json": event.metadata_json or {},
        "created_at": _normalize_datetime(event.created_at),
    }


def _build_memory_event(payload: AnalyticsEventCreate) -> dict[str, Any]:
    global _analytics_events_memory_id

    with _analytics_events_lock:
        _analytics_events_memory_id += 1
        event = {
            "id": _analytics_events_memory_id,
            "event_name": payload.event_name,
            "session_id": payload.session_id,
            "user_id": payload.user_id,
            "customer_email": str(payload.customer_email) if payload.customer_email else None,
            "product_id": payload.product_id,
            "order_id": payload.order_id,
            "routine_id": payload.routine_id,
            "source": payload.source,
            "path": payload.path,
            "metadata_json": deepcopy(payload.metadata_json) if payload.metadata_json else {},
            "created_at": datetime.now(timezone.utc),
        }
        _analytics_events_memory.append(event)
        return deepcopy(event)


def create_analytics_event(
    db: Session,
    payload: AnalyticsEventCreate,
) -> dict[str, Any]:
    try:
        _ensure_analytics_events_table()
        event = AnalyticsEvent(
            event_name=payload.event_name,
            session_id=payload.session_id,
            user_id=payload.user_id,
            customer_email=str(payload.customer_email) if payload.customer_email else None,
            product_id=payload.product_id,
            order_id=payload.order_id,
            routine_id=payload.routine_id,
            source=payload.source,
            path=payload.path,
            metadata_json=payload.metadata_json or {},
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return _event_to_dict(event)
    except SQLAlchemyError:
        db.rollback()
        return _build_memory_event(payload)


def list_analytics_events(
    db: Session,
    *,
    event_names: Iterable[str] | None = None,
) -> list[dict[str, Any]]:
    normalized_names = {str(name).strip() for name in event_names or [] if str(name).strip()}

    try:
        _ensure_analytics_events_table()
        query = db.query(AnalyticsEvent)
        if normalized_names:
            query = query.filter(AnalyticsEvent.event_name.in_(normalized_names))
        rows = query.order_by(AnalyticsEvent.created_at.asc(), AnalyticsEvent.id.asc()).all()
        return [_event_to_dict(row) for row in rows]
    except SQLAlchemyError:
        db.rollback()
        rows = deepcopy(_analytics_events_memory)
        if normalized_names:
            rows = [row for row in rows if str(row.get("event_name") or "") in normalized_names]
        return rows
