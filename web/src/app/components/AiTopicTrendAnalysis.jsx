'use client';

import React, { useState, useEffect } from 'react';

const fmt = new Intl.NumberFormat('zh-TW');

const deltaClass = (value) => {
  const num = Number(value || 0);
  return num > 0 ? 'up' : num < 0 ? 'down' : '';
};

const formatSignedCount = (value) => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  return `${num > 0 ? '+' : ''}${fmt.format(num)}`;
};

const formatMonthLabel = (value) => {
  if (/^\d{6}$/.test(value)) {
    return `${value.slice(0, 4)}/${value.slice(4, 6)}`;
  }
  if (/^\d{4}_annual$/.test(value)) {
    return `${value.slice(0, 4)} 年累計`;
  }
  return value;
};

export default function AiTopicTrendAnalysis({
  topic,
  selectedMonth,
  totalCases,
  yoyPct,
}) {
  const [perspective, setPerspective] = useState('police'); // 'police' | 'public' | 'statistic'
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [aiText, setAiText] = useState('');
  const [apiError, setApiError] = useState('');
  const [latencyMs, setLatencyMs] = useState(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch Dynamic AI Intelligence
  const handleLlmGenerate = async (targetPerspective = perspective, modelOverride = selectedModel) => {
    if (!topic) return;
    setIsGenerating(true);
    setApiError('');

    try {
      const payload = {
        topic: topic.label,
        periodLabel: selectedMonth?.endsWith('_annual') ? `${selectedMonth.slice(0, 4)} 年度累計` : formatMonthLabel(selectedMonth || '202606'),
        totalCases: topic.total || totalCases || 0,
        yoyPct: topic.yoy_pct !== undefined ? topic.yoy_pct : yoyPct,
        perspective: targetPerspective,
        selectedModel: modelOverride,
        topRegions: topic.region_breakdowns || topic.top_regions || [],
        segments: topic.segments || [],
        refreshSeed: Date.now(), // Ensure completely fresh generation
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.response) {
        setAiText(data.response);
        setLatencyMs(data.latency_ms || 400);
        setGeneratedAt(data.generated_at || new Date().toLocaleTimeString('zh-TW', { hour12: false }));
      } else {
        setAiText('');
        if (data.error) {
          setApiError(data.error);
        }
      }
    } catch (e) {
      setApiError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleLlmGenerate(perspective, selectedModel);
  }, [topic?.id, selectedMonth]);

  if (!topic) return null;

  const series = topic.trend || [];
  const validSeries = series.filter(item => Number(item.count || 0) > 0);
  const latest = validSeries[validSeries.length - 1] || series[series.length - 1] || { month: selectedMonth || '202606', count: topic.total || 0 };
  const previous = validSeries[validSeries.length - 2] || { month: '', count: latest.count };
  const latestCount = Number(latest.count || 0);
  const previousCount = Number(previous.count || 0);
  const average = series.length ? series.reduce((acc, row) => acc + Number(row.count || 0), 0) / series.length : latestCount;

  const peak = [...series].sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0] || latest;
  const low = [...series].sort((a, b) => Number(a.count || 0) - Number(b.count || 0))[0] || latest;
  const delta = latestCount - previousCount;

  const handlePerspectiveSelect = (p) => {
    setPerspective(p);
    handleLlmGenerate(p, selectedModel);
  };

  const handleModelSelect = (e) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    handleLlmGenerate(perspective, newModel);
  };

  return (
    <div className="topic-ai-analysis-container">
      <div className="topic-ai-analysis premium-card">
        {/* Header Bar */}
        <div className="topic-analysis-head">
          <div className="head-left">
            <span className="ai-engine-tag gemini">
              ⚡ AI 治安情勢情報研判
            </span>
            <strong className="topic-head-title">
              {topic.label} ({formatMonthLabel(latest.month)}：{fmt.format(latestCount)} 件)
            </strong>
          </div>

          <div className="head-right">
            <div className="model-selector-wrapper">
              <label htmlFor="ai-model-select" className="model-label">模型：</label>
              <select
                id="ai-model-select"
                className="ai-model-dropdown"
                value={selectedModel}
                onChange={handleModelSelect}
                aria-label="選擇 AI 分析模型"
              >
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (推薦·極速)</option>
                <option value="gemini-flash-latest">Gemini Flash (Latest 最新版)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Notice (If any) */}
        {apiError && (
          <div className="gemini-error-banner">
            <div className="error-title">AI 分析服務反饋：</div>
            <div className="error-body">{apiError}</div>
          </div>
        )}

        {/* Evidence Chips */}
        <div className="evidence-grid compact vibrant-evidence" style={{ margin: '12px 0' }}>
          <div className="evidence-chip chip-yoy">
            <span>較前月增減</span>
            <strong className={deltaClass(delta)}>{formatSignedCount(delta)}</strong>
          </div>
          <div className="evidence-chip chip-avg">
            <span>近 12 月均線</span>
            <strong>{fmt.format(Math.round(average))} 件</strong>
          </div>
          <div className="evidence-chip chip-peak">
            <span>歷史高峰月</span>
            <strong>
              {formatMonthLabel(peak.month)} · {fmt.format(Number(peak.count || 0))}
            </strong>
          </div>
          <div className="evidence-chip chip-low">
            <span>歷史低點月</span>
            <strong>
              {formatMonthLabel(low.month)} · {fmt.format(Number(low.count || 0))}
            </strong>
          </div>
        </div>

        {/* Perspective Controls */}
        <div className="trend-ai-controls">
          <div className="perspective-tabs compact-tabs" role="tablist">
            <button
              type="button"
              className={`p-tab ${perspective === 'police' ? 'active police-active' : ''}`}
              onClick={() => handlePerspectiveSelect('police')}
            >
              🔍 警政執法情勢
            </button>
            <button
              type="button"
              className={`p-tab ${perspective === 'public' ? 'active public-active' : ''}`}
              onClick={() => handlePerspectiveSelect('public')}
            >
              🛡️ 民生防範觀點
            </button>
            <button
              type="button"
              className={`p-tab ${perspective === 'statistic' ? 'active statistic-active' : ''}`}
              onClick={() => handlePerspectiveSelect('statistic')}
            >
              📊 統計異動歸因
            </button>
          </div>

          <button
            type="button"
            className="llm-generate-trigger"
            onClick={() => handleLlmGenerate(perspective, selectedModel)}
            disabled={isGenerating}
          >
            {isGenerating ? '✨ 正在動態推論中...' : '⚡ 重新產出情報'}
          </button>
        </div>

        {/* Intelligence Output Box: Dynamic & Fresh */}
        <div className="trend-ai-text-box premium-box">
          {isGenerating ? (
            <div className="ai-loading-state">
              <span className="spinner"></span>
              <span>正在向 Google 伺服器請求「{topic.label}」最新即時推論...</span>
            </div>
          ) : aiText ? (
            <div className="llm-generated-content">
              <div className="llm-badge-line">
                <span className="source-tag">{selectedModel}</span>
                <span className="dot-divider">·</span>
                <span className="view-tag">
                  {perspective === 'police' ? '警政專案查緝' : perspective === 'public' ? '民生防範守則' : '統計基期歸因'}
                </span>
                {generatedAt && (
                  <>
                    <span className="dot-divider">·</span>
                    <span className="latency-tag">產出時間：{generatedAt}</span>
                  </>
                )}
                {latencyMs && (
                  <>
                    <span className="dot-divider">·</span>
                    <span className="latency-tag">耗時：{latencyMs}ms</span>
                  </>
                )}
              </div>
              <div className="llm-paragraph-content">
                {aiText.split('\n\n').map((para, idx) => (
                  <p key={idx} className="llm-paragraph">{para}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-loading-state">
              <span>載入情報中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
