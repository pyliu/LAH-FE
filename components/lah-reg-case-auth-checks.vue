<template lang="pug">
  .d-flex.justify-content-around(v-if="ready")
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
    RM45: undefined,
    RM47: undefined,
    CHIEF: undefined,
    note: undefined
  }),
  fetch () {
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
        const authority = parseInt(data.raw.authority)
        this.RM45 = (authority & 1) === 1
        this.RM47 = (authority & 2) === 2
        this.CHIEF = (authority & 8) === 8
        this.note = data.raw.note
      } else {
        // To initialize data
        this.RM45 = false
        this.RM47 = false
        this.CHIEF = false
        this.note = ''
      }
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  computed: {
    light () {
      if (!this.$utils.empty(this.deliveredDate)) {
        if (this.today >= this.rejectDate) { return 'red' }
        if (this.today === this.dueDate) { return 'yellow' }
      }
      return 'green'
    }
  },
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    },
    RM45 (n, o) {
      o !== undefined && this.updateDebounced()
    },
    RM47 (n, o) {
      o !== undefined && this.updateDebounced()
    },
    CHIEF (n, o) {
      o !== undefined && this.updateDebounced()
    },
    note (n, o) {
      o !== undefined && this.updateDebounced()
    }
  },
  created () {
    !this.parentData && !this.caseId && this.$utils.error('No :parent-data or :case-id attribute specified for this component!')
    this.updateDebounced = this.$utils.debounce(this.update, 1000)
  },
  mounted () {
    this.trigger('ready', this.ready)
  },
  methods: {
    toggle (target) {
      target === 'RM45' && (this.RM45 = !this.RM45)
      target === 'RM47' && (this.RM47 = !this.RM47)
      target === 'CHIEF' && (this.CHIEF = !this.CHIEF)
    },
    update () {
      let calculated = 0
      this.RM45 && (calculated = calculated + 1)
      this.RM47 && (calculated = calculated + 2)
      this.CHIEF && (calculated = calculated + 8)
      // to update authority integer in sqlite db
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'upd_reg_auth_checks',
        id: this.caseId,
        authority: calculated,
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
