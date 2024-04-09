<template lang="pug">
b-card(:border-variant="border")
  template(#header): .d-flex.justify-content-between.align-items-center
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
        li 顯示 SRMAS 天氣圖
        li 點擊圖片可帶出新視窗放大顯示
  slot
  b-link(
    @click="$utils.openNewWindow(weatherImgUrl)",
    v-b-tooltip="`顯示${weatherImgUrl}`"
  ): b-img(
    :src="weatherImgUrl",
    fluid,
    thumbnail
  )

  //- template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
  //-   ref="footer"
  //-   :reload-ms="reloadMs",
  //-   :busy="isBusy",
  //-   :fetch="$fetch",
  //-   :reload="reload",
  //-   :fetch-state="fetchingState",
  //-   :update-time="updated"
  //- )

</template>

<script>
export default {
  name: 'LahMonitorBoardSrmasWeather',
  components: {},
  props: {
    footer: { type: Boolean, default: false },
    monitorBoardMH: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS天氣圖'
  }),
  computed: {
    srmasIp () {
      return this.$config.SRMASHost
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png`
    }
  },
  watch: {},
  async created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
