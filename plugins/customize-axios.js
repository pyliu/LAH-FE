import random from 'lodash/random'
import qs from 'qs'

export default function ({ $axios, redirect, store, isDev }, inject) {
  /**
   * @description 追蹤當前正在進行中的請求數量
   */
  let pendingRequests = 0

  // --- 修改開始：移除單一的全局 cancelTokenSource ---
  // const cancelTokenSource = $axios.CancelToken.source()

  // --- 新增開始：使用 Map 來管理多個可取消的請求 ---
  const cancelTokens = new Map()

  /**
   * @description 擴充 $axios，增加一個 cancel 方法，用於取消指定 ID 的請求
   * @param {string} cancelId - 要取消的請求 ID
   * @param {string} [message] - 取消時的提示訊息
   */
  $axios.cancel = (cancelId, message = '請求已由元件主動取消') => {
    if (cancelTokens.has(cancelId)) {
      cancelTokens.get(cancelId).cancel(message)
      cancelTokens.delete(cancelId)
    }
  }
  // --- 新增結束 ---

  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  $axios.defaults.headers.common.CLIENT_IP = store.getters.ip

  /**
   * @description 請求攔截器 (Request Interceptor)
   */
  $axios.onRequest((config) => {
    pendingRequests++

    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }

    // --- 修改開始：將全局 cancelToken 替換為基於 cancelId 的動態 Token ---
    // config.cancelToken = cancelTokenSource.token

    // 檢查請求的 config 中是否有 cancelId
    if (config.cancelId) {
      // 如果有，就取消上一個相同 ID 的請求 (避免重複觸發)
      $axios.cancel(config.cancelId, `發起了新的 '${config.cancelId}' 請求，舊請求已取消。`)

      // 為這次新的請求建立一個 CancelToken 來源
      const source = $axios.CancelToken.source()
      // 將 cancelToken 附加到這次請求的 config 中
      config.cancelToken = source.token
      // 將新的 source 物件存入 Map
      cancelTokens.set(config.cancelId, source)
    }
    // --- 修改結束 ---

    return config
  })

  /**
   * @description 回應攔截器 (Response Interceptor)
   */
  $axios.onResponse((response) => {
    pendingRequests--
    // --- 新增開始：請求成功後，從 Map 中移除對應的 CancelToken ---
    if (response.config.cancelId) {
      cancelTokens.delete(response.config.cancelId)
    }
    // --- 新增結束 ---
    return response
  })

  /**
   * @description 錯誤攔截器 (Error Interceptor)
   */
  $axios.onError((error) => {
    pendingRequests--

    // --- 新增開始：請求失敗後，也從 Map 中移除對應的 CancelToken ---
    if (error.config && error.config.cancelId) {
      cancelTokens.delete(error.config.cancelId)
    }
    // --- 新增結束 ---

    if ($axios.isCancel(error)) {
      isDev && console.log('Request canceled:', error.message)
      // 【重要】返回一個 resolved 的 Promise，這樣元件端的 .catch 就不會被觸發
      return Promise.resolve(false)
    } else {
      console.error('Axios Error:', error)
      // redirect('/error')
    }
    return Promise.reject(error)
  })

  // --- 保留您現有的併發控制邏輯 (不做任何修改) ---
  const originalPost = $axios.post.bind($axios)
  const attemptMax = 11
  const baseDelay = 100
  const maxDelay = 2000
  const postWithConcurrencyCheck = function (...args) {
    const checkAndPost = async (attempt = 1) => {
      if (attempt > attemptMax) {
        isDev && console.warn(`[Axios Post] 重試已達 ${attempt - 1} 次上限，直接發送請求...`, args)
        return originalPost(...args)
      }
      if (pendingRequests > 0) {
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
        const delayWithJitter = exponentialDelay + random(0, 100)
        const finalDelay = Math.min(delayWithJitter, maxDelay)
        isDev && console.log(`[Axios Post] 偵測到壅塞，啟用指數退避機制，延遲 ${finalDelay}ms 後重試... (第 ${attempt} 次)`)
        await new Promise(resolve => setTimeout(resolve, finalDelay))
        return checkAndPost(attempt + 1)
      } else {
        return originalPost(...args)
      }
    }
    return checkAndPost()
  }
  $axios.post = postWithConcurrencyCheck
  $axios.oPost = originalPost
  // --- 併發控制邏輯結束 ---

  // --- 修改開始：移除舊的 inject ---
  // inject('acts', cancelTokenSource) // <--- 移除此行
}
