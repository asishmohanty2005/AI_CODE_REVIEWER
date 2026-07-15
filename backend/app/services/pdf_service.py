"""Generate PDF reports for code reviews."""

from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    HRFlowable,
)


def _safe(text: Optional[str], limit: int = 2000) -> str:
    if not text:
        return ""
    text = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return text[:limit]


def build_review_pdf(
    title: str,
    language: str,
    quality_score: Optional[float],
    summary: Optional[str],
    result: Optional[dict[str, Any]],
    source_code: str,
    created_at: Optional[datetime] = None,
) -> bytes:
    """Return PDF bytes for a review report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Hero",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#7C3AED"),
            spaceAfter=6,
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#A78BFA"),
            spaceBefore=14,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1F2937"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#111827"),
            backColor=colors.HexColor("#F3F4F6"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Meta",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#6B7280"),
            alignment=TA_CENTER,
        )
    )

    story = []
    story.append(Paragraph("CodeLens AI – Code Review Report", styles["Hero"]))
    meta = f"{_safe(title)} · {_safe(language).upper()}"
    if created_at:
        meta += f" · {created_at.strftime('%Y-%m-%d %H:%M UTC')}"
    story.append(Paragraph(meta, styles["Meta"]))
    story.append(Spacer(1, 8))
    story.append(
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#DDD6FE"))
    )

    score = quality_score if quality_score is not None else "N/A"
    story.append(Paragraph("Overall Quality Score", styles["Section"]))
    story.append(
        Paragraph(f"<b>{score}</b> / 100", styles["Body"])
    )

    if summary:
        story.append(Paragraph("Summary", styles["Section"]))
        story.append(Paragraph(_safe(summary, 3000), styles["Body"]))

    result = result or {}

    def issues_section(name: str, key: str) -> None:
        items = result.get(key) or []
        if not items:
            return
        story.append(Paragraph(name, styles["Section"]))
        for item in items[:20]:
            sev = _safe(item.get("severity", "info")).upper()
            t = _safe(item.get("title", "Issue"))
            desc = _safe(item.get("description", ""))
            line = item.get("line")
            line_txt = f" (line {line})" if line else ""
            story.append(
                Paragraph(f"<b>[{sev}] {t}{line_txt}</b><br/>{desc}", styles["Body"])
            )
            if item.get("suggestion"):
                story.append(
                    Paragraph(
                        f"<i>Suggestion: {_safe(item.get('suggestion'))}</i>",
                        styles["Body"],
                    )
                )
            story.append(Spacer(1, 4))

    issues_section("Bug Detection", "bugs")
    issues_section("Security Issues", "security_issues")
    issues_section("Performance Issues", "performance_issues")
    issues_section("Best Practices", "best_practices")

    complexity = result.get("complexity") or {}
    if complexity:
        story.append(Paragraph("Complexity Analysis", styles["Section"]))
        story.append(
            Paragraph(
                f"Time: <b>{_safe(complexity.get('time_complexity'))}</b> · "
                f"Space: <b>{_safe(complexity.get('space_complexity'))}</b><br/>"
                f"{_safe(complexity.get('explanation'), 1500)}",
                styles["Body"],
            )
        )

    opts = result.get("optimizations") or []
    if opts:
        story.append(Paragraph("Suggested Optimizations", styles["Section"]))
        for o in opts[:15]:
            story.append(Paragraph(f"• {_safe(o)}", styles["Body"]))

    refactored = result.get("refactored_code")
    if refactored:
        story.append(Paragraph("Refactored Code", styles["Section"]))
        # Truncate very long code for PDF
        snippet = refactored[:8000]
        if len(refactored) > 8000:
            snippet += "\n... (truncated)"
        story.append(Preformatted(snippet, styles["CodeBlock"]))

    story.append(Paragraph("Original Source (excerpt)", styles["Section"]))
    excerpt = source_code[:4000]
    if len(source_code) > 4000:
        excerpt += "\n... (truncated)"
    story.append(Preformatted(excerpt, styles["CodeBlock"]))

    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "Generated by CodeLens AI · Intelligent Code Reviewer",
            styles["Meta"],
        )
    )

    doc.build(story)
    return buffer.getvalue()
