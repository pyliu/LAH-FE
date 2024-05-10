<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.align-items-center
          div {{ site }} 天氣圖
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        b-button-group(size="lg")
          lah-button(
            icon="magnifying-glass-chart",
            @click="openMonitorBoard"
          ) 分析儀表板
          lah-button.ml-1(
            icon="link",
            @click="$utils.openNewWindow(`https://${srmasIp}`)"
          ) SRMAS系統
    lah-help-modal(:modal-id="'help-modal'" size="md"): ul
      li 請在 .env 檔案輸入 SRMAS_HOST={{ srmasIp }} 資料以正常顯示
      li 目前影像位址：{{ weatherImgUrl }}
      li 每分鐘自動更新
  //- below is the customize area
  .center
    h4(v-if="failed") 無法讀取 #[b-link(:href="weatherImgUrl", target="_blank", title="點擊查看") {{ weatherImgUrl }}] 影像
    b-img.max-h(
      v-show="!failed",
      :src="weatherImgUrl",
      fluid,
      thumbnail,
      @click="$utils.openNewWindow(weatherImgUrl)",
      @load="failed = false",
      @error="failed = true"
    )
</template>

<script>
import lahMonitorBoardSrmas from '~/components/lah-monitor-board-srmas.vue'
export default {
  fetchOnServer: false,
  components: { lahMonitorBoardSrmas },
  async asyncData ({ $axios, $content }) {
    // const testMD = await $content('test').fetch()
    // return {
    //   testMD
    // }
  },
  data: () => ({
    failed: false,
    ts: 0,
    timer: null,
    srmas: new Map([
      ['HA', '220.1.34.251'],
      ['HB', '220.1.35.95'],
      ['HC', '220.1.36.16'],
      ['HD', '220.1.37.93'],
      ['HE', '220.1.38.127'],
      ['HF', '220.1.39.126'],
      ['HG', '220.1.40.76'],
      ['HH', '220.1.41.64']
    ])
  }),
  head: {
    title: 'SRMAS天氣圖-桃園市地政局'
  },
  computed: {
    srmasIp () {
      return this.$config.SRMASHost || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png?ts=${this.ts}`
    }
  },
  watch: {},
  created () {},
  mounted () {
    this.timer = setInterval(() => {
      this.ts = +new Date()
    }, 60000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    openMonitorBoard () {
      this.modal(this.$createElement(lahMonitorBoardSrmas, {
        props: { noCarousel: true }
      }), {
        title: 'SRMAS通知郵件分析儀表板',
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.max-h {
  max-height: calc(100vh - 100px);
}
</style>
