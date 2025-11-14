<template lang="pug">
b-button(
  :variant="btnVariant",
  :pill="pill",
  :size="size",
  @click="check(true)",
  title="重新測試",
  v-b-tooltip="`${updateTime}: ${message} (${updateTimeToNow})`"
): .d-flex.align-items-center.justify-content-center
  lah-fa-icon.mr-1(
    v-if="loading"
    icon="spinner",
    action="spin"
  )
  span.mr-1(v-else-if="!fill") {{ lightIcon }}
  //- span(:class="textCss") {{ name }}
  .d-flex.flex-column
    span.office-name {{ name }}
    span.updated-time(v-if="displayUpdateTime") {{ displayUpdateTimeToNow ? updateTimeToNow : updateTime }}
  b-badge.ml-1(
    v-if="badge && status < 1 && status !== -2"
    :variant="badgeVariant"
  ) {{ headers[0] }}
</template>

<script>
export default {
  emit: ['updated', 'click'],
  component: {},
  props: {
    watchSite: { type: String, default: 'HX', require: true },
    pill: { type: Boolean, default: false },
    badge: { type: Boolean, default: true },
    size: { type: String, default: 'md' },
    period: { type: String, default: '60000' },
    fill: { type: Boolean, default: true },
    short: { type: Boolean, default: false },
    shortAlt: { type: Boolean, default: false },
    badgeVariant: { type: String, default: 'light' },
    textVariant: { type: String, default: '' },
    textBold: { type: Boolean, default: false },
    /**
     * serial / id / name / state / response / timestamp
     * 1 / XX / XX地政事務所 / UP / HTTP/1.1 401 Unauthorized / 1694060279
     */
    staticData: { type: Object, default: null },
    displayUpdateTime: { type: Boolean, default: false },
    displayUpdateTimeToNow: { type: Boolean, default: false }
  },
  data: () => ({
    status: 0,
    headers: [],
    message: '',
    timer: null,
    clearTimer: null,
    officeCacheKey: 'office-cached-key',
    officesData: [],
    updateTimestamp: +new Date()
  }),
  fetch () {
    this.getCache(this.officeCacheKey).then((json) => {
      if (json === false) {
        this.$axios.post(this.$consts.API.JSON.SYSTEM, {
          type: 'all_offices'
        }).then(({ data }) => {
          if (Array.isArray(data.raw)) {
            // elimite out of date data
            this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
            // a day ms
            const cacheMs = 24 * 60 * 60 * 1000
            this.setCache(this.officeCacheKey, data, cacheMs)
            this.$utils.log('已重新讀取各地政事務所對應資料。')
          } else {
            this.$utils.error('無法取得各地政事務所對應資料。', data)
          }
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
        })
      } else if (Array.isArray(json.raw)) {
        // elimite out of date data
        this.officesData = [...json.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
        this.$utils.log('已從快取回復各地政事務所對應資料。')
      } else {
        this.$utils.error('無法從快取回復各地政事務所資料。')
      }
    })
  },
  computed: {
    isStatic () {
      return !this.$utils.empty(this.staticData)
    },
    outlineVariant () {
      if (this.status > 0) {
        return 'outline-success'
      }
      if (this.loading) {
        return 'outline-light'
      }
      if (this.isTimeout) {
        return 'outline-warning'
      }
      return 'outline-danger'
    },
    btnVariant () {
      if (this.isStatic) {
        return 'outline-secondary'
      }
      return this.fill || this.loading ? this.variant : this.outlineVariant
    },
    name () {
      if (this.isStatic) {
        if (this.shortAlt) {
          return `${this.staticData.name.replace(/(所|地政事務所)/g, '')}`
        }
        return this.short ? this.staticData.name.replace(/(所|地政事務所)/g, '') : `${this.staticData.id} ${this.staticData.name}`
      }
      // item: { ID: 'HX', NAME: 'XXX', ALIAS: 'XXX'}
      const found = this.officesData.find(item => item.ID === this.watchSite)
      const name = found ? found?.NAME : this.watchSite
      if (this.shortAlt) {
        // return `${this.watchSite} ${name.replace(/(所|地政事務所)/g, '')}`
        return `${name.replace(/(所|地政事務所)/g, '')}`
      }
      return this.short ? name.replace(/(所|地政事務所)/g, '') : `${this.watchSite} ${name}`
    },
    variant () {
      if (this.status > 0) {
        return 'success'
      }
      if (this.loading) {
        return 'light'
      }
      if (this.isStatic && this.staticData.id.startsWith('H')) {
        return 'danger'
      }
      // if (this.isTimeout) {
      //   return 'warning'
      // }
      return 'warning'
    },
    lightIcon () {
      switch (this.variant) {
        case 'success':
          return '🟢'
        case 'light':
          return '⚪'
        case 'warning':
          return '🟡'
        case 'danger':
          return '🔴'
        default:
          return '❓'
      }
    },
    siteStatusCacheMap () {
      return this.$store.getters['inf/siteStatusCacheMap']
    },
    updateTime () {
      return this.$utils.formatTime(new Date(this.updateTimestamp))
    },
    updateTimeToNow () {
      return this.$utils.formatDistanceToNow(+new Date(`${this.updateDate} ${this.updateTime}`))
    },
    updateDate () {
      return this.$utils.formatDate(new Date(this.updateTimestamp))
    },
    loading () {
      return this.status === -2
    },
    isTimeout () {
      return this.headers.length > 0 && this.$utils.empty(this.headers[0])
    },
    textCss () {
      const css = [this.textVariant]
      if (!this.textBold) {
        css.push('font-weight-bolder')
      }
      return css
    }
  },
  watch: {
    officesData (val) {
      // console.warn(val)
    }
  },
  created () {
    if (this.isStatic) {
      this.status = this.staticData.state === 'UP' ? 1 : 0
      this.headers.push(this.staticData.response)
      this.message = this.status > 0 ? `${this.staticData.id}服務正常` : `${this.staticData.id}服務異常`
      // override the message if there is no response (connection timeout)
      if (this.isTimeout) {
        this.message = `${this.staticData.id}測試連線逾時`
      }
    } else {
      // 100ms ~ 1000ms
      const bounceMs = Math.floor(Math.random() * 1000) + 100
      this.clearTimer = setInterval(() => {
        // console.warn(`${this.watchSite} delete cache.`)
        this.siteStatusCacheMap.delete(this.watchSite)
      }, (parseInt(this.period) || 60000) + bounceMs)
    }
  },
  mounted () {
    if (!this.isStatic) {
      // 4ms ~ 400ms
      const bounceMs = (Math.floor(Math.random() * 100) + 1) * 4
      this.timeout(this.check, bounceMs)
    }
  },
  beforeDestroy () {
    clearTimeout(this.timer)
    clearInterval(this.clearTimer)
  },
  methods: {
    check (force = false) {
      if (this.isStatic) {
        // static mode only emit click event
        this.$emit('click')
        return
      }
      if (this.loading) {
        this.nextRun()
        return
      }
      // console.warn(`${this.watchSite} start checking ...`)
      // this.isBusy = true
      this.message = '檢測中 ... '
      this.status = -2
      force && this.siteStatusCacheMap.delete(this.watchSite)
      const cached = this.siteStatusCacheMap.get(this.watchSite)
      if (cached) {
        this.message = cached.message
        this.headers = [...cached.raw]
        this.status = cached.status
        // console.warn(`${this.watchSite} cache hit!!`)
        this.$emit('updated', cached)
        this.nextRun()
      } else {
        this.$axios.post(this.$consts.API.JSON.IP, {
          type: 'check_site_http',
          site: this.watchSite
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.$utils.log(`${this.watchSite}測試連線成功`)
            this.headers = [...data.raw]
            this.status = data.status
            this.message = data.message
            if (this.isTimeout) {
              this.message = `${this.watchSite}測試連線逾時`
            }
            if (!this.$utils.statusCheck(this.status)) {
              this.$utils.warn(data.message)
            }
            this.$emit('updated', data)
            this.siteStatusCacheMap.set(this.watchSite, data)
          } else {
            this.$utils.warn(`${this.watchSite}測試連線失敗`, data)
          }
        }).catch((err) => {
          this.status = -1
          this.message = err.toString()
          this.$utils.error(err)
        }).finally(() => {
          this.updateTimestamp = +new Date()
          this.isBusy = false
          this.nextRun()
        })
      }
    },
    nextRun () {
      // 100ms ~ 1000ms
      const bounceMs = Math.floor(Math.random() * 1000) + 100
      clearTimeout(this.timer)
      this.timeout(this.check, (parseInt(this.period) || 60000) + bounceMs).then((handler) => { this.timer = handler })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 所名稱字型 */
.office-name {
  text-align: left;
  // font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  line-height: 1.3; /* 調整行高 */
}
/* 經過時間樣式 */
.updated-time {
  font-size: 0.85rem; /* 縮小字體 */
  color: #6c757d;   /* 輔助文字顏色 (Bootstrap secondary) */
  line-height: 1.2;
}
</style>
