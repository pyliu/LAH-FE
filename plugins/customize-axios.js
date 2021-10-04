import qs from 'qs'

export default function ({ $axios, redirect, store }, inject) {
  const cancelTokenSource = $axios.CancelToken.source()
  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
  // store client ip in the axios header
  $axios.defaults.headers.common.CLIENT_IP = store.getters.ip

  $axios.onRequest((config) => {
    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }
    config.cancelToken = cancelTokenSource.token

    return config
  })

  $axios.onResponse((response) => {

  })

  $axios.onError((error) => {
    console.error(error)
    // redirect('/error')
  })

  inject('acts', cancelTokenSource) // e.g. this.$acts.cancel('axios request has been cancelled!') in Vue
}
