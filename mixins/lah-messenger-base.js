import { mapGetters } from 'vuex'
import isEmpty from 'lodash/isEmpty'
import {
  DEPT_NAME_MAP,
  DEPT_CODE_MAP,
  DEFAULT_WS_PORT
} from '~/constants/lah-messenger-constants'

export default {
  computed: {
    ...mapGetters([
      'authority',
      'currentChannel',
      'currentChannelName',
      'currentChannelMessageCount',
      'messages',
      'unread',
      'totalUnread',
      'websocket',
      'connected',
      'disconnected',
      'connectedUsers',
      'connectedUsersReverse',
      'connectedUsersCount',
      'participatedChannels',
      'notifySettings',
      'chatRooms',
      'fetchingHistory',
      'windowVisible',
      'isDashboardActive',
      'regexpMarkdImage',
      'regexpReplyHeader'
    ]),
    userdept () {
      const unit = this.myinfo?.unit || this.user?.unit || this.user?.dept || this.user?.work || ''
      if (unit) {
        const code = this.getDepartmentCode(unit)
        if (code) {
          return code
        }
      }
      if (this.isInf) { return 'inf' }
      if (this.isReg) { return 'reg' }
      if (this.isVal) { return 'val' }
      if (this.isSur) { return 'sur' }
      if (this.isAdm) { return 'adm' }
      return 'inf'
    },
    userid () {
      return (this.myid || this.user?.id || '').toUpperCase()
    },
    username () {
      return this.myname || this.user?.name || this.userid
    },
    userip () {
      return this.user?.ip || this.ip || '127.0.0.1'
    },
    userMap () {
      return this.userNames || {}
    },
    isAdmin () {
      return !!(this.authority?.isAdmin)
    },
    isNotifyMgtStaff () {
      return !!(this.authority?.isNotifyMgtStaff || this.authority?.isAdmin)
    },
    isChat () {
      return !this.currentChannel.startsWith('announcement') && !this.isPersonal
    },
    isPersonal () {
      return this.userid === this.currentChannel
    },
    isAnnouncement () {
      return this.currentChannel === 'announcement'
    },
    isMine () {
      return this.currentChannel === this.userid
    },
    inChatting () {
      return !['announcement', this.userid, 'chat'].includes(this.currentChannel)
    },
    stickyChannels () {
      return ['announcement', this.userid, 'chat']
    },
    showUnreadChannels () {
      return ['announcement', this.userid, `announcement_${this.userdept}`]
    },
    defaultWsPort () {
      return DEFAULT_WS_PORT
    },
    messengerDeptList () {
      return Object.entries(DEPT_NAME_MAP).map(([code, name]) => ({
        code,
        name
      }))
    },
    uniqueConnectedUsers () {
      const userMap = new Map()
      const parseTime = (u) => {
        if (!u || !u.timestamp) {
          return 0
        }
        const ts = Number(u.timestamp)
        if (!isNaN(ts) && ts > 0) {
          return ts < 10000000000 ? ts * 1000 : ts
        }
        const parsed = Date.parse(u.timestamp)
        return isNaN(parsed) ? 0 : parsed
      }
      const list = Array.isArray(this.connectedUsers) ? this.connectedUsers : []
      for (let i = 0; i < list.length; i++) {
        const u = list[i]
        if (!u) {
          continue
        }
        const uid = u.userid || u.username || `user_${i}`
        const existing = userMap.get(uid)
        if (!existing) {
          userMap.set(uid, u)
        } else if (parseTime(u) >= parseTime(existing)) {
          userMap.set(uid, u)
        }
      }
      return Array.from(userMap.values())
    },
    uniqueConnectedUsersCount () {
      return this.uniqueConnectedUsers.length
    }
  },
  methods: {
    empty (val) {
      return isEmpty(val)
    },
    protectLocalPath (text) {
      if (!text) { return '' }
      return String(text)
        .replace(/(?<!`)(["'])(\\\\[a-zA-Z0-9_.-]+\\[^\r\n]+?|[a-zA-Z]:\\[^\r\n]+?)\1(?!`)/g, '`$2`')
        .replace(/(?<!`)(\\\\[a-zA-Z0-9_.-]+\\[^\s`<>]+|[a-zA-Z]:\\[^\s`<>]+)(?!`)/g, '`$1`')
    },
    replaceFilepath (str) {
      if (!str) { return '' }
      const regex = /(([c-z]:\\|\\\\)[^<>:"/|?*\n\r\t]+(\\(.+\.[a-z]{1,4})?))/gim
      const subst = '<span class="open-os-explorer" title="點擊複製路徑">$1</span>'
      return str.replace(regex, subst)
    },
    showUnread (channel) {
      const val = this.getUnread(channel)
      return parseInt(val) > 0 || val === '99+' || val === '9+'
    },
    getUnread (channel) {
      if (this.unread && channel && !channel.startsWith('announcement_')) {
        let val = this.unread[channel] || 0
        if (!val && (channel === this.userid || channel.toUpperCase() === this.userid)) {
          val = this.unread[this.userid] || this.unread[this.userid.toLowerCase()] || 0
        }
        return val > 99 ? '99+' : val
      }
      return 0
    },
    plusUnread (channel) {
      this.$store.commit('plusUnread', channel)
    },
    resetUnread (channel) {
      this.$store.commit('resetUnread', channel)
    },
    setUnread (channel, count) {
      this.$store.commit('setUnread', { channel, count })
    },
    isDashboardChannel (channel) {
      if (!channel) {
        return false
      }
      const ch = String(channel).toLowerCase()
      const myDept = (this.userdept || '').toLowerCase()
      return (
        ch === 'announcement' ||
        ch.startsWith('announcement_') ||
        ch === 'lds' ||
        (Boolean(myDept) && ch === myDept)
      )
    },
    isChannelAllowed (channel) {
      if (!channel) {
        return false
      }
      // 管理者可進到所有頻道
      if (this.isNotifyMgtStaff || this.authority?.isAdmin) {
        return true
      }
      // 基本公共與個人頻道：公告、通知列表、全所 (lds)、個人私訊
      if (['announcement', 'chat', 'lds'].includes(channel) || (channel || '').toUpperCase() === this.userid) {
        return true
      }
      // 自己的課室/部門頻道及其公告頻道
      if (channel === this.userdept || channel === `announcement_${this.userdept}`) {
        return true
      }
      // 私人聊天室群組 (若有參與)
      if (Array.isArray(this.participatedChannels) && this.participatedChannels.some(p => p.id === channel)) {
        return true
      }
      // 其他部門或他人頻道皆不可進入
      return false
    },
    setCurrentChannel (channel) {
      if (!this.isChannelAllowed(channel)) {
        this.warning && this.warning(`您沒有權限進入「${this.getChannelName(channel)}」頻道`)
        return false
      }
      this.$store.commit('currentChannel', channel)
      this.$store.commit('resetUnread', channel)
      if (channel === 'announcement' && this.userdept) {
        this.$store.commit('resetUnread', `announcement_${this.userdept}`)
      }
      if (typeof this.delayUpdateChannelLastReadId === 'function') {
        this.delayUpdateChannelLastReadId(channel)
      } else if (typeof this.updateChannelLastReadId === 'function') {
        this.updateChannelLastReadId(channel)
      }
      return true
    },
    queryOnlineClients (channel = 'chat') {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(this.packCommand({
          command: 'online',
          channel: channel || 'chat'
        }))
      }
    },
    date () {
      const now = new Date()
      return `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)}`
    },
    time () {
      const now = new Date()
      return `${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`
    },
    packMessage (text, opts = {}) {
      return JSON.stringify({
        type: 'mine',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        title: 'dontcare',
        from: this.userip,
        message: text,
        channel: this.currentChannel,
        priority: 2,
        ...opts
      })
    },
    packCommand (commandPayload) {
      return JSON.stringify({
        type: 'command',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        message: typeof commandPayload === 'string' ? commandPayload : JSON.stringify(commandPayload),
        channel: 'system'
      })
    },
    packImage (base64, alt, channel) {
      return this.packMessage(`![${alt}](${base64})`, { channel: channel || this.currentChannel })
    },
    sendImage (base64, alt, channel) {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(this.packImage(base64, alt, channel))
      }
    },
    getChannelName (channelId) {
      switch (channelId) {
        case 'announcement': return '公告'
        case 'lds': return '全所'
        case 'inf': return '資訊課'
        case 'adm': return '行政課'
        case 'reg': return '登記課'
        case 'sur': return '測量課'
        case 'val': return '地價課'
        case 'hr': return '人事室'
        case 'acc': return '會計室'
        case 'supervisor': return '主任祕書室'
        case 'system': return '系統'
        default: {
          const found = this.participatedChannels?.find(item => item.id === channelId)
          if (found) {
            return found.participants.find(val => val !== this.userid) || channelId
          }
          return this.userMap[channelId] || channelId
        }
      }
    },
    getDepartmentName (deptCode) {
      return DEPT_NAME_MAP[deptCode] || '未知課室'
    },
    getDepartmentCode (deptName) {
      if (!deptName) {
        return 'inf'
      }
      const s = String(deptName).toLowerCase().trim()
      if (DEPT_CODE_MAP[deptName]) {
        return DEPT_CODE_MAP[deptName]
      }
      if (DEPT_CODE_MAP[s]) {
        return DEPT_CODE_MAP[s]
      }
      if (s.includes('資訊') || s === 'inf') {
        return 'inf'
      }
      if (s.includes('登記') || s === 'reg') {
        return 'reg'
      }
      if (s.includes('地價') || s === 'val') {
        return 'val'
      }
      if (s.includes('測量') || s === 'sur') {
        return 'sur'
      }
      if (s.includes('行政') || s === 'adm') {
        return 'adm'
      }
      if (s.includes('人事') || s === 'hr') {
        return 'hr'
      }
      if (s.includes('會計') || s === 'acc') {
        return 'acc'
      }
      if (s.includes('主秘') || s.includes('主任祕書') || s.includes('主任秘書') || s.includes('秘書') || s === 'supervisor') {
        return 'supervisor'
      }
      if (s.includes('全所') || s === 'lds') {
        return 'lds'
      }
      return 'inf'
    },
    handleSpecialClick (event) {
      const element = event.target
      if (element.tagName === 'IMG' && element.src && (element.src.startsWith('data:') || element.src.startsWith('http'))) {
        event.stopPropagation()
        event.preventDefault()
        const h = this.$createElement
        this.modal(h('b-img', {
          props: {
            src: element.src,
            fluid: true
          },
          class: ['shadow', 'd-block', 'mx-auto', 'my-2']
        }), {
          title: element.alt || '圖片檢視',
          size: 'xl'
        })
      } else if (element.classList.contains('open-os-explorer')) {
        event.stopPropagation()
        event.preventDefault()
        const path = element.textContent?.trim()
        if (path) {
          if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(path).then(() => {
              this.notify(`已複製檔案路徑至剪貼簿：${path}`, {
                title: '📋 剪貼簿',
                variant: 'info'
              })
            }).catch(() => {
              this.notify(path, { title: '路徑內容' })
            })
          } else {
            this.notify(path, { title: '路徑內容' })
          }
        }
      }
    },
    extractMessageTimestamp (item) {
      if (!item) {
        return 0
      }
      if (item.timestamp) {
        const ts = Number(item.timestamp)
        if (!isNaN(ts) && ts > 0) {
          return ts > 1e11 ? ts : ts * 1000
        }
      }
      if (item.date && item.time) {
        const timeStr = `${item.date} ${item.time}`.replace(/-/g, '/')
        const ts = new Date(timeStr).getTime()
        if (!isNaN(ts) && ts > 0) {
          return ts
        }
      }
      const dt = item.create_datetime || (item.message && typeof item.message === 'object' && item.message.create_datetime)
      if (dt && typeof dt === 'string') {
        const ts = new Date(dt.replace(/-/g, '/')).getTime()
        if (!isNaN(ts) && ts > 0) {
          return ts
        }
      }
      if (typeof item.message === 'string' && item.message.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(item.message)
          if (parsed && typeof parsed === 'object') {
            if (parsed.timestamp) {
              const ts = Number(parsed.timestamp)
              if (!isNaN(ts) && ts > 0) {
                return ts > 1e11 ? ts : ts * 1000
              }
            }
            if (parsed.create_datetime) {
              const ts = new Date(parsed.create_datetime.replace(/-/g, '/')).getTime()
              if (!isNaN(ts) && ts > 0) {
                return ts
              }
            }
            if (parsed.date && parsed.time) {
              const ts = new Date(`${parsed.date} ${parsed.time}`.replace(/-/g, '/')).getTime()
              if (!isNaN(ts) && ts > 0) {
                return ts
              }
            }
          }
        } catch (e) {}
      }
      if (item.date) {
        const ts = new Date(item.date.replace(/-/g, '/')).getTime()
        if (!isNaN(ts) && ts > 0) {
          return ts
        }
      }
      return 0
    },
    extractMessageId (item) {
      if (!item) {
        return 0
      }
      if (item.id) {
        const id = parseInt(item.id)
        if (!isNaN(id) && id > 0) {
          return id
        }
      }
      if (item.message && typeof item.message === 'object' && item.message.id) {
        const id = parseInt(item.message.id)
        if (!isNaN(id) && id > 0) {
          return id
        }
      }
      return 0
    },
    compareMessages (a, b) {
      const idA = this.extractMessageId(a)
      const idB = this.extractMessageId(b)
      if (idA > 0 && idB > 0 && idA !== idB) {
        return idA - idB
      }
      const tsA = this.extractMessageTimestamp(a)
      const tsB = this.extractMessageTimestamp(b)
      if (tsA > 0 && tsB > 0 && tsA !== tsB) {
        return tsA - tsB
      }
      if (idA > 0 && (!idB || idB <= 0)) {
        return -1
      }
      if (idB > 0 && (!idA || idA <= 0)) {
        return 1
      }
      return 0
    },
    sortMessages (list) {
      if (!Array.isArray(list)) {
        return []
      }
      return [...list].sort(this.compareMessages)
    }
  }
}
