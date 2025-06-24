<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
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
        li 從伺服器端 .env 檔案讀取 MONITOR_HOST_BANK 設定為監控標的 (目前為 {{ ip }}:{{ port }})
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
    .font-weight-bold {{ message }}
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

  lah-transition: b-list-group.small(v-if="!isBusy", flush)
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="server", :variant="light", title="局端伺服器資訊") 局伺服器：{{ this.bureauSyncIp }}:{{ this.bureauSyncPort }}
        lah-fa-icon(icon="stopwatch", :variant="light", title="回應時間") {{ this.lastPingTime }}
    b-list-group-item(button, @click="popLogs", :title="lastSyncTimeRaw")
      .d-flex.justify-content-between
        lah-fa-icon(icon="envelope-open-text", :variant="light") 最新狀態：{{ this.lastSyncMessage }}
        lah-fa-icon(icon="clock", variant="secondary") {{ this.lastSyncTime }}
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="folder-open", variant="secondary") 同步資料夾：{{ this.syncDir }}
        lah-fa-icon(icon="arrows-rotate", variant="secondary") 同步間隔：{{ this.syncPeriod }}
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="terminal", variant="dark") 運作程式：{{ this.perf?.proc }}
        lah-fa-icon(icon="gears", variant="dark") 行程代碼: {{ this.perf?.pid }}

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
</template>

<script>
export default {
  name: 'LahMonitorBoardBank',
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
    statusAPIUrl () {
      return `http://${this.ip}:${this.port}/api/v1/bank`
    },
    message () {
      return this.statusData?.message || '🟡 尚未取得狀態更新資料'
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
      if (this.statusData === null) {
        return 'warning'
      }
      if (this.$utils.statusCheck(this.statusData?.statusCode)) {
        return 'success'
      }
      return 'danger'
    }
  },
  watch: {
    statusData (val) {
      if (val) {
        console.warn(val)
      }
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
    this.$refs.countdown?.resetCountdown()
    this.$refs.countdown?.pauseCountdown()
    this.emitLightUpdate('', this.light)
  },
  methods: {
    checkL05Status () {
      clearTimeout(this.reloadTimer)
      this.statusData = null
      this.isBusy = true
      this.$axios
        .get(this.statusAPIUrl)
        .then(({ data }) => {
          this.statusData = { ...data }
        })
        .catch((err) => {
          this.error = err
          this.statusData = {
            ...{
              statusCode: -1,
              message: `❌ 無法取得 ${this.statusAPIUrl} 狀態資料`,
              payload: {
                logs: [],
                ini: {},
                loading: {},
                ping: ''
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
        name: 'LahMonitorBoardBank',
        new: n,
        old: o
      })
    },
    popLogs () {
      this.$refs.logs?.show()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
