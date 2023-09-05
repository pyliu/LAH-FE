<template lang="pug">
b-button(
  :variant="fill ? variant : outlineVariant",
  :pill="pill",
  :size="size",
  @click="check",
  title="重新測試",
  v-b-tooltip="message"
)
  span.my-auto(v-if="!fill") {{ lightIcon }}
  span {{ name }}
  b-badge.ml-1(
    v-if="badge && status < 1 && status !== -2"
    :variant="badgeVariant"
  ) {{ headers[0] }}
</template>

<script>
export default {
  emit: ['updated'],
  component: {},
  props: {
    watchSite: { type: String, default: 'HX', require: true },
    pill: { type: Boolean, default: false },
    badge: { type: Boolean, default: true },
    size: { type: String, default: 'md' },
    badgeVariant: { type: String, default: 'light' },
    period: { type: String, default: '' },
    fill: { type: Boolean, default: true },
    short: { type: Boolean, default: false }
  },
  data: () => ({
    status: 0,
    headers: [],
    message: '',
    timer: null
  }),
  computed: {
    validPeriod () {
      const periodInt = parseInt(this.period)
      return periodInt > 0
    },
    variant () {
      if (this.status > 0) {
        return 'success'
      }
      if (this.status === -2) {
        return 'warning'
      }
      return 'danger'
    },
    outlineVariant () {
      if (this.status > 0) {
        return 'outline-success'
      }
      if (this.status === -2) {
        return 'outline-warning'
      }
      return 'outline-danger'
    },
    name () {
      // xapMap from store
      const xaps = [...this.xapMap]
      // item: ['220.1.XX.XX', { name: 'XXX', code: 'XX', ip: '220.1.XX.XX' }]
      const found = xaps.find(item => item[1].code === this.watchSite)
      const name = found ? found[1]?.name : this.watchSite
      return this.short ? name.replace(/所/g, '') : name
    },
    lightIcon () {
      if (this.status > 0) {
        return '🟢'
      }
      if (this.status === -2) {
        return '🟡'
      }
      return '🔴'
    }
  },
  watch: {},
  created () {},
  mounted () {
    this.check()
  },
  beforeDestroy () {
    clearTimeout(this.timer)
  },
  methods: {
    check () {
      this.isBusy = true
      this.message = '測試中 ... '
      this.status = -2
      clearTimeout(this.timer)
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'check_site_http',
        site: this.watchSite
      }).then(({ data }) => {
        this.message = data.message
        this.headers = [...data.raw]
        this.status = data.status
        if (!this.$utils.statusCheck(this.status)) {
          this.$utils.warn(data.message)
        }
        this.$emit('updated', data)
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        if (this.validPeriod) {
          this.timeout(this.check, parseInt(this.period)).then((handler) => { this.timer = handler })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
