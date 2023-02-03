import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'

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
  timestamp: +new Date(),
  loggedIn: false,
  ip: '0.0.0.0',
  adminIps: ['127.0.0.1', '::1'],
  apiSvrIps: [],
  server: {},
  user: {},
  userNames: undefined,
  authority: {
    isAdmin: false,
    isChief: false,
    isDisabled: false,
    isRAE: false,
    isUserMgtStaff: false,
    isNotifyMgtStaff: false
  },
  systemConfigs: {},
  lastMessage: '',
  topXap: { x: '', y: 0 },
  xapMap: new Map(),
  imageMementoCapacity: 30,
  imageMemento: [],
  messageMementoCapacity: 30,
  messageMemento: [],
  fetchingMonitorMail: false,
  fetchedMonitorMailCount: 0
})

const getters = {
  loggedIn: state => state.loggedIn,
  ip: state => state.ip,
  adminIps: state => state.adminIps,
  server: state => state.server,
  apiSvrIps: state => state.apiSvrIps,
  apiSvrIp: (state) => {
    if (Array.isArray(state.apiSvrIps) && state.apiSvrIps.length > 0) {
      return state.apiSvrIps[state.apiSvrIps.length - 1]
    }
    return state.systemConfigs.API_SERVER_IP
  },
  apiSvrPort: (state) => {
    if (!isEmpty(state.server)) {
      return state.server.SERVER_PORT
    }
    return state.systemConfigs.API_SERVER_PORT
  },
  user: state => state.user,
  userNames: state => state.userNames,
  authority: state => state.authority,
  systemConfigs: state => state.systemConfigs,
  apiHost: state => state.systemConfigs.API_SERVER_IP,
  apiPort: state => state.systemConfigs.API_SERVER_PORT,
  wsHost: state => state.systemConfigs.WS_SERVER_IP,
  wsPort: state => state.systemConfigs.WS_SERVER_PORT,
  lastMessage: state => state.lastMessage,
  topXap: state => state.topXap,
  xapMap: state => state.xapMap,
  timestamp: state => state.timestamp,
  imageMementoCapacity: state => state.imageMementoCapacity,
  imageMemento: state => state.imageMemento,
  latestImageMemento: state => state.imageMemento.length > 0 ? state.imageMemento[state.imageMemento.length - 1] : undefined,
  imageMementoCacheKey: state => 'imageMementoCached',
  messageMementoCapacity: state => state.messageMementoCapacity,
  messageMemento: state => state.messageMemento,
  latestMessageMemento: state => state.messageMemento.length > 0 ? state.messageMemento[state.messageMemento.length - 1] : undefined,
  messageMementoCacheKey: state => 'messageMementoCached',
  fetchingMonitorMail: state => state.fetchingMonitorMail,
  fetchedMonitorMailCount: state => state.fetchedMonitorMailCount
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
    state.user = { ...obj.user }
    state.systemConfigs = { ...state.systemConfigs, ...obj.configs }
    state.authority = { ...state.authority, ...obj.configs.authority }
    state.server = { ...state.server, ...obj.server }
    state.apiSvrIps = [...obj.ips]
    state.loggedIn = true
  },
  systemConfigs (state, payload) {
    state.systemConfigs = { ...state.systemConfigs, ...payload }
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
  userNames (state, json) {
    state.userNames = { ...json }
  },
  timestamp (state, dontcare) {
    state.timestamp = +new Date()
  },
  imageMementoCapacity (state, capacity) { state.imageMementoCapacity = parseInt(capacity) || 30 },
  imageMemento (state, arr) {
    if (Array.isArray(arr)) {
      state.imageMemento = [...arr]
    }
  },
  addImageMemento (state, base64data) {
    this.$config.isDev && console.log(timestamp(), '新增 image data 到 store。 [Vuex::addImageMemento]')
    if (state.imageMemento.length >= state.imageMementoCapacity) {
      const removed = state.imageMemento.shift()
      this.$config.isDev && console.log(timestamp(), '移除最早的 image data。 [Vuex::addImageMemento]')
      state.imageMemento.length = state.imageMementoCapacity
    }
    state.imageMemento.push(base64data)
    // remove duplication
    state.imageMemento = [...uniqWith(state.imageMemento, isEqual)]
    this.$config.isDev && console.log(timestamp(), `現在暫存 image data 數量為 ${state.imageMemento.length}。 [Vuex::addImageMemento]`)
  },
  messageMementoCapacity (state, capacity) { state.messageMementoCapacity = parseInt(capacity) || 30 },
  messageMemento (state, arr) {
    if (Array.isArray(arr)) {
      state.messageMemento = [...arr]
    }
  },
  addMessageMemento (state, data) {
    this.$config.isDev && console.log(timestamp(), '新增 message data 到 store。 [Vuex::addMessageMemento]', data)
    if (state.messageMemento.length >= state.messageMementoCapacity) {
      const removed = state.messageMemento.shift()
      this.$config.isDev && console.log(timestamp(), '移除最早的 message data。 [Vuex::addMessageMemento]', removed)
      state.messageMemento.length = state.messageMementoCapacity
    }
    state.messageMemento.push(data)
    // remove duplication
    state.messageMemento = [...state.messageMemento.filter(function (item, pos) {
      return state.messageMemento.indexOf(item) === pos
    })]
    this.$config.isDev && console.log(timestamp(), `現在暫存 message data 數量為 ${state.messageMemento.length}。 [Vuex::addMessageMemento]`)
  },
  topXap (state, office) {
    state.topXap = { ...office }
  },
  fetchingMonitorMail (state, flag) {
    state.fetchingMonitorMail = flag
  },
  fetchedMonitorMailCount (state, count) {
    state.fetchedMonitorMailCount = count || 0
  }
}

// support async operation
const actions = {
  // Nuxt provided hook feature for Vuex, calling at server side when store initializing
  nuxtServerInit ({ commit, dispatch }, nuxt) {
    try {
      commit('ip', nuxt.req.connection.remoteAddress || nuxt.req.socket.remoteAddress)
      dispatch('loadXap', nuxt.$content)
      // query login require info by ip to use middleware to control authority
      dispatch('login')
    } catch (e) {
      console.error(e)
    }
  },
  login ({ commit, getters }) {
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
  },
  async loadXap ({ getters }, $content) {
    const json = await $content('xapMap').fetch()
    for (const [key, value] of Object.entries(json)) {
      // console.log(`${key}: ${value}`)
      getters.xapMap.set(key, value)
    }
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
