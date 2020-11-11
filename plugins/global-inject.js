import axios from 'axios'
export default (nuxt, inject) => {
  axios.defaults.transformRequest = [data => {
    const qs = require('qs')
    return qs.stringify(data)
  }]
  // leverage axios proxy in nuxt.config.js
  axios.defaults.baseURL = '/api'

  // axios.onResponse(response => {
  //   this.$store.commit('apiResponse', response.data);
  // })

  // axios.onError(error => {
  //   if (error.response.status === 500) {
  //     nuxt.redirect('/sorry')
  //   }
  // })

  // console.log(nuxt)

  // all injected var can be used by this.${varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  inject('http', axios)
  inject('log', console.log.bind(console))
  inject('error', console.error.bind(console))
  inject('warn', console.warn.bind(console))
  inject('assert', console.assert.bind(console))
}