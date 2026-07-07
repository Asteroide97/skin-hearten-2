from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.schemas.review import AdminReviewInvitationCreate, AdminReviewInvitationRead
from app.services.review_invitations import create_admin_review_invitation, list_admin_review_invitations

router = APIRouter(prefix="/admin/review-invitations")


@router.get("", response_model=list[AdminReviewInvitationRead])
def list_review_invitations_admin(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminReviewInvitationRead]:
    invitations = list_admin_review_invitations(db)
    return [AdminReviewInvitationRead.model_validate(invitation) for invitation in invitations]


@router.post("", response_model=AdminReviewInvitationRead, status_code=201)
def create_review_invitation_admin(
    payload: AdminReviewInvitationCreate,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminReviewInvitationRead:
    invitation = create_admin_review_invitation(db, payload)
    return AdminReviewInvitationRead.model_validate(invitation)
