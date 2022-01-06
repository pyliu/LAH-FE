<template lang="pug">
b-card(no-body)
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }}
    b-button-group(size="sm")
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload(true)",
        title="重新讀取"
      )
      lah-button(
        :icon="type === 'bar' ? 'chart-line' : 'chart-bar'",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="type = type === 'bar' ? 'line' : 'bar'",
        title="切換圖形"
      )
      lah-button(
        v-if="!maximized",
        icon="window-maximize",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        regular,
        @click="popupMaximize",
        title="放大顯示"
      )
      lah-button(
        v-if="!maximized",
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 監控說明`")
      ul
        li 顯示偵測系統連線狀態
        li 目前須修改 connectivity.db 來新增或修改欲監控標的
        li 15分鐘更新資料一次(效能考量)，但可透過 #[lah-fa-icon(icon="sync-alt", variant="secondary")] 更新最新資料
      hr
      h5 #[lah-fa-icon(icon="palette") 顏色說明]
      div #[lah-fa-icon(icon="circle", style="color: rgb(177, 221, 150)")] 綠色 - PING值小於等於20ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - PING值小於等於40ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - PING值小於等於80ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(204, 0, 204)")] 紫色 - PING值小於等於160ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(51, 51, 51)")] 黑色 - PING值161ms以上
  //- b-carousel(
  //- )
  .center.my-5(v-if="loadItems.length === 0") ⚠ 無監控標的資料
  lah-chart(
    v-show="loadItems.length > 0",
    ref="chart",
    :type="type"
    :backgroundColor="backgroundColor"
  )

  template(#footer, v-if="loadItems.length > 0"): .d-flex.justify-content-between.small
    span
      lah-fa-icon(icon="server" :style="`color: ${colorCode}`")
      span {{ loadItems.length }} 個監控系統
    lah-fa-icon.text-muted(icon="clock", reqular) {{ updatedTime }}
</template>

<script>
export default {
  name: 'LahMonitorBoardConnectivity',
  props: {
    maximized: { type: Boolean, default: false }
  },
  data: () => ({
    header: '系統連線狀態監控',
    type: 'bar',
    reloadTimer: null,
    updatedTime: '',
    datasetIdx: 0,
    loadItems: [],
    lightCriteria: {
      blalck: 160,
      purple: 80,
      red: 40,
      yellow: 20,
      green: 0
    }
  }),
  computed: {
    light () {
      if (this.loadItems.find(item => item.y > this.lightCriteria.black)) { return 'danger' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.purple)) { return 'danger' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.red)) { return 'danger' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.yellow)) { return 'warning' }
      return 'success'
    },
    colorCode () {
      if (this.loadItems.find(item => item.y > this.lightCriteria.black)) { return 'rgba(51, 51, 51, 0.6)' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.purple)) { return 'rgba(204, 0, 204, 0.6)' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.red)) { return 'rgba(220, 53, 29, 0.6)' }
      if (this.loadItems.find(item => item.y > this.lightCriteria.yellow)) { return 'rgba(255, 193, 7, 0.6)' }
      return 'rgba(40, 167, 69, 0.6)'
    }
  },
  watch: {
    type (dontcare) { this._reload() }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this._reload = this.$utils.debounce(this.reload, 500)
  },
  mounted () {
    this.loadWatchTarget()
    // this.loadAPConnectionCount()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
  },
  methods: {
    loadWatchTarget () {
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_connectivity_target'
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // initializing monitor list entries from DB
            this.loadItems = []
            // raw is array of { 'AP31': {ip: 'xxx.xxx.xxx.31', name: 'AP31', port: '', note: 'XXX'} }
            for (const [name, rawObj] of Object.entries(data.raw)) {
              this.loadItems.push({
                ip: rawObj.ip,
                status: 'DOWN',
                timestamp: '20201005181631',
                x: name,
                y: 0.0 // latency
              })
            }
            // build the chart skeleton from loaded targets
            this.datasetIdx = this.$refs.chart?.addDataset(this.loadItems, '回應時間(ms)', 'bar')
            // add a bit delay to make the chart build successfully
            this.timeout(() => this.$refs.chart?.build(), 100)
          } else {
            this.warning(data.message, { title: '讀取監測目標' })
          }
        })
        .catch((err) => {
          this.$utils.error('讀取監測目標失敗', err)
          this.alert(err.toString(), { title: '讀取監測目標失敗' })
        })
        .finally(() => {
          this.reload()
        })
    },
    popupMaximize () {
      this.modal(
        this.$createElement('LahMonitorBoardConnectivity', {
          props: {
            maximized: true
          }
        }),
        {
          title: '系統連線狀態監控',
          size: 'xl'
        }
      )
    },
    backgroundColor (item, opacity = 0.6) {
      if (item.y > this.lightCriteria.black) { return `rgba(51, 51, 51, ${opacity})` }
      if (item.y > this.lightCriteria.purple) { return `rgba(204, 0, 204, ${opacity})` }
      if (item.y > this.lightCriteria.red) { return `rgba(220, 53, 29, ${opacity})` }
      if (item.y > this.lightCriteria.yellow) { return `rgba(255, 193, 7, ${opacity})` }
      return `rgba(40, 167, 69, ${opacity})`
    },
    reload (force = false) {
      clearTimeout(this.reloadTimer)
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_connectivity_history',
          force,
          timeout: this.loadItems.length * 1000 + 3000 // maximum number of timeout in milliseconds
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // array of { target_ip: 'xxx.xxx.xxx.xxx', latency: 2000.0, status: 'DOWN', log_time: '20201005181631' }
            data.raw.forEach((item) => {
              const found = this.loadItems.find((oitem, idx, array) => {
                return oitem.ip === item.target_ip
              })
              if (found) {
                // the dataset item format is ['text', 123]
                found.y = item.latency
                found.status = item.status
                found.timestamp = item.log_time
                this.$refs.chart?.updateData(found, this.datasetIdx)
              } else {
                this.$utils.warn(`找不到 ${item.target_ip} 資料。`)
              }
            })
            // line chart fill color sync
            if (this.type === 'line' && this.loadItems.length > 0) {
              this.$refs.chart?.setLineFillColor(this.datasetIdx, this.colorCode)
            }
          } else {
            this.warning(data.message, { title: '同步異動主機狀態檢視' })
          }
        })
        .catch((err) => {
          this.$utils.error('讀取連線資料失敗', err)
          this.alert(err.toString(), { title: '讀取連線資料失敗' })
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          this.timeout(() => this.reload(), 15 * 60 * 1000).then((handler) => { this.reloadTimer = handler })
        })
    },
    _reload () { /* placeholder for debouncing reload method */ }
  }
}
</script>

<style lang="scss" scoped>
</style>
