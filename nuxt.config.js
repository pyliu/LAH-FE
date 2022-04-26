import pkg from './package.json'
export default {
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
    '~/assets/css/awesome-font.css',
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
    'nuxt-fontawesome'
  ],
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
    debug: false
  },
  proxy: {
    '/api': {
      target: `${process.env.PROTOCOL}://${process.env.API_HOST}:${process.env.API_PORT}`,
      changeOrigin: true
      // pathRewrite: { '^/api': '' }
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
    }
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
