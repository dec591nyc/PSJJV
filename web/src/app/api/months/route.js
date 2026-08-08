import { NextResponse } from 'next/server';
import client from '@/utils/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!client) {
    return NextResponse.json({ items: [] });
  }

  try {
    const rs = await client.execute(
      "SELECT report_key AS source_month, total_cases AS count FROM crime_summary_reports WHERE report_type = 'monthly' ORDER BY report_key DESC"
    );
    const items = rs.rows.map((row) => ({
      source_month: String(row.source_month || row[0]),
      count: Number(row.count ?? row[1] ?? 0),
    }));
    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (e) {
    console.error('Turso query failed in months route:', e);
    return NextResponse.json({ error: 'Failed to fetch months list' }, { status: 500 });
  }
}
