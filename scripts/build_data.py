#!/usr/bin/env python3
"""
SAARC Benefits Index - Data Build Pipeline
Parses data/benefits_master.csv and data/saarc_centres.csv,
computes total and category-sliced bilateral intensity scores,
and exports matrix CSV and comprehensive JSON payloads to data/ and docs/data/.
"""

from __future__ import annotations

import csv
import json
import os
import shutil
from typing import Any, Dict, List, Set, TypedDict


# --- Configuration & Invariants ---
COUNTRIES: List[str] = ["AFG", "BGD", "BTN", "IND", "MDV", "NPL", "PAK", "LKA"]

LDCs: List[str] = ["AFG", "BGD", "BTN", "NPL"]
NON_LDCs: List[str] = ["IND", "MDV", "PAK", "LKA"]

COUNTRY_NAMES: Dict[str, str] = {
    "AFG": "Afghanistan",
    "BGD": "Bangladesh",
    "BTN": "Bhutan",
    "IND": "India",
    "MDV": "Maldives",
    "NPL": "Nepal",
    "PAK": "Pakistan",
    "LKA": "Sri Lanka",
}

CATEGORIES: List[str] = [
    "trade",
    "tourism_culture",
    "education",
    "mobility_visa",
    "finance_bilateral",
]

WILDCARD_GROUPS: Dict[str, List[str]] = {
    "ALL_SAARC": COUNTRIES,
    "SAARC_LDC": LDCs,
    "SAARC_NON_LDC": NON_LDCs,
}


def create_empty_scores() -> Dict[str, Dict[str, int]]:
    """Initializes empty NxN score mapping excluding diagonal self-pairs."""
    return {p: {b: 0 for b in COUNTRIES if b != p} for p in COUNTRIES}


def resolve_iso_group(entity: str, current_provider: str | None = None) -> List[str]:
    """Resolves an ISO token or wildcard group into valid SAARC country ISOs."""
    entity = entity.strip()
    if not entity:
        return []

    if entity in WILDCARD_GROUPS:
        base = WILDCARD_GROUPS[entity]
        if current_provider:
            return [c for c in base if c != current_provider]
        return list(base)

    tokens = [tok.strip() for tok in entity.replace(";", ",").split(",") if tok.strip()]
    expanded: List[str] = []
    for token in tokens:
        if token in WILDCARD_GROUPS:
            expanded.extend(WILDCARD_GROUPS[token])
        elif token in COUNTRIES:
            expanded.append(token)
        else:
            raise ValueError(f"Unknown country ISO or wildcard group: '{token}'")

    seen: Set[str] = set()
    result: List[str] = []
    for iso in expanded:
        if current_provider and iso == current_provider:
            continue
        if iso not in seen:
            seen.add(iso)
            result.append(iso)
    return result


def main() -> None:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    master_csv = os.path.join(base_dir, "data", "benefits_master.csv")
    centres_csv = os.path.join(base_dir, "data", "saarc_centres.csv")

    output_csv = os.path.join(base_dir, "data", "bilateral_matrix.csv")
    output_json = os.path.join(base_dir, "data", "bilateral_matrix.json")
    docs_csv = os.path.join(base_dir, "docs", "data", "bilateral_matrix.csv")
    docs_json = os.path.join(base_dir, "docs", "data", "bilateral_matrix.json")
    docs_centres = os.path.join(base_dir, "docs", "data", "saarc_centres.csv")

    # Overall scores, category-sliced scores, and rich provision details
    scores_total: Dict[str, Dict[str, int]] = create_empty_scores()
    scores_by_cat: Dict[str, Dict[str, Dict[str, int]]] = {
        cat: create_empty_scores() for cat in CATEGORIES
    }
    details: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        p: {b: [] for b in COUNTRIES if b != p} for p in COUNTRIES
    }

    print(f"Reading master dataset: {master_csv}")
    with open(master_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for line_num, row in enumerate(reader, start=2):
            provider = row["provider_iso"].strip()
            target = row["beneficiary_iso"].strip()
            cat = row["category"].strip()
            level = int(row["benefit_level"].strip())

            # Resolve providers
            providers = COUNTRIES if provider == "ALL_SAARC" else [provider]

            for p in providers:
                if p not in COUNTRIES:
                    continue

                # Resolve targets
                if target == "ALL_SAARC":
                    targets = [c for c in COUNTRIES if c != p]
                elif target == "SAARC_LDC":
                    targets = [c for c in LDCs if c != p]
                elif target in WILDCARD_GROUPS:
                    targets = [c for c in WILDCARD_GROUPS[target] if c != p]
                else:
                    targets = [target] if target in COUNTRIES and target != p else []

                for b in targets:
                    scores_total[p][b] += level
                    if cat in scores_by_cat:
                        scores_by_cat[cat][p][b] += level

                    # Backward-compatible detail object supporting both new & legacy keys
                    detail_entry: Dict[str, Any] = {
                        # Canonical concise keys from user specification
                        "id": row["benefit_id"],
                        "title": row["title"],
                        "category": cat,
                        "level": level,
                        "reciprocity": row.get("reciprocity_type", ""),
                        "target_audience": row.get("target_audience", ""),
                        "monetary_value": row.get("monetary_value_indicator", ""),
                        "status": row.get("operational_status", "active"),
                        "last_verified": row.get("last_verified_date", ""),
                        "legal_framework": row["legal_framework"],
                        "source": row["source_name"],
                        "url": row["source_url"],
                        # Legacy/extended keys for full backwards-compatibility
                        "benefit_id": row["benefit_id"],
                        "provider_iso": p,
                        "beneficiary_iso": b,
                        "description": row.get("description", ""),
                        "benefit_level": level,
                        "reciprocity_type": row.get("reciprocity_type", ""),
                        "monetary_value_indicator": row.get("monetary_value_indicator", ""),
                        "operational_status": row.get("operational_status", "active"),
                        "last_verified_date": row.get("last_verified_date", ""),
                        "source_name": row["source_name"],
                        "source_url": row["source_url"],
                    }
                    details[p][b].append(detail_entry)

    # 2. Parse saarc_centres.csv
    centres: List[Dict[str, str]] = []
    if os.path.exists(centres_csv):
        with open(centres_csv, mode="r", encoding="utf-8") as f:
            c_reader = csv.DictReader(f)
            for c_row in c_reader:
                centres.append(dict(c_row))

    # 3. Export Wide Matrix CSV (Total Scores)
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    os.makedirs(os.path.dirname(docs_csv), exist_ok=True)

    with open(output_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Provider"] + COUNTRIES)
        for p in COUNTRIES:
            row = [p] + [scores_total[p].get(b, "—") for b in COUNTRIES]
            writer.writerow(row)

    shutil.copyfile(output_csv, docs_csv)

    # Build backward-compatible matrix mapping
    matrix_legacy: Dict[str, Dict[str, Any]] = {}
    for p in COUNTRIES:
        matrix_legacy[p] = {}
        for b in COUNTRIES:
            if p == b:
                matrix_legacy[p][b] = {
                    "provider_iso": p,
                    "provider_name": COUNTRY_NAMES[p],
                    "beneficiary_iso": b,
                    "beneficiary_name": COUNTRY_NAMES[b],
                    "intensity_score": 0,
                    "provision_count": 0,
                    "category_scores": {c: 0 for c in CATEGORIES},
                    "provisions": [],
                }
            else:
                cat_scores = {c: scores_by_cat[c][p].get(b, 0) for c in CATEGORIES}
                pair_provisions = details[p][b]
                matrix_legacy[p][b] = {
                    "provider_iso": p,
                    "provider_name": COUNTRY_NAMES[p],
                    "beneficiary_iso": b,
                    "beneficiary_name": COUNTRY_NAMES[b],
                    "intensity_score": scores_total[p].get(b, 0),
                    "provision_count": len(pair_provisions),
                    "category_scores": cat_scores,
                    "provisions": pair_provisions,
                }

    # 4. Export Web JSON Payload (combining requested new schema and metadata compatibility)
    payload: Dict[str, Any] = {
        "countries": COUNTRIES,
        "scores_total": scores_total,
        "scores_by_cat": scores_by_cat,
        "details": details,
        "centres": centres,
        # Metadata and legacy matrix for zero-downtime frontend continuity
        "metadata": {
            "title": "SAARC Bilateral Benefits & Concessions Index",
            "countries": COUNTRIES,
            "country_names": COUNTRY_NAMES,
            "categories": CATEGORIES,
            "centre_count": len(centres),
        },
        "matrix": matrix_legacy,
    }

    with open(output_json, mode="w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    shutil.copyfile(output_json, docs_json)

    if os.path.exists(centres_csv):
        shutil.copyfile(centres_csv, docs_centres)

    print("Successfully generated bilateral_matrix.csv and bilateral_matrix.json")


if __name__ == "__main__":
    main()
