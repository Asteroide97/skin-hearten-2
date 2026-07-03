from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_db
from app.schemas.common import MessageResponse
from app.schemas.routine import RoutineRead, RoutineWrite
from app.services.routines import (
    create_routine,
    delete_routine,
    duplicate_routine,
    get_routine,
    list_routines,
    update_routine,
)

router = APIRouter(prefix="/admin/routines")


@router.get("", response_model=list[RoutineRead])
def list_admin_routines(
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[RoutineRead]:
    return [RoutineRead.model_validate(routine) for routine in list_routines(db)]


@router.get("/{routine_id}", response_model=RoutineRead)
def get_admin_routine(
    routine_id: int,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> RoutineRead:
    routine = get_routine(db, routine_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return RoutineRead.model_validate(routine)


@router.post("", response_model=RoutineRead, status_code=status.HTTP_201_CREATED)
def create_admin_routine(
    payload: RoutineWrite,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> RoutineRead:
    routine = create_routine(db, payload)
    return RoutineRead.model_validate(routine)


@router.put("/{routine_id}", response_model=RoutineRead)
def update_admin_routine(
    routine_id: int,
    payload: RoutineWrite,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> RoutineRead:
    routine = update_routine(db, routine_id, payload)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return RoutineRead.model_validate(routine)


@router.delete("/{routine_id}", response_model=MessageResponse)
def delete_admin_routine(
    routine_id: int,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> MessageResponse:
    deleted = delete_routine(db, routine_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return MessageResponse(message="Routine deleted")


@router.post("/{routine_id}/duplicate", response_model=RoutineRead)
def duplicate_admin_routine(
    routine_id: int,
    _: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> RoutineRead:
    routine = duplicate_routine(db, routine_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return RoutineRead.model_validate(routine)
