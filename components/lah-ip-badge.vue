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
  span(v-if="!$utils.empty(port)") :{{ port }}
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
    port: { type: Number, default: 0 },
    pill: { type: Boolean, default: true },
    badge: { type: Boolean, default: true },
    size: { type: String, default: 'md' },
    badgeVariant: { type: String, default: 'light' },
    period: { type: Number, default: -1 }
  },
  data: () => ({
    latency: -1,
    message: ''
  }),
  computed: {
    variant () {
      if (this.latency > 200) {
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
    if (this.period > 0) {
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
        port: this.port
      }).then(({ data }) => {
        this.message = data.message
        if (this.$utils.statusCheck(data.status)) {
          this.latency = data.latency
        } else {
          this.warning(data.message)
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        if (this.period > 0) {
          this.timeout(this.ping, this.period)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
