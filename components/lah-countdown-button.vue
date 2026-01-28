<template lang="pug">
//- 使用 v-on="$listeners" 將所有事件(包含 click) 直接透傳給內部的 lah-button
lah-button.align-middle(
  ref="btn"
  v-on="$listeners"
  :icon="icon"
  :variant="variantMediator"
  :size="size"
  :action="action"
  :busy="busy"
  :spin="busy"
  :no-icon-gutter="noBadge"
  :disabled="busy"
)
  slot
  b-badge.ml-1(v-show="!noBadge" ref="badge" :variant="badgeVariant")
    span(v-if="hours > 0") {{ padZero(hours) }}:
    span(v-if="minutes > 0") {{ padZero(minutes) }}:
    span {{ padZero(seconds) }}
    span.sr-only 倒數
</template>

<script>
export default {
  name: 'LahCountdownButton',
  props: {
    variant: { type: String, default: 'primary' },
    badgeVariant: { type: String, default: 'light' },
    size: { type: String, default: '' },
    icon: { type: String, default: '' },
    milliseconds: { type: Number, default: 5 * 60 * 1000 },
    action: { type: String, default: '' },
    autoStart: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    noBadge: { type: Boolean, default: false },
    endAttention: { type: Boolean, default: true },
    endAttentionStartVariant: { type: String, default: 'warning' },
    endAttentionEndVariant: { type: String, default: 'danger' },
    endAttentionThreadhold: { type: Number, default: 10 }
  },
  data: () => ({
    variantMediator: 'primary',

    // 時間狀態
    remainingTime: 0,
    endTime: 0,
    isRunning: false,

    // 現代化計時器 ID
    rAFId: null, // requestAnimationFrame ID (UI 用)
    endTimerId: null, // setTimeout ID (結束觸發用)

    lastSecondChecked: -1
  }),
  computed: {
    hours () { return Math.floor(this.remainingTime / 3600000) },
    minutes () { return Math.floor((this.remainingTime % 3600000) / 60000) },
    seconds () { return Math.floor((this.remainingTime % 60000) / 1000) }
  },
  watch: {
    variant (val) {
      this.variantMediator = val
    },
    milliseconds: {
      immediate: true,
      handler (val) {
        if (!this.isRunning) {
          this.remainingTime = val
        }
      }
    }
  },
  created () {
    this.variantMediator = this.variant
  },
  mounted () {
    if (this.autoStart) {
      this.startCountdown()
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  },
  beforeDestroy () {
    this.cleanup()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    padZero (num) {
      return num.toString().padStart(2, '0')
    },

    // ─── 現代化核心控制 ───

    startCountdown () {
      this.cleanup()

      let msToCount = this.remainingTime
      if (msToCount <= 0) {
        msToCount = this.milliseconds > 0 ? this.milliseconds : 15 * 60 * 1000
      }

      this.endTime = Date.now() + msToCount
      this.isRunning = true
      this.lastSecondChecked = -1

      // 1. 設定結束觸發器
      this.endTimerId = setTimeout(() => {
        this.remainingTime = 0
        this.handleEnd()
      }, msToCount)

      // 2. 啟動 UI 渲染迴圈
      this.loop()

      this.$emit('start')
      if (this.$refs.badge && typeof this.attention === 'function') {
        this.attention(this.$refs.badge, { name: 'flash', speed: 'fast' })
      }
    },

    // UI 渲染迴圈 (requestAnimationFrame)
    loop () {
      if (!this.isRunning) { return }

      const now = Date.now()
      const diff = this.endTime - now

      if (diff <= 0) {
        this.remainingTime = 0
        if (this.isRunning) { this.handleEnd() }
        return
      }

      this.remainingTime = diff

      // 檢查動畫 (每秒一次)
      const currentSec = Math.ceil(diff / 1000)
      if (currentSec !== this.lastSecondChecked) {
        this.lastSecondChecked = currentSec
        this.checkAnimations(currentSec)
      }

      // 請求下一幀
      this.rAFId = requestAnimationFrame(this.loop)
    },

    pauseCountdown () {
      this.cleanup()
      this.isRunning = false
    },

    resetCountdown () {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = this.milliseconds
      this.lastSecondChecked = -1
    },

    setCountdown (ms) {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = ms || this.milliseconds
      this.lastSecondChecked = -1
    },

    cleanup () {
      if (this.rAFId) {
        cancelAnimationFrame(this.rAFId)
        this.rAFId = null
      }
      if (this.endTimerId) {
        clearTimeout(this.endTimerId)
        this.endTimerId = null
      }
    },

    handleEnd () {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = 0

      setTimeout(() => {
        this.$emit('end')
      }, 0)
    },

    handleVisibilityChange () {
      if (document.visibilityState === 'visible' && this.isRunning) {
        const now = Date.now()
        const diff = this.endTime - now
        if (diff <= 0) {
          this.handleEnd()
        } else {
          this.remainingTime = diff
          if (!this.rAFId) {
            this.loop()
          }
        }
      }
    },

    // ─── 動畫邏輯 ───

    checkAnimations (totalSeconds) {
      if (!this.busy && this.$refs.btn) {
        if (this.endAttention && totalSeconds <= this.endAttentionThreadhold && totalSeconds > 0) {
          if (this.variantMediator !== this.endAttentionStartVariant && this.variantMediator !== this.endAttentionEndVariant) {
            // 安全訪問
            if (this.$refs.btn.mouseenter) { this.$refs.btn.mouseenter() }
          }
          if (totalSeconds === this.endAttentionThreadhold) {
            const oldVariant = this.variantMediator
            this.variantMediator = this.endAttentionStartVariant

            this.timeout(() => {
              this.variantMediator = this.endAttentionEndVariant
            }, (this.endAttentionThreadhold / 2) * 1000)

            this.timeout(() => {
              this.variantMediator = oldVariant
              if (this.$refs.btn.mouseleave) { this.$refs.btn.mouseleave() }
            }, this.endAttentionThreadhold * 1000)
          }
        }
        if (totalSeconds === 1) {
          if (typeof this.attention === 'function') {
            this.attention(this.$el, { speed: 'faster' })
          }
        }
      }
    }
  }
}
</script>
