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
        @click="popupMessages('subject', 'Daily Email from NMC', 7)",
        title="讀取7天內訊息"
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
        li 顯示 UPS 狀態
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常，2組UPS都有回應
      div 🟡 表示有1組UPS無回報訊息
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
  ul(v-else): li(v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ shortenSubject(item) }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ item.message }}
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
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

export default {
  name: 'LahMonitorBoardUps',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'UPS 狀態',
    fetchType: 'subject',
    fetchKeyword: 'Daily Email from NMC',
    fetchDay: 2
  }),
  computed: {
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 4)
    },
    head2Messages () {
      return this.messages.filter((item, idx, arr) => idx < 2)
    },
    light () {
      const now = +new Date()
      if (
        this.head2Messages.length !== 2 ||
        now - this.head2Messages[0].timestamp * 1000 > 24 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      // UPS-A-73 / UPS-B-71 timestamp diff over a day
      if (this.head2Messages[0].timestamp - this.head2Messages[1].timestamp > 12 * 60 * 60) {
        return 'warning'
      }
      return this.head2Messages[0]?.subject !== this.head2Messages[1]?.subject
        ? 'success'
        : 'danger'
    }
  },
  methods: {
    shortenSubject (item) {
      return item.subject.replace(' Daily Email from NMC.', '')
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
