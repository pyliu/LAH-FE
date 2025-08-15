/**
 * @mixin cancellableRequests
 * @description 提供自動化的 Axios 請求取消功能。
 * 使用此 Mixin 的元件，可以呼叫 this.cPost, this.cGet 等方法，
 * Mixin 會自動管理 cancel token，並在元件銷毀時取消所有未完成的請求。
 */
export default {
  data: () => ({
    // 存放由本元件發起的、所有正在進行中請求的 cancelId
    _activeCancelIds: []
  }),
  // --- 新增開始：增加 created 生命週期鉤子 ---
  created () {
    // 增加一個防呆機制，確保 _activeCancelIds 必定是一個陣列
    if (!Array.isArray(this._activeCancelIds)) {
      this._activeCancelIds = []
    }
  },
  // --- 新增結束 ---
  beforeDestroy () {
    // 在元件銷毀前，遍歷並取消所有還在進行中的請求
    if (this._activeCancelIds && this._activeCancelIds.length > 0) {
      this.$utils.log(`[${this.$options.name}] 元件銷毀，取消 ${this._activeCancelIds.length} 個請求。`)
      this._activeCancelIds.forEach(id => this.$axios.cancel(id, '元件已銷毀'))
      this._activeCancelIds = []
    }
  },
  methods: {
    /**
     * @description 產製 uuid (由您提供)
     */
    uuid () {
      let d = Date.now()
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now() // use high-precision timer if available
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
      })
    },
    /**
     * @description 發起一個可自動取消的 POST 請求
     * @param {string} url - 請求的 URL
     * @param {object} [data] - 請求的資料
     * @param {object} [config] - Axios 的額外設定
     * @returns {Promise<any>} - Axios 的 Promise 物件
     */
    cPost (url, data, config) {
      return this.cancellableRequest('post', url, data, config)
    },
    /**
     * @description 發起一個可自動取消的 GET 請求
     * @param {string} url - 請求的 URL
     * @param {object} [config] - Axios 的額外設定
     * @returns {Promise<any>} - Axios 的 Promise 物件
     */
    cGet (url, config) {
      return this.cancellableRequest('get', url, undefined, config)
    },
    /**
     * @private
     * @description 執行可取消請求的核心邏輯
     */
    cancellableRequest (method, ...args) {
      const cancelId = this.uuid()
      // 在 push 之前再次確認 _activeCancelIds 是陣列
      if (!Array.isArray(this._activeCancelIds)) {
        this._activeCancelIds = []
      }
      this._activeCancelIds.push(cancelId)

      // 取得 config，如果不存在則建立一個空物件
      const configIndex = method === 'get' ? 1 : 2
      args[configIndex] = args[configIndex] || {}
      // 將 cancelId 加入 config
      args[configIndex].cancelId = cancelId

      const promise = this.$axios[method](...args)

      // 無論請求成功、失敗或被取消，都從追蹤陣列中移除其 ID
      promise.finally(() => {
        if (Array.isArray(this._activeCancelIds)) {
          const index = this._activeCancelIds.indexOf(cancelId)
          if (index > -1) {
            this._activeCancelIds.splice(index, 1)
          }
        }
      })

      return promise
    }
  }
}
