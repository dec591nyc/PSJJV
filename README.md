# 台灣地方治安統計數據分析平台 

(Taiwan Local Public Safety Statistics & Data Integrity Audit Platform)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Turso-Cloud_SQLite-00EB8F?style=for-the-badge&logo=sqlite&logoColor=black" alt="Turso SQLite" />
  <img src="https://img.shields.io/badge/GitHub_Actions-Automated_ETL-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

💡 **本治安統計分析平台結合 Next.js 數據儀表板、Python 數據校對 ETL 及 Turso 雲端原生 SQLite 架構。**

每月由 GitHub Actions 雲端自動抓取內政部警政署刑事案件開放資料集（代號 9603），經嚴謹的數據清洗、校對加總與治安指標計算後，直接寫入雲端分散式 SQLite（Turso）。前端 Next.js 透過 Edge API 高速查詢，提供民眾直觀理解全國各縣市犯罪趨勢、案件分布與 YoY 增減變化。

🔗 [**Live Demo 儀表板線上預覽**](https://public-safety-integrity-analytics.vercel.app/)

---

## 🎯 專案核心特色

1. **官方統計資料作為權威基礎**：
   本平台使用內政部統計月報中的刑事案件開放資料集。相較於非結構化新聞或網路聲量，官方受（處）理刑事統計具有長期一致性與可回溯性，更適合作為趨勢比較與治安研判的基礎。
2. **內建數據完整性校對機制（Audit & Checksums）**：
   政府開放資料在實務上偶有欄位格式變動、月份資料未齊或縣市加總與全國總計不一致等問題。本專案在 ETL 流程中加入自動加總檢查，確保「各縣市加總」等於「全國總計」；一旦出現差額會自動發出警報，防止未經確認的錯誤數據直接渲染至前端。
3. **時間窗口嚴格對齊原則（Period-to-Date Baseline Alignment）**：
   年度累計（Annual PTD）計算與去年同期（YoY）對比時，嚴格對齊相同累積月數（如本期前 6 個月對齊去年前 6 個月），杜絕拿 6 個月累計除以 12 個月全年度（導致負五十幾趴）或除以單月（導致暴漲四百多趴）的時間錯置錯誤。
4. **Turso 雲端分散式 SQLite（0 JSON 垃圾檔案、0 維護負擔）**：
   捨棄易因閒置被刪除的外部資料庫或龐雜的本機靜態 JSON 檔案，全面採用 **Turso（基於 LibSQL 的分散式 SQLite）**。前後端直接透過 SQL 查詢資料，享受原生 SQLite 輕量優勢與 9GB 免費大額度。
5. **GitHub Actions 雲端全自動排程（地端關機無痛運行）**：
   每月 25 日凌晨 03:00 自動在 GitHub 雲端啟動 Ubuntu 虛擬機執行 Python ETL 下載最新月報、更新 Turso 資料庫。**開發者個人電腦 24 小時關機亦能穩定自動更新**。
6. **極速載入與三層快取架構（Zero-Waterfall & Multi-tier Cache）**：
   - **並行發送**：首頁載入時同步平行抓取月份清單與彙整報表，消除請求串聯瀑布流。
   - **前端記憶體快取**：瀏覽過的月份立即存入 Client-Side Map 快取，月/年維度切換達到 0ms 秒開。
   - **Node.js 記憶體快取 + HTTP Cache-Control**：API 端具備伺服器記憶體快取與邊緣快取標頭，重複造訪即刻秒回。
7. **LLM 作為後端語義數據 API（Semantic Data & Intelligence API）**：
   - 本平台將 LLM 定義為「**後端語義數據 API**」而非單純的對話機器人。輸入官方結構化數據，輸出包含風險等級、歸因文本與行動建議的結構化 JSON Payload。
   - **優先層**：Google Gemini Flash API（0.5 秒高速推論）。
   - **備援層**：Ollama 本地離線模型（`llama3.2`, `qwen2.5`, `taiwan-llm`，零 API 費用、數據隱私保障）。
   - **保底層**：內建規則統計引擎（100% 穩定零白屏）。
   - 支援「🔍 警政情報視角」、「🛡️ 民生防範觀點」與「📊 統計歸因分析」三大角色即時運算。

---

## 🏗️ 系統架構與資料流

```mermaid
flowchart TD
    subgraph "數據源 (Data Source)"
        A[內政部統計網\n刑事統計數據集 9603]
    end

    subgraph "雲端自動化流水線 (GitHub Actions Cron 每月25日)"
        B["run_daily_update.py\n(下載、清洗、寫入 DB)"]
        C["sync_summary_reports.py\n(計算指標、趨勢與 YoY 變化)"]
        
        A -->|官方 CSV 數據| B
        B -->|寫入官方原始統計數據| DB[(Turso 雲端 SQLite\n/ 本地 SQLite)]
        DB -->|拉取並彙整計算| C
        C -->|寫入彙整報表與 Payload 快取| DB
    end

    subgraph "前端極速載入架構 (Next.js / Vercel)"
        DB -->|SQL 主鍵高速查詢| V["Next.js API 路由\n(In-Memory Cache & S-MaxAge)"]
        V -->|平行傳輸| UI["React 前端 (Client Cache Map)\n(消除瀑布流 / 0ms 秒切)"]
    end
```

---

## 📂 目錄結構與模組說明

```text
├── .github/
│   └── workflows/
│       └── monthly_update.yml   # [自動化] 每月 25 日 GitHub Actions 自動抓取與編譯排程
├── web/                         # Next.js 數據儀表板 (本專案前端)
│   ├── src/app/                 # App Router (首頁、API 路由、折線與堆疊圖表)
│   ├── src/utils/db.js          # Turso LibSQL 資料庫連線模組
│   └── package.json             # Next.js 專案依賴設定
├── scripts/                     # Python 數據流水線與編譯工具
│   ├── etl/                     # 結構化 ETL 套件 (核心處理邏輯)
│   │   ├── config.py            # 配置常數、犯罪案件對齊、顏色樣式
│   │   ├── db.py                # 跨資料庫連線 (Turso / SQLite / Postgres)
│   │   ├── extract.py           # 抓取並解析 MOI 刑事 CSV 檔
│   │   ├── transform.py         # 聚合月/年指標、YoY 計算、AI 趨勢研判
│   │   └── load.py              # 將彙整結果同步寫入 DB (crime_summary_reports)
│   ├── run_daily_update.py      # [主更新] 下載官方 CSV，對齊並寫入官方原始數據
│   ├── sync_summary_reports.py  # [主編譯] 計算統計指標、YoY 與主題分類
│   └── requirements.txt         # Python 依賴清單
├── data/
│   └── local/                   # 本地開發 SQLite 資料庫 (public_safety.sqlite)
├── sql/                         # 資料庫結構描述檔 (schema_sqlite.sql / schema_postgres.sql)
└── README.md                    # 本專案說明文件
```

---

## 🔐 環境變數分類原則與整合架構 (Environment Configuration)

為了確保全端專案（Python ETL 數據流水線 ＋ Next.js 前端 API）的一致性與可維護性，本專案採用**「四象限職責分離規範」**。

### 📁 目錄位置與生效原則
- **根目錄 `.env`（全局主檔）**：供 Python 資料管線、資料庫排程與 GitHub Actions 讀取。
- **`web/.env`（前端設定）**：供 Next.js API Routes、Edge Runtime 與 SSR 前端讀取。
- 專案已同步提供範本檔 [`.env.example`](file:///c:/Users/zifue/Documents/AgenticAI/Public-Safety-Integrity-Analytics/.env.example) 與 [`web/.env.example`](file:///c:/Users/zifue/Documents/AgenticAI/Public-Safety-Integrity-Analytics/web/.env.example)。

### 🧩 四象限變數分類清單

| 分類象限 | 變數名稱 | 預設值 / 格式 | 說明與作用 |
| :--- | :--- | :--- | :--- |
| **🗄️ 1. 資料庫與儲存** | `TURSO_DATABASE_URL` | `libsql://[db].turso.io` | **必填**。Turso 雲端分散式 SQLite 端點。 |
| | `TURSO_AUTH_TOKEN` | `eyJhbGci...` | **必填**。Turso JWT 存取金鑰。 |
| | `PUBLIC_SAFETY_DATABASE_URL` | `postgresql://...` | （選用）若擴充至 PostgreSQL / Supabase 時填寫。 |
| **🧠 2. AI 智慧情報引擎** | `GEMINI_API_KEY` | `AIzaSy...` | **優先**。Google Gemini Flash API Key，0.5秒極速情報推論。 |
| | `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini Flash 模型版本。 |
| | `OLLAMA_BASE_URL` | `http://localhost:11434` | **備援**。本地 Ollama 離線模型服務端點。 |
| | `OLLAMA_MODEL` | `llama3.2` | 本地運行之 LLM 模型名稱（如 `qwen2.5`, `taiwan-llm`）。 |
| **🌐 3. 前端與快取** | `NEXT_PUBLIC_APP_TITLE` | `台灣地方治安統計...` | 網頁主標題。 |
| | `CACHE_MAX_AGE` | `300` | HTTP API 伺服器快取秒數（5分鐘）。 |
| | `CACHE_STALE_WHILE_REVALIDATE`| `86400` | S-MaxAge 後台重驗證秒數（24小時）。 |
| **⚙️ 4. 數據流水線** | `MOI_DATASET_ID` | `9603` | 內政部警政署刑事月報資料集編號。 |

---

## 🚀 部署與本地開發

### 1. 建立免費 Turso 資料庫（1 分鐘快速完成）
1. 至 [Turso 官網 (turso.tech)](https://turso.tech/) 註冊並建立一個免費資料庫（例如名為 `public-safety`）。
2. 在 Turso Dashboard 取得資料庫網址（URL）與 Token：
   ```env
   TURSO_DATABASE_URL="libsql://public-safety-[org].turso.io"
   TURSO_AUTH_TOKEN="your_turso_auth_token"
   ```
3. 在 SQL Editor 執行 `sql/schema_sqlite.sql` 建立資料表結構。

### 2. 本地執行資料庫更新與編譯
```bash
# 1. 下載最新月份官方資料並寫入 Turso
python scripts/run_daily_update.py --skip-existing --min-release-day 8

# 2. 自動計算最新治安指標與年度比較
python scripts/sync_summary_reports.py --latest-only
```

### 3. 本地啟動前端開發服務
```bash
cd web
npm install
npm run dev
```
啟動後訪問 `http://localhost:3000` 即可預覽完整儀表板。
