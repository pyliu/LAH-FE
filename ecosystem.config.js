module.exports = {
  apps: [{
    name: 'LAH-SCHEDULER',
    cwd: __dirname,
    exec_mode: 'fork',
    instances: 1,
    script: './scheduler/server.js',
    out_file: '../logs/scheduler_out.log',
    error_file: '../logs/scheduler_err.log',
    cron_restart: '0 7 * * *',
    time: true,
    watch: false,
    ignore_watch: ['[/\\]./', 'node_modules', '*.bat', '.git', '.vscode', 'dist', 'static'],
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    },
    wait_ready: false,
    restart_delay: 5000
  }]
}
