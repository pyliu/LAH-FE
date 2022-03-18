<template lang="pug">
.d-flex.flex-nowrap.text-nowrap.p-1(:title="parentData.ID")
  b-checkbox.mr-2.my-auto(
    v-model="notifyFlag",
    switch
  ) {{ notifyFlag ? '是' : '否' }}
  lah-transition(speed="fastest"): b-input(
    v-if="notifyFlag",
    v-model="note",
    size="sm",
    placeholder="請輸入公文文號",
    title="請輸入公文文號",
    :state="validNote",
    trim
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
  name: 'LahRegCaseAuthChecks',
  mixins: [regCaseBase],
  data: () => ({
    notifyFlag: undefined,
    note: undefined,
    retried: 0
  }),
  fetch () {
  },
  computed: {
    validNote () {
      return !this.$utils.empty(this.note) && this.note.match(/^\d{12}$/) !== null
    },
    updateDataset () {
      return {
        id: this.caseId,
        authority: this.notifyFlag ? 1 : 0,
        note: this.note
      }
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    note (n, o) {
      if (n !== undefined) {
        this.parentData.CASE_NOTIFY_NOTE = n
        o !== undefined && this.updateDebounced()
      }
    },
    notifyFlag (flag, oFlag) {
      if (flag !== undefined) {
        this.parentData.CASE_NOTIFY_AUTHORITY = flag ? 1 : 0
        oFlag !== undefined && this.update()
      }
    },
    parentData (dontcare) {
      // to let the component refresh in b-table
      this.refresh()
    }
  },
  created () {
    // parentData will assign to bakedData
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 400)
    this.refresh()
  },
  mounted () {
    this.trigger('ready', this.ready)
  },
  methods: {
    refresh () {
      this.notifyFlag = parseInt(this.parentData.CASE_NOTIFY_AUTHORITY) === 1 // 1 means 需要辦畢通知
      this.note = this.parentData.CASE_NOTIFY_NOTE || ''
    },
    load () {
      this.notifyFlag = undefined
      this.note = undefined
      // get the authority int from sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_auth_checks',
        id: this.caseId
      }).then(({ data }) => {
        /** expected raw json data format e.g.
         * case_no: "110HHA1017620"
         * note: "公文號"
         * authority: "1"
         */
        if (data.raw) {
          this.parentData.CASE_NOTIFY_AUTHORITY = parseInt(data.raw.authority)
          this.notifyFlag = parseInt(this.parentData.CASE_NOTIFY_AUTHORITY) === 1
          this.parentData.CASE_NOTIFY_NOTE = this.note = data.raw.note
        } else {
          // this.$utils.warn(`${this.caseId} 無額外案件資料，使用預設值!`)
          this.notifyFlag = true
          this.parentData.CASE_NOTIFY_NOTE = ''
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        // this.$forceUpdate()
      })
    },
    update () {
      // to update authority integer in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_auth_checks',
        ...this.updateDataset
      }).then(({ data }) => {
        if (!this.$utils.statusCheck(data.status)) {
          if (this.retried < 5) {
            this.timeout(this.update, this.$utils.rand(800))
            this.retried++
          } else {
            this.$utils.warn(data.message, this.updateDataset)
          }
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
