from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class RoutineLinkedProductRead(BaseModel):
    id: int
    product_id: int = Field(serialization_alias="productId")
    product_name: str = Field(serialization_alias="productName")
    product_slug: str = Field(serialization_alias="productSlug")
    is_primary: bool = Field(serialization_alias="isPrimary")
    priority: int = 0

    model_config = ConfigDict(populate_by_name=True)


class RoutineLinkedProductWrite(BaseModel):
    product_id: int = Field(alias="productId")
    is_primary: bool = Field(default=False, alias="isPrimary")
    priority: int = Field(default=0, ge=0)

    model_config = ConfigDict(populate_by_name=True)


class RoutineStepRead(BaseModel):
    id: int
    order: int
    product_id: int = Field(serialization_alias="productId")
    product_name: str = Field(serialization_alias="productName")
    product_slug: str = Field(serialization_alias="productSlug")
    product_image: str | None = Field(default=None, serialization_alias="productImage")
    product_benefit: str | None = Field(default=None, serialization_alias="productBenefit")
    product_gradient: str | None = Field(default=None, serialization_alias="productGradient")
    product_price: float | None = Field(default=None, serialization_alias="productPrice")
    title: str
    short_description: str = Field(serialization_alias="shortDescription")
    image: str | None = None
    badge: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class RoutineStepWrite(BaseModel):
    order: int = Field(ge=0)
    product_id: int = Field(alias="productId")
    title: str = Field(min_length=2, max_length=255)
    short_description: str = Field(alias="shortDescription", min_length=2, max_length=500)
    image: str | None = Field(default=None, max_length=512)
    badge: str | None = Field(default=None, max_length=80)

    model_config = ConfigDict(populate_by_name=True)


class RoutineRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    is_active: bool = Field(serialization_alias="isActive")
    image: str | None = None
    color: str | None = None
    goal_key: str | None = Field(default=None, serialization_alias="goalKey")
    category_key: str | None = Field(default=None, serialization_alias="categoryKey")
    steps: list[RoutineStepRead] = Field(default_factory=list)
    linked_products: list[RoutineLinkedProductRead] = Field(default_factory=list, serialization_alias="linkedProducts")

    model_config = ConfigDict(populate_by_name=True)


class RoutineWrite(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = Field(default=True, alias="isActive")
    image: str | None = Field(default=None, max_length=512)
    color: str | None = Field(default=None, max_length=64)
    goal_key: str | None = Field(default=None, alias="goalKey", max_length=80)
    category_key: str | None = Field(default=None, alias="categoryKey", max_length=120)
    steps: list[RoutineStepWrite] = Field(default_factory=list)
    linked_products: list[RoutineLinkedProductWrite] = Field(default_factory=list, alias="linkedProducts")

    model_config = ConfigDict(populate_by_name=True)


class RoutineResolveResponse(BaseModel):
    routine: RoutineRead | None = None
    matched_by: str | None = Field(default=None, serialization_alias="matchedBy")

    model_config = ConfigDict(populate_by_name=True)
