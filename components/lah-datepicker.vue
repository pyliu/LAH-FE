<template lang="pug">
  .d-flex
    b-datepicker.text-nowrap(
      v-model="startDateObj"
      placeholder="開始日期"
      boundary="viewport"
      title="開始日期"
      :size="size"
      :date-format-options="{ weekday: 'narrow' }"
      :max="yesterday"
      :state="stateIndicatorFlag"
      value-as-date
      hide-header
      dropleft
      v-b-tooltip.hover
    )
    .my-auto ～
    b-datepicker.text-nowrap(
      v-model="endDateObj"
      placeholder="截止日期"
      boundary="viewport"
      title="結束日期"
      :size="size"
      :date-format-options="{ weekday: 'narrow' }"
      :max="lastDayofMonth"
      :min="startDateObj"
      :state="stateIndicatorFlag"
      value-as-date
      hide-header
      dark
      v-b-tooltip.hover
    )
</template>

<script>
export default {
  props: {
    size: { type: String, default: 'sm' },
    value: { type: Object, default: { begin: '', end: '', days: 0 }, required: true },
  },
  fetchOnServer: true,
  data: () => ({
    startDateObj: null,
    endDateObj: null,
    yesterday: null,
    today: null,
    firstDayofMonth: null,
    lastDayofMonth: null
  }),
  async fetch () {
    const today = new Date()
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    this.startDateObj = firstDayofMonth
    this.endDateObj = lastDayofMonth
    this.yesterday = new Date(new Date().setDate(today.getDate()-1))
    this.today = today
    this.firstDayofMonth = firstDayofMonth
    this.lastDayofMonth = lastDayofMonth
  },
  watch: {
    startDateObj (val) {
      this.$emit("input", { ...this.value, begin: this.twDate(val), days: this.days })
    },
    endDateObj (val) {
      this.$emit("input", { ...this.value, end: this.twDate(val), days: this.days })
    }
  },
  computed: {
    days () {
      if (this.endDateObj && this.startDateObj) {
        const difference = this.endDateObj.getTime() - this.startDateObj.getTime()
        return Math.ceil(difference / (1000 * 3600 * 24)) + 1
      }
      return 0
    },
    stateIndicatorFlag () {
      if (this.days < 0) {
        return false
      }
      return null
    }
  },
  methods: {
    twDate (obj) {
      return `${obj.getFullYear() - 1911}${("0" + (obj.getMonth()+1)).slice(-2)}${("0" + obj.getDate()).slice(-2)}`
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
