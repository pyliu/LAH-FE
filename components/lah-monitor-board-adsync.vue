<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
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
        @click="popupMessages('subject', 'ad sync', 7)",
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
        li 顯示 AD SYNC 狀態，每天8點同步
        li 儀表板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示同步完成且無錯誤
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示最新同步郵件日期非今日[{{ $utils.toADDate(new Date(), 'yyyy-LL-dd') }}] 或同步過程發生錯誤
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        :class="subjectCss(item)",
        title="顯示詳細記錄"
      ) {{ item.subject }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
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
import lahMonitorBoardBase from '~/mixins/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardAdsync',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'AD 同步狀態',
    fetchType: 'subject',
    fetchKeyword: 'ad sync',
    fetchDay: 5,
    fetchConvert: true
  }),
  computed: {
    todayNoAdSyncMessage () {
      return `${this.today} 無 AD 同步資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 5)
      const ts = +new Date() / 1000
      if (filtered[0] && ts - filtered[0].timestamp > 24 * 60 * 60) {
        // insert dummy item to indicate danger
        filtered.unshift({
          subject: this.todayNoAdSyncMessage,
          message: '...',
          timestamp: filtered[0].timestamp + 24 * 60 * 60
        })
      }
      return filtered
    },
    headMessage () {
      return this.headMessages[0]
    },
    light () {
      const now = +new Date()
      if (!this.headMessage) {
        return 'warning'
      }
      if (this.headMessage.subject === this.todayNoAdSyncMessage) {
        return 'danger'
      }
      const messageDate = this.$utils.toADDate(this.headMessage.timestamp * 1000, 'yyyy-LL-dd')
      const todayDate = this.$utils.toADDate(now, 'yyyy-LL-dd')
      if (messageDate !== todayDate) {
        return 'danger'
      }
      if (!this.isSuccess(this.headMessage)) {
        return 'danger'
      }
      return 'success'
    }
  },
  watch: {
    headMessages (arr) {
      // console.warn(arr)
    }
  },
  methods: {
    isSuccess (item) {
      if (!item || !item.message || item.subject === this.todayNoAdSyncMessage) {
        return false
      }
      const msg = item.message
      const hasSyncallDone = msg.includes('SyncAll 完成') || /syncall finished/i.test(msg)
      const hasNoErrors = msg.includes('SyncAll 已終止，沒有錯誤') || /syncall terminated with no errors/i.test(msg)
      const hasCheckEnd = /check end/i.test(msg)

      if (!hasSyncallDone || !hasNoErrors || !hasCheckEnd) {
        return false
      }

      // 排除「沒有錯誤」與「no errors」合法標記後檢查是否包含錯誤關鍵字
      const cleaned = msg.replace(/沒有錯誤/g, '').replace(/terminated with no errors/gi, '')
      const failRegex = /(?:報告下列錯誤|發生錯誤|失敗|已取消|無法使用|錯誤|\berror\b|\bfail(?:ed|ure)?\b|\bfatal\b)/i
      return !failRegex.test(cleaned)
    },
    subjectLight (item) {
      return this.isSuccess(item) ? '🟢' : '🔴'
    },
    subjectCss (item) {
      if (!this.isSuccess(item)) {
        return ['text-danger']
      }
      return []
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
