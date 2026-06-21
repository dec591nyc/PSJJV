# Website Architecture and Roadmap

## Revised Product Direction - 2026-06-20

The website is a numerical statistics and public-opinion comparison dashboard.
It is not intended to reproduce or warehouse judgment documents.

Primary views:

1. Official statistics: monthly offense-category volume, trend, distribution,
   geography, and source coverage.
2. Public opinion metrics: monthly discussion volume, topic share, source
   distribution, attention trend, and classification confidence.
3. Official-versus-opinion comparison: attention gaps and trend divergence,
   clearly labeled as comparison signals rather than truth findings.
4. Source references: compact tables of selected examples with a
   `查看司法機關原文` or `查看來源` button to the authoritative external page.

Retention policy:

- Persist normalized counts, category labels, dates, source URLs, hashes,
  collection runs, and quality indicators.
- Avoid storing PDFs, full judgment text, and long forum/news bodies.
- Treat fetched page text as transient processing input and discard it after
  classification/aggregation unless a short audit excerpt is justified.
- Keep the existing 202604 local judgment index only as a prototype fixture.

## Current Implementation

### Language

- Backend: Python 3 standard library
- Frontend: HTML, CSS, vanilla JavaScript
- Local database: SQLite
- Remote database target: PostgreSQL or Supabase-compatible schema

### Current Backend

`/.scripts/serve_review_dashboard.py` runs a read-only local HTTP server.

Responsibilities:

- Serve static SPA files from `web/`
- Read `data/local/public_safety.sqlite` in read-only mode
- Provide JSON APIs:
  - `/api/summary`
  - `/api/judgments`
  - `/api/judgments/{jid}`

Why this stack now:

- No Node/npm dependency required
- Fast to run locally
- Works with the existing SQLite index
- Good enough for review before building extraction logic

### Current Frontend

The frontend is a lightweight SPA with four routes:

1. `#overview` - 總覽儀表板
2. `#opinion` - 輿論情報
3. `#truth` - 輿情真相
4. `#database` - 裁判來源索引

Design direction:

- Traditional Chinese interface
- Data-dense dashboard style
- Neutral professional palette
- Clear separation between indexed court data, public-opinion planning, and verified findings

## Planned Upgrade Options

### Option A: Keep Lightweight Stack

Best for early research and local review.

- Python HTTP server
- SQLite
- Vanilla JS SPA
- Minimal dependencies

Use this until the information architecture and data model stabilize.

### Option B: Production Web App

Recommended after the bounded metrics pilot is validated.

- Backend: FastAPI or Flask
- Database: PostgreSQL or Supabase
- Frontend: React, Vue, or SvelteKit
- Search: PostgreSQL indexed metric/source metadata; no judgment full-text
  search is required for the revised scope
- Automation: n8n scheduled ingest and extraction jobs

### Option C: Analytics BI Stack

Recommended if the priority is internal dashboarding.

- DuckDB or PostgreSQL
- Evidence tables and feature tables
- Metabase, Superset, or Streamlit
- n8n for monthly data ingestion

## Public Opinion Intelligence Plan

The public opinion layer should be separate from court data. It should not be mixed into judgment facts until the source and classification are clear.

### Source Types

- Forums: PTT, Dcard
- News: Taiwanese legal/social news coverage
- Civic/legal organizations: judicial reform and legal commentary sources
- Official correction sources: Judicial Yuan releases, ministry responses, court press releases

### Ingestion Fields

- source_name
- source_url
- published_at
- title
- author_or_board if public and permitted
- topic_category
- sentiment or stance label
- summary
- referenced_judgment_id if detected
- confidence
- crawl_run_id

### Categories

- fraud_money_laundering
- traffic_injury_compensation
- sexual_offense_sentencing
- public_integrity_corruption
- election_law_dispute
- constitutional_or_high_profile_dispute
- general_judicial_trust

### Guardrails

- Respect platform terms and robots rules.
- Store links and short summaries, not unnecessary personal data.
- Treat public opinion as perception data, not proof of unfair judgment.
- Use manual review for high-impact claims.

## Official and Opinion Comparison Dashboard Concept

The comparison layer uses three numerical dimensions without treating public
opinion as proof:

1. Official monthly statistics
2. Public-opinion attention metrics
3. Source coverage and classification quality

Useful outputs:

- High official volume, low public attention
- Low official volume, high public attention
- Official and opinion trends moving in different directions
- Topic shares by source and month
- Coverage gaps caused by missing or unstable sources

## Next Technical Step

Build a bounded metrics pilot before redesigning the charts:

1. Normalize one official monthly offense-statistics source.
2. Collect one public-opinion source for the same categories and time range.
3. Store counts, URLs, dates, category, source, confidence, and run metadata;
   discard unnecessary body text.
4. Compare monthly official volume and public attention, then choose the final
   charts from observed fields and coverage.

## Summary Provider Decision

- Local development default: deterministic extractive summary with evidence snippets.
- Optional local generation: Ollama, after model and hardware evaluation.
- Advanced local deployment: llama.cpp server.
- Browser inference: Transformers.js only for lightweight experiments, not the default legal summarizer.
- Production option: OpenAI API is recorded but deferred. No API key is required in the current version.
