<template lang="pug">
lah-fa-icon.small.text-nowrap(
  icon="clock",
  regular,
  :variant="variant",
  :title="switchFormat ? humanText() : adDatetime()",
  @click="switchFormat = !switchFormat",
  @mouseover="switchFormat = true",
  @mouseleave="delayReset"
) {{ switchFormat ? adDatetime() : humanText() }}
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    variant: { type: String, default: 'muted' },
    seconds: { type: Number, default: 0 },
    todayFullAdFormat: { type: Boolean, default: false },
    delay: { type: Number, default: 750 }
  },
  data: () => ({
    switchFormat: false
  }),
  computed: {},
  watch: {},
  created () {
    // this.timer = setInterval(() => { this.mouseoverFlag = !this.mouseoverFlag }, 1000)
    this.delayReset = this.$utils.debounce(() => { this.switchFormat = false }, parseInt(this.delay) || 750)
  },
  mounted () {},
  beforeDestroy () {
    // clearInterval(this.timer)
  },
  methods: {
    humanText (ts) {
      return this.$utils.formatDistanceToNow((ts || this.seconds) * 1000)
    },
    adDatetime (ts) {
      const d = this.$utils.phpTsToAdDateStr(ts || this.seconds, true)
      if (!this.todayFullAdFormat) {
        return d.replace(this.$utils.today(), '').trim()
      }
      return d
    },
    text () {

    }
  }
}
</script>

<style lang="scss" scoped>
</style>
