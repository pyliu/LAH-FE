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
        @click="popupMessages('subject', 'vm-clone', 30)",
        title="讀取30天內訊息"
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
        li 顯示VM備份狀態
        li 儀表板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ fetchDay }}日內找不到 VM CLONE 訊息
      div 🔴 表示 VM CLONE 排程中超過規定時間未更新
      .ml-4 周一：135 → 3天、24 → 4天、7 → 2天
      .ml-4 周二：135 → 1天、24 → 5天、7 → 3天
      .ml-4 周三：135 → 2天、24 → 1天、7 → 4天
      .ml-4 周四：135 → 1天、24 → 2天、7 → 5天
      .ml-4 周五：135 → 2天、24 → 1天、7 → 6天
      .ml-4 周六：135 → 1天、24 → 2天、7 → 7天
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
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
        :title="$utils.phpTsToAdDateStr(item.timestamp, true)",
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
  name: 'LahMonitorBoardVmclone',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'VM備份排程作業',
    fetchType: 'subject',
    fetchKeyword: 'vm-clone',
    fetchDay: 7,
    dummyMessage: '未發現監控郵件'
  }),
  computed: {
    vc135Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-135', subject: 'vm-clone-135 1,3,5-22:00' })
    },
    vc24Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-24', subject: 'vm-clone-24 2,4-22:00' })
    },
    vc7Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-7', subject: 'vm-clone-7 6-04:00' })
    },
    headMessages () {
      return [this.vc135Message, this.vc24Message, this.vc7Message].filter(item => item)
    },
    light () {
      let light = 'success'
      if (this.headMessages.length === 0) {
        light = 'warning'
      }
      if (!this.vc135Message || this.subjectCss(this.vc135Message).includes('text-danger')) {
        light = 'danger'
      }
      if (!this.vc24Message || this.subjectCss(this.vc24Message).includes('text-danger')) {
        light = 'danger'
      }
      if (!this.vc7Message || this.subjectCss(this.vc7Message).includes('text-danger')) {
        light = 'danger'
      }
      this.lightChanged(light, '', 'LahMonitorBoardVmclone')
      return light
    }
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      return list.includes('text-danger') ? '🔴' : '🟢'
    },
    subjectCss (item) {
      if (item.message === this.dummyMessage) {
        return ['text-danger']
      }
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
        item.subject?.includes('vm-clone-135') &&
        (ts - item.timestamp * 1000 > vc135Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject?.includes('vm-clone-24') &&
        (ts - item.timestamp * 1000 > vc24Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject?.includes('vm-clone-7') &&
        (!this.isSaturday && (ts - item.timestamp * 1000) > (vc7Ms + 12 * 60 * 60 * 1000))
      ) {
        cssList.push('text-danger')
      }
      return cssList
    },
    findVMCloneMessage (payload) {
      const { keyword, subject } = payload
      const found = this.messages.find(item =>
        item.subject.includes(keyword)
      )
      if (found) {
        return found
      }
      return this.vcDummyMessage({ subject, message: this.dummyMessage })
    },
    vcDummyMessage (payload) {
      const { subject, message } = payload
      return {
        id: 0,
        mailbox: 'INBOX',
        receiver: '',
        sender: '',
        timestamp: +new Date() / 1000,
        subject,
        message
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
