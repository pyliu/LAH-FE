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
        li 登記案件資料修正 (左邊欄)
        li 規費資料修正 (中間欄)
        li
          span 其他 (右邊欄)
          ol
            li 同步異動資料庫與所端同步功能
            li 無電腦給號規費作廢
            li 其他系統狀態檢測

  //- b-card-group(columns)
  //-   lah-mgmt-board-search-reg-case
  //-   lah-mgmt-board-search-fee-form
  //-   lah-mgmt-board-sync-reg-case
  //- b-card-group(columns)
  //-   lah-mgmt-board-reg-case-state
  //-   lah-mgmt-board-fee-form-state
  //-   lah-mgmt-board-fee-form-obsolete
  //- b-card-group(columns)
  //-   lah-mgmt-board-reg-case-tmp
  //-   lah-mgmt-board-fee-form-payment-items
  //-   lah-mgmt-board-watchdog
  .d-flex
    .third-vw
      lah-mgmt-board-search-reg-case
      lah-transition: lah-mgmt-board-reg-case-state.my-3(v-if="crsmsDataReady")
      lah-transition: lah-mgmt-board-reg-case-tmp(v-if="crsmsDataReady")
    .third-vw.mx-3
      lah-mgmt-board-search-fee-form
      lah-transition: lah-mgmt-board-fee-form-state.my-3(v-if="paymentDataReady")
      lah-transition: lah-mgmt-board-fee-form-payment-items(v-if="paymentDataReady")
    .third-vw
      lah-mgmt-board-sync-reg-case
      lah-mgmt-board-fee-form-obsolete.my-3
      lah-mgmt-board-watchdog
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
