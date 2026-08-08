'use client';

import React, { useState, useEffect } from 'react';

// Generates or retrieves a unique session ID for this visitor session
function getSessionClientId() {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('psa_session_client_id');
  if (!id) {
    id = `client_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    sessionStorage.setItem('psa_session_client_id', id);
  }
  return id;
}

export default function ActiveUsersBadge() {
  const [activeSessions, setActiveSessions] = useState(1);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const clientId = getSessionClientId();

    // Send presence heartbeat to track actual live visitors
    async function sendHeartbeat() {
      try {
        const res = await fetch('/api/active-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.active_sessions !== undefined) {
            setPulsing(true);
            setActiveSessions(data.active_sessions);
            setTimeout(() => {
              if (isMounted) setPulsing(false);
            }, 500);
          }
        }
      } catch (e) {
        // Ignore network hiccups
      }
    }

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="active-users-pill"
      title={`目前即時在線人數：${activeSessions} 人`}
    >
      <span className={`live-pulse-dot ${pulsing ? 'glow' : ''}`}></span>
      <span className="live-label">即時在線</span>
      <strong className={`live-number ${pulsing ? 'highlight' : ''}`}>
        {activeSessions}
      </strong>
      <span className="live-unit">人</span>
    </div>
  );
}
