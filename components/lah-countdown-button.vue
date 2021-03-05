<template lang="pug">
  lah-button(
    ref="btn"
    :icon="icon"
    :variant="variantMediator"
    :size="size"
    :action="action"
    @click="$emit('click', $event)"
    class="align-middle"
    :busy="busy"
    :no-icon-gutter="noBadge"
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
          {{ props.minutes.toString().padStart(2, '0') }}:{{ props.seconds.toString().padStart(2, '0') }}
      span.sr-only 倒數
</template>

<script>
import VueCountdown from "@chenfengyuan/vue-countdown"

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
    endAttentionThreadhold: { type: Number, default: 3 }
  },
  data: () => ({
    variantMediator: 'primary'
  }),
  watch: {
    variant (val) {
      this.variantMediator = val
    }
  },
  computed: {},
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
      if (this.endAttention && parseInt(payload.totalSeconds) === this.endAttentionThreadhold && this.$refs.btn) {
        this.$utils.addAnimation(`#${this.$refs.btn.iconId}`, this.action)
        const oldVariant = this.variantMediator
        this.variantMediator = this.endAttentionStartVariant
        this.timeout(() => {
          this.variantMediator = this.endAttentionEndVariant
        }, (this.endAttentionThreadhold - 1) * 1000)
        this.timeout(() => {
          this.variantMediator = oldVariant
          this.$utils.clearAnimation(`#${this.$refs.btn.iconId}`)
        }, this.endAttentionThreadhold * 1000)
      }
      if (parseInt(payload.totalSeconds) === 1) {
        // random effect, 0.5s
        this.attention(this.$el, { speed: 'faster' })
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
  },
  created() {
    this.variantMediator = this.variant
  },
  mounted () {
    if (this.autoStart) {
      this.startCountdown()
    }
  }
}
</script>
<style></style>
