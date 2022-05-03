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
        li 顯示 SRMAS 系統回報訊統計
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示「告警通知」及「回復通知」統計不相符
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else)
    .d-flex.font-weight-bold.justify-content-around.mb-1
      lah-button(icon="exclamation-circle", variant="warning", @click="popupMessages('subject', '異常告警', 1, '異常告警訊息')", pill)
        span.mr-1 異常告警
        b-badge(variant="light", pill) {{ warnings.length }}
      lah-button(icon="check-circle", variant="success", @click="popupMessages('subject', '回復通知', 1, '回復通知訊息')", pill)
        span.mr-1 回復通知
        b-badge(variant="light", pill) {{ restores.length }}

    .font-weight-bold.h6 #[lah-fa-icon(icon="exclamation-triangle", variant="danger") 未接收到回復通知項目]
      div(v-for="(item, idx) in problems")
        .d-flex.justify-content-between.font-weight-bold.small
          a.truncate(
            href="#",
            @click="popupLogContent(item)",
            :class="['text-success']",
            title="顯示詳細記錄"
          ) {{ item.subject }}
          lah-fa-icon.small.my-auto.text-nowrap(
            icon="clock",
            regular,
            :title="$utils.tsToAdDateStr(item.timestamp, true)",
            :variant="isToday(item.timestamp) ? 'success' : 'muted'"
          ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
        .truncate.text-muted.small {{ item.message }}
    .font-weight-bold.h6 #[lah-fa-icon(icon="exclamation-circle", variant="warning") 最新異常告警]
      div(v-for="(item, idx) in headWarnings")
        .d-flex.justify-content-between.font-weight-bold.small
          a.truncate(
            href="#",
            @click="popupLogContent(item)",
            :class="['text-warning']",
            title="顯示詳細記錄"
          ) {{ item.subject }}
          lah-fa-icon.small.my-auto.text-nowrap(
            icon="clock",
            regular,
            :title="$utils.tsToAdDateStr(item.timestamp, true)",
            :variant="isToday(item.timestamp) ? 'success' : 'muted'"
          ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
        .truncate.text-muted.small {{ item.message }}
    .font-weight-bold.h6 #[lah-fa-icon(icon="check-circle", variant="success") 最新回復通知]
      div(v-for="(item, idx) in headRestores")
        .d-flex.justify-content-between.font-weight-bold.small
          a.truncate(
            href="#",
            @click="popupLogContent(item)",
            :class="['text-success']",
            title="顯示詳細記錄"
          ) {{ item.subject }}
          lah-fa-icon.small.my-auto.text-nowrap(
            icon="clock",
            regular,
            :title="$utils.tsToAdDateStr(item.timestamp, true)",
            :variant="isToday(item.timestamp) ? 'success' : 'muted'"
          ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
        .truncate.text-muted.small {{ item.message }}

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

export default {
  name: 'LahMonitorBoardSrmas',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS通知監控',
    fetchType: 'sender',
    fetchKeyword: 'SRMAS',
    fetchDay: 1
  }),
  computed: {
    todayNoAdSyncMessage () {
      return `${this.today} 無SRMAS相關資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
      return filtered
    },
    headMessage () {
      return this.headMessages[0]
    },
    light () {
      if (!this.headMessage) {
        return 'warning'
      }
      return this.problems.length > 0 ? 'danger' : 'success'
    },
    headWarnings () {
      const filtered = this.warnings.filter((item, idx, arr) => idx < 1)
      return filtered
    },
    warnings () {
      return this.messages.filter((item, idx, arr) => item.subject?.startsWith('異常告警'))
    },
    headRestores () {
      const filtered = this.restores.filter((item, idx, arr) => idx < 1)
      return filtered
    },
    restores () {
      return this.messages.filter((item, idx, arr) => item.subject?.startsWith('回復通知'))
    },
    problems () {
      const bad = [...this.warnings]
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        let found = -1
        bad.find((item, idx) => {
          if (item.subject?.includes(trimGoodHead)) {
            found = idx
            return true
          }
          return false
        })
        if (found !== -1) {
          bad.splice(found, 1)
        }
      }
      return bad
    }
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
