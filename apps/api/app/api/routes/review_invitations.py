from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.review import ReviewInvitationPublicRead, ReviewInvitationSubmit, ReviewInvitationSubmitResponse
from app.services.review_invitations import get_review_invitation, submit_review_invitation

router = APIRouter(prefix="/reviews/invitations")


@router.get("/{token}", response_model=ReviewInvitationPublicRead)
def get_review_invitation_public(
    token: str,
    db: Session = Depends(get_db),
) -> ReviewInvitationPublicRead:
    invitation = get_review_invitation(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return ReviewInvitationPublicRead.model_validate(invitation)


@router.post("/{token}/submit", response_model=ReviewInvitationSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_review_invitation_public(
    token: str,
    payload: ReviewInvitationSubmit,
    db: Session = Depends(get_db),
) -> ReviewInvitationSubmitResponse:
    review = submit_review_invitation(db, token, payload)
    return ReviewInvitationSubmitResponse.model_validate(review)
