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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
      ul
        li 顯示 VM 備份狀態 (包含平日與週末排程)
        li 儀表板每 15 分鐘自動重新檢查一次
      hr
      .font-weight-bold.text-info.mb-2 💡 外層標題燈號
      div 🟢 <strong>正常</strong>：只要信箱內有收到監控信件，外層即保持綠燈。
      div 🟡 <strong>警告</strong>：{{ fetchDay }} 日內完全無任何相關資料。
      div.mb-3 🔴 <strong>異常</strong>：未發現監控郵件（觸發防呆機制，代表腳本可能未執行）。

      .font-weight-bold.text-info.mb-2 📋 單筆紀錄狀態標示
      div 👉🏻 點擊紀錄內容可開啟詳細記錄視窗
      div 🟢 表示該筆紀錄一切正常。
      div.mt-1 🟡
        b-badge.mx-1(variant="warning") ❌ 發現失敗訊息
        | ：信件主旨或內容包含異常關鍵字。
      .text-muted.small.ml-4.mb-1 (目前監控關鍵字：{{ failKeywords.join(', ') }})
      div.mb-2 🔴
        b-badge.mx-1(variant="danger") ⏱️ 逾時未更新
        | ：超過容許時間未收到最新備份確認信件。
      hr
      div 🕒 <strong>⏱️ 逾時未更新判定標準：</strong>
      .text-muted.small.mb-2 已考量備份任務最高需 2 天執行，依據「今天」是星期幾，自動動態調整允許的最長未更新天數：
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
            td 允許 {{ rule.vc7 }} 天
      .mt-2.text-muted.small * 註：判定基準採用「日曆天數」計算，忽略具體的時分秒。容許天數已內建「備份執行期(最長2天) + 緩衝期(1天)」，在死線之前會自動放寬限制避免誤判。

  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages", :key="item.id || idx")
    .d-flex.justify-content-between.align-items-center.font-weight-bold
      //- 將燈號、標題、警告標籤包成一個群組，置左靠齊
      .d-flex.align-items-center(style="min-width: 0;")
        .mr-1 {{ subjectLight(item) }}
        a.truncate(
          href="#",
          @click="popupLogContent(item)",
          :class="subjectCss(item)"
          title="顯示詳細記錄"
        ) {{ item.subject }}
        //- 標籤移至標題右側，加入些微左邊距(ml-2)且不換行(text-nowrap)
        b-badge.ml-2.text-nowrap(v-if="analyzeMessageStatus(item).isTimeout" variant="danger") ⏱️ 逾時未更新
        //- 將原本的 danger 改為 warning
        b-badge.ml-2.text-nowrap(v-if="analyzeMessageStatus(item).isFailed" variant="warning") ❌ 發現失敗訊息

      //- 時間保持靠右顯示
      lah-badge-human-datetime.ml-2.text-nowrap(
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
    fetchConvert: false,
    dummyMessage: '未發現監控郵件，請確認備份腳本有正常執行完畢！',

    // 定義判定為「失敗」的關鍵字，可依據實際 Email 內容擴充
    failKeywords: ['失敗', 'fail', 'error', '異常'],

    // 重構後的矩陣：基於 (死線日期 - 最早完成日期) + 1 天緩衝，完美包容 2 天的備份執行期
    scheduleRules: [
      { day: 0, label: '週日', vc135: 5, vc24: 4, vc7: 9 },
      { day: 1, label: '週一', vc135: 4, vc24: 5, vc7: 10 },
      { day: 2, label: '週二', vc135: 5, vc24: 6, vc7: 4 },
      { day: 3, label: '週三', vc135: 6, vc24: 7, vc7: 5 },
      { day: 4, label: '週四', vc135: 4, vc24: 8, vc7: 6 },
      { day: 5, label: '週五', vc135: 5, vc24: 4, vc7: 7 },
      { day: 6, label: '週六', vc135: 4, vc24: 5, vc7: 8 }
    ]
  }),
  computed: {
    vc135Message () { return this.findVMCloneMessage({ keyword: 'vm-clone-135', subject: '平日(一三五)' }) },
    vc24Message () { return this.findVMCloneMessage({ keyword: 'vm-clone-24', subject: '平日(二四)' }) },
    vc7Message () { return this.findVMCloneMessage({ keyword: 'vm-clone-7', subject: '周末(六)' }) },

    headMessages () {
      // 依據原始代碼，目前僅顯示 24 與 7。若後續要加入 135，可在此解開註解
      return [this.vc24Message, this.vc7Message].filter(item => item)
    },

    // 【修改點】調整最外層燈號判定邏輯
    light () {
      // 情況1：完全沒有解析到任何信件資料
      if (this.headMessages.length === 0) {
        this.lightChanged('warning', '無資料', 'LahMonitorBoardVmclone')
        return 'warning'
      }

      // 情況2：需求「只要不是沒收到信就不要變色」
      // 判定「沒收到信」的標準：存在 dummyMessage (找不到監控郵件而自動塞入的防呆內容)
      const isMissingMail = this.headMessages.some(item => item.message === this.dummyMessage)

      // 只有在「真的沒收到信」時，外層燈號才變為紅燈
      if (isMissingMail) {
        this.lightChanged('danger', '未發現監控郵件', 'LahMonitorBoardVmclone')
        return 'danger'
      }

      // 情況3：只要有收到信 (非 dummyMessage)，無論內部是否分析為「失敗」或「逾時」，外層一律維持綠燈不變色。
      // (內部的 b-badge 依然會依照 analyzeMessageStatus 的結果顯示詳細警告)
      this.lightChanged('success', '', 'LahMonitorBoardVmclone')
      return 'success'
    }
  },
  methods: {
    /**
     * 新增：取得兩個時間戳之間的「日曆天數」差異 (忽略具體小時與分鐘)
     */
    getCalendarDaysDiff (timestamp) {
      const now = new Date()
      // 今天的 00:00:00
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      // 信件的 00:00:00
      const itemDate = new Date(timestamp * 1000)
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())

      return Math.floor((todayDate - itemDateOnly) / DAY_MS)
    },
    /**
     * 核心邏輯重構：分析單筆訊息的狀態 (兩階段驗證)
     * @param {Object} item 訊息物件
     * @returns {Object} { isTimeout: boolean, isFailed: boolean, isOk: boolean }
     */
    analyzeMessageStatus (item) {
      const status = { isTimeout: false, isFailed: false, isOk: true }

      if (!item) {
        status.isTimeout = true
        status.isOk = false
        return status
      }

      // --- Step 1: 確認是否逾時 (Time Check) ---
      // 情況 A: 找不到信件產生的防呆物件
      if (item.message === this.dummyMessage) {
        status.isTimeout = true
        status.isOk = false
        return status
      }

      // 情況 B: 計算時間差是否超出排程允許值
      const today = new Date().getDay()
      const rule = this.scheduleRules.find(r => r.day === today)

      // 改用日曆天數計算，避免因為 96 小時又 50 分鐘大於 4 天的嚴格毫秒比較而誤判
      const diffDays = this.getCalendarDaysDiff(item.timestamp)

      // 移除原本需要排除 isSaturday 的判斷，因為新矩陣已經完美涵蓋時間軸
      if (item.subject?.includes('vm-clone-135') && diffDays > rule.vc135) {
        status.isTimeout = true
      } else if (item.subject?.includes('vm-clone-24') && diffDays > rule.vc24) {
        status.isTimeout = true
      } else if (item.subject?.includes('vm-clone-7') && diffDays > rule.vc7) {
        status.isTimeout = true
      }

      // 若已確認逾期，直接返回 (優先級最高)
      if (status.isTimeout) {
        status.isOk = false
        return status
      }

      // --- Step 2: 確認內容是否失敗 (Content Check) ---
      // 將主旨與內容轉小寫，方便與關鍵字比對
      const contentStr = `${item.subject} ${item.message}`.toLowerCase()

      // 使用 lodash 的話也可以，但原生 some 已經很夠用
      const hasFailedKeyword = this.failKeywords.some(keyword => contentStr.includes(keyword.toLowerCase()))

      if (hasFailedKeyword) {
        status.isFailed = true
        status.isOk = false
        return status
      }

      // 都沒問題，返回 isOk: true
      return status
    },

    // 依賴分析結果，決定 Emoji
    subjectLight (item) {
      const status = this.analyzeMessageStatus(item)
      if (status.isTimeout) { return '🔴' } // 改為紅燈
      if (status.isFailed) { return '🟡' }
      return '🟢'
    },

    // 依賴分析結果，決定標題顏色
    subjectCss (item) {
      const status = this.analyzeMessageStatus(item)
      if (status.isTimeout) { return ['text-danger'] } // 改為 danger class
      if (status.isFailed) { return ['text-warning'] }
      return []
    },

    findVMCloneMessage (payload) {
      const { keyword, subject } = payload
      const found = this.messages.find(item => item.subject.includes(keyword))
      return found || this.vcDummyMessage({ subject, message: this.dummyMessage })
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
