<template lang="pug">
b-button(
  :variant="tile ? 'outline-light' : btnVariant",
  :pill="pill && !tile",
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

  //- 一般模式 (原有 Layout)
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

  //- 卡片模式 (Tile Mode Layout) - 模仿 broken_cached 風格
  .d-flex.flex-column.align-items-center.justify-content-center.w-100(v-else)
    //- 上半部：燈號 + 名稱
    .d-flex.align-items-center.mb-1
      template(v-if="!loading")
        //- 使用 FontAwesome 圖示
        lah-fa-icon.mr-1(v-if="variant === 'success'", icon="circle-check", variant="success")
        lah-fa-icon.mr-1(v-else-if="variant === 'danger'", icon="circle-xmark", variant="danger", action="breath")
        lah-fa-icon.mr-1(v-else-if="variant === 'warning'", icon="triangle-exclamation", variant="warning")
        lah-fa-icon.mr-1(v-else, icon="question-circle", variant="secondary")

      span.office-name.font-weight-bold {{ name }}

    //- 下半部：訊息 (錯誤訊息或時間)
    //- 如果有錯誤訊息 (Badge內容)，顯示錯誤訊息
    .error-msg.w-100(v-if="status < 1 && status !== -2")
      | {{ headers[0] || message }}
    //- 否則顯示時間 (如果開啟)
    .updated-time.mt-1(v-else-if="displayUpdateTime")
      | {{ displayUpdateTimeToNow ? updateTimeToNow : updateTime }}

</template>

<script>
// --- 全域請求佇列控制 (Global Request Queue) ---
const REQUEST_QUEUE = []
const MAX_CONCURRENT = 4
let ACTIVE_COUNT = 0

const processQueue = () => {
  if (REQUEST_QUEUE.length === 0 || ACTIVE_COUNT >= MAX_CONCURRENT) { return }
  const { task, resolve, reject } = REQUEST_QUEUE.shift()
  ACTIVE_COUNT++
  task().then(resolve).catch(reject).finally(() => {
    ACTIVE_COUNT--
    processQueue()
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
    displayUpdateTimeToNow: { type: Boolean, default: false },
    // 新增屬性
    tile: { type: Boolean, default: false }, // 是否啟用卡片模式
    pinned: { type: Boolean, default: false } // 是否被釘選
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
      return 'warning'
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
    updateDate () { return this.$utils.formatDate(new Date(this.updateTimestamp)) },
    loading () { return this.status === -2 },
    isTimeout () { return this.headers.length > 0 && this.$utils.empty(this.headers[0]) },
    tooltipConfig () {
      const site = this.isStatic ? this.staticData.id : this.watchSite
      const variant = this.areaColorMap[site] || 'secondary'
      return {
        title: `${this.updateTime}: ${this.message} (${this.displayUpdateTimeToNow ? this.updateTimeToNow : this.updateTime})`,
        variant
      }
    },
    // 動態 CSS 類別
    tileClasses () {
      const classes = []
      if (this.tile) {
        classes.push('modern-tile')
        // 根據狀態設定邊框顏色
        if (this.pinned) {
          classes.push('pinned-border')
        } else if (this.status > 0) {
          // 正常狀態下，若是桃園所顯示 info 色，否則 light
          classes.push(this.watchSite.startsWith('H') ? 'border-info' : 'border-light')
        } else if (this.loading) {
          classes.push('border-warning bg-warning-light')
        } else {
          classes.push('border-danger bg-danger-light')
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
      if (this.isTimeout) { this.message = `${this.staticData.id}測試連線逾時` }
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
    if (!this.isStatic) {
      const bounceMs = (Math.floor(Math.random() * 100) + 1) * 10
      this.timeout(this.check, bounceMs)
    }
  },
  beforeDestroy () {
    this.isDestroyed = true
    clearTimeout(this.timer)
    clearInterval(this.clearTimer)
    clearInterval(this.nowTimer)
  },
  methods: {
    check (force = false) {
      if (this.isStatic) { this.$emit('click'); return }
      if (this.loading) { return }

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
        }, { timeout: 2500 }) // 2.5s Timeout

        enqueueRequest(task).then(({ data }) => {
          if (this.isDestroyed) { return }
          if (this.$utils.statusCheck(data.status)) {
            this.$utils.log(`${this.watchSite}測試連線成功`)
            this.headers = [...data.raw]
            this.status = data.status
            this.message = data.message
            if (this.isTimeout) { this.message = `${this.watchSite}測試連線逾時` }
            data.site = this.watchSite
            this.$emit('updated', data)
            this.siteStatusCacheMap.set(this.watchSite, data)
          } else {
            this.$utils.warn(`${this.watchSite}測試連線失敗`, data)
            this.status = -1
            this.$emit('updated', { site: this.watchSite, status: -1, message: data.message })
          }
        }).catch((err) => {
          if (this.isDestroyed) { return }
          this.status = -1
          this.message = err.toString()
          this.$utils.error(err)
          this.$emit('updated', { site: this.watchSite, status: -1, message: this.message })
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
  /* 移除預設按鈕邊框，由 tile 樣式接管 */
  &.modern-tile {
    border-width: 2px !important;
    border-style: solid !important;
    background-color: white !important;
    color: #333 !important; /* 強制文字顏色 */
    height: 100%;
    width: 100%;
    min-height: 80px;

    /* 陰影與動畫 */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      z-index: 10;
    }
  }
}

/* 狀態樣式 */
.bg-danger-light {
  background-color: #fff5f5 !important;
  animation: pulse-danger-border 2s infinite;
}
.bg-warning-light {
  background-color: #fff3cd !important;
  animation: pulse-warning-border 2s infinite;
}
.pinned-border {
  border: 1.5px solid black !important;
  box-shadow: 0 0 0.1rem rgba(0, 123, 255, 0.5);
}

/* 動畫 Keyframes */
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
  line-height: 1.2;
}
.updated-time {
  font-size: 0.8rem;
  color: #6c757d;
}
.error-msg {
  font-size: 0.85rem;
  color: #dc3545;
  word-break: break-all;
  white-space: normal; /* 允許換行 */
  line-height: 1.2;
}
.truncate-badge {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}
</style>
