# Historical Judgment Storage Architecture

Date: 2026-06-20

> Superseded for the production dashboard on 2026-06-20. Multi-year judgment
> archiving is no longer a production goal. This report remains as an optional
> research-path capacity assessment; the active product scope stores aggregate
> metrics and source links instead of judgment full text and PDFs.

## Decision summary

The project should separate two acquisition families:

1. Court judgments: use the official Judicial Yuan monthly RAR datasets for
   both historical backfill and future incremental synchronization. Do not use
   general web scraping as the primary court-data pipeline.
2. Public opinion: use official APIs and RSS where available, then bounded HTML
   crawling for forums, news, legal commentary, and official responses.

The historical module should be reusable and idempotent, not disposable. A
single `sync_judgment_archives.py` can expose `backfill` and `incremental`
modes, persist a manifest, resume downloads, verify hashes, detect changed
`modifiedDate`/`fileSetId` values, and process the official `Delete-Infor` CSV.

## Observed local capacity

The current 202604 sample contains 100,427 JSON files.

| Layer | One month observed | One year estimate | Three years | Five years |
| --- | ---: | ---: | ---: | ---: |
| Extracted raw JSON | 0.584 GiB | 7.01 GiB | 21.0 GiB | 35.0 GiB |
| SQLite metadata index | 212.86 MiB | 2.49 GiB | 7.48 GiB | 12.47 GiB |
| CSV export | 168.52 MiB | 1.97 GiB | 5.92 GiB | 9.87 GiB |
| Approximate judgments | 100,427 | 1.21 million | 3.62 million | 6.03 million |

These are linear estimates from one month, not quotas. Monthly volume and text
length vary. The current SQLite database stores metadata and a 500-character
excerpt, not all `JFULL`; full-text storage and indexes would increase the
database materially. CSV is a redundant export and should not be retained for
every month.

The 3 GiB local target is realistic only for a curated one-year metadata/facts
database. It is not realistic for one year of all extracted raw JSON. The
actual RAR compression ratio must be measured when authenticated downloads are
automated; archive size should not be guessed from extracted size.

## Official source behavior

The Judicial Yuan dataset API currently exposes 366 judgment-related datasets.
Records are monthly RAR datasets with `categoryDataset = B`. The latest page
observed 202512 through 202604 datasets updated on 2026-06-15, plus a
`Delete-Infor` CSV. This proves that old months can be revised and deletions
must be synchronized; merely downloading each new month once is insufficient.

## Recommended storage layers

### Local experimental mode

- Keep original RAR archives and SHA-256 manifests as the recoverable source.
- Extract only the month currently being processed into a temporary working
  directory; delete extracted duplicates after indexing and validation.
- Keep SQLite metadata, extracted legal facts, crawl manifests, and aggregate
  dashboard tables locally.
- Do not keep monthly CSV exports except for explicit handoff needs.
- Store complete judgment text only when required for FTS or evidence review;
  otherwise retain archive provenance and evidence offsets/snippets.

### Supabase Free Plan fit

Official Supabase documentation currently lists, per Free project:

- 500 MB database size
- 1 GB file storage
- 5 GB egress
- two active free projects
- free projects may pause after one week of inactivity
- point-in-time recovery is not included in Free

The current one-month SQLite index is already about 213 MiB, although
PostgreSQL size will not match SQLite exactly. A full year of metadata is very
unlikely to fit in the 500 MB Free database quota. One year of uncompressed raw
JSON also cannot fit in 1 GB Storage. Therefore Supabase Free is suitable for a
small curated dashboard subset, aggregates, users, and reviewed findings, not
as the sole historical archive or full judgment database.

There is no fixed data-expiry period stated in the reviewed quota table, but
the inactivity pause and lack of Free PITR mean the project must not treat Free
Supabase as its only durable copy.

## Acquisition module boundary

### `sync_judgment_archives.py`

- `backfill --from YYYYMM --to YYYYMM`
- `incremental --since-manifest`
- authenticated monthly archive download
- resume and retry
- dataset ID, fileSet ID, modified time, size, and hash manifest
- changed-month reprocessing
- `Delete-Infor` handling
- dry-run and bounded download options

### Existing indexing pipeline

After each archive is extracted, call `build_judgment_index.py`, then future
fact extraction and validation stages. n8n should call the stable Python entry
points; it should not loop through millions of JSON documents itself.

### `collect_opinion_data.py`

This remains separate and handles public-opinion APIs, RSS, and compliant page
crawlers. Opinion records should never be mixed into judgment facts without
source type, URL, publication time, crawl run, and confidence metadata.

## Judicial-domain analyst role

The judicial-domain analyst is a first-class requirements role, not merely a
wording reviewer. The role defines which facts are meaningful by case domain:

- parties and procedural roles
- court, division/panel, judges, prosecutors, and counsel
- charges, claims, cited statutes/articles, and cited decisions
- operative order, sentence/disposition, claim and award amounts
- evidence types, procedure type, appeal availability, and appeal outcome
- reversal, remand, amendment, or deletion status
- extraction evidence location and confidence

The role must also define denominators and confounders before person-level
analysis. A judge, prosecutor, or lawyer appearing in a case is not evidence of
misconduct. Public-facing person-level controversy labels require reliable
identity resolution, role verification, appeal/final-status checks, relevant
official disciplinary or adjudicated records, and human review. Early
dashboards should expose neutral `review signals`, not rankings of
`controversial people`.

## Revised first sprint

1. Judicial-domain analyst produces the minimum legal-data dictionary and
   person-level publication guardrails.
2. Source researcher verifies authenticated download mechanics and archive
   terms, then profiles one recent RAR file and the deletion CSV.
3. Data architect finalizes raw/archive/index/facts/aggregate retention rules.
4. Only then does the crawler engineer implement the reusable archive sync
   module and a bounded public-opinion source adapter.
5. Quality reviewer verifies resumability, idempotency, hashes, deletions,
   provenance, rate limiting, and test fixtures.

## Official references

- Judicial Yuan dataset API: https://opendata.judicial.gov.tw/api/Datasets
- Judicial Yuan open-data platform: https://opendata.judicial.gov.tw/
- Supabase pricing: https://supabase.com/pricing
- Supabase billing and quota documentation:
  https://supabase.com/docs/guides/platform/billing-on-supabase
