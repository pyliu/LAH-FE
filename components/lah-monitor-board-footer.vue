<template lang="pug">
.d-flex.justify-content-between.small.text-muted
  //- 倒數計時按鈕
  lah-countdown-button.border-0(
    ref="countdown",
    size="sm",
    icon="sync-alt",
    action="ld-cycle",
    auto-start,
    title="立即重新讀取",
    variant="outline-secondary",
    badge-variant="secondary",
    :milliseconds="reloadMs",
    :disabled="isActionDisabled",
    :busy="busy",
    @end="handleFetch",
    @click="handleReload"
  )

  //- 狀態顯示過渡效果
  lah-transition: .my-auto.small(v-if="displayFetchState") {{ fetchState }}

  //- 更新時間顯示
  lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updateTime }}
</template>

<script>
const DEFAULT_RELOAD_MS = 15 * 60 * 1000

export default {
  name: 'LahMonitorBoardFooter',
  props: {
    reloadMs: { type: Number, default: DEFAULT_RELOAD_MS },
    busy: { type: Boolean, default: false },
    // 雖然全域 Mixin 可能有定義，但為了明確性與避免 IDE 警告，這裡不宣告 fetchingMonitorMail
    // 直接在 computed 中使用 this.fetchingMonitorMail (由 Mixin 提供)
    fetchState: { type: String, default: '' },
    updateTime: { type: String, default: '' }
  },
  data: () => ({
    lastResetTime: 0
  }),
  computed: {
    displayFetchState () {
      return !this.$utils.empty(this.fetchState)
    },
    // 這裡的 this.fetchingMonitorMail 會自動指向 Mixin 中的計算屬性
    isActionDisabled () {
      // 安全訪問，防止 Mixin 未混入時報錯
      const fetching = this.fetchingMonitorMail || false
      return this.busy || fetching
    }
  },
  watch: {
    updateTime (val) {
      if (val) {
        this.reset(this.reloadMs)
      }
    }
  },
  mounted () {
    // 初始化最後重置時間
    this.lastResetTime = Date.now()
    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', this.checkVisibility)
  },
  beforeDestroy () {
    this.stop()
    // 移除監聽器，防止內存洩漏
    document.removeEventListener('visibilitychange', this.checkVisibility)
  },
  methods: {
    reset (ms) {
      // 記錄這次重置的絕對時間戳
      this.lastResetTime = Date.now()

      if (this.$refs.countdown) {
        this.$refs.countdown.setCountdown(ms)
        this.$refs.countdown.startCountdown()
      }
    },
    stop () {
      if (this.$refs.countdown) {
        this.$refs.countdown.pauseCountdown()
      }
    },
    handleFetch () {
      this.$emit('fetch')
    },
    handleReload () {
      this.$emit('reload')
    },
    checkVisibility () {
      // 只在頁面變為可見時處理
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        // 計算從上次重置到現在經過了多少毫秒
        const elapsed = now - this.lastResetTime
        // 計算理論上的剩餘時間
        const remaining = this.reloadMs - elapsed

        if (remaining <= 0) {
          // 如果時間已經超過了，且目前沒有在忙碌，則立即觸發更新
          // 這裡加一點緩衝檢查，避免剛好在邊界時重複觸發
          if (!this.busy && !this.isActionDisabled) {
            this.$utils.warn('👀 頁面喚醒：倒數已過期，觸發重載。')
            this.handleFetch()
          }
        } else if (this.$refs.countdown) {
          // 注意：這裡不更新 lastResetTime，因為這只是校準，不是重新開始週期
          this.$refs.countdown.setCountdown(remaining)
          this.$refs.countdown.startCountdown()
        }
      }
    }
  }
}
</script>
