# WHONEXT 2026 — 產品需求文件 (PRD)

> 狀態：草稿彙整中，尚有待確認項目（見文末「待確認事項」）

## 1. 核心產品定位與設計哲學 (Product Vision)

**定位**：個人極簡子彈筆記（BuJo）與團隊卡片式專案管理的混合型 Web App（PWA）。

**設計原則**：

- **個人優先（Solo-First）**：單人使用時保有極簡、低阻力、Rapid Logging（快速紀錄）體驗。
- **無縫擴充（Scale-on-Demand）**：當需要協作時，可直接把「個人卡片」或「日誌/週誌」轉為「團隊看板/專案」，無縫邀請 5-10 人加入。
- **數據與結構化（Data-Driven）**：保留自動化進度條（%）與多維度（週/月）時間切換。

## 2. 系統權限與角色架構 (RBAC for 5-10 Person Teams)

為了在 5-10 人規模下保持扁平與靈活，不設計複雜的權限樹，僅保留三種角色：

| 角色 | 權限範圍 | 適用情境 |
|---|---|---|
| **Owner**（建立者/個人） | 擁有全站/全看板完整控制權、成員邀請、改寫架構 | 個人自我管理、專案發起人 |
| **Member**（團隊成員） | 可新增/編輯卡片、分配子任務、切換狀態、留言互動 | 5-10 人日常協作與進度回報 |
| **Viewer**（觀察者/外部夥伴） | 僅能檢視專案進度條與卡片狀態，無法修改 | 外包夥伴、客戶或主管監督 |

## 3. 資料模型 / 卡片結構設計 (Data Model)

以 `workspace` 為最上層容器，向下包含 `projects` 與 `cards`，結構如下：

```jsonc
{
  "workspace_id": "ws_01",
  "workspace_name": "Personal & Team Hub",
  "type": "team", // "personal" | "team"
  "members": [
    { "user_id": "u_01", "role": "owner", "name": "You" },
    { "user_id": "u_02", "role": "member", "name": "Alex" }
  ],
  "projects": [
    {
      "project_id": "proj_101",
      "title": "系統化模組架構重構",
      "time_frame": {
        "cycle": "weekly", // "daily" | "weekly" | "monthly"
        "target_date": "2026-W34"
      },
      "cards": [
        {
          "card_id": "c_501",
          "bujo_symbol": "task", // "task" (•) | "completed" (✕) | "migrated" (>) | "priority" (*)
          "title": "API 接口重構與驗證",
          "assignees": ["u_01", "u_02"],
          "progress": 75,
          "checklist": [
            { "id": "chk_1", "text": "定義 JSON Schema", "done": true },
            { "id": "chk_2", "text": "測試端點連線", "done": false }
          ],
          "visibility": "shared" // "private" (僅自己看得到) | "shared" (團隊可見)
        }
      ]
    }
  ]
}
```

**結構重點**：

- `workspace` 的 `type` 區分個人 / 團隊，對應第 1 節「Scale-on-Demand」設計 — 個人 workspace 升級為 team 時沿用同一份資料結構，僅新增 `members` 與切換 `type`。
- `members[].role` 對應第 2 節 RBAC 的三種角色（owner / member / viewer）。
- `project.time_frame.cycle` 對應第 4 節「週/月視圖切換」，決定卡片在哪個時間維度聚合顯示。
- `card.bujo_symbol` 對應第 4 節 Rapid Logging 的四種符號（•　✕　>　*）。
- `card.progress` 為單卡完成率，多張 shared 卡片的 `progress` 加總平均即為第 4 節「團隊週/月總進度儀表板」的數據來源。
- `card.visibility` 對應第 4 節「卡片隱私切換（Private/Shared Toggle）」。
- `card.assignees` 對應第 4 節「微型指派與頭像（最多 3 位執行者顯示）」。

## 4. 漸進式擴充功能模組 (Feature Roadmap)

### 第一階段：Solo Base（個人極簡 BuJo 模式）

- **Rapid Logging**：支援 `•`（Task）、`✕`（Done）、`>`（Migrate）、`*`（Priority）快捷符號轉換。
- **週/月視圖切換**：手機端直式單欄卡片，支援長按與 Drag & Drop 移動時間區段。
- **PWA 本地優先**：支援離線快取（IndexedDB）與桌面/手機 Add to Home Screen。

### 第二階段：Team Expansion（5-10 人協作擴充）

- **卡片隱私切換（Private / Shared Toggle）**
  - 每張卡片預設為 Private（僅自己看到）。
  - 點擊「分享至專案」切換為 Shared，該卡片即出現在團隊週誌/月誌中。
- **微型指派與頭像（Micro-Assignee）**
  - 在卡片右下角顯示小頭像（最多 3 位執行者）。
- **實時活動紀錄與留言（Activity Stream & Comments）**
  - 點開卡片可進行討論與 @提及成員，紀錄狀態變更歷程。
- **團隊週/月總進度儀表板（Aggregate Progress Dashboard）**
  - 自動加總團隊所有 Shared 卡片的完成率（%），形成團隊本週/本月整體達成率。

## 5. 技術選型與開發里程碑 (Tech Stack & Execution Plan)

### 技術選型建議

| 項目 | 選型 |
|---|---|
| 前端 (Frontend) | React / Next.js（或 Vue 3）+ Tailwind CSS + Lucide Icons（BuJo 符號圖示） |
| 拖曳與手勢 (Interaction) | `@dnd-kit` 或 Pointer Events 原生封裝（確保 iOS/Android PWA 觸控滑順度） |
| 後端與實時同步 (Backend & Real-time) | **Supabase**（Postgres + Auth + Realtime + Row Level Security） |
| PWA 支援 | `next-pwa` 或 Workbox（處理 Service Worker 與離線暫存） |

> **後端選型說明**：小專案 + 5-10 人規模完全落在 Supabase 免費方案額度內（500MB 資料庫、50,000 MAU、2GB 頻寬），零成本。且 Auth／Realtime／RLS 三項內建能力，剛好直接對應「多帳號驗證」「實時留言與進度儀表板」「第 2 節 RBAC 角色權限＋第 3 節 Private/Shared 卡片可見性」，比另外用 Google Sheet + Apps Script 拼湊、之後再遷移一次要少走一輪工。因此 Sprint 1 即直接採用 Supabase，不經過 Sheet 過渡階段。

### 開發階段規劃 (Milestones)

| Sprint | 週期 | 內容 |
|---|---|---|
| Sprint 1 | Week 1-2 | 個人端 UI/UX 原型、BuJo 符號卡片與 Pointer Events 手機拖拽功能開發、Supabase 專案初始化（資料表結構、Auth 設定） |
| Sprint 2 | Week 3-4 | PWA 離線儲存、週/月視圖與自動進度計算（%）整合 |
| Sprint 3 | Week 5-6 | Supabase 後端串接、多帳號驗證與卡片 Private/Shared 權限切換機制（RLS 規則） |
| Sprint 4 | Week 7-8 | 5-10 人團隊邀請、頭像指派、Supabase Realtime 同步與整體進度儀表板上線 |
