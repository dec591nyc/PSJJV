import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import pool from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

const getMonths = unstable_cache(
  async () => {
    const result = await pool.query(
      "SELECT report_key AS source_month, total_cases AS count FROM crime_summary_reports WHERE report_type = 'monthly' ORDER BY report_key DESC"
    );
    return result.rows;
  },
  ['official-months-list'],
  { revalidate: 3600 }
);

export async function GET() {
  if (!pool) {
    return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
  }

  try {
    const items = await getMonths();
    return NextResponse.json({ items }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('Database query failed:', e);
    return NextResponse.json({ error: 'Failed to fetch months list' }, { status: 500 });
  }
}
