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
        @click="popupMessages('subject', 'vm-clone', 30)",
        title="讀取30天內訊息"
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
        li 顯示VM備份狀態
        li 儀表板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到 VM CLONE 訊息
      div 🔴 表示 VM CLONE 排程中任一個失敗
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ queryDays }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        :class="subjectCss(item)"
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
  name: 'LahMonitorBoardVmclone',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'VM備份排程作業',
    modalId: 'tmp-id',
    queryDays: 7
  }),
  fetch () {
    this.load('subject', 'vm-clone', this.queryDays).then((data) => {
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
    vc135Message () {
      return this.messages.find(item =>
        item.subject.includes('vm-clone-135')
      )
    },
    vc24Message () {
      return this.messages.find(item =>
        item.subject.includes('vm-clone-24')
      )
    },
    vc7Message () {
      return this.messages.find(item =>
        item.subject.includes('vm-clone-7')
      )
    },
    headMessages () {
      return [this.vc135Message, this.vc24Message, this.vc7Message].filter(item => item)
    },
    light () {
      if (this.headMessages.length === 0) {
        return 'warning'
      }
      if (!this.vc135Message || this.subjectCss(this.vc135Message).includes('text-danger')) {
        return 'danger'
      }
      if (!this.vc24Message || this.subjectCss(this.vc24Message).includes('text-danger')) {
        return 'danger'
      }
      if (!this.vc7Message || this.subjectCss(this.vc7Message).includes('text-danger')) {
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
      const now = new Date()
      const today = now.getDay()
      const dayMs = 24 * 60 * 60 * 1000
      let vc135Ms = dayMs
      let vc24Ms = dayMs
      let vc7Ms = dayMs
      switch (today) {
        case 1:
          vc135Ms *= 3
          vc24Ms *= 4
          vc7Ms *= 2
          break
        case 2:
          vc135Ms *= 1
          vc24Ms *= 5
          vc7Ms *= 3
          break
        case 3:
          vc135Ms *= 2
          vc24Ms *= 1
          vc7Ms *= 4
          break
        case 4:
          vc135Ms *= 1
          vc24Ms *= 2
          vc7Ms *= 5
          break
        case 5:
          vc135Ms *= 2
          vc24Ms *= 1
          vc7Ms *= 6
          break
        case 6:
          vc135Ms *= 1
          vc24Ms *= 2
          vc7Ms *= 7
          break
        default:
          break
      }
      const cssList = []
      const ts = now.getTime()
      if (
        item.subject.includes('vm-clone-135') &&
        (ts - item.timestamp * 1000 > vc135Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('vm-clone-24') &&
        (ts - item.timestamp * 1000 > vc24Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('vm-clone-7') &&
        (!this.isSaturday && (ts - item.timestamp * 1000) > vc7Ms)
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
