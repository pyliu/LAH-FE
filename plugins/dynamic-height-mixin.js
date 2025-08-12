/**
 * @mixin dynamicHeight
 * @description 提供動態計算元件最大高度的響應式功能。
 * 整合了 ResizeObserver、window resize 事件以及 iframe 縮放偵測，
 * 確保在各種情況下都能正確更新高度。
 *
 * @props {Number} maxHeightOffset - 計算高度時，從視窗總高度中減去的像素值，用於預留底部空間。
 *
 * @data {Number} maxHeight - 計算出的最大高度值(px)，可直接用於 b-table 的 sticky-header。
 *
 * @example
 * import dynamicHeight from '~/mixins/dynamicHeight.js'
 * export default {
 * mixins: [dynamicHeight],
 * props: {
 * // 可在此覆寫 mixin 的預設 offset
 * maxHeightOffset: { type: Number, default: 150 }
 * }
 * }
 */
export default {
  data: () => ({
    maxHeight: 600,
    maxHeightOffset: 150,
    resizeObserver: null,
    zoomDetectorFrame: null
  }),
  mounted () {
    // 1. 高度計算函式
    this.updateMaxHeight = () => {
      this.$nextTick(() => {
        if (this.$el?.getBoundingClientRect) {
          const topOffset = this.$el.getBoundingClientRect().top
          const newHeight = window.innerHeight - topOffset - this.maxHeightOffset
          this.maxHeight = Math.max(200, newHeight)
          // this.$utils.warn(`動態高度更新(Mixin): top=${topOffset}, new=${newHeight}, final=${this.maxHeight}`)
        }
      })
    }
    // 2. Debounced 版本的函式
    this.debouncedUpdateHeight = this.$utils.debounce(this.updateMaxHeight, 150)
    // 3. ResizeObserver
    this.resizeObserver = new ResizeObserver(this.debouncedUpdateHeight)
    this.resizeObserver.observe(this.$el)
    // 4. 'resize' 事件監聽
    window.addEventListener('resize', this.debouncedUpdateHeight)

    // 5. 建立並設定隱藏的 iframe 用於偵測縮放
    this.zoomDetectorFrame = document.createElement('iframe')
    const frameStyle = this.zoomDetectorFrame.style
    frameStyle.position = 'absolute'
    frameStyle.top = '-9999px'
    frameStyle.left = '-9999px'
    frameStyle.width = '100%'
    frameStyle.height = '100%'
    frameStyle.border = 'none'
    frameStyle.opacity = '0'
    frameStyle.pointerEvents = 'none'
    this.$el.appendChild(this.zoomDetectorFrame)
    this.zoomDetectorFrame.contentWindow.addEventListener('resize', this.debouncedUpdateHeight)

    // 6. 立即執行一次以設定初始高度
    this.updateMaxHeight()
  },
  beforeDestroy () {
    // 1. 移除 'resize' 事件監聽器
    window.removeEventListener('resize', this.debouncedUpdateHeight)
    // 2. 停止 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    // 3. 清理 iframe 相關的資源
    if (this.zoomDetectorFrame) {
      this.zoomDetectorFrame.contentWindow.removeEventListener('resize', this.debouncedUpdateHeight)
      if (this.zoomDetectorFrame.parentNode) {
        this.zoomDetectorFrame.parentNode.removeChild(this.zoomDetectorFrame)
      }
      this.zoomDetectorFrame = null
    }
  }
}
