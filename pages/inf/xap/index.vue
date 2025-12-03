<template lang="pug">
div.monitor-dashboard(v-cloak)
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
        li 提供顯示跨域伺服器狀態。
        li 跨域伺服器#[b.text-danger 需安裝 #[a(href="/send_netstats.sh") send_netstats.sh]] 腳本定期回報該主機之連線數回後端紀錄才能正常顯示。

  lah-flex-item-group
    .col-md-6(key="1"): lah-monitor-board-xap.fixed-height
    .col-md-6(key="2"): lah-monitor-board-connectivity.fixed-height
    .col-md-6(key="3"): lah-monitor-board-xap-trend.fixed-height(
      office="桃園所",
      watch-top-xap,
      :reload-time="15"
    )
    .col-md-6(key="4"): lah-monitor-board-apconn.fixed-height
</template>

<script>
export default {
  middleware: ['isInf'],
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
.monitor-dashboard {
  /* Ignored desktop font size settings */
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
  /* Force a base font size to avoid system scaling issues that break fixed-height layouts */
  font-size: 16px;
}
.col-md-6 {
  > .card {
    overflow: hidden;
  }
  margin-bottom: 1.25rem;
}
.fixed-height {
  canvas {
    height: calc((100vh - 350px) / 2);
  }
}
</style>
