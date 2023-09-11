<template lang="pug">
b-card(:border-variant="border")
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ monitorHrs }}小時內{{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="warnings.length > 0",
        variant="warning",
        :title="`${monitorHrs}小時內告警訊息`"
        @click="showMails({ title: '異常告警', icon: 'exclamation-circle', variant: 'warning', items: warnings })",
        pill,
        no-icon,
        v-b-tooltip.v-warning
      )
        //- span.mr-1 告警
        b-badge(variant="light", pill) {{ warnings.length }}
      lah-button.mx-1(
        v-if="restores.length > 0",
        variant="success",
        :title="`${monitorHrs}小時內回復訊息`"
        @click="showMails({ title: '回復通知', icon: 'check-circle', variant: 'success', items: restores })",
        pill,
        no-icon,
        v-b-tooltip.v-success
      )
        //- span.mr-1 回復
        b-badge(variant="light", pill) {{ restores.length }}
      //- b-input-group.mx-1(size="sm", append="小時", style="max-width: 95px"): b-input(
      //-   v-model="monitorHrs",
      //-   type="number",
      //-   min=1,
      //-   max=24
      //- )
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
        li 儀錶板每15分鐘重新檢查一次
      hr
      .d-flex.align-items-center
        span 👉 顯示最近
        b-input.mx-1(v-model="monitorHrs", type="number", min=1, max=24, size="sm", style="width: 50px")
        span 小時內的資訊
      hr
      div ⭐ 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示有「告警通知」但無「回復通知」之項目
  slot
  .center.h3(v-if="messagesAfterThreadhold.length > 0 && problems.length === 0")
    .mr-1 {{ monitorHrs }}小時內一切正常
    lah-fa-icon(icon="seedling", variant="success")
  .center(v-else-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else)
    lah-monitor-board-srmas-list.mb-2(
      v-if="problems.length > 0"
      title-text="無告警回復項目",
      title-icon="exclamation-triangle",
      variant="danger",
      :items="problems"
    )
  lah-monitor-board-srmas-fixed(
    v-if="fixed.length > 0"
    title-text="已正常回復項目",
    title-icon="check-double",
    variant="success",
    :items="fixed"
  )

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
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS分析',
    fetchType: 'sender',
    fetchKeyword: 'SRMAS',
    fetchDay: 1,
    monitorHrs: 12,
    duration: 0,
    threadhold: 0,
    regex: /主機：(\d+\.\d+\.\d+\.\d+)/gm,
    fixed: [],
    problems: []
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
      return this.$utils.difference(this.messagesAfterThreadhold, this.restores)
    },
    restores () {
      return this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('回復', '復原', '恢復'))
    }
  },
  watch: {
    monitorHrs (val) {
      this.calcTime()
      this.setCache('monitorHrs', val)
    },
    messagesAfterThreadhold (val) {
      // console.warn(val)
    },
    warnings (val) {
      // console.warn('WARN', val)
      this.matchWarningRestores()
    },
    restores (val) {
      // console.warn('RESTORE', val)
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
    }, 500)
    this.matchWarningRestores = this.$utils.debounce(() => {
      const bad = [...this.warnings]
      this.fixed = []
      this.problems = []
      // foreach restore message finds one with the same key(host) and timestamp is less it in warning array
      this.restores.forEach((ritem, ridx, arr) => {
        // eslint-disable-next-line quotes
        const restoreLines = ritem.message.split("\r\n")
        // ex: 主機：220.1.34.206
        const restoreHostLine = restoreLines[1]
        // find the warning one for this restore message
        let found = -1
        bad.find((witem, widx) => {
          // eslint-disable-next-line quotes
          const warnLines = witem.message.split("\r\n")
          // ex: 主機：220.1.34.206
          const warnHostLine = warnLines[1]
          if (restoreHostLine === warnHostLine && ritem.timestamp >= witem.timestamp) {
            // host matches and restore message timestamp behides warning
            found = widx
            return true
          }
          return false
        })
        // console.warn('before', bad.length)
        if (found !== -1) {
          const bi = bad.splice(found, 1)[0]
          const gi = ritem
          // console.warn('match!', bi, gi)
          this.fixed.push({
            bad: bi,
            good: gi
          })
        }
        // console.warn('after', bad.length)
      })
      // sorting by bad item timestamp desc
      this.fixed = [...this.$utils.sortBy(this.fixed, (item) => {
        return item.bad.timestamp
      })].reverse()
      this.problems = [...bad]
    }, 500)
    this.monitorHrs = await this.getCache('monitorHrs') || 12
    this.calcTime()
  },
  mounted () {},
  methods: {
    calcTime () { /** debounced */ },
    matchWarningRestores () { /** debounced */ },
    showMails (payload) {
      // destruvting obj entries to vars
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
