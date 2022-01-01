<template lang="pug">
b-card.border-0(no-body): canvas(:id="id") 圖形初始化失敗
</template>

<script>
import Chart from 'chart.js/auto'
export default {
  props: {
    type: {
      type: String,
      default: 'bar'
    },
    legend: {
      type: Boolean,
      default: true
    },
    // label: {
    //   type: String,
    //   default: 'set label to override me'
    // },
    // items: {
    //   type: Array,
    //   default: () => [{
    //     x: 'X軸標籤', // xAxes
    //     y: 23, // yAxes
    //     color: { R: 22, G: 11, B: 45 }
    //   }]
    // },
    labelFontSize: {
      type: Number,
      default: 14
    },
    opacity: {
      type: Number,
      default: 0.6
    },
    tooltip: {
      type: Function,
      default (entry) {
        // add percent ratio to the label
        const sum = entry.dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
          return previousValue + currentValue
        })
        const currentVal = entry.dataset.data[entry.dataIndex]
        const percent = Math.round(((currentVal / sum) * 100))
        if (isNaN(percent)) { return ` ${entry.label} : ${currentVal}` }
        return ` ${entry.label} : ${currentVal} [${percent}%]`
      }
    },
    backgroundColor: {
      type: Function,
      default (item, opacity) {
        switch (item.x) {
          case '地政局':
            return `rgb(207, 207, 207, ${opacity})` // H0
          case '桃園所':
            return `rgb(254, 185, 180, ${opacity})` // HA
          case '中壢所':
            return `rgb(125, 199, 80, ${opacity})` // HB
          case '大溪所':
            return `rgb(255, 251, 185, ${opacity})` // HC
          case '楊梅所':
            return `rgb(0, 157, 122, ${opacity})` // HD
          case '蘆竹所':
            return `rgb(33, 137, 227, ${opacity})` // HE
          case '八德所':
            return `rgb(181, 92, 66, ${opacity})` // HF
          case '平鎮所':
            return `rgb(195, 42, 84, ${opacity})` // HG
          case '龜山所':
            return `rgb(136, 72, 152, ${opacity})` // HH
          default:
            return `rgb(${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${opacity})`
        }
      }
    },
    borderColor: {
      type: String,
      default: 'rgb(22, 22, 22)'
    },
    borderWidth: {
      type: Number,
      default: 1
    },
    yAxes: {
      type: Boolean,
      default: true
    },
    xAxes: {
      type: Boolean,
      default: true
    },
    beginAtZero: {
      type: Boolean,
      default: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    titlePos: {
      type: String,
      default: 'top'
    },
    titleFontSize: {
      type: Number,
      default: 14
    },
    aspectRatio: { type: Number, default: () => +Number.parseFloat(window.innerWidth / window.innerHeight).toFixed(2) }
  },
  data: () => ({
    id: null,
    inst: null,
    chartData: null,
    updateTimer: null
  }),
  computed: {
    calcAspectRatio () { return +Number.parseFloat(window.innerWidth / window.innerHeight).toFixed(2) }
  },
  watch: {
    type (val) {
      this.rebuild()
    }
  },
  created () {
    this.id = this.uuid()
    this.resetData()
  },
  methods: {
    update () {
      clearTimeout(this.updateTimer)
      this.updateTimer = this.timeout(() => this.inst && this.inst.update(), 100)
    },
    addData (item, label, datasetIdx = 0) {
      if (item.x !== undefined && item.y !== undefined) {
        this.initDataset(datasetIdx, label)
        const foundIdx = this.chartData.labels.indexOf(item.x)
        if (foundIdx === -1) {
          this.chartData.labels.push(item.x) // x is label
          this.chartData.datasets[datasetIdx].data.push(item.y) // y is data count
          this.addBackgroundColor(item, datasetIdx)
        } else {
          // increment the value if the label existed
          const orig = this.chartData.datasets[datasetIdx].data[foundIdx] || 0
          this.chartData.datasets[datasetIdx].data[foundIdx] = orig + item.y
          !this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] && this.addBackgroundColor(item, datasetIdx)
        }
      } else if (Array.isArray(item)) {
        this.initDataset(datasetIdx, label)
        // legacy use array
        const foundIdx = this.chartData.labels.indexOf(item[0])
        if (foundIdx === -1) {
          this.chartData.labels.push(item[0]) // first element is label
          this.chartData.datasets[datasetIdx].data.push(item[1]) // second element is data count
          this.chartData.datasets[datasetIdx].backgroundColor.push(this.backgroundColor({ x: item[0], y: item[1] }, this.opacity))
        } else {
          const orig = this.chartData.datasets[datasetIdx].data[foundIdx] || 0
          this.chartData.datasets[datasetIdx].data[foundIdx] = orig + item[1]
          if (!this.chartData.datasets[datasetIdx].backgroundColor[foundIdx]) {
            this.chartData.datasets[datasetIdx].backgroundColor.push(this.backgroundColor({ x: item[0], y: item[1] }, this.opacity))
          }
        }
      } else {
        this.$utils.warn('輸入資料不符合規格無法加入 chart data', item)
      }
    },
    addBackgroundColor (item, datasetIdx) {
      if (item.color !== undefined && item.color.R !== undefined && item.color.G !== undefined && item.color.B !== undefined) {
        this.chartData.datasets[datasetIdx].backgroundColor.push(`rgb(${item.color.R}, ${item.color.G}, ${item.color.B}, ${this.opacity})`)
      } else {
        // random color for this item
        this.chartData.datasets[datasetIdx].backgroundColor.push(this.backgroundColor(item, this.opacity))
      }
    },
    updateData (item, datasetIdx = 0) {
      const label = item.x
      const value = item.y
      const foundIdx = this.chartData.labels.indexOf(label)
      if (foundIdx !== -1) {
        this.chartData.datasets[datasetIdx].data[foundIdx] = value
        // also update background color as well
        this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] = this.backgroundColor(item, this.opacity)
        // redraw the chart
        this.$nextTick(this.update())
      } else {
        this.$utils.warn(`lah-chart: 沒找到 "${label}" 在 dataset 內, ${value} 不會被更新.`, this.chartData)
      }
    },
    resetData () {
      this.chartData = {
        labels: [],
        legend: { display: this.legend },
        datasets: []
      }
    },
    initDataset (idx, label) {
      if (!this.chartData.datasets[idx]) {
        this.chartData.datasets.push({
          label,
          backgroundColor: [],
          data: [],
          borderColor: this.borderColor,
          order: 1,
          opacity: this.opacity,
          snapGaps: true,
          borderWidth: this.borderWidth
        })
      }
    },
    importData (items, label) {
      const nextDatasetIdx = this.chartData.datasets.length
      items?.forEach(item => this.addData(item, label, nextDatasetIdx))
    },
    rebuild () { this.$nextTick(this.build) },
    build (opts = { plugins: {} }) {
      if (this.inst) {
        // reset the chart
        this.inst.destroy()
        this.inst = null
      }
      switch (this.type) {
        case 'pie':
        case 'polarArea':
        case 'doughnut':
          // put legend to the right for some chart type
          opts.plugins.legend = {
            display: this.legend,
            position: opts.legend_pos || 'right',
            labels: { font: { size: +this.labelFontSize } }
          }
          break
        case 'radar':
          break
        default:
          opts.scales = {
            yAxes: {
              display: this.yAxes,
              beginAtZero: this.beginAtZero
            },
            xAxes: {
              display: this.xAxes
            }
          }
      }
      // update title
      opts.plugins.title = {
        display: !this.$utils.empty(this.title),
        text: this.title,
        position: this.titlePos,
        font: { size: +this.titleFontSize }
      }
      // subtitle
      opts.plugins.subtitle = {
        display: !this.$utils.empty(this.subtitle),
        text: this.subtitle
      }
      // use chart.js directly
      const ctx = this.id
      const that = this
      this.inst = new Chart(ctx, {
        type: this.type,
        data: this.chartData,
        options: Object.assign({
          showTooltips: true,
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: that.aspectRatio,
          elements: {
            point: { pointStyle: 'circle', radius: 4, hoverRadius: 6, borderWidth: 1, hoverBorderWidth: 2 },
            line: { tension: this.type === 'line' ? 0.35 : 0.1, fill: true, stepped: false }
          },
          tooltips: {
            callbacks: {
              label: this.tooltip
            }
          },
          onClick (e) {
            const payload = {}
            /**
             * getElementAtEvent is replaced with chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
             * getElementsAtEvent is replaced with chart.getElementsAtEventForMode(e, 'index', { intersect: true }, false)
             * getElementsAtXAxis is replaced with chart.getElementsAtEventForMode(e, 'index', { intersect: false }, false)
             * getDatasetAtEvent is replaced with chart.getElementsAtEventForMode(e, 'dataset', { intersect: true }, false)
             */
            const element = that.inst.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
            if (!that.$utils.empty(element)) {
              payload.point = element[0]
              if (payload.point) {
                // point e.g. {element: e, datasetIndex: 0, index: 14}
                const idx = payload.point.index
                const datasetIdx = payload.point.datasetIndex // only one dataset, it should be always be 0
                payload.label = that.inst.data.labels[idx]
                payload.value = that.inst.data.datasets[datasetIdx].data[idx]
              }
              // parent uses a handle function to catch the event, e.g. catchClick(e) { const payload = e.detail; const target = e.target; ... }
              that.trigger('click', payload)
            }
          }
        }, opts)
      })
      // sometimes the chart doesn't show up properly ... so add this fix to update it
      this.$nextTick(this.update)
    },
    toBase64Image () {
      return this.inst.toBase64Image()
    },
    downloadBase64PNG (filename = 'download.png') {
      if (document) {
        const link = document.createElement('a')
        link.href = this.toBase64Image()
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        // afterwards we remove the element again
        link.remove()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
