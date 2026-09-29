import { mapGetters } from 'vuex'
import isEmpty from 'lodash/isEmpty'
import {
  DEPARTMENTS,
  DEPT_NAME_MAP,
  DEPT_CODE_MAP,
  CHAT_ROOMS,
  DEFAULT_WS_PORT
} from '~/constants/lah-messenger-constants'

export default {
  computed: {
    ...mapGetters([
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
      'regexpMarkdImage',
      'regexpReplyHeader'
    ]),
    userdept() {
      const unit = this.myinfo?.unit || this.user?.unit
      return DEPT_CODE_MAP[unit] || 'hr'
    },
    userid() {
      return (this.myid || this.user?.id || '').toUpperCase()
    },
    username() {
      return this.myname || this.user?.name || this.userid
    },
    userip() {
      return this.user?.ip || this.ip || '127.0.0.1'
    },
    userMap() {
      return this.userNames || {}
    },
    isNotifyMgtStaff() {
      return !!(this.authority?.isNotifyMgtStaff || this.authority?.isAdmin)
    },
    isChat() {
      return !this.currentChannel.startsWith('announcement') && !this.isPersonal
    },
    isPersonal() {
      return this.userid === this.currentChannel
    },
    isAnnouncement() {
      return this.currentChannel === 'announcement'
    },
    isMine() {
      return this.currentChannel === this.userid
    },
    inChatting() {
      return !['announcement', this.userid, 'chat'].includes(this.currentChannel)
    },
    stickyChannels() {
      return ['announcement', this.userid, 'chat']
    },
    showUnreadChannels() {
      return ['announcement', this.userid, `announcement_${this.userdept}`]
    },
    defaultWsPort() {
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
    empty(val) {
      return isEmpty(val)
    },
    protectLocalPath(text) {
      if (!text) return ''
      return String(text)
        .replace(/(?<!`)(["'])(\\\\[a-zA-Z0-9_.-]+\\[^\r\n]+?|[a-zA-Z]:\\[^\r\n]+?)\1(?!`)/g, '`$2`')
        .replace(/(?<!`)(\\\\[a-zA-Z0-9_.-]+\\[^\s`<>]+|[a-zA-Z]:\\[^\s`<>]+)(?!`)/g, '`$1`')
    },
    replaceFilepath(str) {
      if (!str) return ''
      const regex = /(([c-z]:\\|\\\\)[^<>:"/|?*\n\r\t]+(\\(.+\.[a-z]{1,4})?))/gim
      const subst = '<span class="open-os-explorer" title="點擊複製路徑">$1</span>'
      return str.replace(regex, subst)
    },
    showUnread(channel) {
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
    queryOnlineClients() {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(this.packCommand({
          command: 'online',
          channel: this.currentChannel
        }))
      }
    },
    date() {
      const now = new Date()
      return `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)}`
    },
    time() {
      const now = new Date()
      return `${('0' + now.getHours()).slice(-2)}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`
    },
    packMessage(text, opts = {}) {
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
    packCommand(commandPayload) {
      return JSON.stringify({
        type: 'command',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        message: typeof commandPayload === 'string' ? commandPayload : JSON.stringify(commandPayload),
        channel: 'system'
      })
    },
    packImage(base64, alt, channel) {
      return this.packMessage(`![${alt}](${base64})`, { channel: channel || this.currentChannel })
    },
    sendImage(base64, alt, channel) {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(this.packImage(base64, alt, channel))
      }
    },
    getChannelName(channelId) {
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
    getDepartmentName(deptCode) {
      return DEPT_NAME_MAP[deptCode] || '未知課室'
    },
    getDepartmentCode(deptName) {
      return DEPT_CODE_MAP[deptName] || 'hr'
    },
    handleSpecialClick(event) {
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
        const path = element.innerText?.trim()
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
    }
  }
}
