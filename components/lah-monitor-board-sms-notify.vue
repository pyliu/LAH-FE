<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="circle", :variant="light")
    strong.truncate(:title="header") {{ header }} - {{ ip }}:{{ port }}
    b-button-group.ml-auto(size="sm")
      lah-button-count-badge(
        v-if="!isBusy && failedCellLogsLength > 0",
        :count="failedCellLogsLength",
        variant="danger",
        :title="`失敗${failedCellLogsLength}則`",
        @click="popupSMSLogs(failedCellLogs, '失敗部分')"
      ) 異動
      lah-button-count-badge(
        v-if="!isBusy && lastestChangedCount > 0",
        :count="lastestChangedCount",
        variant="primary",
        :title="`異動已發送${lastestChangedCount}則`",
        @click="popupSMSLogs(lastestChangedCellLogs, '僅異動部分')"
      ) 異動
      lah-button-count-badge(
        v-if="!isBusy && notificationLogs.length > 0",
        :count="notificationLogs.length",
        variant="success",
        :title="`全部已發送${notificationLogs.length}則`",
        @click="popupSMSLogs(notificationLogs, '全部')"
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
        li 從伺服器端 .env 檔案讀取 MONITOR_HOST_SMS_* 相關設定為監控標的 (目前為 {{ ip }}:{{ port }})
        li 被監控的SMS伺服器需安裝「智慧監控應用程式介面」以提供分析資料
        li 目前設定讀取 {{ logPath }}
        li 5分鐘更新資料一次
  template(#footer, v-if="footer"): client-only: .d-flex.align-items-center.justify-content-between.small
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
      @end="checkSMSStatus",
      @click="checkSMSStatus"
    )
    strong {{ $utils.today('TW') }}
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

  section
    .d-flex.justify-content-between(title="最新系統掃描時間")
      strong {{ scheduledTaskStatus }}
      strong 開始：{{ latestStLine }}
      strong 結束：{{ latestStLine > latestEdLine ? '尚未完成' : latestEdLine }}
    hr
    .center.h4(v-if="lastestChangedCount === 0") {{ $utils.today('TW') }} 尚未有異動通知案件
    .d-flex.justify-content-between(
      v-for="(log, idx) in lastestChangedCellLogs",
      v-if="idx < 3"
    )
      span {{ $utils.addTimeDivider(log.SMS_TIME) }}
      b-link(
        @click="isRegCaseId(log) ? popupCase(log) : popupLog(log)",
        :title="isRegCaseId(log) ? '開啟案件詳細資料' : '查看傳送簡訊內容'"
      ) {{ `${log.SMS_YEAR}-${log.SMS_CODE}-${log.SMS_NUMBER}` }}
      .d-flex
        b-link(
          @click="popupLog(log)",
          v-b-popover.hover.left="log.SMS_CONTENT"
        ) {{ log.SMS_CELL }}
        b-link.ml-1(
          :class="log.SMS_RESULT === 'S' ? ['text-success'] : ['text-danger']",
          :title="log.SMS_RESULT === 'S' ? '成功' : `失敗(${log.SMS_RESULT})`",
          @click="popupLog(log)"
        ) {{ log.SMS_RESULT === 'S' ? '✔' : '⚠' }}
    .d-flex.justify-content-end.mt-1
      lah-message.h6.mr-auto(
        auto-hide,
        :message="message"
      )
      b-link.small.font-weight-bold(
        v-if="lastestChangedCount > 3",
        @click="popupSMSLogs(lastestChangedCellLogs, '僅異動部分')",
        title="查看今日異動已發送列表"
      )
        lah-fa-icon(icon="ellipsis", action="wander-h") 更多
</template>

<script>
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue';
import lahRegCaseDetailVue from '~/components/lah-reg-case-detail.vue';
export default {
  name: 'LahMonitorBoardSmsNotify',
  emit: ['light-update'],
  components: { lahAdmSmslogTableVue, lahRegCaseDetailVue },
  props: {
    footer: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    header: '地籍異動即時通監控',
    reloadMs: 5 * 60 * 1000,
    reloadTimer: null,
    updatedTime: '',
    responseData: null,
    logs: [],
    today: ''
  }),
  computed: {
    ip () {
      return this.$config.monitor.host.SMS.ip
    },
    port () {
      return this.$config.monitor.host.SMS.port
    },
    exeDir () {
      return this.$config.monitor.host.SMS.dir
    },
    twToday () {
      const tmp = this.$utils.today('TW')
      return tmp.replaceAll('-', '')
    },
    SmsAPIUrl () {
      // return `/l05proxy/api/v1/l05?limit=${this.logLimit}`
      return '/smsproxy/api/v1/log'
    },
    ProcessAPIUrl () {
      // return `/l05proxy/api/v1/l05?limit=${this.logLimit}`
      return '/smsproxy/api/v1/processes'
    },
    logPath () {
      return `${this.exeDir}/${this.twToday}moniter_sms.log`
    },
    rawLog () {
      return this.$utils.convertMarkd(this.responseData?.payload?.raw || '')
    },
    stLines () {
      const raw = this.responseData?.payload?.raw || ''
      if (!this.$utils.empty(raw)) {
        return this.extractStartTimes(raw)
      }
      return []
    },
    latestStLine () {
      if (this.stLines?.length > 0) {
        return this.stLines[this.stLines?.length - 1]
      }
      return '未啟動'
    },
    edLines () {
      const raw = this.responseData?.payload?.raw || ''
      if (!this.$utils.empty(raw)) {
        return this.extractEndTimes(raw)
      }
      return []
    },
    latestEdLine () {
      if (this.edLines?.length > 0) {
        const last = this.edLines[this.edLines?.length - 1]
        if (this.latestStLine < last) {
          return last
        }
      }
      return '未完成'
    },
    scheduledTaskStatus () {
      if (this.$utils.empty(this.stLines)) {
        return '排程尚未啟動'
      }
      if (this.latestStLine !== '未啟動' && this.latestEdLine === '未完成') {
        return '🚧異動掃描進行中'
      }
      if (this.latestStLine < this.latestEdLine) {
        return '✅異動掃描已完成'
      }
      return '❌掃描作業異常'
    },
    notificationLogs () {
      return this.logs.filter(item => item.SMS_TYPE === '地籍異動即時通')
    },
    failedCellLogs () {
      return this.notificationLogs.filter(item => !this.$utils.empty(item.SMS_CELL) && item.SMS_CELL.startsWith('09') && item.SMS_RESULT === 'F')
    },
    failedCellLogsLength () {
      return this.failedCellLogs?.length || 0
    },
    top3LastestChangedCellLogs () {
      return this.lastestChangedCellLogs.slice(0, 3)
    },
    lastestChangedCellLogs () {
      return this.notificationLogs.filter(item => !this.$utils.empty(item.SMS_CELL) && item.SMS_CELL.startsWith('09') && !item.SMS_CODE.startsWith('SM'))
    },
    lastestChangedCount () {
      return this.lastestChangedCellLogs.length
    },
    message () {
      return this.responseData?.message || '🟡 尚未取得紀錄資料'
    },
    statusMessage () {
      if (this.isBusy) {
        return '讀取中 ... '
      }
      // API response code translation
      const statusCode = parseInt(this.responseData?.statusCode)
      switch (statusCode) {
        case 1: return '正常'
        case 0: return '讀取失敗'
        case -1: return '認證失敗'
        case -2: return `找不到 ${this.logPath}`
        // case -3: return '重複'
        // case -4: return '過期'
        // case -5: return '沒有實作'
        // case -6: return '沒有變更'
        // case -7: return '未支援'
        // case -8: return '不存在'
        // case -9: return '沒有在執行'
        // case -10: return '沒有資料庫'
        // case -11: return '同步失敗'
        // case -12: return '無法連線'
        default: return `❌ 未定義的狀態碼 ${statusCode}`
      }
    },
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    light () {
      // XHR data not ready treats as warning state
      if (this.responseData === null || this.stLines.length !== this.edLines.length) {
        // this.$utils.warn('st', this.stLines)
        // this.$utils.warn('ed', this.edLines)
        return 'warning'
      }
      if (!this.$utils.statusCheck(this.responseData?.statusCode)) {
        // this.$utils.warn('statusCode', this.responseData?.statusCode)
        return 'danger'
      }
      // any top 3 changed messages has FAIL state
      if (this.top3LastestChangedCellLogs.some(sms => sms.SMS_RESULT === 'F')) {
        // this.$utils.warn('top3', this.top3LastestChangedCellLogs)
        return 'danger'
      }
      return 'success'
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.light === 'danger') {
          return 'scale-danger'
        }
        if (this.light === 'warning') {
          return 'scale-warning'
        }
      }
      return ''
    }
  },
  watch: {
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
      if (nlight !== 'success') {
        this.reloadMs = 1 * 60 * 1000
      } else {
        this.reloadMs = 5 * 60 * 1000
      }
      this.resetTimer()
    },
    responseData (val) {
      this.$utils.warn('responseData', val)
    },
    logs (val) {
      this.$utils.warn(val.length, this.notificationLogs.length, this.lastestChangedCellLogs.length)
    }
  },
  created () {
    this.checkSMSStatusDebounced = this.$utils.debounce(this.checkSMSStatus, 400)
    this.today = this.$utils.today('TW').replaceAll('-', '')
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    this.checkSMSStatusDebounced()
    this.checkProcess()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    this.$refs.countdown?.resetCountdown()
    this.$refs.countdown?.pauseCountdown()
    this.emitLightUpdate('', this.light)
  },
  methods: {
    extractStartTimes (text) {
      const regex = /確認案件!!開始時間:(\d{2}:\d{2}:\d{2})/g
      const matches = text.match(regex)
      if (matches) {
        return matches.map(match => match.replace(regex, '$1'))
      }
      return []
    },
    extractEndTimes (text) {
      const regex = /確認案件!!結束時間:(\d{2}:\d{2}:\d{2})/g
      const matches = text.match(regex)
      if (matches) {
        return matches.map(match => match.replace(regex, '$1'))
      }
      return []
    },
    resetTimer () {
      clearTimeout(this.reloadTimer)
      // reload every 15s
      this.timeout(this.checkSMSStatus, this.reloadMs).then((handler) => { this.reloadTimer = handler })
      this.$refs.countdown?.setCountdown(this.reloadMs)
      this.$refs.countdown?.startCountdown()
    },
    checkSMSStatus () {
      clearTimeout(this.reloadTimer)
      this.responseData = null
      this.isBusy = true
      this.$axios
        .post(this.SmsAPIUrl, {
          encoding: 'CP950',
          path: this.logPath
        })
        .then(({ data }) => {
          this.responseData = { ...data }
        })
        .catch((err) => {
          this.error = err
          this.responseData = {
            ...{
              statusCode: -1,
              message: `❌ 無法取得 ${this.SmsAPIUrl} LOG資料`,
              payload: {
                raw: ''
              }
            }
          }
        })
        .finally(() => {
          this.isBusy = false
          this.updatedTime = this.$utils.now().split(' ')[1]
          this.resetTimer()
          // also load logs
          this.loadLogs()
        })
    },
    checkProcess () {
      this.$axios
        .get(this.ProcessAPIUrl)
        .then(({ data }) => {
          this.$utils.warn(data)
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
        })
    },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardSmsNotify',
        new: n,
        old: o
      })
    },
    loadLogs () {
      this.logs = []
      this.$axios
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moiadm_smslog_query_by_date',
          st: this.today,
          ed: this.today
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.logs = [...data.raw]
          } else {
            this.warning(data.message)
          }
        }).catch((err) => {
          this.error = err
        }).finally(() => {
        })
    },
    isRegCaseId (log) {
      return !log?.SMS_CODE?.startsWith('SM')
    },
    popupSMSLogs (arr, title) {
      if (!this.$utils.empty(arr) && Array.isArray(arr)) {
        this.modal(this.$createElement(lahAdmSmslogTableVue, {
          props: {
            inKeyword: this.today,
            inLogs: arr,
            displayMode: true
          }
        }), {
          title: `地籍異動即時通記錄檔查詢 - ${title}`,
          size: 'xl',
          noCloseOnBackdrop: false,
          centered: false,
          scrollable: false
        })
      }
    },
    popupCase (log) {
      const caseId = `${log.SMS_YEAR}-${log.SMS_CODE}-${log.SMS_NUMBER}`
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.warning(`⚠ 無法找到 ${this.$utils.caseId(caseId)} 登記案件資料。`)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(caseId)}`,
        size: 'xl'
      })
    },
    popupLog (log) {
      this.modal(log.SMS_CONTENT, {
        title: `簡訊內容 👉 ${log.SMS_CELL} ${log.SMS_RESULT === 'S' ? '成功 ✔' : '失敗 ⚠'}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
