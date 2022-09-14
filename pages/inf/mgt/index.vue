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
      ) 舊版
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 本頁面提供部分系統管理功能以協助管理師快速修正地政系統錯誤資料。
      ol
        li 登記案件資料修正
        li 同步異動資料庫與所端同步功能
        li 跨所註記檢測
        li 規費資料修正

  b-card-group(columns)
    lah-mgmt-board-search-reg-case
    lah-mgmt-board-reg-case-state
    lah-mgmt-board-reg-case-tmp
  hr
  b-card-group(columns)
    lah-mgmt-board-sync-reg-case
    lah-mgmt-board-watchdog
    b-card 預定製作規費查詢看板
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '地政系統管理面板-桃園市地政局'
  },
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
</style>
