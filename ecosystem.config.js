module.exports = {
  apps: [{
    name: 'LAH-NUXTJS',
    exec_mode: 'cluster',
    instances: -1,
    script: './node_modules/nuxt/bin/nuxt.js',
    args: 'start',
    error_file: 'C:/AppServ/www/log',
    out_file: 'C:/AppServ/www/log'
  }]
}
