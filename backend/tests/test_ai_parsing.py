"""Tests for pure-function helpers inside ai_service (no Gemini call)."""
from app.services.ai_service import _parse_json_loose, _fuzzy_match, _confidence_from


def test_parse_json_plain():
    assert _parse_json_loose('{"a": 1}') == {"a": 1}


def test_parse_json_fenced():
    text = """```json
{"a": 1, "b": "x"}
```"""
    assert _parse_json_loose(text) == {"a": 1, "b": "x"}


def test_parse_json_with_prose_prefix():
    text = 'Sure here is the JSON:\n{"a": 2}'
    assert _parse_json_loose(text) == {"a": 2}


def test_parse_json_unparseable_returns_none():
    assert _parse_json_loose("not json at all") is None


def test_fuzzy_match_exact():
    assert _fuzzy_match("Amir", ["Ali", "Amir", "Priya"]) == "Amir"


def test_fuzzy_match_case_insensitive():
    assert _fuzzy_match("amir", ["Ali", "Amir", "Priya"]) == "Amir"


def test_fuzzy_match_substring():
    assert _fuzzy_match("ami", ["Ali", "Amir", "Priya"]) == "Amir"


def test_fuzzy_match_typo_via_difflib():
    assert _fuzzy_match("Amyr", ["Ali", "Amir", "Priya"]) == "Amir"


def test_fuzzy_match_no_match():
    assert _fuzzy_match("Bob", ["Ali", "Amir"]) is None


def test_confidence_all_present():
    data = {"merchant": "X", "total_amount": 1, "currency": "MYR", "date": "2026-01-01", "category": "food"}
    assert _confidence_from(data, ["merchant", "total_amount", "currency", "date", "category"]) == "high"


def test_confidence_two_missing():
    data = {"merchant": "X", "total_amount": 1, "currency": None, "date": None, "category": "food"}
    assert _confidence_from(data, ["merchant", "total_amount", "currency", "date", "category"]) == "medium"


def test_confidence_three_plus_missing():
    data = {"merchant": "X", "total_amount": None, "currency": None, "date": None, "category": None}
    assert _confidence_from(data, ["merchant", "total_amount", "currency", "date", "category"]) == "low"
