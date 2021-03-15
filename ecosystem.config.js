module.exports = {
  apps: [{
    // App 名稱
    name: 'LAH-FE',
    // 分為 cluster 以及 fork 模式
    exec_mode: 'cluster',
    instances: -1,
    // 執行服務的入口檔案
    script: './node_modules/nuxt/bin/nuxt.js',
    args: 'start',
    // 'cron' 模式指定重啟時間，只支持 cluster 模式
    cron_restart: '0 7 * * *',
    // log 顯示時間
    time: true,
    // 適合開發時用，檔案一有變更就會自動重啟
    watch: true,
    ignore_watch: ["[\/\\]\./", "node_modules", "*.bat", ".git"],
    max_memory_restart: '256M',
  }, {
    name: 'LAH-WEBSOCKET',
    exec_mode: 'cluster',
    instances: 1,
    script: './socket/index.js',
    args: 'socket',
    cron_restart: '0 7 * * *',
    time: true,
    watch: true,
    ignore_watch: ["[\/\\]\./", "node_modules", "*.bat", ".git"],
    max_memory_restart: '256M',
  }]
}
