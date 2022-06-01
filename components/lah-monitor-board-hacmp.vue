<template lang="pug">
b-card(:border-variant="border")
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
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'hacmp', 7)",
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
        li 顯示資料庫 HACMP 狀態，每天 08:00 及 13:00 檢查
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料
  div(v-else)
    .d-flex.justify-content-between.font-weight-bold
      a.truncate(
        href="#",
        @click="popupLogContent(headMessage)",
        title="顯示詳細記錄"
      ) {{ headMessage.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(headMessage.timestamp, true)",
        :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(headMessage.timestamp * 1000) }}
    .truncate.text-muted.small(v-if="light !== 'danger'", v-html="extractedMessage")
    .text-danger.small(v-else, v-html="extractedError")
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
  name: 'LahMonitorBoardHacmp',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 HACMP',
    fetchType: 'subject',
    fetchKeyword: 'hacmp',
    fetchDay: 1,
    foundFsRegex: /\/.+\s+datavg\s+.+\s+ORAH[A-H]HA1,ORAH[A-H]HA2/gm
  }),
  computed: {
    headMessage () {
      return this.messages[0]
    },
    foundFs () {
      const message = this.headMessage.message || ''
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return [...message.matchAll(this.foundFsRegex)]
    },
    extractedMessage () {
      return this.$utils.convertMarkd(`✅ 已找到下列系統所需資料夾\n${this.foundFs.join('\n')}`)
    },
    extractedError () {
      const regex = /.+unreachable.+/gm
      const message = this.headMessage.message || ''
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return [...message.matchAll(regex)].join('<br/>')
    },
    light () {
      const now = +new Date()
      if (
        this.$utils.empty(this.headMessage) ||
        now - this.headMessage.timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      return this.foundFs.length === 7 ? 'success' : 'danger'
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
