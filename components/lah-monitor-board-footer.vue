<template lang="pug">
.d-flex.justify-content-between.small.text-muted
  //- 倒數計時按鈕
  //- 現在按鈕內部已經具備防休眠降頻機制，這裡只需簡單使用即可
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
    // 移除了 fetchingMonitorMail prop 以避免與 Mixin 衝突
    fetchState: { type: String, default: '' },
    updateTime: { type: String, default: '' },
    fetch: { type: Function, default: () => {} },
    reload: { type: Function, default: () => {} }
  },
  computed: {
    displayFetchState () {
      return !this.$utils.empty(this.fetchState)
    },
    isActionDisabled () {
      // 引用 Mixin 中的屬性
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
  beforeDestroy () {
    this.stop()
  },
  methods: {
    reset (ms) {
      if (this.$refs.countdown) {
        // 重置並啟動，按鈕內部會自動計算新的 expectedEndTime
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
      this.fetch()
    },
    handleReload () {
      this.$emit('reload')
      this.reload()
    }
    // 移除了 checkVisibility 與 mounted/destroy 監聽，因為已下放至按鈕組件處理
  }
}
</script>
