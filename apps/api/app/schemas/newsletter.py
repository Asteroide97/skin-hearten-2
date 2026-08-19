from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class NewsletterSubscriptionCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=120, alias="firstName")
    email: EmailStr
    accepted_marketing: bool = Field(alias="acceptedMarketing")
    source: Literal["home", "footer"] = "home"

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("accepted_marketing")
    @classmethod
    def validate_marketing_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("acceptedMarketing must be true to subscribe")
        return value


class NewsletterSubscriptionResponse(BaseModel):
    contact_id: int = Field(serialization_alias="contactId")
    created_at: datetime = Field(serialization_alias="createdAt")
    source: str
    status: Literal["subscribed"]

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
