import pkg from './package.json'
export default {
  // ssr: false, // Disable Server Side rendering
  server: {
    // bind to all possible addresses
    host: '0.0.0.0'
  },
  dev: process.env.NODE_ENV !== 'production',
  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    title: '桃園市政府地政局',
    meta: [{
      charset: 'utf-8'
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1'
    },
    {
      hid: 'description',
      name: 'description',
      content: '桃園市地政智慧控管系統'
    }
    ],
    link: [{
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
    ],
    script: []
  },
  /*
   ** Customize the progress-bar color
   */
  loading: {
    color: '#5cb85c'
  },
  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css',
    // https://animate.style/
    'animate.css/animate.css',
    // https://github.com/loadingio/loading.css
    '~/assets/css/loading.min.css',
    '~/assets/css/loading-btn.css',
    // https://github.com/loadingio/transition.css/
    '~/assets/css/transition.min.css',
    // '~/assets/css/awesome-font.css',
    '~/assets/scss/main.scss'
  ],
  purgeCSS: {
    whitelistPatterns: [/svg.*/, /fa.*/]
  },
  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    { src: '~/plugins/customize-axios' },
    { src: '~/plugins/fontawesome' },
    { src: '~/plugins/global-vue-mixin' },
    { src: '~/plugins/global-init' }
  ],
  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,
  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    // '@nuxtjs/eslint-module'
  ],
  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    '@nuxtjs/style-resources',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/proxy',
    '@nuxtjs/localforage',
    // nuxt2 needs v1 => yarn add @nuxt/content@^1
    '@nuxt/content',
    // '@nuxt/content',
    'nuxt-fontawesome'
  ],
  content: {
    // Options, https://content.nuxtjs.org/v1/getting-started/installation/
    liveEdit: false,
    extendParser: {
      '.txt': file => file.split('\n').map(line => line.trim())
    }
  },
  bootstrapVue: {
    // Install the `IconsPlugin` plugin (in addition to `BootstrapVue` plugin)
    icons: true,
    config: {
      // Custom config options here
    }
  },
  styleResources: {
    scss: '@/assets/scss/_variables.scss'
  },
  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {
    baseURL: `${process.env.PROTOCOL}://${process.env.API_HOST}:${process.env.API_PORT}`,
    proxy: true,
    credentials: false,
    https: process.env.PROTOCOL === 'https',
    // timeout: 0, // 設定 timeout 為 0 以禁用超時
    debug: false
  },
  proxy: {
    '/api': {
      target: `${process.env.PROTOCOL}://${process.env.API_HOST}:${process.env.API_PORT}`,
      changeOrigin: true
      // proxyTimeout: 60000 // Timeout in milliseconds (60 seconds)
      // pathRewrite: { '^/api': '' }
    },
    '/l05proxy': {
      target: `${process.env.PROTOCOL}://${process.env.MONITOR_HOST_L05_IP}:${process.env.MONITOR_HOST_L05_PORT}`,
      changeOrigin: true,
      pathRewrite: { '^/l05proxy': '' }
    },
    '/smsproxy': {
      target: `${process.env.PROTOCOL}://${process.env.MONITOR_HOST_SMS_IP}:${process.env.MONITOR_HOST_SMS_PORT}`,
      changeOrigin: true,
      pathRewrite: { '^/smsproxy': '' }
    },
    '/img': {
      target: `${process.env.PROTOCOL}://${process.env.API_HOST}:${process.env.API_PORT}`,
      changeOrigin: true,
      pathRewrite: { '^/img': '' }
    },
    '/legacy': {
      target: `${process.env.PROTOCOL}://${process.env.API_HOST}:${process.env.API_PORT}`,
      changeOrigin: true,
      pathRewrite: { '^/legacy': '' }
    }
  },
  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    /*
     ** You can extend webpack config here
     */
    extend (config, ctx) {},
    babel: { compact: true }
  },
  // should hold all env variables that are public as these will be exposed on the frontend.
  // available using $config in both server and client.
  publicRuntimeConfig: {
    pkgVersion: pkg.version,
    perPage: process.env.PER_PAGE,
    websocketHost: process.env.WEBSOCKET_HOST,
    websocketPort: process.env.WEBSOCKET_PORT,
    APIHost: process.env.API_HOST,
    APIPort: process.env.API_PORT,
    axios: {
      // Default: baseURL; when the proxy option is true, it will become PREFIX instead of baseURL
      browserBaseURL: process.env.BROWSER_BASE_URL
    },
    webap: {
      x: process.env.WEBAP_X,
      reg: process.env.WEBAP_REG,
      reg2: process.env.WEBAP_REG2,
      sur: process.env.WEBAP_SUR,
      sur2: process.env.WEBAP_SUR2,
      val: process.env.WEBAP_VAL,
      use: process.env.WEBAP_USE,
      ext: process.env.WEBAP_EXT,
      taoyuan: process.env.WEBAP_TAOYUAN
    },
    monitor: {
      host: {
        L05: {
          ip: process.env.MONITOR_HOST_L05_IP,
          port: process.env.MONITOR_HOST_L05_PORT
        },
        SMS: {
          ip: process.env.MONITOR_HOST_SMS_IP,
          port: process.env.MONITOR_HOST_SMS_PORT,
          dir: process.env.MONITOR_HOST_SMS_DIR
        },
        Grafana: {
          ip: process.env.GRAFANA_HOST,
          port: process.env.GRAFANA_PORT
        },
        SRMAS: {
          ip: process.env.SRMAS_HOST
        }
      },
      capacity: {
        threshold: {
          danger: process.env.CAPACITY_DANGER || 85,
          warning: process.env.CAPACITY_WARNING || 80
        }
      }
    },
    isDev: process.env.NODE_ENV !== 'production'
  },
  // should hold all env variables that are private and that should not be exposed on the frontend.
  // only available on server using same $config
  // privateRuntimeConfig always overrides publicRuntimeConfig on server-side. $config in server mode is { ...public, ...private } but for client mode only { ...public }
  privateRuntimeConfig: {
    apiKey: process.env.API_KEY,
    axios: {
      // Default: http://[HOST]:[PORT][PREFIX]
      baseURL: process.env.BASE_URL
    }
  }
}
