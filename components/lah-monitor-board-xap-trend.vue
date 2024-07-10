<template lang="pug">
b-card(no-body, :border-variant="borderVariant", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light"): strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="_load",
        title="重新讀取"
      )
      lah-button(
        :icon="chartType === 'bar' ? 'chart-line' : 'chart-bar'",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="chartType = chartType === 'bar' ? 'line' : 'bar'",
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
        li 顯示指定所跨域AP連線數趨勢圖 (⭐ AP需安裝#[a(href="/send_netstats.sh") 回報腳本] ⭐)
        li #[lah-fa-icon(icon="clock", variant="primary")] 調整顯示時段區間
        li #[lah-fa-icon(icon="clock", regular, variant="secondary")] 顯示資料更新時間
        li {{ reloadTime }} 秒更新資料一次資料
      hr
      h5 #[lah-fa-icon(icon="palette") 顏色說明]
      div #[lah-fa-icon(icon="circle", style="color: rgb(40, 167, 69)")] 綠色 - 連線數 0 ~ 100
      div #[lah-fa-icon(icon="circle", style="color: rgb(255, 193, 7)")] 黃色 - 連線數 101 ~ 200
      div #[lah-fa-icon(icon="circle", style="color: rgb(220, 53, 29)")] 紅色 - 連線數 201 以上
  lah-chart(ref="chart", :type="chartType")

  template(#footer): .d-flex.justify-content-between.small
    .d-flex
      lah-fa-icon.my-auto.mr-1(icon="clock", variant="primary")
      b-select.m-n1(v-model="loadMins", :options="loadMinsOpts", size="sm", style="max-width: 100px")
    lah-fa-icon.text-muted(icon="clock", reqular, title="更新時間") {{ updatedTime }}
</template>

<script>
export default {
  name: 'LahMonitorBoardXapTrend',
  emit: ['light-update'],
  props: {
    maximized: { type: Boolean, default: false },
    office: { type: String, default: '桃園所' },
    mins: { type: Number, default: 15 },
    type: { type: String, default: 'line' },
    rightmost: { type: Boolean, default: true },
    watchTopXap: { type: Boolean, default: false },
    reloadTime: { type: Number, default: 60 }
  },
  data: () => ({
    header: '',
    watchOffice: '',
    chartType: 'line',
    reloadTimer: null,
    updatedTime: '',
    loadMins: 15,
    loadMinsOpts: [
      { value: 15, text: '15分鐘' },
      { value: 30, text: '30分鐘' },
      { value: 60, text: '1小時' },
      { value: 90, text: '1.5小時' },
      { value: 120, text: '2小時' },
      { value: 240, text: '4小時' },
      { value: 360, text: '6小時' },
      { value: 480, text: '8小時' }
    ],
    loadItems: [],
    datasetIdx: 0,
    lightCriteria: {
      red: 200,
      yellow: 100,
      green: 0
    }
  }),
  computed: {
    nowItem () {
      return this.rightmost
        ? this.loadItems[this.loadItems.length - 1]
        : this.loadItems[0]
    },
    light () {
      if (this.nowItem) {
        if (this.nowItem.y > this.lightCriteria.red) {
          return 'danger'
        }
        if (this.nowItem.y > this.lightCriteria.yellow) {
          return 'warning'
        }
      }
      return 'success'
    },
    borderVariant () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    attentionCss () {
      if (this.light === 'danger') {
        return 'scale-danger'
      }
      if (this.light === 'warning') {
        return 'scale-warning'
      }
      return ''
    },
    apIp () {
      // xapMap from store
      const xaps = [...this.xapMap]
      // item: ['220.1.XX.XX', { name: 'XXX', code: 'XX', ip: '220.1.XX.XX' }]
      const found = xaps.find(item => item[1].name === this.watchOffice)
      return found ? found[0] : ''
    }
  },
  watch: {
    rightmost (flag) {
      this.reset()
      this._load()
    },
    loadMins (val) {
      this.reset()
      this._load()
    },
    topXap (office) {
      if (this.watchTopXap) {
        this.watchOffice = office.x
        this.load()
      }
    },
    watchOffice (str) { this.header = `${str}跨域AP連線趨勢圖 - ${this.apIp}` },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {
    this.modalId = this.$utils?.uuid()
    this.chartType = this.type
    this.loadMins = this.mins
    this.watchOffice = this.office
    this._load = this.$utils?.debounce(this.load, 100)
  },
  mounted () {
    this.load(true)
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    this.emitLightUpdate('', this.light)
  },
  methods: {
    popupMaximize () {
      this.modal(
        this.$createElement('LahMonitorBoardXapTrend', {
          props: { maximized: true }
        }),
        {
          title: '跨域AP連線趨勢',
          size: 'xl'
        }
      )
    },
    toTime (ts) {
      const dateObj = new Date(ts)
      return `${('0' + dateObj.getHours()).slice(-2)}:${(
        '0' + dateObj.getMinutes()
      ).slice(-2)}`
    },
    labelNeedUpdate () {
      const length = this.loadItems.length
      if (length > 0) {
        const now = this.toTime(+new Date())
        if (this.rightmost) {
          return now !== this.loadItems[length - 1].x
        } else {
          return now !== this.loadItems[0].x
        }
      }
      return true
    },
    reset () {
      this.loadItems.length = 0
      const now = +new Date()
      for (let i = 0; i < this.loadMins; i++) {
        const item = { x: '', y: 0, color: { R: 164, G: 236, B: 119 } }
        if (this.rightmost) {
          item.x = this.toTime(now - (this.loadMins - i - 1) * 60 * 1000)
        } else {
          item.x = this.toTime(now - i * 60 * 1000)
        }
        this.loadItems.push(item)
      }
      this.$refs.chart?.reset()
      this.datasetIdx = this.$refs.chart?.addDataset(
        this.loadItems,
        '連線數',
        this.chartType
      )
      // a bit delay for building chart
      this.timeout(() => this.$refs.chart?.build(), 50)
    },
    backgroundColor (val) {
      if (val > this.lightCriteria.red) {
        return { R: 220, G: 53, B: 29 }
      }
      if (val > this.lightCriteria.yellow) {
        return { R: 255, G: 193, B: 7 }
      }
      return { R: 40, G: 167, B: 69 }
    },
    _load () { /* placeholder for load method debounced */ },
    load () {
      this.loadItems.length === 0 && this.reset()
      // update label
      if (this.labelNeedUpdate() && this.loadItems.length > 0) {
        const now = +new Date()
        for (let i = 0; i < this.loadMins; i++) {
          const item = this.loadItems[i]
          if (this.rightmost) {
            item.x = this.toTime(now - (this.loadMins - i - 1) * 60 * 1000)
          } else {
            item.x = this.toTime(now - i * 60 * 1000)
          }
        }
        this.$refs.chart.setLabels(this.loadItems.map(item => item.x))
      }

      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_ap_conn_history',
          ap_ip: this.apIp,
          count: parseInt(this.loadMins)
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            if (data.data_count === 0) {
              this.warning('無資料，無法繪製圖形', {
                title: this.header,
                subtitle: this.watchOffice
              })
            } else {
              // display now to the chart right bound
              const mRaw = this.rightmost ? data.raw.reverse() : data.raw
              mRaw.forEach((item, rawIdx, raw) => {
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
                this.loadItems[rawIdx].y = item.count
                this.loadItems[rawIdx].color = this.backgroundColor(item.count)
                this.$refs.chart?.updateData(
                  this.loadItems[rawIdx],
                  this.datasetIdx
                )
              })
              if (this.chartType === 'line' && this.loadItems.length > 0) {
                const item = this.rightmost ? this.loadItems[this.loadItems.length - 1] : this.loadItems[0]
                const fillColor = `rgba(${item.color.R}, ${item.color.G}, ${item.color.B}, 0.6)`
                this.$refs.chart.setLineFillColor(this.datasetIdx, fillColor)
              }
            }
          } else {
            this.warning(
              `取得跨所 AP ${this.watchOffice} ${this.apIp} 連線資料失敗。狀態碼：${data.status}`,
              {
                title: `跨所 AP ${this.watchOffice} ${this.apIp} 連線趨勢圖`
              }
            )
          }
        })
        .catch((err) => {
          this.$utils.error('讀取AP連線歷史紀錄失敗', err)
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
          clearTimeout(this.reloadTimer)
          this.timeout(() => this.load(), this.reloadTime * 1000).then((handler) => { this.reloadTimer = handler })
        })
    },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardXapTrend',
        new: n,
        old: o
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
