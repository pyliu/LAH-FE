# 智慧控管系統前端 (LAH-FE) 版本修改歷程

本文件記錄 LAH-FE 智慧控管系統前端專案（含即時通訊移植模組）之重大功能更新、架構調整與問題修復歷程。

---

## [2026-10-25]

### 🐛 即時通文字高亮管線 HTML 破版修正
- **問題根因修復**：修復伺服端將 Markdown 標題（如 `### 【工作回報】業務處理進度`）轉譯為 `<h3 id="【工作回報】...">` 後，前端 `plugins/global-init.js` 的 `highlightPipeline` 未保護既有 HTML 標籤（`<[^>]+>`），導致 `highlightTitle` 正規表達式匹配並拆碎 `id="..."` 屬性值、注入 `<span class="font-weight-bold" ...>`，使得屬性引號提前閉合、在聊天室泡泡中異常洩漏 `">` 與重複文字標題的重大破版問題。
- **超強遮罩防護管線 (Super Masking Pipeline)**：
  - 對齊即時通桌面端之完整遮罩架構，依序設置 Base64 Data URI、已解析之 HTML 標籤（`<[^>]+>`）、行內程式碼（`` `...` ``）、Markdown 連結/圖片、純文字 URL、UNC 本機與網路共享路徑、IPv4 位址之專屬佔位保護層。
  - 於各式文字醒目與高亮規則轉換完畢後依序反向還原，並使用函式取代語法 `() => val` 杜絕 JavaScript `String.prototype.replace` 誤判文字中 `$` 符號之邊界缺陷。

### 📎 即時通附件上傳格式防呆驗證與詳細錯誤回報機制移植
- **移植背景與目的**：
  - 解決使用者選取不合規副檔名（例如 `.gitignore`、`.gitconfig`、無副檔名檔案）或超過單檔 10 MB 限制時，介面無提示且未上傳之無聲失敗問題。
  - 解決編輯訊息或編輯公告對話框在非同步上傳期間提前關閉，導致上傳錯誤未及時反饋給使用者的體驗問題。
- **核心 Mixin 增強 (`mixins/lah-messenger-base.js`)**：
  - 新增 `ALLOWED_ATTACHMENT_EXTENSIONS` 定義完整公務附件格式白名單（文書公文：PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ODF, TXT, CSV, DI；圖資掃描：DWG, DXF, TIF/TIFF, 影像圖檔；壓縮與郵件：ZIP, 7Z, RAR, GZ, TAR, EML, MSG）與 `MAX_ATTACHMENT_SIZE`（10 MB）。
  - 新增 `attachmentAcceptAttr` 計算屬性供檔案選取框之 `accept` 屬性使用。
  - 新增 `validateAttachmentFile(file)` 進行前置防呆判定，嚴謹排除點號開頭隱藏檔與超限檔案。
  - 新增 `showAttachmentError(filename, reason)` 詳細彈窗與長效 Toast 通知，條列允許格式清單與大小上限指引。
  - 強化 `uploadAttachment()` 錯誤捕捉，新增伺服器連線異常判定、413 Payload Too Large 容量超限專屬提示與非 JSON 格式容錯。
- **編輯組件同步與狀態保護**：
  - `components/lah-messenger-message-input-edit-message.vue`：檔案選取框加入 `:accept="attachmentAcceptAttr"` 與前置驗證；改造 `send()` 為非同步循序等待上傳完成，按鈕顯示 `b-spinner` 載入狀態，上傳失敗時保留視窗與未成功檔案供使用者修正，全部成功才關閉視窗。
  - `components/lah-messenger-message-input-edit-announcement.vue`：檔案選取框加入 `:accept` 與防呆檢驗；編輯模式支援非同步循序等待上傳、失敗保留視窗並展示錯誤、成功發布後始關閉視窗。
- **輸入與各頻道組件全量防呆**：
  - `components/lah-messenger-message-input.vue`、`components/lah-messenger-message-input-modal.vue`：檔案選取框加入 `:accept` 屬性與 `validateAttachmentFile` 前置防呆。
  - `components/lah-messenger-channel-lds.vue`（全所）、`components/lah-messenger-channel-department.vue`（課室）、`components/lah-messenger-channel-personal.vue`（私訊）：檔案輸入框加入 `:accept` 屬性，選取時進行即時格式與大小檢驗。
  - `components/lah-messenger-home.vue`：訊息建立後之非同步附件上傳若遭伺服器拒絕，調用 `showAttachmentError` 呈現詳細失敗原因與格式指引。
