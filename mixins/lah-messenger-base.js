import { mapGetters } from 'vuex'
import isEmpty from 'lodash/isEmpty'
import {
  DEPT_NAME_MAP,
  DEFAULT_WS_PORT,
  getDepartmentCode
} from '~/constants/lah-messenger-constants'

const isDevMode = process.env.NODE_ENV !== 'production'

export default {
  computed: {
    ...mapGetters([
      'authority',
      'currentChannel',
      'currentChannelName',
      'currentChannelMessageCount',
      'messages',
      'unread',
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
      'isPersonalDrawerOpen',
      'regexpMarkdImage',
      'regexpReplyHeader'
    ]),
    totalUnread () {
      const storeTotal = this.$store?.getters?.totalUnread
      if (typeof storeTotal === 'number' && storeTotal > 0) {
        return storeTotal
      }
      // 雙重保險計算：若 store 回傳 0，但 mixin 本地有未讀紀錄時進行回退計算
      let fallbackTotal = 0
      const targetChannels = ['announcement', 'lds']
      if (this.userdept) {
        targetChannels.push(this.userdept)
      }
      if (this.userid) {
        targetChannels.push(this.userid)
      }
      const uniqueChannels = [...new Set(targetChannels.filter(Boolean))]
      uniqueChannels.forEach((ch) => {
        const val = parseInt(this.getUnread(ch)) || 0
        fallbackTotal += val
      })
      return fallbackTotal
    },
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
      // 開發模式 (非 production) 且尚未取得登入身分時，以 DEV 作為備用 ID，方便本機測試
      return (this.myid || this.user?.id || (isDevMode ? 'DEV' : '')).toUpperCase()
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
      return getDepartmentCode(deptName, 'inf')
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
      } else {
        const target = element.classList?.contains('open-os-explorer')
          ? element
          : (typeof element.closest === 'function' ? element.closest('.open-os-explorer') : null)
        if (target) {
          event.stopPropagation()
          event.preventDefault()
          const path = target.textContent?.trim()
          if (path) {
            this.copyToClipboard(path).then((success) => {
              if (success) {
                this.notify(`已複製檔案路徑至剪貼簿：${path}`, {
                  title: '📋 剪貼簿',
                  variant: 'info'
                })
              } else {
                this.notify(path, {
                  title: '⚠️ 無法自動複製路徑，請手動複製',
                  variant: 'warning'
                })
              }
            })
          }
        }
      }
    },
    copyToClipboard (text, successMsg = '') {
      return new Promise((resolve) => {
        if (!text) {
          resolve(false)
          return
        }
        const onDone = (success) => {
          if (success && successMsg) {
            this.notify(successMsg, { title: '📋 剪貼簿', variant: 'info' })
          }
          resolve(success)
        }
        if (process.client && window.isSecureContext && navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            onDone(true)
          }).catch(() => {
            onDone(this.fallbackCopyText(text))
          })
          return
        }
        onDone(this.fallbackCopyText(text))
      })
    },
    fallbackCopyText (text) {
      if (!process.client || typeof document === 'undefined') {
        return false
      }
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.top = '0'
        textarea.style.left = '0'
        textarea.style.width = '2em'
        textarea.style.height = '2em'
        textarea.style.padding = '0'
        textarea.style.border = 'none'
        textarea.style.outline = 'none'
        textarea.style.boxShadow = 'none'
        textarea.style.background = 'transparent'
        textarea.style.opacity = '0'
        textarea.style.pointerEvents = 'none'
        const currentActive = document.activeElement
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)
        if (currentActive && typeof currentActive.focus === 'function') {
          currentActive.focus()
        }
        return !!successful
      } catch (err) {
        this.$utils && this.$utils.error && this.$utils.error('fallbackCopyText error:', err)
        return false
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
    },
    async getChannelLastReadId (channel) {
      const key = `${channel}_last_id`
      let id = 0
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        try {
          const lsVal = window.localStorage.getItem(key)
          if (lsVal !== null && lsVal !== undefined && lsVal !== '') {
            id = parseInt(lsVal) || 0
          }
        } catch (e) {
          this.$utils && this.$utils.warn && this.$utils.warn(`[即時通] 讀取 localStorage [${key}] 失敗:`, e)
        }
      }
      if (!id) {
        try {
          const cacheVal = await this.getCache(key)
          id = parseInt(cacheVal) || 0
        } catch (e) {}
      }
      return id
    },
    async setChannelLastReadId (channel, id) {
      const numId = parseInt(id) || 0
      if (!channel || numId <= 0) {
        return
      }
      const key = `${channel}_last_id`
      let current = 0
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        try {
          const lsVal = window.localStorage.getItem(key)
          current = parseInt(lsVal) || 0
          if (numId > current) {
            window.localStorage.setItem(key, String(numId))
            this.$utils && this.$utils.log && this.$utils.log(`[即時通] 記錄 ${channel} 本地已讀 ID: ${current} -> ${numId}`)
          }
        } catch (e) {
          this.$utils && this.$utils.warn && this.$utils.warn(`[即時通] 寫入 localStorage [${key}] 失敗:`, e)
        }
      }
      try {
        const currentCache = (await this.getCache(key)) || 0
        if (numId > currentCache) {
          this.setCache(key, numId)
        }
      } catch (e) {}
    },
    async updateChannelLastReadId (channel) {
      const ch = channel || (typeof this.getCurrentActiveChannel === 'function' ? this.getCurrentActiveChannel() : this.currentChannel)
      if (!ch) {
        return
      }
      const list = this.messages?.[ch] || []
      const maxId = list.reduce((max, item) => {
        const numId = this.extractMessageId(item)
        return numId > max ? numId : max
      }, 0)
      if (maxId > 0) {
        await this.setChannelLastReadId(ch, maxId)
      }
      this.resetUnread(ch)
      this.$utils && this.$utils.log && this.$utils.log(`[即時通] updateChannelLastReadId: 頻道 [${ch}]，列表長度: ${list.length}，最大 ID: ${maxId}`)
    }
  }
}
