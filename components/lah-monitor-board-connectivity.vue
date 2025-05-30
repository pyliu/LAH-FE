<template lang="pug">
b-card(ref="card", no-body, :border-variant="borderVariant", :class="[attentionCss]")
  template(#header): .d-flex
    lah-fa-icon.mr-auto(icon="circle", :variant="light"): strong {{ header }}
    b-button-group(size="sm")
      lah-button(
        icon="cloud-sun",
        :href="srmasWeatherUrl",
        target="_blank",
        no-border,
        no-icon-gutter,
        title="開啟新視窗顯示SRMAS天氣圖"
      ) 天氣圖
      lah-button(
        :icon="type === 'bar' ? 'chart-line' : 'chart-bar'",
        variant="outline-info",
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
        v-if="authority.isAdmin",
        icon="cog",
        action="cycle",
        variant="outline-dark",
        no-border,
        no-icon-gutter,
        @click="$refs.setup.show()",
        title="設定"
      )
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reloadConn(true)",
        title="重新讀取"
      )
      lah-button(
        v-if="!maximized",
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
        li 顯示偵測系統連線狀態
        li 請按 #[lah-fa-icon(icon="cog", variant="dark")]來新增或修改欲監控標的
        li 依照IP位址來排序
        li 15分鐘更新資料一次(效能考量)，但可透過 #[lah-fa-icon(icon="sync-alt", variant="secondary")] 更新最新資料
      hr
      h5 #[lah-fa-icon(icon="palette") 顏色說明]
      div #[lah-fa-icon(icon="circle", style="color: rgb(177, 221, 150)")] 綠色 - PING值小於等於20ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - PING值小於等於40ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - PING值小於等於80ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(204, 0, 204)")] 紫色 - PING值小於等於160ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(51, 51, 51)")] 黑色 - PING值161ms以上
    b-modal(
      ref="setup",
      size="xl",
      title="系統連線狀態標的設定",
      hide-footer
    )
      lah-monitor-board-connectivity-setup(@update="onSetupUpdate")

  .center.my-5(v-if="loadItems.length === 0") ⚠ 無監控標的資料
  lah-chart(
    v-show="loadItems.length > 0",
    ref="chart",
    :type="type"
    :backgroundColor="backgroundColor",
    @click="popupNote"
    :tooltip-title-callback="titleTooltip",
    :tooltip-label-callback="labelTooltip",
    :legend="false"
  )

  template(#footer, v-if="loadItems.length > 0"): .d-flex.justify-content-between.small
    span
      lah-fa-icon(icon="server" :style="`color: ${colorCode}`")
      span {{ loadItems.length }} 個監控系統
    b-form-radio-group(v-model="sortBy", :options="sortByOpts")
    lah-fa-icon.text-muted(icon="clock", reqular) {{ updatedTime }}
</template>

<script>
import LahMonitorBoardConnectivitySetup from '~/components/lah-monitor-board-connectivity-setup.vue'
export default {
  name: 'LahMonitorBoardConnectivity',
  emit: ['light-update'],
  components: { LahMonitorBoardConnectivitySetup },
  props: {
    maximized: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
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
    },
    sortBy: 'name',
    sortByOpts: [
      { text: '名稱', value: 'name' },
      { text: 'IP', value: 'ip' },
      { text: '埠號', value: 'port' }
    ],
    srmas: new Map([
      ['HA', '220.1.34.251'],
      ['HB', '220.1.35.95'],
      ['HC', '220.1.36.16'],
      ['HD', '220.1.37.93'],
      ['HE', '220.1.38.127'],
      ['HF', '220.1.39.126'],
      ['HG', '220.1.40.76'],
      ['HH', '220.1.41.64']
    ])
  }),
  computed: {
    srmasWeatherUrl () {
      return `http://${this.srmas.get(this.site)}/plugins/Weathermap/output/${this.site}.html`
    },
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
    },
    borderVariant () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
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
    type (val) {
      this.setCache('lah-monitor-board-connectivity-type', val)
      this._reload()
    },
    sortBy (val) {
      this.setCache('lah-monitor-board-connectivity-sortby', val)
      this.loadWatchTarget()
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  async created () {
    this._reload = this.$utils.debounce(this.reloadConn, 500)
    this.sortBy = await this.getCache('lah-monitor-board-connectivity-sortby') || 'name'
    this.type = await this.getCache('lah-monitor-board-connectivity-type') || 'bar'
  },
  mounted () {
    this.loadWatchTarget()
    // this.loadAPConnectionCount()
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    this.emitLightUpdate('', this.light)
  },
  methods: {
    loadWatchTarget () {
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'monitor_targets'
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // initializing monitor list entries from DB
            this.loadItems = []
            this.$refs.chart?.reset()
            // raw is array of { 'AP31': {ip: 'xxx.xxx.xxx.31', name: 'AP31', port: '', note: 'XXX'} }
            data.raw.sort((a, b) => {
              let aVal, bVal
              switch (this.sortBy) {
                case 'name':
                  aVal = a.name
                  bVal = b.name
                  break
                case 'port':
                  aVal = a.port
                  bVal = b.port
                  break
                default:
                  aVal = this.$utils.ipv4Int(a.ip)
                  bVal = this.$utils.ipv4Int(b.ip)
              }
              if (aVal > bVal) { return 1 }
              if (aVal < bVal) { return -1 }
              return 0
            }).forEach((rawObj) => {
              this.loadItems.push({
                ip: rawObj.ip,
                port: rawObj.port,
                status: 'DOWN',
                timestamp: '20201005181631',
                note: rawObj.note,
                x: ['ip', 'port'].includes(this.sortBy) ? `${rawObj.ip}:${rawObj.port}` : rawObj.name,
                y: 0.0 // latency
              })
            })
            // build the chart skeleton from loaded targets
            this.datasetIdx = this.$refs.chart?.addDataset(this.loadItems, '回應時間(ms)', this.type)
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
          this.reloadConn()
        })
    },
    titleTooltip (entry) {
      const item = entry[this.datasetIdx]
      return `${item.label}：${item.raw.toFixed(2)} ms`
    },
    labelTooltip (entry) {
      const found = this.loadItems.find(item => item.x === entry.label)
      if (found) {
        const combined = `${found.note}\nIP: ${found.ip}\n監測埠號: ${found.port}`
        return combined.split('\n')
        // this.modal(found.note.replaceAll('\n', '<br/>'), { title: `${found.x} - 回應時間 ${found.y.toFixed(2)} ms`, html: true })
      } else {
        const currentVal = entry.dataset.data[entry.dataIndex]
        return ` ${entry.label}：${currentVal}`
      }
    },
    onSetupUpdate (closeModal) {
      this.loadWatchTarget()
      closeModal && this.$refs.setup?.hide()
    },
    popupNote ({ detail }) {
      const found = this.loadItems.find(item => item.x === detail.label)
      if (found) {
        const combined = `${found.note}\nIP: ${found.ip}\n監測埠號: ${found.port}`
        this.modal(this.$utils.convertMarkd(combined), { title: `${found.x} - 回應時間 ${found.y.toFixed(2)} ms`, html: true })
      } else {
        this.$utils.warn('找不到監控項目', detail)
      }
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
    reloadConn (force = false) {
      clearTimeout(this.reloadTimer)
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'monitor_targets_history',
          force,
          timeout: this.loadItems.length * 1000 + 3000 // maximum number of timeout in milliseconds
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // array of { target_ip: 'xxx.xxx.xxx.xxx:xxxx', latency: 2000.0, status: 'DOWN', log_time: '20201005181631' }
            data.raw.forEach((item) => {
              const found = this.loadItems.find((oitem, idx, array) => {
                const parts = item.target_ip.split(':')
                const ip = parts[0]
                // no port, just compares with ip
                if (item.target_ip.endsWith(':')) {
                  return oitem.ip === ip
                }
                const port = parseInt(parts[1])
                const oport = parseInt(oitem.port)
                // this.$utils.warn(oitem.ip, ip, oport, port)
                return oitem.ip === ip && oport === port
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
          this.timeout(() => this.reloadConn(), 15 * 60 * 1000).then((handler) => { this.reloadTimer = handler })
          this.isBusy = false
        })
    },
    _reload () { /* placeholder for debouncing reload method */ },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardConnectivity',
        new: n,
        old: o
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
