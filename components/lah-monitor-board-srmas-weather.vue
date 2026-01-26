<template lang="pug">
b-card.h-100.flex-column(:class="bodyOnly ? ['border-0'] : []", body-class="d-flex flex-column justify-content-center align-items-center overflow-hidden")
  template(#header, v-if="!bodyOnly"): .d-flex.justify-content-between.align-items-center
    lah-fa-icon(icon="cloud-sun-rain", variant="primary")
      strong {{ header }}
    //- lah-fa-icon(icon="circle", :variant="light")
    //- strong(v-if="messagesAfterThreadhold.length > 0 && problems.length === 0") {{ header }} ({{ monitorHrs }}小時內正常)
    //- strong(v-else) {{ header }}({{ monitorHrs }}小時內)
    b-button-group.ml-auto(size="sm")
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 顯示 SRMAS 天氣圖，請在 .env 檔案輸入 SRMAS_HOST={{ srmasIp }} 資料以正常顯示
        li 點擊圖片可帶出新視窗放大顯示
        li 目前影像位址：{{ weatherImgUrl }}
        li 每分鐘自動更新
  slot
  h5(v-if="failed") 無法讀取 #[b-link(:href="weatherImgUrl", target="_blank", title="點擊查看") {{ weatherImgUrl }}] 影像

  //- 修改說明: 使用 flex-grow-1 讓連結佔滿剩餘空間，並利用 min-height: 0 解決 flex item 溢出問題
  b-link.d-flex.align-items-center.justify-content-center.flex-grow-1.w-100(
    v-show="!failed",
    to="/inf/weather/",
    v-b-tooltip="`顯示${weatherImgUrl}`",
    style="min-height: 0; overflow: hidden;"
  )
    //- 修改說明: 移除 fluid, center，改用 CSS 控制最大高度與寬度，確保圖片在容器內縮放 (contain)
    b-img(
      :src="weatherImgUrl",
      thumbnail,
      rounded,
      style="max-height: 100%; max-width: 100%; object-fit: contain;",
      @load="failed = false",
      @error="failed = true"
    )

</template>

<script>
export default {
  name: 'LahMonitorBoardSrmasWeather',
  components: {},
  props: {
    bodyOnly: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS天氣圖',
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
  computed: {
    srmasIp () {
      return this.$config.monitor.host.SRMAS.ip || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/output/${this.site}.png?ts=${this.ts}`
    }
  },
  watch: {},
  async created () {},
  mounted () {
    this.timer = setInterval(() => {
      this.ts = +new Date()
    }, 60000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
