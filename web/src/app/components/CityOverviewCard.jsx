'use client';

import React from 'react';

const fmt = new Intl.NumberFormat('zh-TW');

export default function CityOverviewCard({
  selectedGeo = '全部縣市',
  allRegionsData = [],
  totalCases = 0,
  safetyIndex = 85,
  yoyChangePct = 0,
}) {
  // 計算在 22 縣市中的案件排名
  const sortedRegions = [...allRegionsData]
    .filter((r) => r.geography !== '全部縣市')
    .sort((a, b) => (b.total || 0) - (a.total || 0));

  const currentRank = sortedRegions.findIndex((r) => r.geography === selectedGeo) + 1;
  const currentRegion = sortedRegions.find((r) => r.geography === selectedGeo);

  const cityTotal = currentRegion ? currentRegion.total : totalCases;
  const cityYoy = currentRegion ? currentRegion.yoy_pct : yoyChangePct;

  const isNational = selectedGeo === '全部縣市';

  return (
    <div className="city-overview-hero">
      <div className="city-hero-header">
        <div className="city-tag-group">
          <span className="city-badge">{isNational ? '全台總覽' : '我的縣市'}</span>
          <h2 className="city-name">{selectedGeo}</h2>
        </div>
        {!isNational && currentRank > 0 && (
          <div className="city-rank-badge">
            案件規模全台第 <strong>#{currentRank}</strong> / 22 縣市
          </div>
        )}
      </div>

      <div className="city-kpi-grid">
        <div className="city-kpi-card">
          <div className="kpi-label">累計總案件數</div>
          <div className="kpi-value">{fmt.format(cityTotal || 0)} <span className="kpi-unit">件</span></div>
          <div className="kpi-sub">
            {isNational ? '全台官方通報總量' : `佔全台約 ${currentRegion?.share_pct || 0}% 案量`}
          </div>
        </div>

        <div className="city-kpi-card">
          <div className="kpi-label">與去年同期相比 (YoY)</div>
          <div className={`kpi-value ${cityYoy > 0 ? 'up' : cityYoy < 0 ? 'down' : ''}`}>
            {cityYoy > 0 ? `+${cityYoy.toFixed(1)}%` : `${cityYoy ? cityYoy.toFixed(1) : 0}%`}
          </div>
          <div className="kpi-sub">
            {cityYoy > 0 ? '呈擴大走勢，需關注警報' : '較去年同期趨緩改善'}
          </div>
        </div>

        <div className="city-kpi-card">
          <div className="kpi-label">綜合安全指數</div>
          <div className="kpi-value safety-score">
            {safetyIndex} <span className="kpi-unit">/ 100</span>
          </div>
          <div className="kpi-sub">加權嚴重度常模估算</div>
        </div>
      </div>
    </div>
  );
}
