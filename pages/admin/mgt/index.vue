<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex
          .my-auto {{ site }} 智慧監控儀錶板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
        .d-flex
          b-checkbox.my-auto.small.mr-1(v-model="displayXAP", switch) 顯示跨所AP狀態
          .mr-1 🔴 {{ dangerMessages.length }}
          .mr-1 🟡 {{ warningMessages.length }}
          .mr-1 🟢 0
    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示各監控標的狀態之功能
        li 預設監控顯示一天內資料
  b-collapse(v-model="displayXAP")
    b-card-group.mb-2(deck)
      lah-monitor-board-xap
      lah-monitor-board-apconn
      lah-monitor-board-connectivity
      //- lah-monitor-board-xap-trend(office="桃園所" watch-top-xap)
      //- lah-monitor-board-apconn(line, all)
  b-card-group.mb-2(deck)
    lah-monitor-board-dataguard.card-body-fixed-height
    lah-monitor-board-hacmp.card-body-fixed-height
    lah-monitor-board-apbackup.card-body-fixed-height
  b-card-group.mb-2(deck)
    lah-monitor-board-vmclone.card-body-fixed-height
    lah-monitor-board-dbbackup.card-body-fixed-height
    lah-monitor-board-tape.card-body-fixed-height
  b-card-group.mb-2(deck)
    lah-monitor-board-testdb.card-body-fixed-height(@warning="handleWarning", @danger="handleDanger")
    lah-monitor-board-adsync.card-body-fixed-height
    lah-monitor-board-ups.card-body-fixed-height
</template>

<script>
export default {
  middleware: ['isAdmin'],
  data: () => ({
    displayXAP: false,
    warningMessages: [],
    dangerMessages: []
  }),
  head: {
    title: '智慧監控儀錶板-桃園市地政局'
  },
  fetchOnServer: true,
  methods: {
    handleWarning (message) {
      this.warningMessages.push(message)
    },
    handleDanger (message) {
      this.dangerMessages.push(message)
    }
  }
}
</script>

<style lang="scss">
.card-body-fixed-height {
  .card-body {
    height: 200px;
    overflow: auto;
  }
}
</style>
