<template lang="pug">
  .text-left(
    :title="`${$utils.caseId(caseId)}`"
    v-if="ready"
    v-b-tooltip.hover.left.v-warning
  )
    .d-flex.text-nowrap
      .my-auto.mr-1 領件狀態
      b-select(
        v-model="parentData.UNTAKEN_TAKEN_STATUS"
        :options="status"
        size="sm"
      )

    .d-flex.text-nowrap
      .my-auto.mr-1 　　日期
      b-datepicker(
        size="sm"
        variant="primary"
        v-model="parentData.UNTAKEN_TAKEN_DATE"
        placeholder="選擇狀態變更日期"
        boundary="viewport"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        :min="minDate"
        :max="maxDate"
        label-help="使用方向鍵操作移動日期"
        hide-header
        dropleft
        today-button
        label-today-button="今天"
        reset-button
        label-reset-button="重設"
        close-button
        label-close-button="關閉"
      )

    div(v-if="takenStatus === ''")
      hr
      .d-flex.text-nowrap
        .my-auto.mr-1.text-nowrap 　借閱人
        span {{ borrower }}

      .d-flex.text-nowrap
        .my-auto.mr-1 　　日期
        b-datepicker(
          size="sm"
          variant="primary"
          v-model="parentData.UNTAKEN_LENT_DATE"
          placeholder="變更借閱日期"
          boundary="viewport"
          :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
          :min="minDate"
          :max="maxDate"
          label-help="使用方向鍵操作移動日期"
          hide-header
          dropleft
          today-button
          label-today-button="今天"
          reset-button
          label-reset-button="重設"
          close-button
          label-close-button="關閉"
        )

      .d-flex.text-nowrap(v-if="!$utils.empty(lentDate)")
        .my-auto.mr-1 歸還日期
        b-datepicker(
          size="sm"
          variant="primary"
          v-model="parentData.UNTAKEN_RETURN_DATE"
          placeholder="設定借閱歸還日期"
          boundary="viewport"
          :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
          :min="minDate"
          :max="maxDate"
          label-help="使用方向鍵操作移動日期"
          hide-header
          dropleft
          today-button
          label-today-button="今天"
          reset-button
          label-reset-button="重設"
          close-button
          label-close-button="關閉"
        )

    .d-flex.text-nowrap(v-if="false")
      b-checkbox.my-auto.mr-1.text-nowrap(v-model="noteFlag" size="sm") 備忘錄
      b-textarea(
        v-show="noteFlag"
        v-model="parentData.UNTAKEN_NOTE"
        size="sm"
        trim
      )
</template>

<script>
import regCaseBase from '~/components/lah-reg-case-base.js'

export default {
  /**
   * 參考八德所系統,欄位包含年度、收件字號、領件人、登記原因、結案日期、領件日期、領件狀
態(已領件、免發狀、附件領回、內部更正、駁回、撤回、郵寄到家)。
設「年度」時間區間供查詢,參考桃園所目前程式,並增加「承辦人借閱案件」之欄位功能。
   */
  /* from lah-reg-case-base.js
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' }
  },
  */
  name: 'lah-reg-untaken-mgt',
  mixins: [regCaseBase],
  data: () => ({
    noteFlag: false,
    minDate: new Date(),
    maxDate: new Date(),
    status: ['', '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄到家'],
    skipTakenDateUpdate: false
  }),
  fetch () {
    !this.$utils.empty(this.note) && (this.noteFlag = true)
  },
  computed: {
    takenDate () {
      return this.parentData.UNTAKEN_TAKEN_DATE || ''
    },
    takenStatus () {
      return this.parentData.UNTAKEN_TAKEN_STATUS || ''
    },
    lentDate () {
      return this.parentData.UNTAKEN_LENT_DATE || ''
    },
    returnDate () {
      return this.parentData.UNTAKEN_RETURN_DATE || ''
    },
    borrower () {
      return this.parentData.UNTAKEN_BORROWER_DATE || ''
    },
    note () {
      return this.parentData.UNTAKEN_NOTE || ''
    },
    dueDate () {
      if (this.$utils.empty(this.takenDate)) {
        return ''
      }
      const dd = new Date(this.takenDate)
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
      if (!this.$utils.empty(this.takenDate)) {
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
    takenDate (dontcare) {
      if (this.$utils.empty(this.takenStatus) && !this.skipTakenDateUpdate) {
        this.parentData.UNTAKEN_TAKEN_STATUS = '已領件'
      }
      this.skipTakenDateUpdate = false
      this.updateDebounced()
    },
    takenStatus (val) {
      console.log(val, this.parentData.UNTAKEN_TAKEN_DATE)
      if (this.$utils.empty(val)) {
        this.skipTakenDateUpdate = true
        this.parentData.UNTAKEN_TAKEN_DATE = null
      } else if (this.$utils.empty(this.parentData.UNTAKEN_TAKEN_DATE)) {
        this.parentData.UNTAKEN_TAKEN_DATE = new Date()
      }
      this.updateDebounced()
    },
    lentDate (dontcare) {
      this.updateDebounced()
    },
    returnDate (dontcare) {
      this.updateDebounced()
    },
    borrower (dontcare) {
      this.updateDebounced()
    },
    note (val) {
      this.updateDebounced()
      this.noteFlag = !this.$utils.empty(val)
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 250)
  },
  mounted () {
    // RM58_1: 結案日期
    this.minDate = this.$utils.twToAdDateObj(this.bakedData.RM58_1)
    this.trigger('ready', this.ready)
  },
  methods: {
    update () {
      // to update untaken data in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_cert_taken_date',
        id: this.caseId,
        taken_date: this.takenDate,
        taken_status: this.takenStatus,
        lent_date: this.lentDate,
        return_date: this.returnDate,
        borrower: this.borrower,
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
</script>

<style lang="scss" scoped></style>
