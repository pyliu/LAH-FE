<template lang="pug">
b-button(
  :variant="tile ? 'outline-light' : btnVariant",
  :pill="pill",
  :size="size",
  @click="check(true)",
  title="重新測試",
  v-b-tooltip="tooltipConfig",
  :class="['site-status-btn', tileClasses]"
)
  //- 讀取中轉圈 (共用)
  lah-fa-icon.mr-1(
    v-if="loading"
    icon="spinner",
    action="spin"
  )

  //- 一般模式
  .d-flex.align-items-center.justify-content-center(v-if="!tile")
    span.mr-1(v-if="!fill && !loading") {{ lightIcon }}
    .d-flex.flex-column
      span.office-name {{ name }}
      span.updated-time(v-if="displayUpdateTime") {{ displayUpdateTimeToNow ? updateTimeToNow : updateTime }}
    b-badge.ml-1.truncate-badge(
      v-if="badge && status < 1 && status !== -2"
      :variant="badgeVariant"
      :title="headers[0]"
    ) {{ headers[0] }}

  //- 卡片模式 (Tile Mode Layout)
  .d-flex.flex-column.align-items-center.justify-content-center.w-100(v-else)
    //- 上半部：燈號 + 名稱
    .d-flex.align-items-center.mb-1
      template(v-if="!loading")
        lah-fa-icon.mr-1(v-if="variant === 'success'", icon="circle-check", variant="success")
        lah-fa-icon.mr-1(v-else-if="variant === 'danger'", icon="circle-xmark", variant="danger", action="breath")
        lah-fa-icon.mr-1(v-else-if="variant === 'warning'", icon="triangle-exclamation", variant="warning")
        lah-fa-icon.mr-1(v-else, icon="question-circle", variant="secondary")

      span.office-name.font-weight-bold {{ name }}

    //- 下半部：訊息 (錯誤訊息或時間)
    //- 若有訊息內容 (headers[0]) 則顯示訊息內容
    .error-msg.w-100(v-if="status < 1 && status !== -2")
      | {{ headers[0] || message }}
    //- 否則顯示時間
    .updated-time.mt-1(v-else-if="displayUpdateTime")
      | {{ displayUpdateTimeToNow ? updateTimeToNow : updateTime }}

</template>

<script>
// --- 全域請求佇列控制 (Global Request Queue) ---
const REQUEST_QUEUE = []
const MAX_CONCURRENT = 4
let ACTIVE_COUNT = 0
let MOUNTED_COUNT = 0

const processQueue = () => {
  if (REQUEST_QUEUE.length === 0 || ACTIVE_COUNT >= MAX_CONCURRENT) { return }

  while (REQUEST_QUEUE.length > 0) {
    const head = REQUEST_QUEUE[0]
    if (head.context && head.context.isDestroyed) {
      REQUEST_QUEUE.shift()
    } else {
      break
    }
  }

  if (REQUEST_QUEUE.length === 0) { return }

  const { task, resolve, reject } = REQUEST_QUEUE.shift()
  ACTIVE_COUNT++

  task()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      ACTIVE_COUNT--
      processQueue()
    })
}

const enqueueRequest = (task, context) => {
  return new Promise((resolve, reject) => {
    REQUEST_QUEUE.push({ task, resolve, reject, context })
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
    displayUpdateTimeToNow: { type: Boolean, default: false },
    tile: { type: Boolean, default: false }
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
    },
    now: +new Date(),
    nowTimer: null
  }),
  fetch () {
    this.getCache(this.officeCacheKey).then((json) => {
      if (json === false) {
        this.$axios.post(this.$consts.API.JSON.SYSTEM, { type: 'all_offices' }).then(({ data }) => {
          if (Array.isArray(data.raw)) {
            this.officesData = [...data.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
            this.setCache(this.officeCacheKey, data, 24 * 60 * 60 * 1000)
          }
        }).catch((err) => { this.$utils.error(err) })
      } else if (Array.isArray(json.raw)) {
        this.officesData = [...json.raw.filter(item => !['CB', 'CC'].includes(item.ID))]
      }
    })
  },
  computed: {
    isStatic () { return !this.$utils.empty(this.staticData) },
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
      if (this.status === 0) { return 'warning' }
      return 'danger'
    },
    lightIcon () {
      switch (this.variant) {
        case 'success': return '🟢'; case 'light': return '⚪'
        case 'warning': return '🟡'; case 'danger': return '🔴'; default: return '❓'
      }
    },
    siteStatusCacheMap () { return this.$store.getters['inf/siteStatusCacheMap'] },
    updateTime () { return this.$utils.formatTime(new Date(this.updateTimestamp)) },
    updateTimeToNow () {
      if (this.now > 0) { return this.$utils.formatDistanceToNow(this.updateTimestamp) }
      return ''
    },
    loading () { return this.status === -2 },
    isTimeout () { return this.headers.length > 0 && (this.headers[0]?.includes('逾時') || this.$utils.empty(this.headers[0])) },
    tooltipConfig () {
      const site = this.isStatic ? this.staticData.id : this.watchSite
      const variant = this.areaColorMap[site] || 'secondary'
      return {
        title: `${this.updateTime}: ${this.message} (${this.displayUpdateTimeToNow ? this.updateTimeToNow : this.updateTime})`,
        variant
      }
    },
    tileClasses () {
      const classes = []
      if (this.tile) {
        classes.push('modern-tile')
        // 優先處理異常
        if (this.loading || this.status === 0) {
          classes.push('border-warning bg-warning-light')
        } else if (this.status < 0) {
          classes.push('border-danger bg-danger-light')
        } else {
          // 正常
          classes.push(this.watchSite.startsWith('H') ? 'border-info' : 'border-light')
        }
      }
      return classes
    }
  },
  created () {
    if (this.isStatic) {
      this.status = this.staticData.state === 'UP' ? 1 : 0
      this.headers.push(this.staticData.response)
      this.message = this.status > 0 ? `${this.staticData.id}服務正常` : `${this.staticData.id}服務異常`
    } else {
      const bounceMs = Math.floor(Math.random() * 1000) + 100
      this.clearTimer = setInterval(() => {
        this.siteStatusCacheMap.delete(this.watchSite)
      }, (parseInt(this.period) || 60000) + bounceMs)
    }
    if (this.displayUpdateTimeToNow) {
      this.nowTimer = setInterval(() => { this.now = +new Date() }, 5000)
    }
  },
  mounted () {
    MOUNTED_COUNT++
    if (!this.isStatic) {
      const bounceMs = (Math.floor(Math.random() * 100) + 1) * 10
      this.timeout(this.check, bounceMs)
    }
  },
  beforeDestroy () {
    MOUNTED_COUNT--
    this.isDestroyed = true
    if (MOUNTED_COUNT <= 0) {
      REQUEST_QUEUE.length = 0
      MOUNTED_COUNT = 0
    }
    clearTimeout(this.timer)
    clearInterval(this.clearTimer)
    clearInterval(this.nowTimer)
  },
  methods: {
    check (force = false) {
      if (this.isStatic) { this.$emit('click'); return }
      if (this.loading) { return }

      // [核心修正] 開始檢查前，清空舊的 headers 訊息
      this.headers = []
      this.message = '檢測中 ... '
      this.status = -2

      force && this.siteStatusCacheMap.delete(this.watchSite)

      const cached = this.siteStatusCacheMap.get(this.watchSite)
      if (cached) {
        this.message = cached.message
        this.headers = [...cached.raw]
        this.status = cached.status
        cached.site = this.watchSite
        this.$emit('updated', cached)
        this.nextRun()
      } else {
        const task = () => this.$axios.post(this.$consts.API.JSON.IP, {
          type: 'check_site_http',
          site: this.watchSite
        }, { timeout: 2500 })

        enqueueRequest(task, this).then(({ data }) => {
          if (this.isDestroyed) { return }
          // 401 也視為成功
          if (this.$utils.statusCheck(data.status) || data.status === 401) {
            this.headers = [...data.raw]
            this.status = data.status
            this.message = data.message
            data.site = this.watchSite
            this.$emit('updated', data)
            this.siteStatusCacheMap.set(this.watchSite, data)
          } else {
            this.status = -1
            this.$emit('updated', { site: this.watchSite, status: -1, message: data.message })
          }
        }).catch((err) => {
          if (this.isDestroyed) { return }

          // [核心修正] 強化逾時判定邏輯
          const errStr = err.toString().toLowerCase()
          const isTimeout = err.code === 'ECONNABORTED' || errStr.includes('timeout') || errStr.includes('exceeded')

          if (isTimeout) {
            this.status = 0
            this.message = '連線逾時'
            this.headers = ['連線逾時']
          } else {
            this.status = -1
            this.message = err.toString()
            this.headers = [this.message]
          }
          this.$emit('updated', { site: this.watchSite, status: this.status, message: this.message })
        }).finally(() => {
          if (!this.isDestroyed) {
            this.updateTimestamp = +new Date()
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
.site-status-btn {
  &.modern-tile {
    border-width: 2px !important;
    border-style: solid !important;
    background-color: white !important;
    color: #333 !important;
    height: 100%;
    width: 100%;
    min-height: 80px;
    border-radius: 12px !important; // 確保足夠圓潤
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }

    &.border-warning {
      border-color: #ffc107 !important;
      box-shadow: 0 0 0.2rem rgba(255, 193, 7, 0.5);
    }
    &.border-danger {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0.2rem rgba(220, 53, 69, 0.5);
    }
    &.border-info { border-color: #17a2b8 !important; }
    &.border-light { border-color: #f8f9fa !important; }
  }
}

.bg-danger-light {
  background-color: #fff5f5 !important;
  animation: pulse-danger-border 2s infinite;
}
.bg-warning-light {
  background-color: #fff3cd !important;
  animation: pulse-warning-border 2s infinite;
}

@keyframes pulse-danger-border {
  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}
@keyframes pulse-warning-border {
  0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
}

.office-name {
  text-align: left;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
}
.updated-time {
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.2;
}
.error-msg {
  font-size: 0.85rem;
  color: #dc3545;
  word-break: break-all;
  white-space: normal;
  line-height: 1.2;
}
</style>
