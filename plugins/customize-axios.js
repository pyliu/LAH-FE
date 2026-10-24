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
   * @description 解析請求所屬的 API 軌道 (PHP 7.4 vs PHP 8.5)
   */
  const resolveTargetTrack = (url) => {
    let globalTrack = store.state.apiTrack?.globalTrack
    let moduleOverrides = store.state.apiTrack?.moduleOverrides || {}

    // 若客戶端 Store 尚未完全初始化，嘗試自 localStorage 讀取
    if (!globalTrack && process.client && typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(window.localStorage?.getItem('lah-api-track-config') || '{}')
        globalTrack = saved.globalTrack || 'php7'
        moduleOverrides = saved.moduleOverrides || {}
      } catch (e) {
        globalTrack = 'php7'
      }
    }

    if (!url) {
      return globalTrack || 'php7'
    }

    // 擷取端點檔名 (例如 /api/query_json_api.php -> query_json_api)
    const match = url.match(/\/api\/([a-zA-Z0-9_-]+)(?:\.php)?/)
    if (match) {
      const baseName = match[1]
      const fullName = `${baseName}.php`
      if (moduleOverrides[baseName]) {
        return moduleOverrides[baseName]
      }
      if (moduleOverrides[fullName]) {
        return moduleOverrides[fullName]
      }
    }

    return globalTrack || 'php7'
  }

  /**
   * @description 請求攔截器 (Request Interceptor)
   */
  $axios.onRequest((config) => {
    pendingRequests++
    isDev && console.log(`onRequest: 目前 axios request count is ${pendingRequests}`, config)

    // 處理 API 雙軌路由轉發 (PHP 7.4 舊軌 vs PHP 8.5 新軌)
    const isMessengerServer = (config.baseURL && /:808[12]/.test(config.baseURL)) ||
                              (config.url && /:808[12]/.test(config.url))
    if (!isMessengerServer && config.url && (config.url.startsWith('/api/') || config.url.includes('/api/'))) {
      const targetTrack = resolveTargetTrack(config.url)
      if (targetTrack === 'php85') {
        // 重寫 /api/ 為 /LAH-API/api/ (對接 Apache Alias C:/AppServ/LAH-API/v1)
        config.url = config.url.replace(/\/api\//, '/LAH-API/api/')
        config.headers.common['X-LAH-API-Track'] = 'PHP-8.5'
        isDev && console.log(`[API Track] 轉發至 PHP 8.5 FastCGI: ${config.url}`)
      } else {
        config.headers.common['X-LAH-API-Track'] = 'PHP-7.4'
      }
    }

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
    isDev && console.log(`onResponse: 目前 axios request count is ${pendingRequests}`, response)
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
