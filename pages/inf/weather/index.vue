<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ site }} 天氣圖
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        //- div 右側選單區域
    lah-help-modal(:modal-id="'help-modal'" size="xl")
      .h4 請在 .env 檔案輸入 SRMAS_HOST={{ srmasIp }} 資料以正常顯示
      .h5.text-muted 目前影像位址：{{ weatherImgUrl }}
  //- below is the customize area
  b-img(
    :src="weatherImgUrl",
    fluid,
    thumbnail,
    @click="$utils.openNewWindow(weatherImgUrl)"
  )
</template>

<script>
export default {
  fetchOnServer: false,
  async asyncData ({ $axios, $content }) {
    const testMD = await $content('test').fetch()
    return {
      testMD
    }
  },
  data: () => ({

  }),
  head: {
    title: 'SRMAS天氣圖-桃園市地政局'
  },
  computed: {
    srmasIp () {
      return this.$config.SRMASHost
    },
    weatherImgUrl () {
      return `https://${this.srmasIp}/plugins/Weathermap/${this.site}.png`
    }
  },
  watch: {},
  created () {},
  mounted () {
    console.log(this.$config)
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
