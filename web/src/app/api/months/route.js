import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import client from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

const getMonths = unstable_cache(
  async () => {
    if (client) {
      try {
        const rs = await client.execute(
          "SELECT report_key AS source_month, total_cases AS count FROM crime_summary_reports WHERE report_type = 'monthly' ORDER BY report_key DESC"
        );
        return rs.rows.map((row) => ({
          source_month: String(row.source_month || row[0]),
          count: Number(row.count ?? row[1] ?? 0),
        }));
      } catch (err) {
        console.error('Turso query failed in months route:', err.message);
      }
    }
    return [];
  },
  ['official-months-list'],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const items = await getMonths();
    return NextResponse.json({ items }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('Database query failed:', e);
    return NextResponse.json({ error: 'Failed to fetch months list' }, { status: 500 });
  }
}
