<template lang="pug">
b-modal(
  ref="modal"
  size="xl"
  hide-footer
  centered
  no-close-on-backdrop
  @shown="onModalShown"
  @hidden="onModalHidden"
)
  template(#modal-title)
    .d-flex.align-items-center.flex-wrap
      lah-fa-icon.mr-2(
        :icon="isOverdueMode ? 'exclamation-triangle' : 'hourglass-half'"
        :variant="isOverdueMode ? 'danger' : 'warning'"
      )
      span {{ modalTitle }}
      b-badge.ml-2(pill :variant="isOverdueMode ? 'danger' : 'warning'")
        | {{ totalCases }} 件 / {{ totalPeople }} 人
      small.text-muted.ml-2 點擊圖表人員可快速套用篩選

  .chart-modal-content
    .d-flex.justify-content-between.align-items-center.flex-wrap.mb-3
      b-button-group(size="sm")
        b-button(
          :variant="chartType === 'bar' ? 'primary' : 'outline-secondary'"
          title="切換為長條圖"
          @click="setChartType('bar')"
        )
          lah-fa-icon.mr-1(icon="chart-bar")
          | 長條圖
        b-button(
          :variant="chartType === 'pie' ? 'primary' : 'outline-secondary'"
          title="切換為圓餅圖"
          @click="setChartType('pie')"
        )
          lah-fa-icon.mr-1(icon="chart-pie")
          | 圓餅圖
        b-button(
          :variant="chartType === 'doughnut' ? 'primary' : 'outline-secondary'"
          title="切換為甜甜圈圖"
          @click="setChartType('doughnut')"
        )
          lah-fa-icon.mr-1(icon="circle-notch")
          | 甜甜圈
        b-button(
          :variant="chartType === 'line' ? 'primary' : 'outline-secondary'"
          title="切換為折線圖"
          @click="setChartType('line')"
        )
          lah-fa-icon.mr-1(icon="chart-line")
          | 折線圖
      .d-flex.align-items-center
        b-button(
          size="sm"
          variant="outline-success"
          title="下載當前圖檔為 PNG"
          :disabled="chartItems.length === 0"
          @click="downloadPNG"
        )
          lah-fa-icon.mr-1(icon="download")
          | 下載圖檔

    .chart-wrapper
      lah-chart(
        v-if="chartItems.length > 0"
        ref="chart"
        :type="chartType"
        :border-color="'#ffffff'"
        :label-font-size="labelFontSize"
        @click="handleChartClick"
      )
      .text-center.text-muted.my-5(v-else)
        lah-fa-icon(icon="chart-bar" size="2x")
        .mt-2 目前無符合條件之{{ isOverdueMode ? '逾期' : '即將逾期' }}案件
</template>

<script>
const PALETTE = [
  { R: 54, G: 162, B: 235 }, // Blue
  { R: 255, G: 99, B: 132 }, // Coral Red
  { R: 255, G: 159, B: 64 }, // Orange
  { R: 75, G: 192, B: 192 }, // Teal
  { R: 153, G: 102, B: 255 }, // Purple
  { R: 255, G: 205, B: 86 }, // Yellow
  { R: 40, G: 167, B: 69 }, // Green
  { R: 23, G: 162, B: 184 }, // Cyan
  { R: 232, G: 62, B: 140 }, // Pink
  { R: 111, G: 66, B: 193 }, // Indigo
  { R: 253, G: 126, B: 20 }, // Amber
  { R: 32, G: 201, B: 151 }, // Mint
  { R: 102, G: 16, B: 242 }, // Violet
  { R: 20, G: 110, B: 180 }, // Deep Blue
  { R: 214, G: 51, B: 132 }, // Rose
  { R: 108, G: 117, B: 125 } // Slate
]

export default {
  name: 'LahRegExpiryChartModal',
  props: {
    items: {
      type: Array,
      default: null
    }
  },
  data: () => ({
    chartType: 'bar',
    isVisible: false
  }),
  computed: {
    isOverdueMode () {
      return this.$store.getters['expiry/is_overdue_mode']
    },
    currentItems () {
      return this.items || this.$store.getters['expiry/list'] || []
    },
    reviewerStats () {
      const map = {}
      this.currentItems.forEach((item) => {
        const k = item?.初審人員
        if (!k) { return }
        map[k] = (map[k] || 0) + 1
      })
      return Object.keys(map)
        .map(key => ({
          key,
          name: this.prettyReviewer(key),
          count: map[key]
        }))
        .sort((a, b) => b.count - a.count)
    },
    chartItems () {
      return this.reviewerStats.map((r, i) => ({
        x: r.name,
        y: r.count,
        color: PALETTE[i % PALETTE.length]
      }))
    },
    reviewerKeyMap () {
      const map = {}
      this.reviewerStats.forEach((r) => {
        map[r.name] = r.key
        map[r.key] = r.key
      })
      return map
    },
    totalCases () {
      return this.reviewerStats.reduce((sum, r) => sum + r.count, 0)
    },
    totalPeople () {
      return this.reviewerStats.length
    },
    legendTitle () {
      return `${this.isOverdueMode ? '已逾期' : '即將逾期'}案件統計 (${this.totalPeople} 人，共 ${this.totalCases} 件)`
    },
    modalTitle () {
      return `${this.isOverdueMode ? '已逾期' : '即將逾期'}案件初審人員統計圖表`
    },
    labelFontSize () {
      return this.reviewerStats.length > 12 ? 11 : 13
    }
  },
  watch: {
    currentItems () {
      if (this.isVisible) {
        this.$nextTick(this.buildChart)
      }
    }
  },
  methods: {
    show () {
      this.$refs.modal?.show()
    },
    hide () {
      this.$refs.modal?.hide()
    },
    onModalShown () {
      this.isVisible = true
      this.$nextTick(() => {
        this.buildChart()
      })
    },
    onModalHidden () {
      this.isVisible = false
    },
    prettyReviewer (key) {
      if (!key) { return '' }
      const parts = key.split(/\s+/).filter(Boolean)
      if (parts.length < 2) { return key }
      const idIdx = parts.findIndex(p => /^[A-Za-z]{1,3}\d+$/.test(p))
      if (idIdx < 0) { return parts.join(' ') }
      const id = parts[idIdx]
      const name = parts.filter((p, i) => i !== idIdx).join(' ')
      return `${name} (${id})`
    },
    setChartType (type) {
      if (this.chartType !== type) {
        this.chartType = type
        this.$nextTick(() => {
          this.buildChart()
        })
      }
    },
    buildChart () {
      if (!this.isVisible || this.chartItems.length === 0) {
        return
      }
      const chart = this.$refs.chart
      if (chart) {
        chart.reset()
        chart.addDataset(this.chartItems, this.legendTitle, this.chartType)
        chart.build()
      } else {
        this.$nextTick(() => {
          this.timeout(this.buildChart, 150)
        })
      }
    },
    handleChartClick (evt) {
      const detail = evt?.detail || evt || {}
      const label = detail.label
      if (!label) { return }
      const originalKey = this.reviewerKeyMap[label] || label
      this.hide()
      this.$emit('filter', { key: 'casePreliminator', value: originalKey })
      this.notify(`已套用初審人員篩選：${label}`, {
        title: '統計圖表篩選',
        type: 'info'
      })
    },
    downloadPNG () {
      const chart = this.$refs.chart
      if (chart) {
        const today = this.$utils.today('TW').replace(/[-/]+/g, '')
        const filename = `${this.isOverdueMode ? '已逾期' : '即將逾期'}案件初審人員統計_${today}_${this.chartType}.png`
        chart.downloadBase64PNG(filename)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-wrapper {
  position: relative;
  min-height: 400px;
}
</style>
