<template lang="pug">
b-card(:border-variant="borderVariant")
  template(#header)
    .d-flex.w-100.justify-content-between
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="circle" :variant="headerLight")
          | 全國地所跨域AP狀態
      b-button-group
        lah-button(
          variant="success",
          title="正常數量"
          pill,
          no-icon,
          v-b-tooltip.v-success
        )
          //- span.mr-1 告警
          b-badge(variant="light", pill) {{ upCount }}
        lah-button.mx-1(
          variant="danger",
          title="斷線數量"
          pill,
          no-icon,
          v-b-tooltip.v-danger
        )
          //- span.mr-1 回復
          b-badge(variant="light", pill) {{ downCount }}
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
  .max-height(v-if="downCount > 0")
    lah-site-status-badge.m-1(
      v-for="office in downOffices",
      :ref="office.id",
      :key="office.id"
      :watch-site="office.id",
      :period="updatePeriod",
      :fill="false",
      :badge="false",
      short,
      @updated="handleUpdated"
    )
  .center.max-height(v-else-if="isBusy")
    h4: lah-fa-icon(icon="spinner", variant="dark", action="spin") 讀取中 ...
  .center.max-height(v-else)
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
    officesData: []
  }),
  fetch () {
    this.reload()
  },
  computed: {
    count () {
      return this.officesData.length
    },
    downOffices () {
      return [...this.officesData.filter(siteData => siteData.state === 'DOWN')]
    },
    downCount () {
      return this.downOffices.length
    },
    upOffices () {
      return [...this.officesData.filter(siteData => siteData.state === 'UP')]
    },
    upCount () {
      return this.upOffices.length
    },
    headerLight () {
      if (this.count === 0) {
        return 'warning'
      }
      if (this.downCount > 0) {
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
      // testing
      // val.forEach((element, idx) => {
      //   element.state = this.$utils.rand(5) !== 1 ? 'UP' : 'DOWN'
      // })
    }
  },
  created () {},
  mounted () {},
  methods: {
    reload () {
      this.isBusy = true
      this.officesData = []
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_xap_stats'
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.officesData = [...data.raw]
          }
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.max-height {
  max-height: 300px;
  overflow: auto;
}
</style>
