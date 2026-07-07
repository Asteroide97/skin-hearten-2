from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CommercialActionType = Literal["url", "category", "collection", "skin_quiz", "page", "routine", "search", "product"]
CommercialNavigationType = Literal["url", "category", "collection", "skin_quiz", "page", "routine"]


class CommercialNavItem(BaseModel):
    id: int | None = None
    name: str = Field(min_length=1, max_length=120)
    order: int = Field(default=0, ge=0)
    active: bool = True
    type: CommercialNavigationType
    value: str = Field(min_length=1, max_length=512)

    model_config = ConfigDict(populate_by_name=True)


class CommercialQuickLinkItem(BaseModel):
    id: int | None = None
    name: str = Field(min_length=1, max_length=120)
    icon: str | None = Field(default=None, max_length=40)
    order: int = Field(default=0, ge=0)
    active: bool = True
    action: CommercialActionType
    value: str = Field(min_length=1, max_length=512)

    model_config = ConfigDict(populate_by_name=True)


class CommercialHeroButton(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    type: CommercialActionType
    value: str = Field(min_length=1, max_length=512)

    model_config = ConfigDict(populate_by_name=True)


class CommercialHero(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    subtitle: str | None = Field(default=None, max_length=1200)
    primary_button: CommercialHeroButton = Field(serialization_alias="primaryButton", validation_alias="primaryButton")
    secondary_button: CommercialHeroButton = Field(
        serialization_alias="secondaryButton",
        validation_alias="secondaryButton",
    )
    tertiary_button: CommercialHeroButton | None = Field(
        default=None,
        serialization_alias="tertiaryButton",
        validation_alias="tertiaryButton",
    )
    image: str | None = Field(default=None, max_length=512)
    video: str | None = Field(default=None, max_length=512)
    background_color: str | None = Field(
        default=None,
        max_length=64,
        serialization_alias="backgroundColor",
        validation_alias="backgroundColor",
    )
    is_visible: bool = Field(default=True, serialization_alias="isVisible", validation_alias="isVisible")
    trust_signals: list[str] = Field(
        default_factory=list,
        serialization_alias="trustSignals",
        validation_alias="trustSignals",
    )

    model_config = ConfigDict(populate_by_name=True)


class CommercialSectionItem(BaseModel):
    id: int | None = None
    key: str = Field(min_length=1, max_length=80)
    eyebrow: str | None = Field(default=None, max_length=120)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1200)
    cta_label: str | None = Field(
        default=None,
        max_length=120,
        serialization_alias="ctaLabel",
        validation_alias="ctaLabel",
    )
    cta_type: CommercialActionType | None = Field(
        default=None,
        serialization_alias="ctaType",
        validation_alias="ctaType",
    )
    cta_value: str | None = Field(
        default=None,
        max_length=512,
        serialization_alias="ctaValue",
        validation_alias="ctaValue",
    )
    order: int = Field(default=0, ge=0)
    active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class CommercialBannerItem(BaseModel):
    id: int | None = None
    key: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    message: str | None = Field(default=None, max_length=600)
    value: str | None = Field(default=None, max_length=512)
    order: int = Field(default=0, ge=0)
    active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class CommercialFooterLink(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    type: CommercialActionType = "url"
    value: str = Field(min_length=1, max_length=512)

    model_config = ConfigDict(populate_by_name=True)


class CommercialFooterColumn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    links: list[CommercialFooterLink] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class CommercialSocialLink(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    url: str = Field(min_length=1, max_length=512)

    model_config = ConfigDict(populate_by_name=True)


class CommercialHeader(BaseModel):
    logo_text: str = Field(
        min_length=1,
        max_length=120,
        serialization_alias="logoText",
        validation_alias="logoText",
    )
    logo_image: str | None = Field(
        default=None,
        max_length=512,
        serialization_alias="logoImage",
        validation_alias="logoImage",
    )
    top_left_text: str | None = Field(
        default=None,
        max_length=255,
        serialization_alias="topLeftText",
        validation_alias="topLeftText",
    )
    top_right_text: str | None = Field(
        default=None,
        max_length=255,
        serialization_alias="topRightText",
        validation_alias="topRightText",
    )
    support_whatsapp_url: str | None = Field(
        default=None,
        max_length=512,
        serialization_alias="supportWhatsAppUrl",
        validation_alias="supportWhatsAppUrl",
    )

    model_config = ConfigDict(populate_by_name=True)


class CommercialFooter(BaseModel):
    intro_text: str | None = Field(
        default=None,
        max_length=1200,
        serialization_alias="introText",
        validation_alias="introText",
    )
    contact_lines: list[str] = Field(
        default_factory=list,
        serialization_alias="contactLines",
        validation_alias="contactLines",
    )
    columns: list[CommercialFooterColumn] = Field(default_factory=list)
    legal_links: list[CommercialFooterLink] = Field(
        default_factory=list,
        serialization_alias="legalLinks",
        validation_alias="legalLinks",
    )
    social_links: list[CommercialSocialLink] = Field(
        default_factory=list,
        serialization_alias="socialLinks",
        validation_alias="socialLinks",
    )
    notice_text: str | None = Field(
        default=None,
        max_length=1200,
        serialization_alias="noticeText",
        validation_alias="noticeText",
    )

    model_config = ConfigDict(populate_by_name=True)


class CommercialRoutineGuideStep(BaseModel):
    eyebrow: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=600)

    model_config = ConfigDict(populate_by_name=True)


class CommercialSciencePoint(BaseModel):
    eyebrow: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=600)

    model_config = ConfigDict(populate_by_name=True)


class CommercialHomeTestimonial(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    city: str = Field(min_length=1, max_length=120)
    rating: float = Field(ge=1, le=5)
    text: str = Field(min_length=1, max_length=1000)

    model_config = ConfigDict(populate_by_name=True)


class CommercialContentRead(BaseModel):
    store_key: str = Field(serialization_alias="storeKey", validation_alias="storeKey")
    header: CommercialHeader
    navigation: list[CommercialNavItem] = Field(default_factory=list)
    quick_links: list[CommercialQuickLinkItem] = Field(
        default_factory=list,
        serialization_alias="quickLinks",
        validation_alias="quickLinks",
    )
    hero: CommercialHero
    sections: list[CommercialSectionItem] = Field(default_factory=list)
    banners: list[CommercialBannerItem] = Field(default_factory=list)
    footer: CommercialFooter
    routine_guide_steps: list[CommercialRoutineGuideStep] = Field(
        default_factory=list,
        serialization_alias="routineGuideSteps",
        validation_alias="routineGuideSteps",
    )
    science_points: list[CommercialSciencePoint] = Field(
        default_factory=list,
        serialization_alias="sciencePoints",
        validation_alias="sciencePoints",
    )
    home_testimonials: list[CommercialHomeTestimonial] = Field(
        default_factory=list,
        serialization_alias="homeTestimonials",
        validation_alias="homeTestimonials",
    )

    model_config = ConfigDict(populate_by_name=True)


class CommercialContentWrite(CommercialContentRead):
    pass
