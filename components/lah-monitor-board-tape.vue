<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(
      size="sm"
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
        @click="popupMessages('subject', 'TAPE BACKUP STATE', 7)",
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
        li 顯示資料庫磁帶備份狀態(P7-102)
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ fetchDay }}天內未獲得完整郵件清單
      div 🔴 表示郵件找不到「pax successful!!」字串
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
        :class="subjectCss(item)"
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
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardTape',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫磁帶備份',
    fetchType: 'subject',
    fetchKeyword: 'TAPE BACKUP STATE',
    fetchDay: 1
  }),
  computed: {
    todayNoTapeMessage () {
      return `${this.today} 無磁帶備份資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
      const ts = +new Date() / 1000
      if (filtered[0] && ts - filtered[0].timestamp > 24 * 60 * 60) {
        // insert dummy item to indicate danger
        filtered.unshift({
          subject: this.todayNoTapeMessage,
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
      if (this.headMessages.length === 0) {
        return 'warning'
      }
      if (this.headMessage.subject === this.todayNoTapeMessage) {
        if (this.isMonday) {
          // No tape message on Monday is normal
          return 'success'
        }
        return 'danger'
      }
      const ts = this.isMonday ? 4 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      if ((now - this.headMessages[0].timestamp * 1000) > ts) {
        return 'danger'
      }
      // parsing message for the successful text
      const message = this.headMessages[0].message
      const regex = /pax\s+successful!!/gm
      const all = [...message.matchAll(regex)].join('')
      if (this.$utils.empty(all)) {
        return 'danger'
      }
      return 'success'
    }
  },
  created () {
    this.fetchDay = this.isMonday ? 4 : 3
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      if (list.includes('text-danger')) {
        return '🔴'
      }
      if (list.includes('text-warning')) {
        return '🟡'
      }
      return '🟢'
    },
    subjectCss (item) {
      if (item.subject === this.todayNoTapeMessage) {
        if (this.isMonday) {
          return ['text-warning']
        }
        return ['text-danger']
      }
      // parsing message for the successful text
      const message = item.message
      const regex = /pax\s+successful!!/gm
      const all = [...message.matchAll(regex)].join('')
      if (this.$utils.empty(all)) {
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
