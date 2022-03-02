module.exports = {
  apps: [{
    // App 名稱
    name: 'LAH-FE',
    // 分為 cluster 以及 fork 模式
    exec_mode: 'cluster',
    instances: -2,
    // 執行服務的入口檔案
    script: './node_modules/nuxt/bin/nuxt.js',
    args: 'start',
    out_file: '../fe_out.log',
    error_file: '../fe_err.log',
    // 'cron' 模式指定重啟時間，只支持 cluster 模式
    cron_restart: '0 7 * * *',
    // log 顯示時間
    time: true,
    // 適合開發時用，檔案一有變更就會自動重啟
    watch: true,
    ignore_watch: ['[/\\]./', 'node_modules', '*.bat', '.git', './ws/db/*', './assets/db/*'],
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: true,
    restart_delay: 5000
  }, {
    name: 'LAH-SCHEDULER',
    exec_mode: 'cluster',
    instances: 1,
    script: './scheduler/server.js',
    out_file: '../scheduler_out.log',
    error_file: '../scheduler_err.log',
    cron_restart: '0 7 * * *',
    time: true,
    watch: true,
    ignore_watch: ['[/\\]./', 'node_modules', '*.bat', '.git', './scheduler/db/*', './assets/db/*'],
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: true,
    restart_delay: 5000
  }]
}
