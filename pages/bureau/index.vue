<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ site}} 監控輪播
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex.align-items-center
          b-spinbutton(
            v-model="secs",
            min="0",
            title="設定為0會停止自動切換面板",
            inline
          )
          .mx-1 秒
          lah-countdown-button(
            ref="countdown",
            icon="tv",
            action="slide-rtl",
            title="立即切換版面",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="carouselInterval",
            @end="next()",
            @click="next()"
          ) 切換
          lah-button.ml-1(
            @click="$refs.setupModal.show()",
            icon="cog",
            variant="outline-secondary",
            size="lg",
            action="clock",
            no-border,
            no-icon-gutter,
            title="設定"
          )
    lah-help-modal(:modal-id="'help-modal'" size="md")
      .h5 顯示監控畫面輪播
  b-card.p-1.border-0(no-body, v-cloak)
    b-carousel(ref="carousel", :interval="0")
      b-carousel-slide: template(#img)
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb1" target-ip="L1HWEB")
          lah-monitor-board-lxhweb(ref="lxhweb2" target-ip="L2HWEB")
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb3" target-ip="L1HWEB_Alt")
          lah-monitor-board-lxhweb(ref="lxhweb4" target-ip="L3HWEB")
      b-carousel-slide: template(#img)
        b-card-group.row-srmas.card-body-fixed-height-2(deck)
          lah-monitor-board-srmas(
            no-carousel,
            footer,
            @updated="handleMessageUpdated"
          )
          lah-monitor-board-srmas-weather
        b-card-group.row-srmas.card-body-fixed-height-2(deck)
          b-card
            template(#header): lah-fa-icon(icon="flag", variant="warning")
              strong SRMAS告警郵件
            lah-monitor-board-srmas-list(
              title-text='告警郵件列表',
              title-icon='triangle-exclamation',
              variant="warning",
              :items="warnings"
            )
          b-card
            template(#header): lah-fa-icon(icon="circle-check", regular, variant="success")
              strong SRMAS回復郵件
            lah-monitor-board-srmas-list(
              title-text='回復郵件列表',
              title-icon='circle-check',
              variant="success",
              :items="restores"
            )
      b-carousel-slide: template(#img)
        .h5.center(v-if="weatherImageFailed") 無法讀取 #[b-link(:href="weatherImgUrl", target="_blank", title="點擊查看") {{ weatherImgUrl }}] 影像
        b-link(
          v-show="!weatherImageFailed",
          @click="$utils.openNewWindow('/inf/weather/')",
          v-b-tooltip="`顯示${weatherImgUrl}`"
        )
          b-img.img-mh(
            :src="weatherImgUrl",
            fluid,
            thumbnail,
            center,
            rounded,
            @load="weatherImageFailed = false",
            @error="weatherImageFailed = true"
          )

  lah-monitor-board-setup-modal(ref="setupModal")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    // SRMAS fixed problems
    fixed: [],
    // still be problem
    problems: [],
    // raw warnings
    warnings: [],
    // raw restores
    restores: [],
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
      return this.$config.monitor.host.SRMAS.ip || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/output/${this.site}.png?ts=${this.weatherPngTs}`
    }
  },
  watch: {
    secs (val) {
      this.setCache('bureauMonitorCarouselSecs', val)
      this.resetTimer()
    }
  },
  async created () {
    this.secs = parseInt(await this.getCache('bureauMonitorCarouselSecs'))
    if (this.secs !== 0 && !this.secs) {
      this.secs = 30
    }
  },
  mounted () {
    this.weatherPngTimer = setInterval(() => {
      this.weatherPngTs = +new Date()
    }, 60000)
    if (this.secs > 0) {
      this.$refs.countdown?.start()
    }
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
    },
    handleMessageUpdated ({ detail }) {
      if (detail) {
        this.fixed = [...detail.fixed]
        this.problems = [...detail.problems]
        this.warnings = [...detail.warnings]
        this.restores = [...detail.restores]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.row-sync {
  height: calc((100vh - 120px) / 2) !important;
}
.row-srmas {
  // height: calc((100vh - 150px) / 2) !important;
  // margin-bottom: 15px;
  .card-body {
    height: calc((100vh - 150px) / 2);
    overflow: auto;
  }
}
.img-mh {
  max-height: calc((100vh - 100px)) !important;
}
.card-deck{
  margin-bottom: 15px;
}
</style>
