<template lang="pug">
.d-flex.justify-content-between.small.text-muted
  lah-countdown-button.border-0(
    size="sm",
    ref="countdown",
    icon="sync-alt",
    action="ld-cycle",
    auto-start,
    title="立即重新讀取",
    variant="outline-secondary",
    badge-variant="secondary",
    :milliseconds="reloadMs",
    :disabled="busy || fetchingMonitorMail",
    :busy="busy",
    @end="fetch",
    @click="reload"
  )
  lah-transition: .my-auto.small(v-if="displayFetchState") {{ fetchState }}
  lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updateTime }}
</template>

<script>
export default {
  name: 'LahMonitorBoardFooter',
  props: {
    reloadMs: { type: Number, require: true, default: 15 * 60 * 1000 },
    busy: { type: Boolean, require: true },
    fetch: { type: Function, require: true, default: () => {} },
    fetchState: { type: String, require: true, default: '' },
    reload: { type: Function, require: true, default: () => {} },
    updateTime: { type: String, require: true, default: '' }
  },
  computed: {
    displayFetchState () { return !this.$utils.empty(this.fetchState) }
  },
  methods: {
    reset (ms) {
      this.$refs.countdown.setCountdown(ms)
      this.$refs.countdown.startCountdown()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
