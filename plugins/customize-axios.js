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

  // 子元件 mounted 早於 layout mounted，須在外掛階段還原軌道設定，否則初始請求一律走預設 php7
  if (process.client) {
    store.commit('initApiTrack')
  }

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
    const match = url.match(/(?:\/api\/|\/LAH-API\/api\/)([a-zA-Z0-9_-]+)(?:\.php)?/i)
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
   * @description 判斷請求是否屬於本機 LAH-API 伺服器之 PHP 業務端點
   * @param {string} url - 請求路徑或完整 URL
   * @param {string} [baseURL] - Axios baseURL
   * @returns {boolean}
   */
  const isLahApiRequest = (url, baseURL = '') => {
    if (!url || typeof url !== 'string') {
      return false
    }
    // 已改寫為 PHP 8.5 路由前綴者直接排除
    if (/^(\/)?(LAH-API|lah-api)\//.test(url)) {
      return false
    }
    // 排除即時通訊伺服器 (Port 8081 / 8082)
    if (/:808[12]/.test(baseURL) || /:808[12]/.test(url)) {
      return false
    }
    // 排除 Nuxt 反向代理前綴 (如 /l05proxy, /smsproxy 等 *proxy) 與自訂代理路由 (如 /srmas-weathermap)
    if (/(?:proxy|\/srmas-weathermap)/i.test(url) || /(?:proxy|\/srmas-weathermap)/i.test(baseURL)) {
      return false
    }
    // 排除帶有 /api/v數字/ 的微服務 REST API (如 /api/v1/l05, /api/v1/log)
    if (/\/api\/v\d+\//i.test(url)) {
      return false
    }
    // 相對路徑以 /api/ 或 api/ 開頭者為本地 LAH-API
    if (/^\/?api\//i.test(url)) {
      return true
    }
    // 絕對路徑其根路徑為 /api/ 者為本地 LAH-API
    if (/^https?:\/\/[^/]+\/api\//i.test(url)) {
      return true
    }
    return false
  }

  /**
   * @description 將本機 LAH-API 端點精確開頭錨定改寫為 PHP 8.5 FastCGI 路由
   * @param {string} url
   * @returns {string}
   */
  const rewriteToLahApi85 = (url) => {
    if (/^\/api\//.test(url)) {
      return url.replace(/^\/api\//, '/LAH-API/api/')
    }
    if (/^api\//.test(url)) {
      return url.replace(/^api\//, 'LAH-API/api/')
    }
    if (/^https?:\/\/[^/]+\/api\//.test(url)) {
      return url.replace(/^((?:https?:\/\/[^/]+)?)\/api\//, '$1/LAH-API/api/')
    }
    return url
  }

  /**
   * @description 請求攔截器 (Request Interceptor)
   */
  $axios.onRequest((config) => {
    pendingRequests++
    isDev && console.log(`onRequest: 目前 axios request count is ${pendingRequests}`, config)

    // 處理 API 雙軌路由轉發 (PHP 7.4 舊軌 vs PHP 8.5 新軌)
    if (isLahApiRequest(config.url, config.baseURL)) {
      const targetTrack = resolveTargetTrack(config.url)
      if (targetTrack === 'php85') {
        // 精確改寫為 /LAH-API/api/ (對接 Apache Alias C:/AppServ/LAH-API/v1)
        config.url = rewriteToLahApi85(config.url)
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
