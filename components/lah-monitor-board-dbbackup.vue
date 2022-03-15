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
        @click="popupMessages('subject', 'BACKUP OPTION', 7)",
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
        li 顯示資料庫備份狀態(選項2、4、5)
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ fetchDay }}天內未獲得完整郵件清單(OPTION 2、4、5)
      div 🔴 表示有備份失效
      ul.ml-4
        li OPTION 2 👉 1工作天內未更新
        li OPTION 4 👉 1天內未更新
        li OPTION 5 👉 45分鐘內未更新
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
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
  name: 'LahMonitorBoardDbbackup',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫備份排程',
    fetchType: 'subject',
    fetchKeyword: 'BACKUP OPTION',
    fetchDay: 1
  }),
  computed: {
    opt2Ms () {
      return this.opt4Ms
    },
    opt2Message () { return this.findItem(2) },
    opt4Ms () { return this.fetchDay * 24 * 60 * 60 * 1000 },
    opt4Message () { return this.findItem(4) },
    opt5Ms () { return 60 * 60 * 1000 },
    opt5Message () { return this.findItem(5) },
    headMessages () {
      return [this.opt2Message, this.opt4Message, this.opt5Message].filter(item => item)
    },
    light () {
      const ts = this.$utils.nowTs()
      if (this.headMessages.length === 0 || this.headMessages.length !== 3) {
        return 'warning'
      } else if (
        ts - this.opt2Message.timestamp * 1000 >= this.opt2Ms ||
        ts - this.opt4Message.timestamp * 1000 >= this.opt4Ms ||
        (!this.isSaturday && ts - this.opt5Message.timestamp * 1000 >= this.opt5Ms)
      ) {
        this.lightChanged('danger', '', 'LahMonitorBoardDbbackup')
        return 'danger'
      }
      this.lightChanged('success', '', 'LahMonitorBoardDbbackup')
      return 'success'
    }
  },
  created () {
    this.fetchDay = this.isMonday ? 4 : 1
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      return list.includes('text-danger') ? '🔴' : '🟢'
    },
    subjectCss (item) {
      const ts = +new Date()
      const cssList = []
      if (
        item.subject.includes('BACKUP OPTION 2') &&
        (ts - item.timestamp * 1000 > this.opt2Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('BACKUP OPTION 4') &&
        (ts - item.timestamp * 1000 > this.opt4Ms)
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject.includes('BACKUP OPTION 5') &&
        (!this.isSaturday && (ts - item.timestamp * 1000) > this.opt5Ms)
      ) {
        cssList.push('text-danger')
      }
      return cssList
    },
    findItem (opt) {
      let keyword = `BACKUP OPTION ${opt}`
      let ts = 0
      switch (opt) {
        case 2:
          ts = this.opt2Ms
          break
        case 4:
          ts = this.opt4Ms
          break
        case 5:
          ts = this.opt5Ms
          break
        default:
          keyword = `未知選項 ${opt}`
      }
      let found = this.messages.find(item =>
        item.subject.includes(keyword)
      )
      // prepare dummy item to indicate the missing info
      if (!found) {
        found = {
          from: 'oracle@orahaha1',
          id: 0,
          mailbox: 'INBOX',
          message: `找不到 ${keyword} 已完成的通知郵件`,
          subject: `${keyword} 未完成！`,
          timestamp: this.$utils.nowTs() / 1000 - ts / 1000
        }
      }
      return found
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
