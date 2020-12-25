<template>
  <lah-button
    :id="id"
    :icon="icon"
    :variant="variant"
    :size="size"
    :action="action"
    @click="$emit('click', $event)"
    class="align-middle"
    :busy="busy"
  >
    <slot></slot> 
    <b-badge ref="badge" :variant="badgeVariant" class="ml-1">
      <countdown
        ref="cd"
        :time="milliseconds"
        :auto-start="false"
        @end="$emit('end', $event)"
        @start="$emit('start', $event)"
        @progress="handleProgress"
      >
        <template slot-scope="props">
          {{ props.minutes.toString().padStart(2, '0') }}:{{ props.seconds.toString().padStart(2, '0') }}
        </template>
      </countdown>
      <span class="sr-only">倒數</span>
    </b-badge>
  </lah-button>
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
    busy: { type: Boolean, default: false }
  },
  data: () => ({
    id: ''
  }),
  watch: {},
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
      if (parseInt(payload.totalSeconds) === 3) {
      this.$utils.log(this.$el, this.id) 
        this.attention(`#${this.id}`, { name: 'flash', speed: 'slower' })
      }
    },
    resetCountdown () {
      this.$refs.cd.totalMilliseconds = this.milliseconds
    },
    setCountdown (milliseconds) {
      this.$refs.cd.totalMilliseconds = milliseconds || this.milliseconds
    },
    startCountdown () {
      this.resetCountdown()
      this.$refs.cd.start()
    },
    endCountdown () {
      this.$refs.cd.end()
    }
  },
  created() {},
  mounted () {
    if (this.autoStart) {
      this.startCountdown()
      this.attention(this.$refs.badge, { name: 'flash', speed: 'slower' })
    }
    this.id = `cb-${this.$utils.uuid()}`
  }
}
</script>
<style></style>
