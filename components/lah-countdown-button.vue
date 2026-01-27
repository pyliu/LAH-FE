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
    //- 將 auto-start 設為 false，我們將手動控制時間更新
    //- 移除 @progress，因為我們將手動計算進度
    countdown(
      ref="cd"
      :time="displayTime"
      :auto-start="false"
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
    displayTime: 0, // 給 UI 顯示用的剩餘時間
    targetTime: 0, // 預計結束的絕對時間戳 (Epoch ms)
    watchdogTimer: null, // 驅動計時器
    isRunning: false, // 內部運行狀態
    lastTotalSeconds: -1 // 記錄上一次的秒數，避免重複觸發秒級動畫
  }),
  watch: {
    variant (val) {
      this.variantMediator = val
    },
    milliseconds: {
      immediate: true,
      handler (val) {
        this.displayTime = val
        // 若在靜止狀態下，確保 UI 也同步更新
        if (!this.isRunning && this.$refs.cd) {
          this.$refs.cd.totalMilliseconds = val
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
    this.stopLogic()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    // --- 核心控制邏輯 ---

    startCountdown () {
      this.stopLogic()

      const ms = this.milliseconds > 0 ? this.milliseconds : 15 * 60 * 1000
      this.targetTime = Date.now() + ms
      this.isRunning = true
      this.lastTotalSeconds = Math.ceil(ms / 1000)

      // 更新 UI 初始狀態
      this.updateDisplay(ms)

      // 使用 100ms 的頻率進行驅動，解決 UI 卡頓問題
      // 這種方式將 countdown 組件降級為純顯示器，邏輯完全由我們控制
      this.watchdogTimer = setInterval(this.checkTime, 100)

      this.$emit('start')
      this.$refs.badge && this.attention(this.$refs.badge, { name: 'flash', speed: 'fast' })
    },

    pauseCountdown () {
      this.stopLogic()
      // 暫停時 UI 停留在當前剩餘時間
    },

    resetCountdown () {
      this.stopLogic()
      this.displayTime = this.milliseconds
      this.updateDisplay(this.milliseconds)
    },

    setCountdown (ms) {
      this.stopLogic()
      this.displayTime = ms || this.milliseconds
      this.updateDisplay(this.displayTime)
    },

    stopLogic () {
      this.isRunning = false
      this.targetTime = 0
      this.lastTotalSeconds = -1
      if (this.watchdogTimer) {
        clearInterval(this.watchdogTimer)
        this.watchdogTimer = null
      }
    },

    // --- 驅動核心 ---

    checkTime () {
      if (!this.isRunning || this.targetTime === 0) { return }

      const now = Date.now()
      const remaining = this.targetTime - now

      if (remaining <= 0) {
        this.triggerEnd()
      } else {
        // 1. 強制更新 UI 時間
        this.updateDisplay(remaining)

        // 2. 觸發秒級邏輯 (動畫等)
        const currentTotalSeconds = Math.ceil(remaining / 1000)
        if (currentTotalSeconds !== this.lastTotalSeconds) {
          this.lastTotalSeconds = currentTotalSeconds
          this.handleUiProgress({ totalSeconds: currentTotalSeconds })
        }
      }
    },

    updateDisplay (ms) {
      // 只有當 ms 有變動且組件存在時才更新，雖然 vue-countdown 內部可能已有優化
      if (this.$refs.cd) {
        // 直接修改 totalMilliseconds 會觸發 vue-countdown 的 computed 重新計算
        this.$refs.cd.totalMilliseconds = ms < 0 ? 0 : ms
      }
    },

    triggerEnd () {
      this.stopLogic()
      this.updateDisplay(0)
      this.$emit('end')
    },

    handleVisibilityChange () {
      // 喚醒時立即執行一次檢查，修正可能的背景偏差
      if (document.visibilityState === 'visible') {
        this.checkTime()
      }
    },

    // --- UI 動畫邏輯 ---
    handleUiProgress (payload) {
      if (!this.busy && this.$refs.btn) {
        const totalSeconds = payload.totalSeconds

        // 警告區間動畫
        if (this.endAttention && totalSeconds <= this.endAttentionThreadhold && totalSeconds > 0) {
          if (this.variantMediator !== this.endAttentionStartVariant && this.variantMediator !== this.endAttentionEndVariant) {
            this.$refs.btn?.mouseenter()
          }
          if (totalSeconds === this.endAttentionThreadhold) {
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

        // 最後一秒心跳加速
        if (totalSeconds === 1) {
          this.attention(this.$el, { speed: 'faster' })
        }
      }
    }
  }
}
</script>
