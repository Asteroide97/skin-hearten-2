from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_db
from app.schemas.commercial_content import CommercialContentRead, CommercialContentWrite
from app.services.commercial_content import get_commercial_content, save_commercial_content

router = APIRouter(prefix="/admin/commercial-content")


@router.get("", response_model=CommercialContentRead)
def get_admin_commercial_content(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> CommercialContentRead:
    return CommercialContentRead.model_validate(get_commercial_content(db))


@router.put("", response_model=CommercialContentRead)
def update_admin_commercial_content(
    payload: CommercialContentWrite,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> CommercialContentRead:
    return CommercialContentRead.model_validate(save_commercial_content(db, payload))
