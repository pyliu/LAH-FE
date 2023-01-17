<template lang="pug">
b-card(:border-variant="borderVariant")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }}
    b-button-group.ml-auto(size="sm")
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
        li 5分鐘更新資料一次

  div {{ this.message }}
  div 同步資料夾：{{ this.syncDir }}
  div 程式名稱：{{ this.perf?.proc }}
  div 行程ID：{{ this.perf?.pid }}
  .d-flex.align-items-center
    .mr-1 最近 {{ this.logs.length }} 筆紀錄
    lah-button(
      v-if="this.logs.length > 0",
      size="sm",
      @click="popLogs"
    ) 顯示詳情
  b-modal(
    ref="logs",
    :title="`${header} - 最近 ${logs.length} 筆紀錄`",
    hide-footer
  )
    div(v-for="row in logs") {{ row.QryContent }} {{ row.QryResult }}
  template(#footer): .d-flex.justify-content-end.small
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

</template>

<script>
export default {
  name: 'LahMonitorBoardL05',
  emit: ['light-update'],
  data: () => ({
    header: '建物圖籍同步異動',
    reloadTimer: null,
    updatedTime: '',
    statusData: null
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
      return this.statusData?.payload?.path || '未取得同步資料夾資訊'
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
    statusData (val) {
      if (val) {
        console.warn(val)
      }
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {
    this.checkL05Status()
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    this.emitLightUpdate('', this.light)
  },
  methods: {
    checkL05Status () {
      clearTimeout(this.reloadTimer)
      this.statusData = null
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
          this.timeout(this.checkL05Status, 5 * 60 * 1000).then((handler) => { this.reloadTimer = handler })
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
