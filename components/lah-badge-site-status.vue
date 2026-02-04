<template lang="pug">
b-button(
  :variant="btnVariant",
  :pill="pill",
  :size="size",
  @click="check(true)",
  title="重新測試",
  v-b-tooltip="tooltipConfig"
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
// --- 全域請求佇列控制 (Global Request Queue) ---
// 這確保即使有 60+ 個元件實例，同時也只有 MAX_CONCURRENT 個請求在進行
const REQUEST_QUEUE = []
const MAX_CONCURRENT = 4 // 限制同時 4 個請求，避免瀏覽器卡死
let ACTIVE_COUNT = 0

const processQueue = () => {
  if (REQUEST_QUEUE.length === 0 || ACTIVE_COUNT >= MAX_CONCURRENT) { return }

  const { task, resolve, reject } = REQUEST_QUEUE.shift()
  ACTIVE_COUNT++

  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      ACTIVE_COUNT--
      processQueue() // 遞迴處理下一個
    })
}

const enqueueRequest = (task) => {
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push({ task, resolve, reject })
    processQueue()
  })
}
// -------------------------------------------

export default {
  emit: ['updated', 'click'],
  name: 'LahBadgeSiteStatus',
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
    updateTimestamp: +new Date(),
    isDestroyed: false,
    areaColorMap: {
      HA: 'primary',
      HB: 'success',
      HC: 'danger',
      HD: 'warning',
      HE: 'info',
      HF: 'dark',
      HG: 'secondary',
      HH: 'light'
    }
  }),
  fetch () {
    this.getCache(this.officeCacheKey).then((json) => {
      if (json === false) {
        this.$axios.post(this.$consts.API.JSON.SYSTEM, {
          type: 'all_offices'
        }).then(({ data }) => {
          if (Array.isArray(data.raw)) {
            this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
            const cacheMs = 24 * 60 * 60 * 1000
            this.setCache(this.officeCacheKey, data, cacheMs)
          }
        }).catch((err) => {
          this.$utils.error(err)
        })
      } else if (Array.isArray(json.raw)) {
        this.officesData = [...json.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
      }
    })
  },
  computed: {
    isStatic () {
      return !this.$utils.empty(this.staticData)
    },
    outlineVariant () {
      if (this.status > 0) { return 'outline-success' }
      if (this.loading) { return 'outline-light' }
      if (this.isTimeout) { return 'outline-warning' }
      return 'outline-danger'
    },
    btnVariant () {
      if (this.isStatic) { return 'outline-secondary' }
      return this.fill || this.loading ? this.variant : this.outlineVariant
    },
    name () {
      if (this.isStatic) {
        if (this.shortAlt) { return `${this.staticData.name.replace(/(所|地政事務所)/g, '')}` }
        return this.short ? this.staticData.name.replace(/(所|地政事務所)/g, '') : `${this.staticData.id} ${this.staticData.name}`
      }
      const found = this.officesData.find(item => item.ID === this.watchSite)
      const name = found ? found?.NAME : this.watchSite
      if (this.shortAlt) { return `${name.replace(/(所|地政事務所)/g, '')}` }
      return this.short ? name.replace(/(所|地政事務所)/g, '') : `${this.watchSite} ${name}`
    },
    variant () {
      if (this.status > 0) { return 'success' }
      if (this.loading) { return 'light' }
      if (this.isStatic && this.staticData.id.startsWith('H')) { return 'danger' }
      return 'warning'
    },
    lightIcon () {
      switch (this.variant) {
        case 'success': return '🟢'
        case 'light': return '⚪'
        case 'warning': return '🟡'
        case 'danger': return '🔴'
        default: return '❓'
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
    tooltipConfig () {
      const site = this.isStatic ? this.staticData.id : this.watchSite
      const variant = this.areaColorMap[site] || 'secondary'
      return {
        title: `${this.updateTime}: ${this.message} (${this.displayUpdateTimeToNow ? this.updateTime : this.updateTimeToNow})`,
        variant
      }
    }
  },
  created () {
    if (this.isStatic) {
      this.status = this.staticData.state === 'UP' ? 1 : 0
      this.headers.push(this.staticData.response)
      this.message = this.status > 0 ? `${this.staticData.id}服務正常` : `${this.staticData.id}服務異常`
      if (this.isTimeout) { this.message = `${this.staticData.id}測試連線逾時` }
    } else {
      const bounceMs = Math.floor(Math.random() * 1000) + 100
      this.clearTimer = setInterval(() => {
        this.siteStatusCacheMap.delete(this.watchSite)
      }, (parseInt(this.period) || 60000) + bounceMs)
    }
  },
  mounted () {
    if (!this.isStatic) {
      // 隨機延遲啟動，避免同時塞進 Queue (雖然有 Queue 保護，分散一點還是比較好)
      const bounceMs = (Math.floor(Math.random() * 100) + 1) * 10
      this.timeout(this.check, bounceMs)
    }
  },
  beforeDestroy () {
    this.isDestroyed = true
    clearTimeout(this.timer)
    clearInterval(this.clearTimer)
  },
  methods: {
    check (force = false) {
      if (this.isStatic) {
        this.$emit('click')
        return
      }
      if (this.loading) {
        // 如果已經在載入中，通常不需重複觸發，但為了安全起見，可以安排下次檢查
        // 這裡我們選擇等待
        return
      }

      this.message = '檢測中 ... '
      this.status = -2
      force && this.siteStatusCacheMap.delete(this.watchSite)

      const cached = this.siteStatusCacheMap.get(this.watchSite)
      if (cached) {
        this.message = cached.message
        this.headers = [...cached.raw]
        this.status = cached.status
        // 補上 site 屬性，確保父層能識別
        cached.site = this.watchSite
        this.$emit('updated', cached)
        this.nextRun()
      } else {
        // 定義 Axios 任務
        const task = () => this.$axios.post(this.$consts.API.JSON.IP, {
          type: 'check_site_http',
          site: this.watchSite
        }, {
          timeout: 2500 // 2.5秒超時
        })

        // 放入佇列執行
        enqueueRequest(task).then(({ data }) => {
          if (this.isDestroyed) { return }

          if (this.$utils.statusCheck(data.status)) {
            // 成功
            this.$utils.log(`${this.watchSite}測試連線成功`)
            this.headers = [...data.raw]
            this.status = data.status
            this.message = data.message
            if (this.isTimeout) {
              this.message = `${this.watchSite}測試連線逾時`
            }
            // 補上 site 屬性
            data.site = this.watchSite
            this.$emit('updated', data)
            this.siteStatusCacheMap.set(this.watchSite, data)
          } else {
            // 邏輯錯誤
            this.$utils.warn(`${this.watchSite}測試連線失敗`, data)
            this.status = -1 // 標記為錯誤
            // 發送失敗事件給父層
            this.$emit('updated', { site: this.watchSite, status: -1, message: data.message })
          }
        }).catch((err) => {
          if (this.isDestroyed) { return }
          // 網路錯誤
          this.status = -1
          this.message = err.message || '連線錯誤'
          this.$utils.error(err)
          // 發送失敗事件給父層
          this.$emit('updated', { site: this.watchSite, status: -1, message: this.message })
        }).finally(() => {
          if (!this.isDestroyed) {
            this.updateTimestamp = +new Date()
            // 移除 isBusy，status 改變就會更新 UI
            this.nextRun()
          }
        })
      }
    },
    nextRun () {
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
  font-weight: 500;
  color: #333;
  line-height: 1.3;
}
/* 經過時間樣式 */
.updated-time {
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.2;
}
</style>
