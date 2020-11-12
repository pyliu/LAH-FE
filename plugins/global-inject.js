import qs from 'qs'

export default ({ $axios }, inject) => {
  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  // Add a request interceptor
  $axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }
    return config
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  })

  // all injected var can be used by this.${varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  // inject('http', axios)
  inject('http', $axios)
  inject('log', console.log.bind(console))
  inject('error', console.error.bind(console))
  inject('warn', console.warn.bind(console))
  inject('assert', console.assert.bind(console))
}