<template lang="pug">
b-card(:border-variant="borderVariant")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="logs.length > 0",
        icon="up-right-from-square",
        size="sm",
        @click="popLogs"
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
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

  .font-weight-bold.small {{ this.message }}
  lah-transition: b-list-group.small(v-if="!isBusy", flush)
    b-list-group-item
      lah-fa-icon(icon="clock", variant="primary") 最近同步時間：{{ this.lastSyncTime }}
    b-list-group-item(button)
      lah-fa-icon(icon="folder-open", variant="warning") 同步資料夾：{{ this.syncDir }}
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="terminal", variant="dark") 運作程式：{{ this.perf?.proc }}
        lah-fa-icon(icon="gears", variant="success") 行程代碼: {{ this.perf?.pid }}

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
    statusAPIUrl () {
      return `http://${this.ip}:${this.port}/api/v1/l05`
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
      return this.statusData?.payload?.path || ''
    },
    lastSyncTime () {
      if (this.logs.length > 0) {
        return this.$utils.addDateDivider(this.logs[0].FinDate, 'AD') + ' ' + this.$utils.addTimeDivider(this.logs[0].FinTime)
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
    },
    borderVariant () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    }
  },
  watch: {
    // statusData (val) {
    //   if (val) {
    //     console.warn(val)
    //   }
    // },
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
                path: '',
                loading: {}
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
