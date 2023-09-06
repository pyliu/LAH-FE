<template lang="pug">
b-card(:border-variant="borderVariant")
  template(#header)
    .d-flex.w-100.justify-content-between
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="circle" :variant="headerLight")
          | 全國地所跨域AP斷線一覽
      b-button-group
        lah-button(
          to="/inf/xap/connectivity",
          icon="arrow-up-right-from-square",
          no-border,
          title="即時全國地所狀態"
        )
        lah-button(
          icon="sync",
          action="cycle",
          variant="outline-secondary",
          title="重新讀取",
          no-border,
          @click="reload"
        )
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="說明"
        )
    lah-help-modal(ref="help", :modal-title="`各所跨域AP服務狀態監控說明`")
      ul
        li 顯示無法連線的地所(全國)
        li 每5分鐘重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤
  .h-100(v-if="brokenOffices.length > 0")
    lah-site-status-badge(
      v-for="office in brokenOffices",
      :ref="office",
      :key="office"
      :watch-site="office",
      :period="updatePeriod",
      :fill="false",
      :badge="false",
      short,
      @updated="handleUpdated"
    )
  .center.h100(v-else)
    h4: lah-fa-icon(icon="circle-check", variant="success") 目前無斷線地所
</template>

<script>
export default {
  name: 'LahMonitorBoardSiteTw',
  emit: ['light-update'],
  props: {
    updatePeriod: { type: String, default: '300000' } // 5 mins
  },
  data: () => ({
    officesData: [],
    brokenOffices: []
  }),
  fetch () {
    const officeCacheKey = 'office-cached-key'
    // to get all offices data
    this.getCache(officeCacheKey).then((json) => {
      if (json === false) {
        this.$axios.post(this.$consts.API.JSON.SYSTEM, {
          type: 'all_offices'
        }).then(({ data }) => {
          if (Array.isArray(data.raw)) {
            // elimite out of date data
            this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
            // a day ms
            const cacheMs = 24 * 60 * 60 * 1000
            this.setCache(officeCacheKey, data, cacheMs)
          } else {
            this.$utils.error('無法取得各地政事務所資料。', data)
          }
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
        })
      } else if (Array.isArray(json.raw)) {
        // elimite out of date data
        this.officesData = [...json.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
        this.$utils.log('已從快取回復各地政事務所資料。')
      } else {
        this.$utils.error('無法從快取回復各地政事務所資料。')
      }
    })
  },
  computed: {
    headerLight () {
      if (this.brokenOffices.length > 0) {
        return 'danger'
      }
      return 'success'
    },
    borderVariant () {
      if (['danger', 'warning'].includes(this.headerLight)) {
        return this.headerLight
      }
      return 'muted'
    }
  },
  watch: {
    headerLight (nlight, olight) {
      this.$emit('light-update', {
        name: this.componentName,
        new: nlight,
        old: olight
      })
    },
    officesData (val) {
      // ALIAS, ID, NAME
      // console.warn(val)
    }
  },
  created () {},
  mounted () {},
  methods: {
    handleUpdated (data) {
      if (data.status > 0) {
        this.brokenOffices = [...this.brokenOffices.filter(site => site !== data.site)]
      }
    },
    reload () {}
  }
}
</script>

<style lang="scss" scoped>
</style>
