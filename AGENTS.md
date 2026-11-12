# LAH-FE — Nuxt 2 + BootstrapVue v2 前端規範

## 1. 技術棧與框架邊界

- **核心框架**：**Nuxt.js 2.15.8** + **Vue 2（預設採 Options API）** + **BootstrapVue 2.23.0**（Bootstrap 4.5）。
- **嚴禁跨代混用**：禁止將元件改寫為 Vue 3、Nuxt 3、Composition API，或自行引入 TypeScript、Pinia、Vite、Tailwind 等未安裝依賴。
- **最小變動與向下相容**：優先局部修補既有頁面、元件、`computed`、`methods`、Vuex `store` 或 `mixins`；不擅自變更路由路徑、Query 參數、Props/Events 契約或 API Schema。
- **無障礙與介面品質（UI/UX Pro Max 原則）**：確保色彩對比、ARIA 屬性、鍵盤導覽與 Loading / Empty / Error 狀態回饋符合企業級標準（僅在設計全新頁面或大型視覺重構時才需載入 `ui-ux-pro-max` 技能）。

---

## 2. 專案專屬 UI 與互動鐵律

1. **`lah-header` 標題層級規範**：
   - 頁面主標題文字大小必須為 **`h3` 級別**（使用 `h3` 標籤或 `.my-auto.font-weight-bold.h3.mb-0`），維持全系統視覺一致。
2. **`lah-header` 頂層操作元件 45px 高度對齊規範**：
   - 直接擺放在 `lah-header` 內的頂層操作項目——包含按鍵（`.btn` / `lah-button`）、按鈕群組（`b-button-group`）、下拉選單（`b-select` / `custom-select`）與輸入控制項（如 `lah-datepicker` 的輸入框與按鈕）——高度**一律與內建「選單」（`.bars-button`）及「首頁」（`.home-button`，`size="lg"`，實測約 `45px`）完全對齊**（可使用 `height: 45px !important;`，不包含衍生之彈出視窗或下拉選單浮動內容）。
3. **表格（`b-table`）篩選頁碼重設防呆**：
   - 當任何篩選條件（關鍵字搜尋、下拉選單過濾、狀態切換）變更並影響表格顯示資料時，**必須將當前頁碼（`currentPage`）重設為 `1`**，防止總頁數縮減後停留在空白頁。
4. **SSR / CSR 生命週期安全**：
   - 保持 `data / computed / methods / watch / mounted / asyncData / fetch` 既有寫法；避免在 `created` 或模組頂層直接使用 `window` / `document`。
5. **內嵌即時通元件群同步注意**：
   - 修改 `components/lah-messenger-*.vue` 時，須確認與 `lah-messenger-server`（WebSocket :8081 / HTTP 附件 :8082）及桌面端 `lah-messenger` 的協定相容性。

---

## 3. 驗證指令

- **程式碼檢查與修復**：`yarn lint`（或 `npm run lint`）
- **開發／建置檢查**：`yarn dev`、`yarn build`
