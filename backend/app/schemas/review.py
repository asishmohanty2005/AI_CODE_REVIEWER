"""Code review schemas."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


SUPPORTED_LANGUAGES = [
    "python",
    "javascript",
    "typescript",
    "java",
    "c",
    "cpp",
    "go",
    "rust",
    "html",
    "css",
    "sql",
    "auto",
]


class ReviewCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    language: str = Field(default="auto", max_length=64)
    source_code: str = Field(..., min_length=1, max_length=200_000)
    filename: Optional[str] = Field(None, max_length=255)
    ai_provider: Optional[str] = Field(None, pattern=r"^(gemini|openai)$")


class ReviewUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    is_favorite: Optional[bool] = None


class ComplexityAnalysis(BaseModel):
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None
    explanation: Optional[str] = None


class IssueItem(BaseModel):
    severity: str = "medium"  # critical | high | medium | low | info
    title: str
    description: str
    line: Optional[int] = None
    suggestion: Optional[str] = None


class LineExplanation(BaseModel):
    line: int
    code: str
    explanation: str


class ReviewResult(BaseModel):
    """Structured AI review payload stored in Review.result."""

    quality_score: float = Field(..., ge=0, le=100)
    summary: str
    bugs: List[IssueItem] = Field(default_factory=list)
    security_issues: List[IssueItem] = Field(default_factory=list)
    performance_issues: List[IssueItem] = Field(default_factory=list)
    readability: dict[str, Any] = Field(default_factory=dict)
    maintainability: dict[str, Any] = Field(default_factory=dict)
    best_practices: List[IssueItem] = Field(default_factory=list)
    complexity: Optional[ComplexityAnalysis] = None
    optimizations: List[str] = Field(default_factory=list)
    refactored_code: Optional[str] = None
    line_explanations: List[LineExplanation] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    language_detected: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    title: str
    language: str
    source_code: str
    filename: Optional[str] = None
    ai_provider: str
    ai_model: Optional[str] = None
    quality_score: Optional[float] = None
    summary: Optional[str] = None
    result: Optional[dict[str, Any]] = None
    is_favorite: bool
    status: str
    created_at: datetime
    updated_at: datetime


class ReviewListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    language: str
    filename: Optional[str] = None
    quality_score: Optional[float] = None
    summary: Optional[str] = None
    is_favorite: bool
    status: str
    created_at: datetime


class ReviewListResponse(BaseModel):
    items: List[ReviewListItem]
    total: int
    page: int
    page_size: int
    pages: int


class ConvertCodeRequest(BaseModel):
    source_code: str = Field(..., min_length=1, max_length=200_000)
    source_language: str
    target_language: str
    ai_provider: Optional[str] = Field(None, pattern=r"^(gemini|openai)$")


class ConvertCodeResponse(BaseModel):
    source_language: str
    target_language: str
    converted_code: str
    notes: Optional[str] = None


class ActionRequest(BaseModel):
    """Generic AI action on existing review code."""

    action: str = Field(
        ...,
        pattern=r"^(explain_functions|unit_tests|documentation|readme|optimize)$",
    )
    ai_provider: Optional[str] = Field(None, pattern=r"^(gemini|openai)$")
    extra: Optional[dict[str, Any]] = None
