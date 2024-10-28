<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
      strong {{ header }} - {{ ip }}:{{ port }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        icon="arrow-up-right-from-square",
        variant="outline-primary",
        no-border,
        title="打開查詢視窗",
        @click="popupSMSLogs(logs)",
        :disabled="isBusy"
      )
        span(v-if="isBusy") 讀取中
        span(v-else) 已發送{{ logs.length }}則
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

  .h6.text-danger(v-if="light !== 'success'") {{ message }}
  section(v-if="lastChunk")
    .d-flex
      strong 👉 最近掃描
      .mx-1 開始：{{ lastChunk.startTime }}
      strong 結束{{ lastChunk.endTime }}
    hr
    //- li(v-for="(chunk, idx) in recentChunks", v-if="idx !== 0").d-flex.justify-content-between
    //-   strong 前{{ idx }}次
    //-   strong 開始：{{ chunk.startTime }}
    //-   strong 結束{{ chunk.endTime }}
    .d-flex.justify-content-between(
      v-for="(log, idx) in lastestCellLogs",
      v-if="idx < 3"
    )
      span {{ $utils.addTimeDivider(log.SMS_TIME) }}
      b-link(
        @click="popupCase(log)",
        title="開啟案件詳細資料"
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
    edLines () {
      const raw = this.responseData?.payload?.raw || ''
      if (!this.$utils.empty(raw)) {
        return this.extractEndTimes(raw)
      }
      return []
    },
    chunks () {
      const raw = this.responseData?.payload?.raw || ''
      if (!this.$utils.empty(raw)) {
        return this.extractBatch(raw)
      }
      return []
    },
    chunksLength () {
      return this.chunks.length
    },
    lastChunk () {
      if (this.chunksLength > 0) {
        return this.chunks[this.chunksLength - 1]
      }
      return false
    },
    recentChunks () {
      if (this.chunksLength > 0) {
        if (this.chunksLength < 5) {
          return [...this.chunks].reverse()
        }
        return [
          this.chunks[this.chunksLength - 1],
          this.chunks[this.chunksLength - 2],
          this.chunks[this.chunksLength - 3],
          this.chunks[this.chunksLength - 4]
        ]
      }
      return false
    },
    lastestCellLogs () {
      return this.logs.filter(item => !this.$utils.empty(item.SMS_CELL))
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
      if (this.responseData === null) {
        return 'warning'
      }
      if (
        !this.$utils.statusCheck(this.responseData?.statusCode) ||
        this.stLines.length !== this.edLines.length
      ) {
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
    }
  },
  created () {
    this.checkSMSStatusDebounced = this.$utils.debounce(this.checkSMSStatus, 400)
    this.today = this.$utils.today('TW').replaceAll('-', '')
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    this.checkSMSStatusDebounced()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
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
    extractBatch (text) {
      // 定義正則表達式，匹配符合格式的區塊
      const regex = /確認案件!!開始時間:(\d{2}:\d{2}:\d{2})([\s\S]*?)確認案件!!結束時間:(\d{2}:\d{2}:\d{2})/g
      const matches = text.matchAll(regex)
      // 將匹配結果轉換為陣列
      const chunks = []
      for (const match of matches) {
        chunks.push({
          startTime: match[1].trim(),
          log: match[2].trim(),
          endTime: match[3].trim()
        })
      }
      return chunks
    },
    checkSMSStatus () {
      clearTimeout(this.reloadTimer)
      this.responseData = null
      this.isBusy = true
      this.$axios
        .post(this.SmsAPIUrl, {
          encoding: 'BIG5',
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
          this.updatedTime = this.$utils.now().split(' ')[1]
          // reload every 15s
          this.timeout(this.checkSMSStatus, this.reloadMs).then((handler) => { this.reloadTimer = handler })
          this.isBusy = false
          this.$refs.countdown?.setCountdown(this.reloadMs)
          this.$refs.countdown?.startCountdown()
          // also load logs
          this.loadLogs()
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
    popupSMSLogs (arr, displayMode = true) {
      if (!this.$utils.empty(arr) && Array.isArray(arr)) {
        this.modal(this.$createElement(lahAdmSmslogTableVue, {
          props: {
            inKeyword: this.today,
            inLogs: arr,
            displayMode
          }
        }), {
          title: '地籍異動即時通記錄檔查詢',
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
      this.modal(log.SMS_CONTENT)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
