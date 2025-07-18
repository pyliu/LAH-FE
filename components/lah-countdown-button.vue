<template lang="pug">
lah-button.align-middle(
  ref="btn"
  :icon="icon"
  :variant="variantMediator"
  :size="size"
  :action="action"
  :busy="busy"
  :no-icon-gutter="noBadge"
  :disabled="busy"
  @click="$emit('click', $event)"
)
  slot
  b-badge.ml-1(v-show="!noBadge" ref="badge" :variant="badgeVariant")
    countdown(
      ref="cd"
      :time="milliseconds"
      :auto-start="false"
      @end="$emit('end', $event)"
      @start="$emit('start', $event)"
      @progress="handleProgress"
    ): template(slot-scope="props").
        #[span(v-if="props.hours > 0") {{ props.hours.toString().padStart(2, '0') }}:]
        #[span(v-if="props.minutes > 0") {{ props.minutes.toString().padStart(2, '0') }}:]{{ props.seconds.toString().padStart(2, '0') }}
    span.sr-only 倒數
</template>

<script>
import VueCountdown from '@chenfengyuan/vue-countdown'

export default {
  components: { countdown: VueCountdown },
  props: {
    variant: { type: String, default: 'primary' },
    badgeVariant: { type: String, default: 'light' },
    size: { type: String, default: '' },
    icon: { type: String, default: '' },
    milliseconds: { type: Number, default: 5 * 60 * 1000 },
    action: { type: String, default: '' },
    autoStart: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    noBadge: { type: Boolean, default: false },
    endAttention: { type: Boolean, default: true },
    endAttentionStartVariant: { type: String, default: 'warning' },
    endAttentionEndVariant: { type: String, default: 'danger' },
    endAttentionThreadhold: { type: Number, default: 10 }
  },
  data: () => ({
    variantMediator: 'primary'
  }),
  computed: {},
  watch: {
    variant (val) {
      this.variantMediator = val
    }
  },
  created () {
    this.variantMediator = this.variant
  },
  mounted () {
    if (this.autoStart) {
      this.startCountdown()
    }
    // console.warn(this.$refs.btn)
  },
  beforeDestroy () {
    this.pauseCountdown()
  },
  methods: {
    handleProgress (payload) {
      /* payload: {
          days: this.days,
          hours: this.hours,
          minutes: this.minutes,
          seconds: this.seconds,
          milliseconds: this.milliseconds,
          totalDays: this.totalDays,
          totalHours: this.totalHours,
          totalMinutes: this.totalMinutes,
          totalSeconds: this.totalSeconds,
          totalMilliseconds: this.totalMilliseconds
        }
      */
      if (!this.busy && this.$refs.btn) {
        // change button variant to indicate the time is running over (default is warning variantion)
        if (this.$refs.btn && this.endAttention && parseInt(payload.totalSeconds) === this.endAttentionThreadhold) {
          this.$refs.btn?.mouseenter()
          const oldVariant = this.variantMediator
          this.variantMediator = this.endAttentionStartVariant
          // almost reach end (default is danger variantion)
          this.timeout(() => {
            this.variantMediator = this.endAttentionEndVariant
          }, (this.endAttentionThreadhold / 2) * 1000)
          // clear animation when countdown is over
          this.timeout(() => {
            this.variantMediator = oldVariant
            this.$refs.btn?.mouseleave()
          }, this.endAttentionThreadhold * 1000)
        }
        if (parseInt(payload.totalSeconds) === 1) {
          // random effect, 0.5s
          this.attention(this.$el, { speed: 'faster' })
        }
      }
    },
    resetCountdown () {
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = this.milliseconds)
    },
    setCountdown (milliseconds) {
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = milliseconds || this.milliseconds)
    },
    startCountdown () {
      this.$refs.cd && this.$refs.cd.start()
      this.$refs.badge && this.attention(this.$refs.badge, { name: 'flash', speed: 'fast' })
    },
    endCountdown () {
      this.$refs.cd && this.$refs.cd.end()
    },
    pauseCountdown () {
      this.$refs.cd && this.$refs.cd.pause()
    }
  }
}
</script>
<style></style>
