import axios from 'axios'
export default (ctx, inject) => {
  axios.defaults.transformRequest = [data => {
    const qs = require('qs')
    return qs.stringify(data)
  }]
  // leverage axios proxy in nuxt.config.js
  axios.defaults.baseURL = '/api'
  inject('http', axios)

  inject('log', console.log.bind(console))
  inject('error', console.error.bind(console))
  inject('warn', console.warn.bind(console))
  inject('assert', console.assert.bind(console))
}