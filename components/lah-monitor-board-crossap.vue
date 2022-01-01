<template lang="pug">
b-card
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
        li 顯示跨域AP連線狀態
        li 目前每 15s 更新資料一次
  lah-chart(ref="chart", :type="chartType")
</template>

<script>
export default {
  data: () => ({
    header: '跨域AP連線狀態',
    bar: true,
    reloadTimer: null,
    chartItems: []
  }),
  computed: {
    chartType () { return this.bar ? 'bar' : 'line' },
    totalCount () { return this.chartItems.reduce((acc, item) => acc + item.y, 0) },
    light () {
      if (this.totalCount > 500) { return 'danger' }
      if (this.totalCount > 300) { return 'warning' }
      return 'success'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.load()
  },
  methods: {
    load () {
      clearTimeout(this.reloadTimer)
      this.$refs.chart?.reset()
      this.chartItems.length = 0
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_latest_ap_conn',
          ap_ip: '220.1.34.161',
          all: true
        })
        .then(({ data }) => {
          if (data.data_count && data.data_count > 0) {
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
              const text = this.$consts.ipMap.get(item.est_ip)?.name
              if (text) {
                const value = item.count
                const found = this.chartItems.find((item) => {
                  return item.x === text
                })
                if (found) {
                  found.y += value
                } else {
                  this.chartItems.push({ x: text, y: value })
                }
              } else {
                // this.$utils.warn('item.est_ip 不在 ipMap 內無法新增至 chartItems 裡', item)
              }
            })
            this.$refs.chart?.addDataset(this.chartItems, '跨域AP連線數', this.chartType)
            this.$refs.chart?.rebuild()
          }
        })
        .catch((err) => {
          this.error = err
        })
        .finally(() => {
          // reload every 15s
          this.reloadTimer = this.timeout(this.load, 15 * 1000)
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
