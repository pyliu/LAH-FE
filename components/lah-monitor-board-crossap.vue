<template lang="pug">
b-card(no-body)
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }} ({{ totalCount }})
    b-button-group.ml-auto(size="sm")
      lah-button(
        :icon="bar ? 'chart-line' : 'chart-bar'",
        no-border,
        no-icon-gutter,
        @click="bar = !bar",
        title="圖型切換"
      )
      lah-button(
        v-if="!maximized"
        icon="window-maximize",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        regular,
        @click="popupMaximize",
        title="放大顯示"
      )
      lah-button(
        v-if="!maximized"
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
        li 顯示跨域AP連線狀態(AP需安裝回報腳本以更新快取資料庫)
        li 每15秒更新資料一次狀態
  lah-chart(ref="chart", :type="chartType")
</template>

<script>
export default {
  props: {
    maximized: { type: Boolean, default: false }
  },
  data: () => ({
    header: '跨域AP連線狀態',
    bar: true,
    reloadTimer: null,
    loadItems: [],
    chartDatasetIdx: 0,
    initItems: [
      { x: '桃園所', y: 0, color: { R: 254, G: 185, B: 180 } },
      { x: '中壢所', y: 0, color: { R: 125, G: 199, B: 80 } },
      { x: '大溪所', y: 0, color: { R: 255, G: 251, B: 185 } },
      { x: '楊梅所', y: 0, color: { R: 0, G: 157, B: 122 } },
      { x: '蘆竹所', y: 0, color: { R: 33, G: 137, B: 227 } },
      { x: '八德所', y: 0, color: { R: 181, G: 92, B: 66 } },
      { x: '平鎮所', y: 0, color: { R: 195, G: 42, B: 84 } },
      { x: '龜山所', y: 0, color: { R: 136, G: 72, B: 152 } },
      { x: '地政局', y: 0, color: { R: 207, G: 207, B: 207 } }
    ],
    crossApMap: new Map([
      ['220.1.33.71', { name: '地政局', code: 'H0', ip: '220.1.33.71' }],
      ['220.1.34.161', { name: '桃園所', code: 'HA', ip: '220.1.34.161' }],
      ['220.1.35.123', { name: '中壢所', code: 'HB', ip: '220.1.35.123' }],
      ['220.1.36.45', { name: '大溪所', code: 'HC', ip: '220.1.36.45' }],
      ['220.1.37.246', { name: '楊梅所', code: 'HD', ip: '220.1.37.246' }],
      ['220.1.38.30', { name: '蘆竹所', code: 'HE', ip: '220.1.38.30' }],
      ['220.1.39.57', { name: '八德所', code: 'HF', ip: '220.1.39.57' }],
      ['220.1.40.33', { name: '平鎮所', code: 'HG', ip: '220.1.40.33' }],
      ['220.1.41.20', { name: '龜山所', code: 'HH', ip: '220.1.41.20' }]
    ])
  }),
  computed: {
    crossAPIp () {
      const found = [...this.crossApMap].find(arr => arr[1].code === this.site)
      return found[0]
    },
    chartType () { return this.bar ? 'bar' : 'line' },
    totalCount () { return this.loadItems.reduce((acc, item) => acc + item[1], 0) },
    light () {
      if (this.totalCount > 500) { return 'danger' }
      if (this.totalCount > 300) { return 'warning' }
      return 'success'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    this.chartDatasetIdx = this.$refs.chart?.addDataset(this.initItems, '連線數', this.chartType)
    this.$refs.chart?.build()
    this.loadAPConnectionCount()
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
  },
  methods: {
    popupMaximize () {
      this.modal(this.$createElement('lah-monitor-board-crossap', { props: { maximized: true } }), {
        title: '跨域AP監控',
        size: 'xl'
      })
    },
    loadAPConnectionCount () {
      clearTimeout(this.reloadTimer)
      this.loadItems.length = 0
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: this.crossAPIp,
          all: true
        })
        .then(({ data }) => {
          if (data.data_count && data.data_count > 0) {
            const tmp = new Map([
              ['地政局', 0],
              ['桃園所', 0],
              ['中壢所', 0],
              ['大溪所', 0],
              ['楊梅所', 0],
              ['蘆竹所', 0],
              ['八德所', 0],
              ['平鎮所', 0],
              ['龜山所', 0]
            ])
            data.raw.forEach((item, idx, array) => {
              /*
                  item = {
                      log_time: '20201005181631',
                      ap_ip: '220.1.34.161',
                      est_ip: '220.1.35.36',
                      count: '2',
                      batch: '490',
                      name: '資訊主機'
                  }
              */
              const text = this.crossApMap.get(item.est_ip)?.name
              const currentValue = tmp.get(text)
              if (currentValue !== undefined) {
                tmp.set(text, item.count + currentValue)
              } else {
                // this.$utils.warn('item.est_ip 不在 ipMap 內無法新增至 loadItems 裡', item)
              }
            })
            this.loadItems = [...tmp]
            this.loadItems.forEach((element) => {
              this.$refs.chart.updateData({ x: element[0], y: element[1] }, this.chartDatasetIdx)
            })
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          // reload every 15s
          this.reloadTimer = this.timeout(this.loadAPConnectionCount, 15 * 1000)
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
