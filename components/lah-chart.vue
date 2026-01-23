<template lang="pug">
client-only
  .chart-container(ref="container"): canvas(ref="canvas", :id="id") 圖形初始化失敗
</template>

<script>
// 🔧 移除頂部 import，改用動態 import
// import Chart from 'chart.js/auto';

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
    // 🔧 移除 Function props，改為 String 或 null
    // tooltipTitleCallback: {
    //   type: Function,
    //   default (entry) {
    //     return entry[0].label
    //   }
    // },
    // tooltipLabelCallback: {
    //   type: Function,
    //   default (entry) {
    //     ...
    //   }
    // },
    // backgroundColor: {
    //   type: Function,
    //   default (item, opacity) {
    //     ...
    //   }
    // },
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
    chartData: null,
    isDestroyed: false
  }),
  computed: {
    viewportRatio () {
      // 🔧 修正：檢查 window 是否存在
      if (typeof window === 'undefined') {
        return 1.78 // default 16:9
      }
      const vr = parseFloat((window.innerWidth / window.innerHeight).toFixed(2)) + 1.325
      return vr
    },
    containerDimensionRatio () {
      let ratio = 0
      try {
        if (this.$refs.container) {
          const width = this.$refs.container.clientWidth
          const height = this.$refs.container.clientHeight
          ratio = parseFloat(width / height)
        }
      } catch (ex) {
        console.warn(ex)
      }
      return ratio.toFixed(2)
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
    this.id = this.$utils.uuid()

    // 🔧 在 created 中定義 callback 函數
    this.tooltipTitleCallback = (entry) => {
      return entry[0].label
    }

    this.tooltipLabelCallback = (entry) => {
      const sum = entry.dataset.data.reduce(function (previousValue, currentValue) {
        return previousValue + currentValue
      }, 0)
      const currentVal = entry.dataset.data[entry.dataIndex]
      const percent = Math.round(((currentVal / sum) * 100))
      if (isNaN(percent)) { return `${currentVal}` }
      return `${currentVal} [${percent}%]`
    }

    this.backgroundColor = (item, opacity) => {
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

    this.update = this.$utils.debounce(() => {
      if (this.inst && !this.isDestroyed) {
        try {
          this.inst.update()
        } catch (ex) {
          this.$utils.warn(`[lah-chart] 更新圖表時發生錯誤：${ex.message}`)
        }
      }
    }, 100)

    this.reset()

    this.rebuild = this.$utils.debounce(() => {
      this.chartData.datasets.forEach(ds => (ds.type = this.type))
      this.build()
    }, 400)
  },
  mounted () {},
  beforeDestroy () {
    this.isDestroyed = true
    this.destroy()
  },
  methods: {
    destroy () {
      if (this.inst) {
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
          this.chartData.labels.push(item.x)
          this.chartData.datasets[datasetIdx].data.push(item.y)
          this.addBackgroundColor(item, datasetIdx)
        } else {
          const orig = this.chartData.datasets[datasetIdx].data[foundIdx] || 0
          this.chartData.datasets[datasetIdx].data[foundIdx] = orig + item.y
          !this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] && this.addBackgroundColor(item, datasetIdx)
        }
      } else if (Array.isArray(item)) {
        this.initDataset(datasetIdx, label, type)
        const foundIdx = this.chartData.labels.indexOf(item[0])
        if (foundIdx === -1) {
          this.chartData.labels.push(item[0])
          this.chartData.datasets[datasetIdx].data.push(item[1])
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
        this.chartData.datasets[datasetIdx].backgroundColor.push(this.backgroundColor(item, this.opacity))
      }
    },
    setLineFillColor (datasetIdx, colorCode) {
      const ds = this.chartData.datasets[datasetIdx]
      if (ds && ds.type === 'line') {
        if (Array.isArray(ds.backgroundColor)) {
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
        if (item.color !== undefined && item.color.R !== undefined && item.color.G !== undefined && item.color.B !== undefined) {
          this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] = `rgba(${item.color.R}, ${item.color.G}, ${item.color.B}, ${this.opacity})`
        } else {
          this.chartData.datasets[datasetIdx].backgroundColor[foundIdx] = this.backgroundColor(item, this.opacity)
        }
        this?.update()
      } else {
        this.$utils.warn(`${this.$options.name}: 沒找到 "${label}" 在 datasets[${datasetIdx}] 內, ${value} 不會被更新.`, this.chartData)
      }
    },
    addDataset (items, label, type = undefined) {
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
        this?.update()
      }
      return foundIdx
    },
    async build (opts = { plugins: {} }) {
      try {
        // 🔧 確保只在 client 端執行
        if (this.isDestroyed || typeof window === 'undefined') {
          return
        }

        // 🔧 動態載入 Chart.js
        const { default: Chart } = await import('chart.js/auto')

        this.destroy()

        switch (this.type) {
          case 'pie':
          case 'polarArea':
          case 'doughnut':
            opts.plugins = opts.plugins || {}
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

        opts.plugins = opts.plugins || {}
        opts.plugins.title = {
          display: !this.$utils.empty(this.title),
          text: this.title,
          position: this.titlePos,
          font: { size: +this.titleFontSize }
        }

        opts.plugins.subtitle = {
          display: !this.$utils.empty(this.subtitle),
          text: this.subtitle
        }

        opts.plugins.tooltip = {
          enabled: !this.noTooltip,
          backgroundColor: this.tooltipBackgroundColor,
          callbacks: {
            title: this.tooltipTitleCallback,
            label: this.tooltipLabelCallback
          }
        }

        opts.plugins.legend = Object.assign(
          { display: this.legend },
          opts.plugins.legend || {}
        )

        const that = this

        this.$nextTick(() => {
          if (that.isDestroyed || !document.getElementById(this.id)) {
            this.$utils.warn(`[lah-chart] 元件 ${this.id} 已銷毀或 canvas 不存在，中止渲染。`)
            return
          }

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
                const element = that.inst.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
                if (!that.$utils.empty(element)) {
                  payload.point = element[0]
                  if (payload.point) {
                    const idx = payload.point.index
                    const datasetIdx = payload.point.datasetIndex
                    payload.label = that.inst.data.labels[idx]
                    payload.value = that.inst.data.datasets[datasetIdx].data[idx]
                  }
                  that.trigger('click', payload)
                }
              }
            }, opts)
          })

          this?.update()
        })
      } catch (ex) {
        this.$utils.warn(`[lah-chart] 元件 ${this.id} 渲染失敗：${ex.message}`)
      }
    },
    toBase64Image () {
      return this.inst.toBase64Image()
    },
    downloadBase64PNG (filename = 'download.png') {
      if (typeof document !== 'undefined') {
        const link = document.createElement('a')
        link.href = this.toBase64Image()
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
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
  canvas {
    position: absolute;
    height: 100%;
  }
}
</style>
