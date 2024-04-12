<template lang="pug">
b-card(:border-variant="border")
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="circle", :variant="light")
    strong(v-if="messagesAfterThreadhold.length > 0 && problems.length === 0") {{ header }} ({{ monitorHrs }}小時內正常)
    strong(v-else) {{ header }}({{ monitorHrs }}小時內)
    b-button-group.ml-auto(size="sm")
      lah-button-count-badge(
        v-if="restores.length > 0",
        :count="restores.length",
        variant="success",
        :title="`${monitorHrs}小時內回復訊息`",
        @click="showMails({ title: '回復通知', icon: 'check-circle', variant: 'success', items: restores })"
      )
      lah-button-count-badge(
        v-if="warnings.length > 0",
        :count="warnings.length",
        variant="warning",
        :title="`${monitorHrs}小時內告警訊息`",
        @click="showMails({ title: '異常告警', icon: 'exclamation-circle', variant: 'warning', items: warnings })"
      )
        b-badge(variant="light", pill) {{ restores.length }}
      //- b-input-group.mx-1(size="sm", append="小時", style="max-width: 95px"): b-input(
      //-   v-model="monitorHrs",
      //-   type="number",
      //-   min=1,
      //-   max=24
      //- )
      lah-button(
        icon="cloud-sun-rain",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="$utils.openNewWindow('/inf/weather/')",
        title="開啟SRMAS天氣圖"
      )
      lah-button(
        v-if="!noCarousel",
        icon="arrows-left-right",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.carousel?.next()",
        v-b-tooltip="'切換SRMAS天氣圖/郵件分析顯示'"
      )
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('sender', 'SRMAS', 3)",
        title="讀取3天內訊息"
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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 顯示 SRMAS 系統回報訊息分析統計
        li 儀表板每15分鐘重新檢查一次
      hr
      .d-flex.align-items-center
        span 👉 顯示最近
        b-input.mx-1(v-model="monitorHrs", type="number", min=1, max=24, size="sm", style="width: 50px")
        span 小時內的資訊
      hr
      .d-flex.align-items-center
        span 👉 輪播切換秒數
        b-input.mx-1(v-model="carouselSecs", type="number", min=3, max=300, size="sm", style="width: 60px")
      hr
      div ⭐ 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示有「告警通知」但無「回復通知」之項目
  slot
  b-carousel(
    ref="carousel",
    :interval="noCarousel ? 0 : carouselSecs * 1000"
  )
    b-carousel-slide: template(#img)
      .center.h4(v-if="headMessages.length === 0") #[lah-fa-icon(icon="triangle-exclamation", variant="warning") {{ fetchDay }}日內無收到任何通知郵件資料]
      div(v-else-if="problems.length > 0 || fixed.length > 0")
        lah-monitor-board-srmas-list(
          v-if="problems.length > 0",
          title-text="無告警回復項目",
          title-icon="exclamation-triangle",
          variant="danger",
          :items="problems"
        )
        hr(v-if="problems.length > 0")
        lah-monitor-board-srmas-fixed(
          v-if="fixed.length > 0",
          title-text="已正常回復項目",
          title-icon="check-double",
          variant="success",
          :items="fixed"
        )
      .center.h4(v-else) #[lah-fa-icon(icon="triangle-exclamation", variant="warning") {{ monitorHrs }}小時內未收到告警訊息]
    b-carousel-slide: template(#img)
      .center.h5(v-if="failed") 無法讀取 {{ weatherImgUrl }} 影像
      b-link(
        v-show="!failed",
        @click="$utils.openNewWindow('/inf/weather/')",
        v-b-tooltip="`顯示${weatherImgUrl}`"
      )
        b-img(
          :src="weatherImgUrl",
          fluid,
          thumbnail,
          @load="failed = false",
          @error="failed = true"
        )
  //- lah-button(@click="matchWarningRestores") test
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )

</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'
import lahMonitorBoardSrmasFixed from '~/components/lah-monitor-board-srmas-fixed.vue'
import lahMonitorBoardSrmasList from '~/components/lah-monitor-board-srmas-list.vue'

export default {
  name: 'LahMonitorBoardSrmas',
  components: { lahMonitorBoardRaw, lahMonitorBoardSrmasList, lahMonitorBoardSrmasFixed },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false },
    monitorBoardMH: { type: Boolean, default: false },
    noCarousel: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS分析',
    fetchType: 'sender', // lahMonitorBoardBase used
    fetchKeyword: 'SRMAS', // lahMonitorBoardBase used
    fetchDay: 1,
    monitorHrs: 12,
    duration: 0,
    threadhold: 0,
    fixed: [],
    problems: [],
    failed: false,
    weatherPngTs: 0,
    weatherPngTimer: null,
    carouselSecs: 30,
    srmas: new Map([
      ['HA', '220.1.34.251'],
      ['HB', '220.1.35.95'],
      ['HC', '220.1.36.16'],
      ['HD', '220.1.37.93'],
      ['HE', '220.1.38.127'],
      ['HF', '220.1.39.126'],
      ['HG', '220.1.40.76'],
      ['HH', '220.1.41.64']
    ])
  }),
  computed: {
    messagesAfterThreadhold () {
      const tmp = this.messages.filter((item, idx, arr) => {
        return item.timestamp > this.threadhold
      })
      // .map((item) => {
      //   return {
      //     id: item.id
      //   }
      // })
      return this.$utils.uniqBy(this.$utils.orderBy(tmp, 'timestamp').reverse(), 'message')
    },
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 3)
    },
    firstMessage () {
      return this.headMessages[0]
    },
    light () {
      if (!this.firstMessage) {
        return 'warning'
      }
      // return this.problems.length > 0 ? 'danger' : 'success'
      if (this.problems.length > 0) {
        const everyTrue = this.problems.every(item => item.message?.includes('🟢'))
        return everyTrue ? 'success' : 'danger'
      }
      return 'success'
    },
    warnings () {
      // return this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('異常', '告警', '警告')).reverse()
      const tmp = this.$utils.difference(this.messagesAfterThreadhold, this.restores)
      return this.$utils.orderBy(tmp, 'timestamp', 'desc')
    },
    restores () {
      const tmp = this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('回復', '復原', '恢復'))
      return this.$utils.orderBy(tmp, 'timestamp', 'desc')
    },
    srmasIp () {
      return this.$config.SRMASHost || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png?ts=${this.weatherPngTs}`
    }
  },
  watch: {
    monitorHrs (val) {
      this.calcTime()
      this.setCache('monitorHrs', val)
    },
    carouselSecs (val) {
      this.setCache('carouselSecs', val)
    },
    messagesAfterThreadhold (dontcare) {
      this.matchWarningRestores()
    },
    warnings (val) {
      // console.warn('WARN', val)
      // this.matchWarningRestores()
    },
    restores (val) {
      // console.warn('RESTORE', val)
      // this.matchWarningRestores()
    },
    fixed (val) {
      // console.warn(val)
    }
  },
  async created () {
    // debounce the input event
    this.calcTime = this.$utils.debounce(() => {
      this.duration = this.monitorHrs * 60 * 60 * 1000
      this.threadhold = (+new Date() - this.duration) / 1000
    }, 400)
    this.matchWarningRestores = this.$utils.debounce(() => {
      const bad = [...this.warnings]
      this.fixed = []
      this.problems = []
      // foreach restore message finds one with the same key(host) and timestamp is less it in warning array
      this.restores.forEach((ritem, ridx, arr) => {
        // eslint-disable-next-line quotes
        const restoreLines = ritem.message.split("\r\n")?.map(line => line?.trim())
        // ex: 主機：220.1.34.206
        const restoreHostLine = restoreLines[1]
        // restoreHostLine === '主機：220.1.34.250' && console.warn('restore: ', restoreLines)
        // find the warning one for this restore message
        const founds = []
        bad.find((witem, widx) => {
          // eslint-disable-next-line quotes
          const warnLines = witem.message.split("\r\n")?.map(line => line?.trim())
          // ex: 主機：220.1.34.206
          const warnHostLine = warnLines[1]
          // restoreHostLine === '主機：220.1.34.250' && warnHostLine === '主機：220.1.34.250' && console.warn('warn: ', warnLines)
          // sometime the restore message will be sent before warning ... why? ask 👉 SRMAS by systex
          // 1130411 testing: add timestamp(seconds) comparing back
          if (restoreHostLine === warnHostLine && witem.timestamp <= ritem.timestamp) {
            // host matches and restore message timestamp behides warning
            founds.push(widx)
            return true
          }
          return false
        })
        // console.warn(`${restoreHostLine} FOUND`, founds.length)
        if (founds.length > 0) {
          founds.forEach((found) => {
            const bi = bad.splice(found, 1)[0]
            const gi = ritem
            // console.warn('match!', bi, gi)
            this.fixed.push({
              bad: bi,
              good: gi
            })
          })
        }
        // console.warn('after', bad.length)
      })
      // sorting by bad item timestamp desc
      this.fixed = [...this.$utils.sortBy(this.fixed, (item) => {
        return item.bad.timestamp
      })].reverse()
      this.problems = [...bad]
    }, 400)
    this.monitorHrs = await this.getCache('monitorHrs') || 12
    this.carouselSecs = await this.getCache('carouselSecs') || 30
    this.calcTime()
  },
  mounted () {
    this.weatherPngTimer = setInterval(() => {
      this.weatherPngTs = +new Date()
    }, 60000)
  },
  beforeDestroy () {
    clearInterval(this.weatherPngTimer)
  },
  methods: {
    calcTime () { /** debounced */ },
    matchWarningRestores () { /** debounced */ },
    showMails (payload) {
      // destructing obj entries to vars
      const { title, icon, variant, items } = payload
      this.modal(this.$createElement(lahMonitorBoardSrmasList, {
        props: {
          titleText: title,
          titleIcon: icon,
          variant,
          items
        }
      }), {
        title,
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
