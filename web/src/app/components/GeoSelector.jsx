'use client';

import React from 'react';

const REGION_SHORTCUTS = [
  '全部縣市',
  '臺北市',
  '新北市',
  '桃園市',
  '臺中市',
  '臺南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '澎湖縣',
  '金門縣',
  '連江縣',
];

export default function GeoSelector({
  selectedGeo,
  onSelectGeo,
  allRegionsData = [],
}) {
  const getGeoStatus = (geoName) => {
    if (geoName === '全部縣市') return null;
    const found = allRegionsData.find((r) => r.geography === geoName);
    if (!found) return null;
    const yoy = Number(found.yoy_pct || 0);
    return {
      total: found.total || 0,
      yoy: yoy,
      isSurge: yoy > 15,
      isDrop: yoy < -10,
    };
  };

  return (
    <section className="geo-selector-container">
      <div className="geo-selector-header">
        <div className="geo-selector-title">
          <span className="geo-icon">📍</span>
          <div>
            <h3>縣市治安快選視角</h3>
            <p className="geo-subtitle">
              點擊鎖定您所在的縣市，即時查看治安升降雷達與異常警報
            </p>
          </div>
        </div>
        {selectedGeo !== '全部縣市' && (
          <button
            type="button"
            className="geo-reset-btn"
            onClick={() => onSelectGeo('全部縣市')}
          >
            ← 返回全台總盤
          </button>
        )}
      </div>

      <div className="geo-pills-wrapper">
        {REGION_SHORTCUTS.map((geo) => {
          const isSelected = selectedGeo === geo;
          const status = getGeoStatus(geo);

          return (
            <button
              key={geo}
              type="button"
              className={`geo-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectGeo(geo)}
            >
              <span className="geo-pill-name">{geo}</span>
              {status && (
                <span
                  className={`geo-pill-badge ${
                    status.isSurge ? 'surge' : status.isDrop ? 'drop' : 'neutral'
                  }`}
                >
                  {status.yoy > 0 ? `+${status.yoy.toFixed(0)}%` : `${status.yoy.toFixed(0)}%`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
