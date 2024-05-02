<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ site}} 監控輪播
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex.align-items-center
          lah-countdown-button(
            ref="countdown",
            icon="tv",
            action="slide-rtl",
            auto-start,
            title="立即切換版面",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="carouselInterval",
            @end="next()",
            @click="next()"
          ) 切換版面
          .mx-1 每
          b-spinbutton(
            v-model="secs",
            min="0",
            title="設定為0會停止自動切換面板",
            inline
          )
          .mx-1 秒自動切換
        div
          lah-button.mr-1(
            @click="$refs.setupModal.show()",
            icon="cog",
            variant="outline-secondary",
            size="lg",
            action="clock",
            no-border,
            no-icon-gutter,
            title="設定"
          )
    lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
  b-card.p-1.border-0(no-body, v-cloak)
    b-carousel(ref="carousel", :interval="0")
      b-carousel-slide: template(#img)
        b-card-group.row(deck)
          lah-monitor-board-lxhweb(ref="lxhweb1" target-ip="L1HWEB")
          lah-monitor-board-lxhweb(ref="lxhweb2" target-ip="L2HWEB")
        b-card-group.row(deck)
          lah-monitor-board-lxhweb(ref="lxhweb3" target-ip="L1HWEB_Alt")
          lah-monitor-board-lxhweb(ref="lxhweb4" target-ip="L3HWEB")
      b-carousel-slide: template(#img)
        lah-monitor-board-srmas(no-carousel, footer)
      b-carousel-slide: template(#img)
        .center.h5(v-if="weatherImageFailed") 無法讀取 {{ weatherImgUrl }} 影像
        b-link(
          v-show="!weatherImageFailed",
          @click="$utils.openNewWindow('/inf/weather/')",
          v-b-tooltip="`顯示${weatherImgUrl}`"
        )
          b-img(
            :src="weatherImgUrl",
            fluid,
            thumbnail,
            @load="weatherImageFailed = false",
            @error="weatherImageFailed = true"
          )

  lah-monitor-board-setup-modal(ref="setupModal")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    secs: 30,
    weatherPngTs: 0,
    weatherPngTimer: null,
    weatherImageFailed: false,
    srmas: new Map([
      ['HA', '220.1.34.251'],
      ['HB', '220.1.35.95'],
      ['HC', '220.1.36.16'],
      ['HD', '220.1.37.93'],
      ['HE', '220.1.38.127'],
      ['HF', '220.1.39.126'],
      ['HG', '220.1.40.76'],
      ['HH', '220.1.41.64'],
      ['H0', '220.1.33.123']
    ])
  }),
  head: {
    title: '監控輪播-桃園市地政局'
  },
  computed: {
    carouselInterval () {
      return this.secs * 1000
    },
    srmasIp () {
      return this.$config.SRMASHost || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png?ts=${this.weatherPngTs}`
    }
  },
  watch: {
    secs (val) {
      const int = parseInt(val)
      this.setCache('bureauMonitorCarouselSecs', int && int > 0 ? int : 30)
      this.resetTimer()
    }
  },
  async created () {
    this.secs = await this.getCache('bureauMonitorCarouselSecs') || 30
  },
  mounted () {
    this.weatherPngTimer = setInterval(() => {
      this.weatherPngTs = +new Date()
    }, 60000)
  },
  beforeDestroy () {
    clearInterval(this.weatherPngTimer)
  },
  methods: {
    prev () {
      this.$refs.carousel?.prev()
      this.resetTimer()
    },
    next () {
      this.$refs.carousel?.next()
      this.resetTimer()
    },
    resetTimer () {
      this.$refs.countdown?.setCountdown(this.carouselInterval)
      this.carouselInterval > 0 && this.$refs.countdown?.startCountdown()
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  height: 42.5vh !important;
}
.card-deck .card {
  margin: 5px;
}
</style>
