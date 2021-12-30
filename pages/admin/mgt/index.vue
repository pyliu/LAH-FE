<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
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
    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示各監控標的狀態之功能
        li 預設監控顯示一天內資料
  b-card-group(columns)
    lah-monitor-board-dataguard
    lah-monitor-board-testdb
    lah-monitor-board-vmclone
    lah-monitor-board-hacmp
    lah-monitor-board-dbbackup
    lah-monitor-board-tape
    lah-monitor-board-apserver.card-body
    lah-monitor-board-ups
    lah-monitor-board-adsync
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '智慧監控儀錶板-桃園市地政局'
  },
  fetchOnServer: true,
  methods: {}
}
</script>

<style lang="scss" scoped>
.card-body {
  padding: 0;
  height: 250px !important;
  overflow: auto !important;
}
</style>
