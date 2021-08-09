<template lang="pug">
  .d-flex
    b-datepicker(
      v-model="startDateObj"
      placeholder="開始日期"
      boundary="viewport"
      title="開始日期"
      label-help="可使用方向鍵操作移動"
      :size="size"
      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
      :max="yesterday"
      :state="stateIndicatorFlag"
      value-as-date
      hide-header
      dropleft
      v-b-tooltip.hover
    )
    .my-auto ～
    b-datepicker(
      v-model="endDateObj"
      placeholder="截止日期"
      boundary="viewport"
      title="結束日期"
      label-help="可使用方向鍵操作移動"
      :size="size"
      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
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
    value: { type: Object, default: () => ({ begin: '', end: '', days: 0 }), required: true },
    beginToday: { type: Boolean, default: false }
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
  fetch () {
    const today = new Date()
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    this.startDateObj = this.beginToday ? today : firstDayofMonth
    this.endDateObj = lastDayofMonth
    this.yesterday = new Date(new Date().setDate(today.getDate() - 1))
    this.today = today
    this.firstDayofMonth = firstDayofMonth
    this.lastDayofMonth = lastDayofMonth
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
      if (this.days < 1) {
      // hack for b-datepicker label centering/nowrap
        this.$nextTick(() => {
          this.$('label.form-control.form-control-sm').addClass('my-auto text-nowrap')
        })
        return false
      }
      // hack for b-datepicker label centering/nowrap
      this.$nextTick(() => {
        this.$('label.form-control.form-control-sm').addClass('my-auto text-nowrap')
      })
      return null
    },
    latestValue () {
      return {
        begin: this.$utils.twDateStr(this.startDateObj),
        end: this.$utils.twDateStr(this.endDateObj),
        days: this.days
      }
    }
  },
  watch: {
    startDateObj (dontcare) {
      this.$emit('input', this.latestValue)
    },
    endDateObj (dontcare) {
      this.$emit('input', this.latestValue)
    }
  },
  mounted () {
    // b-datepicker label centering/nowrap hack
    this.$('label.form-control.form-control-sm').addClass('my-auto text-nowrap')
    // tell outside the component is ready and emit the latest value
    this.$emit('ready', this.latestValue)
  }
}
</script>

<style lang="scss" scoped>
</style>
