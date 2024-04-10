<template lang="pug">
b-card(:class="bodyOnly ? ['border-0'] : []")
  template(#header, v-if="!bodyOnly"): .d-flex.justify-content-between.align-items-center
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
  .center.h5(v-if="failed") 無法讀取 {{ weatherImgUrl }} 影像
  b-link(
    v-show="!failed",
    to="/inf/weather/",
    v-b-tooltip="`顯示${weatherImgUrl}`"
  )
    b-img(
      :src="weatherImgUrl",
      fluid,
      thumbnail,
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
      return this.$config.SRMASHost || this.srmas.get(this.site)
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png?ts=${this.ts}`
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
