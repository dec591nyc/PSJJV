import { NextResponse } from 'next/server';
import client from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const safeJsonParse = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

async function getSummaryReport(reportKey) {
  if (!client) {
    return null;
  }

  try {
    // 1. Try reading from pre-computed payload cache
    const cacheRs = await client.execute({
      sql: 'SELECT payload FROM crime_summary_payload_cache WHERE cache_key = ?',
      args: [`official-summary:${reportKey}`],
    });

    if (cacheRs.rows?.length > 0) {
      const rawPayload = cacheRs.rows[0].payload || cacheRs.rows[0][0];
      return safeJsonParse(rawPayload);
    }

    // 2. Fallback: Query crime_summary_reports directly
    const isAnnual = reportKey.endsWith('_annual');
    const reportRs = await client.execute({
      sql: 'SELECT * FROM crime_summary_reports WHERE report_key = ?',
      args: [reportKey],
    });

    if (reportRs.rows?.length === 0) {
      return null;
    }

    const row = reportRs.rows[0];
    const monthlyCountsRs = await client.execute({
      sql: `
        SELECT report_key AS month, total_cases AS count
        FROM crime_summary_reports
        WHERE report_type = 'monthly'
          AND (
            (? = 1 AND report_key LIKE ?)
            OR (? = 0 AND report_key <= ?)
          )
        ORDER BY report_key ASC
      `,
      args: [
        isAnnual ? 1 : 0,
        isAnnual ? `${reportKey.split('_')[0]}%` : '',
        isAnnual ? 1 : 0,
        reportKey,
      ],
    });

    const monthlyCounts = monthlyCountsRs.rows.map((r) => ({
      month: String(r.month || r[0]),
      count: Number(r.count ?? r[1] ?? 0),
    }));

    return {
      source_month: row.report_key,
      source_url: row.source_url,
      dataset_id: row.dataset_id,
      total_cases: Number(row.total_cases || 0),
      total_change_pct: row.total_change_pct ? parseFloat(row.total_change_pct) : null,
      safety_index: Number(row.safety_index || 0),
      monthly_counts: monthlyCounts,
      category_counts: safeJsonParse(row.category_counts, []),
      iccs_breakdown: safeJsonParse(row.iccs_breakdown, []),
      flags_summary: safeJsonParse(row.flags_summary, {}),
      topic_drilldowns: safeJsonParse(row.topic_drilldowns, []),
      annual_comparison: safeJsonParse(row.annual_comparison, {}),
      region_weighted_counts: safeJsonParse(row.region_weighted_counts, []),
      region_metric: '詐欺背信',
      region_counts: safeJsonParse(row.region_counts, []),
      quality: safeJsonParse(row.quality, {}),
      summary: safeJsonParse(row.summary, {}),
    };
  } catch (err) {
    console.error(`Turso query failed for ${reportKey}:`, err);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const selectedMonth = searchParams.get('month') || '202606';

  try {
    const payload = await getSummaryReport(selectedMonth);

    if (!payload) {
      return NextResponse.json({ error: `Report ${selectedMonth} not found` }, { status: 404 });
    }

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (e) {
    console.error(`Query failed for ${selectedMonth}:`, e);
    return NextResponse.json({ error: 'Failed to fetch report summary' }, { status: 500 });
  }
}
