# 專案代理人規範與行為準則 (Project Agent Rules)

## 📌 任務交付前強制驗收規則 (Mandatory Quality Acceptance)

在向使用者交付任何功能、代碼修改或完成特定任務前，**必須嚴格遵循 `quality-acceptance` skill 的標準驗收作業程序**：

1. **實作驗證**：所有變更在交付前必須透過執行建置（如 `npm run build`）或執行測試驗證，嚴禁未經驗收即行交付。
2. **文檔同步**：凡涉及架構調整、流程更動或依賴變更，必須同步更新 [README.md](file:///c:/Users/zifue/Documents/AgenticAI/Public-Safety-Integrity-Analytics/README.md) 及相關文件。
3. **工作區清理**：交付前清點 `git status`，確保無殘留除錯暫存檔或無用舊檔案。
