<template lang="pug">
lah-button.align-middle(
  ref="btn"
  :icon="icon"
  :variant="variantMediator"
  :size="size"
  :action="action"
  :busy="busy"
  :spin="busy"
  :no-icon-gutter="noBadge"
  :disabled="busy"
  @click="$emit('click', $event)"
)
  slot
  b-badge.ml-1(v-show="!noBadge" ref="badge" :variant="badgeVariant")
    countdown(
      ref="cd"
      :time="milliseconds"
      :auto-start="false"
      @end="handleComponentEnd"
      @start="$emit('start', $event)"
      @progress="handleProgress"
    ): template(slot-scope="props").
        #[span(v-if="props.hours > 0") {{ props.hours.toString().padStart(2, '0') }}:]
        #[span(v-if="props.minutes > 0") {{ props.minutes.toString().padStart(2, '0') }}:]{{ props.seconds.toString().padStart(2, '0') }}
    span.sr-only 倒數
</template>

<script>
import VueCountdown from '@chenfengyuan/vue-countdown';

export default {
  name: 'LahCountdownButton',
  components: { countdown: VueCountdown },
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
    expectedEndTime: 0,
    checkTimer: null, // 看門狗計時器
    isEnded: false // 防止重複觸發的旗標
  }),
  watch: {
    variant (val) {
      this.variantMediator = val
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
    this.stopWatchdog()
    this.pauseCountdown()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    // 統一處理元件內部的 end 事件
    handleComponentEnd () {
      // 如果已經由看門狗觸發過，這裡就不再處理
      if (!this.isEnded) {
        this.triggerEnd()
      }
    },
    // 看門狗邏輯：每5秒檢查一次絕對時間
    startWatchdog () {
      this.stopWatchdog() // 先清除舊的
      this.isEnded = false
      // 每 5000ms 檢查一次，這在大多數背景標籤頁中仍能運作，且降低負擔
      this.checkTimer = setInterval(() => {
        this.checkTime()
      }, 5000)
    },
    stopWatchdog () {
      if (this.checkTimer) {
        clearInterval(this.checkTimer)
        this.checkTimer = null
      }
    },
    // 檢查時間是否已到
    checkTime () {
      if (this.expectedEndTime > 0) {
        const now = Date.now()
        // 給予 500ms 的緩衝，避免剛好等於時的邊界問題
        if (now >= (this.expectedEndTime - 500)) {
          this.triggerEnd()
        }
      }
    },
    // 頁面喚醒時的處理
    handleVisibilityChange () {
      if (document.visibilityState === 'visible') {
        // 1. 喚醒時立即檢查一次看門狗
        this.checkTime()

        // 2. 如果還沒結束，進行時間校準
        if (!this.isEnded && this.expectedEndTime > 0) {
          const now = Date.now()
          const remaining = this.expectedEndTime - now

          if (remaining > 0 && this.$refs.cd) {
            // 校準組件顯示時間
            this.$refs.cd.totalMilliseconds = remaining
            // 確保組件仍在運行（有時瀏覽器會暫停它）
            if (!this.$refs.cd.counting) {
              this.$refs.cd.start()
            }
          }
        }
      }
    },
    // 【核心補救方法】強制結束並發送事件
    triggerEnd () {
      // 雙重鎖定，防止多次觸發
      if (this.isEnded) { return }
      this.isEnded = true

      this.stopWatchdog()
      this.expectedEndTime = 0

      // 強制更新 UI 為 00:00:00
      if (this.$refs.cd) {
        this.$refs.cd.totalMilliseconds = 0
        this.$refs.cd.end()
      }

      // 使用 setTimeout 確保脫離當前執行堆疊，讓父組件能接收到
      setTimeout(() => {
        console.warn('🕒 倒數結束，強制觸發 fetch', new Date().toLocaleTimeString())
        this.$emit('end')
      }, 0)
    },
    handleProgress (payload) {
      if (!this.busy && this.$refs.btn) {
        if (this.$refs.btn && this.endAttention && parseInt(payload.totalSeconds) <= this.endAttentionThreadhold && parseInt(payload.totalSeconds) > 0) {
          if (this.variantMediator !== this.endAttentionStartVariant && this.variantMediator !== this.endAttentionEndVariant) {
            this.$refs.btn?.mouseenter()
          }
          if (parseInt(payload.totalSeconds) === this.endAttentionThreadhold) {
            const oldVariant = this.variantMediator
            this.variantMediator = this.endAttentionStartVariant
            this.timeout(() => {
              this.variantMediator = this.endAttentionEndVariant
            }, (this.endAttentionThreadhold / 2) * 1000)
            this.timeout(() => {
              this.variantMediator = oldVariant
              this.$refs.btn?.mouseleave()
            }, this.endAttentionThreadhold * 1000)
          }
        }
        if (parseInt(payload.totalSeconds) === 1) {
          this.attention(this.$el, { speed: 'faster' })
        }
      }
    },
    resetCountdown () {
      this.stopWatchdog()
      this.expectedEndTime = 0
      this.isEnded = false
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = this.milliseconds)
    },
    setCountdown (milliseconds) {
      this.stopWatchdog()
      this.expectedEndTime = 0
      this.isEnded = false
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = milliseconds || this.milliseconds)
    },
    startCountdown () {
      if (this.$refs.cd) {
        const currentRemaining = this.$refs.cd.totalMilliseconds
        if (currentRemaining > 0) {
          this.expectedEndTime = Date.now() + currentRemaining
          this.$refs.cd.start()
          this.$refs.badge && this.attention(this.$refs.badge, { name: 'flash', speed: 'fast' })

          // 啟動看門狗
          this.startWatchdog()
        } else {
          // 如果時間已經是 0，直接觸發結束
          this.triggerEnd()
        }
      }
    },
    endCountdown () {
      this.triggerEnd()
    },
    pauseCountdown () {
      this.stopWatchdog()
      this.expectedEndTime = 0
      this.$refs.cd && this.$refs.cd.pause()
    }
  }
}
</script>
