<template lang="pug">
.clock(v-if="hourtime != ''")
  .clock__hours(v-if="hour")
    span.clock__hourtime(v-text="hourtime")
    span(v-text="hours")
  .clock__minutes(v-text="minutes", v-if="minute")
  .clock__seconds(v-text="seconds", v-if="second")
</template>

<script>
const SECONDS = 1000
const HOUR = 12
export default {
  emit: [],
  component: {},
  props: {
    hour: {
      type: Boolean,
      default: true
    },
    minute: {
      type: Boolean,
      default: true
    },
    second: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    hours: 0,
    minutes: 0,
    seconds: 0,
    hourtime: '',
    timer: null
  }),
  computed: {},
  watch: {},
  created () {},
  async mounted () {
    this.timer = await this.timeout(this.updateDateTime, SECONDS)
  },
  beforeDestroy () {
    window.clearTimeout(this.timer)
  },
  methods: {
    getAMPM (h) {
      return parseInt(h) >= 12 ? 'PM' : 'AM'
    },
    padTimeZero (n) {
      return n.toString().padStart(2, '0')
    },
    async updateDateTime () {
      const now = new Date()
      this.hours = this.padTimeZero(now.getHours())
      this.minutes = this.padTimeZero(now.getMinutes())
      this.seconds = this.padTimeZero(now.getSeconds())
      this.hourtime = this.getAMPM(this.hours)
      this.hours = this.padTimeZero(parseInt(this.hours) % HOUR || HOUR)
      this.timer = await this.timeout(this.updateDateTime, SECONDS)
    }
  }
}
</script>

<style lang="scss" scoped>
.clock {
  background: #fff;
  border: 0.3rem solid #fff;
  border-radius: 0.5rem;
  display: inline-block;
  margin-bottom: 1em;
}

.clock__hours,
.clock__minutes,
.clock__seconds {
  background: linear-gradient(to bottom, #26303b 50%, #2c3540 50%);
  display: inline-block;
  color: #fff;
  font-family: 'Nunito', sans-serif;
  font-size: 3rem;
  font-weight: 300;
  padding: 0.5rem 1rem;
  text-align: center;
  position: relative;
}

.clock__hours {
  border-right: 0.15rem solid #fff;
}

.clock__minutes {
  border-right: 0.15rem solid #fff;
}

.clock__hourtime {
  font-size: 1rem;
  position: absolute;
  top: 2px;
  left: 8px;
}
</style>
