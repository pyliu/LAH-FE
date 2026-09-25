<template lang="pug">
.lah-messenger-root(:class="rootClasses" :style="rootStyle")
  client-only
    //- 連線狀態提示橫條 (若斷線或連線中時顯示)
    .connection-banner.d-flex.justify-content-between.align-items-center.px-3.py-1(
      v-if="!connected"
      :class="connecting ? 'bg-info text-white' : 'bg-warning text-dark'"
    )
      .d-flex.align-items-center
        b-spinner.mr-2(small v-if="connecting")
        b-icon.mr-2(icon="exclamation-triangle-fill" v-else)
        span.s-90 {{ connecting ? '即時通伺服器連線中...' : '即時通已斷線，正在自動重試連線...' }}
        span.s-80.ml-2 ({{ currentWsConnStr }})
      b-button(
        size="sm"
        :variant="connecting ? 'light' : 'outline-dark'"
        class="py-0 px-2 s-85"
        @click="connect"
        :disabled="connecting"
      ) 立即重新連線

    //- 主要即時通佈局
    .main-layout
      b-card.m-1.main-card(no-body, header-tag="nav", v-cloak)
        //- 1. 頂部導航欄 (頻道切換)
        template(#header): b-nav(card-header, tabs, fill)
          //- 公告頻道
          b-nav-item(
            :active="isAnnouncement"
            title="全所公告訊息"
            @click="setCurrentChannel('announcement')"
          ): a.mr-1
            span.s-105 📣 公告
            b-badge.notify-announcement(
              variant="danger"
              pill
              v-if="showUnread('announcement')"
            ) {{ getUnread('announcement') }}

          //- 通知/課室頻道列表
          b-nav-item(
            :active="isChat"
            title="通知頻道列表"
            @click="setCurrentChannel('chat')"
          ): a.mr-1
            span.s-105 💬 通知
            b-badge.notify-chat(
              variant="secondary"
              pill
              v-if="showChatUnread"
            ) {{ chatUnread }}

          //- 個人私訊頻道
          b-nav-item(
            :active="isPersonal"
            :title="`${userid} 個人通知訊息`"
            @click="setCurrentChannel(userid)"
          ): a.mr-1
            span.s-105 📧 私訊
            b-badge.notify-personal(
              variant="success"
              pill
              v-if="showUnread(userid)"
            ) {{ getUnread(userid) }}

        //- 2. 聊天室控制列 (僅在個別聊天室模式顯示)
        transition(name="list", mode="out-in"): b-list-group.my-1(
          v-if="inChatting"
          flush
        ): b-list-group-item: b-link.d-flex.justify-content-between.align-items-center(
          @click="setCurrentChannel('chat')"
        )
          .mr-auto.d-flex.align-items-center
            b-icon.mr-1(icon="arrow-left-circle-fill", font-scale="1.25", title="返回列表")
            span.font-weight-bold {{ getChannelName(currentChannel) }}

          //- 線上成員頭像列表
          b-avatar-group.mr-4(
            v-if="connectedUsersCount > 1"
            size="2rem"
            :overlap="connectedUsersOverlapRatio"
          )
            lah-messenger-user-avatar.shadow(
              v-for="(u, idx) in connectedUsers"
              v-if="idx < 9"
              :key="`connected_user_${u.userid}_${idx}`"
              :user-data="u"
            )
          span.mr-4(v-if="connectedUsersCount >= 9") +{{ connectedUsersCount - 9 }}
          lah-messenger-user-avatar.mr-4.shadow(
            v-if="connectedUsersCount === 1"
            :user-data="connectedUsers[0]"
          )

        //- 3. 內容顯示區
        //- 聊天頻道列表 (Chat Board)
        transition(name="list", mode="out-in"): lah-messenger-chat-board.scrollable-board(v-if="showChatBoard")
        //- 訊息內容列表 (Message Board)
        transition(name="list", mode="out-in"): lah-messenger-message-board.scrollable-board(
          ref="msgBoard"
          v-if="showMessageBoard"
          :list="list"
          @reply="reply"
        )

      //- 4. 訊息輸入區
      transition(name="listY", mode="out-in"): b-input-group.p-1.flex-shrink-0.input-container(
        v-if="showInputGroup"
        size="sm"
        @keyup.esc.exact="emoji = false"
      )
        b-textarea(
          ref="textarea"
          v-model="inputText"
          placeholder="... Ctrl + V 可貼上剪貼簿的截圖，Ctrl/Shift/Alt + Enter 發送 ..."
          @keyup.enter.ctrl="send"
          @keyup.enter.shift="send"
          @keyup.enter.alt="send"
          @keyup.esc="clear"
          @paste="pasteImage($event, pasted)"
          no-resize
          no-auto-shrink
          autofocus
          rows="2"
        )
        b-button.ml-1(
          @click="send"
          :variant="valid ? 'primary' : 'outline-primary'"
          :disabled="!valid"
          title="傳送訊息"
        )
          b-icon(icon="cursor", rotate="45")
        b-button.mx-1(
          @click="emojiPickup"
          variant="outline-secondary"
          title="挑選表情符號"
        )
          span.h5 {{ emojiTxt }}
        b-button(@click="pick" variant="outline-success" title="附加圖片")
          b-icon(icon="image")

        //- 輸入即時預覽
        lah-transition: .d-flex.justify-content-between.p-2.float-preview.preview(
          v-if="!empty(inputText) || !empty(inputImages)"
          ref="floatPreview"
        )
          span.text-white.font-weight-bold 預覽
          lah-messenger-message.my-message(
            :raw="messagePreviewJson"
            :preview="true"
            style="opacity: 1 !important; z-index: 1001;"
          )

        //- 表情符號選擇器
        lah-transition(fade): .float-emoji(v-if="emoji")
          lah-messenger-emoji-pickup(@click="addEmoji")

    //- 5. 底部狀態列
    lah-messenger-status(:status-text="connectText")
</template>

<script>
import trim from 'lodash/trim'
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahMessengerChatBoard from '~/components/lah-messenger-chat-board.vue'
import LahMessengerMessageBoard from '~/components/lah-messenger-message-board.vue'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerStatus from '~/components/lah-messenger-status.vue'
import LahMessengerUserAvatar from '~/components/lah-messenger-user-avatar.vue'

export default {
  name: 'LahMessengerMain',
  components: {
    LahMessengerImageUpload,
    LahMessengerChatBoard,
    LahMessengerMessageBoard,
    LahMessengerMessage,
    LahMessengerEmojiPickup,
    LahMessengerStatus,
    LahMessengerUserAvatar
  },
  mixins: [lahMessengerBase],
  props: {
    wsPort: {
      type: [Number, String],
      default: 8082
    },
    wsHost: {
      type: String,
      default: ''
    },
    embedded: {
      type: Boolean,
      default: false
    },
    height: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    emoji: false,
    emojiTxt: '😀',
    inputText: '',
    inputImages: [],
    currentFontSize: 'normal',
    connectText: '',
    msgQueue: [],
    processingQueue: false,
    connecting: false,
    reconnectMs: 20 * 1000,
    reconnectTimer: null
  }),
  computed: {
    rootClasses () {
      return {
        'is-embedded': this.embedded,
        'is-standalone': !this.embedded,
        [`font-size-${this.currentFontSize}`]: true
      }
    },
    rootStyle () {
      const style = {}
      if (this.height) {
        style.height = this.height
      }
      const sizeMap = {
        normal: '16px',
        medium: '18px',
        large: '20px'
      }
      if (sizeMap[this.currentFontSize]) {
        style.fontSize = sizeMap[this.currentFontSize]
      }
      return style
    },
    activeWsHost () {
      if (this.wsHost) return this.wsHost
      if (this.systemConfigs && this.systemConfigs.WS_SERVER_IP) {
        return this.systemConfigs.WS_SERVER_IP
      }
      if (this.apiHost && this.apiHost !== 'localhost' && this.apiHost !== '127.0.0.1') {
        return this.apiHost
      }
      if (process.client && location.hostname && location.hostname !== 'localhost') {
        return location.hostname
      }
      return '220.1.34.75'
    },
    activeWsPort () {
      return parseInt(this.wsPort) || this.defaultWsPort || 8082
    },
    currentWsConnStr () {
      return `ws://${this.activeWsHost}:${this.activeWsPort}`
    },
    showInputGroup () {
      return (
        !this.currentChannel.startsWith('announcement') &&
        this.currentChannel !== this.userid &&
        this.currentChannel !== 'chat'
      )
    },
    showMessageBoard () {
      return this.currentChannel !== 'chat'
    },
    showChatBoard () {
      return this.isChat
    },
    list () {
      return this.messages[this.currentChannel] || []
    },
    chatUnread () {
      const result = Object.entries(this.unread || {}).reduce((acc, curr) => {
        const isTarget =
          parseInt(curr[0]) > 0 ||
          ['lds', 'adm', 'sur', 'inf', 'reg', 'val', 'acc', 'hr', 'supervisor'].includes(curr[0])
        return isTarget ? acc + curr[1] : acc
      }, 0)
      return result > 99 ? '99+' : result
    },
    showChatUnread () {
      return this.chatUnread > 0 || this.chatUnread === '99+'
    },
    valid () {
      return !this.empty(trim(this.inputText)) || !this.empty(this.inputImages)
    },
    maxUnwrappedAvatars () {
      if (this.currentFontSize === 'large') return 5
      if (this.currentFontSize === 'medium') return 6
      return 7 // normal
    },
    connectedUsersOverlapRatio () {
      const count = this.connectedUsers.length
      if (count <= this.maxUnwrappedAvatars) return 0.0
      return Math.min(0.4, (count - this.maxUnwrappedAvatars) * 0.08 + 0.15)
    },
    markdImages () {
      let imgMdText = this.inputImages
        .map((base64, idx) => `![preview-${idx}](${base64})`)
        .join('\n')
      if (!this.empty(this.inputText) && !this.empty(imgMdText)) {
        imgMdText = `\n\n***\n\n${imgMdText}`
      }
      return imgMdText
    },
    markdMessage () {
      if (this.empty(this.inputText) && this.empty(this.inputImages)) return ''
      const protectedText = this.protectLocalPath(this.inputText)
      return this.$utils.convertMarkd(`${protectedText} ${this.markdImages}`)
    },
    messagePreviewJson () {
      return {
        id: 0,
        channel: this.currentChannel,
        date: this.date(),
        time: this.time(),
        message: this.markdMessage,
        prepend: false,
        sender: this.userid,
        type: 'mine'
      }
    }
  },
  watch: {
    connectText (val) {
      this.$store.commit('statusText', val)
    },
    currentChannel (nVal, oVal) {
      this.sendChannelUpdate(nVal)
      if (!(nVal in this.messages)) {
        this.$store.commit('addChannel', nVal || this.userid)
        this.$store.commit('resetUnread', nVal || this.userid)
      }
      this.latestMessage()
      if (!this.showUnreadChannels.includes(nVal)) {
        this.delayQueryOnlineClients()
      }
      this.clear()
      this.scrollToBottom()
    }
  },
  created () {
    this.addCurrentChannel()
  },
  mounted () {
    this.delayConnect = this.$utils.debounce(this.connect, 1500)
    this.delayLatestMessage = this.$utils.debounce(this.latestMessage, 400)
    this.delayQueryOnlineClients = this.$utils.debounce(() => {
      if (!this.showUnreadChannels.includes(this.currentChannel)) {
        this.queryOnlineClients()
      }
    }, 300)

    this.connect()
    this.startReconnectTimer()

    this.$nextTick(async () => {
      this.currentFontSize = (await this.$localForage.getItem('fontSize')) || 'normal'
    })
  },
  beforeDestroy () {
    this.stopReconnectTimer()
    this.closeWebsocket()
  },
  methods: {
    addCurrentChannel () {
      if (!(this.currentChannel in this.messages) && !this.$isServer) {
        this.$store.commit('addChannel', this.currentChannel)
        this.$store.commit('resetUnread', this.currentChannel)
      }
    },
    setConnectText (text) {
      this.msgQueue.push(text)
      if (this.msgQueue.length > 10) this.msgQueue.shift()
      this.processQueue()
    },
    processQueue () {
      if (this.processingQueue || this.msgQueue.length === 0) return
      this.processingQueue = true
      const text = this.msgQueue.shift()
      this.connectText = text
      setTimeout(() => {
        this.processingQueue = false
        this.processQueue()
      }, 1000)
    },
    scrollToBottom () {
      this.$nextTick(() => {
        const el = this.$refs.msgBoard?.$el?.querySelector('.msg')
        if (!el) return
        el.scrollTop = el.scrollHeight
      })
    },
    clear () {
      this.inputText = ''
      this.inputImages = []
    },
    pasted (base64) {
      !this.inputImages.includes(base64) && this.inputImages.push(base64)
    },
    removeInoutImage (base64data) {
      const index = this.inputImages.indexOf(base64data)
      if (index > -1) this.inputImages.splice(index, 1)
    },
    emojiPickup () {
      this.emoji = !this.emoji
    },
    addEmoji (emoji) {
      this.emoji = false
      const element = this.$refs.textarea?.$el || this.$refs.textarea
      if (element && element.selectionStart !== undefined) {
        const appended =
          this.inputText.substring(0, element.selectionStart).trim() +
          ' ' +
          emoji +
          ' '
        this.inputText =
          appended +
          this.inputText
            .substring(element.selectionEnd, this.inputText.length)
            .trim()
        this.$nextTick(() => {
          element.focus()
          element.selectionEnd = appended.length
        })
      } else {
        this.inputText = this.inputText + ' ' + emoji
      }
    },
    pick () {
      this.modal(
        this.$createElement(LahMessengerImageUpload, {
          props: { to: this.currentChannel, modalId: 'lah-messenger-image-upload-modal' },
          on: {
            publish: (b64) =>
              this.sendImage(b64, '上傳圖片', this.currentChannel)
          }
        }),
        { id: 'lah-messenger-image-upload-modal', size: 'xl', title: '直接傳送圖片' }
      )
    },
    reply (raw) {
      const sender = this.userMap[raw.sender] || raw.sender
      const hrIdx = raw.message?.indexOf('<hr>')
      const text =
        hrIdx === -1 ? raw.message : raw.message.substring(hrIdx + 4)
      const tmp = document.createElement('div')
      tmp.innerHTML = `@${sender} ${text}`
      let innerText = tmp.textContent || tmp.innerText || ''
      if (this.$utils.length(innerText) > 20) {
        innerText = innerText.substring(0, 20) + ' ... '
      }
      this.inputText = `${innerText}\n\n***\n\n`
      this.$nextTick(() => {
        const el = this.$refs.textarea?.$el || this.$refs.textarea
        if (el) {
          el.scrollTop = 999999
          el.focus()
        }
      })
    },
    connect () {
      if (this.connected && this.websocket?.readyState === 1) {
        return
      }
      this.connecting = true
      try {
        if (this.websocket) {
          this.websocket.onopen = null
          this.websocket.onmessage = null
          this.websocket.onerror = null
          this.websocket.onclose = null
          this.websocket.close()
        }

        this.setConnectText('即時通連線中')
        const ws = new WebSocket(this.currentWsConnStr)

        ws.onopen = () => {
          this.$store.commit('websocket', ws)
          this.setConnectText('即時通已連線')
          this.register()
          this.list.length = 0
          this.delayLatestMessage()
          this.connecting = false
        }

        ws.onclose = () => {
          this.$store.commit('websocket', undefined)
          this.setConnectText('即時通已斷開')
          this.connecting = false
        }

        ws.onerror = () => {
          this.$store.commit('websocket', undefined)
          this.setConnectText('即時通伺服器連線失敗')
          this.connecting = false
        }

        ws.onmessage = async (e) => {
          this.handleWebSocketMessage(e)
        }
      } catch (e) {
        this.setConnectText('即時通初始化錯誤')
        this.closeWebsocket()
        this.connecting = false
      }
    },
    closeWebsocket () {
      if (this.websocket) {
        this.websocket.close()
        this.$store.commit('websocket', undefined)
      }
    },
    startReconnectTimer () {
      this.stopReconnectTimer()
      this.reconnectTimer = setInterval(() => {
        if (!this.connected && !this.connecting) {
          this.connect()
        }
      }, this.reconnectMs)
    },
    stopReconnectTimer () {
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer)
        this.reconnectTimer = null
      }
    },
    register () {
      if (this.websocket?.readyState === 1 && this.userid) {
        this.websocket.send(
          this.packCommand({
            command: 'register',
            ip: this.userip,
            domain: 'tyland',
            userid: this.userid,
            username: this.username,
            dept: this.userdept,
            timestamp: +new Date(),
            channel: this.currentChannel
          })
        )
        this.queryUnreadCount()
      }
    },
    sendChannelUpdate (channel) {
      if (this.websocket?.readyState === 1) {
        this.websocket.send(
          this.packCommand({
            command: 'update_current_channel',
            channel,
            userid: this.userid
          })
        )
      }
    },
    latestMessage () {
      if (this.websocket?.readyState === 1) {
        this.websocket.send(
          JSON.stringify({
            type: 'command',
            sender: this.userid,
            date: this.date(),
            time: this.time(),
            channel: 'system',
            message: JSON.stringify({
              command: 'latest',
              channel: this.currentChannel,
              count: 15
            })
          })
        )
      }
    },
    queryUnreadCount () {
      [
        'announcement',
        `announcement_${this.userdept}`,
        this.userid,
        'lds',
        this.userdept
      ].forEach((c) => this.queryChannelUnreadCount(c))
    },
    async queryChannelUnreadCount (c) {
      if (this.websocket?.readyState === 1) {
        const lastId = (await this.getCache(`${c}_last_id`)) || 0
        this.websocket.send(
          JSON.stringify({
            type: 'command',
            sender: this.userid,
            date: this.date(),
            time: this.time(),
            channel: 'system',
            message: JSON.stringify({
              command: 'unread',
              channel: c,
              last: lastId
            })
          })
        )
      }
    },
    send () {
      if (this.sendTo(this.markdMessage, { channel: this.currentChannel })) {
        this.clear()
      }
      this.$refs.textarea?.$el?.focus()
    },
    sendTo (msg, opts = {}) {
      if (this.$utils.empty(msg)) return false
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.setConnectText('連線不穩定，正在重新連線...')
        this.connect()
        return false
      }
      try {
        this.websocket.send(
          this.packMessage(msg, { channel: this.currentChannel, ...opts })
        )
        return true
      } catch (e) {
        console.error('WS 發送失敗', e)
        return false
      }
    },
    async handleWebSocketMessage (e) {
      let incoming
      try {
        incoming = JSON.parse(e.data)
      } catch (err) {
        return
      }

      const channel = incoming.channel
      const receivedId = incoming.message?.id || incoming.id
      const lastReadId = (await this.getCache(`${channel}_last_id`)) || 0
      const isHistory = !!(incoming.prepend || incoming.message?.prepend)

      if (incoming.type === 'ack') {
        this.handleAckMessage(incoming.message)
      } else if (channel === 'system') {
        this.handleSystemMessage(incoming.message)
      } else if (this.currentChannel === channel) {
        if (!Array.isArray(this.messages[channel])) {
          this.$store.commit('addChannel', channel)
        }
        this.$nextTick(() => {
          if (
            !this.$utils.empty(incoming.message) &&
            !this.messages[channel].find((m) => m.id === incoming.id)
          ) {
            if (isHistory) {
              this.messages[channel].unshift(incoming)
            } else {
              this.messages[channel].push(incoming)
              this.scrollToBottom()
            }

            if (receivedId > lastReadId) {
              this.setCache(`${channel}_last_id`, receivedId)
            }
            if (!isHistory) {
              this.triggerNotification(incoming)
              this.delayLatestMessage()
            }
          }
        })
      } else if (incoming.message && incoming.sender !== 'system' && !isHistory) {
        if (
          receivedId > lastReadId &&
          ['lds', 'announcement', `announcement_${this.userdept}`, this.userid, this.userdept].includes(channel)
        ) {
          this.plusUnread(channel)
        }
        this.triggerNotification(incoming)
      }
      this.connecting = false
    },
    async handleAckMessage (json) {
      const cmd = json?.command
      switch (cmd) {
        case 'register':
          json.success && this.queryUnreadCount()
          break
        case 'mychannel':
          if (json.success) {
            if (json.payload.action === 'add') {
              this.$store.commit('addParticipatedChannel', json.payload)
            } else if (json.payload.action === 'remove') {
              this.$store.commit('removeParticipatedChannel', json.payload)
            }
          }
          break
        case 'remove_channel':
          json.success && this.$store.commit('removeParticipatedChannel', json.payload)
          this.notify(`${json.message}`, { variant: json.success ? 'success' : 'warning' })
          break
        case 'remove_message':
          if (json.success) {
            const idx = this.messages[json.payload.channel]?.findIndex(msg => msg.id === json.payload.id)
            if (idx > -1) this.messages[json.payload.channel].splice(idx, 1)
            const cascade = json.payload.cascade
            if (cascade?.to && cascade?.id) {
              this.websocket?.send(JSON.stringify({
                type: 'command',
                sender: this.userid,
                date: this.date(),
                time: this.time(),
                channel: 'system',
                message: JSON.stringify({
                  command: 'remove_message',
                  channel: cascade.to,
                  id: cascade.id,
                  cascade: ''
                })
              }))
            }
          }
          this.setConnectText(`${json.message}`)
          break
        case 'edit_message':
          if (json.success) {
            const channel = json.payload.channel
            const payload = json.payload.payload
            const found = this.messages[channel]?.find(msg => msg.id === payload.id)
            if (found) {
              if (channel.startsWith('announcement')) {
                found.message = {
                  ...found.message,
                  title: payload.title,
                  content: payload.content,
                  priority: payload.priority
                }
              } else {
                found.message = payload.message
              }
              const cascade = json.payload.cascade
              if (cascade?.id && cascade?.to) {
                const regex = typeof this.regexpReplyHeader === 'function' ? this.regexpReplyHeader() : this.regexpReplyHeader
                const cleanMessage = payload.message ? payload.message.replace(regex, '') : ''
                this.websocket?.send(JSON.stringify({
                  type: 'command',
                  sender: this.userid,
                  date: this.date(),
                  time: this.time(),
                  channel: 'system',
                  message: {
                    command: 'edit_message',
                    channel: cascade.to,
                    id: cascade.id,
                    sender: this.userid,
                    payload: {
                      ...payload,
                      id: cascade.id,
                      channel: cascade.to,
                      sender: this.userid,
                      title: 'dontcare',
                      message: cleanMessage
                    }
                  }
                }))
              }
            }
          }
          break
        case 'previous':
          this.$store.commit('fetchingHistory', false)
          this.setConnectText(`${json.message}(${json.payload?.count || 0}筆)`)
          break
        case 'unread':
          this.$store.commit('setUnread', {
            channel: json.payload.channel,
            count: json.payload.unread
          })
          break
        case 'online':
          this.$store.commit(
            'connectedUsers',
            (json.payload.users || []).filter((n) => n)
          )
          break
        case 'private_message': {
          const insertedId = json.payload?.insertedId
          const insertedChannel = json.payload?.channel
          const chatRooms = typeof this.chatRooms === 'function' ? this.chatRooms() : (this.chatRooms || [])
          if (
            insertedChannel !== this.userid &&
            !insertedChannel?.startsWith('announcement') &&
            !chatRooms.includes(insertedChannel)
          ) {
            const remove = JSON.stringify({ to: insertedChannel, id: insertedId })
            this.websocket?.send(this.packMessage(json.payload.message, {
              channel: this.userid,
              title: remove,
              priority: 4,
              flag: 1
            }))
          }
          this.setConnectText(`${json.message}`)
          break
        }
        case 'set_read':
        case 'check_read': {
          const targetList = cmd === 'set_read' ? this.messages[json.payload.channel] : this.messages[json.payload.sender]
          if (Array.isArray(targetList)) {
            const msgId = cmd === 'set_read' ? json.payload.id : json.payload.senderChannelMessageId
            const found = targetList.find(m => m?.id === msgId)
            if (found && (found.flag & 2) !== 2) found.flag += 2
          }
          break
        }
        case 'update_current_channel':
          this.setConnectText(json.message)
          break
        default:
          break
      }
    },
    handleSystemMessage (json) {
      if (['user_connected', 'user_disconnected', 'user_channel_changed'].includes(json.command)) {
        if (typeof this.delayQueryOnlineClients === 'function') {
          this.delayQueryOnlineClients()
        }
        if (!this.$utils.empty(json.message)) {
          this.setConnectText(json.message)
        }
      }
    },
    async triggerNotification (incoming) {
      const channel = incoming.channel
      const lastReadId = (await this.getCache(`${channel}_last_id`)) || 0
      const receivedId = incoming.message?.id || incoming.id
      if (receivedId > lastReadId) {
        this.invokeNotification(incoming)
      }
    },
    invokeNotification (i) {
      const temp = document.createElement('div')
      temp.innerHTML = i.message?.title || i.message || ''
      const fullText = temp.textContent || temp.innerText || ''
      this.setCache(`${i.channel}_last_id`, i.message?.id || i.id)

      if (i.sender !== this.userid) {
        const senderName = this.userMap[i.sender] || i.sender
        this.setConnectText(`💬 來自 ${senderName}: ${fullText}`)
        // 瀏覽器端 Toast 提醒
        this.notify(`💬 來自 ${senderName}: ${fullText}`, {
          title: `即時通訊息 - ${this.getChannelName(i.channel)}`,
          variant: 'info'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-messenger-root {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);

  &.is-standalone {
    height: calc(100vh - 1.85rem);
  }

  &.is-embedded {
    height: 100%;
    min-height: 580px;
  }
}

.connection-banner {
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.main-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none;
}

::v-deep .card-header,
::v-deep .list-group,
.flex-shrink-0 {
  flex-shrink: 0;
}

::v-deep .scrollable-board {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden !important; 
  position: relative;
}

::v-deep .scrollable-board > *:last-child {
  flex: 1;
  min-height: 0;
  height: auto !important;
  max-height: none !important;
  overflow-y: auto !important; 
  overflow-x: hidden !important;
}

.input-container {
  position: relative;
  background-color: #fff;
  border-top: 1px solid #dee2e6;
}

.float-preview {
  z-index: 1002;
  position: absolute;
  bottom: calc(100% + 8px); 
  left: 2.5%;
  opacity: 0.95;
  border-radius: 12px;
  background-color: #6c757d;
  width: 95%;
  max-height: 50vh;
  overflow-y: auto;
  box-shadow: 0px -5px 15px rgba(0,0,0,0.25);
}

.float-emoji {
  z-index: 1002;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 2.5%;
  width: 95%;
  max-height: 250px;
  opacity: 0.98;
  border-radius: 12px;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  padding: 10px;
  overflow-y: auto;
  box-shadow: 0px -5px 15px rgba(0,0,0,0.2);
}

@mixin notify() {
  position: absolute;
  top: 15px;
  opacity: 0.75;
}

.notify-announcement {
  @include notify();
  left: 100px;
}

.notify-personal {
  @include notify();
  left: 350px;
}

.notify-chat {
  @include notify();
  left: 225px;
}

.nav-link:hover .badge {
  opacity: 1;
}
</style>
