/**
 * @description Nuxt 插件：在每次路由切換前，取消所有正在進行中的 Axios 請求。
 */
export default function ({ app }) {
  app.router.beforeEach((to, from, next) => {
    // 檢查 $axios 上是否有我們擴充的 cancelAll 方法
    if (typeof app.$axios.cancelAll === 'function') {
      try {
        // 呼叫全局取消方法
        app.$axios.cancelAll(`路由從 ${from.path} 切換至 ${to.path} 取消目前所有XHR請求`)
      } catch (error) {
        console.error('取消請求時發生錯誤:', error)
      }
    }
    // 繼續執行路由跳轉
    next()
  })
}
