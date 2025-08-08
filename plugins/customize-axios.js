import random from 'lodash/random'
import qs from 'qs'

export default function ({ $axios, redirect, store, isDev }, inject) {
  /**
   * @description 追蹤當前正在進行中的請求數量
   */
  let pendingRequests = 0

  const cancelTokenSource = $axios.CancelToken.source()
  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  // store client ip in the axios header
  $axios.defaults.headers.common.CLIENT_IP = store.getters.ip
  // 設定全局的 timeout (單位為毫秒)
  // $axios.defaults.timeout = 15000 // 例如：設定為 15 秒

  /**
   * @description 請求攔截器 (Request Interceptor)
   * 在每個請求發送前觸發
   */
  $axios.onRequest((config) => {
    // 每當有請求發出時，計數器 +1
    pendingRequests++

    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }
    config.cancelToken = cancelTokenSource.token

    return config
  })

  /**
   * @description 回應攔截器 (Response Interceptor)
   * 在收到回應後觸發
   */
  $axios.onResponse((response) => {
    // 請求成功完成後，計數器 -1
    pendingRequests--
    // 必須返回 response 物件，否則會中斷 promise chain
    return response
  })

  /**
   * @description 錯誤攔截器 (Error Interceptor)
   * 在請求發生錯誤時觸發
   */
  $axios.onError((error) => {
    // 無論是網路錯誤、超時還是請求被取消，都代表請求已結束，計數器 -1
    pendingRequests--

    if ($axios.isCancel(error)) {
      isDev && console.log('Request canceled:', error.message)
    } else {
      console.error('Axios Error:', error)
      // 在此處可以根據錯誤狀態碼進行統一處理，例如導向到錯誤頁面
      // redirect('/error')
    }
    // 必須返回 Promise.reject 以便讓呼叫方可以 catch 到錯誤
    return Promise.reject(error)
  })

  // --- 新增功能：拓展 $axios.post 方法以進行併發控制 ---

  // 1. 保存一份原始的 $axios.post 方法
  const originalPost = $axios.post.bind($axios)
  // 【修正】: 將最大嘗試次數調整為 8，以使最長等待時間接近 10 秒
  const attemptMax = 8
  const baseDelay = 100 // 基礎延遲時間 (ms)
  const maxDelay = 2000 // 最大延遲時間 (ms)

  /**
   * @description 帶有併發檢查的 post 方法
   * @param {...any} args - 傳遞給原始 post 方法的參數 (url, data, config)
   * @returns {Promise<any>}
   */
  const postWithConcurrencyCheck = function (...args) {
    /**
     * @description 內部遞迴函式，用於檢查並執行 post
     * @param {number} [attempt=1] - 當前的嘗試次數
     */
    const checkAndPost = async (attempt = 1) => {
      // 檢查重試次數是否超過上限
      if (attempt > attemptMax) {
        isDev && console.warn(`[Axios Post] 重試已達 ${attempt - 1} 次上限，直接發送請求...`, args)
        return originalPost(...args)
      }

      // 檢查是否有「其他」請求正在進行中。
      if (pendingRequests > 0) {
        // 實現類似 TCP 的指數退避 + 抖動 (Jitter) 的延遲機制
        // 1. 計算指數增長的延遲
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
        // 2. 加上一個隨機的抖動值 (這裡設定為 0-100ms)，避免同時重試
        const delayWithJitter = exponentialDelay + random(0, 100)
        // 3. 確保延遲時間不超過最大值
        const finalDelay = Math.min(delayWithJitter, maxDelay)

        isDev && console.log(`[Axios Post] 偵測到壅塞，啟用指數退避機制，延遲 ${finalDelay}ms 後重試... (第 ${attempt} 次)`)

        // 等待指定時間
        await new Promise(resolve => setTimeout(resolve, finalDelay))

        // 等待結束後，再次呼叫自己進行檢查，並增加嘗試次數
        return checkAndPost(attempt + 1)
      } else {
        // 如果沒有其他請求，就執行原始的 post 方法
        return originalPost(...args)
      }
    }

    // 直接返回內部 async 函式所產生的 Promise，從第 1 次嘗試開始
    return checkAndPost()
  }

  // 覆寫 $axios.post 方法，讓所有 this.$axios.post 的呼叫都使用我們的新邏輯
  $axios.post = postWithConcurrencyCheck

  // 將原始的 post 方法直接掛載到 $axios 實例上
  // 這樣就可以在 Vue component 中透過 this.$axios.oPost() 來呼叫它
  $axios.oPost = originalPost

  // --- 結束新增功能 ---

  // 注入 cancel token source，方便在 Vue component 中使用 this.$acts.cancel() 來取消請求
  inject('acts', cancelTokenSource)
}
