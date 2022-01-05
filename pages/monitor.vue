<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto {{ site }} 跨域主機監控
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
        li 提供顯示跨域伺服器狀態
  client-only
    b-card-group.mb-2(deck)
      lah-monitor-board-xap.card-body-fixed-height
      lah-monitor-board-connectivity.card-body-fixed-height
    b-card-group.mb-2(deck)
      lah-monitor-board-xap-trend.card-body-fixed-height(office="桃園所" watch-top-xap)
      lah-monitor-board-apconn.card-body-fixed-height
      //- lah-monitor-board-apconn(line, all)
</template>

<script>
export default {
  head: {
    title: '跨域伺服器監控-桃園市地政局'
  },
  methods: {}
}
</script>

<style lang="scss">
.card-body-fixed-height {
  .card-body {
    // height: calc((100vh - 600px) / 2);
    // overflow: auto;
  }
}
</style>
