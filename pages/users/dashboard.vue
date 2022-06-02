<template lang="pug">
div: client-only
  lah-header: .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto {{ myinfo.id }} - {{ myinfo.name }} 的儀表板
      lah-button(
        icon="info",
        action="bounce",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById('help-modal')",
        title="說明"
      )
      lah-help-modal(:modal-id="'help-modal'"): ul
        li TBD...
    .d-flex
  b-card-group(columns)
    b-card(no-body)
      template(#header): .d-flex: .text-nowrap.my-auto 📢 公告
      .m-2: lah-timeline-announcement(load-button, :init-count="3", no-border)

    b-card
      template(#header) 我的案件
      h1 AAA

    b-card
      template(#header): .d-flex: .text-nowrap.my-auto 罕用字測試
      span       

</template>

<script>
export default {
  data: () => ({
  }),
  head: {
    title: '我的儀表板-桃園市地政局'
  },
  computed: { },
  watch: { },
  created () { },
  mounted () { },
  methods: { }
}
</script>

<style scoped lang="scss">
</style>
