<template lang="pug">
.text-left
  div(v-if="ready && editable")
    .d-flex
      small.my-auto.text-nowrap.mr-1 補正期滿
      b-datepicker(
        size="sm"
        v-model="parentData.REG_FIX_CASE_RECORD.fix_deadline_date"
        placeholder="補正期滿日期"
        boundary="viewport"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        :min="minDate"
        label-help="使用方向鍵操作移動日期"
        hide-header
        dropleft
        close-button
        label-close-button="關閉"
        v-b-tooltip.hover.left.v-warning
        @context="update"
      )
      lah-button.ml-1(
        v-if="deadlineDateChanged",
        icon="undo",
        action="cycle-alt",
        variant="outline-secondary",
        size="sm",
        :title="`補正期滿日期重設為 ${defaultDeadlineDate}`",
        @click="resetDeadline"
        no-icon-gutter
      )
    .d-flex.my-1
      small.my-auto.text-nowrap.mr-1 通知送達
      b-datepicker(
        size="sm"
        v-model="parentData.REG_FIX_CASE_RECORD.notify_delivered_date"
        placeholder="通知書送達日期"
        boundary="viewport"
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
        @context="update"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        :min="minDate"
        :max="maxDate"
        :state="settleDeliveredDate"
      )

  div(v-else)
    .my-auto.text-nowrap.mr-1 補正期滿：{{ parentData.REG_FIX_CASE_RECORD.fix_deadline_date }}
    .my-auto.text-nowrap.mr-1 通知送達：{{ parentData.REG_FIX_CASE_RECORD.notify_delivered_date }}

  lah-transition: .p-1.mt-1.small(v-if="!$utils.empty(deliveredDate)")
    b-badge.p-2.mr-2(pill, :class="classes") 調整到期日期：{{ dueDate }}
    b-badge.p-2(pill, :class="classes") 預計可駁回日：{{ rejectDate }}
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
    minDate: new Date(),
    maxDate: new Date(),
    retried: 0,
    origDataset: {
      id: '',
      delivered: '',
      deadline: ''
    }
  }),
  computed: {
    updateDataset () {
      return {
        id: this.caseId,
        delivered: this.deliveredDate,
        deadline: this.deadlineDate
      }
    },
    deliveredDate () {
      return this.parentData.REG_FIX_CASE_RECORD.notify_delivered_date
    },
    settleDeliveredDate () {
      return !this.$utils.empty(this.deliveredDate)
    },
    defaultDeadlineDate () {
      // RM52: 補正期滿日期
      return this.$utils.tsToAdDateStr(+this.$utils.twToAdDateObj(this.parentData.RM52) / 1000)
    },
    deadlineDate () {
      return this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date
    },
    deadlineDateChanged () {
      return !this.$utils.empty(this.deadlineDate) && this.defaultDeadlineDate !== this.deadlineDate
    },
    dueDate () {
      if (this.$utils.empty(this.deliveredDate)) {
        return ''
      }
      const dd = new Date(this.deliveredDate)
      // RM52_TYPE === '1' => Month
      const factor = this.parentData.RM52_TYPE === '1' ? 30 : 1
      const days = factor * (parseInt(this.parentData.RM52_DAY) || 15)
      dd.setDate(dd.getDate() + days)
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
    },
    editable () {
      return this.parentData.RM45 === this.myid || this.authority.isAdmin || this.authority.isChief
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    caseId (dontcare) {
      // to let the component refresh in b-table
      this.load()
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 1000)
    // keep init value
    this.origDataset.id = this.caseId
    this.origDataset.delivered = this.deliveredDate
    this.origDataset.deadline = this.deadlineDate
  },
  mounted () {
    // RM51: 通知補正日, plus one day
    this.minDate = new Date(+this.$utils.twToAdDateObj(this.parentData.RM51) + 24 * 60 * 60 * 1000)
    // fill default value from RM52
    this.$utils.empty(this.deadlineDate) && this.resetDeadline()
    this.trigger('ready', this.ready)
  },
  methods: {
    resetDeadline () {
      this.parentData.REG_FIX_CASE_RECORD.fix_deadline_date = this.defaultDeadlineDate
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
          this.origDataset.id = this.caseId
          this.origDataset.delivered = this.deliveredDate
          this.origDataset.deadline = this.deadlineDate
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
      if (!this.$utils.equal(this.origDataset, this.updateDataset)) {
        // to update delivered date in sqlite db
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_fix_case_data',
          ...this.updateDataset
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.origDataset = { ...this.updateDataset }
          } else if (this.retried < 5) {
            this.timeout(this.update, this.$utils.rand(800))
            this.retried++
          } else {
            this.$utils.warn(data.message, this.updateDataset)
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
}
</script>

<style lang="scss" scoped></style>
