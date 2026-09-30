<template lang="pug">
.lah-messenger-home(:class="rootClasses" :style="rootStyle")
  client-only
    //- 1. 連線狀態提示橫條 (若斷線或連線中時顯示)
    .connection-banner.px-3.py-1(
      v-if="!connected"
      :class="connecting ? 'bg-info text-white' : 'bg-warning text-dark'"
    )
      .d-flex.justify-content-between.align-items-center
        .d-flex.align-items-center.text-truncate.mr-2
          b-spinner.mr-2(small v-if="connecting")
          b-icon.mr-2(icon="exclamation-triangle-fill" v-else)
          span.s-90 {{ connecting ? '即時通伺服器連線中...' : '即時通已斷線，正在自動重試連線...' }}
          b-link.s-80.ml-2.font-weight-bold(
            :class="connecting ? 'text-white' : 'text-dark'"
            href="javascript:void(0)"
            @click="toggleCustomWsInput"
            title="點擊自訂伺服器 IP 與 Port"
          ) ({{ currentWsConnStr }})
            b-icon.ml-1(icon="pencil-square" font-scale="0.9")
        .d-flex.align-items-center.flex-shrink-0
          b-button.mr-1(
            size="sm"
            :variant="showCustomWsInput ? 'dark' : (connecting ? 'light' : 'outline-dark')"
            class="py-0 px-2 s-85"
            @click="toggleCustomWsInput"
            title="自訂 WS 伺服器"
          )
            b-icon(icon="gear-fill" font-scale="0.9")
            span.ml-1.d-none.d-sm-inline 自訂
          b-button(
            size="sm"
            :variant="connecting ? 'light' : 'outline-dark'"
            class="py-0 px-2 s-85"
            @click="triggerReconnect"
            :disabled="connecting"
          ) 立即重新連線

      //- 自訂 WS IP / Port 輸入區
      b-collapse.mt-1(v-model="showCustomWsInput")
        .p-2.bg-white.text-dark.rounded.border.shadow-sm
          .d-flex.flex-wrap.align-items-center
            b-input-group(size="sm" prepend="ws://" class="mr-2 mb-1" style="width: 220px;")
              b-input(
                v-model.trim="inputWsHost"
                placeholder="例如: 220.1.34.75"
                @keyup.enter="applyCustomWsAndConnect"
              )
            b-input-group(size="sm" prepend=":" class="mr-2 mb-1" style="width: 110px;")
              b-input(
                v-model.trim="inputWsPort"
                type="number"
                placeholder="8081"
                @keyup.enter="applyCustomWsAndConnect"
              )
            b-button.mr-1.mb-1(
              size="sm"
              variant="primary"
              class="py-0 px-2 s-85"
              @click="applyCustomWsAndConnect"
              :disabled="connecting"
            )
              b-icon.mr-1(icon="check-circle-fill")
              span 套用並連線
            b-button.mr-1.mb-1(
              size="sm"
              variant="outline-primary"
              class="py-0 px-2 s-85"
              @click="setOnlinePreset"
              title="快速切換至線上正式 WS (220.1.34.75:8081)"
            ) 線上正式 (8081)
            b-button.mr-1.mb-1(
              size="sm"
              variant="outline-secondary"
              class="py-0 px-2 s-85"
              @click="resetCustomWs"
              title="清除自訂設定，還原預設伺服器"
              v-if="customWsHost || customWsPort"
            ) 還原預設
            b-button.mb-1(
              size="sm"
              variant="outline-danger"
              class="py-0 px-2 s-85"
              @click="showCustomWsInput = false"
              title="關閉"
            ) ✕

    //- 2. 主卡片佈局與導航 Tabs
    .home-card-wrapper.flex-grow-1.d-flex.flex-column.overflow-hidden
      b-card.home-main-card(no-body)
        template(#header): b-nav(card-header tabs fill class="home-nav-tabs")
          //- 公告分頁
          b-nav-item(
            :active="activeTab === 'announcement'"
            @click="switchTab('announcement')"
            title="全所公告"
          ): .d-flex.align-items-center.justify-content-center
            span.s-95 📣 公告
            b-badge.ml-1(
              variant="danger"
              pill
              v-if="showUnread('announcement')"
            ) {{ getUnread('announcement') }}

          //- 課室分頁
          b-nav-item(
            :active="activeTab === 'dept'"
            @click="switchTab('dept')"
            title="所屬課室對話"
          ): .d-flex.align-items-center.justify-content-center
            span.s-95 🏢 課室
            b-badge.ml-1(
              variant="primary"
              pill
              v-if="showUnread(currentDeptChannel)"
            ) {{ getUnread(currentDeptChannel) }}

          //- 全所公務分頁
          b-nav-item(
            :active="activeTab === 'lds'"
            @click="switchTab('lds')"
            title="全事務所公務交流"
          ): .d-flex.align-items-center.justify-content-center
            span.s-95 🌐 全所
            b-badge.ml-1(
              variant="success"
              pill
              v-if="showUnread('lds')"
            ) {{ getUnread('lds') }}

          //- 個人私訊分頁
          b-nav-item(
            :active="activeTab === 'personal'"
            @click="switchTab('personal')"
            title="個人私訊"
          ): .d-flex.align-items-center.justify-content-center
            span.s-95 📧 私訊
            b-badge.ml-1(
              variant="info"
              pill
              v-if="showUnread(activePersonalUser || userid)"
            ) {{ getUnread(activePersonalUser || userid) }}

          //- 線上同仁名單分頁
          b-nav-item(
            :active="activeTab === 'online'"
            @click="switchTab('online')"
            title="線上同仁名單"
          ): .d-flex.align-items-center.justify-content-center
            span.s-95 👥 線上
            b-badge.ml-1(
              variant="secondary"
              pill
              v-if="uniqueConnectedUsersCount > 0"
            ) {{ uniqueConnectedUsersCount }}

        //- 3. 分頁主要內容區域 (組合 5 大獨立子元件)
        b-card-body.p-0.home-card-body
          keep-alive
            lah-messenger-announcement-channel(
              v-if="activeTab === 'announcement'"
              ref="announcementChannel"
            )
            lah-messenger-department-channel(
              v-else-if="activeTab === 'dept'"
              ref="departmentChannel"
              :channel="currentDeptChannel"
              @channel-change="currentDeptChannel = $event"
            )
            lah-messenger-lds-channel(
              v-else-if="activeTab === 'lds'"
              ref="ldsChannel"
            )
            lah-messenger-personal-channel(
              v-else-if="activeTab === 'personal'"
              ref="personalChannel"
              :target-user="activePersonalUser"
              :show-back-button="activePersonalUser !== userid"
              @close="activePersonalUser = userid"
            )
            lah-messenger-online-users(
              v-else-if="activeTab === 'online'"
              ref="onlineUsers"
              @dept-click="onDeptClick"
              @user-chat="onUserChat"
            )

    //- 4. 底部狀態列
    lah-messenger-status(:status-text="connectText")
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerAnnouncementChannel from '~/components/lah-messenger-announcement-channel.vue'
import LahMessengerDepartmentChannel from '~/components/lah-messenger-department-channel.vue'
import LahMessengerLdsChannel from '~/components/lah-messenger-lds-channel.vue'
import LahMessengerPersonalChannel from '~/components/lah-messenger-personal-channel.vue'
import LahMessengerOnlineUsers from '~/components/lah-messenger-online-users.vue'
import LahMessengerStatus from '~/components/lah-messenger-status.vue'
import { DEPT_NAME_MAP } from '~/constants/lah-messenger-constants'

export default {
  name: 'LahMessengerHome',
  components: {
    LahMessengerAnnouncementChannel,
    LahMessengerDepartmentChannel,
    LahMessengerLdsChannel,
    LahMessengerPersonalChannel,
    LahMessengerOnlineUsers,
    LahMessengerStatus
  },
  mixins: [lahMessengerBase],
  props: {
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
    activeTab: 'dept',
    currentDeptChannel: '',
    activePersonalUser: '',
    connectText: '',
    connecting: false,
    showCustomWsInput: false,
    inputWsHost: '',
    inputWsPort: '',
    customWsHost: '',
    customWsPort: '',
    reconnectMs: 20 * 1000,
    reconnectTimer: null,
    msgQueue: [],
    processingQueue: false,
    toastMessageQueue: [],
    toastProcessTimer: null,
    activeToastIds: [],
    toastSeq: 0
  }),
  computed: {
    rootClasses () {
      return {
        'embedded-mode': this.embedded,
        'disconnected-mode': !this.connected
      }
    },
    rootStyle () {
      if (this.height) {
        return { height: this.height }
      }
      return {}
    },
    currentWsConnStr () {
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && ws.url) {
        return ws.url.replace(/\/$/, '')
      }
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        const customHost = window.localStorage.getItem('lah-messenger-custom-ws-host')
        const customPort = window.localStorage.getItem('lah-messenger-custom-ws-port')
        if (customHost) {
          return `ws://${customHost}:${customPort || 8081}`
        }
      }
      if (this.systemConfigs && this.systemConfigs.WS_SERVER_IP) {
        return `ws://${this.systemConfigs.WS_SERVER_IP}:${this.systemConfigs.WS_SERVER_PORT || this.defaultWsPort || 8081}`
      }
      if (this.wsHost) {
        return `ws://${this.wsHost}:${this.wsPort || this.defaultWsPort || 8081}`
      }
      return 'ws://220.1.34.75:8081'
    }
  },
  watch: {
    userid (val) {
      if (val && this.connected) {
        this.register()
      }
    },
    connectText (val) {
      this.$store.commit('statusText', val)
    },
    userdept: {
      immediate: true,
      handler (val) {
        if (val && !this.currentDeptChannel) {
          this.currentDeptChannel = val
        }
      }
    }
  },
  mounted () {
    this.currentDeptChannel = this.userdept || 'inf'
    this.activePersonalUser = this.userid

    this.delayConnect = this.$utils.debounce(this.connect, 1500)
    this.delayQueryOnlineClients = this.$utils.debounce(() => {
      this.queryOnlineClients()
    }, 300)
    this.delayUpdateChannelLastReadId = this.$utils.debounce(this.updateChannelLastReadId, 300)

    if (process.client && typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedHost = window.localStorage.getItem('lah-messenger-custom-ws-host')
        const savedPort = window.localStorage.getItem('lah-messenger-custom-ws-port')
        if (savedHost) {
          this.customWsHost = savedHost
          this.inputWsHost = savedHost
        }
        if (savedPort) {
          this.customWsPort = savedPort
          this.inputWsPort = savedPort
        }
      } catch (e) {}
    }

    this.connectText = this.connected ? '即時通就緒' : '即時通未連線'
    this.connect()
    this.startReconnectTimer()
    this.$root.$on('lah-messenger:connect', this.connect)
  },
  beforeDestroy () {
    this.$root.$off('lah-messenger:connect', this.connect)
    clearTimeout(this.toastProcessTimer)
    this.stopReconnectTimer()
    this.closeWebsocket()
  },
  methods: {
    // ---------------------------------------------------------
    // 頻道切換與當前狀態計算
    // ---------------------------------------------------------
    getCurrentActiveChannel () {
      if (this.activeTab === 'announcement') {
        return 'announcement'
      }
      if (this.activeTab === 'dept') {
        return this.currentDeptChannel || this.userdept || 'inf'
      }
      if (this.activeTab === 'lds') {
        return 'lds'
      }
      if (this.activeTab === 'personal') {
        return this.activePersonalUser || this.userid
      }
      return ''
    },
    switchTab (tabName) {
      this.activeTab = tabName
      const targetChannel = this.getCurrentActiveChannel()
      if (targetChannel) {
        this.$store.commit('currentChannel', targetChannel)
        this.resetUnread(targetChannel)
        if (targetChannel === 'announcement' && this.userdept) {
          this.resetUnread(`announcement_${this.userdept}`)
        }
        this.sendChannelUpdate(targetChannel)
        this.updateChannelLastReadId(targetChannel)
      }
    },
    switchChannel (channel) {
      if (!channel) {
        return
      }
      const ch = String(channel).trim()
      const upperCh = ch.toUpperCase()
      const upperUid = (this.userid || '').toUpperCase()

      if (ch === 'announcement' || ch.startsWith('announcement_')) {
        this.switchTab('announcement')
      } else if (ch === 'lds') {
        this.switchTab('lds')
      } else if (ch === 'chat' || this.chatRooms?.includes(ch)) {
        if (this.chatRooms?.includes(ch) && ch !== 'lds') {
          this.currentDeptChannel = ch
        }
        this.switchTab('dept')
      } else if (upperCh === upperUid) {
        this.activePersonalUser = this.userid
        this.switchTab('personal')
      } else if (this.userMap && (this.userMap[upperCh] || this.userMap[ch])) {
        this.activePersonalUser = upperCh
        this.switchTab('personal')
      } else if (DEPT_NAME_MAP && DEPT_NAME_MAP[ch]) {
        this.currentDeptChannel = ch
        this.switchTab('dept')
      } else if (ch === 'online') {
        this.switchTab('online')
      } else {
        this.activePersonalUser = ch
        this.switchTab('personal')
      }

      this.$nextTick(() => {
        if (this.activeTab === 'personal' && this.$refs.personalChannel?.scrollToBottom) {
          this.$refs.personalChannel.scrollToBottom()
        }
      })
    },
    onDeptClick (deptId) {
      if (deptId && deptId !== 'none') {
        this.currentDeptChannel = deptId
        this.switchTab('dept')
      }
    },
    onUserChat (user) {
      if (user?.userid) {
        this.activePersonalUser = user.userid
        this.switchTab('personal')
      }
    },

    // ---------------------------------------------------------
    // WebSocket 連線與重試機制
    // ---------------------------------------------------------
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
          this.$store.commit('wsConnected', true)
          this.$store.commit('websocket', ws)
          this.setConnectText('即時通已連線')
          this.register()
          this.connecting = false
        }

        ws.onclose = () => {
          this.$store.commit('wsConnected', false)
          this.$store.commit('websocket', undefined)
          this.setConnectText('即時通已斷開')
          this.connecting = false
        }

        ws.onerror = () => {
          this.$store.commit('wsConnected', false)
          this.$store.commit('websocket', undefined)
          this.setConnectText('即時通伺服器連線失敗')
          this.connecting = false
        }

        ws.onmessage = (e) => {
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
        this.websocket.onopen = null
        this.websocket.onmessage = null
        this.websocket.onerror = null
        this.websocket.onclose = null
        this.websocket.close()
        this.$store.commit('wsConnected', false)
        this.$store.commit('websocket', undefined)
      }
    },
    triggerReconnect () {
      this.closeWebsocket()
      this.connect()
      this.notify('正在重新連線即時通伺服器...', { variant: 'info' })
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
    toggleCustomWsInput () {
      this.showCustomWsInput = !this.showCustomWsInput
      if (this.showCustomWsInput) {
        this.inputWsHost = this.customWsHost || '220.1.34.75'
        this.inputWsPort = this.customWsPort || '8081'
      }
    },
    applyCustomWsAndConnect () {
      const host = (this.inputWsHost || '').trim()
      const port = (this.inputWsPort ? String(this.inputWsPort) : '').trim()
      if (!host) {
        this.warning('請輸入 WebSocket 伺服器 IP 或主機名稱')
        return
      }
      this.customWsHost = host
      this.customWsPort = port || '8081'
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('lah-messenger-custom-ws-host', this.customWsHost)
          window.localStorage.setItem('lah-messenger-custom-ws-port', this.customWsPort)
        } catch (e) {}
      }
      this.notify(`已設定 WS 伺服器為 ${this.customWsHost}:${this.customWsPort}，重新連線中...`, { variant: 'info' })
      this.closeWebsocket()
      this.connect()
      this.showCustomWsInput = false
    },
    setOnlinePreset () {
      this.inputWsHost = '220.1.34.75'
      this.inputWsPort = '8081'
      this.applyCustomWsAndConnect()
    },
    resetCustomWs () {
      this.customWsHost = ''
      this.customWsPort = ''
      this.inputWsHost = ''
      this.inputWsPort = ''
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.removeItem('lah-messenger-custom-ws-host')
          window.localStorage.removeItem('lah-messenger-custom-ws-port')
        } catch (e) {}
      }
      this.notify('已還原為系統預設 WS 伺服器設定，重新連線中...', { variant: 'info' })
      this.closeWebsocket()
      this.connect()
      this.showCustomWsInput = false
    },

    // ---------------------------------------------------------
    // 註冊與狀態指令
    // ---------------------------------------------------------
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
            channel: this.getCurrentActiveChannel()
          })
        )
        this.queryUnreadCount()
      }
    },
    sendChannelUpdate (channel) {
      if (this.websocket?.readyState === 1 && this.userid) {
        this.websocket.send(
          this.packCommand({
            command: 'update_current_channel',
            channel,
            userid: this.userid
          })
        )
      }
    },
    queryUnreadCount () {
      const channels = [
        'announcement',
        this.userid,
        'lds',
        this.userdept
      ]
      const uniqueChannels = [...new Set(channels.filter(c => !this.$utils.empty(c)))]
      uniqueChannels.forEach(c => this.queryChannelUnreadCount(c))
    },
    async queryChannelUnreadCount (c) {
      if (c && c.startsWith('announcement_')) {
        return
      }
      if (this.websocket?.readyState === 1) {
        const lastId = (await this.getChannelLastReadId(c)) || 0
        this.$utils.log(`[即時通] 查詢未讀數: 頻道 [${c}]，本地最後已讀 ID: ${lastId}`)
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

    // ---------------------------------------------------------
    // 訊息接收與通知分發
    // ---------------------------------------------------------
    async handleWebSocketMessage (e) {
      let incoming
      try {
        incoming = JSON.parse(e.data)
      } catch (err) {
        return
      }
      if (!incoming) {
        return
      }

      try {
        const channel = incoming.channel
        const receivedId = this.extractMessageId(incoming)
        const lastReadId = (await this.getChannelLastReadId(channel)) || 0

        const existingMessages = this.messages[channel] || []
        const currentMaxId = existingMessages.reduce((max, m) => {
          const mid = this.extractMessageId(m)
          return mid > max ? mid : max
        }, 0)
        const currentMaxTs = existingMessages.reduce((max, m) => {
          const mts = this.extractMessageTimestamp(m)
          return mts > max ? mts : max
        }, 0)
        const incomingTs = this.extractMessageTimestamp(incoming)

        let isHistory = Boolean(
          incoming.prepend === true ||
          (incoming.message && typeof incoming.message === 'object' && incoming.message.prepend === true)
        )
        if (
          (receivedId > 0 && currentMaxId > 0 && receivedId >= currentMaxId) ||
          (incomingTs > 0 && currentMaxTs > 0 && incomingTs >= currentMaxTs)
        ) {
          isHistory = false
        }

        if (incoming.type === 'ack') {
          this.handleAckMessage(incoming.message)
        } else if (channel === 'system') {
          this.handleSystemMessage(incoming.message)
        } else if (channel) {
          if (!Array.isArray(this.messages[channel])) {
            this.$store.commit('addChannel', channel)
          }

          const isDuplicate = this.messages[channel].some((m) => {
            const incId = this.extractMessageId(incoming)
            const mId = this.extractMessageId(m)
            if (incId > 0 && mId > 0) {
              return incId === mId
            }
            return (
              m.sender === incoming.sender &&
              m.date === incoming.date &&
              m.time === incoming.time &&
              m.message === incoming.message
            )
          })

          if (!isDuplicate) {
            if (isHistory) {
              this.messages[channel].unshift(incoming)
            } else {
              this.messages[channel].push(incoming)
            }
            this.sortChannelMessages(channel)
          }

          const activeChannel = this.getCurrentActiveChannel()
          const isViewingThisChannel =
            activeChannel === channel ||
            (activeChannel === 'announcement' && channel.startsWith('announcement_'))

          if (isViewingThisChannel) {
            this.resetUnread(channel)
            this.delayUpdateChannelLastReadId && this.delayUpdateChannelLastReadId(channel)
          } else if (incoming.message && incoming.sender !== 'system' && !isHistory) {
            const isTargetChannel =
              !channel?.startsWith('announcement_') &&
              ['lds', 'announcement', this.userid, this.userdept].some(c => (c || '').toUpperCase() === (channel || '').toUpperCase())

            const numReceivedId = parseInt(receivedId) || 0
            const numLastReadId = parseInt(lastReadId) || 0

            if (numReceivedId > 0 && numReceivedId <= numLastReadId) {
              this.$utils.log(`[即時通] 頻道 [${channel}] 收到訊息 ID: ${numReceivedId} <= 已讀 ID: ${numLastReadId}，略過未讀計數`)
            } else if ((!numReceivedId || numReceivedId > numLastReadId) && isTargetChannel) {
              if (!this.isDashboardActive || !this.isDashboardChannel(channel)) {
                this.plusUnread(channel)
              }
            }
          }

          if (!isHistory && incoming.message && incoming.sender !== 'system') {
            this.triggerNotification(incoming)
          }
        }
      } catch (err) {
        this.$utils.error('[即時通] 處理訊息異常:', err)
      }
      this.connecting = false
    },
    handleAckMessage (json) {
      if (typeof json === 'string') {
        try {
          json = JSON.parse(json)
        } catch (e) {}
      }
      const cmd = json?.command
      switch (cmd) {
        case 'register':
          if (json.success) {
            this.queryUnreadCount()
          }
          break
        case 'unread': {
          const ch = json.payload?.channel
          if (ch && ch.startsWith('announcement_')) {
            break
          }
          const activeChannel = this.getCurrentActiveChannel()
          const isViewingThisChannel = activeChannel === ch
          const serverUnread = parseInt(json.payload?.unread) || 0
          this.$utils.log(`[即時通] 收到未讀數回傳: 頻道 [${ch}] = ${serverUnread} (當前檢視: ${activeChannel})`)
          if (isViewingThisChannel) {
            this.$store.commit('setUnread', {
              channel: ch,
              count: 0
            })
            this.delayUpdateChannelLastReadId && this.delayUpdateChannelLastReadId(ch)
          } else {
            this.$store.commit('setUnread', {
              channel: ch,
              count: serverUnread
            })
          }
          break
        }
        case 'online':
          this.$store.commit(
            'connectedUsers',
            (json.payload?.users || []).filter(n => n)
          )
          break
        case 'remove_message':
          if (json.success && json.payload) {
            const list = this.messages[json.payload.channel]
            if (Array.isArray(list)) {
              const idx = list.findIndex(msg => msg.id === json.payload.id)
              if (idx > -1) {
                list.splice(idx, 1)
              }
            }
          }
          this.setConnectText(`${json.message}`)
          break
        case 'edit_message':
          if (json.success && json.payload) {
            const channel = json.payload.channel
            const payload = json.payload.payload
            const found = this.messages[channel]?.find(msg => msg.id === payload?.id)
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
            }
          }
          break
        case 'previous':
          this.$store.commit('fetchingHistory', false)
          this.setConnectText(`${json.message}(${json.payload?.count || 0}筆)`)
          break
        case 'set_read':
        case 'check_read': {
          const targetList = cmd === 'set_read' ? this.messages[json.payload?.channel] : this.messages[json.payload?.sender]
          if (Array.isArray(targetList)) {
            const msgId = cmd === 'set_read' ? json.payload?.id : json.payload?.senderChannelMessageId
            const found = targetList.find(m => m?.id === msgId)
            if (found && (found.flag & 2) !== 2) { found.flag += 2 }
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
      if (typeof json === 'string') {
        try {
          json = JSON.parse(json)
        } catch (e) {}
      }
      if (['user_connected', 'user_disconnected', 'user_channel_changed'].includes(json?.command)) {
        if (typeof this.delayQueryOnlineClients === 'function') {
          this.delayQueryOnlineClients()
        }
        if (!this.$utils.empty(json?.message)) {
          this.setConnectText(json.message)
        }
      }
    },
    async triggerNotification (incoming) {
      const channel = incoming.channel
      if (this.isDashboardActive && this.isDashboardChannel(channel)) {
        return
      }
      const receivedId = this.extractMessageId(incoming)
      const numReceivedId = parseInt(receivedId) || 0
      const lastReadId = (await this.getChannelLastReadId(channel)) || 0
      const numLastReadId = parseInt(lastReadId) || 0

      // 檢查是否已提醒過此訊息，避免重複通知
      const lastNotifiedKey = `${channel}_last_notified_id`
      const lastNotifiedId = parseInt(await this.getCache(lastNotifiedKey)) || 0
      if (numReceivedId > 0 && numReceivedId <= lastNotifiedId) {
        return
      }

      if (!numReceivedId || numReceivedId > numLastReadId) {
        if (numReceivedId > 0) {
          this.setCache(lastNotifiedKey, numReceivedId)
        }
        this.invokeNotification(incoming)
      }
    },
    invokeNotification (i) {
      const temp = document.createElement('div')
      temp.innerHTML = i.message?.title || i.message || ''
      const fullText = temp.textContent || ''

      const isSelf = (i.sender || '').toUpperCase() === this.userid.toUpperCase()
      const isPersonalToSelf = (i.channel || '').toUpperCase() === this.userid.toUpperCase()
      const activeChannel = this.getCurrentActiveChannel()
      const isCurrentChannel = activeChannel === i.channel

      const shouldNotify = !isSelf || isPersonalToSelf || !isCurrentChannel

      if (shouldNotify) {
        const senderName = isPersonalToSelf && isSelf ? '自己' : (this.userMap[i.sender] || i.sender)
        const channelName = this.getChannelName(i.channel)
        this.setConnectText(`💬 來自 ${senderName}: ${fullText}`)
        this.$emit('new-message', {
          ...i,
          senderName,
          channelName,
          fullText
        })
      }
    },
    sortChannelMessages (channel) {
      if (!channel || !Array.isArray(this.messages[channel])) {
        return
      }
      this.messages[channel].sort(this.compareMessages)
    },

    // ---------------------------------------------------------
    // 本地已讀 ID 與快取維護
    // ---------------------------------------------------------
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
          this.$utils.warn(`[即時通] 讀取 localStorage [${key}] 失敗:`, e)
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
            this.$utils.log(`[即時通] 記錄 ${channel} 本地已讀 ID: ${current} -> ${numId}`)
          }
        } catch (e) {
          this.$utils.warn(`[即時通] 寫入 localStorage [${key}] 失敗:`, e)
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
      const ch = channel || this.getCurrentActiveChannel()
      if (!ch) {
        return
      }

      const findMaxId = (list) => {
        if (!Array.isArray(list) || list.length === 0) {
          return 0
        }
        return list.reduce((max, item) => {
          const numId = this.extractMessageId(item)
          return numId > max ? numId : max
        }, 0)
      }

      const list = this.messages[ch] || []
      const maxId = findMaxId(list)
      if (maxId > 0) {
        await this.setChannelLastReadId(ch, maxId)
      }
      this.resetUnread(ch)
      this.$utils.log(`[即時通] updateChannelLastReadId: 頻道 [${ch}]，列表長度: ${list.length}，最大 ID: ${maxId}`)
    },

    // ---------------------------------------------------------
    // 連線狀態訊息佇列
    // ---------------------------------------------------------
    setConnectText (text) {
      this.msgQueue.push(text)
      if (this.msgQueue.length > 10) {
        this.msgQueue.shift()
      }
      this.processQueue()
    },
    processQueue () {
      if (this.processingQueue || this.msgQueue.length === 0) {
        return
      }
      this.processingQueue = true
      const text = this.msgQueue.shift()
      this.connectText = text
      setTimeout(() => {
        this.processingQueue = false
        this.processQueue()
      }, 1000)
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-messenger-home {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 520px;
  position: relative;
  background-color: #f4f6f9;

  &.embedded-mode {
    border-radius: 0;
  }

  .connection-banner {
    flex-shrink: 0;
    font-size: 0.85rem;
    z-index: 1020;
  }

  .home-card-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .home-main-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    border: none;
    border-radius: 0;
    background-color: transparent;

    ::v-deep .card-header {
      padding: 0;
      background-color: #ffffff;
      border-bottom: 2px solid #e9ecef;
      flex-shrink: 0;
    }
  }

  .home-nav-tabs {
    ::v-deep .nav-link {
      padding: 0.6rem 0.4rem;
      border: none;
      border-bottom: 3px solid transparent;
      border-radius: 0;
      color: #6c757d;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover {
        color: #007bff;
        background-color: #f8f9fa;
      }

      &.active {
        color: #007bff;
        background-color: #ffffff;
        border-bottom-color: #007bff;
      }
    }
  }

  .home-card-body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    ::v-deep .channel-card {
      border-radius: 0;
      border: none;
      box-shadow: none;
    }
  }
}
</style>
