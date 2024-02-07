<template lang="pug">
b-card(:border-variant="borderVariant")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }} - {{ ip }}:{{ port }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="logs.length > 0",
        icon="up-right-from-square",
        size="sm",
        @click="popLogs",
        no-border,
        no-icon-gutter,
        title="顯示最近10筆傳送紀錄"
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
        li 從伺服器端 .env 檔案讀取 MONITOR_HOST_L05 設定為監控標的 (目前為 {{ ip }}:{{ port }})
        li 被監控的伺服器需安裝「智慧監控應用程式介面」以提供分析資料
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
      @end="checkL05Status",
      @click="checkL05Status"
    )
    lah-button(
      v-if="files.length > 0",
      variant="warning",
      @click="popFiles"
    ) ⚠ 尚有 {{ files.length }} 筆資料待傳送
    .font-weight-bold(v-else) {{ statusMessage }}
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

  .center.h4(v-if="light === 'danger'") {{ message }}
  b-list-group.small(v-else, flush)
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="server", variant="secondary", title="局端伺服器資訊") 局伺服器：{{ bureauSyncIp }}:{{ bureauSyncPort }}
        lah-fa-icon(icon="stopwatch", variant="secondary", title="回應時間") {{ lastPingTime }}
    b-list-group-item(
      v-if="logs.length > 0",
      button,
      @click="popLogs",
      :title="lastSyncTimeRaw"
    )
      .d-flex.justify-content-between
        lah-fa-icon(icon="envelope-open-text", variant="secondary") 最新狀態：{{ lastSyncMessage }}
        lah-fa-icon(icon="clock", variant="secondary") {{ lastSyncTime }}
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="folder-open", variant="secondary") 同步資料夾：{{ syncDir }}
        lah-fa-icon(icon="arrows-rotate", variant="secondary") 同步間隔：{{ syncPeriod }}
    b-list-group-item(v-if="perf.pid")
      .d-flex.justify-content-between
        lah-fa-icon(icon="terminal", variant="dark") 運作程式：{{ perf.proc }}
        lah-fa-icon(icon="gears", variant="dark") 行程代碼: {{ perf.pid }}

  b-modal(
    ref="logs",
    size="lg",
    :title="`${header} - 最近 ${logs.length} 筆紀錄`",
    hide-footer
  )
    b-table(
      :items="logs",
      :fields="logFields",
      :busy="isBusy",
      head-variant="dark",
      striped,
      hover,
      bordered,
      selectable
    )
      template(#cell(FinDate)="{ item }") {{ $utils.addDateDivider(item.FinDate, 'AD') }}
      template(#cell(FinTime)="{ item }") {{ $utils.addTimeDivider(item.FinTime,) }}
  b-modal(
    ref="files",
    :title="`${header} - ${syncDir}`",
    pill,
    hide-footer
  )
    b-list-group.small(flush)
      b-list-group-item(v-for="(file, idx) in files", :key="idx") {{ file }}
</template>

<script>
export default {
  name: 'LahMonitorBoardL05',
  emit: ['light-update'],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '建物圖籍同步異動',
    reloadMs: 5 * 60 * 1000,
    reloadTimer: null,
    updatedTime: '',
    statusData: null,
    logFields: [
      { key: 'FinDate', label: '日期', sortable: true },
      { key: 'FinTime', label: '時間', sortable: true },
      { key: 'QryContent', label: '內容', sortable: true },
      { key: 'QryResult', label: '結果', sortable: true }
    ]
  }),
  computed: {
    ip () {
      return this.$config.monitor.host.L05.ip
    },
    port () {
      return this.$config.monitor.host.L05.port
    },
    L05APIUrl () {
      // return `http://${this.ip}:${this.port}/api/v1/l05`
      return '/l05proxy/api/v1/l05'
    },
    message () {
      return this.statusData?.message || '🟡 尚未取得狀態更新資料'
    },
    statusMessage () {
      // API response code translation
      const statusCode = parseInt(this.statusData?.statusCode)
      switch (statusCode) {
        case 1: return '檢測正常'
        case 0: return '檢測失敗'
        case -1: return '認證失敗'
        case -2: return '找不到'
        case -3: return '重複'
        case -4: return '過期'
        case -5: return '沒有實作'
        case -6: return '沒有變更'
        case -7: return '未支援'
        case -8: return '不存在'
        case -9: return '沒有在執行'
        case -10: return '沒有資料庫'
        case -11: return '同步失敗'
        case -12: return '無法連線'
        default: return `❌ 無法取得 ${this.L05APIUrl} 狀態資料`
      }
    },
    files () {
      return this.statusData?.payload?.files || []
    },
    logs () {
      return this.statusData?.payload?.logs || []
    },
    perf () {
      return this.statusData?.payload?.loading || {}
    },
    syncDir () {
      return this.statusData?.payload?.ini?.localSyncPath || ''
    },
    syncPeriod () {
      // in minutes
      if (this.statusData?.payload?.ini?.syncPeriod) {
        const mins = parseInt(this.statusData?.payload?.ini?.syncPeriod)
        return `${mins > 60 ? (mins / 60).toFixed(1) + '時' : `${mins}分`}`
      }
      return ''
    },
    lastPingTime () {
      return `${parseFloat(this.statusData?.payload?.ping).toFixed(1)}毫秒` || '無回應'
    },
    bureauSyncIp () {
      return this.statusData?.payload?.ini?.bureauSyncIp || ''
    },
    bureauSyncPort () {
      return this.statusData?.payload?.ini?.bureauSyncPort || ''
    },
    lastSyncTime () {
      if (this.logs.length > 0) {
        // should like "20230217 093943"
        const str = `${this.logs[0].FinDate} ${this.logs[0].FinTime}`
        const ts = this.$utils.adDateToTs(str)
        return this.$utils.formatDistanceToNow(ts)
      }
      return ''
    },
    lastSyncTimeRaw () {
      if (this.logs.length > 0) {
        // should like "2023-02-17 09:39:43"
        return `${this.$utils.addDateDivider(this.logs[0].FinDate, true)} ${this.$utils.addTimeDivider(this.logs[0].FinTime)}`
      }
      return ''
    },
    lastSyncMessage () {
      if (this.logs.length > 0) {
        return this.logs[0].QryResult
      }
      return ''
    },
    light () {
      // XHR data not ready OR having pending files treats as warning state
      if (this.statusData === null || this.files.length > 0) {
        return 'warning'
      }
      if (this.$utils.statusCheck(this.statusData?.statusCode)) {
        return 'success'
      }
      return 'danger'
    },
    borderVariant () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    }
  },
  watch: {
    statusData (val) {
      // if (val) {
      //   console.warn(val)
      // }
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    this.checkL05Status()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    this.emitLightUpdate('', this.light)
  },
  methods: {
    checkL05Status () {
      clearTimeout(this.reloadTimer)
      this.statusData = null
      this.isBusy = true
      this.$axios
        .get(this.L05APIUrl)
        .then(({ data }) => {
          this.statusData = { ...data }
        })
        .catch((err) => {
          this.error = err
          this.statusData = {
            ...{
              statusCode: -1,
              message: `❌ 無法取得 ${this.L05APIUrl} 狀態資料`,
              payload: {
                logs: [],
                ini: {},
                loading: {},
                ping: '',
                files: []
              }
            }
          }
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          // reload every 15s
          this.timeout(this.checkL05Status, this.reloadMs).then((handler) => { this.reloadTimer = handler })
          this.isBusy = false
          this.$refs.countdown?.setCountdown(this.reloadMs)
          this.$refs.countdown?.startCountdown()
        })
    },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardL05',
        new: n,
        old: o
      })
    },
    popLogs () {
      this.$refs.logs?.show()
    },
    popFiles () {
      this.$refs.files?.show()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
