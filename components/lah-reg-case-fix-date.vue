<template lang="pug">
.text-left(v-if="ready")
  .d-flex
    small.my-auto.text-nowrap.mr-1 補正期滿
    b-datepicker(
      size="sm"
      variant="primary"
      v-model="parentData.REG_FIX_CASE_RECORD.fix_deadline_date"
      placeholder="補正期滿日期"
      boundary="viewport"
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
      @context="updateDebounced"
    )
    //- lah-button(
    //-   icon="undo",
    //-   action="cycle-alt",
    //-   variant="outline-secondary",
    //-   size="sm",
    //-   title="重設",
    //-   @click="resetDeadline"
    //- )
  .d-flex.my-1
    small.my-auto.text-nowrap.mr-1 通知送達
    b-datepicker(
      size="sm"
      variant="primary"
      v-model="parentData.REG_FIX_CASE_RECORD.notify_delivered_date"
      placeholder="通知書送達日期"
      boundary="viewport"
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
      @context="updateDebounced"
    )
    //- b-checkbox.my-auto.ml-1.text-nowrap(v-model="noteFlag" size="sm" switch) 備忘錄
  b-textarea.mt-1(
    v-show="noteFlag"
    v-model="parentData.REG_FIX_CASE_RECORD.note"
    size="sm"
    trim
  )
  .p-1.mt-1.small(:class="classes" v-if="!$utils.empty(deliveredDate)")
    div 到期日期：{{ dueDate }}
    div 可駁回日：{{ rejectDate }}
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
  name: 'LahRegCaseFixDate',
  mixins: [regCaseBase],
  data: () => ({
    noteFlag: false,
    minDate: new Date()
  }),
  fetch () {
    !this.$utils.empty(this.note) && (this.noteFlag = true)
  },
  computed: {
    deliveredDate () {
      return this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date
    },
    deadlineDate () {
      return this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date
    },
    note () {
      return this.parentData.REG_FIX_CASE_RECORD.note
    },
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
          return ['bg-success', 'text-white']
      }
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    // deliveredDate (dontcare) {
    //   this.updateDebounced()
    // },
    // deadlineDate (dontcare) {
    //   this.updateDebounced()
    // },
    note (val) {
      this.updateDebounced()
      this.noteFlag = !this.$utils.empty(val)
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 1000)
  },
  mounted () {
    // RM51: 通知補正日
    this.minDate = this.$utils.twToAdDateObj(this.parentData.RM51)
    // fill default value from RM52
    this.$utils.empty(this.deadlineDate) && this.resetDeadline()
    this.trigger('ready', this.ready)
  },
  methods: {
    resetDeadline () {
      // RM52: 補正期滿日期
      this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = this.$utils.twToAdDateObj(this.parentData.RM52)
    },
    load () {
      // get the date string from sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_fix_case_delivered_date',
        id: this.caseId
      }).then(({ data }) => {
        /** expected raw json data format e.g.
         * case_no: "110HHA1017620"
         * note: "測試"
         * notify_delivered_date: "2021/07/20"
         * fix_deadline_date: "2022/03/17"
         */
        if (data.raw) {
          this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date = data.raw.notify_delivered_date
          this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = data.raw.fix_deadline_date
          this.note = data.raw.note
          !this.$utils.empty(this.note) && (this.noteFlag = true)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.fetched = true
      })
    },
    update () {
      // to update delivered date in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_fix_case_data',
        id: this.caseId,
        delivered: this.deliveredDate,
        deadline: this.deadlineDate,
        note: this.note
      }).then(({ data }) => {
        if (!this.$utils.statusCheck(data.status)) {
          this.$utils.warn(data.message, {
            id: this.caseId,
            delivered: this.deliveredDate,
            deadline: this.deadlineDate,
            note: this.note
          })
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped></style>
