<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 全國跨域主機監控
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
        li 提供顯示全國各所跨域主機服務狀態。
        li 每5分鐘重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤
  client-only: lah-b-card-group
    transition-group(name="list", mode="out-in"): component.mr-2.mb-2(
      v-for="(data, idx) in officesData",
      :key="`${data.ID}-${idx}`",
      is="lahSiteStatusBadge",
      :watch-site="data.ID",
      :fill="false",
      pill
    )
    //- lah-site-status-badge(watch-site="BB")
</template>

<script>
export default {
  middleware: ['isInf'],
  data: () => ({
    officesData: []
  }),
  head: {
    title: '全國跨域主機服務監控-桃園市地政局'
  },
  computed: {},
  created () {
    this.prepareOfficesData()
  },
  mounted () {
    window.addEventListener('resize', this.$utils.debounce(() => window.location.reload(), 1000))
    this.refresh()
  },
  methods: {
    prepareOfficesData () {
      this.getCache(this.officeCacheKey).then((json) => {
        if (json === false) {
          this.$axios.post(this.$consts.API.JSON.SYSTEM, {
            type: 'all_offices'
          }).then(({ data }) => {
            if (Array.isArray(data.raw)) {
              this.officesData = [...data.raw]
              // a day ms
              const cacheMs = 24 * 60 * 60 * 1000
              this.setCache(this.useZoneCacheKey, data, cacheMs)
            } else {
              this.$utils.error('無法取得各地政事務所資料。', data)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
          })
        } else if (Array.isArray(json.raw)) {
          this.officesData = [...json.raw]
          this.$utils.log('已從快取回復各地政事務所資料。')
        } else {
          this.$utils.error('無法從快取回復各地政事務所資料。')
        }
      })
    },
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
