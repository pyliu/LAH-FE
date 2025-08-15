import qs from 'qs'

export default function ({ $axios, redirect, store, isDev }, inject) {
  /**
   * @description 追蹤當前正在進行中的請求數量
   */
  let pendingRequests = 0

  const cancelTokens = new Map()

  /**
   * @description 擴充 $axios，增加一個 cancel 方法，用於取消指定 ID 的請求
   * @param {string} cancelId - 要取消的請求 ID
   * @param {string} [message] - 取消時的提示訊息
   */
  $axios.cancel = (cancelId, message = '請求已由使用者主動取消') => {
    isDev && console.log(`axios ${message}`, cancelId)
    if (cancelTokens.has(cancelId)) {
      cancelTokens.get(cancelId).cancel(message)
      cancelTokens.delete(cancelId)
    }
  }

  /**
   * @description 擴充 $axios，增加一個 cancelAll 方法，用於取消所有請求
   * @param {string} [message] - 取消時的提示訊息
   */
  $axios.cancelAll = (message = '因頁面切換，所有請求已取消') => {
    isDev && console.warn(`準備取消所有 ${cancelTokens.size} 個進行中的請求...`)
    for (const [cancelId, source] of cancelTokens.entries()) {
      source.cancel(message)
      cancelTokens.delete(cancelId)
    }
  }

  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  $axios.defaults.headers.common.CLIENT_IP = store.getters.ip

  /**
   * @description 請求攔截器 (Request Interceptor)
   */
  $axios.onRequest((config) => {
    pendingRequests++
    isDev && console.log(`onRequest: 目前 axios request count is ${pendingRequests}`)

    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }

    if (config.cancelId) {
      $axios.cancel(config.cancelId, `發起了新的 '${config.cancelId}' 請求，舊請求已取消。`)
      const source = $axios.CancelToken.source()
      config.cancelToken = source.token
      cancelTokens.set(config.cancelId, source)
    }

    return config
  })

  /**
   * @description 回應攔截器 (Response Interceptor)
   */
  $axios.onResponse((response) => {
    pendingRequests--
    isDev && console.log(`onResponse: 目前 axios request count is ${pendingRequests}`)
    if (response.config.cancelId) {
      cancelTokens.delete(response.config.cancelId)
    }
    return response
  })

  /**
   * @description 錯誤攔截器 (Error Interceptor)
   */
  $axios.onError((error) => {
    pendingRequests--
    isDev && console.warn(`onError: 目前 axios request count is ${pendingRequests}`)

    if (error.config && error.config.cancelId) {
      cancelTokens.delete(error.config.cancelId)
    }

    if ($axios.isCancel(error)) {
      isDev && console.log('Request canceled:', error.message)
      return Promise.resolve(false)
    } else {
      console.error('Axios Error:', error)
    }
    return Promise.reject(error)
  })

  // const originalPost = $axios.post.bind($axios)
  // const attemptMax = 3
  // const baseDelay = 100
  // const maxDelay = 1000
  // const postWithConcurrencyCheck = function (...args) {
  //   // 從參數中取得 config 物件，以便讀取 cancelId
  //   const config = args[2] || {}

  //   const checkAndPost = async (attempt = 1) => {
  //     // --- 修改開始：在每次重試前檢查請求是否已被取消 ---
  //     // 如果請求有 cancelId，且這個 Id 已經不在我們的追蹤 Map 中，
  //     // 表示它已經被外部呼叫了 cancel() 或 cancelAll()
  //     if (config.cancelId && !cancelTokens.has(config.cancelId)) {
  //       isDev && console.log(`[Axios Post] 請求 '${config.cancelId}' 在等待期間已被取消，中止重試。`)
  //       // 中止後續的重試或請求
  //       return Promise.resolve(false)
  //     }
  //     // --- 修改結束 ---

  //     if (attempt > attemptMax) {
  //       isDev && console.warn(`[Axios Post] 重試已達 ${attempt - 1} 次上限，直接發送請求...`, args)
  //       return originalPost(...args)
  //     }
  //     if (pendingRequests > 0) {
  //       const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
  //       const delayWithJitter = exponentialDelay + random(0, 100)
  //       const finalDelay = Math.min(delayWithJitter, maxDelay)
  //       // isDev && console.log(`[Axios Post] 偵測到壅塞，啟用指數退避機制，延遲 ${finalDelay}ms 後重試... (第 ${attempt} 次)`)
  //       await new Promise(resolve => setTimeout(resolve, finalDelay))
  //       return checkAndPost(attempt + 1)
  //     } else {
  //       return originalPost(...args)
  //     }
  //   }
  //   return checkAndPost()
  // }
  // $axios.post = postWithConcurrencyCheck
  // $axios.oPost = originalPost
}
