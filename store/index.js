const logerror = (error) => {
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
}

const logtimestamp = (message) => {
  // e.g. 2020-12-03 10:23:00
  const now = new Date()
  const timestamp = now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2)
  console.log(`${timestamp} ${message}`)
}

const state = () => ({
  ip: '0.0.0.0',
  svr: null,
  toastCounter: 0
})

const getters = {
  toastCounter: state => state.toastCounter,
  ip: state => state.ip,
  svr: state => state.svr
}

// support async operation
const actions = {
  // Nuxt provided hook feature for Vuex, calling at server side when store initializing
  async nuxtServerInit ({ commit, dispatch }, nuxt) {
    try {
      commit('ip', nuxt.req.connection.remoteAddress || nuxt.req.socket.remoteAddress)
      // query the svr here because I want to use middleware to control authority
      dispatch('svr')
    } catch (e) {
      console.error(e)
    }
  },
  async svr ({ commit, getters }) {
    this.$axios.post('/api/query_json_api.php', {
      type: 'svr',
      client_ip: getters.ip
    }).then((res) => {
      // expected json format is { status, config, ips, server, message }
      commit('svr', res.data)
      // logtimestamp(res.data.message)
    }).catch((error) => {
      logerror(error)
    }).finally(() => {
      logtimestamp(`${getters.ip} connected.`)
    })
  }
}

// only sync operation
const mutations = {
  ip (state, ip) { state.ip = ip },
  svr (state, obj) { state.svr = obj },
  admin (state, flag) { state.svr.config.authority.isAdmin = flag },
  addToastCounter (state, dontcare) { state.toastCounter++ }
}

export default {
  state,
  actions,
  mutations,
  getters,
  namespaced: true,
  strict: false
}
