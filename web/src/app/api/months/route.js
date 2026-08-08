import { NextResponse } from 'next/server';
import client from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory cache for months list
let monthsCache = null;
let monthsCacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  if (!client) {
    return NextResponse.json({ items: [] });
  }

  // Check in-memory cache
  if (monthsCache && Date.now() - monthsCacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { items: monthsCache },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  }

  try {
    const rs = await client.execute(
      "SELECT report_key AS source_month, total_cases AS count FROM crime_summary_reports WHERE report_type = 'monthly' ORDER BY report_key DESC"
    );
    const items = rs.rows.map((row) => ({
      source_month: String(row.source_month || row[0]),
      count: Number(row.count ?? row[1] ?? 0),
    }));

    monthsCache = items;
    monthsCacheTimestamp = Date.now();

    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (e) {
    console.error('Turso query failed in months route:', e);
    return NextResponse.json({ error: 'Failed to fetch months list' }, { status: 500 });
  }
}
