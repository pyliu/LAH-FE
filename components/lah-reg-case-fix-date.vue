<template lang="pug">
  .text-left(v-if="ready" :class="classes")
    b-datepicker(
      v-model="deliveredDate"
      placeholder="選擇送達日期"
      boundary="viewport"
      :title="`${$utils.caseId(caseId)}`"
      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
      :min="minDate"
      label-help="使用方向鍵操作移動日期"
      hide-header
      dropleft
      today-button
      label-today-button="今天"
      reset-button
      label-reset-button="重設"
      close-button
      label-close-button="關閉"
      v-b-tooltip.hover.left.v-warning
    )
    div(v-if="!$utils.empty(dueDate)") 到期日期：{{ dueDate }}
    div(v-if="!$utils.empty(rejectDate)") 可駁回日：{{ rejectDate }}
</template>

<script>
import regCaseBase from '~/components/lah-reg-case-base.js'

export default {
  /* from lah-reg-case-base.js
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' }
  },
  */
  name: 'lah-reg-case-fix-date',
  mixins: [regCaseBase],
  data: () => ({
    deliveredDate: '',
    minDate: new Date()
  }),
  fetch () {
    // get the date string from sqlite db
    this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'reg_fix_case_delivered_date',
      id: this.caseId
    }).then(({ data }) => {
      /** expected raw json data format e.g.
       * case_no: "110HHA1017620"
       * note: "測試"
       * notify_delivered_date: "2021/07/20"
       */
      if (data.raw) {
        this.deliveredDate = data.raw.notify_delivered_date
      }
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  computed: {
    dueDate () {
      if (this.$utils.empty(this.deliveredDate)) {
        return ''
      }
      const dd = new Date(this.deliveredDate)
      dd.setDate(dd.getDate() + 15)
      /**
       * 'en-ZA' => 2020/08/19 (year/month/day)
       * 'en-CA' => 2020-08-19 (year-month-day)
       */
      return dd.toLocaleDateString('en-ZA')
    },
    rejectDate () {
      if (this.$utils.empty(this.dueDate)) {
        return ''
      }
      const dd = new Date(this.dueDate)
      dd.setDate(dd.getDate() + 1)
      return dd.toLocaleDateString('en-ZA')
    },
    today () {
      return new Date().toLocaleDateString('en-ZA')
    },
    light () {
      if (!this.$utils.empty(this.deliveredDate)) {
        if (this.today >= this.rejectDate) { return 'red' }
        if (this.today === this.dueDate) { return 'yellow' }
      }
      return 'green'
    },
    classes () {
      switch (this.light) {
        case 'red': return ['bg-danger', 'text-white', 'font-weight-bold']
        case 'yellow': return ['bg-warning']
        default:
          return ''
      }
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    deliveredDate (val) {
      this.isBusy = true
      // to update delivered date in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_fix_case_delivered_date',
        id: this.caseId,
        date: val,
        note: ''
      }).then(({ data }) => {
        if (!this.$utils.statusCheck(data.status)) {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
  },
  mounted () {
    // RM51: 通知補正日
    this.minDate = this.$utils.twToAdDateObj(this.bakedData.RM51)
    this.trigger('ready', this.ready)
  },
  methods: {}
}
</script>

<style lang="scss" scoped></style>
