from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

InsightTone = Literal["neutral", "positive", "warning", "critical"]
InsightPriority = Literal["low", "medium", "high", "critical"]
InsightConfidence = Literal["low", "medium", "high"]


class IntelligenceExecutiveSummaryRead(BaseModel):
    headline: str
    summary: str
    bullets: list[str]

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceKPIRead(BaseModel):
    id: str
    label: str
    value: float
    display_value: str = Field(serialization_alias="displayValue")
    helper: str | None = None
    tone: InsightTone = "neutral"

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceSourceSnapshotRead(BaseModel):
    id: str
    title: str
    headline: str
    details: list[str]

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceRecommendationRead(BaseModel):
    id: str
    title: str
    description: str
    priority: InsightPriority
    source: str
    impact_label: str = Field(serialization_alias="impactLabel")
    impact_value: str = Field(serialization_alias="impactValue")
    suggested_action: str = Field(serialization_alias="suggestedAction")
    evidence: str | None = None
    confidence: InsightConfidence | None = None

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceCustomerScoreRead(BaseModel):
    contact_id: int | None = Field(default=None, serialization_alias="contactId")
    customer_id: int | None = Field(default=None, serialization_alias="customerId")
    name: str
    email: str | None = None
    whatsapp: str | None = None
    lifecycle_status: str = Field(serialization_alias="lifecycleStatus")
    repurchase_score: int = Field(serialization_alias="repurchaseScore")
    score_band: str = Field(serialization_alias="scoreBand")
    main_goal: str | None = Field(default=None, serialization_alias="mainGoal")
    skin_type: str | None = Field(default=None, serialization_alias="skinType")
    last_order_at: datetime | None = Field(default=None, serialization_alias="lastOrderAt")
    order_count: int = Field(serialization_alias="orderCount")
    average_ticket: float = Field(serialization_alias="averageTicket")
    total_spent: float = Field(serialization_alias="totalSpent")
    suggested_action: str = Field(serialization_alias="suggestedAction")
    reasons: list[str]

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceProductScoreRead(BaseModel):
    product_id: int = Field(serialization_alias="productId")
    name: str
    slug: str
    brand: str
    category: str
    intelligence_score: int = Field(serialization_alias="intelligenceScore")
    score_band: str = Field(serialization_alias="scoreBand")
    rotation_score: int = Field(serialization_alias="rotationScore")
    conversion_score: int = Field(serialization_alias="conversionScore")
    review_score: int = Field(serialization_alias="reviewScore")
    inventory_score: int = Field(serialization_alias="inventoryScore")
    margin_score: int = Field(serialization_alias="marginScore")
    units_sold: int = Field(serialization_alias="unitsSold")
    revenue: float
    stock: int
    average_rating: float = Field(serialization_alias="averageRating")
    review_count: int = Field(serialization_alias="reviewCount")
    margin_percent: float = Field(serialization_alias="marginPercent")
    margin_source: str = Field(serialization_alias="marginSource")
    recommended_action: str = Field(serialization_alias="recommendedAction")

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceAiModuleRead(BaseModel):
    title: str
    description: str
    suggested_questions: list[str] = Field(serialization_alias="suggestedQuestions")
    provider: str
    open_ai_ready: bool = Field(serialization_alias="openAiReady")

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceStatRead(BaseModel):
    id: str
    label: str
    value: float | None = None
    display_value: str = Field(serialization_alias="displayValue")
    helper: str | None = None
    is_estimated: bool = Field(default=False, serialization_alias="isEstimated")
    tone: InsightTone = "neutral"

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceNarrativeBlockRead(BaseModel):
    id: str
    label: str
    headline: str
    details: list[str]
    tone: InsightTone = "neutral"

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceQuestionAnswerRead(BaseModel):
    id: str
    question: str
    answer: str
    detail: str | None = None
    tone: InsightTone = "neutral"

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceRankedItemRead(BaseModel):
    label: str
    count: int
    share: float | None = None
    helper: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceFunnelStepRead(BaseModel):
    id: str
    label: str
    count: int | None = None
    display_value: str = Field(serialization_alias="displayValue")
    conversion_from_previous: float | None = Field(default=None, serialization_alias="conversionFromPrevious")
    loss_from_previous: int | None = Field(default=None, serialization_alias="lossFromPrevious")
    status: Literal["measured", "proxy", "unavailable"] = "measured"
    previous_period_count: int | None = Field(default=None, serialization_alias="previousPeriodCount")
    delta_vs_previous_7d: float | None = Field(default=None, serialization_alias="deltaVsPrevious7d")

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceAnalysisRead(BaseModel):
    executive_periods: list[IntelligenceNarrativeBlockRead] = Field(serialization_alias="executivePeriods")
    skin_quiz_metrics: list[IntelligenceStatRead] = Field(serialization_alias="skinQuizMetrics")
    skin_quiz_answers: list[IntelligenceQuestionAnswerRead] = Field(serialization_alias="skinQuizAnswers")
    skin_quiz_recommended_products: list[IntelligenceRankedItemRead] = Field(
        serialization_alias="skinQuizRecommendedProducts"
    )
    skin_quiz_purchased_products: list[IntelligenceRankedItemRead] = Field(
        serialization_alias="skinQuizPurchasedProducts"
    )
    routine_builder_metrics: list[IntelligenceStatRead] = Field(serialization_alias="routineBuilderMetrics")
    routine_builder_answers: list[IntelligenceQuestionAnswerRead] = Field(
        serialization_alias="routineBuilderAnswers"
    )
    routine_builder_routines: list[IntelligenceRankedItemRead] = Field(
        serialization_alias="routineBuilderRoutines"
    )
    product_answers: list[IntelligenceQuestionAnswerRead] = Field(serialization_alias="productAnswers")
    product_top_viewed: list[IntelligenceRankedItemRead] = Field(serialization_alias="productTopViewed")
    product_top_converted: list[IntelligenceRankedItemRead] = Field(serialization_alias="productTopConverted")
    product_top_abandoned: list[IntelligenceRankedItemRead] = Field(serialization_alias="productTopAbandoned")
    customer_answers: list[IntelligenceQuestionAnswerRead] = Field(serialization_alias="customerAnswers")
    priority_customers: list[IntelligenceCustomerScoreRead] = Field(serialization_alias="priorityCustomers")
    marketing_answers: list[IntelligenceQuestionAnswerRead] = Field(serialization_alias="marketingAnswers")
    marketing_sources: list[IntelligenceRankedItemRead] = Field(serialization_alias="marketingSources")
    marketing_coupons: list[IntelligenceRankedItemRead] = Field(serialization_alias="marketingCoupons")
    search_top_terms: list[IntelligenceRankedItemRead] = Field(serialization_alias="searchTopTerms")
    search_no_result_terms: list[IntelligenceRankedItemRead] = Field(serialization_alias="searchNoResultTerms")
    search_converting_terms: list[IntelligenceRankedItemRead] = Field(serialization_alias="searchConvertingTerms")
    funnel_steps: list[IntelligenceFunnelStepRead] = Field(serialization_alias="funnelSteps")
    funnel_insights: list[str] = Field(serialization_alias="funnelInsights")
    measurement_notes: list[str] = Field(serialization_alias="measurementNotes")
    growth_note: str | None = Field(default=None, serialization_alias="growthNote")

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceDashboardRead(BaseModel):
    generated_at: datetime = Field(serialization_alias="generatedAt")
    executive_summary: IntelligenceExecutiveSummaryRead = Field(serialization_alias="executiveSummary")
    kpis: list[IntelligenceKPIRead]
    snapshots: list[IntelligenceSourceSnapshotRead]
    recommendations: list[IntelligenceRecommendationRead]
    customer_scores: list[IntelligenceCustomerScoreRead] = Field(serialization_alias="customerScores")
    product_scores: list[IntelligenceProductScoreRead] = Field(serialization_alias="productScores")
    ai_module: IntelligenceAiModuleRead = Field(serialization_alias="aiModule")
    analysis: IntelligenceAnalysisRead

    model_config = ConfigDict(populate_by_name=True)


class IntelligenceAskRequest(BaseModel):
    question: str = Field(min_length=4, max_length=400)

    model_config = ConfigDict(extra="forbid")


class IntelligenceAskResponse(BaseModel):
    provider: str
    open_ai_ready: bool = Field(serialization_alias="openAiReady")
    answer: str
    supporting_facts: list[str] = Field(serialization_alias="supportingFacts")
    suggested_actions: list[str] = Field(serialization_alias="suggestedActions")
    suggested_questions: list[str] = Field(serialization_alias="suggestedQuestions")

    model_config = ConfigDict(populate_by_name=True)
