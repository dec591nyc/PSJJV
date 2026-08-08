'use client';

import React from 'react';

const fmt = new Intl.NumberFormat('zh-TW');

export default function SurgeRadar({
  selectedGeo = '全部縣市',
  activeTopicData = null,
}) {
  if (!activeTopicData) return null;

  // 1. 取得目標縣市的資料紀錄
  let regionRecord = null;
  const breakdowns = activeTopicData.region_breakdowns || activeTopicData.top_regions || [];
  
  if (selectedGeo === '全部縣市') {
    regionRecord = {
      geography: '全部縣市',
      total: activeTopicData.total || 0,
      previous_year_total: activeTopicData.previous_year_total,
      yoy_pct: activeTopicData.yoy_pct,
      segments: activeTopicData.segments || [],
    };
  } else {
    regionRecord = breakdowns.find((r) => r.geography === selectedGeo);
  }

  if (!regionRecord) {
    return (
      <div className="surge-radar-card empty">
        <p>目前「{selectedGeo}」在此主題暫無細項資料。</p>
      </div>
    );
  }

  const segments = regionRecord.segments || [];

  // 2. 雙軌異常判定算法
  const analyzedSegments = segments.map((seg) => {
    const count = Number(seg.count || 0);
    const share = Number(seg.share_pct || 0);
    // 推算或使用細部 YoY
    const diff = Number(seg.diff || 0);
    const yoy = seg.yoy_pct !== undefined ? Number(seg.yoy_pct) : 0;

    let status = 'stable';
    let statusLabel = '保持平穩';
    let statusIcon = '⚖️';
    let badgeClass = 'badge-stable';

    if (yoy > 15 && diff >= 10) {
      status = 'surge';
      statusLabel = '🚨 異常激增';
      statusIcon = '🚨';
      badgeClass = 'badge-surge';
    } else if (yoy >= 5 && diff > 0) {
      status = 'rising';
      statusLabel = '📈 持續上升';
      statusIcon = '📈';
      badgeClass = 'badge-rising';
    } else if (yoy <= -10 && diff <= -10) {
      status = 'dropping';
      statusLabel = '🟢 明顯改善';
      statusIcon = '🟢';
      badgeClass = 'badge-dropping';
    }

    return {
      ...seg,
      count,
      share,
      diff,
      yoy,
      status,
      statusLabel,
      statusIcon,
      badgeClass,
    };
  });

  const surgeItems = analyzedSegments.filter((s) => s.status === 'surge');
  const risingItems = analyzedSegments.filter((s) => s.status === 'rising');
  const droppingItems = analyzedSegments.filter((s) => s.status === 'dropping');

  return (
    <section className="surge-radar-section">
      <div className="surge-radar-header">
        <div className="surge-title-wrap">
          <span className="radar-icon">⚡</span>
          <div>
            <h3>【{selectedGeo}】治安升降雷達與異常警報</h3>
            <p className="surge-subtitle">
              雙軌門檻判定：同時檢驗 YoY 增長幅度與絕對案件增量，排除基數雜訊
            </p>
          </div>
        </div>

        <div className="surge-quick-stats">
          <div className="quick-stat-badge surge">
            <span className="badge-dot" />
            異常激增：<strong>{surgeItems.length}</strong> 項
          </div>
          <div className="quick-stat-badge rising">
            <span className="badge-dot" />
            持續上升：<strong>{risingItems.length}</strong> 項
          </div>
          <div className="quick-stat-badge dropping">
            <span className="badge-dot" />
            明顯改善：<strong>{droppingItems.length}</strong> 項
          </div>
        </div>
      </div>

      <div className="surge-cards-grid">
        {/* 🚨 異常激增清單 */}
        <div className="surge-box alert-box">
          <div className="surge-box-title">
            <span className="icon">🚨</span>
            <h4>重點警戒／異常激增案件</h4>
          </div>
          <div className="surge-items-list">
            {surgeItems.length > 0 ? (
              surgeItems.map((item) => (
                <div key={item.metric} className="surge-item-row">
                  <div className="item-main">
                    <span className="item-label" style={{ borderLeftColor: item.color || '#dc2626' }}>
                      {item.label || item.metric}
                    </span>
                    <span className="item-count">{fmt.format(item.count)} 件</span>
                  </div>
                  <div className="item-change surge-text">
                    +{item.yoy.toFixed(1)}% (增加 {fmt.format(Math.abs(item.diff))} 件)
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notice">
                <span>🛡️</span> 本期無達標之異常激增項目，總體控制穩定。
              </div>
            )}
          </div>
        </div>

        {/* 📈 持續上升清單 */}
        <div className="surge-box warning-box">
          <div className="surge-box-title">
            <span className="icon">📈</span>
            <h4>關注趨勢／持續上升案件</h4>
          </div>
          <div className="surge-items-list">
            {risingItems.length > 0 ? (
              risingItems.slice(0, 4).map((item) => (
                <div key={item.metric} className="surge-item-row">
                  <div className="item-main">
                    <span className="item-label" style={{ borderLeftColor: item.color || '#ea580c' }}>
                      {item.label || item.metric}
                    </span>
                    <span className="item-count">{fmt.format(item.count)} 件</span>
                  </div>
                  <div className="item-change rising-text">
                    +{item.yoy.toFixed(1)}%
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notice">
                <span>✨</span> 本期無明顯上升項目。
              </div>
            )}
          </div>
        </div>

        {/* 🟢 明顯改善清單 */}
        <div className="surge-box success-box">
          <div className="surge-box-title">
            <span className="icon">🟢</span>
            <h4>防治有成／顯著下降案件</h4>
          </div>
          <div className="surge-items-list">
            {droppingItems.length > 0 ? (
              droppingItems.slice(0, 4).map((item) => (
                <div key={item.metric} className="surge-item-row">
                  <div className="item-main">
                    <span className="item-label" style={{ borderLeftColor: item.color || '#16a34a' }}>
                      {item.label || item.metric}
                    </span>
                    <span className="item-count">{fmt.format(item.count)} 件</span>
                  </div>
                  <div className="item-change dropping-text">
                    {item.yoy.toFixed(1)}% (減少 {fmt.format(Math.abs(item.diff))} 件)
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notice">
                <span>📊</span> 案件維持在正常區間。
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
