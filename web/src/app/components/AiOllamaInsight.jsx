'use client';

import React, { useState, useEffect } from 'react';

export default function AiOllamaInsight({
  topicRecord,
  selectedMonth,
  totalCases,
  yoyPct,
}) {
  const [perspective, setPerspective] = useState('police'); // 'police' | 'public' | 'statistic'
  const [engineStatus, setEngineStatus] = useState({
    available: false,
    engine: 'builtin',
    provider: '內建統計引擎',
    model: '',
    loading: true,
  });
  const [aiResponse, setAiResponse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Check AI engine connectivity on mount (Gemini -> Ollama -> Built-in)
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch('/api/ai/analyze');
        const data = await res.json();
        if (isMounted) {
          setEngineStatus({
            available: !!data.available,
            engine: data.engine || 'builtin',
            provider: data.provider || (data.engine === 'gemini' ? 'Gemini Flash' : '內建統計引擎'),
            model: data.model || '',
            loading: false,
          });
        }
      } catch (err) {
        if (isMounted) {
          setEngineStatus({
            available: false,
            engine: 'builtin',
            provider: '內建統計引擎',
            model: '',
            loading: false,
          });
        }
      }
    }
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch or generate AI insight whenever perspective or topic changes
  const handleGenerate = async (targetPerspective = perspective) => {
    if (!topicRecord) return;
    setGenerating(true);
    setErrorMsg('');
    setAiResponse('');

    try {
      const payload = {
        topic: topicRecord.label || '全刑案總量',
        periodLabel: selectedMonth?.endsWith('_annual') ? `${selectedMonth.slice(0, 4)} 年度累計` : selectedMonth,
        totalCases: topicRecord.total || totalCases || 0,
        yoyPct: topicRecord.yoy_pct !== undefined ? topicRecord.yoy_pct : yoyPct,
        perspective: targetPerspective,
        topRegions: topicRecord.region_breakdowns || topicRecord.top_regions || [],
        segments: topicRecord.segments || [],
      };

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.response) {
        setAiResponse(data.response);
        if (data.provider) {
          setEngineStatus(prev => ({
            ...prev,
            provider: data.provider,
            engine: data.engine,
            model: data.model || prev.model,
          }));
        }
      } else {
        setErrorMsg(data.error || '目前使用內建統計洞察。');
      }
    } catch (err) {
      setErrorMsg('生成請求異常，已切換至內建統計洞察。');
    } finally {
      setGenerating(false);
    }
  };

  const handlePerspectiveChange = (p) => {
    setPerspective(p);
    if (engineStatus.available) {
      handleGenerate(p);
    }
  };

  // Built-in rule-based fallback summary
  const builtInObservation = () => {
    const topicLabel = topicRecord?.label || '全部案件';
    const total = Number(topicRecord?.total || totalCases || 0).toLocaleString();
    const yoy = topicRecord?.yoy_pct !== undefined ? topicRecord.yoy_pct : yoyPct;
    const yoyText = yoy > 0 ? `成長 +${yoy}%` : yoy < 0 ? `減少 ${yoy}%` : '持平';
    const top1Region = topicRecord?.region_breakdowns?.[0] || topicRecord?.top_regions?.[0];
    const top1Segment = topicRecord?.segments?.[0];

    if (perspective === 'police') {
      return `【警政情報摘要】${topicLabel}於本期統計共錄得 ${total} 件，相較去年同期呈${yoyText}趨勢。案量主要集中於${top1Region ? `${top1Region.geography}（${Number(top1Region.total).toLocaleString()}件）` : '重點都會區'}；核心罪名以${top1Segment ? `「${top1Segment.label}」佔比 ${top1Segment.share_pct}%` : '特定刑案'}為主，建議持續強化熱區巡邏與專案溯源。`;
    }
    if (perspective === 'public') {
      return `【民生防範提醒】針對${topicLabel}（本期共 ${total} 件，同期${yoyText}），民眾應特別留意${top1Segment ? `「${top1Segment.label}」之常見手法` : '人身財產安全'}，若接獲可疑通訊或發現治安死角，請善用 110/165 專線求證並落實門戶安全。`;
    }
    return `【統計異動歸因】本期${topicLabel}總案量 ${total} 件（YoY ${yoy > 0 ? '+' : ''}${yoy}%）。指標受${top1Region?.geography || '主要都會區'}通報登錄節奏影響顯著，需結合歷年同期基期效應進行綜合研判。`;
  };

  const isGemini = engineStatus.engine === 'gemini';
  const isOllama = engineStatus.engine === 'ollama';

  return (
    <div className="ai-ollama-card">
      <div className="ai-ollama-header">
        <div className="ai-header-left">
          <span className="ai-badge">
            {isGemini ? '⚡ Gemini Flash AI' : isOllama ? '🤖 Ollama 本地 AI' : '📊 智慧統計分析'}
          </span>
          <h3 className="ai-title">
            治安情報 AI 深度研判 {isGemini ? '(Powered by Google Gemini Flash)' : '(Powered by LLM)'}
          </h3>
        </div>
        <div className="ai-header-right">
          <div className={`ollama-status-indicator ${engineStatus.available ? 'online' : 'fallback'}`}>
            <span className="dot"></span>
            <span className="status-label">
              {engineStatus.loading
                ? '檢查中...'
                : engineStatus.available
                ? `${engineStatus.provider} (${engineStatus.model || 'Flash'})`
                : '離線備援 (內建統計引擎)'}
            </span>
          </div>
          <button
            type="button"
            className="ai-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? '收合 AI 面板' : '展開 AI 面板'}
          >
            {isExpanded ? '▲ 收合' : '▼ 展開'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="ai-ollama-body">
          <div className="ai-controls-bar">
            <div className="perspective-tabs" role="tablist">
              <button
                type="button"
                className={`p-tab ${perspective === 'police' ? 'active' : ''}`}
                onClick={() => handlePerspectiveChange('police')}
              >
                🔍 警政情報視角
              </button>
              <button
                type="button"
                className={`p-tab ${perspective === 'public' ? 'active' : ''}`}
                onClick={() => handlePerspectiveChange('public')}
              >
                🛡️ 民眾防範觀點
              </button>
              <button
                type="button"
                className={`p-tab ${perspective === 'statistic' ? 'active' : ''}`}
                onClick={() => handlePerspectiveChange('statistic')}
              >
                📊 統計歸因分析
              </button>
            </div>

            {engineStatus.available && (
              <button
                type="button"
                className="ai-generate-btn"
                onClick={() => handleGenerate()}
                disabled={generating}
              >
                {generating ? '✨ AI 研判中...' : '⚡ 重新深度解讀'}
              </button>
            )}
          </div>

          <div className="ai-output-box">
            {generating ? (
              <div className="ai-loading-state">
                <span className="spinner"></span>
                <span>{engineStatus.provider} 正在針對「{topicRecord?.label || '當前主題'}」進行高速多維度情報推論...</span>
              </div>
            ) : aiResponse ? (
              <div className="ai-generated-text">
                <div className="ai-meta-tag">
                  ✨ {engineStatus.provider} ({engineStatus.model || 'Flash'}) 即時推論生成
                </div>
                <p>{aiResponse}</p>
              </div>
            ) : (
              <div className="ai-fallback-text">
                <p>{builtInObservation()}</p>
                {!engineStatus.available && !engineStatus.loading && (
                  <div className="ollama-guide-tip">
                    💡 提示：於 <code>.env</code> 設定 <code>GEMINI_API_KEY</code> 可一秒啟用 <strong>Google Gemini Flash</strong> 高速雲端解讀，或於本機執行 <code>ollama run llama3.2</code> 啟用本地離線模型！
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
