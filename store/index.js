import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import uniqWith from 'lodash/uniqWith'

/**
 * Custom error logger for Axios interceptor.
 * @param {Error} error - The error object.
 */
const logerror = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Error Response Data:', error.response.data)
    console.error('Error Response Status:', error.response.status)
    console.error('Error Response Headers:', error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Error Request:', error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error Message:', error.message)
  }
  console.error('Error Config:', error.config)
}

/**
 * Returns a formatted timestamp string.
 * @returns {string} e.g., "2023-09-15 14:30:00"
 */
const timestamp = () => {
  const now = new Date()
  return `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)} ${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`
}

/**
 * Logs a message with a prepended timestamp.
 * @param {string} message - The message to log.
 */
const logtimestamp = (message) => {
  console.log(`${timestamp()} ${message}`)
}

/**
 * The state object for the Vuex store.
 */
export const state = () => ({
  // A timestamp to track the last update.
  timestamp: +new Date(),
  // User authentication status.
  loggedIn: false,
  // Client IP address.
  ip: '0.0.0.0',
  // List of IPs considered as admin.
  adminIps: ['127.0.0.1', '::1'],
  // List of API server IPs.
  apiSvrIps: [],
  // Information about the server environment.
  server: {},
  // Current logged-in user's data.
  user: {},
  // A map of all user IDs to names.
  userNames: undefined,
  // A map of user IDs to names for the current site.
  siteUserNames: undefined,
  // User authority and permissions.
  authority: {
    isAdmin: false,
    isChief: false,
    isDisabled: false,
    isRAE: false,
    isUserMgtStaff: false,
    isNotifyMgtStaff: false
  },
  // System-wide configurations.
  systemConfigs: {},
  // The last received message for global display.
  lastMessage: '',
  // State for the top XAP component.
  topXap: { x: '', y: 0 },
  // A map for XAP configurations.
  xapMap: new Map(),
  // Capacity for the image memento.
  imageMementoCapacity: 30,
  // An array acting as a memento for images.
  imageMemento: [],
  // Capacity for the message memento.
  messageMementoCapacity: 30,
  // An array acting as a memento for messages.
  messageMemento: [],
  // Flag indicating if monitor mail is being fetched.
  fetchingMonitorMail: false,
  // Count of fetched monitor mails.
  fetchedMonitorMailCount: 0,
  // 即時通 (LAH-Messenger) 相關狀態
  currentChannel: 'chat',
  messages: {
    lds: [],
    announcement: [],
    adm: [],
    inf: [],
    val: [],
    reg: [],
    sur: [],
    acc: [],
    hr: [],
    supervisor: []
  },
  unread: {
    lds: 0,
    announcement: 0,
    adm: 0,
    inf: 0,
    val: 0,
    reg: 0,
    sur: 0,
    acc: 0,
    hr: 0,
    supervisor: 0
  },
  websocket: undefined,
  connectedUsers: [],
  participatedChannels: [],
  fetchingHistory: false,
  statusText: '',
  messengerTimer: null,
  notifySettings: {
    announcement: true,
    personal: true,
    chat: true
  },
  windowVisible: true
})

/**
 * Getters for derived state.
 */
export const getters = {
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
  siteUserNames: state => state.siteUserNames,
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
  messageMementoCapacity: state => state.messageMementoCapacity,
  messageMemento: state => state.messageMemento,
  latestMessageMemento: state => state.messageMemento.length > 0 ? state.messageMemento[state.messageMemento.length - 1] : undefined,
  fetchingMonitorMail: state => state.fetchingMonitorMail,
  fetchedMonitorMailCount: state => state.fetchedMonitorMailCount,
  // 即時通 (LAH-Messenger) Getters
  windowVisible: state => state.windowVisible,
  websocket: state => state.websocket,
  connected: state => state.websocket && state.websocket.readyState === 1,
  disconnected: state => isEmpty(state.websocket) || state.websocket.readyState === 3,
  messages: state => state.messages,
  unread: state => state.unread,
  totalUnread: (state) => {
    try {
      const uid = (state.user?.id || '').toUpperCase()
      return (state.unread.lds || 0) +
             (state.unread.announcement || 0) +
             (state.unread[uid] || 0)
    } catch {
      return 0
    }
  },
  currentChannel: state => String(state.currentChannel),
  currentChannelMessageCount: state => state.messages[state.currentChannel]?.length || 0,
  currentChannelName: (state) => {
    const channelId = String(state.currentChannel)
    switch (channelId) {
      case 'announcement': return '公告'
      case 'lds': return '全所聊天室'
      case 'inf': return '資訊課聊天室'
      case 'reg': return '登記課聊天室'
      case 'sur': return '測量課聊天室'
      case 'adm': return '行政課聊天室'
      case 'val': return '地價課聊天室'
      case 'hr': return '人事室聊天室'
      case 'acc': return '會計室聊天室'
      case 'supervisor': return '主任祕書室聊天室'
      default:
        if (channelId === (state.user?.id || '').toUpperCase()) {
          return '我的私訊'
        }
        return `頻道 ${channelId}`
    }
  },
  chatRooms: () => ['lds', 'adm', 'inf', 'val', 'reg', 'sur', 'acc', 'hr', 'supervisor'],
  notifySettings: state => state.notifySettings,
  participatedChannels: state => state.participatedChannels,
  fetchingHistory: state => state.fetchingHistory,
  connectedUsers: state => state.connectedUsers,
  connectedUsersReverse: state => [...state.connectedUsers].reverse(),
  connectedUsersCount: state => state.connectedUsers.length,
  statusText: state => state.statusText,
  timer: state => state.messengerTimer,
  regexpMarkdImage: () => /!\[.+\]\(.+\)/igm,
  regexpReplyHeader: () => /^(<p>)?給.+?(<\/p>)?\n?(<hr.*\/?>|\*{3})/igm
}

/**
 * Mutations for synchronous state changes.
 */
export const mutations = {
  /**
   * Sets the client IP and determines admin status.
   * @param {object} state - The Vuex state.
   * @param {string} ip - The client's IP address.
   */
  ip (state, ip) {
    state.ip = ip
    state.authority.isAdmin = state.adminIps.includes(ip)
  },
  /**
   * Updates state upon successful login.
   * @param {object} state - The Vuex state.
   * @param {object} payload - The login response data.
   */
  login (state, payload) {
    state.user = { ...payload.user }
    state.systemConfigs = { ...state.systemConfigs, ...payload.configs }
    state.authority = { ...state.authority, ...payload.configs.authority }
    state.server = { ...state.server, ...payload.server }
    state.apiSvrIps = [...payload.ips]
    state.loggedIn = true
  },
  /**
   * Merges new configurations into the systemConfigs state.
   * @param {object} state - The Vuex state.
   * @param {object} payload - The configuration object to merge.
   */
  systemConfigs (state, payload) {
    state.systemConfigs = { ...state.systemConfigs, ...payload }
  },
  /**
   * Sets the last message.
   * @param {object} state - The Vuex state.
   * @param {string} message - The message content.
   */
  lastMessage (state, message) {
    state.lastMessage = message
  },
  /**
   * Sets the admin flag.
   * @param {object} state - The Vuex state.
   * @param {boolean} flag - The new admin status.
   */
  admin (state, flag) {
    state.authority.isAdmin = flag
  },
  /**
   * Updates the user names mapping and filters for the current site.
   * @param {object} state - The Vuex state.
   * @param {object} json - The user names object from API.
   */
  userNames (state, json) {
    state.userNames = { ...json }
    if (json) {
      const site = state.systemConfigs.site
      // Filter users belonging to the current site and sort them.
      const siteUsers = Object.entries(json)
        .filter(([id]) => id.startsWith(site))
        .sort(([idA], [idB]) => idB.length - idA.length) // Longer ID first for same name
      // Remove duplicates by name, keeping the one with the longer ID.
      const uniqueSiteUsers = uniqWith(siteUsers, (a, b) => a[1] === b[1])
        .reduce((obj, [key, val]) => {
          obj[key] = val
          return obj
        }, {})
      state.siteUserNames = { ...uniqueSiteUsers }
    }
  },
  /**
   * Updates the timestamp to the current time.
   * @param {object} state - The Vuex state.
   */
  timestamp (state) {
    state.timestamp = +new Date()
  },
  /**
   * Adds an image to the memento, managing capacity.
   * @param {object} state - The Vuex state.
   * @param {string} base64data - The base64 encoded image data.
   */
  addImageMemento (state, base64data) {
    if (state.imageMemento.length >= state.imageMementoCapacity) {
      state.imageMemento.shift()
    }
    state.imageMemento.push(base64data)
    state.imageMemento = uniqWith(state.imageMemento, isEqual)
  },
  /**
   * Adds a message to the memento, managing capacity.
   * @param {object} state - The Vuex state.
   * @param {*} data - The message data to add.
   */
  addMessageMemento (state, data) {
    if (state.messageMemento.length >= state.messageMementoCapacity) {
      state.messageMemento.shift()
    }
    state.messageMemento.push(data)
    // A simpler way to get unique values for primitive arrays
    state.messageMemento = [...new Set(state.messageMemento)]
  },
  topXap (state, office) {
    state.topXap = { ...office }
  },
  fetchingMonitorMail (state, flag) {
    state.fetchingMonitorMail = flag
  },
  fetchedMonitorMailCount (state, count) {
    state.fetchedMonitorMailCount = count || 0
  },
  // 即時通 (LAH-Messenger) Mutations
  currentChannel (state, channel) {
    state.currentChannel = channel
  },
  addChannel (state, channel) {
    if (!(channel in state.messages)) {
      state.messages = { ...state.messages, [channel]: [] }
    }
    if (!(channel in state.unread)) {
      state.unread = { ...state.unread, [channel]: 0 }
    }
  },
  resetUnread (state, channel) {
    if (channel in state.unread) {
      state.unread[channel] = 0
    }
  },
  plusUnread (state, channel) {
    if (channel in state.unread) {
      state.unread[channel] += 1
    } else {
      state.unread = { ...state.unread, [channel]: 1 }
    }
  },
  setUnread (state, { channel, count }) {
    if (channel in state.unread) {
      state.unread[channel] = count
    } else {
      state.unread = { ...state.unread, [channel]: count }
    }
  },
  websocket (state, ws) {
    state.websocket && state.websocket.close()
    state.websocket = ws
  },
  timer (state, timer) {
    state.messengerTimer = timer
  },
  connectedUsers (state, users) {
    state.connectedUsers = [...users]
  },
  addParticipatedChannel (state, payload) {
    if (!state.participatedChannels.find(item => item.id === payload.id)) {
      state.participatedChannels.push(payload)
    }
  },
  removeParticipatedChannel (state, payload) {
    state.participatedChannels = state.participatedChannels.filter(item => item.id !== payload.id)
  },
  fetchingHistory (state, flag) {
    state.fetchingHistory = flag
  },
  statusText (state, text) {
    state.statusText = text
  },
  windowVisible (state, flag) {
    state.windowVisible = flag
  },
  notifySettings (state, payload) {
    state.notifySettings = { ...state.notifySettings, ...payload }
  }
}

/**
 * Actions for asynchronous operations.
 */
export const actions = {
  resetUnread ({ commit }, channel) {
    commit('resetUnread', channel)
  },
  plusUnread ({ commit }, channel) {
    commit('plusUnread', channel)
  },
  /**
   * Nuxt-specific action for server-side initialization.
   */
  nuxtServerInit ({ commit, dispatch }, { req, $content }) {
    try {
      commit('ip', req.connection.remoteAddress || req.socket.remoteAddress)
      // Load XAP config from content file at server side
      dispatch('loadXap', $content)
      // Login action is dispatched to fetch user data before client-side render.
      dispatch('login')
    } catch (e) {
      console.error('Error in nuxtServerInit:', e)
    }
  },
  /**
   * Performs a login request to the backend if the user is not already logged in.
   */
  login ({ commit, getters }) {
    if (!getters.loggedIn) {
      this.$axios.post(this.$consts.API.JSON.AUTH, {
        type: 'login',
        req_ip: getters.ip
      }).then((res) => {
        commit('login', res.data)
      }).catch((error) => {
        logerror(error)
      }).finally(() => {
        logtimestamp(`${getters.ip} 已連線。`)
      })
    }
  },
  /**
   * Loads XAP map configuration from Nuxt content.
   * NOTE: This action is intended to be called during nuxtServerInit
   * as $content is not available on the client-side in this project setup.
   */
  async loadXap ({ getters }, $content) {
    try {
      if (!$content) {
        console.warn('Nuxt content is not available, skipping loadXap.')
        return
      }
      const json = await $content('xapMap').fetch()
      for (const [key, value] of Object.entries(json)) {
        getters.xapMap.set(key, value)
      }
    } catch (e) {
      console.error('Failed to load XAP map:', e)
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
