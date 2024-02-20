<template lang="pug">
div(v-cloak)
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto: lah-fa-icon(icon="heart-pulse", action="breath") 全國地所跨域主機監控
      lah-button(
        v-b-modal.help-modal,
        icon="info",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        title="說明"
      )
    .d-flex.align-items-center
      b-checkbox.mr-1(v-model="displayShortName", size="lg") 顯示別名
      b-checkbox(v-model="displayDanger", size="lg") 連線狀態錯誤
      lah-button(
        icon="link-slash",
        no-border,
        title="顯示離線紀錄",
        variant="outline-danger",
        size="lg",
        @click="showOfflineRecords"
      ) 顯示離線紀錄
      lah-button.mr-1(
        to="/inf/xap/xbroken_display",
        icon="tv",
        size="lg",
        title="民眾端顯示頁面"
      )
      lah-countdown-button(
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
            auto-start
            no-badge
            @end="load"
            @click="load"
            :milliseconds="reloadMs"
            :disabled="isBusy"
            :busy="isBusy"
          )
  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        li 每5分鐘左右重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤
  lah-transition: h3.center(v-if="displayDanger && red.length === 0")
    lah-fa-icon.mr-1(icon="circle-check", variant="success")
    span 目前各地所皆可正常連線
  lah-flex-item-group: lah-badge-site-status.m-2(
    v-for="(data, idx) in officesData",
    v-if="isOn(data)",
    :ref="data.id",
    :key="`${data.id}-${idx}`",
    :watch-site="data.id",
    :fill="false",
    :short="displayShortName",
    :static-data="data",
    pill,
    @click="show(data)",
    :class="borderCss(data)"
  )
</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue'
export default {
  components: { lahOfficeDownTimeline },
  data: () => ({
    displayDanger: false,
    displayShortName: true,
    officesData: [],
    red: [],
    green: [],
    yellow: [],
    reloadMs: 5 * 60 * 1000,
    timer: null
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  computed: {},
  watch: {
    officesData (val) {
      this.red.length = 0
      this.yellow.length = 0
      this.green.length = 0
      /**
       * id: "XX"
       * name: "XX地政事務所"
       * response: "HTTP/1.1 401 Unauthorized"
       * serial: 1xxxx
       * state: "UP"
       * timestamp: 1694416638
       */
      val.forEach((value, idx, arr) => {
        const site = value.id
        if (value.state === 'UP') {
          this.green.push(site)
        } else if (value.state === 'DOWN') {
          this.red.push(site)
        } else {
          this.yellow.push(site)
        }
      })
    }
  },
  created () { this.load() },
  mounted () {
    this.timer = setInterval(this.load.bind(this), this.reloadMs)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    isOn (data) {
      if (this.displayDanger) {
        return this.red.includes(data.id)
      }
      return true
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
    load () {
      this.isBusy = true
      this.officesData = []
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_cached'
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.id))]
        } else {
          this.$utils.error('無法取得各地政事務所狀態快取資料。', data)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false,
          hideFooter: true
        }
      }), {
        title: '離線伺服器歷史資訊'
      })
    },
    borderCss (data) {
      const css = []
      if (data.state !== 'UP') {
        css.push('border-danger')
        css.push('shadow')
      } else if (data.id.startsWith('H')) {
        css.push('border-info')
        css.push('shadow')
      } else {
        css.push('border-light')
      }
      return css
    }
  }
}
</script>

<style lang="scss">
</style>
