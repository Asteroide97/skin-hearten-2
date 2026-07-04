from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.analytics import AnalyticsEventCreate, AnalyticsEventCreateResponse
from app.services.analytics_events import create_analytics_event

router = APIRouter(prefix="/analytics")


@router.post("/events", response_model=AnalyticsEventCreateResponse, status_code=status.HTTP_202_ACCEPTED)
def create_public_analytics_event(
    payload: AnalyticsEventCreate,
    db: Session = Depends(get_db),
) -> AnalyticsEventCreateResponse:
    event = create_analytics_event(db, payload)
    return AnalyticsEventCreateResponse.model_validate(event)
