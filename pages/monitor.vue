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
      lah-monitor-board-xap
      lah-monitor-board-connectivity
    b-card-group.mb-2(deck)
      lah-monitor-board-xap-trend(
        office="桃園所",
        watch-top-xap,
        :reload-time="15"
      )
      lah-monitor-board-apconn
      //- lah-monitor-board-apconn(line, all)
</template>

<script>
export default {
  head: {
    title: '跨域伺服器監控-桃園市地政局'
  },
  mounted () {
    window.addEventListener('resize', this.$utils.debounce(() => window.location.reload(), 1000))
    this.refresh()
  },
  methods: {
    refresh (minSec = '00:00') {
      // refresh the page at tomorrow 08:00
      const now = new Date()
      const today =
        now.getFullYear() +
        '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + now.getDate()).slice(-2)
      const tomorrow8am = new Date(`${today} 08:${minSec}`)
      tomorrow8am.setDate(new Date().getDate() + 1)
      const milliseconds = tomorrow8am - now
      this.timeout(() => window.location.reload(), milliseconds).then((handler) => {
        this.$utils.log(
          `${Number.parseFloat(
            milliseconds / 1000 / 60 / 60
          ).toFixed(2)} hrs 候更新頁面 (${tomorrow8am})`
        )
      })
    }
  }
}
</script>

<style lang="scss">
</style>
