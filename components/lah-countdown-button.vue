<template>
  <lah-button
    :icon="icon"
    :variant="variant"
    :size="size"
    :action="action"
    @click="click"
    class="align-middle"
  >
    <slot></slot> 
    <b-badge ref="badge" :variant="badgeVariant" class="ml-1">
      <countdown
        ref="cd"
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
    action: { type: String, default: '' },
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
      this.$refs.cd.totalMilliseconds = this.milliseconds;
    },
    setCountdown (milliseconds) {
      this.$refs.cd.totalMilliseconds = milliseconds || this.milliseconds;
    },
    startCountdown () {
      this.$refs.cd.start();
    },
    endCountdown () {
      this.$refs.cd.end();
    }
  },
  created() {},
  mounted () {
    if (this.autoStart) {
      this.startCountdown();
      this.attention(this.$refs.badge, { name: 'flash', duration: 'once-anim-cfg-2x' })
    }
  }
};
</script>
<style></style>
