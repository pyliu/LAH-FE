<template lang="pug">
.p-2(v-cloak)
  //- lah-header
  //-   lah-transition(appear)
  //-     .d-flex.justify-content-center.w-100.my-auto
  //-       .d-flex
  //-         .h1 跨域ONLINE即時通，服務無礙一點通
  //-         //- lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
  //-       div
  //-   lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
  //- below is the customize area
  //- b-card-group(deck)
  .d-flex.justify-content-center.w-100.my-auto
    .d-flex.my-5
      .h1 跨域ONLINE即時通，服務無礙一點通
  .my-4
  lah-fa-icon.h2(icon="wave-square", action="squeeze") 桃園市各所狀態
  hr.my-3
  client-only: .offices.justify-content-between
    lah-badge-site-status.office(
      v-for="office in offices",
      :ref="office",
      :key="office"
      :watch-site="office",
      :period="hxTimer",
      :fill="false",
      :badge="false",
      text-variant="",
      text-bold,
      short-alt
    )
  .my-3
  .d-flex.justify-content-between.align-items-center
    lah-fa-icon.h2(
      icon="heart-pulse",
      action="heartbeat",
      :variant="downOffices.length === 0 ? 'success' : 'danger'"
    ) 無法提供服務的地所
    lah-fa-icon.h3(
      icon="clock",
      variant="muted"
    ) 更新時間：{{ updatedTime }}
  hr.my-3
  .h1.center(
    v-if="downOffices.length === 0"
  ) 🟢 全國各地所皆可正常提供服務
  .d-flex.flex-wrap(
    v-else
  )
    lah-badge-site-status.other-office.m-1(
      v-for="office in downOffices",
      :ref="office.id",
      :key="office.id",
      :static-data="office",
      :fill="false",
      :badge="false",
      short-alt
    )
  .fix-logo
  .fix-taogirl-L
  .fix-taogirl-R
</template>

<script>
export default {
  data: () => ({
    offices: ['HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH'],
    hxTimer: '60000', // 1 min
    cachedTimer: 300000, // 5 mins
    cachedOfficesData: [],
    cachedHandler: null,
    updatedTime: '',
    animatedTimerBase: 5000
  }),
  fetch () {},
  head: {
    title: '跨域ONLINE即時通-桃園市地政局'
  },
  computed: {
    downOffices () {
      return [...this.cachedOfficesData.filter(siteData => siteData.state === 'DOWN')]
    }
  },
  watch: {},
  created () {
    this.reload()
  },
  mounted () {
    this.$nextTick(() => {
      this.animateGirlL()
      this.animateGirlR()
    })
  },
  methods: {
    reload (force = false) {
      clearTimeout(this.cachedHandler)
      this.cachedOfficesData = []
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_xap_stats',
          force
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.cachedOfficesData = [...data.raw]
          }
          this.updatedTime = this.$utils.formatTime(new Date())
        })
        .catch((err) => {
          this.$utils.error(err)
        })
        .finally(() => {
          this.timeout(this.reload, this.cachedTimer).then((handle) => {
            this.cachedHandler = handle
          })
        })
    },
    animateGirlL () {
      return this.$utils.animated('.fix-taogirl-L', { speed: 'slow' }).then((resolved) => {
        const timer = this.animatedTimerBase + this.$utils.rand(this.animatedTimerBase)
        // console.warn(`Girl L next run will be triggered after ${timer} ms`)
        this.timeout(this.animateGirlL, timer)
      })
    },
    animateGirlR () {
      return this.$utils.animated('.fix-taogirl-R', { speed: 'slow' }).then((resolved) => {
        const timer = this.animatedTimerBase + this.$utils.rand(this.animatedTimerBase)
        // console.warn(`Girl R next run will be triggered after ${timer} ms`)
        this.timeout(this.animateGirlR, timer)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.offices {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  align-content: flex-start;
  .office {
    width: 11%;
    height: 15vh;
    border: 1px solid gray;
    border-radius: 15px;
    font-size: xx-large;
  }
}
.other-office {
  width: 11%;
  height: 15vh;
  border: 1px solid gray;
  border-radius: 15px;
  font-size: xx-large;
}
.fix-logo {
  position: fixed;
  bottom: 10px;
  left: 10px;
  width: 329px;
  height: 97px;
  background-image: url(~/assets/img/taoyuan_logo.png);
  background-repeat: no-repeat;
  background-size: cover;
}
.fix-taogirl-R {
  position: fixed;
  top: 10px;
  right: 100px;
  width: 147.5px;
  height: 172.5px;
  background-image: url(~/assets/img/taogirl_L.png);
  background-repeat: no-repeat;
  background-size: cover;
}
.fix-taogirl-L {
  position: fixed;
  top: 10px;
  left: 100px;
  width: 147.5px;
  height: 172.5px;
  background-image: url(~/assets/img/taogirl_morning_R.png);
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
