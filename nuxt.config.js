export default {
  // target: 'static',
  server: {
    port: 6378 // default: 3000
  },
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
    color: '#000'
  },
  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css',
    '~/assets/css/loading.css',
    '~/assets/css/loading-btn.css',
    '~/assets/css/animate.css',
    '~/assets/css/awesome-font.css',
    '~/assets/scss/main.scss'
  ],
  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    // { src: '~/plugins/jquery.min', mode: 'client', ssr: false },
    // { src: '~/plugins/chart.min', mode: 'client', ssr: false },
    { src: '~/plugins/fontawesome' },
    { src: '~/plugins/global-inject' },
    { src: '~/plugins/global-mixin' }
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
  styleResources: {
    scss: '@/assets/scss/_variables.scss'
  },
  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {
    // transformRequest: [data => $.param(data)],
    baseUrl: process.env.BASE_URL || 'http://localhost:8080',
    proxy: true,
    prefix: '/api',
    credentials: true
  },
  proxy: {
    '/api': {
      target: process.env.BASE_URL || 'http://localhost', 
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
  env: {
    baseUrl: process.env.BASE_URL || 'http://localhost:8080'
  }
}
