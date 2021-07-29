<template lang="pug">
  .text-left(v-if="ready")
    .d-flex
      b-datepicker(
        size="sm"
        variant="primary"
        v-model="deliveredDate"
        placeholder="請設定送達日期"
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
      //- lah-button(icon="edit" @click="noteFlag = !noteFlag") 備忘
      b-checkbox.my-auto.ml-1.text-nowrap(v-model="noteFlag" size="sm" switch) 備忘錄
    b-textarea.mt-1(
      v-show="noteFlag"
      v-model="note"
      size="sm"
      trim
      lazy
    )
    .p-1.mt-1(:class="classes" v-if="!$utils.empty(deliveredDate)")
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
  name: 'lah-reg-case-fix-date',
  mixins: [regCaseBase],
  data: () => ({
    deliveredDate: '',
    note: '',
    noteFlag: false,
    minDate: new Date()
  }),
  fetch () {
    const raw = this.parentData.FIX_DELIVERED_DATE
    this.deliveredDate = raw.notify_delivered_date || ''
    this.note = raw.note || ''
    !this.$utils.empty(this.note) && (this.noteFlag = true)
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
          return ['bg-success', 'text-white']
      }
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    deliveredDate (val) {
      this.update()
    },
    note (val) {
      this.update()
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
  methods: {
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
         */
        if (data.raw) {
          this.deliveredDate = data.raw.notify_delivered_date
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
      if (!this.isBusy) {
        this.isBusy = true
        // to update delivered date in sqlite db
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_fix_case_delivered_date',
          id: this.caseId,
          date: this.deliveredDate,
          note: this.note
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
    }
  }
}
</script>

<style lang="scss" scoped></style>
