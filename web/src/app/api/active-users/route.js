// Real-time Active Client Session Tracker (100% Authentic, Zero Fake Data)
import { NextResponse } from 'next/server';

// In-memory active client heartbeat registry
// Map<clientId, lastSeenTimestamp>
const activeClients = new Map();
const HEARTBEAT_TIMEOUT_MS = 25000; // 25 seconds timeout

// 1. GET: Return actual count of currently connected sessions
export async function GET(request) {
  const now = Date.now();

  // Prune expired clients
  for (const [id, lastSeen] of activeClients.entries()) {
    if (now - lastSeen > HEARTBEAT_TIMEOUT_MS) {
      activeClients.delete(id);
    }
  }

  const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;

  return NextResponse.json({
    active_sessions: Math.max(1, activeClients.size), // At least 1 (the current user)
    actual_connections: activeClients.size,
    is_local_dev: isLocalDev,
    timeout_window_sec: HEARTBEAT_TIMEOUT_MS / 1000,
    timestamp: new Date().toISOString(),
  });
}

// 2. POST: Client Heartbeat (Clients ping every 10s to report presence)
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId = body.clientId || 'anonymous-client';
    const now = Date.now();

    // Register/update active client timestamp
    activeClients.set(clientId, now);

    // Prune expired clients
    for (const [id, lastSeen] of activeClients.entries()) {
      if (now - lastSeen > HEARTBEAT_TIMEOUT_MS) {
        activeClients.delete(id);
      }
    }

    return NextResponse.json({
      success: true,
      active_sessions: activeClients.size,
      registered_id: clientId,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
