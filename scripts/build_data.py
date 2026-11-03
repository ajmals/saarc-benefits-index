#!/usr/bin/env python3
"""
SAARC Benefits Index - Data Build Pipeline
Parses data/benefits_master.csv, expands wildcards (e.g., ALL_SAARC, SAARC_LDC),
computes bilateral weighted intensity scores, and generates bilateral_matrix.csv & bilateral_matrix.json.
"""

from __future__ import annotations

import csv
import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Set, Any, TypedDict


# --- Configuration & Invariants ---
SAARC_COUNTRIES: List[str] = [
    "AFG", "BGD", "BTN", "IND", "MDV", "NPL", "PAK", "LKA"
]

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

VALID_CATEGORIES: Set[str] = {
    "trade",
    "tourism_culture",
    "education",
    "mobility_visa",
    "finance_bilateral",
}

WILDCARD_GROUPS: Dict[str, List[str]] = {
    "ALL_SAARC": SAARC_COUNTRIES,
    "SAARC_LDC": ["AFG", "BGD", "BTN", "NPL"],
    "SAARC_NON_LDC": ["IND", "MDV", "PAK", "LKA"],
}

REQUIRED_MASTER_COLUMNS: List[str] = [
    "benefit_id",
    "provider_iso",
    "beneficiary_iso",
    "category",
    "title",
    "description",
    "benefit_level",
    "legal_framework",
    "source_name",
    "source_url",
]


class ProvisionRecord(TypedDict):
    benefit_id: str
    provider_iso: str
    beneficiary_iso: str
    category: str
    title: str
    description: str
    benefit_level: int
    legal_framework: str
    source_name: str
    source_url: str


class PairSummary(TypedDict):
    provider_iso: str
    provider_name: str
    beneficiary_iso: str
    beneficiary_name: str
    intensity_score: int
    provision_count: int
    category_scores: Dict[str, int]
    provisions: List[ProvisionRecord]


def expand_iso_entity(entity: str) -> List[str]:
    """Expands wildcards, comma-separated lists, or direct ISO codes into valid SAARC ISOs."""
    entity = entity.strip()
    if not entity:
        raise ValueError("Encountered empty ISO entity in dataset.")

    # Check for wildcards directly
    if entity in WILDCARD_GROUPS:
        return list(WILDCARD_GROUPS[entity])

    # Check for comma / semicolon separated values
    raw_tokens = [tok.strip() for tok in entity.replace(";", ",").split(",") if tok.strip()]
    expanded: List[str] = []
    for token in raw_tokens:
        if token in WILDCARD_GROUPS:
            expanded.extend(WILDCARD_GROUPS[token])
        elif token in SAARC_COUNTRIES:
            expanded.append(token)
        else:
            raise ValueError(f"Unknown country ISO or wildcard group: '{token}'")

    # Deduplicate while preserving order
    seen: Set[str] = set()
    result: List[str] = []
    for iso in expanded:
        if iso not in seen:
            seen.add(iso)
            result.append(iso)
    return result


def parse_master_csv(file_path: str) -> List[ProvisionRecord]:
    """Reads and validates the master benefits CSV file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Master file not found: {file_path}")

    records: List[ProvisionRecord] = []
    with open(file_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        
        # Verify required headers
        fieldnames = reader.fieldnames or []
        for req_col in REQUIRED_MASTER_COLUMNS:
            assert req_col in fieldnames, f"Missing required column in {file_path}: {req_col}"

        for line_num, row in enumerate(reader, start=2):
            benefit_id = row["benefit_id"].strip()
            provider_iso = row["provider_iso"].strip()
            beneficiary_iso = row["beneficiary_iso"].strip()
            category = row["category"].strip()
            title = row["title"].strip()
            description = row["description"].strip()
            legal_framework = row["legal_framework"].strip()
            source_name = row["source_name"].strip()
            source_url = row["source_url"].strip()

            assert benefit_id, f"Line {line_num}: Empty benefit_id"
            assert category in VALID_CATEGORIES, f"Line {line_num}: Invalid category '{category}'"
            
            try:
                benefit_level = int(row["benefit_level"].strip())
                assert benefit_level >= 1, "benefit_level must be >= 1"
            except (ValueError, AssertionError) as err:
                raise ValueError(f"Line {line_num}: Invalid benefit_level '{row['benefit_level']}' - {err}")

            records.append({
                "benefit_id": benefit_id,
                "provider_iso": provider_iso,
                "beneficiary_iso": beneficiary_iso,
                "category": category,
                "title": title,
                "description": description,
                "benefit_level": benefit_level,
                "legal_framework": legal_framework,
                "source_name": source_name,
                "source_url": source_url,
            })

    return records


def build_bilateral_matrix(records: List[ProvisionRecord]) -> Dict[str, Dict[str, PairSummary]]:
    """Builds the 8x8 pairwise matrix from master provision records."""
    # Initialize empty 8x8 structure
    matrix: Dict[str, Dict[str, PairSummary]] = {}
    sorted_categories = sorted(list(VALID_CATEGORIES))

    for p in SAARC_COUNTRIES:
        matrix[p] = {}
        for b in SAARC_COUNTRIES:
            matrix[p][b] = {
                "provider_iso": p,
                "provider_name": COUNTRY_NAMES[p],
                "beneficiary_iso": b,
                "beneficiary_name": COUNTRY_NAMES[b],
                "intensity_score": 0,
                "provision_count": 0,
                "category_scores": {cat: 0 for cat in sorted_categories},
                "provisions": [],
            }

    # Populate with expanded provisions
    for rec in records:
        providers = expand_iso_entity(rec["provider_iso"])
        beneficiaries = expand_iso_entity(rec["beneficiary_iso"])

        for p in providers:
            for b in beneficiaries:
                if p == b:
                    # Bilateral concessions do not apply domestically in this matrix
                    continue

                cell = matrix[p][b]
                level = rec["benefit_level"]
                category = rec["category"]

                cell["intensity_score"] += level
                cell["provision_count"] += 1
                cell["category_scores"][category] += level

                # Create specific pair instance of the provision
                pair_provision: ProvisionRecord = {
                    "benefit_id": rec["benefit_id"],
                    "provider_iso": p,
                    "beneficiary_iso": b,
                    "category": category,
                    "title": rec["title"],
                    "description": rec["description"],
                    "benefit_level": level,
                    "legal_framework": rec["legal_framework"],
                    "source_name": rec["source_name"],
                    "source_url": rec["source_url"],
                }
                cell["provisions"].append(pair_provision)

    return matrix


def export_bilateral_csv(matrix: Dict[str, Dict[str, PairSummary]], output_path: str) -> None:
    """Exports bilateral scores and category breakdowns to CSV."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sorted_categories = sorted(list(VALID_CATEGORIES))
    
    headers = [
        "provider_iso",
        "beneficiary_iso",
        "intensity_score",
        "provision_count",
    ] + [f"{cat}_score" for cat in sorted_categories]

    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for p in SAARC_COUNTRIES:
            for b in SAARC_COUNTRIES:
                cell = matrix[p][b]
                row = [
                    p,
                    b,
                    cell["intensity_score"],
                    cell["provision_count"],
                ] + [cell["category_scores"][cat] for cat in sorted_categories]
                writer.writerow(row)


def export_bilateral_json(
    matrix: Dict[str, Dict[str, PairSummary]],
    records_count: int,
    output_path: str
) -> None:
    """Exports rich matrix, provisions, and 2D heatmap arrays to JSON."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sorted_categories = sorted(list(VALID_CATEGORIES))

    # Construct 2D z-matrix for Plotly heatmap: rows = providers, cols = beneficiaries
    # z[p_idx][b_idx]
    z_scores: List[List[int]] = []
    hover_texts: List[List[str]] = []

    for p in SAARC_COUNTRIES:
        row_scores: List[int] = []
        row_hover: List[str] = []
        for b in SAARC_COUNTRIES:
            cell = matrix[p][b]
            score = cell["intensity_score"]
            count = cell["provision_count"]
            row_scores.append(score)
            if p == b:
                row_hover.append(f"{p} ({COUNTRY_NAMES[p]}): Domestic (N/A)")
            else:
                row_hover.append(
                    f"Provider: {p} ({COUNTRY_NAMES[p]})<br>"
                    f"Beneficiary: {b} ({COUNTRY_NAMES[b]})<br>"
                    f"Intensity Score: {score}<br>"
                    f"Provisions: {count}"
                )
        z_scores.append(row_scores)
        hover_texts.append(row_hover)

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "master_records_count": records_count,
            "countries": SAARC_COUNTRIES,
            "country_names": COUNTRY_NAMES,
            "categories": sorted_categories,
        },
        "heatmap": {
            "x": SAARC_COUNTRIES,  # Beneficiary (X-axis)
            "y": SAARC_COUNTRIES,  # Provider (Y-axis)
            "z": z_scores,
            "text": hover_texts,
        },
        "matrix": matrix,
    }

    with open(output_path, mode="w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def verify_outputs(csv_path: str, json_path: str) -> None:
    """Rigorous schema verification of generated CSV and JSON outputs."""
    # Verify CSV
    assert os.path.exists(csv_path), f"CSV not found: {csv_path}"
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        assert len(reader) == len(SAARC_COUNTRIES) * len(SAARC_COUNTRIES), (
            f"Expected {len(SAARC_COUNTRIES) ** 2} rows in CSV, got {len(reader)}"
        )
        sample = reader[0]
        assert "provider_iso" in sample
        assert "beneficiary_iso" in sample
        assert "intensity_score" in sample
        assert "provision_count" in sample

    # Verify JSON
    assert os.path.exists(json_path), f"JSON not found: {json_path}"
    with open(json_path, mode="r", encoding="utf-8") as f:
        data = json.load(f)
        assert "metadata" in data
        assert "heatmap" in data
        assert "matrix" in data
        assert len(data["heatmap"]["z"]) == 8
        assert len(data["heatmap"]["z"][0]) == 8

        # Test specific known pairs
        ind_npl = data["matrix"]["IND"]["NPL"]
        assert ind_npl["intensity_score"] > 0, "IND -> NPL intensity score must be positive"
        assert len(ind_npl["provisions"]) >= 4, "IND -> NPL must have multiple bilateral provisions"

        btn_ind = data["matrix"]["BTN"]["IND"]
        assert btn_ind["intensity_score"] > 0, "BTN -> IND intensity score must be positive"
        assert any("SDF" in p["title"] or "Sustainable" in p["title"] for p in btn_ind["provisions"]), (
            "BTN -> IND must include SDF Concession"
        )

        # Diagonal check
        for c in SAARC_COUNTRIES:
            assert data["matrix"][c][c]["intensity_score"] == 0, f"Self-pair {c}->{c} must be 0"

    print("Verification passed successfully! All schema invariants confirmed.")


def main() -> None:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    master_csv = os.path.join(base_dir, "data", "benefits_master.csv")
    output_csv = os.path.join(base_dir, "data", "bilateral_matrix.csv")
    output_json = os.path.join(base_dir, "data", "bilateral_matrix.json")
    docs_data_dir = os.path.join(base_dir, "docs", "data")
    docs_csv = os.path.join(docs_data_dir, "bilateral_matrix.csv")
    docs_json = os.path.join(docs_data_dir, "bilateral_matrix.json")

    print(f"Reading master dataset: {master_csv}")
    records = parse_master_csv(master_csv)
    print(f"Loaded {len(records)} master benefit records.")

    print("Expanding wildcards and calculating bilateral intensity matrix...")
    matrix = build_bilateral_matrix(records)

    print(f"Exporting bilateral CSV to: {output_csv}")
    export_bilateral_csv(matrix, output_csv)
    export_bilateral_csv(matrix, docs_csv)

    print(f"Exporting bilateral JSON to: {output_json}")
    export_bilateral_json(matrix, len(records), output_json)
    export_bilateral_json(matrix, len(records), docs_json)

    print("Verifying generated schemas and integrity...")
    verify_outputs(output_csv, output_json)
    verify_outputs(docs_csv, docs_json)
    print("Build completed successfully.")


if __name__ == "__main__":
    main()
