import { mapGetters } from 'vuex'
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
      'statusText',
      'windowVisible',
      'regexpMarkdImage',
      'regexpReplyHeader'
    ]),
    userdept () {
      const unit = this.myinfo?.unit || this.user?.unit
      return DEPT_CODE_MAP[unit] || 'hr'
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
    }
  },
  methods: {
    protectLocalPath (text) {
      if (!text) return ''
      return String(text)
        .replace(/(?<!`)(["'])(\\\\[a-zA-Z0-9_.-]+\\[^\r\n]+?|[a-zA-Z]:\\[^\r\n]+?)\1(?!`)/g, '`$2`')
        .replace(/(?<!`)(\\\\[a-zA-Z0-9_.-]+\\[^\s`<>]+|[a-zA-Z]:\\[^\s`<>]+)(?!`)/g, '`$1`')
    },
    replaceFilepath (str) {
      if (!str) return ''
      const regex = /(([c-z]:\\|\\\\)[^<>:"/|?*\n\r\t]+(\\(.+\.[a-z]{1,4})?))/gim
      const subst = '<span class="open-os-explorer" title="點擊複製路徑">$1</span>'
      return str.replace(regex, subst)
    },
    showUnread (channel) {
      const val = this.getUnread(channel)
      return parseInt(val) > 0 || val === '99+' || val === '9+'
    },
    getUnread (channel) {
      if (this.unread) {
        const val = this.unread[channel] || 0
        return val > 99 ? '99+' : val
      }
      return 0
    },
    setCurrentChannel (channel) {
      this.$store.commit('currentChannel', channel)
      this.$store.commit('resetUnread', channel)
    },
    queryOnlineClients () {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(this.packCommand({
          command: 'online',
          channel: this.currentChannel
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
      return DEPT_CODE_MAP[deptName] || 'hr'
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
