from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.newsletter import NewsletterSubscriptionCreate, NewsletterSubscriptionResponse
from app.services.crm import subscribe_newsletter_contact

router = APIRouter(prefix="/newsletter")


@router.post("/subscriptions", response_model=NewsletterSubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_newsletter_subscription(
    payload: NewsletterSubscriptionCreate,
    db: Session = Depends(get_db),
) -> NewsletterSubscriptionResponse:
    subscription = subscribe_newsletter_contact(db, payload=payload)
    return NewsletterSubscriptionResponse.model_validate(subscription)
