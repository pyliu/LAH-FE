<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
      strong {{ header }} - {{ ip }}:{{ port }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="files.length > 0"
        icon="cloud-arrow-up",
        variant="warning",
        @click="popFiles",
        title="顯示待傳檔案列表"
      ) {{ files.length }} 筆待傳送
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
        li: .lah-flex.justify-content-start
          span 擷取最近
          b-input.mx-1(
            v-model="logLimit",
            type="number",
            min="10",
            style="width: 80px",
            size="sm",
            @change="checkL05StatusDebounced"
          )
          span 筆紀錄
        li: .lah-flex.justify-content-start
          span 相關LOG
          b-button-group
            lah-button(
              v-if="stdout.length > 0",
              icon="file-lines",
              size="sm",
              @click="popRuntimeLogs",
              no-border,
              no-icon-gutter,
              title="顯示最近執行期間輸出"
            )
            lah-button(
              v-if="stderr.length > 0",
              icon="circle-exclamation",
              size="sm",
              @click="popRuntimeErrorLogs",
              no-border,
              no-icon-gutter,
              variant="outline-danger",
              title="顯示最近執行期間錯誤"
            )
            lah-button(
              v-if="sqlnet.length > 0",
              icon="server",
              size="sm",
              @click="popRuntimeSqlnetLogs",
              no-border,
              no-icon-gutter,
              variant="outline-warning",
              title="顯示連線執行期間錯誤"
            )
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
    strong {{ message }}
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
        lah-fa-icon(icon="envelope-open-text", :variant="lastSyncMessage === '傳送成功' ? 'secondary' : 'danger'") 最新狀態：{{ lastSyncMessage }}
        lah-fa-icon(icon="clock", variant="secondary") {{ lastSyncTime }}
    b-list-group-item
      .d-flex.justify-content-between
        lah-fa-icon(icon="folder-open", variant="secondary") 同步資料夾：{{ syncDir }}
        lah-fa-icon(icon="arrows-rotate", variant="secondary") 同步間隔：{{ syncPeriod }}
    b-list-group-item(v-if="isRunning")
      .d-flex.justify-content-between
        lah-fa-icon(icon="terminal", variant="dark") 運作程式：{{ perf.pid ? perf.proc : '未發現' }}
        lah-fa-icon(
          icon="gears",
          variant="dark"
        ) 行程編號: {{ perf.pid || 'java' }}

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
      selectable,
      responsive
    )
      template(#cell(FinDate)="{ item }") {{ $utils.addDateDivider(item.FinDate, 'AD') }}
      template(#cell(FinTime)="{ item }") {{ $utils.addTimeDivider(item.FinTime,) }}
      template(#cell(QryContent)="{ item }")
        .mw-cell.truncate(:title="item.QryContent") {{ item.QryContent }}
      template(#cell(QryResult)="{ item }")
        span(:class="item.QryResult === '傳送成功' ? ['text-success'] : ['text-danger']") {{ item.QryResult }}
  b-modal(
    ref="files",
    :title="`待同步共 ${files.length} 筆  - ${syncDir}`",
    pill,
    hide-footer
  )
    b-list-group(flush): b-list-group-item.small(
      v-for="(stats, idx) in files",
      :key="`file_${idx}`"
    ): .d-flex.justify-content-between
      span {{ stats.name }}
      span {{ parseFloat(stats.size / 1024).toFixed(2) }} KB
      lah-badge-human-datetime(
        :seconds="stats.mtimeMs / 1000"
      )

  b-modal(
    ref="stdout",
    size="xl",
    :title="`${header} - 最後100行的執行紀錄 - stdout`",
    hide-footer
  )
    b-list-group(flush): b-list-group-item(
      v-for="(out, idx) in stdout",
      :key="`stdout_${idx}`"
    ) \#{{ idx }}： {{ out }}
  b-modal(
    ref="stderr",
    size="xl",
    :title="`${header} - 最後100行的執行期間錯誤紀錄 - stderr`",
    hide-footer
  )
    b-list-group(flush): b-list-group-item(
      v-for="(err, idx) in stderr",
      :key="`stderr_${idx}`"
    ) \#{{ idx }}： {{ err }}
  b-modal(
    ref="sqlnet",
    size="xl",
    :title="`${header} - 最後100行的SQLNET連線錯誤紀錄 - sqlnet`",
    hide-footer
  )
    b-list-group(flush): b-list-group-item(
      v-for="(sql, idx) in sqlnet",
      :key="`sqlnet_${idx}`"
    ) \#{{ idx }}： {{ sql }}
</template>

<script>
export default {
  name: 'LahMonitorBoardL05',
  emit: ['light-update'],
  props: {
    footer: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
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
    ],
    logLimit: 30
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
      return `/l05proxy/api/v1/l05?limit=${this.logLimit}`
    },
    isRunning () {
      if (parseInt(this.perf?.pid) > 0) {
        return true
      }
      return false
    },
    message () {
      const tmp = this.statusData?.message || '🟡 尚未取得狀態更新資料'
      if (tmp.includes('未偵測到同步程式')) {
        // skip l05 process existence message
        return ''
      }
      return tmp
    },
    statusMessage () {
      if (this.isBusy) {
        return '讀取中 ... '
      }
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
      return this.$utils.orderBy(this.statusData?.payload?.files || [], 'mtimeMs', 'desc')
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
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    light () {
      if (!this.$utils.statusCheck(this.statusData?.statusCode)) {
        return 'danger'
      }
      // XHR data not ready OR having pending files treats as warning state
      if (this.statusData === null || this.files.length > 0) {
        return 'warning'
      }
      if (this.site === 'HA' && !this.isRunning) {
        return 'warning'
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
    },
    stdout () {
      if (this.statusData) {
        return [...this.statusData?.payload?.runtimeLogs?.stdout].filter(line => !this.$utils.empty(line))
      }
      return []
    },
    stderr () {
      if (this.statusData) {
        return [...this.statusData?.payload?.runtimeLogs?.stderr].filter(line => !this.$utils.empty(line))
      }
      return []
    },
    sqlnet () {
      if (this.statusData) {
        return [...this.statusData?.payload?.runtimeLogs?.sqlnet].filter(line => !this.$utils.empty(line))
      }
      return []
    }
  },
  watch: {
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    },
    statusData (val) {
      // console.warn(val)
    },
    logLimit (val) {
      this.setCache('L05-Log-Limit', parseInt(val) || 30)
    }
  },
  async created () {
    this.checkL05StatusDebounced = this.$utils.debounce(this.checkL05Status, 600)
    this.logLimit = parseInt(await this.getCache('L05-Log-Limit')) || 30
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    this.checkL05StatusDebounced()
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
          // console.warn(this.statusData)
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
    popRuntimeLogs () {
      this.$refs.stdout?.show()
    },
    popRuntimeErrorLogs () {
      this.$refs.stderr?.show()
    },
    popRuntimeSqlnetLogs () {
      this.$refs.sqlnet?.show()
    },
    popFiles () {
      this.$refs.files?.show()
    }
  }
}
</script>

<style lang="scss" scoped>
.mw-cell {
  max-width: 420px;
}
</style>
