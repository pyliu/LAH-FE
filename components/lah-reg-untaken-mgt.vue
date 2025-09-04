/* eslint-disable no-irregular-whitespace */
<template lang="pug">
div
  .text-left(
    v-if="editable",
    v-b-tooltip.hover.left.v-danger
    :title="dataChanged ? '請儲存更新狀態 ... ' : ``"
    :class="modifiedMark"
  )
    div
      .d-flex.text-nowrap.mb-1
        .my-auto 領件狀態
        b-select(
          v-model="parentData.UNTAKEN_TAKEN_STATUS",
          :options="statusOpts",
          size="sm"
        )
        b-button-group.ml-1(v-if="dataChanged", size="sm")
          lah-button(
            ref="countdown"
            icon="edit",
            variant="outline-primary",
            badge-variant="secondary"
            title="儲存",
            @click="update",
            :disabled="!dataChanged",
            no-icon-gutter
          )
          lah-button.ml-1(
            icon="undo",
            action="cycle-alt",
            variant="success",
            title="還原前設定值",
            @click="backOrigData"
            :disabled="!dataChanged"
            no-icon-gutter
          )

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(takenStatus)")
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

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(takenStatus)")
        .my-auto.mr-1 領件時間
        b-timepicker(
          v-model="editableTime",
          locale="zh-TW",
          size="sm",
          placeholder="設定領件時間",
          show-seconds,
          label-no-time-selected="未選擇時間",
          label-close-button="關閉"
        )

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(setter) && !$utils.empty(takenStatus)")
        .my-auto.mr-1 發件人員
        div {{ setter }} {{ setterName }}
      div
        .d-flex.text-nowrap.mb-1
          .my-auto.mr-1.text-nowrap 　借閱人
          strong.my-auto.mr-1(:title="`${borrower} ${borrowerName}`") {{ borrowerName }}
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
import lahUserSelect from '~/components/lah-user-select.vue'
import regCaseBase from '~/mixins/lah-reg-case-base.js'

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
    statusOpts: [{
      text: '未領件',
      value: ''
    }, '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄', 'i領件'],
    debounceMs: 30 * 1000,
    origData: {},
    editableTime: ''
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
               this.origData.taken_status !== this.updateData.taken_status ||
               this.isTakenDateChanged
      }
      return false
    },
    takenDate () {
      try {
        if (typeof this.parentData.UNTAKEN_TAKEN_DATE === 'string' && !this.$utils.empty(this.parentData.UNTAKEN_TAKEN_DATE)) {
          return new Date(this.parentData.UNTAKEN_TAKEN_DATE)
        }
        return this.parentData.UNTAKEN_TAKEN_DATE || ''
      } finally {
        // need to sync editableTime when takenDate changed outside
        this.$nextTick(() => {
          this.editableTime = this.$utils.formatTime(this.parentData.UNTAKEN_TAKEN_DATE)
        })
      }
    },
    isTakenDateChanged () {
      const origDate = this.origData.taken_date
      const newDate = this.updateData.taken_date

      const isOrigValid = this.$utils.isValidDateObject(origDate)
      const isNewValid = this.$utils.isValidDateObject(newDate)

      // 情況1：兩者都是有效的 Date 物件
      if (isOrigValid && isNewValid) {
        // 比較時間戳 (timestamp) 是最準確的方式
        return origDate.getTime() !== newDate.getTime()
      }

      // 情況2：其中一個有效，另一個無效 (例如從 null 變為 Date，或反之)
      // 這種情況兩者的有效性必定不同 (true !== false)，代表已變更
      // 如果兩者都無效 (例如 null 和 '' or undefined)，有效性相同 (false !== false)，代表未變更
      return isOrigValid !== isNewValid
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
    setter () {
      return this.parentData.UNTAKEN_NOTE || ''
    },
    setterName () {
      return this.userNames[this.setter] || ''
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
      return []
    },
    updateData () {
      return {
        id: this.caseId,
        taken_date: this.$utils.isValidDateObject(this.takenDate) ? this.takenDate : '',
        taken_status: this.takenStatus,
        lent_date: this.lentDate,
        return_date: this.returnDate,
        borrower: this.borrower,
        note: this.$utils.empty(this.takenStatus) ? '' : this.note || this.user.id
      }
    },
    editable () {
      // open to all by reg section asked ...
      return true
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
      try {
        // 同步更新 editableTime
        if (this.$utils.isValidDateObject(val)) {
          // if time is 00:00:00, it means the date is changed from datepicker, so set current time
          if (val.getHours() === 0 && val.getMinutes() === 0 && val.getSeconds() === 0) {
            const now = new Date()
            val.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
          }
          // only when editableTime is empty then sets current time to it
          if (this.$utils.empty(this.editableTime)) {
            this.editableTime = this.$utils.formatTime(val)
          } else {
            // set current editableTime back to val
            const [hours, minutes, seconds] = this.editableTime.split(':')
            val.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
          }
        }
        this.updateDebounced()
      } catch (error) {
        this.$utils.warn('無法變更取件時間', error)
      }
    },
    editableTime (newTimeStr) {
      // this.$utils.warn('editableTime changed', newTimeStr, this.takenDate)
      if (newTimeStr && this.$utils.isValidDateObject(this.takenDate)) {
        const [hours, minutes, seconds] = newTimeStr.split(':')
        const newDate = new Date(this.takenDate)
        newDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))

        if (newDate.getTime() !== this.takenDate.getTime()) {
          this.parentData.UNTAKEN_TAKEN_DATE = newDate
        }
      }
    },
    takenStatus (val) {
      if (this.$utils.empty(val)) {
        this.parentData.UNTAKEN_TAKEN_DATE = null
      } else if (this.$utils.empty(this.takenDate)) {
        this.parentData.UNTAKEN_TAKEN_DATE = new Date()
      }
      this.updateDebounced()
    },
    lentDate (val) {
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
    caseId (val) {
      this.minDate = this.$utils.twToAdDateObj(this.parentData.RM58_1)
      if (this.$utils.isValidDateObject(this.takenDate)) {
        this.editableTime = ''
      } else {
        try {
          this.editableTime = this.$utils.formatTime(this.takenDate)
        } catch (error) {
          this.$utils.warn('caseId changed 無法設定取件時間', error)
        }
      }
      this.syncOrigData()
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    !this.$utils.empty(this.note) && (this.noteFlag = true)
    this.updateDebounced = this.$utils.debounce(this.update, this.debounceMs)
    this.syncOrigData()
    // to make init state for dataChanged correctly
    this.timeout(() => {
      try {
        this.editableTime = this.$utils.formatTime(this.takenDate)
        // this.$utils.warn(`${this.caseId} editableTime init 👉 `, this.editableTime, this.takenDate)
      } catch (error) {
        this.$utils.warn('無法回復取件時間', error)
      }
    }, 400)
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
            this.$utils.warn(`${this.caseId} upd_reg_cert_taken_date failed`, data.message)
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
      this.parentData.UNTAKEN_TAKEN_DATE = this.origData.taken_date ? new Date(this.origData.taken_date) : null
      this.parentData.UNTAKEN_LENT_DATE = this.origData.lent_date ? new Date(this.origData.lent_date) : null
      this.parentData.UNTAKEN_RETURN_DATE = this.origData.return_date ? new Date(this.origData.return_date) : null
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
