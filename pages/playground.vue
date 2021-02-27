<template lang="pug">
  div
    lah-header
    span test
    lah-button( size="lg" )
    <lah-fa-icon icon="question"></lah-fa-icon>
    div {{ openNewsData }}
    p {{ $config.baseURL }}
</template>

<script>
export default {
  head: {
    title: "測試-桃園市地政局",
  },
  data: () => ({
    pid: 'A123456789',
    json: undefined,
    openNewsData: undefined
  }),
  async asyncData({ $axios }) {
    // SSR: returned object will replace the data inside "data" before rendering
    // http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01
    // return await $axios.get('http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 })
    // return await $axios.get('http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01', { timeout: 400 }).then(({ data }) => {
    //   return {openNewsData: data.openNewsData}
    // })
  },
  computed: {
    // isTableReady () { return this.json && this.json.baked && this.json.baked.length > 0 ? true : false }
  },
  methods: {
    clickCountdownButton () {
      this.$utils.log(this.$el)
      this.notify('click countdown button!')
      this.endCountdownButton()
    },
    endCountdownButton () {
      this.$refs.countdown.resetCountdown()
      this.$refs.countdown.startCountdown()
    }
  },
  fetch () {
    let cache_key = "case-query-by-pid-crsms-"+this.pid
    this.getCache(cache_key).then(json => {
      this.json = json
      this.$utils.empty(this.json) && this.$axios.post(
        this.$consts.API.JSON.QUERY,
        { type: 'crsms', id: this.pid }
      ).then(response => {
        // on success
        this.json = response.data
        this.setCache(cache_key, this.json, 604800000)   // a week
        this.json.data_count === 0 && this.notify(`<i class="text-info fas fa-exclamation-circle"></i> 查無登記案件資料`, { type: 'warning' })
      }).catch(error => {
          this.$utils.error(error)
      }).finally(() => {})
    })
  },
  mounted () { this.$utils.log(this) }
}
</script>

<style>
</style>
