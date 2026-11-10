<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      //- lah-button(
      //-   icon="chart-simple",
      //-   :href="grafanaUrl",
      //-   target="_blank",
      //-   no-border,
      //-   title="開啟新視窗顯示詳細DB儀表板"
      //- ) 詳細資訊
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
        @click="popupMessages('subject', 'DataGuard', 7)",
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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
      ul
        li 顯示主、備份及副中心(中壢)資料庫之同步狀態
          ul
            li 請於各主機裡 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkDataguardSh" target="_blank" title="下載腳本") check-dataguard.sh]」以利完成後送出通知電子郵件。(⭐請依各所實際環境修正腳本內路徑及收件者資訊⭐)
            li 將此檔案 ⭐#[b-link.text-primary.font-weight-bold(:href="checkDataguardSQL" target="_blank" title="下載SQL") check-dataguard.sql]⭐ 跟上面的腳本放在一起以利腳本執行SQL步驟
            li 詳細排程與環境變數設定請參考「#[b-link.text-success.font-weight-bold(:href="checkDataguardSopPdf" target="_blank" title="下載SOP手冊") AIX 6.1 Oracle 伺服器 DataGuard 監控排程設定標準作業手冊 (PDF)]」(含各所參數檢查清單與故障排除)
            li e.g. 在 root 的 crontab 新增「0 8-17 * * 1-6 /scripts/check-dataguard.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)
        li 分析電子郵件以顯示各資料庫 Data Guard 狀態。
        li 檢視P8-2(主)、P7-102(備份)及hb-114(副中心)內相關文字(log sequence及switchover status)狀態，如下圖。
        li 依 crontab 設定時間檢查後並送出電子郵件通知(桃園所 👉 每天 08:00 ~ 17:00 每小時檢查一次)。
        li 儀表板約每小時更新一次。
      b-img.w-100.shadow(src="~/assets/img/mb_dataguard.jpg", fluid, thumbnail)
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態超過6小時未更新
      div 🔴 表示有資料庫 Current Log Sequence 不一致
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 #[b-badge(:variant="currentLogNumber(item) > 0 ? 'primary' : 'warning'", pill) {{ currentLogNumber(item) }}]
      .mr-1 #[b-badge(:variant="switchoverText(item) !== 'ACTIVE' ? 'danger' : 'success'", pill) {{ switchoverText(item) }}]
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ dbHostName(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
    .truncate.text-muted.small {{ currentLogText(item) }} | SWITCHOVER STATUS: SESSIONS {{ switchoverText(item) }}
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
  name: 'LahMonitorBoardDataguard',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 Data Guard',
    fetchType: 'subject',
    fetchKeyword: 'DataGuard',
    fetchDay: 1
  }),
  computed: {
    checkDataguardSh () {
      return '/assets/sh/check-dataguard.sh'
    },
    checkDataguardSQL () {
      return '/assets/sh/check-dataguard.sql'
    },
    checkDataguardSopPdf () {
      return '/assets/doc/AIX_6.1_Oracle_DataGuard_Crontab_SOP.pdf'
    },
    headMessages () {
      // collect records within 6 hrs
      const now = +new Date()
      // message array order is descending by timestamp
      const heads = this.messages
        // retrive message within a day
        .filter((item, idx, arr) => now - item.timestamp * 1000 < 24 * 60 * 60 * 1000)
        // remove duplicated items (only keeps the latest one)
        .filter((value, index, self) => index === self.findIndex(t => t.subject === value.subject))
      this.pushBrokenData(heads, 'P8-2')
      this.pushBrokenData(heads, 'P7-102')
      this.pushBrokenData(heads, 'hb-114')
      return heads
    },
    light () {
      // find main DB record
      const p8 = this.headMessages.find(item => item.subject?.includes('P8-2'))
      const criteria = this.currentLogText(p8)
      let ans = this.headMessages.every((item, index, array) => {
        return criteria === this.currentLogText(item)
      })
      if (ans) {
        ans = this.headMessages.every((item, index, array) => {
          return this.switchoverText(item) === 'ACTIVE'
        })
      }
      this.lightChanged(ans ? 'success' : 'danger', 'warning', 'LahMonitorBoardDataguard')
      return ans ? 'success' : 'danger'
    }
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
  },
  methods: {
    dbHostName (item) {
      const code = item.subject?.replace(' DataGuard STATE', '')?.toUpperCase()
      switch (code) {
        case 'P8-2':
          return '主要 (局端 P8-2)'
        case 'P7-102':
          return '備份 (所端 P7-102)'
        case 'HB-114':
          return '備援 (副中心 HB-114)'
      }
      return code
    },
    logSeqMatches (item) {
      const regex = /Current\s+log\s+sequence\s+(\d+)/gm
      return [...item.message.matchAll(regex)]
    },
    switchoverText (item) {
      const regex = /SESSIONS\s+([A-Z]+)/gm
      const arr = [...item.message.matchAll(regex)]
      /**
       * arr[0]:
       * 0: "SESSIONS ACTIVE"
       * 1: "ACTIVE"
       */
      if (this.$utils.empty(arr)) {
        return 'BROKEN'
      }
      return arr[0][1]
    },
    currentLogText (item) {
      const arr = this.logSeqMatches(item)
      /**
       * arr[0]:
       *   0: "Current log sequence\t       54357"
       *   1: "54357"
       */
      if (this.$utils.empty(arr)) {
        return 'Current log sequence\t       0'
      }
      return arr[0][0]
    },
    currentLogNumber (item) {
      const arr = this.logSeqMatches(item)
      /**
       * arr[0]:
       *   0: "Current log sequence\t       54357"
       *   1: "54357"
       */
      if (this.$utils.empty(arr)) {
        return '0'
      }
      return arr[0][1]
    },
    pushBrokenData (messages, subject) {
      // normal/uppercase string comparing ==> resolve hb-114/HB-114 issue
      if (
        !messages.find(item => item.subject?.includes(subject)) &&
        !messages.find(item => item.subject?.includes(subject?.toUpperCase()))
      ) {
        // push dummy data for the missing part
        messages.push({
          id: -1,
          mailbox: 'INBOX',
          message: `${subject} Data Guard is broken`,
          receiver: '',
          sender: 'pyliu@lah.host',
          subject: `${subject} DataGuard STATE`,
          timestamp: (+new Date()) / 1000
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
