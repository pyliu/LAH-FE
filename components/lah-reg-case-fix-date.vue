<template lang="pug">
  div(v-if="ready")
    b-datepicker(
      v-model="deliveredDate"
      placeholder="補正通知書送達日期"
      boundary="viewport"
      :title="`${$utils.caseId(caseId)}`"
      label-help="可使用方向鍵操作移動"
      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
      hide-header
      dropleft
      v-b-tooltip.hover.left
    )
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
    deliveredDate: ''
  }),
  fetch () {
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
      }
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    deliveredDate (val) {
      this.isBusy = true
      // to update delivered date in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_fix_case_delivered_date',
        id: this.caseId,
        date: val,
        note: ''
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
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
  },
  mounted () {
    this.trigger('ready', this.ready)
  }
}
</script>

<style lang="scss" scoped></style>
