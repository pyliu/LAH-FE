/* eslint-disable no-irregular-whitespace */
<template lang="pug">
//- h6(v-if="$utils.empty(caseNo)") ⚠️ 無申報序號
//- div(v-else)
div
  .text-left(
    v-b-tooltip.hover.left.v-danger
    :title="dataChanged ? '請儲存更新狀態 ... ' : ``"
    :class="modifiedMark"
  )
    .d-flex.text-nowrap.mb-1
      b-datepicker(
        size="sm"
        variant="primary"
        v-model="parentData.P1MP_DECLARE_DATE"
        placeholder="選擇申報日期"
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
      lah-button.ml-1(
        icon="edit",
        size="sm",
        variant="outline-primary",
        title="立即更新",
        :disabled="noteState === false"
        @click="update",
        no-icon-gutter
      )

    .d-flex.text-nowrap.mb-1
      b-textarea(
        v-show="showNote",
        v-model="parentData.P1MP_DECLARE_NOTE",
        placeholder="... 申報備註資料 (最多200字) ...",
        size="sm",
        :state="noteState",
        trim
      )
    lah-transition: .text-right.small(
      v-if="displayMessage"
      :class="messageVariant"
    ) {{ message }}
</template>

<script>
export default {
  name: 'LahValRealpriceMemo',
  emit: ['update'],
  props: {
    parentData: { type: Object, require: true, default: () => ({}) }
  },
  data: () => ({
    maxDate: new Date(),
    debounceMs: 30 * 1000,
    origData: {
      declare_date: '',
      declare_note: ''
    },
    message: '',
    messageVariant: 'text-secondary',
    displayMessage: false
  }),
  computed: {
    dataChanged () {
      // pagination will re-use the same component in b-table ...
      // I need a way to determine if it is a user triggered data change
      if (!this.$utils.empty(this.caseNo)) {
        return this.origData.declare_date !== this.declareDate ||
               this.origData.declare_note !== this.declareNote
      }
      return false
    },
    caseNo () {
      return this.parentData?.P1MP_CASENO
    },
    declareDate () {
      return this.parentData?.P1MP_DECLARE_DATE || ''
    },
    declareNote () {
      return this.parentData?.P1MP_DECLARE_NOTE || ''
    },
    showNote () {
      return !this.$utils.empty(this.declareDate)
    },
    noteLength () {
      return this.$utils.length(this.declareNote)
    },
    noteState () {
      if (this.$utils.empty(this.declareNote)) {
        return null
      }
      return this.noteLength < 201
    },
    modifiedMark () {
      if (this.dataChanged) { return ['update-mark'] }
      if (!this.$utils.empty(this.declareDate)) { return ['green-mark'] }
      return []
    },
    updateData () {
      return {
        case_no: this.caseNo,
        declare_date: this.declareDate,
        declare_note: this.declareNote
      }
    }
  },
  watch: {
    parentData (dontcare) {
      this.syncOrigData()
    },
    noteState (val) {
      if (val === false) {
        this.message = '❌ 註記字數超過200字！'
        this.messageVariant = 'text-danger'
      }
    },
    message (val) {
      if (val !== '') {
        this.displayMessage = true
        this.autoHideMessage()
      }
    }
  },
  created () {
    this.syncOrigData()
    this.autoHideMessage = this.$utils.debounce(() => {
      this.message = ''
      this.displayMessage = false
      this.messageVariant = 'text-secondary'
    }, 5000)
  },
  methods: {
    update () {
      if (!this.$utils.empty(this.caseNo) && !this.isBusy) {
        this.isBusy = true
        // to update declare data in sqlite db
        this.$axios.post(this.$consts.API.JSON.MOIPRC, {
          type: 'upd_val_realprice_memo',
          case_no: this.caseNo,
          declare_date: this.declareDate,
          declare_note: this.declareNote
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.message = '✔ 更新完成！'
            this.messageVariant = 'text-success'
            this.syncOrigData()
            this.$emit('update')
          } else {
            this.message = `⚠ ${data.message}`
            this.messageVariant = 'text-warning'
            this.warning(data.message, { title: this.parentData.P1MP_CASENO })
            this.$utils.warn(this.caseNo, data.message)
          }
        }).catch((err) => {
          this.message = `❌ ${err.message}`
          this.messageVariant = 'text-danger'
          this.alert(err.message, { title: this.parentData.P1MP_CASENO })
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.warning(`${this.caseNo} 沒有更新`)
      }
    },
    syncOrigData () {
      if (!this.$utils.empty(this.caseNo)) {
        this.origData.declare_date = this.declareDate
        this.origData.declare_note = this.declareNote
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.update-mark {
  border: 2px dashed red;
  border-radius: 5px;
  padding: .5rem;
}
.green-mark {
  border: 2px solid green;
  border-radius: 5px;
  padding: .5rem;
}
</style>
