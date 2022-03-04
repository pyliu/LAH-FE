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
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示最新同步郵件日期非今日[{{ $utils.toADDate(new Date(), 'yyyy-LL-dd') }}]
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
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
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
      :disabled="isBusy || fetchingMonitorMail",
      :busy="isBusy",
      @end="$fetch",
      @click="reload"
    )
    lah-transition: .my-auto(v-if="fetchingState !== ''") {{ fetchingState }}
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updated }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardAdsync',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'AD 同步',
    fetchType: 'subject',
    fetchKeyword: 'ad sync',
    fetchDay: 3
  }),
  computed: {
    todayNoAdSyncMessage () {
      return `${this.today} 無 AD 同步資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
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
      return 'success'
    }
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      return list.includes('text-danger') ? '🔴' : '🟢'
    },
    subjectCss (item) {
      // parsing message for the successful text
      if (item.subject === this.todayNoAdSyncMessage) {
        return ['text-danger']
      }
      return []
    },
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
