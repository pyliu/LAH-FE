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
          v-model="updateData.taken_status",
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

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(updateData.taken_status)")
        .my-auto.mr-1 領件日期
        b-datepicker(
          v-model="updateData.taken_date"
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

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(updateData.taken_status)")
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

      .d-flex.text-nowrap.mb-1(v-if="!$utils.empty(setter) && !$utils.empty(updateData.taken_status)")
        .my-auto.mr-1 發件人員
        div {{ setter }} {{ setterName }}
      div
        .d-flex.text-nowrap.mb-1
          .my-auto.mr-1.text-nowrap 　借閱人
          strong.my-auto.mr-1(:title="`${updateData.borrower} ${borrowerName}`") {{ borrowerName }}
          lah-button(
            icon="user-friends",
            title="選擇",
            size="sm",
            @click="selectUser",
            :variant="$utils.empty(updateData.borrower) ? 'outline-dark' : 'dark'",
            no-icon-gutter
          )
          lah-button.border-0.ml-1(
            v-if="updateData.return_date === null && hasBorrower",
            icon="delete-left",
            variant="outline-danger",
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
            v-model="updateData.lent_date"
            placeholder="借閱日期"
            title="點選設定借閱日期"
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
            value-as-date
          )

        .d-flex.text-nowrap.mb-1(v-if="showReturnDate")
          .my-auto.mr-1 歸還日期
          b-datepicker(
            size="sm"
            variant="primary"
            v-model="updateData.return_date"
            placeholder="點選設定"
            title="點選設定借閱歸還日期"
            boundary="viewport"
            :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
            :max="maxDate"
            :state="updateData.return_date !== null"
            label-help="使用方向鍵操作移動日期"
            hide-header
            dropleft
            today-button
            label-today-button="今天"
            reset-button
            label-reset-button="重設"
            close-button
            label-close-button="關閉"
            value-as-date
          )

  .text-left(v-else)
    div(:class="statusCss") {{ statusText }}
    .text-nowrap(v-if="hasBorrower") 借閱人：{{ updateData.borrower }} {{ borrowerName }}

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
  name: 'LahRegUntakenMgt',
  components: { lahUserSelect },
  mixins: [regCaseBase],
  data: () => ({
    minDate: new Date(),
    maxDate: new Date(),
    statusOpts: [
      { text: '未領件', value: '' },
      '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄', 'i領件'
    ],
    origData: {}, // Stores the original state of the data
    updateData: { // Represents the current, possibly modified state
      id: '',
      taken_date: null,
      taken_status: '',
      lent_date: null,
      return_date: null,
      borrower: '',
      note: ''
    },
    editableTime: ''
  }),
  computed: {
    dataChanged () {
      if (this.$utils.empty(this.origData)) {
        return false
      }
      // Normalize and compare the original and current data states
      const normalizedOrig = JSON.stringify(this.normalizeData(this.origData))
      const normalizedUpdate = JSON.stringify(this.normalizeData(this.updateData))
      return normalizedOrig !== normalizedUpdate
    },
    setter () {
      return this.updateData.note || ''
    },
    setterName () {
      return this.userNames[this.setter] || ''
    },
    borrowerName () {
      return this.userNames[this.updateData.borrower] || ''
    },
    hasBorrower () {
      return !this.$utils.empty(this.updateData.borrower)
    },
    showLentDate () {
      return !this.$utils.empty(this.updateData.borrower)
    },
    showReturnDate () {
      return this.updateData.lent_date !== null
    },
    modifiedMark () {
      return this.dataChanged ? ['update-mark'] : []
    },
    editable () {
      return true
    },
    statusText () {
      return this.$utils.empty(this.updateData.taken_status) ? '尚未設定領件狀態' : this.updateData.taken_status
    },
    statusCss () {
      return this.$utils.empty(this.updateData.taken_status) ? ['text-danger'] : ['text-success']
    }
  },
  watch: {
    // Watch parentData to initialize/reset the component's state
    parentData: {
      handler (val) {
        this.initializeData(val)
      },
      immediate: true,
      deep: true
    },
    'updateData.taken_date' (val) {
      if (this.$utils.isValidDateObject(val)) {
        if (val.getHours() === 0 && val.getMinutes() === 0 && val.getSeconds() === 0) {
          const now = new Date()
          val.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
        }
        if (this.$utils.empty(this.editableTime)) {
          this.editableTime = this.$utils.formatTime(val)
        } else {
          const [hours, minutes, seconds] = this.editableTime.split(':')
          val.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
        }
      }
    },
    'updateData.taken_status' (val) {
      if (this.$utils.empty(val)) {
        this.updateData.taken_date = null
        this.editableTime = ''
      } else if (!this.updateData.taken_date) {
        this.updateData.taken_date = new Date()
      }
    },
    editableTime (newTimeStr) {
      if (newTimeStr && this.$utils.isValidDateObject(this.updateData.taken_date)) {
        const [hours, minutes, seconds] = newTimeStr.split(':')
        const newDate = new Date(this.updateData.taken_date)
        newDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
        if (newDate.getTime() !== this.updateData.taken_date.getTime()) {
          this.updateData.taken_date = newDate
        }
      }
    }
  },
  created () {
    if (!this.parentData && !this.caseId) {
      this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    }
    this.minDate = this.$utils.twToAdDateObj(this.parentData.RM58_1)
  },
  methods: {
    // A helper function to normalize data for comparison
    normalizeData (data) {
      return {
        ...data,
        taken_date: data.taken_date ? new Date(data.taken_date).toISOString() : null,
        lent_date: data.lent_date ? new Date(data.lent_date).toISOString() : null,
        return_date: data.return_date ? new Date(data.return_date).toISOString() : null
      }
    },
    initializeData (sourceData) {
      const newData = {
        id: this.caseId,
        // Use lodash "get" to safely get values, providing defaults
        taken_status: this.$utils.get(sourceData, 'UNTAKEN_TAKEN_STATUS', ''),
        borrower: this.$utils.get(sourceData, 'UNTAKEN_BORROWER', ''),
        note: this.$utils.get(sourceData, 'UNTAKEN_NOTE', ''),
        taken_date: sourceData.UNTAKEN_TAKEN_DATE ? new Date(sourceData.UNTAKEN_TAKEN_DATE) : null,
        lent_date: sourceData.UNTAKEN_LENT_DATE ? new Date(sourceData.UNTAKEN_LENT_DATE) : null,
        return_date: sourceData.UNTAKEN_RETURN_DATE ? new Date(sourceData.UNTAKEN_RETURN_DATE) : null
      }

      this.updateData = { ...newData }
      this.origData = { ...newData } // Store a clean copy

      // Sync time display
      if (this.updateData.taken_date) {
        this.editableTime = this.$utils.formatTime(this.updateData.taken_date)
      } else {
        this.editableTime = ''
      }
    },
    update () {
      if (this.dataChanged && !this.isBusy) {
        this.isBusy = true
        // Prepare data for API, converting Date objects to a suitable string format if needed
        const payload = {
          ...this.updateData,
          note: this.$utils.empty(this.updateData.taken_status) ? '' : this.updateData.note || this.user.id,
          taken_date: this.updateData.taken_date || '',
          lent_date: this.updateData.lent_date || '',
          return_date: this.updateData.return_date || ''
        }
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...payload
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            // Sync origData with the new state after successful update
            this.origData = { ...this.updateData }
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
    backOrigData () {
      // Restore the editable data from the original snapshot
      this.updateData = { ...this.origData }
      // Also sync time display
      if (this.updateData.taken_date) {
        this.editableTime = this.$utils.formatTime(this.updateData.taken_date)
      } else {
        this.editableTime = ''
      }
    },
    borrowerSelected (payload) {
      this.updateData.borrower = payload.detail
      this.updateData.lent_date = new Date()
      this.updateData.return_date = null
      this.$refs.borrower.hide()
    },
    borrowerClean () {
      this.confirm('<p class="center">若想保存僅設定<strong class="text-danger">歸還日期</strong>即可。</p><strong class="h5 center">確定要清除借閱人設定 ❓</strong>', { title: '⚠ 清除借閱人' }).then((YN) => {
        if (!YN) { return }
        this.updateData.borrower = ''
        this.updateData.lent_date = null
        this.updateData.return_date = null
      }).catch(() => {
        // User cancelled the action
        this.$utils.warn('使用者取消清除借閱人設定')
      })
    },
    selectUser () {
      this.$refs.borrower.show()
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
::v-deep .form-control.form-control-sm {
  min-width: 115px;
}
</style>
