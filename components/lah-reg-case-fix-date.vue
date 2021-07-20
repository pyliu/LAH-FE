<template lang="pug">
  div(v-if="ready")
    b-datepicker(
      v-model="deliveredDate"
      placeholder="補正通知書送達日期"
      boundary="viewport"
      :title="`${$utils.caseId(caseId)}`"
      :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
      :min="minDate"
      label-help="可使用方向鍵操作移動"
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
    deliveredDate: '',
    minDate: new Date()
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
    // RM51: 通知補正日
    const rm51 = this.bakedData.RM51
    if (!this.$utils.empty(rm51)) {
      const Y = rm51.substring(0, 3) - 0 + 1911
      const M = rm51.substring(3, 5) - 0 - 1
      const D = rm51.substring(5, 7) - 0
      this.minDate = new Date(Y, M, D)
    }
    this.trigger('ready', this.ready)
  },
  methods: {}
}
</script>

<style lang="scss" scoped></style>
