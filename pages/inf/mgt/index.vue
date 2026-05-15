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
      ol
        li 登記案件相關 (左邊欄)
        li 規費資料相關 (中間欄)
        li 其他檢測與工具 (右邊欄) // 更新說明文字

  .d-flex
    .third-vw
      lah-mgmt-board-search-reg-case
      lah-mgmt-board-sync-reg-case.my-3
    .third-vw.mx-3
      lah-mgmt-board-search-fee-form
      lah-mgmt-board-fee-form-obsolete.my-3
    .third-vw
      lah-mgmt-board-watchdog
      //- 加入新實作的發送簡訊組件
      lah-mgmt-board-sms.my-3
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
.third-vw {
  width: calc(100vw / 3.1);
}
</style>
