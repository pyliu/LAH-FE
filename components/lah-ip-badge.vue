<template lang="pug">
b-button(
  :variant="variant",
  :pill="pill",
  :size="size",
  @click="ping",
  title="重新測試",
  v-b-tooltip="message"
)
  span {{ ip }}
  span(v-if="validPort") :{{ port }}
  b-badge.ml-1(
    v-if="badge"
    :variant="badgeVariant"
  ) {{ parseFloat(latency).toFixed(1) }} ms
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    ip: { type: String, default: '127.0.0.1', require: true },
    port: { type: String, default: '0' },
    pill: { type: Boolean, default: true },
    badge: { type: Boolean, default: true },
    size: { type: String, default: 'md' },
    badgeVariant: { type: String, default: 'light' },
    period: { type: String, default: '' }
  },
  data: () => ({
    latency: -1,
    message: ''
  }),
  computed: {
    validPeriod () {
      const periodInt = parseInt(this.period)
      return periodInt > 0
    },
    validPort () {
      const portInt = parseInt(this.port)
      return portInt > 0 && portInt < 65535
    },
    variant () {
      if (this.latency > 200 || parseFloat(this.latency) === 0.0) {
        return 'danger'
      } else if (this.latency > 50) {
        return 'warning'
      } else if (this.latency > 0) {
        return 'success'
      }
      return 'secondary'
    }
  },
  watch: {},
  created () {},
  mounted () {
    if (this.validPeriod) {
      this.ping()
    }
  },
  methods: {
    ping () {
      this.isBusy = true
      this.latency = -1
      this.message = ''
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'ping',
        ip: this.ip,
        port: this.validPort ? this.port : ''
      }).then(({ data }) => {
        this.message = data.message
        this.latency = data.latency
        if (!this.$utils.statusCheck(data.status)) {
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        if (this.validPeriod) {
          this.timeout(this.ping, parseInt(this.period))
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
