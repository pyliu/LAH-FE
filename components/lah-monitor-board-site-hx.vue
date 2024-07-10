<template lang="pug">
b-card(:border-variant="borderVariant", :class="[attentionCss]")
  template(#header)
    .d-flex.w-100.justify-content-between
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="circle" :variant="headerLight")
          | 桃園市跨域AP服務狀態
      b-button-group
        lah-button(
          to="/inf/xap/connectivity",
          icon="arrow-up-right-from-square",
          no-border,
          title="檢視全國事務所狀態"
        )
        lah-button(icon="sync" variant="outline-secondary" no-border action="cycle" title="重新讀取" @click="reload")
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
        li 顯示桃園市各所地政系統WEB版跨域AP狀態
        li 每1分鐘重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤
  .h-100: .offices
    lah-badge-site-status.office(
      v-for="office in offices",
      :ref="office",
      :key="office"
      :watch-site="office",
      :period="updatePeriod",
      :fill="false",
      :badge="false",
      short,
      @updated="handleUpdated"
    )
</template>

<script>
export default {
  name: 'LahMonitorBoardSiteHx',
  emit: ['light-update'],
  props: {
    updatePeriod: { type: String, default: '60000' }
  },
  data: () => ({
    offices: ['HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH'],
    statsMap: new Map([
      ['HA', {}],
      ['HB', {}],
      ['HC', {}],
      ['HD', {}],
      ['HE', {}],
      ['HF', {}],
      ['HG', {}],
      ['HH', {}]
    ]),
    headerLight: 'muted'
  }),
  computed: {
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
    }
  },
  created () {
    this.calcHeaderLight = this.$utils.debounce(() => {
      const flag = this.statsMap.every((data) => {
        return data.status > 0
      })
      this.headerLight = flag ? 'success' : 'danger'
    }, 400)
  },
  mounted () {},
  methods: {
    handleUpdated (data) {
      this.headerLight = 'warning'
      this.statsMap.set(data.site, data)
      this.calcHeaderLight()
    },
    calcHeaderLight () {},
    reload () {
      this.offices.forEach((office) => {
        this.$refs[office][0]?.check(true)
      })
    },
    name (entry) {
      try {
        for (const value of this.xapMap.values()) {
          if (value.code === entry.SITE) {
            return value.name
          }
        }
      } catch (e) {
        this.$utils.error(e)
      }
      return entry.SITE
    }
  }
}
</script>

<style lang="scss" scoped>
.offices {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  align-content: flex-start;
  .office {
    width: 23.5%;
    height: 50%;
    border: 1px solid gray;
    border-radius: 15px;
    margin: 0 calc(1.5%) calc(1.5%) 0;
  }
}
</style>
