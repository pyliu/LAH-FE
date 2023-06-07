<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div 分時案件統計資訊
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        //- div 右側選單區域
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 顯示最近9天的登記案件分時統計數據(12時及17時不列入燈號顯示)
      ul
        li 🟢 - 案件量較少的時段
        li 🟡 - 較繁忙的時段
        li 🔴 - 非常繁忙的時段
  b-card-group(columns)
    b-card(v-for="(day, idx) in daysSorted", :key="`bc_${idx}`"): lah-period-stats-chart(:st="day", :ed="day")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    daysSorted: []
  }),
  head: {
    title: '分時案件統計資訊-桃園市地政局'
  },
  created () {
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
  },
  mounted () {
    this.display = true
  }
}
</script>

<style lang="scss" scoped>
</style>
