from __future__ import annotations

from copy import deepcopy
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.models import Base, CommercialBanner, CommercialContent, CommercialNavigation, CommercialQuickLink, CommercialSection
from app.schemas.commercial_content import CommercialContentWrite

DEFAULT_STORE_KEY = "default"

_memory_commercial_content: dict[str, Any] | None = None


def _default_navigation() -> list[dict[str, Any]]:
    return [
        {"name": "Mas Vendidos", "order": 0, "active": True, "type": "collection", "value": "best-sellers"},
        {"name": "OFERTA", "order": 1, "active": True, "type": "collection", "value": "offers"},
        {"name": "Productos", "order": 2, "active": True, "type": "page", "value": "productos"},
        {"name": "Kits y Duos", "order": 3, "active": True, "type": "url", "value": "/productos?q=kit"},
        {"name": "Tipo de Piel", "order": 4, "active": True, "type": "page", "value": "productos"},
        {"name": "Blog", "order": 5, "active": True, "type": "page", "value": "blog"},
        {"name": "Cuenta", "order": 6, "active": True, "type": "page", "value": "cuenta"},
    ]


def _default_quick_links() -> list[dict[str, Any]]:
    return [
        {"name": "Diagnostico en 2 minutos", "icon": "Q", "order": 0, "active": True, "action": "skin_quiz", "value": "home"},
        {"name": "Tengo manchas", "icon": "M", "order": 1, "active": True, "action": "search", "value": "manchas"},
        {"name": "Mi piel es sensible", "icon": "~", "order": 2, "active": True, "action": "search", "value": "piel sensible"},
        {"name": "Quiero una rutina", "icon": "R", "order": 3, "active": True, "action": "search", "value": "quiero una rutina"},
        {"name": "Protector solar", "icon": "SPF", "order": 4, "active": True, "action": "category", "value": "protector-solar"},
        {"name": "Acne", "icon": "A", "order": 5, "active": True, "action": "search", "value": "acne"},
        {"name": "Anti-edad", "icon": "+", "order": 6, "active": True, "action": "url", "value": "/productos?problema=Firmeza"},
    ]


def _default_sections() -> list[dict[str, Any]]:
    return [
        {
            "key": "featured_routines",
            "eyebrow": "Diagnostico guiado",
            "title": "Primero tu piel. Luego tu rutina.",
            "description": "El recorrido cambia: te entendemos, diagnosticamos y despues te mostramos lo que realmente vale la pena usar.",
            "ctaLabel": "Encontrar mi rutina",
            "ctaType": "skin_quiz",
            "ctaValue": "home",
            "order": 0,
            "active": True,
        },
        {
            "key": "featured_products",
            "eyebrow": "Tu seleccion",
            "title": "Aqui aparecen los productos. Ya con contexto.",
            "description": "Cada formula llega despues del diagnostico, la rutina y la razon de uso.",
            "ctaLabel": "Ver toda la seleccion",
            "ctaType": "page",
            "ctaValue": "productos",
            "order": 1,
            "active": True,
        },
        {
            "key": "shop_needs",
            "eyebrow": "Si prefieres explorar",
            "title": "Tambien puedes entrar por necesidad.",
            "description": "Una ruta secundaria para quien ya sabe si busca acne, manchas, hidratacion o sensibilidad.",
            "ctaLabel": "Ver toda la seleccion",
            "ctaType": "page",
            "ctaValue": "productos",
            "order": 2,
            "active": True,
        },
        {
            "key": "science",
            "eyebrow": "La ciencia detras",
            "title": "No vendemos primero. Explicamos primero.",
            "description": "La piel mejora mas facil cuando entiendes que hace cada paso y por que esta en tu rutina.",
            "ctaLabel": None,
            "ctaType": None,
            "ctaValue": None,
            "order": 3,
            "active": True,
        },
        {
            "key": "testimonials",
            "eyebrow": "Voces de la comunidad",
            "title": "La confianza entra mejor cuando se lee como testimonio.",
            "description": "Historias reales de clientas que compran con mas criterio y menos ruido.",
            "ctaLabel": None,
            "ctaType": None,
            "ctaValue": None,
            "order": 4,
            "active": True,
        },
        {
            "key": "bestsellers",
            "eyebrow": "Bestsellers",
            "title": "Lo que vuelve a entrar a la rutina.",
            "description": "Formulas que se recompran por sensorial, constancia y resultado.",
            "ctaLabel": None,
            "ctaType": None,
            "ctaValue": None,
            "order": 5,
            "active": True,
        },
        {
            "key": "reviews",
            "eyebrow": "Resenas verificadas",
            "title": "Lo que dicen nuestras clientas",
            "description": "Resenas aprobadas, lectura limpia y compras verificadas antes de decidir.",
            "ctaLabel": "Ver todas las resenas",
            "ctaType": "page",
            "ctaValue": "reviews",
            "order": 6,
            "active": True,
        },
        {
            "key": "blog",
            "eyebrow": "Diario Skin Hearten",
            "title": "Lectura tranquila para seguir explorando.",
            "description": "Activos, rutina y cuidado de la piel en tono editorial.",
            "ctaLabel": "Ir al blog",
            "ctaType": "page",
            "ctaValue": "blog",
            "order": 7,
            "active": True,
        },
    ]


def _default_banners() -> list[dict[str, Any]]:
    return [
        {"key": "top_bar_left", "title": "Banner superior", "message": "Skin Hearten. Journal of skincare.", "value": None, "order": 0, "active": True},
        {"key": "top_bar_right", "title": "Envios", "message": "Compra tranquila y envios a todo Mexico", "value": None, "order": 1, "active": True},
        {"key": "promotion", "title": "Promocion", "message": "Compra con tranquilidad y soporte humano visible.", "value": None, "order": 2, "active": False},
        {"key": "seasonal", "title": "Temporada", "message": "Seleccion editorial para rutinas de verano y clima calido.", "value": None, "order": 3, "active": False},
        {"key": "whatsapp", "title": "WhatsApp", "message": "Asesoria especializada por WhatsApp", "value": None, "order": 4, "active": False},
    ]


def _default_footer() -> dict[str, Any]:
    return {
        "introText": "Skincare seleccionado para rutinas mas claras, piel mas estable y una experiencia editorial que prioriza criterio.",
        "contactLines": [],
        "columns": [
            {
                "title": "Explorar",
                "links": [
                    {"label": "Seleccion", "type": "page", "value": "productos"},
                    {"label": "Blog", "type": "page", "value": "blog"},
                    {"label": "Cuenta", "type": "page", "value": "cuenta"},
                ],
            }
        ],
        "legalLinks": [],
        "socialLinks": [],
        "noticeText": "Contenido comercial editable desde SuperAdmin con fallback seguro si la API no esta disponible.",
    }


def _default_routine_guide_steps() -> list[dict[str, str]]:
    return [
        {
            "eyebrow": "1. Te entendemos",
            "title": "Primero hablamos de piel, no de producto.",
            "description": "Empiezas por manchas, sensibilidad, hidratacion o brotes. No por un catalogo infinito.",
        },
        {
            "eyebrow": "2. Conocemos tu piel",
            "title": "El diagnostico toma dos minutos.",
            "description": "Tipo de piel, objetivo, sensibilidad y tiempo real para seguir una rutina.",
        },
        {
            "eyebrow": "3. Te recomendamos una rutina",
            "title": "Manana y noche, paso por paso.",
            "description": "Una guia clara para usar menos, pero usar mejor.",
        },
        {
            "eyebrow": "4. Aqui estan los productos",
            "title": "Solo despues llegan los esenciales.",
            "description": "Cada recomendacion ya tiene una razon de estar en tu rutina.",
        },
    ]


def _default_science_points() -> list[dict[str, str]]:
    return [
        {
            "eyebrow": "La ciencia detras",
            "title": "Menos pasos funciona mejor cuando cada formula tiene una razon.",
            "description": "Activos, barrera y consistencia explicados con lenguaje claro.",
        },
        {
            "eyebrow": "Como se usa",
            "title": "Manana y noche no es una regla. Es una forma de bajar friccion.",
            "description": "Te ayudamos a entender orden, frecuencia y combinaciones sin sobrecargar la piel.",
        },
        {
            "eyebrow": "Errores comunes",
            "title": "Exfoliar de mas, mezclar sin criterio o abandonar a la semana.",
            "description": "La educacion evita decisiones impulsivas y mejora adherencia a la rutina.",
        },
        {
            "eyebrow": "Ingredientes",
            "title": "Lo importante no es memorizar INCI. Es saber por que esta cada cosa.",
            "description": "Peptidos, niacinamida, ceramidas o filtros: cada uno resuelve un momento distinto.",
        },
    ]


def _default_home_testimonials() -> list[dict[str, Any]]:
    return []


def get_default_commercial_content() -> dict[str, Any]:
    return {
        "storeKey": DEFAULT_STORE_KEY,
        "header": {
            "logoText": "Skin Hearten",
            "logoImage": None,
            "topLeftText": "Skin Hearten. Journal of skincare.",
            "topRightText": "Compra tranquila y envios a todo Mexico",
            "supportWhatsAppUrl": None,
        },
        "navigation": _default_navigation(),
        "quickLinks": _default_quick_links(),
        "hero": {
            "title": "Tu piel no necesita mas productos. Necesita direccion.",
            "subtitle": "Empezamos por lo que quieres mejorar. Despues construimos una rutina que si quieras seguir.",
            "primaryButton": {"label": "Encontrar mi rutina", "type": "skin_quiz", "value": "home"},
            "secondaryButton": {"label": "Diagnostico en 2 minutos", "type": "skin_quiz", "value": "home"},
            "tertiaryButton": {"label": "Ver la seleccion", "type": "url", "value": "#featured-products"},
            "image": None,
            "video": None,
            "backgroundColor": "#fffaf6",
            "isVisible": True,
            "trustSignals": [
                "Productos originales",
                "Envios a todo Mexico",
                "Pago seguro",
                "Asesoria especializada",
            ],
        },
        "sections": _default_sections(),
        "banners": _default_banners(),
        "footer": _default_footer(),
        "routineGuideSteps": _default_routine_guide_steps(),
        "sciencePoints": _default_science_points(),
        "homeTestimonials": _default_home_testimonials(),
    }


def ensure_commercial_content_tables(db: Session) -> None:
    try:
        Base.metadata.create_all(
            bind=db.get_bind(),
            tables=[
                CommercialContent.__table__,
                CommercialNavigation.__table__,
                CommercialQuickLink.__table__,
                CommercialSection.__table__,
                CommercialBanner.__table__,
            ],
        )
    except Exception:
        db.rollback()


def _sort_by_order(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(items, key=lambda item: (int(item.get("order") or 0), str(item.get("name") or item.get("title") or item.get("key") or "")))


def _serialize_content(content: CommercialContent) -> dict[str, Any]:
    return {
        "storeKey": content.store_key,
        "header": {
            "logoText": content.logo_text,
            "logoImage": content.logo_image_url,
            "topLeftText": content.top_left_text,
            "topRightText": content.top_right_text,
            "supportWhatsAppUrl": content.support_whatsapp_url,
        },
        "navigation": _sort_by_order(
            [
                {
                    "id": item.id,
                    "name": item.name,
                    "order": item.item_order,
                    "active": item.is_active,
                    "type": item.item_type,
                    "value": item.value,
                }
                for item in content.navigation_items
            ]
        ),
        "quickLinks": _sort_by_order(
            [
                {
                    "id": item.id,
                    "name": item.name,
                    "icon": item.icon,
                    "order": item.item_order,
                    "active": item.is_active,
                    "action": item.action_type,
                    "value": item.value,
                }
                for item in content.quick_links
            ]
        ),
        "hero": {
            "title": content.hero_title,
            "subtitle": content.hero_subtitle,
            "primaryButton": {
                "label": content.hero_primary_button_label or "Encontrar mi rutina",
                "type": content.hero_primary_button_type or "skin_quiz",
                "value": content.hero_primary_button_value or "home",
            },
            "secondaryButton": {
                "label": content.hero_secondary_button_label or "Diagnostico en 2 minutos",
                "type": content.hero_secondary_button_type or "skin_quiz",
                "value": content.hero_secondary_button_value or "home",
            },
            "tertiaryButton": (
                {
                    "label": content.hero_tertiary_button_label,
                    "type": content.hero_tertiary_button_type or "url",
                    "value": content.hero_tertiary_button_value or "#featured-products",
                }
                if content.hero_tertiary_button_label
                else None
            ),
            "image": content.hero_image_url,
            "video": content.hero_video_url,
            "backgroundColor": content.hero_background_color,
            "isVisible": content.hero_is_visible,
            "trustSignals": list(content.hero_trust_signals_json or []),
        },
        "sections": _sort_by_order(
            [
                {
                    "id": item.id,
                    "key": item.section_key,
                    "eyebrow": item.eyebrow,
                    "title": item.title,
                    "description": item.description,
                    "ctaLabel": item.cta_label,
                    "ctaType": item.cta_type,
                    "ctaValue": item.cta_value,
                    "order": item.item_order,
                    "active": item.is_active,
                }
                for item in content.sections
            ]
        ),
        "banners": _sort_by_order(
            [
                {
                    "id": item.id,
                    "key": item.banner_key,
                    "title": item.title,
                    "message": item.message,
                    "value": item.value,
                    "order": item.item_order,
                    "active": item.is_active,
                }
                for item in content.banners
            ]
        ),
        "footer": {
            "introText": content.footer_intro_text,
            "contactLines": list(content.footer_contact_lines_json or []),
            "columns": list(content.footer_columns_json or []),
            "legalLinks": list(content.footer_legal_links_json or []),
            "socialLinks": list(content.footer_social_links_json or []),
            "noticeText": content.footer_notice_text,
        },
        "routineGuideSteps": list(content.routine_guide_steps_json or []),
        "sciencePoints": list(content.science_points_json or []),
        "homeTestimonials": list(content.home_testimonials_json or []),
    }


def get_commercial_content(db: Session) -> dict[str, Any]:
    ensure_commercial_content_tables(db)
    if _memory_commercial_content is not None:
        return deepcopy(_memory_commercial_content)

    try:
        content = (
            db.query(CommercialContent)
            .options(
                selectinload(CommercialContent.navigation_items),
                selectinload(CommercialContent.quick_links),
                selectinload(CommercialContent.sections),
                selectinload(CommercialContent.banners),
            )
            .filter(CommercialContent.store_key == DEFAULT_STORE_KEY)
            .first()
        )
        if content:
            return _serialize_content(content)
    except SQLAlchemyError:
        db.rollback()

    return get_default_commercial_content()


def save_commercial_content(db: Session, payload: CommercialContentWrite) -> dict[str, Any]:
    global _memory_commercial_content

    ensure_commercial_content_tables(db)
    validated = payload.model_dump(mode="json", by_alias=True)

    try:
        content = (
            db.query(CommercialContent)
            .options(
                selectinload(CommercialContent.navigation_items),
                selectinload(CommercialContent.quick_links),
                selectinload(CommercialContent.sections),
                selectinload(CommercialContent.banners),
            )
            .filter(CommercialContent.store_key == DEFAULT_STORE_KEY)
            .first()
        )
        if not content:
            content = CommercialContent(store_key=DEFAULT_STORE_KEY)
            db.add(content)
            db.flush()

        header = validated["header"]
        hero = validated["hero"]
        footer = validated["footer"]

        content.logo_text = header["logoText"]
        content.logo_image_url = header.get("logoImage")
        content.top_left_text = header.get("topLeftText")
        content.top_right_text = header.get("topRightText")
        content.support_whatsapp_url = header.get("supportWhatsAppUrl")
        content.hero_title = hero["title"]
        content.hero_subtitle = hero.get("subtitle")
        content.hero_primary_button_label = hero["primaryButton"]["label"]
        content.hero_primary_button_type = hero["primaryButton"]["type"]
        content.hero_primary_button_value = hero["primaryButton"]["value"]
        content.hero_secondary_button_label = hero["secondaryButton"]["label"]
        content.hero_secondary_button_type = hero["secondaryButton"]["type"]
        content.hero_secondary_button_value = hero["secondaryButton"]["value"]
        tertiary_button = hero.get("tertiaryButton")
        content.hero_tertiary_button_label = tertiary_button.get("label") if tertiary_button else None
        content.hero_tertiary_button_type = tertiary_button.get("type") if tertiary_button else None
        content.hero_tertiary_button_value = tertiary_button.get("value") if tertiary_button else None
        content.hero_image_url = hero.get("image")
        content.hero_video_url = hero.get("video")
        content.hero_background_color = hero.get("backgroundColor")
        content.hero_is_visible = bool(hero.get("isVisible", True))
        content.hero_trust_signals_json = list(hero.get("trustSignals") or [])
        content.routine_guide_steps_json = list(validated.get("routineGuideSteps") or [])
        content.science_points_json = list(validated.get("sciencePoints") or [])
        content.home_testimonials_json = list(validated.get("homeTestimonials") or [])
        content.footer_intro_text = footer.get("introText")
        content.footer_contact_lines_json = list(footer.get("contactLines") or [])
        content.footer_columns_json = list(footer.get("columns") or [])
        content.footer_legal_links_json = list(footer.get("legalLinks") or [])
        content.footer_social_links_json = list(footer.get("socialLinks") or [])
        content.footer_notice_text = footer.get("noticeText")

        content.navigation_items.clear()
        content.quick_links.clear()
        content.sections.clear()
        content.banners.clear()
        db.flush()

        for item in validated.get("navigation", []):
            content.navigation_items.append(
                CommercialNavigation(
                    name=item["name"],
                    item_order=int(item.get("order") or 0),
                    is_active=bool(item.get("active", True)),
                    item_type=item["type"],
                    value=item["value"],
                )
            )

        for item in validated.get("quickLinks", []):
            content.quick_links.append(
                CommercialQuickLink(
                    name=item["name"],
                    icon=item.get("icon"),
                    item_order=int(item.get("order") or 0),
                    is_active=bool(item.get("active", True)),
                    action_type=item["action"],
                    value=item["value"],
                )
            )

        for item in validated.get("sections", []):
            content.sections.append(
                CommercialSection(
                    section_key=item["key"],
                    eyebrow=item.get("eyebrow"),
                    title=item["title"],
                    description=item.get("description"),
                    cta_label=item.get("ctaLabel"),
                    cta_type=item.get("ctaType"),
                    cta_value=item.get("ctaValue"),
                    item_order=int(item.get("order") or 0),
                    is_active=bool(item.get("active", True)),
                )
            )

        for item in validated.get("banners", []):
            content.banners.append(
                CommercialBanner(
                    banner_key=item["key"],
                    title=item["title"],
                    message=item.get("message"),
                    value=item.get("value"),
                    item_order=int(item.get("order") or 0),
                    is_active=bool(item.get("active", True)),
                )
            )

        db.add(content)
        db.commit()
        db.refresh(content)
        persisted = (
            db.query(CommercialContent)
            .options(
                selectinload(CommercialContent.navigation_items),
                selectinload(CommercialContent.quick_links),
                selectinload(CommercialContent.sections),
                selectinload(CommercialContent.banners),
            )
            .filter(CommercialContent.id == content.id)
            .first()
        )
        serialized = _serialize_content(persisted or content)
        _memory_commercial_content = None
        return serialized
    except SQLAlchemyError:
        db.rollback()
        _memory_commercial_content = deepcopy(validated)
        return deepcopy(validated)
