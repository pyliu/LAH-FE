/* eslint-disable no-irregular-whitespace */
<template lang="pug">
div
  .text-left(
    v-if="editable",
    v-b-tooltip.hover.left.v-danger
    :title="dataChanged ? '請儲存更新狀態 ... ' : ``"
    :class="modifiedMark"
  )
    //- div(v-if="showTakenFields")
    div
      .d-flex.text-nowrap.mb-1
        .my-auto.mr-1 領件狀態
        b-select(
          v-model="parentData.UNTAKEN_TAKEN_STATUS",
          :options="statusOpts",
          size="sm"
        )
        lah-transition
          b-button-group.ml-1(
            v-if="dataChanged",
            size="sm"
          )
            lah-button(
              ref="countdown"
              icon="edit",
              variant="outline-primary",
              badge-variant="secondary"
              title="儲存",
              @click="update",
              no-icon-gutter
            )
            lah-button.ml-1(
              icon="undo",
              action="cycle-alt",
              variant="success",
              title="還原前設定值",
              @click="backOrigData"
              no-icon-gutter
            )

      .d-flex.text-nowrap.mb-1
        .my-auto.mr-1 領件日期
        b-datepicker(
          v-model="parentData.UNTAKEN_TAKEN_DATE"
          boundary="viewport"
          size="sm"
          variant="primary"
          placeholder="... 變更領件日期 ..."
          label-help="使用方向鍵操作移動日期"
          label-today-button="今天"
          label-reset-button="重設"
          label-close-button="關閉"
          :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
          :max="maxDate"
          hide-header
          today-button
          close-button
          reset-button
          value-as-date
        )

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(takenTime)")
        .my-auto.mr-1 領件時間
        .highlight-yellow {{ takenTime }}
    //- div(v-if="takenStatus === ''")
    div
      .d-flex.text-nowrap.mb-1
        .my-auto.mr-1.text-nowrap 　借閱人
        strong.my-auto.mr-1(v-if="!$utils.empty(borrower)") {{ borrower }}:{{ borrowerName }}
        lah-button(
          icon="user-friends",
          title="選擇",
          size="sm",
          @click="selectUser",
          :variant="$utils.empty(borrower) ? 'outline-dark' : 'dark'",
          no-icon-gutter
        )
        lah-button.ml-1(
          v-if="!$utils.empty(borrower)",
          icon="undo",
          action="cycle-alt",
          variant="secondary",
          size="sm",
          title="清除借閱人",
          @click="borrowerClean"
          no-icon-gutter
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
          :state="!$utils.empty(parentData.UNTAKEN_RETURN_DATE)"
        )

    .d-flex.text-nowrap.mb-1(v-if="false")
      b-checkbox.my-auto.mr-1.text-nowrap(v-model="noteFlag" size="sm") 備忘錄
      b-textarea(
        v-show="noteFlag"
        v-model="parentData.UNTAKEN_NOTE"
        size="sm"
        trim
      )

  .text-left(v-else)
    div(:class="statusCss") {{ statusText }}
    .text-nowrap(v-if="hasBorrower") 借閱人：{{ borrower }} {{ borrowerName }}

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
    statusOpts: ['', '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄', 'i領件'],
    skipTakenDateUpdate: false,
    skipTakenStatusUpdate: false,
    debounceMs: 30 * 1000,
    origData: {}
  }),
  computed: {
    dataChanged () {
      // pagination will re-use the same component in b-table ...
      // I need a way to determine if it is a user triggered data change
      if (!this.$utils.empty(this.origData)) {
        return this.origData.borrower !== this.updateData.borrower ||
               this.origData.id !== this.updateData.id ||
               this.origData.lent_date !== this.updateData.lent_date ||
               this.origData.return_date !== this.updateData.return_date ||
               this.origData.taken_date !== this.updateData.taken_date ||
               this.origData.taken_status !== this.updateData.taken_status
      }
      return false
    },
    takenDate () {
      return this.parentData.UNTAKEN_TAKEN_DATE || null
    },
    takenTime () {
      const ts = Date.parse(this.parentData.UNTAKEN_TAKEN_DATE)
      if (ts) {
        return this.$utils.formatTime(new Date(ts))
      }
      return ''
    },
    origTakenDate () {
      return this.origData.taken_date || ''
    },
    origTakenTime () {
      const ts = Date.parse(this.origData.taken_date)
      if (ts) {
        return this.$utils.formatTime(new Date(ts))
      }
      return this.takenTime
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
    hasBorrower () {
      return !this.$utils.empty(this.borrower)
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
    modifiedMark () {
      if (this.dataChanged) { return ['update-mark'] }
      // if (this.takenStatus !== '') { return ['bg-success', 'text-white', 'p-1'] }
      // if (this.borrower !== '' && this.$utils.empty(this.returnDate)) { return ['bg-warning', 'p-1'] }
      // if (!this.$utils.empty(this.returnDate)) { return ['bg-light', 'p-1'] }
      return []
    },
    updateData () {
      return {
        id: this.caseId,
        taken_date: this.takenDate,
        taken_status: this.takenStatus,
        lent_date: this.lentDate,
        return_date: this.returnDate,
        borrower: this.borrower,
        note: this.note
      }
    },
    editable () {
      // open to all by reg section asked ...
      return true
      // return this.parentData.RM45 === this.myid || this.parentData.RM59 === this.myid || this.authority.isChief || this.authority.isAdmin
    },
    statusText () {
      return this.$utils.empty(this.parentData.UNTAKEN_TAKEN_STATUS) ? '尚未設定領件狀態' : this.parentData.UNTAKEN_TAKEN_STATUS
    },
    statusCss () {
      return this.$utils.empty(this.parentData.UNTAKEN_TAKEN_STATUS) ? ['text-danger'] : ['text-success']
    }
  },
  watch: {
    takenDate (val) {
      if (!this.skipTakenDateUpdate) {
        this.skipTakenStatusUpdate = true
        if (this.$utils.empty(val)) {
          this.parentData.UNTAKEN_TAKEN_STATUS = ''
        } else if (this.$utils.empty(this.takenStatus)) {
          this.parentData.UNTAKEN_TAKEN_STATUS = '已領件'
        }
        if (val.setHours) {
          const now = new Date()
          val?.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
        }
      }
      this.skipTakenDateUpdate = false
      // this.$refs.countdown?.resetCountdown()
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
      // this.$refs.countdown?.resetCountdown()
      this.updateDebounced()
    },
    lentDate (val) {
      // if (this.$utils.empty(this.parentData.UNTAKEN_LENT_DATE)) {
      //   this.parentData.UNTAKEN_BORROWER = ''
      // }
      if (this.$utils.empty(val)) {
        this.parentData.UNTAKEN_RETURN_DATE = null
      }
      this.update()
    },
    returnDate (dontcare) {
      this.update()
    },
    borrower (dontcare) {
      this.update()
    },
    note (val) {
      this.update()
      this.noteFlag = !this.$utils.empty(val)
    },
    caseId (dontcare) {
    // RM58_1: 結案日期
      this.minDate = this.$utils.twToAdDateObj(this.parentData.RM58_1)
      this.syncOrigData()
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    !this.$utils.empty(this.note) && (this.noteFlag = true)
    this.updateDebounced = this.$utils.debounce(this.update, this.debounceMs)
    // to make init state for dataChanged correctly
    this.timeout(this.syncOrigData, 400)
  },
  methods: {
    update () {
      if (this.dataChanged && !this.isBusy) {
        this.isBusy = true
        // to update untaken data in sqlite db
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...this.updateData
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.syncOrigData()
          } else {
            // this.warning(data.message, { title: this.parentData.收件字號 })
            this.$utils.warn(this.caseId, data.message)
          }
        }).catch((err) => {
          this.alert(err.message, { title: this.parentData.收件字號 })
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
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
    },
    syncOrigData () {
      this.origData = { ...this.updateData }
    },
    backOrigData () {
      this.parentData.UNTAKEN_TAKEN_STATUS = this.origData.taken_status
      this.parentData.UNTAKEN_TAKEN_DATE = this.origData.taken_date
      this.parentData.UNTAKEN_LENT_DATE = this.origData.lent_date
      this.parentData.UNTAKEN_RETURN_DATE = this.origData.return_date
      this.parentData.UNTAKEN_BORROWER = this.origData.borrower
      this.parentData.UNTAKEN_NOTE = this.origData.note
    }
  }
}
</script>

<style lang="scss" scoped>
.update-mark {
  border: 2px dashed red;
  border-radius: 5px;
  padding: .25rem;
}
</style>
