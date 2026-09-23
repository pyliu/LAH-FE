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
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 本頁面提供部分系統管理功能以協助管理師快速修正地政系統錯誤資料。
      ul.mb-0
        li 重點區：搜尋登記案件、搜尋規費單據、同步登記案件
        li 使用者與案件查詢：使用者查詢、人民申請案件
        li 規費與資料工具：規費作廢管理、轄區段別查詢
        li 系統工具：簡訊發送、資料匯出、快速檢測修正

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
        lah-fa-icon(icon="users", variant="secondary") 使用者與案件查詢
      //- 使用者查詢組件
      lah-mgmt-board-user-query.my-3
      //- 查詢人民申請案件組件
      lah-mgmt-board-pid-query
    .third-vw.mx-3
      .section-title
        lah-fa-icon(icon="file-invoice-dollar", variant="secondary") 規費與資料工具
      lah-mgmt-board-fee-form-obsolete
      //- 轄區段別資料查詢組件
      lah-mgmt-board-sect-query.mt-3
    .third-vw
      .section-title
        lah-fa-icon(icon="screwdriver-wrench", variant="secondary") 系統工具
      //- 發送簡訊組件
      lah-mgmt-board-sms.compact-board
      lah-mgmt-board-export-data.my-3
      lah-mgmt-board-watchdog.compact-board
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
