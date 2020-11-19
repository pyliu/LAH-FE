const state = () => ({
  xhrResponse: null,
  xhrRequest: null, // the xhr config
  ip: '0.0.0.0',
  toastCounter: 0
})

const getters = {
  toastCounter: state => state.toastCounter,
  ip: state => state.ip,
  xhrResponse: state => state.xhrResponse,
  xhrRequest: state => state.xhrRequest
}

// support async operation
const actions = {
  async nuxtServerInit ({ commit, dispatch }) {
    try {
      // dispatch('ip')
    } catch (e) {
      console.error(e)
    }
  },
  async ip ({ commit, getters }) {
    this.$axios.post('/api/query_json_api.php', {
      type: 'ip'
    }).then((res) => {
      // expected json format is { status, ip, data_count, message }
      commit('ip', res.data)
    }).catch((error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(error.response.data)
        console.error(error.response.status)
        console.error(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.error(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error', error.message)
      }
      console.error(error.config)
    }).finally(() => {
      // e.g. 2020-11-11 16:25:23
      let now = new Date()
      let datetime = now.getFullYear() + '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
        ('0' + now.getDate()).slice(-2) + ' ' +
        ('0' + now.getHours()).slice(-2) + ':' +
        ('0' + now.getMinutes()).slice(-2) + ':' +
        ('0' + now.getSeconds()).slice(-2)
      console.log(getters.ip, datetime)
    })
  }
}

// only sync operation
const mutations = {
  ip (state, { ip }) { state.ip = ip },
  addToastCounter (state, dontcare) { state.toastCounter++ },
  xhrResponse (state, payload) { state.xhrResponse = payload },
  xhrRequest (state, payload) { state.xhrRequest = payload }
}

export default {
  state,
  actions,
  mutations,
  getters,
  namespaced: true,
  strict: false
}
