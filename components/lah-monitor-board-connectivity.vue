<template lang="pug">
b-card(
  ref="card",
  no-body,
  :border-variant="borderVariant",
  :class="[attentionCss]"
)
  template(#header): .d-flex.justify-content-between.align-items-center
    lah-fa-icon.mr-auto(icon="circle", :variant="light")
    strong.truncate(:title="header") {{ header }}
    b-button-group(size="sm")
      lah-button(
        v-if="site",
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
        @click="toggleChartType",
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
        v-if="isAdmin",
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
      div #[lah-fa-icon(icon="circle", style="color: rgb(177, 221, 150)")] 綠色 - PING值小於等於 {{ lightCriteria.yellow }}ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - PING值小於等於 {{ lightCriteria.red }}ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - PING值小於等於 {{ lightCriteria.purple }}ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(204, 0, 204)")] 紫色 - PING值小於等於 {{ lightCriteria.black }}ms
      div #[lah-fa-icon(icon="circle", style="color: rgb(51, 51, 51)")] 黑色 - PING值 {{ lightCriteria.black + 1 }}ms以上

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
    :opacity="0.6"
    @click="popupNote"
    :tooltip-title-callback="titleTooltip",
    :tooltip-label-callback="labelTooltip",
    :legend="false"
  )

  template(#footer, v-if="loadItems.length > 0")
    .d-flex.justify-content-between.align-items-center.mb-2.small
      span
        lah-fa-icon(icon="server" :style="`color: ${colorCode}`")
        span.ml-1 {{ loadItems.length }} 個監控系統
      b-form-radio-group(
        v-model="sortBy",
        :options="sortByOpts",
        size="sm",
        button-variant="outline-secondary",
        buttons
      )

    lah-monitor-board-footer(
      :reload-ms="15 * 60 * 1000",
      :busy="isBusy",
      :update-time="updatedTime",
      @fetch="reloadConn(false)",
      @reload="reloadConn(true)"
    )
</template>

<script>
import LahMonitorBoardConnectivitySetup from '~/components/lah-monitor-board-connectivity-setup.vue';
import LahMonitorBoardFooter from '~/components/lah-monitor-board-footer.vue';

export default {
  name: 'LahMonitorBoardConnectivity',
  components: {
    LahMonitorBoardConnectivitySetup,
    LahMonitorBoardFooter
  },
  props: {
    maximized: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    header: '系統連線狀態監控',
    type: 'bar',
    updatedTime: '',
    datasetIdx: 0,
    loadItems: [],
    lightCriteria: {
      black: 160,
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
    srmasMap: new Map([
      ['HA', '220.1.34.251'],
      ['HB', '220.1.35.95'],
      ['HC', '220.1.36.16'],
      ['HD', '220.1.37.93'],
      ['HE', '220.1.38.127'],
      ['HF', '220.1.39.126'],
      ['HG', '220.1.40.76'],
      ['HH', '220.1.41.64']
    ]),
    isBusy: false
  }),
  computed: {
    isAdmin () {
      return this.authority && this.authority.isAdmin
    },
    srmasWeatherUrl () {
      if (!this.site || !this.srmasMap.has(this.site)) { return '#' }
      return `http://${this.srmasMap.get(this.site)}/plugins/Weathermap/output/${this.site}.html`
    },
    worstItem () {
      const criticalLevels = ['black', 'purple', 'red', 'yellow']
      for (const level of criticalLevels) {
        const threshold = this.lightCriteria[level]
        const found = this.loadItems.find(item => item.y > threshold)
        if (found) { return { level, item: found } }
      }
      return { level: 'green', item: null }
    },
    light () {
      const map = {
        black: 'danger',
        purple: 'danger',
        red: 'danger',
        yellow: 'warning',
        green: 'success'
      }
      return map[this.worstItem.level]
    },
    colorCode () {
      const map = {
        black: 'rgba(51, 51, 51, 0.6)',
        purple: 'rgba(204, 0, 204, 0.6)',
        red: 'rgba(220, 53, 29, 0.6)',
        yellow: 'rgba(255, 193, 7, 0.6)',
        green: 'rgba(40, 167, 69, 0.6)'
      }
      return map[this.worstItem.level]
    },
    borderVariant () {
      return this.light !== 'success' ? this.light : ''
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.light === 'danger') { return 'scale-danger' }
        if (this.light === 'warning') { return 'scale-warning' }
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
      this.$emit('light-update', {
        name: 'LahMonitorBoardConnectivity',
        new: nlight,
        old: olight
      })
    }
  },
  async created () {
    this._reload = this.$utils.debounce(this.reloadConn, 500)
    this.sortBy = await this.getCache('lah-monitor-board-connectivity-sortby') || 'name'
    this.type = await this.getCache('lah-monitor-board-connectivity-type') || 'bar'
  },
  mounted () {
    this.loadWatchTarget()
  },
  methods: {
    toggleChartType () {
      this.type = this.type === 'bar' ? 'line' : 'bar'
    },
    sortItems (a, b) {
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
    },
    // 新增：根據 Latency 返回 lah-chart 支援的 RGB 格式對象
    getRGB (latency) {
      // 黑色
      if (latency > this.lightCriteria.black) { return { R: 51, G: 51, B: 51 } }
      // 紫色
      if (latency > this.lightCriteria.purple) { return { R: 204, G: 0, B: 204 } }
      // 紅色
      if (latency > this.lightCriteria.red) { return { R: 220, G: 53, B: 29 } }
      // 黃色
      if (latency > this.lightCriteria.yellow) { return { R: 255, G: 193, B: 7 } }
      // 綠色 (預設)
      return { R: 40, G: 167, B: 69 }
    },
    loadWatchTarget () {
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, { type: 'monitor_targets' })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.loadItems = []
            this.$refs.chart?.reset()

            data.raw.sort(this.sortItems).forEach((rawObj) => {
              this.loadItems.push({
                ip: rawObj.ip,
                port: rawObj.port,
                status: 'DOWN',
                timestamp: '',
                note: rawObj.note,
                x: ['ip', 'port'].includes(this.sortBy) ? `${rawObj.ip}:${rawObj.port}` : rawObj.name,
                y: 0.0,
                // 關鍵修改：初始化時就帶上顏色對象，讓 lah-chart 讀取
                color: this.getRGB(0)
              })
            })

            // addDataset 會自動讀取 item.color 並套用
            this.datasetIdx = this.$refs.chart?.addDataset(this.loadItems, '回應時間(ms)', this.type)

            // 由於直接透過數據驅動顏色，這裡不再需要手動 syncBarColors
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
        this.modal(this.$utils.convertMarkd(combined), {
          title: `${found.x} - 回應時間 ${found.y.toFixed(2)} ms`,
          html: true
        })
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
    reloadConn (force = false) {
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'monitor_targets_history',
          force,
          timeout: this.loadItems.length * 1000 + 3000
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            data.raw.forEach((item) => {
              const found = this.loadItems.find((oitem) => {
                const parts = item.target_ip.split(':')
                const ip = parts[0]
                if (item.target_ip.endsWith(':')) {
                  return oitem.ip === ip
                }
                const port = parseInt(parts[1])
                const oport = parseInt(oitem.port)
                return oitem.ip === ip && oport === port
              })

              if (found) {
                found.y = item.latency
                found.status = item.status
                found.timestamp = item.log_time
                // 關鍵修改：更新數值的同時，也更新顏色對象
                found.color = this.getRGB(item.latency)

                // lah-chart 的 updateData 支援讀取傳入的 color 並更新圖表
                this.$refs.chart?.updateData(found, this.datasetIdx)
              }
            })

            if (this.type === 'line' && this.loadItems.length > 0) {
              this.$refs.chart?.setLineFillColor(this.datasetIdx, this.colorCode)
            }
          } else {
            this.warning(data.message, { title: '同步異動主機狀態檢視' })
          }
        })
        .catch((err) => {
          this.$utils.error('讀取連線資料失敗', err)
          if (force) {
            this.alert(err.toString(), { title: '讀取連線資料失敗' })
          }
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          this.isBusy = false
        })
    },
    _reload () { /* debounced placeholder */ }
  }
}
</script>
