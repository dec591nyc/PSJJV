# 台灣地方治安統計數據分析平台 

(Taiwan Local Public Safety Statistics & Data Integrity Audit Platform)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

💡 **本治安統計分析平台係結合多項新穎技術所開發完成，如 Next.js 數據儀表板、 Python 數據整理及 n8n 自動化數據 ETL 流水線。

並於每月週期性抓取內政部刑事案件開放數據集（代號 9603），經後端資訊校對、數據統計，最後以視覺化的呈現提供民眾一個可直觀理解全國縣市各類犯罪趨勢、分布及 YoY 增減變化的儀表板。**

🔗 [**Live Demo**](https://public-safety-integrity-analytics.vercel.app/)

---

## 🎯 專案核心定位與特色

本專案旨在提供**高可信度的官方刑事案件統計儀表板**。本平台核心特色如下：

1. **使用官方刑事案件統計資料**：
   本平台目前使用內政部統計月報中的刑事案件開放資料集作為主要資料來源。資料內容為警政機關受理並登記的刑事案件發生件數，涵蓋全國、各縣市與不同案件類型。相較於從新聞、社群或非結構化文字中推估治安狀況，本專案選擇以官方統計資料作為分析基礎，讓平台的數據來源更穩定，也更適合作為長期追蹤與趨勢比較的依據。
2. **內建資料完整性校對機制**：
   政府開放資料在實務處理上，常會遇到欄位格式變動、月份資料不齊、縣市加總與全國總計不一致等問題。因此，本專案在 ETL 流程中加入資料完整性檢查。系統會比對官方提供的「全國刑事案件總計」與「各縣市、各案件類型加總後的結果」是否一致。若兩者出現差額，程式會輸出警告，方便開發者及早發現資料異常或轉換邏輯錯誤。這個設計的目的是避免前端直接展示未經確認的統計結果，讓資料在進入儀表板前先經過基本審計。
3. **Supabase PostgreSQL 雲端資料庫**：
   Python ETL 流程會將官方原始統計資料寫入資料庫，接著再產生前端需要的月報、年報、YoY 變化與圖表資料。Next.js API 路由則負責從資料庫查詢資料，提供給 React 前端進行視覺化渲染。這樣的設計讓資料處理與前端展示分離，未來若要增加新的分析指標、案件分類或行政區比較，也能在後端資料層持續擴充。
4. **SQLite 本地開發備援模式**：
   為了讓本地開發與雲端部署都能順利運作，專案支援 SQLite fallback。當系統讀取不到 Supabase PostgreSQL 連線字串時，會自動切換至本地 SQLite 資料庫 data/local/public_safety.sqlite。這讓開發者在沒有雲端資料庫、沒有網路，或只想進行快速測試時，仍然可以執行資料處理與前端開發。這個設計主要用於降低開發門檻，也避免所有測試都必須依賴雲端資料庫。
5. **n8n 自動化排程與 Zero-Persistence Cloud Mode**：
   本專案使用 n8n 作為自動化排程工具，負責定期觸發 Python ETL 指令，讓資料更新流程可以在雲端環境中自動執行。每月排程啟動後，n8n 會執行資料更新腳本，下載最新的官方刑事統計資料，完成資料清洗與校對後，再將結果同步至 Supabase。接著，系統會重新產生前端需要的 summary reports 與 payload cache，讓儀表板能取得最新的統計結果。為了適應 Serverless、Docker、n8n 等雲端執行環境，資料處理流程支援 Zero-Persistence Cloud Mode。在這個模式下，程式不需要在本機或容器中永久保存 JSON 檔案，而是將資料計算結果直接寫入 Supabase。這可以避免容器重啟後檔案消失，也能讓 Git repository 保持乾淨，不需要提交大量中間產物。

---

## 🏗️ 系統架構與資料流 (Architecture & Data Flow)

```mermaid
flowchart TD
    subgraph "數據源 (Data Source)"
        A[內政部統計網\n刑事統計數據集 9603]
    end

    subgraph "自動化管線 (n8n / Python)"
        B["run_daily_update.py\n(下載、清洗、寫入 Supabase)"]
        C["generate_static_json.py\n(臨時 SQLite 鏡像計算 & 編譯)"]
        A -->|CSV 數據| B
        B -->|更新 Postgres 表| D["(Supabase 雲端資料庫)"]
        D -->|拉取計算| C
        C -->|自動上傳 JSONB| D
    end
	
   subgraph "前端儀表板 (Next.js App)"
        F[Next.js API 路由] -->|1. 優先查詢 JSONB| D
        F -->|2. 資料庫不可用時自動降級| G[public/static_api/*.json]
        G --> H[React 前端 / Recharts 渲染]
        D -->|提供最新資料| H
    end

    subgraph "純靜態版 (GitHub Pages SPA)"
        C -->|非雲端模式時複製| I[docs/static_api/*.json]
        J[Vanilla JS app.js] -->|讀取| I
    end
```

---

## 📂 目錄結構與模組說明

```text
├── web/                         # Next.js 數據儀表板 (本專案核心)
│   ├── src/app/                 # App Router (首頁、API 路由、折線與堆疊圖表)
│   ├── src/utils/db.js          # 資料庫連線模組
│   └── package.json             # Next.js 專案依賴設定
├── scripts/                     # Python 數據流水線與編譯工具
│   ├── etl/                     # 結構化 ETL 套件 (核心處理邏輯)
│   │   ├── config.py            # 配置常數、犯罪案件對齊、顏色樣式
│   │   ├── db.py                # 跨資料庫連線 (SQLite & Postgres)
│   │   ├── extract.py           # 抓取並解析 MOI 刑事 CSV 檔
│   │   ├── transform.py         # 聚合月/年指標、YoY 計算、AI 趨勢研判
│   │   └── load.py              # 將彙整結果同步寫入 DB (crime_summary_reports)
│   ├── run_daily_update.py      # [主更新] 下載官方 CSV，對齊並寫入官方原始數據
│   ├── sync_summary_reports.py  # [主編譯] 全記憶體運行，計算指標並同步至 Supabase
│   └── metric_styles.py         # 同步治安指標樣式配置
├── sql/                         # 資料庫結構描述檔 (SQLite / Postgres)
├── ref/                         # 參考文件 (如裁判書開放 API 規格說明)
├── n8n/                         # 自動化排程部署與工作流配置 (Docker / JSON)
└── README.md                    # 本說明文件
```

---

## 🚀 部署與本地開發

### 1. 雲端資料庫模式（Supabase / PostgreSQL）
1. 進入 Supabase 控制台的 **SQL Editor**，執行 `sql/schema_postgres.sql` 的內容以初始化資料表結構。
2. 取得您的 Supabase PostgreSQL 連線 URL，寫入 `.env` 檔案或設為環境變數：
   ```env
   PUBLIC_SAFETY_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```
3. 在部署 Next.js 網頁時，亦請在託管平台（如 Vercel）後台填寫此環境變數。

### 2. 資料庫更新與編譯
```bash
# 安裝 Python 依賴
pip install psycopg2-binary requests

# 1. 抓取最新月份官方資料並寫入資料庫
py scripts/run_daily_update.py --skip-existing --min-release-day 8

# 2. 自動編譯指標並直接上傳至 Supabase
py scripts/sync_summary_reports.py --latest-only
```

### 3. 本地啟動前端開發服務
```bash
cd web
npm install
npm run dev
```
啟動後訪問 `http://localhost:3000` 即可預覽。

### 4. n8n 自動化排程與歷史回填 (n8n Scheduling & Backfill)
本專案提供 `n8n/PSJJV_n8n.json` 作為自動化資料更新的工作流配置：
1. **每月定時更新**：預設在每月 25 號自動抓取最新月份（當月及上月）的警政署資料，並編譯更新 Supabase。
2. **手動歷史回填 (One-time Backfill)**：由於新部署的 Supabase 資料庫是空表，網頁可能無法顯示過去年份的下拉選單與年度比較。您可透過 n8n 執行一次性回填：
   * 在 n8n 中將 `Execute Command` 節點的指令暫時修改為：
     ```bash
     cd /home/node/public-safety-dashboard && python3 scripts/run_daily_update.py --backfill 201801 && python3 scripts/sync_summary_reports.py --full-refresh
     ```
     *(可將 `201801` 替換為您需要的起始年份月份)*
   * 若只是補年度報表或年度比較欄位，不需要重算所有月報，可改用：
     ```bash
     cd /home/node/public-safety-dashboard && python3 scripts/sync_summary_reports.py --annual-only --from-year 2018 --to-year 2026
     ```
     批次重算會自動先將官方統計載入記憶體，減少對 Supabase 的重複查詢；只有診斷或比對舊流程時才需要加上 `--no-preload`。
   * 點擊 **Execute Node** 執行一次，即可完整下載並計算歷史統計數據寫入 Supabase。
   * 執行完畢後，記得將指令**改回預設**（移除 `--backfill` 參數，保留 `--skip-existing --min-release-day 8`），以保持每月的增量輕量更新。

---

## 🧠 開發紀錄與技術收穫

1. **從裁判書資料改為官方統計資料**

   專案初期曾經考慮從司法裁判書中擷取案件資訊，但這類資料涉及非結構化文字解析、個資保護、案件分類標準不一致等問題，作為公開儀表板的主要資料來源並不理想。因此，後續將資料來源改為內政部官方統計月報。這個調整讓平台的資料基礎更穩定，也更適合做跨月份、跨縣市與跨案件類型的長期比較。
   
3. **建立資料校對流程**

   處理政府開放數據（Open Data）時，常會遇到欄位對齊不一、數據缺漏或四捨五入所造成的統計誤差。為了建立民眾能放心信賴的數據，在 ETL 中加入加總校驗機制，檢查全國總計與地方加總是否一致。這讓資料錯誤可以在後端處理階段被發現，而不是等到前端圖表顯示異常後才回頭追查。

4. **讓本地開發與雲端部署使用同一套流程**
 
   本專案同時支援 Supabase PostgreSQL 與本地 SQLite。開發時可以用 SQLite 快速測試，部署時則切換到 Supabase。這讓資料處理流程不需要為本地與正式環境各寫一套邏輯，也讓整體維護成本更低。
   
5. **導入工作排程自動化**

    透過 n8n，資料更新不需要手動執行。只要設定好 workflow 與環境變數，系統就可以定期抓取官方資料、執行 ETL、更新資料庫並刷新前端查詢資料。這讓專案從單純的靜態作品，進一步變成可以長期運作的資料產品。
