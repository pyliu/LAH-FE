<template lang="pug">
.d-flex.justify-content-between.small.text-muted
  //- 使用既有的倒數按鈕組件
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
/**
 * 常量定義 - 默認 15 分鐘刷新
 */
const DEFAULT_RELOAD_MS = 15 * 60 * 1000

export default {
  name: 'LahMonitorBoardFooter',
  props: {
    // 修正：require -> required
    reloadMs: { type: Number, required: true, default: DEFAULT_RELOAD_MS },
    busy: { type: Boolean, default: false },
    // 新增：補上 template 中用到但未定義的 prop
    fetchingMonitorMail: { type: Boolean, default: false },
    fetchState: { type: String, default: '' },
    updateTime: { type: String, default: '' }
    // 移除：不再通過 props 接收函數，改用 $emit
  },
  computed: {
    displayFetchState () {
      // 依賴 lodash/utils 檢查非空
      return !this.$utils.empty(this.fetchState)
    },
    // 將邏輯封裝在 computed 中，讓 template 更乾淨
    isActionDisabled () {
      return this.busy || this.fetchingMonitorMail
    }
  },
  watch: {
    // 監聽更新時間變動來重置計時器
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
      // 防禦性編程：確保 refs 存在
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
    // 轉發事件給父組件
    handleFetch () {
      this.$emit('fetch')
    },
    handleReload () {
      // 手動點擊通常也意味著要觸發 fetch，或特定的 reload 邏輯
      this.$emit('reload')
    }
  }
}
</script>
