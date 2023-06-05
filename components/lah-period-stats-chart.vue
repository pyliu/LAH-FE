<template lang="pug">
lah-chart(ref="chart")
</template>

<script>
export default {
  emit: ['fetched'],
  component: {},
  props: {
    type: { type: String, default: 'reg' }
  },
  data: () => ({
    st: '1120501',
    ed: '1120531'
  }),
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.STATS, {
      type: this.type?.toUpperCase() === 'SUR' ? 'stats_sur_period_count' : 'stats_reg_period_count',
      st: this.st,
      ed: this.ed
    }).then(({ data }) => {
      this.$refs.chart?.reset()
      const chartItems = []
      chartItems.push({ x: '08', y: parseInt(data.raw['08']), color: { R: 22, G: 11, B: 45 } })
      chartItems.push({ x: '09', y: parseInt(data.raw['09']), color: { R: 122, G: 11, B: 45 } })
      chartItems.push({ x: '10', y: parseInt(data.raw['10']), color: { R: 22, G: 111, B: 45 } })
      chartItems.push({ x: '11', y: parseInt(data.raw['11']), color: { R: 22, G: 11, B: 145 } })
      chartItems.push({ x: '12', y: parseInt(data.raw['12']), color: { R: 222, G: 11, B: 45 } })
      chartItems.push({ x: '13', y: parseInt(data.raw['13']), color: { R: 22, G: 211, B: 45 } })
      chartItems.push({ x: '14', y: parseInt(data.raw['14']), color: { R: 22, G: 11, B: 245 } })
      chartItems.push({ x: '15', y: parseInt(data.raw['15']), color: { R: 25, G: 51, B: 55 } })
      chartItems.push({ x: '16', y: parseInt(data.raw['16']), color: { R: 72, G: 17, B: 75 } })
      chartItems.push({ x: '17', y: parseInt(data.raw['17']), color: { R: 29, G: 91, B: 49 } })
      this.$refs.chart.addDataset(chartItems, '分時案件數統計', 'line')
      this.$refs.chart.addDataset(chartItems, `${this.st} ~ ${this.ed}`, 'bar')
      this.$refs.chart.build()
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {

  }
}
</script>

<style lang="scss" scoped>
</style>
