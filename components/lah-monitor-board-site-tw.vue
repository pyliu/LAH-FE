<template lang="pug">
b-card(:border-variant="borderVariant", :class="[attentionCss]")
  template(#header)
    .d-flex.w-100.justify-content-between
      h6.my-auto.font-weight-bolder.truncate(title="全國地所跨域AP狀態監控")
        lah-fa-icon(icon="circle" :variant="headerLight")
          | 全國地所跨域AP狀態
      b-button-group
        lah-button-count-badge(
          :count="upCount",
          variant="success",
          title="正常數量",
          @click="displayError = false"
        )
        lah-button-count-badge(
          :count="downCount",
          :variant="headerLight",
          title="異常數量",
          @click="displayError = true"
        )
        lah-button(
          icon="link-slash",
          no-border,
          title="顯示離線紀錄",
          variant="outline-danger",
          @click="showOfflineRecords"
        )
        lah-button(
          to="/inf/xap/broken_cached",
          icon="arrow-up-right-from-square",
          no-border,
          title="全國地所狀態一覽"
        )
        lah-button(
          to="/inf/xap/xbroken_display",
          icon="tv",
          no-border,
          title="民眾端顯示頁面"
        )
        lah-button(
          icon="sync",
          action="cycle",
          variant="outline-secondary",
          title="重新讀取",
          no-border,
          @click="reload(true)"
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
        li 顯示各地所(全國)連線狀態
        li 每5分鐘重新更新一次
      hr
      div 🟢 表示服務正常
      div 🟡 表示其他縣市地所連線錯誤
      div 🔴 表示有桃園市地所連線錯誤
  .h-100.overflow-auto
    lah-transition
      .mt-3.text-center(v-if="isBusy")
        lah-fa-icon.h4(icon="spinner", variant="dark", action="spin") 讀取中 ...
      .mt-3.text-center(v-else-if="downCount === 0 && displayError")
        lah-fa-icon.h4(icon="circle-check", variant="success") 無偵測到異常

    .d-flex.flex-wrap
      lah-badge-site-status.m-1(
        v-for="office in displayOffices",
        :ref="office.id",
        :key="office.id",
        :static-data="office",
        :fill="false",
        :badge="false",
        short,
        @click="show(office)"
      )

  //- template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
  //-   ref="footer"
  //-   :reload-ms="updatePeriod",
  //-   :busy="isBusy",
  //-   :fetch="$fetch",
  //-   :reload="reload(true)",
  //-   :update-time="updated"
  //- )

</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue';
export default {
  name: 'LahMonitorBoardSiteTw',
  emit: ['light-update'],
  components: { lahOfficeDownTimeline },
  props: {
    updatePeriod: { type: String, default: '300000' }, // 5 mins
    footer: { type: Boolean, default: true },
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    officesData: [],
    displayError: true,
    timer: null,
    updated: ''
  }),
  fetch () {
    this.reload()
  },
  computed: {
    count () {
      return this.officesData.length
    },
    displayOffices () {
      return this.displayError ? this.downOffices : this.upOffices
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
        return 'secondary'
      }
      if (this.downCount > 0) {
        /** json ex:
         * id: "AA"
         * name: "古亭地政事務所"
         * response: "HTTP/1.1 502 Proxy Error"
         * serial: 725726
         * state: "DOWN"
         */
        const HxDown = this.downOffices.find(o => o.id.startsWith('H'))
        if (HxDown) {
          this.$utils.warn(`H0 has down office ${HxDown.id} ${HxDown.name}. (${HxDown.response})`, HxDown)
          return 'dnager'
        }
        // only have timeout sites
        // if (this.downOffices.every(o => this.$utils.empty(o.response))) {
        //   return 'warning'
        // }
        return 'warning'
      }
      return 'success'
    },
    borderVariant () {
      if (['danger', 'warning'].includes(this.headerLight)) {
        return this.headerLight
      }
      return 'muted'
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.headerLight === 'danger') {
          return 'scale-danger'
        }
        if (this.headerLight === 'warning') {
          return 'scale-warning'
        }
      }
      return ''
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
  mounted () {
    this.$emit('light-update', {
      name: 'LahMonitorBoardSiteTw',
      new: 'warning',
      old: ''
    })
  },
  beforeDestroy () {
    clearTimeout(this.timer)
  },
  methods: {
    reload (force = false) {
      clearTimeout(this.timer)
      this.isBusy = true
      this.officesData = []
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_xap_stats',
          force
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.officesData = [...data.raw]
          }
          this.updated = this.$utils.formatTime(new Date())
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
          this.timeout(this.reload, 5 * 60 * 1000).then((handle) => { this.timer = handle })
        })
    },
    show (office) {
      /**
       * id: "EA"
         name: "XX地政事務所"
         response: "HTTP/1.1 502 Proxy Error"
         serial: 14550
         state: "DOWN"
        timestamp: 1694392448
       */
      this.modal(`
        代碼: ${office.id}<br/>
        名稱: ${office.name}<br/>
        回應：${office.response}<br/>
        更新：${this.$utils.formatTime(new Date(office.timestamp * 1000))}
      `, {
        title: `${office.name} 資訊`,
        html: true
      })
    },
    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false,
          hideFooter: true
        }
      }), {
        title: '離線伺服器歷史資訊',
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
