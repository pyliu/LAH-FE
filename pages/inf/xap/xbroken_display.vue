<template lang="pug">
b-carousel(
  ref="carousel",
  v-model="slideIdx",
  :interval="slideInterval",
  no-hover-pause
)
  b-carousel-slide: template(#img): .p-3(v-cloak)
    //- 標題區塊
    .d-flex.justify-content-center.w-100.my-auto(@click="$refs.carousel.next()", title="切換版面")
      .d-flex.my-5
        .h1.lah-shadow.fonte-weight-bold 跨縣市#[span.text-success ONLINE]即時通，服務無礙一點通

    .my-4

    //- 桃園市地所狀態標題
    .d-flex.justify-content-between.align-items-center
      lah-fa-icon.h2(icon="wave-square", action="squeeze") 桃園市所屬地所服務狀態
      lah-fa-icon.h4(
        icon="clock",
        variant="primary",
        action="clock"
      ) 上次更新：{{ TYUpdatedTime }}
    hr.my-3

    //- 桃園市地所區塊 [修改] 統一使用 justify-content-start 依序排列
    client-only: .d-flex.flex-wrap.justify-content-start
      lah-badge-site-status.office.mr-4.mb-4.lah-shadow(
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

    //- 無法提供服務的地所標題
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

    //- 無法提供服務地所清單
    .h1.center(
      v-if="downOffices.length === 0"
    ) 🟢 全國各地所皆可正常提供服務
    .d-flex.flex-wrap.justify-content-start(
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

    //- 固定顯示元件
    lah-clock.fix-clock
    .fix-logo
    .fix-taogirl-L.lah-shadow
    .fix-taogirl-R.lah-shadow

  //- 簡易案件辦理情形幻燈片
  b-carousel-slide(v-if="easyCases.length > 0"): template(#img)
    .center.h1.my-3(@click="$refs.carousel.next()", title="切換版面")
      lah-fa-icon(icon="gear", :variant="reloadEasyCase ? 'warning' : ''", :action="reloadEasyCase ? 'cycle' : 'clock'")
        span.ld-txt(v-if="reloadEasyCase") 讀取中 ...
        span(v-else) 最新#[span.text-info 簡易案件]辦理情形
      lah-fa-icon.ml-1(icon="gear", :variant="reloadEasyCase ? 'warning' : ''", :action="reloadEasyCase ? 'cycle' : 'clock'")
    lah-reg-tracking-cards(:rows="easyCases", :query-day="easyCaseQueryDay", :serial-start="1")

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
    reloadEasyCase: false
  }),
  head: {
    title: '跨縣市ONLINE即時通-桃園市地政局'
  },
  computed: {
    downOffices () {
      return [...this.cachedOfficesData.filter(siteData => siteData.state === 'DOWN')]
    }
  },
  created () {
    this.easyCaseQueryDay = this.$utils.today('TW').replaceAll('-', '')
  },
  mounted () {
    this.reload()
    this.loadEasyCaseState()
    this.$nextTick(() => {
      this.animateGirlL()
      this.animateGirlR()
    })
  },
  beforeDestroy () {
    clearTimeout(this.cachedHandler)
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
        this.timeout(this.animateGirlL, timer)
      })
    },
    animateGirlR () {
      return this.$utils.animated('.fix-taogirl-R', { speed: 'slow' }).then((resolved) => {
        const timer = this.animatedTimerBase + this.$utils.rand(this.animatedTimerBase)
        this.timeout(this.animateGirlR, timer)
      })
    },
    loadEasyCaseState () {
      this.reloadEasyCase = true
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsms_update_by_date',
        qday: this.easyCaseQueryDay
      }).then(({ data }) => {
        this.easyCases = [...this.$utils.orderBy(data.baked, [(row) => {
          return this.latestUpdateTime(row)
        }], ['desc'])].filter((row) => {
          return row.RM08 === '9'
        }).slice(0, this.maxQueueSize)
      }).catch((err) => {
        console.warn(err)
      }).finally(() => {
        this.timeout(this.loadEasyCaseState, 60 * 1000)
        this.reloadEasyCase = false
      })
    },
    latestUpdateTime (row) {
      const targetDate = this.easyCaseQueryDay
      let ok = false
      !ok && targetDate === row.RM105_1 && (ok = row.RM105_2)
      !ok && targetDate === row.RM107_1 && (ok = row.RM107_2)
      !ok && targetDate === row.RM106_1 && (ok = row.RM106_2)
      !ok && targetDate === row.RM93_1 && (ok = row.RM93_2)
      !ok && targetDate === row.RM86 && (ok = row.RM87)
      !ok && targetDate === row.RM53_1 && (ok = row.RM53_2)
      !ok && targetDate === row.RM48_1 && (ok = row.RM48_2)
      !ok && targetDate === row.RM83 && (ok = row.RM84)
      !ok && targetDate === row.RM80 && (ok = row.RM81)
      !ok && targetDate === row.RM58_1 && (ok = row.RM58_2)
      !ok && targetDate === row.RM56_1 && (ok = row.RM56_2)
      !ok && targetDate === row.RM54_1 && (ok = row.RM54_2)
      !ok && targetDate === row.RM46_1 && (ok = row.RM46_2)
      !ok && targetDate === row.RM62_1 && (ok = row.RM62_2)
      !ok && targetDate === row.RM44_1 && (ok = row.RM44_2)
      return ok
    }
  }
}
</script>

<style hide-scroll lang="scss" scoped>
// [修改] 統一區塊樣式設定
.office, .other-office {
  width: 11%;
  height: 15vh;
  border: 1px solid gray;
  border-radius: 15px;
  font-size: xx-large;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
    z-index: 10;
  }
}

.office {
  background-color: white;
}

.other-office {
  background-color: lightgray;
  color: black;
  z-index: 2;
}

// 固定的裝飾元件樣式
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
