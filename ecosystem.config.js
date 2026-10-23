module.exports = {
  apps: [{
    // App 名稱
    name: 'LAH-FE',
    cwd: __dirname,
    // 分為 cluster 以及 fork 模式（cluster 模式由 PM2 Daemon 所屬之 Node 執行期衍生，建議將 PM2 服務鎖定由 C:\AppServ\node\node.exe 喚醒）
    exec_mode: 'cluster',
    instances: 2,
    // 執行服務的入口檔案
    script: './node_modules/nuxt/bin/nuxt.js',
    args: 'start',
    out_file: '../logs/fe_out.log',
    error_file: '../logs/fe_err.log',
    // 'cron' 模式指定重啟時間，只支持 cluster 模式
    cron_restart: '0 7 * * *',
    // log 顯示時間
    time: true,
    // 適合開發時用，檔案一有變更就會自動重啟
    watch: false,
    ignore_watch: ['[/\\]./', 'node_modules', '*.bat', '.git', '.vscode'],
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: true,
    restart_delay: 5000
  }, {
    name: 'LAH-SCHEDULER',
    cwd: __dirname,
    exec_mode: 'cluster',
    instances: 1,
    script: './scheduler/server.js',
    out_file: '../logs/scheduler_out.log',
    error_file: '../logs/scheduler_err.log',
    cron_restart: '0 7 * * *',
    time: true,
    watch: false,
    ignore_watch: ['[/\\]./', 'node_modules', '*.bat', '.git', '.vscode'],
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: true,
    restart_delay: 5000
  }]
}
