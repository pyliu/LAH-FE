<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div 地政系統管理儀表板
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div: a(
          :href="`${this.legacyUrl}/dashboard.html`",
          target="_blank",
          rel="noreferrer noopener"
        )
          lah-fa-icon(icon="clock-rotate-left") 舊版
    lah-help-modal(:modal-id="'help-modal'" size="lg")
      .font-weight-bold.text-primary.h5.mb-2
        lah-fa-icon(icon="circle-info", size="lg") 地政系統管理儀表板功能導覽
      p.text-muted 本管理儀表板彙編資訊管理師常用之地政核心維護工具，涵蓋登記案件追蹤、規費調整作廢、人員資料檢索、簡訊通知及資料庫匯出檢測等功能，協助快速排查與修正系統異常資料。
      hr.my-2

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="star", variant="warning") 重點核心區 (最常用功能)
      ul.mb-2
        li
          strong 搜尋登記案件：
          | 依收件字號快速查詢案件之辦理情形、結案狀態與手機號碼，並可直接開啟案件狀態管理、修正暫存檔或檢視詳情。
        li
          strong 搜尋規費單據：
          | 依「電腦給號」或「憑證序號」檢索單據，支援單據狀態修正（已印/未印、作廢）、付款方式更換及收費項目調整。
        li
          strong 同步登記案件：
          | 針對跨所收辦或資料不一致之登記案件，執行資料庫雙向即時比對、檢測與資料同步。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="users", variant="secondary") 使用者與案件查詢
      ul.mb-2
        li
          strong 使用者查詢：
          | 以使用者代碼、姓名或關鍵字快速檢索同仁帳號、姓名、課室職稱、分機與個人卡片照片。
        li
          strong 查詢人民申請案件：
          | 依統一編號進行地籍總歸戶查詢，檢索申請人於轄區所有登記及測量案件之辦理歷程。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="file-invoice-dollar", variant="secondary") 規費作廢與簡訊
      ul.mb-2
        li
          strong 發送簡訊：
          | 支援案件手機號碼之簡訊即時發送、重發作業與傳送歷程檢索，維護為民服務通知暢通。
        li
          strong 無電腦給號規費收據作廢：
          | 針對卡紙或跳號等異常單據，依自動編號規則（#[b.text-danger 9] + #[b.text-primary 年度] + #[b.text-success 流水號]）快速新增假資料以利執行系統作廢。

      .font-weight-bold.text-dark.mb-1
        lah-fa-icon(icon="screwdriver-wrench", variant="secondary") 系統工具
      ul.mb-2
        li
          strong 看門狗監控與修正：
          | 即時監控地政系統運行健康狀態，提供 CMC01 證號異常、排程作業及逾期未結等常見錯誤之一鍵快速檢測與修復。
        li
          strong 轄區段別資料查詢：
          | 即時統計土地標示部（RALID）各段小段之土地筆數、總面積與所屬行政區，並提供收費標準及申請書表下載。
        li
          strong 資料匯出：
          | 支援自訂轄區段代碼（具轄區代碼防呆保護），批次產製土地標示部、所有權部等標準純文字匯出檔案。

      hr.my-2
      .d-flex.align-items-center.text-muted.small
        lah-fa-icon.mr-1(icon="lightbulb", variant="warning")
        span 如需使用舊版功能或歷史工具，可點擊右上角「舊版」連結開啟舊版儀表板。

  //- 重點區：最常用的兩個搜尋入口
  .dashboard-primary.mb-3
    .primary-card
      lah-mgmt-board-search-reg-case
    .primary-card
      lah-mgmt-board-search-fee-form
    .primary-card
      lah-mgmt-board-sync-reg-case

  //- 工具區：依功能分三欄
  .d-flex
    .third-vw
      .section-title
        lah-fa-icon(icon="users", variant="secondary") 使用者相關查詢
      //- 發送簡訊組件
      lah-mgmt-board-sms.compact-board
      //- 使用者查詢組件
      lah-mgmt-board-user-query.my-3
      //- 查詢人民申請案件組件
      lah-mgmt-board-pid-query
    .third-vw.mx-3
      .section-title
        lah-fa-icon(icon="file-invoice-dollar", variant="secondary") 進階規費作業
      lah-mgmt-board-search-fee-date
      lah-mgmt-board-fee-form-obsolete.mt-3
    .third-vw
      .section-title
        lah-fa-icon(icon="screwdriver-wrench", variant="secondary") 系統工具
      lah-mgmt-board-watchdog.compact-board
      //- 轄區段別資料查詢組件
      lah-mgmt-board-sect-query.my-3
      lah-mgmt-board-export-data
</template>

<script>
export default {
  middleware: ['isInf'],
  head: {
    title: '地政系統管理面板-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    crsmsData () { return this.$store.getters['inf/crsmsData'] },
    expaaData () { return this.$store.getters['inf/expaaData'] },
    crsmsDataReady () {
      return Boolean(this.crsmsData?.ID)
    },
    paymentDataReady () {
      return Boolean(this.expaaData?.AA05)
    }
  }
}
</script>

<style lang="scss" scoped>
// 重點區：兩張主要搜尋卡片並排
.dashboard-primary {
  display: flex;
  gap: 1rem;

  .primary-card {
    flex: 1;
    min-width: 0; // 防止 flex 子項溢出
  }
}

// 分區小標題
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  padding-bottom: 0.4rem;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #dee2e6;
  letter-spacing: 0.5px;
}

.third-vw {
  width: calc(100vw / 3.1);
}

.compact-board,
.compact-card {
  position: relative;
  min-height: 180px;
  max-height: 180px;
  overflow: hidden;
  cursor: pointer;
  // 移出收合時延遲 0.5s 觸發
  transition: max-height 0.4s ease-in-out 0.5s, box-shadow 0.3s ease 0.5s;

  // 向下展開提示列
  &::after {
    content: '▾ 向下展開';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 1px;
    color: #6c757d;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(245, 247, 250, 0.85) 35%, rgba(233, 236, 239, 0.98) 100%);
    border-top: 1px dashed rgba(108, 117, 125, 0.25);
    pointer-events: none;
    transition: opacity 0.25s ease 0.5s, transform 0.25s ease 0.5s;
    z-index: 2;
  }

  &:hover,
  &:focus-within,
  &.board-expanded {
    max-height: 800px;
    overflow-y: auto;
    cursor: default;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    // 移入展開時立即響應無延遲
    transition: max-height 0.4s ease-in-out 0s, box-shadow 0.3s ease 0s;

    &::after {
      opacity: 0;
      transform: translateY(100%);
      pointer-events: none;
      transition: opacity 0.25s ease 0s, transform 0.25s ease 0s;
    }
  }
}
</style>
