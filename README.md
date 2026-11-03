# South Asian Bilateral Relations & Benefits Index

An open-source interactive data dashboard and legal registry mapping cross-border relations, bilateral treaties, visa privileges, trade concessions, and student quotas across South Asian states.

🌐 **Live Demo:** Hosted on GitHub Pages via the [`docs/`](docs/) directory.

---

## 1. About SAARC

### History
The **South Asian Association for Regional Cooperation (SAARC)** was founded on **December 8, 1985**, in Dhaka, Bangladesh, with seven founding member nations: **Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan, and Sri Lanka**. **Afghanistan** joined as the eighth member state at the 14th SAARC Summit in New Delhi in 2007.

### Purpose
SAARC was established with the objective of accelerating economic growth, social progress, and cultural development in South Asia through collective self-reliance, mutual trust, and multilateral institutional cooperation. Key regional frameworks initiated under its umbrella include:
- The **Agreement on South Asian Free Trade Area (SAFTA)**
- The **South Asian University (SAU)** in New Delhi
- The **SAARC Visa Exemption Scheme (SVES)**
- Specialized regional centres addressing agriculture, energy, disaster mitigation, and tuberculosis.

### Regional Relationships & Bilateral Realities
While multilateral SAARC summits have frequently encountered diplomatic friction and political standstills, cross-border cooperation in South Asia operates on multiple tiers:
- **Broad Regional Accords:** Baseline concessions (such as SAFTA tariff phase-downs, SAU university subsidies, and monument ticket discounts) available to all member citizens.
- **Deep Bilateral Ties:** High-integration treaties between specific neighbours (such as the 1950 Indo-Nepal Treaty and 1949/2007 India-Bhutan Friendship Treaty) granting complete freedom of movement, right to reside, and national treatment.
- **Strategic Bilateral Concessions:** Targeted bilateral arrangements, such as Bangladesh’s port transit access for Nepal and Bhutan, India’s guaranteed export quotas for essential commodities to Maldives, and Bhutan’s Sustainable Development Fee (SDF) concessions.

This index maps both multilateral mechanisms and deep bilateral accords to provide an objective, data-backed view of how connected South Asian nations truly are in practice.

---

## 2. What the Dashboard Shows

The interactive dashboard transforms verified bilateral and multilateral accords into actionable metrics and visual comparisons:

### 1. Interactive Bilateral Relations Matrix
- An $8 \times 8$ matrix measuring the relational depth and concession intensity between each country pair.
- Scored on a verified 3-tier hierarchy:
  - **Level 1 (Regional Baseline - 1 pt):** Standard multilateral benefits across all members (e.g., SAARC Visa Exemption Scheme, basic transshipment priority).
  - **Level 2 (Preferential Concession - 2 pts):** Subsidized tariffs, academic quotas, or discounted entry fees (e.g., SAFTA tariff reductions, SAU student quotas, domestic monument ticket parity).
  - **Level 3 (Deep Bilateral Integration - 3 pts):** Open borders, unrestricted right to work and reside, guaranteed essential trade quotas, or exclusive transit corridors.

### 2. Multi-View Analytics
- **Heatmap View:** Instant color-coded intensity matrix across all 56 bilateral pairs.
- **Leaderboards & Rankings:** Ranking member states by bilateral integration score, provider volume, and received concessions.
- **Reciprocity & Balance:** Analysis of mutual vs. asymmetrical benefits between trading and transit partners.
- **Sector Breakdown & Radar Profiles:** Multi-axis visualization comparing country scores across the 5 core domains:
  - 🚢 **Trade & Commerce** (SAFTA concessions, commodity quotas, port transit)
  - 🏛️ **Tourism & Culture** (World Heritage site discounts, tourism levy waivers)
  - 🎓 **Education & Higher Learning** (MBBS / engineering quotas, SAU subsidies, scholarships)
  - 🛂 **Mobility & Visa** (Free movement treaties, SVES clearances, visa waivers)
  - 💳 **Finance & Bilateral Liquidity** (Central bank currency swaps, development funding)

### 3. Bilateral Deep Dive / Accord Inspector
- Click any cell or select any two nations to inspect verified legal instruments.
- View official treaty titles, legal basis (statutory acts, Gazette notifications, bilateral treaties), eligibility criteria, target audiences (commercial traders, students, diplomats, general public), and live source citations.

### 4. SAARC Regional Centres Directory
- Collapsible profiles of the 7 official regional institutions:
  - **SAC** (Dhaka, Bangladesh) — Agriculture & Livestock
  - **SEC** (Islamabad, Pakistan) — Renewable Energy & Regional Grid
  - **SCC** (Colombo, Sri Lanka) — Arts & Heritage Preservation
  - **STAC** (Bhaktapur, Nepal) — Public Health & Epidemiology
  - **SDMC** (Gandhinagar, India) — Disaster Risk Reduction & Early Warning
  - **SDF** (Thimphu, Bhutan) — Regional Development Finance
  - **SARCO** (Islamabad, Pakistan) — Commercial Dispute Arbitration
- Expandable cards showing focus areas, citizen eligibility, flagship programs, and official portals.

---

## 3. The Datasets

All datasets in this repository are open and backed by primary government and institutional sources (treaty texts, parliamentary acts, ministry circulars, and official SAARC publications).

| File | Format | Description | Key Fields |
| :--- | :--- | :--- | :--- |
| [`data/benefits_master.csv`](data/benefits_master.csv) | CSV | Master registry of verified bilateral and regional provisions. | `benefit_id`, `provider_iso`, `beneficiary_iso`, `category`, `title`, `description`, `benefit_level`, `reciprocity_type`, `target_audience`, `monetary_value_indicator`, `operational_status`, `legal_framework`, `source_name`, `source_url` |
| [`data/saarc_centres.csv`](data/saarc_centres.csv) | CSV | Directory of specialized SAARC institutional centres and funds. | `centre_code`, `name`, `host_country_iso`, `city`, `focus_area`, `eligibility`, `key_program`, `source_name`, `source_url` |
| [`data/bilateral_matrix.csv`](data/bilateral_matrix.csv) | CSV | Computed pair-wise intensity score matrix ($8 \times 8$). | `provider_iso`, `AFG`, `BGD`, `BTN`, `IND`, `MDV`, `NPL`, `PAK`, `LKA` |
| [`data/bilateral_matrix.json`](data/bilateral_matrix.json) | JSON | Complete compiled payload including total scores, category slices, and itemized records. | `countries`, `categories`, `scores`, `category_scores`, `records`, `metadata` |
| [`docs/data/`](docs/data/) | CSV / JSON | Production-ready mirrored data files consumed directly by the static web dashboard. | Mirrored from `data/` for zero-backend GitHub Pages hosting. |

---

## 4. Building & Running Locally

The dashboard is built entirely with vanilla web standards (HTML5, CSS3, ES6 JavaScript) and Plotly.js, requiring no Node.js or heavy frontend build toolchain.

### 1. Rebuild Dataset Matrices
To recompile the matrix whenever `benefits_master.csv` or `saarc_centres.csv` is updated:
```bash
python3 scripts/build_data.py
```
This automatically updates `data/bilateral_matrix.csv`, `data/bilateral_matrix.json`, and synchronizes them to `docs/data/`.

### 2. Launch Local Server
You can serve the web interface locally using Python's built-in HTTP server:
```bash
cd docs
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 5. Contributing & Data Verifications

Accords and bilateral concessions change over time. If you notice an outdated tariff line, revised visa policy, or an omitted bilateral treaty:
1. Verify the provision against an official source (ministry circular, treaty database, or gazette notification).
2. Update [`data/benefits_master.csv`](data/benefits_master.csv) with the appropriate citations and `legal_framework`.
3. Run `python3 scripts/build_data.py` to regenerate the data payloads.
4. Submit a Pull Request.

---

## License

This project is licensed under the [MIT License](LICENSE). Datasets and public legal references are provided for civic, educational, and public research purposes.

