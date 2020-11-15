<template>
  <lah-button
    :icon="icon"
    :variant="variant"
    :size="size"
    @click="click"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    class="align-middle"
  >
    <slot></slot> 
    <b-badge :variant="badgeVariant">
      <countdown
        ref="countdown"
        :time="milliseconds"
        :auto-start="false"
        @end="end"
        @start="start"
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
import VueCountdown from "@chenfengyuan/vue-countdown";

export default {
  components: { countdown: VueCountdown },
  props: {
    variant: { type: String, default: 'primary' },
    badgeVariant: { type: String, default: 'light' },
    size: { type: String, default: '' },
    icon: { type: String, default: '' },
    milliseconds: { type: Number, default: 5 * 60 * 1000 },
    autoStart: { type: Boolean, default: false },
    click: { type: Function,  default: () => {} },
    start: { type: Function, default: () => {} },
    end: { type: Function, default: () => {} }
  },
  data: () => ({}),
  watch: {},
  computed: {},
  methods: {
    resetCountdown () {
      this.$refs.countdown.totalMilliseconds = this.milliseconds;
    },
    setCountdown (milliseconds) {
      this.$refs.countdown.totalMilliseconds = milliseconds || this.milliseconds;
    },
    startCountdown () {
      this.$refs.countdown.start();
    },
    endCountdown () {
      this.$refs.countdown.end();
    },
    mouseenter () {
      this.animated(this.$el);
      this.$log(this.$el)
    },
    mouseleave () {}
  },
  created() {},
  mounted () {
    if (this.autoStart) {
      this.startCountdown();
    }
  }
};
</script>
<style></style>
