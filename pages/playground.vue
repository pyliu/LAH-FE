<template>
  <div>
    <lah-header></lah-header>
    <div class="center my-3">
      <div>
        <font-awesome-layers class="fa-10x anim-appear-1s">
          <font-awesome-icon icon="circle" />
          <font-awesome-icon
            icon="charging-station"
            transform="shrink-6"
            :style="{ color: 'white' }"
          />
        </font-awesome-layers>
        <h3 class="title">測試</h3>
      </div>
    </div>

    <!-- <p>
      <lah-reg-b-table
        v-if="isTableReady"
        :baked-data="json.baked"
        icon-variant="success"
        icon="chevron-circle-right" 
        :max-height="300" 
        class="small"
        caption="查詢統編"
      />
    </p> -->
    <div class="border-1">
      <font-awesome-layers class="fa-5x">
        <font-awesome-icon icon="circle" />
        <font-awesome-icon
          icon="check"
          transform="shrink-6"
          :style="{ color: 'white' }"
        />
      </font-awesome-layers>

      Power Transforms:
      <font-awesome-icon icon="spinner" transform="shrink-6 left-4" />
      <font-awesome-icon icon="spinner" :transform="{ rotate: 42 }" />

      Masking:
      <font-awesome-icon icon="coffee" :mask="['far', 'circle']" />

      Symbols:
      <font-awesome-icon icon="edit" symbol />
      <font-awesome-icon icon="edit" symbol="edit-icon" />

      Layers:
      <font-awesome-layers class="fa-lg text-success">
        <font-awesome-icon icon="circle" />
        <font-awesome-icon
          icon="check"
          transform="shrink-6"
          :style="{ color: 'white' }"
        />
      </font-awesome-layers>

      Layers text:
      <font-awesome-layers full-width class="fa-4x">
        <font-awesome-icon icon="question" />
        <font-awesome-layers-text
          class="text-danger"
          transform="down-2 shrink-8"
          value="pyliu"
        />
      </font-awesome-layers>

      Counters:
      <font-awesome-layers full-width class="fa-4x">
        <font-awesome-icon icon="envelope" />
        <font-awesome-layers-text counter value="1" position="top-right" />
      </font-awesome-layers>
      
      <p>
        <b-spinner type="grow" size="sm"></b-spinner>
        you're from {{ip}}
      </p>
      <p>
        <lah-countdown-button ref="countdown" :auto-start="true" variant="success" badge-variant="danger" :milliseconds="5000" @click="clickCountdownButton" @end="endCountdownButton">
          <font-awesome-layers class="my-auto">
            <font-awesome-icon :icon="['far', 'circle']" />
            <font-awesome-icon
              icon="times"
              transform="shrink-6"
              :style="{ color: 'red' }"
            />
          </font-awesome-layers>
          some text
        </lah-countdown-button>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: "測試-桃園市地政局",
  },
  data: () => ({
    pid: 'A123456789',
    json: undefined
  }),
  async asyncData({ $axios }) {
    // SSR: returned object will replace the data inside "data" before rendering
    // http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01
    // return await $axios.get('http://220.1.35.123/LandY0/open_news/queryNews?newsCategory=01', { timeout: 1000 })
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
  }
}
</script>

<style>
</style>
