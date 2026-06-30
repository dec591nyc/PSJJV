import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import pool from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

const getSummaryReport = unstable_cache(
  async (reportKey) => {
    let payloadResult = null;
    try {
      payloadResult = await pool.query(
        'SELECT payload FROM crime_summary_payload_cache WHERE cache_key = $1',
        [`official-summary:${reportKey}`]
      );
    } catch (e) {
      if (e.code !== '42P01') {
        throw e;
      }
    }

    if (payloadResult?.rows.length === 0) {
      return null;
    }

    if (payloadResult?.rows[0]?.payload) {
      return payloadResult.rows[0].payload;
    }

    const isAnnual = reportKey.endsWith('_annual');
    const year = isAnnual ? parseInt(reportKey.split('_')[0], 10) : null;

    const result = await pool.query(
      `
      WITH report AS (
        SELECT
          report_key,
          report_type,
          source_url,
          dataset_id,
          total_cases,
          total_change_pct,
          safety_index,
          category_counts,
          iccs_breakdown,
          flags_summary,
          topic_drilldowns,
          region_weighted_counts,
          region_counts,
          quality,
          summary
        FROM crime_summary_reports
        WHERE report_key = $1
      ),
      monthly_counts AS (
        SELECT COALESCE(
          json_agg(json_build_object('month', report_key, 'count', total_cases) ORDER BY report_key ASC),
          '[]'::json
        ) AS items
        FROM crime_summary_reports
        WHERE report_type = 'monthly'
          AND (
            ($2::boolean = true AND report_key LIKE $3)
            OR ($2::boolean = false AND report_key <= $1)
          )
      )
      SELECT report.*, monthly_counts.items AS monthly_counts
      FROM report
      CROSS JOIN monthly_counts
      `,
      [reportKey, isAnnual, isAnnual ? `${year}%` : '']
    );

    const summary = result.rows[0];
    if (!summary) {
      return null;
    }

    return {
      source_month: summary.report_key,
      source_url: summary.source_url,
      dataset_id: summary.dataset_id,
      total_cases: summary.total_cases,
      total_change_pct: summary.total_change_pct ? parseFloat(summary.total_change_pct) : null,
      safety_index: summary.safety_index,
      monthly_counts: summary.monthly_counts || [],
      category_counts: summary.category_counts,
      iccs_breakdown: summary.iccs_breakdown,
      flags_summary: summary.flags_summary,
      topic_drilldowns: summary.topic_drilldowns,
      region_weighted_counts: summary.region_weighted_counts,
      region_metric: 'è©æ¬ºèƒŒä¿¡',
      region_counts: summary.region_counts,
      quality: summary.quality,
      summary: summary.summary,
    };
  },
  ['official-summary-report'],
  { revalidate: 3600 }
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const selectedMonth = searchParams.get('month') || '202604';

  if (!pool) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const payload = await getSummaryReport(selectedMonth);

    if (!payload) {
      return NextResponse.json({ error: `Report ${selectedMonth} not found` }, { status: 404 });
    }

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error(`Database query failed for ${selectedMonth}:`, e);
    return NextResponse.json({ error: 'Failed to fetch report summary' }, { status: 500 });
  }
}
