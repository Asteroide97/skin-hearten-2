from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.commercial_content import CommercialContentRead
from app.services.commercial_content import get_commercial_content

router = APIRouter()


@router.get("/commercial-content", response_model=CommercialContentRead)
def read_commercial_content(db: Session = Depends(get_db)) -> CommercialContentRead:
    return CommercialContentRead.model_validate(get_commercial_content(db))
