import qs from 'qs'

export default function ({ $axios, redirect, store }, inject) {
  const cancelTokenSource = $axios.CancelToken.source();
  $axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

  $axios.onRequest(config => {
    if (config.data && config.headers[config.method]['Content-Type'] === 'application/x-www-form-urlencoded') {
      config.data = qs.stringify(config.data)
    }
    config.cancelToken = cancelTokenSource.token
    // use store to store latest request config globally
    store.commit('xhrRequest', config)
    return config
  })

  $axios.onResponse(response => {
    // use store to store latest response globally
    store.commit('xhrResponse', response)
    // handle global response here
    if (store._vm) {
      if (response.status == 200) {
        let json = response.data
        if (json && json.status < 1) {
          store._vm.warning(json.message, { title:'API警示' })
        }
      } else {
        store._vm.alert(response.statusText, { title:'網路連線錯誤' })
      }
    }
  })

  $axios.onError(error => {
    console.error(error)
    redirect('/error')
  })

  inject('acts', cancelTokenSource) // e.g. this.$acts.cancel('axios request has been cancelled!') in Vue
}
