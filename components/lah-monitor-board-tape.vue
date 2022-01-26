<template lang="pug">
b-card
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
        @click="$fetch",
        title="重新讀取"
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
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 監控說明`")
      ul
        li 顯示資料庫磁帶備份狀態(P7-102)
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ queryDays }}天內未獲得完整郵件清單
      div 🔴 表示郵件找不到「pax successful!!」字串
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ queryDays }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
        :class="subjectCss(item)"
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
      size="sm"
      ref="countdown"
      icon="sync-alt"
      action="ld-cycle"
      auto-start
      title="立即重新讀取"
      variant="outline-secondary"
      badge-variant="secondary"
      :milliseconds="reloadMs"
      :disabled="isBusy"
      :busy="isBusy"
      @end="$fetch"
      @click="$fetch"
    )
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updated }}
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
    modalId: 'tmp-id'
  }),
  fetch () {
    this.load('subject', 'TAPE BACKUP STATE', this.queryDays).then((data) => {
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
    queryDays () {
      // tape backup will not execute on weenend
      return this.isMonday ? 4 : 3
    },
    headMessages () {
      return this.messages.filter((item, idx, arr) => idx < 3)
    },
    light () {
      const now = +new Date()
      if (this.headMessages.length === 0) {
        return 'warning'
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
    this.modalId = this.$utils.uuid()
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      return list.includes('text-danger') ? '🔴' : '🟢'
    },
    subjectCss (item) {
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
