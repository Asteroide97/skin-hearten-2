from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models import Base, Routine, RoutineProductLink, RoutineStep
from app.schemas.routine import RoutineWrite
from app.services.catalog_store import get_catalog_product
from app.services.mock_store import (
    create_routine as create_mock_routine,
    delete_routine as delete_mock_routine,
    duplicate_routine as duplicate_mock_routine,
    get_routine as get_mock_routine,
    list_routines as list_mock_routines,
    resolve_routine as resolve_mock_routine,
    update_routine as update_mock_routine,
)


def _slugify(value: str) -> str:
    normalized = value.strip().lower()
    return "-".join(part for part in normalized.split() if part)


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def ensure_routine_tables(db: Session) -> None:
    try:
        Base.metadata.create_all(
            bind=db.get_bind(),
            tables=[Routine.__table__, RoutineStep.__table__, RoutineProductLink.__table__],
        )
    except Exception:
        db.rollback()


def _build_unique_slug(db: Session, name: str, *, exclude_id: int | None = None) -> str:
    base_slug = _slugify(name) or "rutina"
    candidate = base_slug
    suffix = 2

    while True:
        query = db.query(Routine).filter(Routine.slug == candidate)
        if exclude_id is not None:
            query = query.filter(Routine.id != exclude_id)
        if not query.first():
            return candidate
        candidate = f"{base_slug}-{suffix}"
        suffix += 1


def _normalize_linked_products(payload: RoutineWrite) -> list[dict[str, Any]]:
    links = [
        {
            "product_id": linked_product.product_id,
            "is_primary": linked_product.is_primary,
            "priority": linked_product.priority,
        }
        for linked_product in payload.linked_products
    ]

    known_product_ids = {entry["product_id"] for entry in links}
    for index, step in enumerate(sorted(payload.steps, key=lambda entry: entry.order)):
        if step.product_id in known_product_ids:
            continue
        links.append(
            {
                "product_id": step.product_id,
                "is_primary": False,
                "priority": len(links) + index,
            }
        )
        known_product_ids.add(step.product_id)

    if links and not any(entry["is_primary"] for entry in links):
        links[0]["is_primary"] = True

    return links


def _serialize_step(db: Session, step: RoutineStep | dict[str, Any]) -> dict[str, Any]:
    if isinstance(step, dict):
        product_id = int(step["product_id"])
        sort_order = int(step.get("sort_order") or 0)
        title = str(step.get("title") or "")
        short_description = str(step.get("short_description") or "")
        image_url = step.get("image_url")
        badge = step.get("badge")
        step_id = int(step.get("id") or 0)
    else:
        product_id = int(step.product_id)
        sort_order = int(step.sort_order)
        title = step.title
        short_description = step.short_description
        image_url = step.image_url
        badge = step.badge
        step_id = int(step.id)

    product = get_catalog_product(db, str(product_id)) or {}
    image = str(image_url or product.get("image") or "").strip() or None
    benefit = str(product.get("highlight") or "").strip() or None
    price = float(product.get("price")) if product.get("price") is not None else None

    return {
        "id": step_id,
        "order": sort_order,
        "productId": product_id,
        "productName": str(product.get("name") or f"Producto #{product_id}"),
        "productSlug": str(product.get("slug") or ""),
        "productImage": image,
        "productBenefit": benefit,
        "productGradient": str(product.get("gradient") or "").strip() or None,
        "productPrice": price,
        "title": title,
        "shortDescription": short_description,
        "image": image,
        "badge": badge,
    }


def _serialize_linked_product(db: Session, link: RoutineProductLink | dict[str, Any]) -> dict[str, Any]:
    if isinstance(link, dict):
        product_id = int(link["product_id"])
        is_primary = bool(link.get("is_primary", False))
        priority = int(link.get("priority") or 0)
        link_id = int(link.get("id") or 0)
    else:
        product_id = int(link.product_id)
        is_primary = bool(link.is_primary)
        priority = int(link.priority)
        link_id = int(link.id)

    product = get_catalog_product(db, str(product_id)) or {}
    return {
        "id": link_id,
        "productId": product_id,
        "productName": str(product.get("name") or f"Producto #{product_id}"),
        "productSlug": str(product.get("slug") or ""),
        "isPrimary": is_primary,
        "priority": priority,
    }


def _serialize_routine(
    db: Session,
    routine: Routine | dict[str, Any],
) -> dict[str, Any]:
    if isinstance(routine, dict):
        steps = [_serialize_step(db, step) for step in sorted(routine.get("steps", []), key=lambda entry: int(entry.get("sort_order") or 0))]
        linked_products = [
            _serialize_linked_product(db, linked_product)
            for linked_product in sorted(routine.get("linked_products", []), key=lambda entry: (int(entry.get("priority") or 0), int(entry.get("id") or 0)))
        ]
        return {
            "id": int(routine["id"]),
            "name": str(routine.get("name") or ""),
            "slug": str(routine.get("slug") or ""),
            "description": routine.get("description"),
            "isActive": bool(routine.get("is_active", True)),
            "image": routine.get("image_url"),
            "color": routine.get("color"),
            "goalKey": routine.get("goal_key"),
            "categoryKey": routine.get("category_key"),
            "steps": steps,
            "linkedProducts": linked_products,
        }

    return {
        "id": int(routine.id),
        "name": routine.name,
        "slug": routine.slug,
        "description": routine.description,
        "isActive": bool(routine.is_active),
        "image": routine.image_url,
        "color": routine.color,
        "goalKey": routine.goal_key,
        "categoryKey": routine.category_key,
        "steps": [_serialize_step(db, step) for step in sorted(routine.steps, key=lambda entry: entry.sort_order)],
        "linkedProducts": [
            _serialize_linked_product(db, linked_product)
            for linked_product in sorted(routine.product_links, key=lambda entry: (entry.priority, entry.id))
        ],
    }


def list_routines(db: Session) -> list[dict[str, Any]]:
    ensure_routine_tables(db)
    try:
        routines = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .order_by(Routine.name.asc())
            .all()
        )
        if routines:
            return [_serialize_routine(db, routine) for routine in routines]
    except SQLAlchemyError:
        db.rollback()

    return [_serialize_routine(db, routine) for routine in list_mock_routines()]


def get_routine(db: Session, routine_id: int) -> dict[str, Any] | None:
    ensure_routine_tables(db)
    try:
        routine = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .filter(Routine.id == routine_id)
            .first()
        )
        if routine:
            return _serialize_routine(db, routine)
    except SQLAlchemyError:
        db.rollback()

    routine = get_mock_routine(routine_id)
    return _serialize_routine(db, routine) if routine else None


def create_routine(db: Session, payload: RoutineWrite) -> dict[str, Any]:
    ensure_routine_tables(db)
    normalized_links = _normalize_linked_products(payload)

    try:
        routine = Routine(
            name=payload.name.strip(),
            slug=_build_unique_slug(db, payload.name),
            description=_normalize_optional(payload.description),
            is_active=payload.is_active,
            image_url=_normalize_optional(payload.image),
            color=_normalize_optional(payload.color),
            goal_key=_normalize_optional(payload.goal_key),
            category_key=_normalize_optional(payload.category_key),
        )
        db.add(routine)
        db.flush()

        for step in sorted(payload.steps, key=lambda entry: entry.order):
            db.add(
                RoutineStep(
                    routine_id=routine.id,
                    sort_order=step.order,
                    product_id=step.product_id,
                    title=step.title.strip(),
                    short_description=step.short_description.strip(),
                    image_url=_normalize_optional(step.image),
                    badge=_normalize_optional(step.badge),
                )
            )

        for linked_product in normalized_links:
            db.add(
                RoutineProductLink(
                    routine_id=routine.id,
                    product_id=int(linked_product["product_id"]),
                    is_primary=bool(linked_product["is_primary"]),
                    priority=int(linked_product["priority"]),
                )
            )

        db.commit()
        db.refresh(routine)
        routine = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .filter(Routine.id == routine.id)
            .first()
        )
        if not routine:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Routine was not created")
        return _serialize_routine(db, routine)
    except SQLAlchemyError:
        db.rollback()
        return _serialize_routine(
            db,
            create_mock_routine(
                {
                    "name": payload.name,
                    "description": payload.description,
                    "is_active": payload.is_active,
                    "image_url": payload.image,
                    "color": payload.color,
                    "goal_key": payload.goal_key,
                    "category_key": payload.category_key,
                    "steps": [
                        {
                            "sort_order": step.order,
                            "product_id": step.product_id,
                            "title": step.title,
                            "short_description": step.short_description,
                            "image_url": step.image,
                            "badge": step.badge,
                        }
                        for step in payload.steps
                    ],
                    "linked_products": normalized_links,
                }
            ),
        )


def update_routine(db: Session, routine_id: int, payload: RoutineWrite) -> dict[str, Any] | None:
    ensure_routine_tables(db)
    normalized_links = _normalize_linked_products(payload)

    try:
        routine = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .filter(Routine.id == routine_id)
            .first()
        )
        if not routine:
            return None

        routine.name = payload.name.strip()
        routine.slug = _build_unique_slug(db, payload.name, exclude_id=routine_id)
        routine.description = _normalize_optional(payload.description)
        routine.is_active = payload.is_active
        routine.image_url = _normalize_optional(payload.image)
        routine.color = _normalize_optional(payload.color)
        routine.goal_key = _normalize_optional(payload.goal_key)
        routine.category_key = _normalize_optional(payload.category_key)

        routine.steps.clear()
        routine.product_links.clear()
        db.flush()

        for step in sorted(payload.steps, key=lambda entry: entry.order):
            routine.steps.append(
                RoutineStep(
                    sort_order=step.order,
                    product_id=step.product_id,
                    title=step.title.strip(),
                    short_description=step.short_description.strip(),
                    image_url=_normalize_optional(step.image),
                    badge=_normalize_optional(step.badge),
                )
            )

        for linked_product in normalized_links:
            routine.product_links.append(
                RoutineProductLink(
                    product_id=int(linked_product["product_id"]),
                    is_primary=bool(linked_product["is_primary"]),
                    priority=int(linked_product["priority"]),
                )
            )

        db.add(routine)
        db.commit()
        db.refresh(routine)
        routine = (
            db.query(Routine)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .filter(Routine.id == routine_id)
            .first()
        )
        return _serialize_routine(db, routine) if routine else None
    except SQLAlchemyError:
        db.rollback()
        routine = update_mock_routine(
            routine_id,
            {
                "name": payload.name,
                "description": payload.description,
                "is_active": payload.is_active,
                "image_url": payload.image,
                "color": payload.color,
                "goal_key": payload.goal_key,
                "category_key": payload.category_key,
                "steps": [
                    {
                        "sort_order": step.order,
                        "product_id": step.product_id,
                        "title": step.title,
                        "short_description": step.short_description,
                        "image_url": step.image,
                        "badge": step.badge,
                    }
                    for step in payload.steps
                ],
                "linked_products": normalized_links,
            },
        )
        return _serialize_routine(db, routine) if routine else None


def delete_routine(db: Session, routine_id: int) -> bool:
    ensure_routine_tables(db)
    try:
        routine = db.query(Routine).filter(Routine.id == routine_id).first()
        if not routine:
            return False
        db.delete(routine)
        db.commit()
        return True
    except SQLAlchemyError:
        db.rollback()
        return delete_mock_routine(routine_id)


def duplicate_routine(db: Session, routine_id: int) -> dict[str, Any] | None:
    ensure_routine_tables(db)
    original = get_routine(db, routine_id)
    if not original:
        return None

    duplicate_payload = RoutineWrite.model_validate(
        {
            "name": f'{original["name"]} Copy',
            "description": original.get("description"),
            "isActive": original.get("isActive", True),
            "image": original.get("image"),
            "color": original.get("color"),
            "goalKey": original.get("goalKey"),
            "categoryKey": original.get("categoryKey"),
            "steps": [
                {
                    "order": step["order"],
                    "productId": step["productId"],
                    "title": step["title"],
                    "shortDescription": step["shortDescription"],
                    "image": step.get("image"),
                    "badge": step.get("badge"),
                }
                for step in original.get("steps", [])
            ],
            "linkedProducts": [
                {
                    "productId": linked_product["productId"],
                    "isPrimary": linked_product["isPrimary"],
                    "priority": linked_product.get("priority", 0),
                }
                for linked_product in original.get("linkedProducts", [])
            ],
        }
    )

    try:
        return create_routine(db, duplicate_payload)
    except Exception:
        routine = duplicate_mock_routine(routine_id)
        return _serialize_routine(db, routine) if routine else None


def _find_matching_link(routine: Routine | dict[str, Any], product_id: int) -> dict[str, Any] | RoutineProductLink | None:
    if isinstance(routine, dict):
        return next(
            (
                linked_product
                for linked_product in routine.get("linked_products", [])
                if int(linked_product.get("product_id") or 0) == product_id
            ),
            None,
        )
    return next((linked_product for linked_product in routine.product_links if int(linked_product.product_id) == product_id), None)


def _matches_goal(value: str | None, goal: str | None) -> bool:
    if not value or not goal:
        return False
    return value.strip().lower() == goal.strip().lower()


def _matches_category(value: str | None, category: str | None) -> bool:
    if not value or not category:
        return False
    return _slugify(value) == _slugify(category)


def _candidate_sort_key(
    routine: Routine | dict[str, Any],
    *,
    product_id: int,
    goal: str | None,
    category: str | None,
    source: str,
) -> tuple[int, int, int, int]:
    link = _find_matching_link(routine, product_id)
    goal_match = int(_matches_goal(routine.goal_key if isinstance(routine, Routine) else routine.get("goal_key"), goal))
    category_match = int(_matches_category(routine.category_key if isinstance(routine, Routine) else routine.get("category_key"), category))
    if isinstance(link, dict):
        is_primary = int(bool(link.get("is_primary", False)))
        priority = int(link.get("priority") or 0)
    elif link:
        is_primary = int(bool(link.is_primary))
        priority = int(link.priority)
    else:
        is_primary = 0
        priority = 999

    if source == "skin_quiz":
        return (goal_match, is_primary, category_match, -priority)
    if source == "category":
        return (category_match, is_primary, goal_match, -priority)
    return (is_primary, goal_match, category_match, -priority)


def resolve_routine(
    db: Session,
    *,
    product_ref: str,
    goal: str | None = None,
    category: str | None = None,
    source: str = "product",
) -> tuple[dict[str, Any] | None, str | None]:
    ensure_routine_tables(db)
    product = get_catalog_product(db, product_ref)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product_id = int(product["id"])

    try:
        candidates = (
            db.query(Routine)
            .join(RoutineProductLink, RoutineProductLink.routine_id == Routine.id)
            .options(selectinload(Routine.steps), selectinload(Routine.product_links))
            .filter(Routine.is_active.is_(True), RoutineProductLink.product_id == product_id)
            .all()
        )
        if not candidates:
            candidates = (
                db.query(Routine)
                .join(RoutineStep, RoutineStep.routine_id == Routine.id)
                .options(selectinload(Routine.steps), selectinload(Routine.product_links))
                .filter(Routine.is_active.is_(True), RoutineStep.product_id == product_id)
                .all()
            )
        if candidates:
            selected = sorted(
                candidates,
                key=lambda routine: _candidate_sort_key(
                    routine,
                    product_id=product_id,
                    goal=goal,
                    category=category,
                    source=source,
                ),
                reverse=True,
            )[0]

            link = _find_matching_link(selected, product_id)
            goal_match = _matches_goal(selected.goal_key, goal)
            category_match = _matches_category(selected.category_key, category)
            if source == "skin_quiz" and goal_match:
                matched_by = "goal"
            elif source == "category" and category_match:
                matched_by = "category"
            elif link and getattr(link, "is_primary", False):
                matched_by = "primary_product"
            elif goal_match:
                matched_by = "goal"
            elif category_match:
                matched_by = "category"
            else:
                matched_by = "linked_product"
            return _serialize_routine(db, selected), matched_by
    except SQLAlchemyError:
        db.rollback()

    resolved = resolve_mock_routine(product_ref=product_ref, goal=goal, category=category, source=source)
    if not resolved:
        return None, None

    return _serialize_routine(db, resolved["routine"]), resolved.get("matched_by")
