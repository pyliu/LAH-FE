<template lang="pug">
client-only: lah-chart(ref="chart", @click="handleClick")
</template>

<script>
export default {
  emit: ['fetched', 'click'],
  component: {},
  props: {
    type: { type: String, default: 'reg' },
    st: { type: String, default: '' },
    ed: { type: String, default: '' }
  },
  data: () => ({
    aSt: '',
    aEd: '',
    today: '',
    statsData: null,
    colorMap: new Map(),
    weekdayMap: new Map([
      [1, '一'],
      [2, '二'],
      [3, '三'],
      [4, '四'],
      [5, '五'],
      [6, '六'],
      [0, '日']
    ]),
    timer: null,
    timerMs: 300 * 1000, // 5 mins
    greenColor: { R: 22, G: 211, B: 45 },
    yellowColor: { R: 255, G: 235, B: 0 },
    redColor: { R: 255, G: 8, B: 8 },
    grayColor: { R: 211, G: 211, B: 211 }
  }),
  fetch () {},
  computed: {
    periodText () {
      if (this.aSt === this.aEd) {
        const d = this.$utils.twToAdDateObj(this.aSt)
        // const y = (d.getFullYear() - 1911).toString().padStart(3, '0')
        const m = (d.getMonth() + 1).toString().padStart(2, '0')
        const D = d.getDate().toString().padStart(2, '0')
        return `${m}/${D} (${this.weekdayMap.get(d.getDay())})`
      }
      return `${this.aSt} ~ ${this.aEd}`
    }
  },
  watch: {
    st (val) {
      this.aSt = val?.replace(/[-/]+/g, '')
      this.this.debounceQuery()
    },
    ed (val) {
      this.aEd = val?.replace(/[-/]+/g, '')
      this.this.debounceQuery()
    }
  },
  created () {
    this.today = this.$utils.today('TW').replace(/[-/]+/g, '')
    this.aSt = this.st?.replace(/[-/]+/g, '')
    this.aEd = this.ed?.replace(/[-/]+/g, '')
    if (this.$utils.empty(this.aSt)) {
      this.aSt = this.today
    }
    if (this.$utils.empty(this.aEd)) {
      this.aEd = this.aSt
    }
    this.debounceQuery = this.$utils.debounce(this.query, this.$utils.rand(10) * 100)
  },
  mounted () {
    this.debounceQuery()
    if (this.aSt === this.today) {
      this.timeout(this.debounceQuery, this.timerMs).then((handler) => { this.timer = handler })
    }
  },
  beforeDestroy () { clearTimeout(this.timer) },
  methods: {
    query () {
      if (!this.isBusy) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.STATS, {
          type: this.type?.toUpperCase() === 'SUR' ? 'stats_sur_period_count' : 'stats_reg_period_count',
          st: this.aSt,
          ed: this.aEd
        }).then(({ data }) => {
          this.$emit('fetched', data)
          this.statsData = data.raw
          this.buildChart()
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          if (this.aSt === this.today) {
            this.timeout(this.debounceQuery, this.timerMs).then((handler) => { this.timer = handler })
          }
        })
      }
    },
    prepareColorMap () {
      this.colorMap.clear()
      if (this.statsData) {
        // sorts by count and excludes 12, 17 clock data
        const arr = Object.entries(this.statsData).sort((a, b) => a[1] - b[1]).filter((element, index, arr) => {
          return !['12', '17'].includes(element[0])
        }).filter((ele, idx, arr) => {
          // get rid of element that is 0
          return parseInt(ele[1]) !== 0
        })
        // 2-3-3 👉 g-y-r
        for (let i = 0; i < arr.length; i++) {
          if (i < 2) {
            this.colorMap.set(arr[i][0], this.greenColor)
          } else if (i < 5) {
            this.colorMap.set(arr[i][0], this.yellowColor)
          } else {
            this.colorMap.set(arr[i][0], this.redColor)
          }
        }
      }
    },
    buildChart () {
      if (this.$refs.chart) {
        this.$refs.chart?.reset()
        const chartItems = []
        this.prepareColorMap()
        chartItems.push({ x: '08點', y: parseInt(this.statsData['08']), color: this.colorMap.get('08') })
        chartItems.push({ x: '09點', y: parseInt(this.statsData['09']), color: this.colorMap.get('09') })
        chartItems.push({ x: '10點', y: parseInt(this.statsData['10']), color: this.colorMap.get('10') })
        chartItems.push({ x: '11點', y: parseInt(this.statsData['11']), color: this.colorMap.get('11') })
        chartItems.push({ x: '12點', y: parseInt(this.statsData['12']), color: this.grayColor })
        chartItems.push({ x: '13點', y: parseInt(this.statsData['13']), color: this.colorMap.get('13') })
        chartItems.push({ x: '14點', y: parseInt(this.statsData['14']), color: this.colorMap.get('14') })
        chartItems.push({ x: '15點', y: parseInt(this.statsData['15']), color: this.colorMap.get('15') })
        chartItems.push({ x: '16點', y: parseInt(this.statsData['16']), color: this.colorMap.get('16') })
        chartItems.push({ x: '17點', y: parseInt(this.statsData['17']), color: this.grayColor })
        this.$refs.chart?.addDataset(chartItems, this.periodText, 'line')
        this.$refs.chart?.addDataset(chartItems, '分時案件數統計', 'bar')
        this.$refs.chart?.build()
      } else {
        // retry after 100ms
        this.timeout(this.buildChart, 100)
      }
    },
    handleClick (payload) {
      const clock = payload.detail.label.replace('點', '')
      const qData = {
        clock,
        st: this.aSt,
        ed: this.aEd
      }
      this.trigger('click', qData)
      this.modal(this.$createElement('lah-period-stats-chart-click', {
        props: { ...qData }
      }), {
        size: 'lg',
        title: `${this.aSt} ~ ${this.aEd} ${payload.detail.label}案件列表`,
        scrollable: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
