"""AI provider abstraction – Gemini (default) and OpenAI."""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from app.core.config import settings
from app.schemas.review import ReviewResult

logger = logging.getLogger(__name__)

REVIEW_SYSTEM_PROMPT = """You are CodeLens AI, an expert senior software engineer and security auditor.
Analyze the given source code thoroughly and return ONLY valid JSON (no markdown fences)
matching this exact schema:

{
  "quality_score": <number 0-100>,
  "summary": "<2-4 sentence overall summary>",
  "language_detected": "<language name>",
  "bugs": [{"severity":"critical|high|medium|low|info","title":"...","description":"...","line":<int or null>,"suggestion":"..."}],
  "security_issues": [{"severity":"...","title":"...","description":"...","line":null,"suggestion":"..."}],
  "performance_issues": [{"severity":"...","title":"...","description":"...","line":null,"suggestion":"..."}],
  "readability": {"score": <0-100>, "notes": ["..."]},
  "maintainability": {"score": <0-100>, "notes": ["..."]},
  "best_practices": [{"severity":"info","title":"...","description":"...","line":null,"suggestion":"..."}],
  "complexity": {"time_complexity":"O(...)","space_complexity":"O(...)","explanation":"..."},
  "optimizations": ["..."],
  "refactored_code": "<improved full source code>",
  "line_explanations": [{"line":1,"code":"...","explanation":"..."}],
  "strengths": ["..."]
}

Rules:
- Be precise and actionable.
- Include line numbers when possible.
- refactored_code must be complete and runnable.
- line_explanations: cover key lines (max 30).
- quality_score reflects overall production readiness.
"""


def _extract_json(text: str) -> dict[str, Any]:
    """Parse JSON from model output, stripping markdown fences if present."""
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Find outermost braces
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


def _fallback_result(code: str, language: str, error: str) -> dict[str, Any]:
    """Graceful degradation when AI is unavailable."""
    lines = code.splitlines()
    return ReviewResult(
        quality_score=50.0,
        summary=(
            "AI analysis could not be completed fully. "
            f"A basic structural review is provided. Reason: {error}"
        ),
        language_detected=language if language != "auto" else "unknown",
        bugs=[],
        security_issues=[],
        performance_issues=[],
        readability={"score": 50, "notes": ["AI unavailable – scores are placeholders."]},
        maintainability={"score": 50, "notes": ["Configure GEMINI_API_KEY or OPENAI_API_KEY."]},
        best_practices=[],
        complexity={
            "time_complexity": "N/A",
            "space_complexity": "N/A",
            "explanation": "Complexity analysis requires a configured AI provider.",
        },
        optimizations=["Configure an AI API key for full analysis."],
        refactored_code=code,
        line_explanations=[
            {"line": i + 1, "code": line[:120], "explanation": "Line present in source."}
            for i, line in enumerate(lines[:10])
        ],
        strengths=["Code was successfully received for review."],
    ).model_dump()


async def _call_gemini(prompt: str, system: str) -> str:
    import google.generativeai as genai

    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system,
    )
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 8192,
        },
    )
    return response.text or ""


async def _call_openai(prompt: str, system: str) -> str:
    from openai import AsyncOpenAI

    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model=settings.openai_model,
        temperature=0.2,
        max_tokens=8192,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content or ""


async def generate_text(
    prompt: str,
    system: str = "You are CodeLens AI, a helpful expert software engineer.",
    provider: Optional[str] = None,
) -> str:
    """Low-level text generation with provider fallback."""
    provider = (provider or settings.default_ai_provider).lower()
    try:
        if provider == "openai":
            return await _call_openai(prompt, system)
        return await _call_gemini(prompt, system)
    except Exception as primary_err:
        logger.warning("Primary AI provider %s failed: %s", provider, primary_err)
        # Try alternate if keys exist
        alternate = "openai" if provider == "gemini" else "gemini"
        try:
            if alternate == "openai" and settings.openai_api_key:
                return await _call_openai(prompt, system)
            if alternate == "gemini" and settings.gemini_api_key:
                return await _call_gemini(prompt, system)
        except Exception as alt_err:
            logger.error("Alternate provider also failed: %s", alt_err)
        raise primary_err


async def review_code(
    source_code: str,
    language: str = "auto",
    filename: Optional[str] = None,
    provider: Optional[str] = None,
) -> tuple[dict[str, Any], str, str]:
    """
    Run a full AI code review.

    Returns: (result_dict, provider_used, model_used)
    """
    provider = (provider or settings.default_ai_provider).lower()
    model = (
        settings.openai_model if provider == "openai" else settings.gemini_model
    )

    prompt = (
        f"Language hint: {language}\n"
        f"Filename: {filename or 'snippet'}\n\n"
        f"SOURCE CODE:\n```\n{source_code}\n```\n\n"
        "Return the JSON review now."
    )

    try:
        raw = await generate_text(prompt, REVIEW_SYSTEM_PROMPT, provider=provider)
        data = _extract_json(raw)
        # Validate / coerce via pydantic
        result = ReviewResult.model_validate(data)
        return result.model_dump(), provider, model
    except Exception as exc:
        logger.exception("review_code failed")
        return _fallback_result(source_code, language, str(exc)), provider, model


async def chat_about_code(
    source_code: str,
    language: str,
    history: list[dict[str, str]],
    user_message: str,
    action: str = "chat",
    provider: Optional[str] = None,
) -> str:
    """Conversational / action-based AI responses about code."""
    action_instructions = {
        "chat": "Answer the user's question about the code clearly and helpfully.",
        "explain_functions": "Explain every function/class in the code in detail.",
        "unit_tests": "Generate comprehensive unit tests for the code. Prefer pytest for Python, Jest for JS/TS.",
        "documentation": "Generate thorough documentation (docstrings / JSDoc) for the code.",
        "readme": "Generate a professional README.md for a project containing this code.",
        "optimize": "Provide an optimized version of the code with explanations of changes.",
        "convert": "Convert the code as requested.",
    }
    instruction = action_instructions.get(action, action_instructions["chat"])

    system = (
        "You are CodeLens AI, an expert software engineer assistant.\n"
        f"Action: {action}\n"
        f"Instruction: {instruction}\n"
        f"Language: {language}\n"
        "Respond in well-structured Markdown."
    )

    history_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-12:]
    )
    prompt = (
        f"SOURCE CODE:\n```{language}\n{source_code}\n```\n\n"
        f"CONVERSATION SO FAR:\n{history_text}\n\n"
        f"USER: {user_message}\n\n"
        "ASSISTANT:"
    )
    return await generate_text(prompt, system, provider=provider)


async def convert_code(
    source_code: str,
    source_language: str,
    target_language: str,
    provider: Optional[str] = None,
) -> dict[str, str]:
    """Convert code between languages."""
    system = (
        "You are CodeLens AI. Convert code faithfully between languages. "
        "Return ONLY valid JSON: "
        '{"converted_code":"...","notes":"brief notes about the conversion"}'
    )
    prompt = (
        f"Convert the following {source_language} code to {target_language}.\n\n"
        f"```{source_language}\n{source_code}\n```"
    )
    raw = await generate_text(prompt, system, provider=provider)
    try:
        data = _extract_json(raw)
        return {
            "converted_code": data.get("converted_code", raw),
            "notes": data.get("notes", ""),
        }
    except Exception:
        return {"converted_code": raw, "notes": "Parsed as free-form response."}


def detect_language(code: str, filename: Optional[str] = None) -> str:
    """Heuristic language detection from filename and code patterns."""
    if filename:
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".c": "c",
            ".h": "c",
            ".cpp": "cpp",
            ".cc": "cpp",
            ".hpp": "cpp",
            ".go": "go",
            ".rs": "rust",
            ".html": "html",
            ".htm": "html",
            ".css": "css",
            ".sql": "sql",
        }
        lower = filename.lower()
        for ext, lang in ext_map.items():
            if lower.endswith(ext):
                return lang

    patterns = [
        (r"\bdef\s+\w+\s*\(|\bimport\s+\w+|from\s+\w+\s+import", "python"),
        (r"\bfunc\s+\w+\(|package\s+main", "go"),
        (r"\bfn\s+\w+|let\s+mut\s+|println!", "rust"),
        (r"\bpublic\s+class\s+|\bSystem\.out\.println", "java"),
        (r"#include\s*<.*>|int\s+main\s*\(", "c"),
        (r"std::|cout\s*<<|namespace\s+", "cpp"),
        (r"\binterface\s+\w+|:\s*\w+(\[\])?\s*[=;]|from\s+['\"]\w+['\"]", "typescript"),
        (r"\bconst\s+\w+\s*=|\bfunction\s+\w+|=>\s*{|console\.log", "javascript"),
        (r"<!DOCTYPE\s+html|<html[\s>]|<div[\s>]", "html"),
        (r"\{[^}]*:[^}]*;[^}]*\}|\.[a-zA-Z][\w-]*\s*\{", "css"),
        (r"\bSELECT\b.+\bFROM\b|\bINSERT\s+INTO\b|\bCREATE\s+TABLE\b", "sql"),
    ]
    for pattern, lang in patterns:
        if re.search(pattern, code, re.IGNORECASE | re.MULTILINE):
            return lang
    return "python"
