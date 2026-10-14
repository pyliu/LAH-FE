<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.align-items-center
          div {{ site }} 監控總覽 - {{ currentCarouselTitle }}
          b-badge.ml-2.badge-alert(v-if="abnormalCount > 0" variant="danger") 異常 {{ abnormalCount }}
          //- lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex.align-items-center.bureau-ctrl(:class="{ 'ctrl-show': ctrlVisible }")
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
  .summary-row.d-flex.px-1.pt-1
    .summary-card.flex-fill(
      v-for="c in summaryCards",
      :key="c.key",
      :class="['light-' + c.light, { focused: c.idx === carouselIndex }]"
    )
      .summary-title {{ c.title }}
      .summary-status {{ c.text }}
  b-card.p-1.border-0(no-body, v-cloak, :class="{ 'main-danger': abnormalCount > 0 }")
    b-carousel(ref="carousel", :interval="0", v-model="carouselIndex")
      b-carousel-slide: template(#img)
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb1" target-ip="L1HWEB" display-update-time display-update-time-to-now)
          lah-monitor-board-lxhweb(ref="lxhweb2" target-ip="L2HWEB" display-update-time display-update-time-to-now)
        b-card-group.row-sync(deck)
          lah-monitor-board-lxhweb(ref="lxhweb3" target-ip="L1HWEB_Alt" display-update-time display-update-time-to-now)
          lah-monitor-board-lxhweb(ref="lxhweb4" target-ip="L3HWEB" display-update-time display-update-time-to-now)
      b-carousel-slide: template(#img)
        lah-monitor-board-powerha-compare.card-h(ref="powerha")
      b-carousel-slide: template(#img)
        lah-monitor-board-srmas.card-h(
          ref="srmas",
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
    // 摘要燈號（由 refreshLights 定時從子元件讀取）
    syncLights: ['warning', 'warning', 'warning', 'warning'],
    powerhaLight: 'warning',
    srmasLight: 'warning',
    lightTimer: null,
    ctrlVisible: false,
    ctrlTimer: null,
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
  head () {
    return {
      title: (this.abnormalCount > 0 ? `(${this.abnormalCount}) ` : '') + '監控輪播-桃園市地政局'
    }
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
    weatherImgUrl () {
      return `/srmas-weathermap/plugins/Weathermap/output/${this.site}.png?ts=${this.weatherPngTs}`
    },
    summaryCards () {
      const worst = arr => arr.includes('danger') ? 'danger' : (arr.includes('warning') ? 'warning' : 'success')
      const syncLight = worst(this.syncLights)
      const syncBad = this.syncLights.filter(l => l !== 'success').length
      const textOf = (light, ok, bad, warn) => light === 'danger' ? bad : (light === 'warning' ? warn : ok)
      return [
        {
          key: 'sync',
          idx: 0,
          title: '同步異動',
          light: syncLight,
          text: textOf(syncLight, '4 台正常', `${syncBad}/4 台異常`, `${syncBad}/4 台注意`)
        },
        {
          key: 'powerha',
          idx: 1,
          title: 'PowerHA',
          light: this.powerhaLight,
          text: textOf(this.powerhaLight, '正常', '異常', '資料過久未更新')
        },
        {
          key: 'srmas',
          idx: 2,
          title: 'SRMAS',
          light: this.srmasLight,
          text: textOf(this.srmasLight, '正常', `異常 ${this.problems.length} 筆`, '無資料或載入失敗')
        }
      ]
    },
    abnormalCount () {
      return this.summaryCards.filter(c => c.light === 'danger').length
    },
    rotationList () {
      const danger = this.summaryCards.filter(c => c.light === 'danger').map(c => c.idx)
      return danger.length > 0 ? danger : [0, 1, 2]
    }
  },
  watch: {
    secs (val) {
      this.setCache('bureauMonitorCarouselSecs', val)
      this.resetTimer()
    },
    rotationList (list) {
      if (!list.includes(this.carouselIndex)) {
        this.carouselIndex = list[0]
        this.resetTimer()
      }
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
    this.lightTimer = setInterval(this.refreshLights, 3000)
    window.addEventListener('mousemove', this.showCtrl)
    this.resetTimer()
  },
  beforeDestroy () {
    clearInterval(this.weatherPngTimer)
    clearInterval(this.lightTimer)
    clearTimeout(this.ctrlTimer)
    window.removeEventListener('mousemove', this.showCtrl)
    this.$refs.countdown?.pauseCountdown()
  },
  methods: {
    prev () {
      this.$refs.carousel?.prev()
      this.resetTimer()
    },
    next () {
      const list = this.rotationList
      const nxt = list.find(i => i > this.carouselIndex)
      this.carouselIndex = nxt !== undefined ? nxt : list[0]
      this.resetTimer()
    },
    resetTimer () {
      this.$refs.countdown?.setCountdown(this.carouselInterval)
      this.carouselInterval !== 0 && this.$refs.countdown?.startCountdown()
    },
    normalizeLight (light) {
      if (light === 'danger' || light === 'success') { return light }
      return 'warning'
    },
    refreshLights () {
      this.syncLights = ['lxhweb1', 'lxhweb2', 'lxhweb3', 'lxhweb4']
        .map(name => this.normalizeLight(this.$refs[name]?.headerLight))
      this.powerhaLight = this.normalizeLight(this.$refs.powerha?.light)
      this.srmasLight = this.normalizeLight(this.$refs.srmas?.light)
    },
    showCtrl () {
      this.ctrlVisible = true
      clearTimeout(this.ctrlTimer)
      this.ctrlTimer = setTimeout(() => { this.ctrlVisible = false }, 3000)
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
  height: calc((100vh - 230px) / 2) !important;
}
.card-h {
  height: calc(100vh - 230px) !important;
}
.card-deck{
  margin-bottom: 15px;
}
/* 摘要燈號卡 */
.summary-row {
  height: 100px;
  gap: 8px;
}
.summary-card {
  border-radius: 8px;
  border: 3px solid transparent;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  &.light-success { background: #28a745; }
  &.light-warning { background: #e0a800; color: #212529; }
  &.light-danger { background: #dc3545; animation: bureau-blink 1s ease-in-out infinite; }
  &.focused { border-color: #212529; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25); }
  .summary-title { font-size: 1.6rem; font-weight: bold; line-height: 1.2; }
  .summary-status { font-size: 1.3rem; }
}
.main-danger {
  animation: bureau-border-blink 1s ease-in-out infinite;
}
.badge-alert {
  font-size: 1.2rem;
}
@keyframes bureau-blink {
  50% { opacity: 0.65; }
}
@keyframes bureau-border-blink {
  0%, 100% { box-shadow: inset 0 0 0 4px rgba(220, 53, 69, 0.9); }
  50% { box-shadow: inset 0 0 0 4px rgba(220, 53, 69, 0.15); }
}
/* 操作區預設隱藏，滑鼠移動時才浮現 */
.bureau-ctrl {
  opacity: 0;
  transition: opacity 0.3s;
  &.ctrl-show { opacity: 1; }
  ::v-deep .btn:not(.btn-sm),
  ::v-deep .b-form-spinbutton {
    height: 48px;
  }
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
