from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.routine import RoutineResolveResponse
from app.services.routines import resolve_routine

router = APIRouter(prefix="/routines")


@router.get("/resolve", response_model=RoutineResolveResponse)
def resolve_storefront_routine(
    product: str = Query(..., min_length=1),
    goal: str | None = None,
    category: str | None = None,
    source: str = Query(default="product"),
    db: Session = Depends(get_db),
) -> RoutineResolveResponse:
    routine, matched_by = resolve_routine(
        db,
        product_ref=product,
        goal=goal,
        category=category,
        source=source,
    )
    return RoutineResolveResponse.model_validate(
        {
            "routine": routine,
            "matchedBy": matched_by,
        }
    )
