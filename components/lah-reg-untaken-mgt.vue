/* eslint-disable no-irregular-whitespace */
<template lang="pug">
  .text-left(
    :title="`${$utils.caseId(caseId)}`"
    v-if="ready"
    v-b-tooltip.hover.left.v-warning
  )
    .d-flex.text-nowrap.mb-1
      .my-auto.mr-1 領件狀態
      b-select(
        v-model="parentData.UNTAKEN_TAKEN_STATUS"
        :options="status"
        size="sm"
      )

    .d-flex.text-nowrap.mb-1
      .my-auto.mr-1 領件日期
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
      .d-flex.text-nowrap.mb-1
        .my-auto.mr-1.text-nowrap 　借閱人
        span.my-auto.mr-1(v-if="!$utils.empty(borrower)") {{ borrower }}:{{ borrowerName }}
        lah-button(
          no-icon-gutter
          icon="user-friends"
          title="選擇"
          @click="selectUser"
          :variant="$utils.empty(borrower) ? 'outline-dark' : 'warning'"
        )

      .d-flex.text-nowrap.mb-1
        .my-auto.mr-1 借出日期
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

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(lentDate)")
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

    .d-flex.text-nowrap.mb-1(v-if="false")
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
import lahUserSelect from '~/components/lah-user-select.vue'

export default {
  /* from lah-reg-case-base.js
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' }
  },
  */
  name: 'lah-reg-untaken-mgt',
  components: { lahUserSelect },
  mixins: [regCaseBase],
  data: () => ({
    noteFlag: false,
    minDate: new Date(),
    maxDate: new Date(),
    status: ['', '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄到家'],
    skipTakenDateUpdate: false,
    skipTakenStatusUpdate: false
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
      return this.parentData.UNTAKEN_BORROWER || ''
    },
    borrowerName () {
      return this.userNames[this.borrower] || ''
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
    takenDate (val) {
      if (!this.skipTakenDateUpdate) {
        this.skipTakenStatusUpdate = true
        if (this.$utils.empty(val)) {
          this.parentData.UNTAKEN_TAKEN_STATUS = ''
        } else if (this.$utils.empty(this.takenStatus)) {
          this.parentData.UNTAKEN_TAKEN_STATUS = '已領件'
        }
      }
      this.skipTakenDateUpdate = false
      this.updateDebounced()
    },
    takenStatus (val) {
      if (!this.skipTakenStatusUpdate) {
        this.skipTakenDateUpdate = true
        if (this.$utils.empty(val)) {
          this.parentData.UNTAKEN_TAKEN_DATE = null
        } else if (this.$utils.empty(this.takenDate)) {
          this.parentData.UNTAKEN_TAKEN_DATE = new Date()
        }
      }
      this.skipTakenStatusUpdate = false
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
    },
    selectUser () {
      this.modal(this.$createElement('lah-user-select', {
        props: {
          initKeyword: this.borrowerName
        },
        on: {
          update: (payload) => { this.parentData.UNTAKEN_BORROWER = payload.detail },
          clean: () => { this.parentData.UNTAKEN_BORROWER = '' }
        }
      }), {
        title: `選擇借閱人 - ${this.parentData.收件字號}`,
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped></style>
