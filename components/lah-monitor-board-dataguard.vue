<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        title="重新讀取",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'DataGuard', 7)",
        title="讀取7天內訊息"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 監控說明`")
      ul
        li 顯示資料庫 Data Guard 狀態(檢視P8-2、P7-102及hb-114內「Current log sequence」文字是否一樣)，每天 08:00 及 13:00 檢查
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態超過6小時未更新
      div 🔴 表示有資料庫 Current Log Sequence 不一致
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ queryDays }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 #[b-badge(variant="primary", pill) {{ currentLogNumber(item) }}]
      .mr-1 #[b-badge(:variant="switchoverText(item) !== 'ACTIVE' ? 'danger' : 'success'", pill) {{ switchoverText(item) }}]
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ item.subject.replace(' DataGuard STATE', '') }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ currentLogText(item) }} | SWITCHOVER STATUS: SESSIONS {{ switchoverText(item) }}
  template(#footer, v-if="footer"): client-only: .d-flex.justify-content-between.small.text-muted
    lah-countdown-button.border-0(
      size="sm",
      ref="countdown",
      icon="sync-alt",
      action="ld-cycle",
      auto-start,
      title="立即重新讀取",
      variant="outline-secondary",
      badge-variant="secondary",
      :milliseconds="reloadMs",
      :disabled="isBusy || fetchingMonitorMail",
      :busy="isBusy",
      @end="$fetch",
      @click="reload"
    )
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updated }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardDataguard',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 Data Guard',
    modalId: 'tmp-id',
    queryDays: 1
  }),
  fetch () {
    this.load('subject', 'DataGuard', this.queryDays).then((data) => {
      // successful loaded
    }).catch((err) => {
      this.$utils.warn(err)
    }).finally(() => {
      // set auto reloading timeout
      if (this.$refs.countdown) {
        this.$refs.countdown.setCountdown(this.reloadMs)
        this.$refs.countdown.startCountdown()
      } else {
        this.timeout(() => this.$fetch(), this.reloadMs)
      }
    })
  },
  computed: {
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 3)
    },
    light () {
      const now = +new Date()
      if (
        this.headMessages.length === 0 ||
        now - this.headMessages[0].timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      const criteria = this.currentLogText(this.headMessages[0])
      let ans = this.headMessages.every((item, index, array) => {
        return criteria === this.currentLogText(item)
      })
      ans = this.headMessages.every((item, index, array) => {
        return this.switchoverText(item) === 'ACTIVE'
      })
      return ans ? 'success' : 'danger'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  methods: {
    logSeqMatches (item) {
      const regex = /Current\s+log\s+sequence\s+(\d+)/gm
      return [...item.message.matchAll(regex)]
    },
    switchoverText (item) {
      const regex = /SESSIONS\s+([A-Z]+)/gm
      const arr = [...item.message.matchAll(regex)]
      return arr[0][1]
    },
    currentLogText (item) {
      const arr = this.logSeqMatches(item)
      /**
       * arr[0]:
       *   0: "Current log sequence\t       54357"
       *   1: "54357"
       */
      return arr[0][0]
    },
    currentLogNumber (item) {
      const arr = this.logSeqMatches(item)
      /**
       * arr[0]:
       *   0: "Current log sequence\t       54357"
       *   1: "54357"
       */
      return arr[0][1]
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
