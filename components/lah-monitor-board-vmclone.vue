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
        li 顯示 VM 備份狀態 (包含平日與週末排程)
        li 儀表板每 15 分鐘自動重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容可開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示 {{ fetchDay }} 日內找不到任何 VM CLONE 訊息
      div 🔴 表示 VM 備份排程超過容許時間未更新，或收到失敗訊息
      hr
      div 🕒 <strong>紅燈判定容許時間 (超過即警告)：</strong>
      .text-muted.small.mb-2 依據「今天」是星期幾，各排程允許的最長未更新時間：
      table.table.table-sm.table-bordered.table-striped.text-center.small.mt-2
        thead.thead-light
          tr
            th 星期
            th 平日(一三五)排程
            th 平日(二四)排程
            th 週末排程
        tbody
          tr(v-for="rule in scheduleRules", :key="rule.day")
            th {{ rule.label }}
            td 允許 {{ rule.vc135 }} 天
            td 允許 {{ rule.vc24 }} 天
            td
              span.text-success(v-if="rule.day === 6") 當日豁免檢查
              span(v-else) 允許 {{ rule.vc7 }} 天半
      .mt-2.text-muted.small * 註：週末排程容許時間皆額外寬限 12 小時 (半天)。週六當天不檢查週末排程超時狀態。

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
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue';
import lahMonitorBoardBase from '~/mixins/lah-monitor-board-base';

// 宣告時間常數，消滅魔術數字
const DAY_MS = 24 * 60 * 60 * 1000
const HALF_DAY_MS = 12 * 60 * 60 * 1000

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
    fetchKeyword: 'VM 備份',
    fetchDay: 7,
    fetchConvert: false, // converting encoding or not during receiving messages
    dummyMessage: '未發現監控郵件，請確認備份腳本有正常執行完畢！',

    // 資料驅動：各個星期對應的各排程容許天數
    scheduleRules: [
      { day: 0, label: '週日', vc135: 1, vc24: 1, vc7: 1 },
      { day: 1, label: '週一', vc135: 3, vc24: 4, vc7: 2 },
      { day: 2, label: '週二', vc135: 1, vc24: 5, vc7: 3 },
      { day: 3, label: '週三', vc135: 2, vc24: 1, vc7: 4 },
      { day: 4, label: '週四', vc135: 1, vc24: 2, vc7: 5 },
      { day: 5, label: '週五', vc135: 2, vc24: 1, vc7: 6 },
      { day: 6, label: '週六', vc135: 1, vc24: 2, vc7: 7 } // UI顯示豁免，邏輯仍給予基礎計算天數
    ]
  }),
  computed: {
    vc135Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-135', subject: '平日(一三五)備份排程' })
    },
    vc24Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-24', subject: '平日(二四)備份排程' })
    },
    vc7Message () {
      return this.findVMCloneMessage({ keyword: 'vm-clone-7', subject: '週末備份排程' })
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
      // 找不到郵件時的防呆預設處理
      if (item.message === this.dummyMessage) {
        return ['text-danger']
      }

      const now = new Date()
      const today = now.getDay()
      // 從 data 取得對應今天的容許天數規則
      const rule = this.scheduleRules.find(r => r.day === today)

      // 轉換成毫秒
      const vc135Ms = rule.vc135 * DAY_MS
      const vc24Ms = rule.vc24 * DAY_MS
      const vc7Ms = rule.vc7 * DAY_MS

      const cssList = []
      // 計算距離上一封信經過了多少毫秒
      const diffMs = now.getTime() - (item.timestamp * 1000)

      if (
        item.subject?.includes('vm-clone-135') &&
        diffMs > vc135Ms
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject?.includes('vm-clone-24') &&
        diffMs > vc24Ms
      ) {
        cssList.push('text-danger')
      } else if (
        item.subject?.includes('vm-clone-7') &&
        !this.isSaturday &&
        diffMs > (vc7Ms + HALF_DAY_MS) // 週末排程額外容許半天
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
