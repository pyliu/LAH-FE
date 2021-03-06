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
const timestamp = () => {
  // e.g. 2020-12-03 10:23:00
  const now = new Date()
  return now.getFullYear() + '-' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2)
}
const logtimestamp = (message) => {
  const ts = timestamp()
  console.log(`${ts} ${message}`)
}

const state = () => ({
  loggedIn: false,
  ip: '0.0.0.0',
  adminIps: ['127.0.0.1', '::1'],
  apiSvrIps: [],
  server: {},
  user: {},
  authority: {
    isAdmin: false,
    isChief: false,
    isGA: false,
    isRAE: false,
    isSuper: false,
    isHR: false,
    isAccounting: false
  },
  systemConfigs: {},
  lastMessage: '',
  toastCounter: 0,
  xapMap: new Map([
    ['220.1.33.71', {name: '地政局', code: 'H0', ip: '220.1.33.71'}],
    ['220.1.34.161', {name: '桃園所', code: 'HA', ip: '220.1.34.161'}],
    ['220.1.35.123', {name: '中壢所', code: 'HB', ip: '220.1.35.123'}],
    ['220.1.36.45', {name: '大溪所', code: 'HC', ip: '220.1.36.45'}],
    ['220.1.37.246', {name: '楊梅所', code: 'HD', ip: '220.1.37.246'}],
    ['220.1.38.30', {name: '蘆竹所', code: 'HE', ip: '220.1.38.30'}],
    ['220.1.39.57', {name: '八德所', code: 'HF', ip: '220.1.39.57'}],
    ['220.1.40.33', {name: '平鎮所', code: 'HG', ip: '220.1.40.33'}],
    ['220.1.41.20', {name: '龜山所', code: 'HH', ip: '220.1.41.20'}]
  ])
})

const getters = {
  loggedIn: state => state.loggedIn,
  toastCounter: state => state.toastCounter,
  ip: state => state.ip,
  adminIps: state => state.adminIps,
  apiSvrIps: state => state.apiSvrIps,
  user: state => state.user,
  authority: state => state.authority,
  systemConfigs: state => state.systemConfigs,
  server: state => state.server,
  lastMessage: state => state.lastMessage,
  xapMap: state => state.xapMap
}

// only sync operation
const mutations = {
  ip (state, ip) {
    state.ip = ip
    // treat localhost ip as admin
    state.authority.isAdmin = state.adminIps.includes(ip)
  },
  login (state, obj) {
    // expected json obj format is { status, message, server, ips, user, configs }
    state.user = { ...state.user, ...obj.user }
    state.systemConfigs = { ...state.systemConfigs, ...obj.configs }
    state.authority = { ...state.authority, ...obj.configs.authority }
    state.server = { ...state.server, ...obj.server }
    state.apiSvrIps = obj.ips
    state.loggedIn = true
  },
  lastMessage (state, string) { state.lastMessage = string },
  admin (state, flag) {
    state.authority.isAdmin = flag
  },
  mock (state, flag) {
    state.systemConfigs.mock = flag
  },
  avatar (state, flag) {
    state.systemConfigs.avatar = flag
  },
  addToastCounter (state, dontcare) { state.toastCounter++ }
}

// support async operation
const actions = {
  // Nuxt provided hook feature for Vuex, calling at server side when store initializing
  async nuxtServerInit ({ commit, dispatch }, nuxt) {
    try {
      commit('ip', nuxt.req.connection.remoteAddress || nuxt.req.socket.remoteAddress)
      // query login require info by ip to use middleware to control authority
      dispatch('login')
    } catch (e) {
      console.error(e)
    }
  },
  async login ({ commit, getters }) {
    !getters.loggedIn && this.$axios.post(this.$consts.API.JSON.AUTH, {
    // !getters.loggedIn && this.$axios.post(`${this.$config.apiServerURL}${this.$consts.API.JSON.AUTH}`, {
      type: 'login',
      req_ip: getters.ip
    }).then((res) => {
      commit('login', res.data)
    }).catch((error) => {
      logerror(error)
    }).finally(() => {
      logtimestamp(`${getters.ip} connected.`)
    })
  }
}

export default {
  state,
  actions,
  mutations,
  getters,
  namespaced: true,
  strict: false
}
