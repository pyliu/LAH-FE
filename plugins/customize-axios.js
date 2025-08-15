import qs from 'qs'

export default function ({ $axios, redirect, store, isDev }, inject) {
  /**
   * @description 追蹤當前正在進行中的請求數量
   */
  let pendingRequests = 0

  // 採用 Axios 官方的全局取消模式 ---

  // 1. 建立一個全局的 CancelToken 來源
  let cancelTokenSource = $axios.CancelToken.source()

  /**
   * @description 擴充 $axios，增加一個 cancelAll 方法
   * @param {string} [message] - 取消時的提示訊息
   */
  $axios.cancelAll = (message = '所有進行中的請求已被取消') => {
    isDev && console.log(`[Axios] ${message}`)
    // 2. 呼叫 cancel() 來中斷所有使用此 token 的請求
    cancelTokenSource.cancel(message)
    // 3. (關鍵) 立即建立一個新的 CancelToken 來源，供後續的請求使用
    cancelTokenSource = $axios.CancelToken.source()
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

    // 為每個請求都掛上當前全局的 cancelToken
    config.cancelToken = cancelTokenSource.token

    return config
  })

  /**
   * @description 回應攔截器 (Response Interceptor)
   */
  $axios.onResponse((response) => {
    pendingRequests--
    isDev && console.log(`onResponse: 目前 axios request count is ${pendingRequests}`)
    return response
  })

  /**
   * @description 錯誤攔截器 (Error Interceptor)
   */
  $axios.onError((error) => {
    pendingRequests--

    // 雅地處理請求被取消的狀況 ---
    if ($axios.isCancel(error)) {
      isDev && console.log('Request canceled:', error.message)
      // 返回一個 resolved 的 Promise，這樣元件端的 .catch 就不會被觸發
      return Promise.resolve({ data: { status: 'cancelled', message: error.message } })
    } else {
      console.error('Axios Error:', error)
    }

    return Promise.reject(error)
  })
}
