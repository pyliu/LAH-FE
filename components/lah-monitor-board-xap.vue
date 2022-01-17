<template lang="pug">
b-card(no-body)
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }}
    b-button-group.ml-auto(size="sm")
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
        li 顯示跨域AP連線數統計狀態 (⭐ AP需安裝#[a(href="/send_netstats.sh") 回報腳本] ⭐)
        li #[lah-fa-icon(icon="database", variant="danger")] 顯示資料庫連線總數(超過3000會造成地政系統停擺)
        li #[lah-fa-icon(icon="wave-square", variant="success")] 顯示AP連線總數(數字越高有可能造成地政系統回應緩慢)
        li #[lah-fa-icon(icon="clock", regular)] 顯示資料更新時間
        li 15秒更新資料一次
  lah-chart(ref="chart", @click="popupTrending")

  template(#footer): .d-flex.justify-content-between.small
    lah-fa-icon(
      :variant="dbStyles[0]",
      :action="dbStyles[1]",
      :size="dbStyles[2]",
      :icon="dbStyles[3]"
    ) 資料庫 #[b-badge(:variant="dbStyles[0]", pill) {{ dbTotal }}]
    lah-fa-icon(
      :variant="apStyles[0]",
      :action="apStyles[1]",
      :size="apStyles[2]",
      :icon="apStyles[3]"
    ) 主機連線 #[b-badge(:variant="apStyles[0]", pill) {{ apTotal }}]
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}

</template>

<script>
import LahMonitorBoardXapTrend from '~/components/lah-monitor-board-xap-trend.vue'
export default {
  name: 'LahMonitorBoardXap',
  components: { LahMonitorBoardXapTrend },
  props: {
    maximized: { type: Boolean, default: false }
  },
  data: () => ({
    header: '跨域AP各所連線狀態',
    reloadTimer: null,
    updatedTime: '',
    loadItems: [],
    barDatasetIdx: 0,
    lineDatasetIdx: 1,
    dbTotal: 0,
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
    apTotal () { return this.loadItems.reduce((acc, item) => acc + item[1], 0) },
    light () {
      return this.apStyles[0]
    },
    dbStyles () {
      // return [color, action, size, icon]
      if (this.dbTotal > 2800) { return ['danger', 'tremble', '2x', 'bomb'] }
      if (this.dbTotal > 2200) { return ['danger', 'shiver', 'lg', 'database'] }
      if (this.dbTotal > 1800) { return ['warning', 'beat', '1x', 'database'] }
      return ['success', 'breath', 'sm', 'database']
    },
    apStyles () {
      // return [color, action, size, icon]
      if (this.apTotal > 1000) { return ['danger', 'tremble', '2x', 'bomb'] }
      if (this.apTotal > 750) { return ['danger', 'shiver', 'lg', 'server'] }
      if (this.apTotal > 500) { return ['warning', 'beat', '1x', 'server'] }
      return ['success', 'breath', 'sm', 'wave-square']
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    // let init chart process after mounted executed
    this.timeout(() => {
      this.barDatasetIdx = this.$refs.chart?.addDataset(this.initItems, '長條圖', 'bar')
      this.lineDatasetIdx = this.$refs.chart?.addDataset(this.initItems, '線型圖', 'line')
      this.$refs.chart?.build()
      this.loadAPConnectionCount()
    }, 0)
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
  },
  methods: {
    popupTrending ({ detail }) {
      /*
        label: "XX所"
        point: {element: BarElement, datasetIndex: 0, index: 5}
        value: 34
      */
      this.modal(this.$createElement('LahMonitorBoardXapTrend', {
        props: {
          maximized: true,
          office: detail.label,
          type: (+new Date() % 2 === 0) ? 'bar' : 'line',
          mins: 60
        }
      }), {
        title: `${detail.label}跨域AP連線趨勢`,
        size: 'xl'
      })
    },
    popupMaximize () {
      this.modal(this.$createElement('LahMonitorBoardXap', { props: { maximized: true } }), {
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
            let topOffice = { x: '', y: 0 }
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
              item.name === '資料庫' && (this.dbTotal = item.count)
              const text = this.crossApMap.get(item.est_ip)?.name
              const currentValue = tmp.get(text)
              if (currentValue !== undefined) {
                tmp.set(text, item.count + currentValue)
              } else {
                // this.$utils.warn('item.est_ip 不在 crossApMap 內無法新增至 loadItems 裡', item)
              }
            })
            this.loadItems = [...tmp]
            this.loadItems.forEach((element) => {
              const item = { x: element[0], y: element[1] }
              this.$refs.chart.updateData(item, this.barDatasetIdx)
              this.$refs.chart.updateData(item, this.lineDatasetIdx)
              if (topOffice.y < item.y) {
                topOffice = item
              }
            })
            this.$store.commit('topXap', topOffice)
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          // reload every 15s
          this.timeout(this.loadAPConnectionCount, 15 * 1000).then((handler) => { this.reloadTimer = handler })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
