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
        @click="popupMessages('subject', 'BACKUP OPTION', 7)",
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
        li 顯示資料庫備份狀態(選項2、4、5)
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ queryDays }}天內未獲得完整郵件清單(OPTION 2、4、5)
      div 🔴 表示有備份失效
      ul.ml-4
        li OPTION 2 👉 1工作天內未更新
        li OPTION 4 👉 1天內未更新
        li OPTION 5 👉 45分鐘內未更新
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ queryDays }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄",
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
  name: 'LahMonitorBoardDbbackup',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫備份排程',
    modalId: 'tmp-id'
  }),
  fetch () {
    this.load('subject', 'BACKUP OPTION', this.queryDays).then((data) => {
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
      // option 2 only executes on 02:00:00 every workday
      return this.isMonday ? 4 : 1
    },
    headMessages () {
      const opt2 = this.messages.find(item =>
        item.subject.includes('BACKUP OPTION 2')
      )
      const opt4 = this.messages.find(item =>
        item.subject.includes('BACKUP OPTION 4')
      )
      const opt5 = this.messages.find(item =>
        item.subject.includes('BACKUP OPTION 5')
      )
      return [opt2, opt4, opt5].filter(item => item)
    },
    light () {
      const ts = +new Date()
      const opt4Ms = 24 * 60 * 60 * 1000
      const opt2Ms = this.queryDays * opt4Ms
      // there is a 15 mins offset for scheduling
      const opt5Ms = 30 * 60 * 1000 + 15 * 60 * 1000
      if (this.headMessages.length === 0 || this.headMessages.length !== 3) {
        return 'warning'
      } else if (
        ts - this.headMessages[0].timestamp * 1000 > opt2Ms ||
        ts - this.headMessages[1].timestamp * 1000 > opt4Ms ||
        (!this.isSaturday && ts - this.headMessages[2].timestamp * 1000 > opt5Ms)
      ) {
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
      const ts = +new Date()
      const opt4Ms = 24 * 60 * 60 * 1000
      const opt2Ms = this.queryDays * opt4Ms
      // there is a 15 mins offset for scheduling
      const opt5Ms = 30 * 60 * 1000 + 15 * 60 * 1000
      const cssList = []
      if (
        item.subject.includes('BACKUP OPTION 2') &&
        (ts - item.timestamp * 1000 > opt2Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('BACKUP OPTION 4') &&
        (ts - item.timestamp * 1000 > opt4Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('BACKUP OPTION 5') &&
        (!this.isSaturday && (ts - item.timestamp * 1000) > opt5Ms)
      ) {
        cssList.push('text-danger')
      }
      return cssList
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
