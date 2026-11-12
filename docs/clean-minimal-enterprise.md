# Clean Minimal Enterprise 淺色主題

主題在 `nuxt.config.js` 的 html class `lah-theme-clean` 啟用。標記放在 html，避免 Nuxt 的屬性管理覆蓋既有頁面自行維護的 `body.theme-dark`。Bootstrap 與 BootstrapVue 僅由 `assets/scss/main.scss` 編譯，不重複載入套件預編譯 CSS。

靜態產出的 `static.cacheDir` 設為 `.nuxt`，讓各 worktree 的產出快取留在自己的目錄，避免 Nuxt 2 預設寫入共用 `node_modules/.cache/nuxt` 後因 Junction 解析出錯。此目錄沿用既有 Git 忽略設定。

## 視覺規格

| 項目 | 規格 |
|---|---|
| Primary | `#1D4ED8`，白字對比 6.70:1 |
| Secondary | `#475569`，白字對比 7.58:1 |
| Success | `#15803D`，白字對比 5.02:1 |
| Danger | `#B91C1C`，白字對比 6.47:1 |
| 頁面／卡片 | `#F8FAFC`／`#FFFFFF` |
| 正文／次要文字 | `#1E293B`／`#475569` |
| 正文／標題行高 | 無單位 `1.5`／`1.3` |
| 字型 | 微軟正黑體、EUDC、Segoe UI 與本機備援字型 |
| 按鈕／輸入框圓角 | `.375rem`，預設 6px |
| 卡片／浮層圓角 | `.5rem`，預設 8px |
| 陰影 | 三級柔和 box-shadow，保留 `.lah-shadow-sm`／`.lah-shadow`／`.lah-shadow-xl` 名稱 |

對比依一般文字與實際背景配對計算；表列數值以白底為基準，四組色字在頁面淺灰背景也超過 4.5:1。自訂彩色背景、圖表及 Info／Warning／Light／Dark 不在此聲明範圍。成功、錯誤與警示仍須搭配文字或圖示。

## 維護與驗證

- 在 `assets/scss/clean-minimal-enterprise/_tokens.scss` 修改設計變數。`_variables.scss` 將純變數提供給全站 SCSS；不要在注入檔中加入 `:root` 或其他會輸出 CSS 的規則。
- 在 `_components.scss` 維護陰影與焦點補充樣式。一般連結透過低優先權 `a` 規則套色，保留選取導覽、按鈕及局部深色主題的配色優先權。
- 執行 `node scripts/verify-clean-theme.cjs`，直接編譯實際 `main.scss`，檢查 62 組對比、行高、圓角、CSS 主色變數與陰影。使用既有套件，不需安裝依賴。
- 執行 `node node_modules/eslint/bin/eslint.js nuxt.config.js` 檢查設定檔。依既有執行環境執行 `npm run build`；現代 Node.js 搭配 Webpack 4 時需既有的 `--openssl-legacy-provider` 旗標。

## 相容範圍

保留 Nuxt 2／Vue 2／BootstrapVue 2；不修改 HTTP API、WebSocket、附件或 SQLite 契約。保留表格密度、根字級縮放與 1012px 最小寬；標題列控制項對齊 45px，排除下拉浮層、彈窗及日期選擇器內部。標題列既有 10px 圓角、pill、圓形頭像及頁面固定樣式仍可能優先於主題變數。

深色頁面沿用既有實作：即時通 `body.theme-dark` 不套用淺色補充樣式；儀表板 `.dark-container.dark-mode` 保留自身的背景與局部覆寫。在這兩個邊界提供較亮的語意文字與焦點色，避免新的深色色票使深色頁面上的文字更難閱讀。五組語意文字已分別針對 `#121212`、`#212529` 檢查 4.5:1；其他背景仍須依實際配對確認。Sass 產生的 Bootstrap 色票仍是全域的，不能用移除 html class 的方式回復舊色票。

`layouts/default.vue` 的軌道徽章，以及 bookmark／admin 等頁面的固定色碼、圓角與 `!important` 未逐頁重設。行動版、列印及全站完整可及性不因本次基礎主題套用而自動符合規範。

完整回復時，還原 `_variables.scss`、`main.scss` 與 `nuxt.config.js`，移除本次新增主題檔，然後重新建置。

## 本次驗證紀錄（2026-11-12）

- 通過 Nuxt 建置、靜態產出、設定檔及驗證腳本 ESLint、Git diff 空白檢查與 62 組對比檢查。
- 以隔離 Chrome 在 1440×1000 操作首頁、外國人地權案件空資料表格、鍵盤焦點、說明彈窗及日期選擇器，確認 8px 彈窗圓角、45px 標題列控制項，以及日期選擇器內部按鈕仍為原尺寸。
- 操作 AI 助理明暗切換並重新載入，確認 `body.theme-dark` 保留；操作儀表板淺色／深色切換，確認背景、標題列尺寸與焦點色。過程未出現 JavaScript 例外。
- 驗證前確認本機 API 的 `configs.mock === true`；瀏覽器驗證阻擋非本機連線，未測試外部服務與即時訊息傳送。
- 375×812 視窗檢查仍有既有最小寬造成的水平溢位；未宣稱完成行動版改造。未全面驗證所有頁面、列印及高對比模式。
- 畫面、可及性樹與 computed style 證據存於工作區 `.scratch/clean-theme/`，未加入版控。
