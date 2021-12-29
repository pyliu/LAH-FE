<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 地政監控儀錶板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
    lah-help-modal(:modal-id="'help-modal'", size="md")
      h6 提供顯示個監控標的狀態之功能
  b-card-group(columns)
    lah-monitor-board-dataguard
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '地政監控儀錶板-桃園市地政局'
  },
  fetchOnServer: true,
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
