<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 分時登記案件統計資訊
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        b-button-group(size="lg")
          //- lah-button(
          //-   icon="chart-column",
          //-   @click="$refs.today?.show()",
          //-   :title="$utils.today('TW')"
          //- ) 今天
          lah-button(
            icon="chart-simple",
            @click="$refs.lastMonth?.show()",
            :title="lastMonthText"
          ) 上個月
          lah-button.ml-1(
            icon="square-poll-vertical",
            @click="$refs.thisMonth?.show()",
            :title="thisMonthText"
          ) 本月(迄今)
          lah-button.ml-1(
            icon="calendar-day",
            @click="$refs.day?.show()",
            :title="dayText"
          ) 指定日期
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 最近9天的登記案件分時統計數據
      ul
        li 12及17點不納入燈號顯示
        li 🟢 - 案件量較少的時段
        li 🟡 - 較繁忙的時段
        li 🔴 - 非常繁忙的時段
    b-modal(
      ref="lastMonth",
      size="xl",
      :title="lastMonthText",
      hide-footer,
      centered,
      lazy
    )
      lah-period-stats-chart(:st="firstDayofLastMonth", :ed="lastDayofLastMonth")
    b-modal(
      ref="thisMonth",
      size="xl",
      :title="thisMonthText",
      hide-footer,
      centered,
      lazy
    )
      lah-period-stats-chart(:st="firstDayofMonth", :ed="today")
    b-modal(
      ref="day",
      size="xl",
      :title="dayText",
      hide-footer,
      centered,
      lazy
    )
      b-datepicker(
        v-model="day",
        :max="$utils.today()"
      )
      lah-period-stats-chart(:st="twDay", :ed="twDay")
  lah-flex-item-group
    .col-md-4(v-for="(day, idx) in daysSorted", :key="`day_${idx}`")
      b-card: lah-period-stats-chart(:st="day", :ed="day")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    daysSorted: [],
    today: '',
    day: ''
  }),
  head: {
    title: '分時案件統計資訊-桃園市地政局'
  },
  computed: {
    lastMonthText () {
      return `${this.firstDayofLastMonth} ~ ${this.lastDayofLastMonth} 分時總量統計圖`
    },
    thisMonthText () {
      return `${this.firstDayofMonth} ~ ${this.today} 分時總量統計圖`
    },
    dayText () {
      return '指定日期顯示'
    },
    twDay () {
      return this.$utils.twDateStr(new Date(this.day))
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
    this.firstDayofMonth = this.$utils.twDateStr(new Date(today.getFullYear(), today.getMonth(), 1))
    this.firstDayofLastMonth = this.$utils.twDateStr(new Date(today.getFullYear(), today.getMonth() - 1, 1))
    this.lastDayofLastMonth = this.$utils.twDateStr(new Date(today.getFullYear(), today.getMonth(), 0))

    this.day = this.$utils.today()
  },
  methods: {
    splitChunks (arr, count) {
      const result = []
      for (let i = 0; i < arr.length; i += count) {
        result.push(arr.slice(i, i + count))
      }
      return result
    }
  }
}
</script>

<style lang="scss" scoped>
.col-md-4 > .card {
  height: calc((100vh - 150px) / 3);
  overflow: auto;
  margin-bottom: 1.25rem;
}
</style>
