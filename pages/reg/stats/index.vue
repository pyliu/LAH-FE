<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 分時案件統計資訊
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        b-button-group(size="lg")
          lah-button(
            icon="chart-column",
            @click="$refs.today?.show()",
            :title="$utils.today('TW')"
          ) 今天
          lah-button.ml-1(
            icon="chart-simple",
            @click="$refs.lastMonth?.show()",
            :title="lastMonthText"
          ) 上月統計
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 最近9天的登記案件分時統計數據
      ul
        li 12及17點不納入燈號顯示
        li 🟢 - 案件量較少的時段
        li 🟡 - 較繁忙的時段
        li 🔴 - 非常繁忙的時段
    b-modal(
      ref="today",
      size="xl",
      :title="todayText",
      hide-footer,
      centered
    )
      lah-period-stats-chart(:st="today", :ed="today")
    b-modal(
      ref="lastMonth",
      size="xl",
      :title="lastMonthText",
      hide-footer,
      centered
    )
      lah-period-stats-chart(:st="firstDayofLastMonth", :ed="lastDayofLastMonth")
  b-card-group(columns)
    b-card(v-for="(day, idx) in daysSorted", :key="`bc_${idx}`"): lah-period-stats-chart(:st="day", :ed="day")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    daysSorted: [],
    today: ''
  }),
  head: {
    title: '分時案件統計資訊-桃園市地政局'
  },
  computed: {
    todayText () {
      return `${this.$utils.today('TW')} 分時統計圖`
    },
    lastMonthText () {
      return `${this.firstDayofLastMonth} ~ ${this.lastDayofLastMonth} 分時總量統計圖`
    }
  },
  created () {
    this.today = this.$utils.today('TW').replaceAll('-', '')
    const goBackDays = 9
    const dayTs = 24 * 60 * 60 * 1000
    let ts = +new Date()
    this.daysSorted = []
    for (let i = 0; i < goBackDays; i++) {
      ts -= dayTs
      let newDate = new Date(ts)
      // skip weekend
      if (newDate.getDay() === 0) {
        ts -= dayTs
        newDate = new Date(ts)
      }
      if (newDate.getDay() === 6) {
        ts -= dayTs
        newDate = new Date(ts)
      }
      const y = (newDate.getFullYear() - 1911).toString().padStart(3, '0')
      const m = (newDate.getMonth() + 1).toString().padStart(2, '0')
      const d = newDate.getDate().toString().padStart(2, '0')
      this.daysSorted.push(`${y}${m}${d}`)
    }

    const today = new Date()
    this.firstDayofLastMonth = this.$utils.twDateStr(new Date(today.getFullYear(), today.getMonth() - 1, 1))
    this.lastDayofLastMonth = this.$utils.twDateStr(new Date(today.getFullYear(), today.getMonth(), 0))
  },
  mounted () {}
}
</script>

<style lang="scss" scoped>
</style>
