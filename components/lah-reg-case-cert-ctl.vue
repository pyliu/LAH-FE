<template lang="pug">
  .text-left(v-if="ready")
    .d-flex
      b-datepicker(
        size="sm"
        variant="primary"
        v-model="parentData.CERT_CTL.cert_taken_date"
        placeholder="請設定領件日期"
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
      v-model="parentData.CERT_CTL.note"
      size="sm"
      trim
    )
    .p-1.mt-1(:class="classes" v-if="!$utils.empty(takenDate)")
      div 到期日期：{{ dueDate }}
      div 可駁回日：{{ rejectDate }}
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
  name: 'lah-reg-case-cert-ctl',
  mixins: [regCaseBase],
  data: () => ({
    noteFlag: false,
    minDate: new Date()
  }),
  fetch () {
    !this.$utils.empty(this.note) && (this.noteFlag = true)
  },
  computed: {
    takenDate () {
      return this.parentData.CERT_CTL.cert_taken_date
    },
    note () {
      return this.parentData.CERT_CTL.note
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
    cert_taken_date (val) {
      this.update()
    },
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
    // RM58_1: 結案日期
    this.minDate = this.$utils.twToAdDateObj(this.bakedData.RM5_1)
    this.trigger('ready', this.ready)
  },
  methods: {
    load () {
      // get the date string from sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_cert_taken_date',
        id: this.caseId
      }).then(({ data }) => {
        /** expected raw json data format e.g.
         * case_no: "110HHA1017620"
         * note: "測試"
         * notify_delivered_date: "2021/07/20"
         */
        if (data.raw) {
          this.takenDate = data.raw.notify_delivered_date
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
        type: 'upd_reg_fix_case_delivered_date',
        id: this.caseId,
        date: this.takenDate,
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
