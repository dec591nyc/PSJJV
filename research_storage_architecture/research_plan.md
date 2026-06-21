# Historical Judgment Storage Architecture Research Plan

## Main question

How should the project backfill one, three, and five years of Judicial Yuan
open judgment data, then switch to incremental collection, while remaining a
low-cost experimental project?

## Subtopics

1. Measure the current 202604 raw files, SQLite index, exports, and any archives;
   use these observations to estimate one-, three-, and five-year capacity.
2. Verify official Judicial Yuan distribution and update mechanisms so the
   design separates historical backfill from incremental ingestion correctly.
3. Verify current Supabase Free Plan database, storage, retention, pause, and
   egress constraints using official documentation.
4. Synthesize a tiered local/object-storage/database architecture and identify
   the decision thresholds for moving beyond local storage.

## Expected output

- A distinction between one-time historical backfill and recurring incremental
  ingestion modules.
- Capacity estimates with assumptions and uncertainty ranges.
- A recommendation for what belongs in local raw storage, compressed archives,
  SQLite/PostgreSQL, and optional object storage.
- A revised agent roster in which a judicial-domain analyst defines legally
  meaningful fields and review guardrails before large-scale extraction.
