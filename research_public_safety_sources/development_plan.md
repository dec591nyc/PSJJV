# Development Plan

## Product Scope Decision - 2026-06-20

The product is now a statistics and public-opinion comparison dashboard, not a
multi-year judgment-text warehouse.

Production scope:

- Prefer official aggregate crime and judicial statistics.
- Collect public-opinion metrics by offense/topic category and time period.
- Compare official volume/trends with public attention/trends numerically.
- Keep source URLs and minimal provenance for every displayed metric.
- When a judgment example is shown, provide a `查看司法機關原文` button that
  opens the official Judicial Yuan URL.
- Do not bulk-download or retain multi-year judgment full text, PDFs, or
  extracted document trees for the production dashboard.
- Do not retain forum/news article bodies after metric extraction unless a
  short, legally permitted evidence excerpt is required for audit.

The existing 202604 judgment sample remains a development fixture. It does not
set the production ingestion strategy and should not automatically be expanded
to one, three, or five years.

Lean production scripts should converge on:

1. `ingest_official_statistics.py`: fetch and normalize official monthly
   offense-category statistics.
2. `collect_opinion_metrics.py`: collect topic/date/source metadata, classify
   it, aggregate counts, and discard unnecessary page bodies.
3. `aggregate_dashboard_metrics.py`: produce monthly dashboard facts and
   official-versus-opinion comparison indicators.
4. `run_pipeline.py`: provide one idempotent entry point for local execution or
   n8n scheduling.

Historical judgment archive synchronization and full-text extraction are now
optional research tools, not prerequisites for the dashboard.

## Current State

The project now has two database access paths:

1. Local DB path
   - Driver: SQLite
   - File: `data/local/public_safety.sqlite`
   - Status: implemented and tested with the full `202604` judgment set.

2. Remote DB path
   - Target: PostgreSQL/Supabase-compatible schema
   - Schema: `sql/schema_postgres.sql`
   - Connection setting: environment variable `PUBLIC_SAFETY_DATABASE_URL`
   - Status: interface and schema implemented. Actual remote write requires either `psycopg` installed in Python or n8n's PostgreSQL/Supabase node.

The first full local indexing run completed:

- Files indexed: 100,427
- Errors: 0
- Local DB size: about 212.86 MB
- CSV export size: about 168.52 MB

## Why This Dataset Matters

The `202604` judgment-level data is now a prototype fixture used to validate
category mapping, court/source links, and dashboard interactions. Production
metrics should come from aggregate official datasets wherever possible.

The fixture contains:

- court and case identifiers
- judgment date
- case title
- full judgment text
- PDF reference URL

It is not the template for a multi-year production warehouse.

## Analysis Tracks

### 1. Public Safety Monthly Dashboard

Purpose: show monthly volume and distribution.

Core metrics:

- total judgments by month
- case-domain distribution: civil, criminal, administrative, constitutional, disciplinary
- category candidate counts: fraud, money laundering, sexual offense, injury, public integrity, election law
- court/bench distribution
- top case titles and case codes

Important caveat: these are court-document counts, not police incident counts.

### 2. Public Opinion Metrics

Purpose: measure monthly attention by offense/topic category and source without
retaining unnecessary article or forum bodies.

Core metrics:

- discussion count and share by month
- topic and source distribution
- month-over-month attention change
- collection coverage and classification confidence

### 3. Official-versus-Opinion Comparison

Purpose: show numerical gaps between official incident/case trends and public
attention. These are coverage and attention signals, not findings of truth,
misconduct, or judicial unfairness.

### 4. Automation With n8n

Recommended n8n flow:

1. Cron trigger
2. Fetch official aggregate statistics
3. Collect bounded public-opinion source metadata
4. Normalize categories and monthly dimensions
5. Aggregate official and opinion metrics
6. Upsert local SQLite or remote PostgreSQL/Supabase
7. Generate dashboard refresh signal
8. Send notification with counts, coverage, and errors

n8n should orchestrate. Heavy parsing should stay in Python scripts.

## Environment Modes

Use explicit modes so the same project can run locally or in production:

- `LOCAL_DEV`: SQLite only, fast iteration, no remote writes
- `REMOTE_STAGING`: SQLite plus PostgreSQL/Supabase write, test dashboard
- `PRODUCTION`: scheduled ingest, remote DB primary, local DB optional backup

Suggested environment variables:

```text
PUBLIC_SAFETY_ENV=LOCAL_DEV
PUBLIC_SAFETY_DATABASE_URL=postgresql://...
PUBLIC_SAFETY_RAW_ROOT=C:/path/to/data/raw
PUBLIC_SAFETY_LOCAL_DB=data/local/public_safety.sqlite
```

## Next Build Steps

The query script and first SQLite dashboard prototype are complete. The revised
development order prioritizes learning from real public-opinion source data
before locking the final dashboard presentation.

### Phase 1: Small, compliant metrics pilot

1. Research source terms, robots rules, rate limits, public APIs, RSS feeds, and
   stable page structures for PTT, Dcard, news, legal commentary, and official
   correction sources.
2. Implement `collect_opinion_metrics.py` with source adapters, throttling,
   deduplication, provenance, crawl-run logging, and minimal retention.
3. Crawl a bounded sample for one month and store links, timestamps, titles,
   short excerpts, source labels, and raw response hashes.
4. Use the sample to profile topic types, time coverage, missing fields, and
   which visualizations are defensible.

### Phase 2: Opinion processing and dashboard design

1. Implement `classify_opinion_topics.py` and `summarize_opinion.py`.
2. Produce monthly topic counts, source distribution, discussion trend,
   evidence-linked summaries, and data-quality indicators.
3. Redesign the opinion dashboard from observed fields rather than invented
   sample metrics.

### Phase 3: Official-data and opinion comparison

1. Normalize official monthly offense and judicial statistics.
2. Produce comparable category, month, geography, and source dimensions.
3. Calculate attention gaps, trend divergence, and coverage ratios without
   treating public opinion as proof.
4. Link only selected examples to official judgment/source URLs; do not build a
   local full-text judgment search service.

### Phase 4: Automation and deployment

1. Add `run_pipeline.py` as the stable command entry point for n8n.
2. Add idempotent official-data/opinion collection, retries, error reports, and
   monthly scheduling.
3. Complete remote PostgreSQL/Supabase synchronization and deployment notes.

## Agentic Development Plan

Use a small five-role team for the acquisition pilot. Run only the independent
research roles in parallel; the roles do not all need a live agent thread at
the same time:

1. `source_researcher`: read-only web and policy research; proposes official
   APIs/RSS/bulk archives before scraping and records access constraints.
2. `judicial_domain_analyst`: defines the legally meaningful data dictionary,
   including procedural roles, statutes, judges, prosecutors, counsel, appeal
   status, outcomes, and person-level publication guardrails. This role does
   not provide final legal advice or misconduct findings.
3. `data_architect`: defines source, transient processing, normalized metrics,
   aggregate, retention, and deletion layers.
4. `crawler_engineer`: implements official-statistics ingestion and one bounded
   public-opinion source adapter with fixtures.
5. `quality_reviewer`: reviews correctness, rate limiting, deduplication,
   reproducibility, security, and tests without editing the implementation.

The main agent acts as product owner, business analyst, and integration lead
for the first iteration. Add separate HR, skills-coordinator, or visualization
agents only after the pilot exposes a concrete capability gap.
Keep parallel work read-heavy where possible; allow only one implementation
agent to edit crawler code at a time to avoid conflicts and excessive token use.
