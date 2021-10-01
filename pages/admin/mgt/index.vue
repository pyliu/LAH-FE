<template lang="pug">
  div(v-cloak)
    lah-header
      lah-transition(appear)
        .d-flex.justify-content-between.w-100
          .d-flex
            .my-auto 地政管理看板
            lah-button(
              v-b-modal.help-modal
              icon="info"
              variant="outline-success"
              no-border
              no-icon-gutter
              title="說明"
            )
      lah-help-modal(:modal-id="'help-modal'" size="md")
        h6 提供地政系統相關案件查詢及快速修正之功能
    b-card
      h6 TO BE MIGRATED FROM #[a(href="/legacy/dashboard.html" target="_blank" rel="noreferrer noopener") 管理面板]
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '地政管理看板-桃園市地政局'
  },
  fetchOnServer: true,
  methods: { }
}
</script>

<style lang="scss" scoped>
</style>
