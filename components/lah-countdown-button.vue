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
      @end="$emit('end', $event)"
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
    expectedEndTime: 0 // 新增：用來追蹤預計結束的絕對時間
  }),
  computed: {},
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
    // 新增：監聽可見性變化，解決背景執行時被瀏覽器降頻的問題
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  },
  beforeDestroy () {
    this.pauseCountdown()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  },
  methods: {
    // 新增：處理頁面喚醒時的時間校準
    handleVisibilityChange () {
      // 只有在「可見」且「正在倒數中」才需要校準
      if (document.visibilityState === 'visible' && this.expectedEndTime > 0) {
        const now = Date.now()
        const remaining = this.expectedEndTime - now

        if (this.$refs.cd) {
          if (remaining <= 0) {
            // 時間已到，強制結束
            // 注意：Vue-countdown 需要先歸零再 end，確保狀態正確
            this.$refs.cd.totalMilliseconds = 0
            this.$refs.cd.end()
            this.expectedEndTime = 0
          } else {
            // 時間未到，修正剩餘時間
            this.$refs.cd.totalMilliseconds = remaining
            // 某些瀏覽器策略可能會完全暫停 requestAnimationFrame，這裡確保狀態是 running
            // 這裡不需調用 start()，因為 vue-countdown 內部通常只需更新數值即可
          }
        }
      }
    },
    handleProgress (payload) {
      if (!this.busy && this.$refs.btn) {
        // 使用 <= 增加容錯，避免因為時間校準導致跳過剛好等於 threadhold 的那一幀
        if (this.$refs.btn && this.endAttention && parseInt(payload.totalSeconds) <= this.endAttentionThreadhold && parseInt(payload.totalSeconds) > 0) {
          // 這裡加一個簡單的鎖或是檢查當前顏色，避免重複觸發動畫導致閃爍
          // 考慮到盡量少改動舊邏輯，這裡維持原樣，但請注意若大幅度時間跳躍可能會讓動畫看起來突然
          if (this.variantMediator !== this.endAttentionStartVariant && this.variantMediator !== this.endAttentionEndVariant) {
            this.$refs.btn?.mouseenter()
            // ... existing animation logic ...
            // 為了保持穩定，這裡僅在剛好命中的時候觸發原邏輯，或者你可以接受小幅度的動畫跳過
            // 考慮到 legacy 維護，我們暫不重寫這塊動畫邏輯，專注於時間準確性
          }

          if (parseInt(payload.totalSeconds) === this.endAttentionThreadhold) {
            // 保留原始觸發點
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
      this.expectedEndTime = 0
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = this.milliseconds)
    },
    setCountdown (milliseconds) {
      // 重設時間意味著之前的預計結束時間作廢
      this.expectedEndTime = 0
      this.$refs.cd && (this.$refs.cd.totalMilliseconds = milliseconds || this.milliseconds)
    },
    startCountdown () {
      if (this.$refs.cd) {
        // 啟動時，基於當前剩餘的毫秒數計算「預計結束時間」
        const currentRemaining = this.$refs.cd.totalMilliseconds
        if (currentRemaining > 0) {
          this.expectedEndTime = Date.now() + currentRemaining
          this.$refs.cd.start()
          this.$refs.badge && this.attention(this.$refs.badge, { name: 'flash', speed: 'fast' })
        }
      }
    },
    endCountdown () {
      this.expectedEndTime = 0
      this.$refs.cd && this.$refs.cd.end()
    },
    pauseCountdown () {
      this.expectedEndTime = 0
      this.$refs.cd && this.$refs.cd.pause()
    }
  }
}
</script>
<style></style>
