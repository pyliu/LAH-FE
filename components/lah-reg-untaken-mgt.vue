/* eslint-disable no-irregular-whitespace */
<template lang="pug">
.text-left(
  :title="`${$utils.caseId(caseId)}`"
  v-if="ready"
  v-b-tooltip.hover.left.v-info
  :class="styling"
)
  div(v-if="showTakenFields")
    .d-flex.text-nowrap.mb-1
      .my-auto.mr-1 領件狀態
      b-select(
        v-model="parentData.UNTAKEN_TAKEN_STATUS"
        :options="statusOpts"
        size="sm"
      )

    .d-flex.text-nowrap.mb-1
      .my-auto.mr-1 更新日期
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
      strong.my-auto.mr-1(v-if="!$utils.empty(borrower)") {{ borrower }}:{{ borrowerName }}
      lah-button(
        no-icon-gutter
        icon="user-friends"
        title="選擇"
        @click="selectUser"
        :variant="$utils.empty(borrower) ? 'outline-dark' : 'dark'"
      )

    .d-flex.text-nowrap.mb-1(v-if="showLentDate")
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

    .d-flex.text-nowrap.mb-1(v-if="showReturnDate")
      .my-auto.mr-1 歸還日期
      b-datepicker(
        size="sm"
        variant="primary"
        v-model="parentData.UNTAKEN_RETURN_DATE"
        placeholder="設定借閱歸還日期"
        boundary="viewport"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
        :min="returnDateMin"
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

  b-modal(
    ref="borrower"
    size="xl"
    hide-footer
    centered
    scrollable
  )
    template(#modal-title) 選擇借閱人 - {{ $utils.caseId(parentData.ID) }}
    lah-user-select(:init-keyword="borrowerName" @update="borrowerSelected" @clean="borrowerClean")
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
  name: 'LahRegUntakenMgt',
  components: { lahUserSelect },
  mixins: [regCaseBase],
  data: () => ({
    noteFlag: false,
    minDate: new Date(),
    maxDate: new Date(),
    statusOpts: ['', '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄到家', 'i領件', 'i郵箱'],
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
    returnDateMin () {
      return new Date(this.lentDate)
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
    showReturnDate () {
      return this.lentDate !== null && this.lentDate !== ''
    },
    showLentDate () {
      return this.borrower !== ''
    },
    showTakenFields () {
      return this.borrower === '' ||
             (this.returnDate !== null && this.returnDate !== '')
    },
    styling () {
      if (this.takenStatus !== '') { return ['bg-success', 'text-white', 'p-1'] }
      if (this.borrower !== '' && this.$utils.empty(this.returnDate)) { return ['bg-warning', 'p-1'] }
      if (!this.$utils.empty(this.returnDate)) { return ['bg-light', 'p-1'] }
      return []
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
    lentDate (val) {
      // if (this.$utils.empty(this.parentData.UNTAKEN_LENT_DATE)) {
      //   this.parentData.UNTAKEN_BORROWER = ''
      // }
      if (this.$utils.empty(val)) {
        this.parentData.UNTAKEN_RETURN_DATE = null
      }
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
    borrowerSelected (payload) {
      this.parentData.UNTAKEN_BORROWER = payload.detail
      this.parentData.UNTAKEN_LENT_DATE = new Date()
      this.parentData.UNTAKEN_RETURN_DATE = null
      this.$refs.borrower.hide()
    },
    borrowerClean () {
      this.parentData.UNTAKEN_BORROWER = ''
      this.parentData.UNTAKEN_LENT_DATE = null
      this.parentData.UNTAKEN_RETURN_DATE = null
    },
    selectUser () {
      this.$refs.borrower.show()
    }
  }
}
</script>

<style lang="scss" scoped></style>
