<template lang="pug">
//- 使用 v-on="$listeners" 確保所有父組件綁定的事件(如 click)都能透傳到內部的 lah-button
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
    // ✅ 修正：使用正確拼寫 Threshold
    endAttentionThreshold: { type: Number, default: 10 }
  },
  data: () => ({
    variantMediator: 'primary',

    // 時間狀態
    remainingTime: 0,
    endTime: 0,
    isRunning: false,

    // 計時器 ID
    rAFId: null, // UI 更新用 (頁面可見時運作)
    endTimerId: null, // 結束觸發用 (背景執行時兜底)

    lastSecondChecked: -1,
    animationTimeouts: [] // 用於清理動畫計時器
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
          this.remainingTime = Math.max(0, val)
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

    // ─── 核心控制邏輯 ───

    startCountdown () {
      this.cleanup()

      let msToCount = this.remainingTime
      // 防呆：如果剩餘時間 <= 0，重置為預設值
      if (msToCount <= 0) {
        msToCount = this.milliseconds > 0 ? this.milliseconds : 15 * 60 * 1000
      }

      this.endTime = Date.now() + msToCount
      this.isRunning = true
      this.lastSecondChecked = -1

      // 1. 設定精確的結束觸發器
      this.endTimerId = setTimeout(() => {
        this.remainingTime = 0
        this.handleEnd()
      }, msToCount)

      // 2. 啟動 UI 渲染迴圈
      this.loop()

      this.$emit('start')
      this.triggerAttention('flash', 'fast')
    },

    // UI 渲染迴圈
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

      // 每秒檢查一次動畫
      const currentSec = Math.ceil(diff / 1000)
      if (currentSec !== this.lastSecondChecked) {
        this.lastSecondChecked = currentSec
        this.checkAnimations(currentSec)
      }

      this.rAFId = requestAnimationFrame(this.loop)
    },

    pauseCountdown () {
      this.cleanup()
      this.isRunning = false
    },

    resetCountdown () {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = Math.max(0, this.milliseconds)
      this.lastSecondChecked = -1
    },

    setCountdown (ms) {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = Math.max(0, ms || this.milliseconds)
      this.lastSecondChecked = -1
    },

    // 🛡️ 關鍵修正：清理計時器並重置外觀
    cleanup () {
      if (this.rAFId) {
        cancelAnimationFrame(this.rAFId)
        this.rAFId = null
      }
      if (this.endTimerId) {
        clearTimeout(this.endTimerId)
        this.endTimerId = null
      }
      this.animationTimeouts.forEach(id => clearTimeout(id))
      this.animationTimeouts = []

      // 【修復】強制重置 variant，防止顏色卡在紅色(danger)
      if (this.variantMediator !== this.variant) {
        this.variantMediator = this.variant
      }
      // 【修復】強制重置按鈕的 hover/active 狀態
      if (this.$refs.btn && typeof this.$refs.btn.mouseleave === 'function') {
        this.$refs.btn.mouseleave()
      }
    },

    handleEnd () {
      this.cleanup()
      this.isRunning = false
      this.remainingTime = 0

      // 非同步觸發，避免阻塞
      setTimeout(() => {
        this.$emit('end')
      }, 0)
    },

    // 頁面喚醒時的狀態檢查與救援
    handleVisibilityChange () {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const diff = this.endTime - now

        if (this.isRunning) {
          if (diff <= 0) {
            this.handleEnd()
          } else {
            this.remainingTime = diff
            if (!this.rAFId) {
              this.loop()
            }
          }
        } else {
          // 死鎖救援：00:00 且長時間無動作
          if (this.remainingTime === 0 && !this.busy) {
            if (diff < -2000) {
              console.warn('🕒 倒數組件喚醒：偵測到狀態卡死 (00:00 且無動作)，正在嘗試救援...')
              this.$emit('end')

              if (this.autoStart) {
                setTimeout(() => {
                  if (!this.isRunning && this.remainingTime === 0) {
                    console.warn('🔄 父組件無響應，執行 Fail-safe 自動重啟')
                    this.remainingTime = this.milliseconds
                    this.startCountdown()
                  }
                }, 1000)
              }
            }
          }
        }
      }
    },

    // ─── 動畫邏輯 ───

    checkAnimations (totalSeconds) {
      if (!this.busy && this.$refs.btn) {
        // 使用正確的拼寫 endAttentionThreshold
        if (this.endAttention && totalSeconds <= this.endAttentionThreshold && totalSeconds > 0) {
          if (this.variantMediator !== this.endAttentionStartVariant && this.variantMediator !== this.endAttentionEndVariant) {
            this.$refs.btn?.mouseenter?.()
          }

          if (totalSeconds === this.endAttentionThreshold) {
            const oldVariant = this.variantMediator
            this.variantMediator = this.endAttentionStartVariant

            const t1 = setTimeout(() => {
              if (this.isRunning) { this.variantMediator = this.endAttentionEndVariant }
            }, (this.endAttentionThreshold / 2) * 1000)

            const t2 = setTimeout(() => {
              if (this.isRunning) {
                this.variantMediator = oldVariant
                this.$refs.btn?.mouseleave?.()
              }
            }, this.endAttentionThreshold * 1000)

            this.animationTimeouts.push(t1, t2)
          }
        }

        if (totalSeconds === 1) {
          this.triggerAttention(null, 'faster')
        }
      }
    },

    triggerAttention (name, speed) {
      if (this.$refs.badge && typeof this.attention === 'function') {
        const el = name === 'flash' ? this.$refs.badge : this.$el
        this.attention(el, { name: name || 'flash', speed })
      }
    }
  }
}
</script>
