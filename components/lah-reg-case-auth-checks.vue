<template lang="pug">
  b-button-group.d-flex.justify-content-around(
    v-if="ready"
    v-b-tooltip.hover.left.v-warning
    :title="`${$utils.caseId(caseId)}`"
    size="sm"
  )
    b-button(pill :variant="RM45 ? 'outline-success' : 'outline-secondary'" :pressed="RM45" @click="toggle('RM45')") 初審
    b-button.mx-1(pill :variant="RM47 ? 'outline-success' : 'outline-secondary'" :pressed="RM47" @click="toggle('RM47')") 複審
    b-button(pill :variant="CHIEF ? 'outline-success' : 'outline-secondary'" :pressed="CHIEF" @click="toggle('CHIEF')") 課長
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
  name: 'lah-reg-case-auth-checks',
  mixins: [regCaseBase],
  data: () => ({
    note: ''
  }),
  fetch () {
  },
  computed: {
    light () {
      if (this.CHIEF) { return 'bg-danger' }
      if (this.RM47) { return 'bg-warning' }
      if (this.RM45) { return 'bg-light' }
      return 'bg-muted'
    },
    authority () {
      return parseInt(this.parentData ? this.parentData.FINISH_NOTIFY_AUTHORITY : 0)
    },
    RM45 () {
      return (this.authority & 1) === 1
    },
    RM47 () {
      return (this.authority & 2) === 2
    },
    CHIEF () {
      return (this.authority & 8) === 8
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    note (n, o) {
      o !== undefined && this.updateDebounced()
    },
    authority () {
      this.update()
    }
  },
  created () {
    // parentData will assign to bakedData
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 1000)
  },
  mounted () {
    this.trigger('ready', this.ready)
  },
  methods: {
    toggle (target) {
      if (target === 'RM45') {
        if (this.RM45) {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority - 1
        } else {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority + 1
        }
      }
      if (target === 'RM47') {
        if (this.RM47) {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority - 2
        } else {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority + 2
        }
      }
      if (target === 'CHIEF') {
        if (this.CHIEF) {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority - 8
        } else {
          this.parentData.FINISH_NOTIFY_AUTHORITY = this.authority + 8
        }
      }
    },
    load () {
      this.isBusy = true
      // get the authority int from sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_auth_checks',
        id: this.caseId
      }).then(({ data }) => {
        /** expected raw json data format e.g.
         * case_no: "110HHA1017620"
         * note: "測試"
         * authority: "0"
         */
        if (data.raw) {
          this.parentData.FINISH_NOTIFY_AUTHORITY = parseInt(data.raw.authority)
          this.note = data.raw.note
        } else {
          this.notify(`${this.caseId} 無資料`, { type: 'warning' })
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    update () {
      // to update authority integer in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_auth_checks',
        id: this.caseId,
        authority: this.authority,
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
