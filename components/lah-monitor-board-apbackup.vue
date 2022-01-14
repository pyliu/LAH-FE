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
        @click="$fetch",
        title="重新讀取"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'AP Server', 7)",
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
        li 顯示 AP Server 備份狀態，每天晚上9點做備份
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ queryDays }}日內無資料
  ul(v-else): li(v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ extractSubject(item) }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ displayDatetime(item.timestamp) }}
    .truncate.text-muted.small {{ item.message }}
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
      :disabled="isBusy",
      :busy="isBusy",
      @end="$fetch",
      @click="$fetch"
    )
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updated }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardApbackup',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'AP Server 備份',
    modalId: 'tmp-id',
    queryDays: 1,
    regex: /AP\s+Server\s+\((.+)\)\s+files\s+backup\s+(successful|.+)\./gm
  }),
  fetch () {
    this.load('subject', 'AP Server', this.queryDays).then((data) => {
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
      return this.messages.filter((item, idx, arr) => idx < 8)
    },
    light () {
      const now = +new Date()
      if (
        this.headMessages.length === 0 ||
        now - this.headMessages[0].timestamp * 1000 > 24 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      const ans = this.messages.every((item) => {
        const matched = [...item.message.matchAll(this.regex)][0]
        return matched && matched[2] === 'successful'
      })
      return ans ? 'success' : 'danger'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  methods: {
    extractSubject (item) {
      const matched = [...item.message.matchAll(this.regex)][0]
      return `${matched[1]} ${matched[2]}`
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
