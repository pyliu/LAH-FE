<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ site }} 監控輪播 - {{ currentCarouselTitle }}
          //- lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex.align-items-center
          b-spinbutton(
            v-model="secs",
            min="0",
            title="0 - 停止自動切換",
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
      .h6(v-if="carouselInterval === 0") 因輪播秒數設定為 #[strong.text-danger 0] ，請手動切換下列要撥放之面板
      .h6(v-else) 顯示 {{ site }} 監控畫面輪播，每 #[strong.text-primary {{ carouselInterval / 1000 }}] 秒依下列順序輪播
      ol
        li 同步異動監控
        li PowerHA監控
        li SRMAS警示、回復郵件分析
  b-card.p-1.border-0(no-body, v-cloak)
    b-carousel(ref="carousel", :interval="0", v-model="carouselIndex")
      b-carousel-slide: template(#img)
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb1" target-ip="L1HWEB")
          lah-monitor-board-lxhweb(ref="lxhweb2" target-ip="L2HWEB")
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb3" target-ip="L1HWEB_Alt")
          lah-monitor-board-lxhweb(ref="lxhweb4" target-ip="L3HWEB")
      b-carousel-slide: template(#img)
        lah-monitor-board-powerha-compare.card-h(:max-height-offset="125")
      b-carousel-slide: template(#img)
        lah-monitor-board-srmas.card-h(
          no-carousel,
          @updated="handleMessageUpdated",
          footer
        )

  lah-monitor-board-setup-modal(ref="setupModal")
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    carouselIndex: 0,
    // SRMAS fixed problems
    fixed: [],
    // still be problem
    problems: [],
    // raw warnings
    warnings: [],
    // raw restores
    restores: [],
    secs: 0,
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
    currentCarouselTitle () {
      switch (this.carouselIndex) {
        case 0: return '同步異動'
        case 1: return 'PowerHA監控'
        case 2: return 'SRMAS郵件分析'
        default: return '未定義版面'
      }
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
    this.resetTimer()
  },
  beforeDestroy () {
    clearInterval(this.weatherPngTimer)
    this.$refs.countdown?.pauseCountdown()
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
      this.carouselInterval !== 0 && this.$refs.countdown?.startCountdown()
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
.card-h {
  height: calc(100vh - 120px) !important;
}
.card-deck{
  margin-bottom: 15px;
}
/*
  修正 BootstrapVue b-spinbutton 按鈕圖示的垂直置中問題 (垂直模式)。
  這個問題通常發生在垂直模式下，因為按鈕的 padding 被移除 (p-0)，
  導致沒有足夠的空間讓圖示垂直置中。

  您可以將此 CSS 片段加到您的全域樣式表。
  如果您想在 Vue 的 <style scoped> 中使用，請在選擇器前加上 `::v-deep`。
  例如： `::v-deep .b-form-spinbutton > button.btn`
*/
/*
  1. 針對 b-spinbutton 中的按鈕
  我們給予按鈕一個相對定位的參考點，並設定一個最小高度，
  確保有足夠的垂直空間來置中圖示。
*/
::v-deep .b-form-spinbutton > button.btn.btn-sm {
  position: relative;
  /* 稍微增加按鈕高度，您可以微調此數值以達到最佳視覺效果 */
  min-height: 1.3em;
  padding: 0 1rem
}

/*
  2. 針對按鈕內的 SVG 圖示
  我們使用絕對定位，並結合 transform 來達成完美的垂直和水平置中。
*/
::v-deep .b-form-spinbutton > button.btn.btn-sm > svg.b-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
