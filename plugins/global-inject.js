import $ from 'jquery'
import axios from 'axios'
export default (ctx, inject) => {
  axios.defaults.transformRequest = [data => $.param(data)]
//   axios.defaults.baseUrl = 'http://localhost'
  inject('http', axios)
}