export default {
  server: {
    // bind to all possible addresses
    host: '0.0.0.0',
    port: process.env.NODE_ENV === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT
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
    // { src: '~/plugins/jquery.min', mode: 'client', ssr: false },
    { src: '~/plugins/customize-axios'},
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
    baseUrl: `${process.env.BASE_URL}:${process.env.NODE_ENV === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT}`,
    proxy: true,
    prefix: '/api',
    credentials: true
  },
  // API server proxy settings
  proxy: {
    '/api': {
      target: `${process.env.BASE_URL}:${process.env.API_SERVER_PORT}`,
      changeOrigin: true, 
      pathRewrite: {
        '^/api': '',
      },
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
  // Environment variables that are required at build time 
  env: {
    baseUrl: `${process.env.BASE_URL}:${process.env.NODE_ENV === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT}`
  },
  // should hold all env variables that are public as these will be exposed on the frontend.
  // available using $config in both server and client.
  publicRuntimeConfig: {
    baseURL: `${process.env.BASE_URL}:${process.env.NODE_ENV === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT}`
  },
  // should hold all env variables that are private and that should not be exposed on the frontend.
  // only available on server using same $config
  // privateRuntimeConfig always overrides publicRuntimeConfig on server-side. $config in server mode is { ...public, ...private } but for client mode only { ...public }
  privateRuntimeConfig: {
    apiKey: process.env.API_KEY
  }
}
