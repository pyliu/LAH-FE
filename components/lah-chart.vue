<template lang="pug">
.chart-container(ref="container"): canvas(ref="canvas", :id="id") 圖形初始化失敗
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  emit: ['click'],
  props: {
    type: {
      type: String,
      default: 'bar'
    },
    legend: {
      type: Boolean,
      default: true
    },
    labelFontSize: {
      type: Number,
      default: 14
    },
    opacity: {
      type: Number,
      default: 0.6
    },
    noTooltip: {
      type: Boolean,
      default: false
    },
    tooltipBackgroundColor: {
      type: String,
      default: 'rgba(0, 0, 0, 0.7)'
    },
    tooltipTitleCallback: {
      type: Function,
      default (entry) {
        return entry[0].label
      }
    },
    tooltipLabelCallback: {
      type: Function,
      default (entry) {
        // add percent ratio to the label
        const sum = entry.dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
          return previousValue + currentValue
        })
        const currentVal = entry.dataset.data[entry.dataIndex]
        const percent = Math.round(((currentVal / sum) * 100))
        // return either a string or an array of strings. Arrays of strings are treated as multiple lines of text.
        if (isNaN(percent)) { return `${currentVal}` }
        return `${currentVal} [${percent}%]`
      }
    },
    backgroundColor: {
      type: Function,
      default (item, opacity) {
        switch (item.x) {
          case '地政局':
            return `rgba(207, 207, 207, ${opacity})` // H0
          case '桃園所':
            return `rgba(254, 185, 180, ${opacity})` // HA
          case '中壢所':
            return `rgba(125, 199, 80, ${opacity})` // HB
          case '大溪所':
            return `rgba(255, 251, 185, ${opacity})` // HC
          case '楊梅所':
            return `rgba(0, 157, 122, ${opacity})` // HD
          case '蘆竹所':
            return `rgba(33, 137, 227, ${opacity})` // HE
          case '八德所':
            return `rgba(181, 92, 66, ${opacity})` // HF
          case '平鎮所':
            return `rgba(195, 42, 84, ${opacity})` // HG
          case '龜山所':
            return `rgba(136, 72, 152, ${opacity})` // HH
          default:
            return `rgba(${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${this.$utils.rand(255)}, ${opacity})`
        }
      }
    },
    borderColor: {
      type: String,
      default: 'rgba(22, 22, 22)'
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
    maintainAspectRatio: { type: Boolean, default: false },
    aspectRatio: { type: Number, default: () => 0 }
  },
  data: () => ({
    id: null,
    inst: null,
    chartData: null
  }),
  computed: {
    containerDimensionRatio () {
      let ratio = 0
      try {
        const width = this.$refs.container.$el.clientWidth;
        const height = this.$refs.container.$el.clientHeight;
        // const width = window.innerWidth
        // const height = window.innerHeight
        ratio = parseFloat(width / height)
        console warn('chart dr', ratio)
      } catch (ex) {
        console warn(ex)
      }
      return ratio?.toFixed(2)
    }
  },
  watch: {
    type (dontcare) {
      this.rebuild()
    },
    aspectRatio (dontcare) {
      this.rebuild()
    },
    viewportRatio (dontcare) {
      this.rebuild()
    }
  },
  created () {
    this.id = this.uuid()
    this.update = this.$utils.debounce(() => this.inst && this.inst.update(), 100)
    this.reset()
    this.rebuild = this.$utils.debounce(() => {
      this.chartData.datasets.forEach(ds => (ds.type = this.type))
      this.build()
    }, 400)
  },
  beforeDestroy () {
    this.destroy()
  },
  methods: {
    destroy () {
      if (this.inst) {
        // reset the chart
        this.inst.destroy()
        this.inst = null
      }
    },
    reset () {
      this.chartData = {
        labels: [],
        legend: { display: this.legend },
        datasets: []
      }
    },
    initDataset (idx, label, type) {
      if (!this.chartData.datasets[idx]) {
        const opts = {
          type: type || this.type,
          label,
          backgroundColor: [],
          data: [],
          borderColor: this.borderColor,
          order: 1,
          opacity: this.opacity,
          snapGaps: true,
          borderWidth: this.borderWidth
        }
        // make line char style smoothly
        type === 'line' && (opts.tension = 0.35)
        this.chartData.datasets.push(opts)
      }
    },
    setLabels (labels) {
      const currentLabelsLength = this.chartData.labels.length || 0
      if (Array.isArray(labels) && labels.length === currentLabelsLength) {
        this.chartData.labels = [...labels]
      } else {
        this.$utils.warn(`與目前標籤數(${currentLabelsLength})不相符，無法變更圖形標籤(x軸)`, this.chartData.labels, labels)
      }
    },
    addData (item, label, type, datasetIdx = 0) {
      if (item.x !== undefined && item.y !== undefined) {
        this.initDataset(datasetIdx, label, type)
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
        this.initDataset(datasetIdx, label, type)
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
        this.$utils.warn(`輸入資料不符合規格無法加入 chart datasets[${datasetIdx}]`, item, label, type)
      }
    },
    addBackgroundColor (item, datasetIdx) {
      if (item.color !== undefined && item.color.R !== undefined && item.color.G !== undefined && item.color.B !== undefined) {
        this.chartData.datasets[datasetIdx].backgroundColor.push(`rgba(${item.color.R}, ${item.color.G}, ${item.color.B}, ${this.opacity})`)
      } else {
        // random color for this item
        this.chartData.datasets[datasetIdx].backgroundColor.push(this.backgroundColor(item, this.opacity))
      }
    },
    setLineFillColor (datasetIdx, colorCode) {
      const ds = this.chartData.datasets[datasetIdx]
      if (ds && ds.type === 'line') {
        if (Array.isArray(ds.backgroundColor)) {
          // fill color will use the first one in array
          ds.backgroundColor[0] = colorCode
        } else {
          ds.backgroundColor = colorCode
        }
      }
    },
    updateData (item, datasetIdx = 0) {
      const label = item.x
      const value = item.y
      const foundIdx = this.chartData.labels.indexOf(label)
      if (foundIdx !== -1) {
        this.chartData.datasets[datasetIdx].data[foundIdx] = value
        // also update background color as well
        if (item.color !== undefined && item.color.R !== undefined && item.color.G !== undefined && item.color.B !== undefined) {
          this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] = `rgba(${item.color.R}, ${item.color.G}, ${item.color.B}, ${this.opacity})`
        } else {
          this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] = this.backgroundColor(item, this.opacity)
        }
        // redraw the chart
        this.update()
      } else {
        this.$utils.warn(`${this.$options.name}: 沒找到 "${label}" 在 datasets[${datasetIdx}] 內, ${value} 不會被更新.`, this.chartData)
      }
    },
    addDataset (items, label, type = undefined) {
      /**
       * expect item format:
       * {
       *   x: 'X軸標籤', // xAxes
       *   y: 23, // yAxes
       *   color: { R: 22, G: 11, B: 45 } // optional
       * }
       */
      const nextDatasetIdx = this.chartData.datasets.length
      items?.forEach(item => this.addData(item, label, type, nextDatasetIdx))
      return nextDatasetIdx
    },
    removeDataset (label) {
      let foundIdx = -1
      this.chartData.datasets.find((ds, idx) => {
        if (ds.label === label) {
          foundIdx = idx
          return true
        }
        return false
      })
      if (foundIdx === -1) {
        this.$utils.warn(`沒有發現 ${label} 的 dataset，刪除失敗。`)
      } else {
        this.chartData.datasets.splice(foundIdx, 1)
        this.update()
      }
      return foundIdx
    },
    build (opts = { plugins: {} }) {
      this.destroy()
      switch (this.type) {
        case 'pie':
        case 'polarArea':
        case 'doughnut':
          // put legend to the right for some chart type
          opts.plugins.legend = {
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
      // tooltip
      opts.plugins.tooltip = {
        enabled: !this.noTooltip,
        backgroundColor: this.tooltipBackgroundColor,
        callbacks: {
          title: this.tooltipTitleCallback,
          label: this.tooltipLabelCallback
        }
      }
      // legend
      opts.plugins.legend = Object.assign(
        { display: this.legend }, // default
        opts.plugins.legend
      )
      // use chart.js directly
      const that = this
      // this.$utils.warn(this.chartData.datasets[0].backgroundColor[this.chartData.datasets[0].backgroundColor.length - 1])
      this.inst = new Chart(document.getElementById(this.id), {
        data: this.chartData,
        options: Object.assign({
          responsive: true,
          maintainAspectRatio: that.maintainAspectRatio,
          aspectRatio: +that.aspectRatio || +that.viewportRatio,
          elements: {
            point: { pointStyle: 'circle', radius: 4, hoverRadius: 6, borderWidth: 1, hoverBorderWidth: 2 },
            line: { tension: that.type === 'line' ? 0.35 : 0.1, fill: that.chartData.datasets.length === 1, stepped: false }
          },
          onResize: that.resizeCallback.bind(that),
          resizeDelay: 400,
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
      this.update()
      // tweak canvas dimension
      // const canvas = this.$refs.canvas
      // const container = this.$refs.container
      // canvas.style.width = `${container.clientWidth - 30}px`
      // canvas.style.height = `${container.clientHeight - 30}px`
      // console.warn(this.$refs.canvas, canvas.width, canvas.height)
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
    },
    rebuild () { /** placeholder */ },
    resizeCallback (inst, dimension) {
      // dimension example: {width: 382.7, height: 133.5}
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-body {
  .chart-container {
    width: 100%;
    height: 65vh;
  }
}
.chart-container {
  position: relative;
  height: 100%;
  // canvas {
  //   position: absolute;
  //   height: 100%;
  // }
}
</style>
