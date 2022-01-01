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
    label: {
      type: String,
      default: '統計圖表'
    },
    labelFontSize: {
      type: Number,
      default: 14
    },
    opacity: {
      type: Number,
      default: 0.6
    },
    items: {
      type: Array,
      default: () => [{
        x: 'X軸標籤',
        y: 23,
        color: { R: 22, G: 11, B: 45 }
      }]
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
    bgColor: {
      type: Function,
      default (item, opacity) {
        return `rgb(${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${opacity})`
      }
    },
    borderColor: {
      type: String,
      default: 'rgb(22, 22, 22)'
    },
    yAxes: {
      type: Boolean,
      default: true
    },
    xAxes: {
      type: Boolean,
      default: true
    },
    legend: {
      type: Boolean,
      default: true
    },
    beginAtZero: {
      type: Boolean,
      default: true
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
    aspectRatio: { type: Number, default: 2 }
  },
  data: () => ({
    id: null,
    inst: null,
    chartData: null,
    update_timer: null,
    resize_timer: null
  }),
  computed: {
    style () { return `max-height: ${window.innerHeight - 185}px; max-width: ${window.innerWidth * 0.75}px;` }
  },
  watch: {
    type (val) {
      this.$nextTick(this.buildChart)
    },
    chartData (newObj) {
      this.$nextTick(this.buildChart)
    },
    items (newItems) {
      this.setData(newItems)
    }
  },
  created () { this.id = this.uuid() },
  mounted () {
    this.setData(this.items)
  },
  methods: {
    update () {
      clearTimeout(this.update_timer)
      this.update_timer = this.timeout(() => {
        if (this.inst) { this.inst.update() }
      }, 100)
    },
    resetData () {
      this.chartData = {
        labels: [],
        legend: {
          display: this.legend
        },
        datasets: [{
          label: this.label,
          backgroundColor: [],
          data: [],
          borderColor: this.borderColor,
          order: 1,
          opacity: this.opacity,
          snapGaps: true,
          borderWidth: 1
        }]
      }
    },
    setData (items) {
      this.resetData()
      const opacity = this.chartData.datasets[0].opacity
      items.forEach((item) => {
        if (item.x !== undefined && item.y !== undefined) {
          this.chartData.labels.push(item.x) // x is label
          this.chartData.datasets[0].data.push(item.y) // y is data count
          if (item.color !== undefined && item.color.R !== undefined && item.color.G !== undefined && item.color.B !== undefined) {
            this.chartData.datasets[0].backgroundColor.push(`rgb(${item.color.R}, ${item.color.G}, ${item.color.B}, ${opacity})`)
          } else {
            // random color for this item
            this.chartData.datasets[0].backgroundColor.push(this.bgColor(item, opacity))
          }
        } else if (Array.isArray(item)) {
          // legacy use array
          this.chartData.labels.push(item[0]) // first element is label
          this.chartData.datasets[0].data.push(item[1]) // second element is data count
          // randoom color for this item
          this.chartData.datasets[0].backgroundColor.push(this.bgColor({ x: item[0], y: item[1] }, opacity))
        } else {
          this.$utils.warn('輸入資料不符合規格無法加入 chart data', item)
        }
      })
      this.$nextTick(this.buildChart)
    },
    changeValue (label, value) {
      let foundIdx
      this.chartData.labels.find((olabel, idx, array) => {
        if (olabel === label) { foundIdx = idx }
        return olabel === label
      })
      if (foundIdx !== undefined) {
        this.chartData.datasets[0].data[foundIdx] = value
        // also update background color as well
        this.chartData.datasets[0].backgroundColor[foundIdx] = this.bgColor({ x: label, y: value }, 0.6)
        // redraw the chart
        this.$nextTick(this.update())
      } else {
        this.$utils.warn(`lah-chart: 沒找到 "${label}" 在 dataset 內, ${value} 不會被更新.`, this.chartData)
      }
    },
    buildChart (opts = { plugins: {} }) {
      if (this.inst) {
        // reset the chart
        this.inst.destroy()
        this.inst = null
      }
      // keep only one dataset inside
      if (this.chartData.datasets.length > 1) {
        this.chartData.datasets = this.chartData.datasets.slice(0, 1)
      }
      this.chartData.datasets[0].label = this.label
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
      // use chart.js directly
      // let ctx = this.$el.childNodes[0];
      // const ctx = this.$(`#${this.id}`)
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
            if (!that.empty(element)) {
              payload.point = element[0]
              if (payload.point) {
                // point e.g. {element: e, datasetIndex: 0, index: 14}
                const idx = payload.point.index
                const datasetIdx = payload.point.datasetIndex // only one dataset, it should be always be 0
                payload.label = that.inst.data.labels[idx]
                payload.value = that.inst.data.datasets[datasetIdx].data[idx]
              }
              // parent uses a handle function to catch the event, e.g. catchClick(e, payload) { ... }
              that.$emit('click', e, payload)
            }
          }
        }, opts)
      })
      // sometimes the chart doesn't show up properly ... so add this fix to update it
      this.timeout(this.update, 400)
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
