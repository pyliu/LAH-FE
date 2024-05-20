<template lang="pug">
b-carousel(
  ref="carousel",
  v-model="slideIdx",
  :interval="slideInterval",
  no-hover-pause
)
  b-carousel-slide: template(#img): .p-3(v-cloak)
    //- lah-header
    //-   lah-transition(appear)
    //-     .d-flex.justify-content-center.w-100.my-auto
    //-       .d-flex
    //-         .h1 跨縣市ONLINE即時通，服務無礙一點通
    //-         //- lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
    //-       div
    //-   lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
    //- below is the customize area
    //- b-card-group(deck)
    .d-flex.justify-content-center.w-100.my-auto
      .d-flex.my-5
        .h1.lah-shadow.fonte-weight-bold 跨縣市#[span.text-success ONLINE]即時通，服務無礙一點通
    .my-4
    .d-flex.justify-content-between.align-items-center
      lah-fa-icon.h2(icon="wave-square", action="squeeze") 桃園市所屬地所服務狀態
      lah-fa-icon.h4(
        icon="clock",
        variant="primary",
        action="clock"
      ) 上次更新：{{ TYUpdatedTime }}
    hr.my-3
    client-only: .offices.justify-content-between
      lah-badge-site-status.office.lah-shadow(
        v-for="office in offices",
        :ref="office",
        :key="office"
        :watch-site="office",
        :period="hxTimer",
        :fill="false",
        :badge="false",
        text-variant="",
        text-bold,
        short-alt,
        @updated="handleTYSitesUpdated"
      )
    .my-3
    .d-flex.justify-content-between.align-items-center
      lah-fa-icon.h2(
        icon="heart-pulse",
        action="heartbeat",
        :variant="downOffices.length === 0 ? 'success' : 'danger'"
      )
        span 無法提供服務的地所
        span.ml-1 ({{ downOffices.length }})
      lah-fa-icon.h4(
        icon="clock",
        variant="muted"
      ) 上次更新：{{ updatedTime }}
    hr.my-3
    .h1.center(
      v-if="downOffices.length === 0"
    ) 🟢 全國各地所皆可正常提供服務
    .d-flex.flex-wrap(
      v-else
    )
      lah-badge-site-status.other-office.mr-4.mb-4.lah-shadow(
        v-for="office in downOffices",
        :ref="office.id",
        :key="office.id",
        :static-data="office",
        :fill="false",
        :badge="false",
        short-alt
      )
    lah-clock.fix-clock
    .fix-logo
    .fix-taogirl-L.lah-shadow
    .fix-taogirl-R.lah-shadow

  b-carousel-slide(v-if="latestEasyCases.length > 0"): template(#img)
    .center.h1.my-3
      lah-fa-icon(icon="star", regular, action="clock")
        span 最新#[span.text-info 簡易案件]辦理情形
      lah-fa-icon(icon="star", regular, action="clock")
    lah-reg-tracking-cards(:rows="latestEasyCases", :query-day="easyCaseQueryDay", :serial-start="1")
  //- below is the customize area

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
    TYUpdatedTime: '',
    animatedTimerBase: 5000,
    slideInterval: 30000,
    slideIdx: 0,
    maxQueueSize: 12,
    easyCaseQueryDay: '',
    easyCases: [],
    latestEasyCases: []
  }),
  fetch () {},
  head: {
    title: '跨縣市ONLINE即時通-桃園市地政局'
  },
  computed: {
    downOffices () {
      return [...this.cachedOfficesData.filter(siteData => siteData.state === 'DOWN')]
    },
    trackingCase () {
      return this.easyCases.filter((row) => {
        /**
         * RM08 - 收件類別
         * 1 一般案件
         * 2 專辦案件
         * 3 急速件
         * 9 簡易案件
         * Q 逕為案件
         * R 囑託案件
         * X 跨縣市收辦案件
         */
        return row.RM08 === '9'
      })
    }
  },
  watch: {
    trackingCase (arr) {
      this.latestEasyCases = [...arr.slice(0, this.maxQueueSize)]
    }
  },
  created () {
    // today, TW, e.g. 1130521
    this.easyCaseQueryDay = this.$utils.today('TW').replaceAll('-', '')
  },
  mounted () {
    this.reload()
    this.loadEasyCaseState()
    this.$nextTick(() => {
      this.animateGirlL()
      this.animateGirlR()
    })
    // reload the page to prevent Out of Memory issue on EDGE
    // this.timeout(() => location.reload(), 30 * 60 * 1000)
  },
  methods: {
    handleTYSitesUpdated (dontcare) {
      this.TYUpdatedTime = this.$utils.formatTime(new Date())
    },
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
    },
    loadEasyCaseState () {
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsms_update_by_date',
        qday: this.easyCaseQueryDay
      }).then(({ data }) => {
        this.easyCases = [...this.$utils.orderBy(data.baked, [(row) => {
          return this.latestUpdateTime(row)
        }], ['desc'])]
      }).catch((err) => {
        console.warn(err)
      }).finally(() => {
        this.timeout(this.loadEasyCaseState, 60 * 1000)
      })
    },
    latestUpdateTime (row) {
      const targetDate = this.easyCaseQueryDay
      let ok = false
      // 異動時間
      !ok && targetDate === row.RM105_1 && (ok = row.RM105_2)
      // 秘書
      !ok && targetDate === row.RM107_1 && (ok = row.RM107_2)
      // 課長
      !ok && targetDate === row.RM106_1 && (ok = row.RM106_2)
      // 撤回
      !ok && targetDate === row.RM93_1 && (ok = row.RM93_2)
      // 歸檔
      // !ok && targetDate === row.RM91_1 && (ok = row.RM91_2)
      // 展期
      !ok && targetDate === row.RM86 && (ok = row.RM87)
      // 補正
      !ok && targetDate === row.RM53_1 && (ok = row.RM53_2)
      // 駁回
      !ok && targetDate === row.RM48_1 && (ok = row.RM48_2)
      // 取消請示
      !ok && targetDate === row.RM83 && (ok = row.RM84)
      // 請示
      !ok && targetDate === row.RM80 && (ok = row.RM81)
      // 結案
      !ok && targetDate === row.RM58_1 && (ok = row.RM58_2)
      // 校對
      !ok && targetDate === row.RM56_1 && (ok = row.RM56_2)
      // 登錄
      !ok && targetDate === row.RM54_1 && (ok = row.RM54_2)
      // 複審
      !ok && targetDate === row.RM46_1 && (ok = row.RM46_2)
      // 准登
      !ok && targetDate === row.RM62_1 && (ok = row.RM62_2)
      // 初審
      !ok && targetDate === row.RM44_1 && (ok = row.RM44_2)
      // 收件
      // !ok && targetDate === row.RM07_1 && (ok = row.RM07_2)
      return ok
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
    background-color: white;
  }
}
.other-office {
  width: 11%;
  height: 15vh;
  border: 1px solid gray;
  border-radius: 15px;
  font-size: xx-large;
  background-color: lightgray;
  color: black;
  z-index: 2;
}
.fix-logo {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 329px;
  height: 97px;
  background-image: url(~/assets/img/taoyuan_logo.png);
  background-repeat: no-repeat;
  background-size: cover;
}
.fix-clock {
  position: fixed;
  bottom: 0px;
  right: 10px;
  z-index: 1;
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
