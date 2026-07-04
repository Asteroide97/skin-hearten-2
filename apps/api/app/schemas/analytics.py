from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

AllowedAnalyticsEventName = Literal[
    "site_visit",
    "search_submitted",
    "skin_quiz_started",
    "skin_quiz_completed",
    "product_viewed",
    "routine_builder_opened",
    "routine_full_added",
    "routine_single_added",
    "cart_viewed",
    "checkout_started",
    "checkout_completed",
    "review_started",
    "review_submitted",
]

_BLOCKED_METADATA_TOKENS = (
    "card",
    "cvc",
    "cvv",
    "password",
    "secret",
    "token",
    "payment_method_details",
)
_MAX_METADATA_LENGTH = 4000


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().split())
    return normalized or None


def _contains_blocked_metadata(value: Any) -> bool:
    if isinstance(value, dict):
        for key, nested_value in value.items():
            normalized_key = str(key).strip().lower()
            if any(token in normalized_key for token in _BLOCKED_METADATA_TOKENS):
                return True
            if _contains_blocked_metadata(nested_value):
                return True
        return False

    if isinstance(value, (list, tuple, set)):
        return any(_contains_blocked_metadata(item) for item in value)

    return False


class AnalyticsEventCreate(BaseModel):
    event_name: AllowedAnalyticsEventName = Field(alias="eventName")
    session_id: str | None = Field(default=None, alias="sessionId", max_length=120)
    user_id: int | None = Field(default=None, alias="userId", ge=1)
    customer_email: EmailStr | None = Field(default=None, alias="customerEmail")
    product_id: int | None = Field(default=None, alias="productId", ge=1)
    order_id: int | None = Field(default=None, alias="orderId", ge=1)
    routine_id: int | None = Field(default=None, alias="routineId", ge=1)
    source: str | None = Field(default=None, max_length=120)
    path: str | None = Field(default=None, max_length=512)
    metadata_json: dict[str, Any] | None = Field(default=None, alias="metadata")

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    @field_validator("session_id", "source", "path", mode="before")
    @classmethod
    def normalize_text_fields(cls, value: str | None) -> str | None:
        return _normalize_optional_text(value)

    @field_validator("metadata_json")
    @classmethod
    def validate_metadata(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        if value is None:
            return None

        if _contains_blocked_metadata(value):
            raise ValueError("metadata contains restricted fields")

        serialized = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        if len(serialized) > _MAX_METADATA_LENGTH:
            raise ValueError("metadata is too large")

        return value


class AnalyticsEventCreateResponse(BaseModel):
    id: int
    created_at: datetime = Field(serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
