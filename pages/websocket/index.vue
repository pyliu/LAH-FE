<template lang="pug">
.websocket-dashboard-page
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex.align-items-center
      .my-auto.font-weight-bold.h4.mb-0 即時通訊儀表板 💬
      lah-button(
        icon="info"
        action="bounce"
        variant="outline-success"
        no-border
        no-icon-gutter
        @click="showModalById('help-modal')"
        title="系統說明"
      )
      lah-help-modal(:modal-id="'help-modal'"): ul
        li 本頁面將即時通各功能分頁一次展開並列顯示（公告、課室頻道、全所頻道、線上使用者/個人私訊）。
        li 左側第一欄為 #[b.text-danger 全所公告]，具備管理者權限可直接發布新公告。
        li 第二欄為 #[b.text-primary 使用者所屬課室頻道]，支援對話、表情符號、截圖貼上與附加圖片。
        li 第三欄為 #[b.text-success 全事務所頻道]，可與全所同仁即時交流。
        li 第四欄為 #[b.text-info 線上使用者列表 / 個人私訊]，支援直接切換顯示，免彈出側邊抽屜遮擋畫面。
        li 停留在儀表板時，所有公務訊息自動秒讀取；收到新訊息時區塊將產生呼吸燈光暈與頂部提示。
        li 收到個人私訊時，頂部按鈕與第 4 欄將產生光暈提示與未讀計數，可隨時點擊切換查看。
      b-badge.ml-2(
        :variant="connected ? 'success' : 'warning'"
        pill
      )
        span {{ currentWsConnStr }} {{ connected ? '伺服器已連線' : '伺服器連線中 / 斷線' }}
        b-icon.ml-1(:icon="connected ? 'wifi' : 'wifi-off'")
    .d-flex.align-items-center(v-if="connected")
      //- 第 4 欄切換「線上同仁 / 個人私訊」按鈕組
      b-button-group.mr-2(size="lg")
        b-button(
          :variant="col4View === 'online' ? 'primary' : 'outline-primary'"
          @click="switchCol4View('online')"
          title="切換第 4 欄顯示：線上同仁列表"
        )
          b-icon.mr-1(icon="people-fill")
          span.font-weight-bold 線上同仁
          b-badge.ml-1(
            v-if="uniqueConnectedUsersCount > 0"
            :variant="col4View === 'online' ? 'light' : 'success'"
            pill
          ) {{ uniqueConnectedUsersCount }}
        b-button(
          :variant="col4View === 'personal' ? 'info' : 'outline-info'"
          :class="{ 'btn-pulse-personal': pulseState.personal }"
          @click="switchCol4View('personal')"
          title="切換第 4 欄顯示：個人私訊"
        )
          b-icon.mr-1(icon="chat-dots-fill")
          span.font-weight-bold 個人訊息
          b-badge.ml-1(
            v-if="col4View !== 'personal' && myPersonalUnread > 0"
            variant="danger"
            pill
          ) {{ myPersonalUnread }}

      //- 新訊息音效提示開關按鈕
      lah-button.mr-2(
        :icon="soundEnabled ? 'volume-up' : 'volume-mute'"
        :variant="soundEnabled ? 'outline-info' : 'outline-secondary'"
        size="lg"
        pill
        @click="toggleSound"
        :title="soundEnabled ? '提示音已開啟 (點擊靜音)' : '提示音已靜音 (點擊開啟)'"
      )

      lah-button(
        icon="sync-alt"
        variant="outline-secondary"
        size="lg"
        pill
        action="cycle"
        @click="initAllChannels"
        title="重新整理所有頻道內容與名單"
      )
        span.font-weight-bold

  //- 斷線警告提示列
  b-alert(
    v-if="!connected"
    show
    variant="warning"
    class="py-2 px-3 my-2 d-flex justify-content-between align-items-center shadow-sm"
  )
    .d-flex.align-items-center
      b-spinner(small variant="warning" class="mr-2")
      span 即時通伺服器連線中或尚未連線 ({{ currentWsConnStr }})，正在自動嘗試連線...
    b-button(
      size="sm"
      variant="outline-dark"
      @click="triggerReconnect"
    ) 立即連線

  //- 四欄主排版佈局 (由左至右：公告、使用者部門、全所/私訊、線上使用者)
  .quad-container.mt-2
    .row.h-100.mx-n1
      //- ================= 第 1 欄：全所公告 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        .column-card-wrapper(
          :class="{ 'card-pulse-announcement': pulseState.announcement }"
        )
          transition(name="fade")
            .pulse-badge.pulse-badge-announcement(v-if="pulseState.announcement")
              b-icon.mr-1(icon="bell-fill" animation="cylon")
              span ✨ 新公告
          lah-messenger-channel-announcement(ref="announcementChannel")

      //- ================= 第 2 欄：使用者部門頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        .column-card-wrapper(
          :class="{ 'card-pulse-dept': pulseState.dept }"
        )
          transition(name="fade")
            .pulse-badge.pulse-badge-dept(v-if="pulseState.dept")
              b-icon.mr-1(icon="chat-dots-fill" animation="cylon")
              span ✨ 新對話
          lah-messenger-channel-department(
            ref="departmentChannel"
            :channel="selectedDeptChannel"
            @channel-change="onDeptChannelChange"
          )

      //- ================= 第 3 欄：全所頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        .column-card-wrapper(
          :class="{ 'card-pulse-lds': pulseState.lds }"
        )
          transition(name="fade")
            .pulse-badge.pulse-badge-lds(v-if="pulseState.lds")
              b-icon.mr-1(icon="chat-quote-fill" animation="cylon")
              span ✨ 新訊息
          lah-messenger-channel-lds(ref="ldsChannel")

      //- ================= 第 4 欄：線上使用者 / 個人私訊 切換 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        .column-card-wrapper(
          :class="{ 'card-pulse-personal': pulseState.personal }"
        )
          transition(name="fade")
            .pulse-badge.pulse-badge-personal(
              v-if="pulseState.personal && col4View !== 'personal'"
              @click="switchCol4View('personal')"
              style="cursor: pointer;"
              title="點擊切換查看新私訊"
            )
              b-icon.mr-1(icon="chat-dots-fill" animation="cylon")
              span ✨ 新私訊
          transition(name="tab-fade" mode="out-in")
            keep-alive
              lah-messenger-channel-personal(
                v-if="col4View === 'personal'"
                key="personal"
                ref="personalChannel"
                :target-user="activePersonalUser || userid"
                :show-back-button="true"
                back-button-title="切換回線上使用者列表"
                @close="switchCol4View('online')"
                @user-change="onPersonalUserChange"
              )
              lah-messenger-online-users(
                v-else
                key="online"
                ref="onlineUsers"
                @dept-click="onDeptClick"
                @user-chat="onUserChat"
              )
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerChannelAnnouncement from '~/components/lah-messenger-channel-announcement.vue'
import LahMessengerChannelDepartment from '~/components/lah-messenger-channel-department.vue'
import LahMessengerChannelLds from '~/components/lah-messenger-channel-lds.vue'
import LahMessengerChannelPersonal from '~/components/lah-messenger-channel-personal.vue'
import LahMessengerOnlineUsers from '~/components/lah-messenger-online-users.vue'

export default {
  name: 'WebsocketMessengerQuadDashboard',
  components: {
    LahMessengerChannelAnnouncement,
    LahMessengerChannelDepartment,
    LahMessengerChannelLds,
    LahMessengerChannelPersonal,
    LahMessengerOnlineUsers
  },
  mixins: [lahMessengerBase],
  data: () => ({
    selectedDeptChannel: '',
    userSelectedDept: false,
    activePersonalUser: '',
    col4View: 'online',
    soundEnabled: true,
    pulseState: {
      announcement: false,
      dept: false,
      lds: false,
      personal: false
    },
    pulseTimers: {
      announcement: null,
      dept: null,
      lds: null,
      personal: null
    },
    titleTimer: null,
    originalTitle: '即時通訊儀表板',
    audioCtx: null
  }),
  head: {
    title: '即時通訊儀表板'
  },
  computed: {
    myPersonalUnread () {
      return this.getUnread(this.userid) || 0
    },
    currentWsConnStr () {
      // 1. 若 WebSocket 物件已建立，優先回傳底層實際連線的 url
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && ws.url) {
        return ws.url.replace(/\/$/, '')
      }
      // 2. 若使用者在前端 localStorage 中自訂過 WS 連線設定
      if (process.client && typeof window !== 'undefined' && window.localStorage) {
        const customHost = window.localStorage.getItem('lah-messenger-custom-ws-host')
        const customPort = window.localStorage.getItem('lah-messenger-custom-ws-port')
        if (customHost) {
          return `ws://${customHost}:${customPort || 8081}`
        }
      }
      // 3. 系統環境設定 (WS_SERVER_IP / WS_SERVER_PORT)
      if (this.systemConfigs && this.systemConfigs.WS_SERVER_IP) {
        return `ws://${this.systemConfigs.WS_SERVER_IP}:${this.systemConfigs.WS_SERVER_PORT || this.defaultWsPort || 8081}`
      }
      if (this.wsHost) {
        return `ws://${this.wsHost}:${this.wsPort || this.defaultWsPort || 8081}`
      }
      // 4. 正式機預設
      return 'ws://220.1.34.75:8081'
    },
    isAdmin () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!auth?.isAdmin
    }
  },
  watch: {
    userdept: {
      immediate: true,
      handler (val) {
        if (val && !this.userSelectedDept) {
          this.selectedDeptChannel = val
        }
      }
    },
    col4View (val) {
      const isPersonal = val === 'personal'
      this.$store.commit('isPersonalDrawerOpen', isPersonal)
      if (isPersonal) {
        // 切換至個人私訊 -> 立即秒讀取並清除未讀徽章
        const target = this.activePersonalUser || this.userid
        this.resetUnread(this.userid)
        if (target && target !== this.userid) {
          this.resetUnread(target)
        }
        this.updateChannelLastReadId(target)
      }
    }
  },
  mounted () {
    if (typeof document !== 'undefined') {
      this.originalTitle = document.title || '即時通訊儀表板'
    }
    this.$store.commit('isDashboardActive', true)
    this.$store.commit('isPersonalDrawerOpen', this.col4View === 'personal')

    if (!this.userSelectedDept) {
      this.selectedDeptChannel = this.userdept || 'inf'
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedSound = window.localStorage.getItem('lah-messenger-dashboard-sound')
        if (savedSound !== null) {
          this.soundEnabled = savedSound === '1'
        }
      } catch (e) {}
    }

    // 進入儀表板：將公務頻道（公告、所屬課室、全所頻道）秒讀取並更新本地已讀 ID
    this.markDashboardChannelsAsRead()

    // 註冊全域即時訊息監聽器
    this.$root.$on('lah-messenger:message-received', this.onDashboardMessageReceived)
    this.$root.$on('lah-messenger:user-chat', this.onUserChat)
    this.$root.$on('lah-messenger:open-chat', this.onUserChat)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.onWindowFocus)
    }
  },
  beforeDestroy () {
    this.$store.commit('isDashboardActive', false)
    this.$store.commit('isPersonalDrawerOpen', false)
    this.$root.$off('lah-messenger:message-received', this.onDashboardMessageReceived)
    this.$root.$off('lah-messenger:user-chat', this.onUserChat)
    this.$root.$off('lah-messenger:open-chat', this.onUserChat)
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onWindowFocus)
    }
    this.stopTitleFlash()
    Object.values(this.pulseTimers).forEach((timer) => {
      clearTimeout(timer)
    })
  },
  methods: {
    markDashboardChannelsAsRead () {
      const channels = ['announcement', 'lds']
      if (this.userdept) {
        channels.push(this.userdept)
      }
      if (this.selectedDeptChannel) {
        channels.push(this.selectedDeptChannel)
      }
      const unique = [...new Set(channels.filter(Boolean))]
      unique.forEach((ch) => {
        this.resetUnread(ch)
        this.updateChannelLastReadId(ch)
      })
      if (this.col4View === 'personal') {
        const target = this.activePersonalUser || this.userid
        this.resetUnread(this.userid)
        if (target && target !== this.userid) {
          this.resetUnread(target)
        }
        this.updateChannelLastReadId(target)
      }
    },
    onDashboardMessageReceived (payload) {
      if (!payload || !payload.channel) {
        return
      }
      const ch = String(payload.channel).toLowerCase()
      const myDept = (this.userdept || '').toLowerCase()
      const currentDept = (this.selectedDeptChannel || myDept).toLowerCase()
      const isSelf = (payload.sender || '').toUpperCase() === (this.userid || '').toUpperCase()
      const isPersonal = (payload.channel || '').toUpperCase() === (this.userid || '').toUpperCase() ||
        Boolean(this.activePersonalUser && (payload.channel || '').toUpperCase() === this.activePersonalUser.toUpperCase())

      let tag = '訊息'
      let pulseKey = ''

      if (ch === 'announcement' || ch.startsWith('announcement_')) {
        pulseKey = 'announcement'
        tag = '全所公告'
        // 秒讀取
        this.resetUnread(payload.channel)
        this.updateChannelLastReadId(payload.channel)
      } else if (ch === currentDept || ch === myDept) {
        pulseKey = 'dept'
        tag = `${payload.channelName || '課室頻道'}`
        // 秒讀取
        this.resetUnread(payload.channel)
        this.updateChannelLastReadId(payload.channel)
      } else if (ch === 'lds') {
        pulseKey = 'lds'
        tag = '全所公務'
        // 秒讀取
        this.resetUnread(payload.channel)
        this.updateChannelLastReadId(payload.channel)
      } else if (isPersonal) {
        pulseKey = 'personal'
        tag = '個人私訊'
        if (this.col4View === 'personal') {
          // 第 4 欄切換為個人私訊中 -> 秒讀取
          this.resetUnread(payload.channel)
          this.updateChannelLastReadId(payload.channel)
        }
      }

      if (!isSelf && pulseKey) {
        this.triggerPulse(pulseKey)
        this.playGentleChime()
        this.flashTitle(`💬 新訊息【${tag}】`)
      }
    },
    triggerPulse (key) {
      this.$set(this.pulseState, key, true)
      clearTimeout(this.pulseTimers[key])
      this.pulseTimers[key] = setTimeout(() => {
        this.$set(this.pulseState, key, false)
      }, 3500)
    },
    playGentleChime () {
      if (!this.soundEnabled || typeof window === 'undefined') {
        return
      }
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) {
          return
        }
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass()
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume()
        }
        const ctx = this.audioCtx
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, now)
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      } catch (e) {}
    },
    toggleSound () {
      this.soundEnabled = !this.soundEnabled
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('lah-messenger-dashboard-sound', this.soundEnabled ? '1' : '0')
        } catch (e) {}
      }
      if (this.soundEnabled) {
        this.playGentleChime()
        this.notify('已開啟新訊息提示音', { variant: 'info' })
      } else {
        this.notify('已切換為靜音模式', { variant: 'secondary' })
      }
    },
    flashTitle (text) {
      if (typeof document === 'undefined') {
        return
      }
      if (document.hasFocus && document.hasFocus()) {
        return
      }
      let toggle = false
      this.stopTitleFlash()
      this.titleTimer = setInterval(() => {
        document.title = toggle ? text : this.originalTitle
        toggle = !toggle
      }, 1000)
    },
    stopTitleFlash () {
      if (this.titleTimer) {
        clearInterval(this.titleTimer)
        this.titleTimer = null
        if (typeof document !== 'undefined') {
          document.title = this.originalTitle
        }
      }
    },
    onWindowFocus () {
      this.stopTitleFlash()
    },
    toggleCol4View () {
      this.switchCol4View(this.col4View === 'personal' ? 'online' : 'personal')
    },
    switchCol4View (mode, targetUid) {
      this.col4View = mode
      if (mode === 'personal') {
        if (targetUid) {
          this.activePersonalUser = targetUid
        } else if (!this.activePersonalUser) {
          this.activePersonalUser = this.userid
        }
        this.resetUnread(this.userid)
        if (this.activePersonalUser && this.activePersonalUser !== this.userid) {
          this.resetUnread(this.activePersonalUser)
        }
        this.updateChannelLastReadId(this.activePersonalUser)
        this.$nextTick(() => {
          this.$refs.personalChannel?.setTargetUser?.(this.activePersonalUser)
        })
      } else if (mode === 'online') {
        this.$nextTick(() => {
          this.$refs.onlineUsers?.updateOnlineAvatarsMaxPerLine?.()
        })
      }
    },
    initAllChannels () {
      if (!this.userSelectedDept && this.userdept) {
        this.selectedDeptChannel = this.userdept
      }
      this.markDashboardChannelsAsRead()
      this.$refs.announcementChannel?.refresh?.()
      this.$refs.departmentChannel?.refresh?.()
      this.$refs.ldsChannel?.refresh?.()
      this.$refs.personalChannel?.refresh?.()
      this.$refs.onlineUsers?.refresh?.()
      this.notify('已重新整理所有頻道與線上名單', { variant: 'success' })
    },
    triggerReconnect () {
      this.$root.$emit('lah-messenger:connect')
      this.notify('正在要求即時通伺服器重新連線...', { variant: 'info' })
    },
    onDeptChannelChange (newDept) {
      if (newDept) {
        this.selectedDeptChannel = newDept
        this.userSelectedDept = true
        this.resetUnread(newDept)
        this.updateChannelLastReadId(newDept)
      }
    },
    onDeptClick (deptId) {
      if (this.isAdmin && deptId && deptId !== 'none') {
        this.selectedDeptChannel = deptId
        this.userSelectedDept = true
        this.resetUnread(deptId)
        this.updateChannelLastReadId(deptId)
      }
    },
    onUserChat (user) {
      const uid = typeof user === 'object' && user !== null ? (user.userid || user.id) : user
      if (uid) {
        this.switchCol4View('personal', uid)
      }
    },
    onPersonalUserChange (newUid) {
      if (newUid) {
        this.activePersonalUser = newUid
        this.resetUnread(newUid)
        this.updateChannelLastReadId(newUid)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.websocket-dashboard-page {
  .quad-container {
    height: calc(100vh - 145px);
    min-height: 620px;
  }
}

/* ========================================================================= */
/* 欄位卡片容器與呼吸燈脈衝光暈 (Card Pulse Glow Animation)                  */
/* ========================================================================= */
.column-card-wrapper {
  position: relative;
  height: 100%;
  border-radius: 8px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;

  .pulse-badge {
    position: absolute;
    top: -8px;
    right: 24px;
    z-index: 10;
    font-size: 0.78rem;
    font-weight: bold;
    padding: 2px 10px;
    border-radius: 12px;
    color: #ffffff;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    animation: badgeBounce 0.4s ease-out;

    &.pulse-badge-announcement {
      background: #dc3545;
    }
    &.pulse-badge-dept {
      background: #007bff;
    }
    &.pulse-badge-lds {
      background: #28a745;
    }
    &.pulse-badge-personal {
      background: #17a2b8;
    }
  }

  &.card-pulse-announcement {
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.85), 0 0 20px rgba(220, 53, 69, 0.5) !important;
    animation: pulseGlowRed 1.2s infinite ease-in-out;
  }

  &.card-pulse-dept {
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.85), 0 0 20px rgba(0, 123, 255, 0.5) !important;
    animation: pulseGlowBlue 1.2s infinite ease-in-out;
  }

  &.card-pulse-lds {
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.85), 0 0 20px rgba(40, 167, 69, 0.5) !important;
    animation: pulseGlowGreen 1.2s infinite ease-in-out;
  }

  &.card-pulse-personal {
    box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.85), 0 0 20px rgba(23, 162, 184, 0.5) !important;
    animation: pulseGlowCyan 1.2s infinite ease-in-out;
  }
}

/* 個人訊息按鈕動態呼吸動畫 */
.btn-pulse-personal {
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.85), 0 0 16px rgba(23, 162, 184, 0.6) !important;
  animation: pulseButton 1s infinite alternate ease-in-out;
}

@keyframes pulseGlowRed {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.85), 0 0 16px rgba(220, 53, 69, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(220, 53, 69, 1), 0 0 28px rgba(220, 53, 69, 0.7);
  }
}

@keyframes pulseGlowBlue {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.85), 0 0 16px rgba(0, 123, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(0, 123, 255, 1), 0 0 28px rgba(0, 123, 255, 0.7);
  }
}

@keyframes pulseGlowGreen {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.85), 0 0 16px rgba(40, 167, 69, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(40, 167, 69, 1), 0 0 28px rgba(40, 167, 69, 0.7);
  }
}

@keyframes pulseGlowCyan {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.85), 0 0 16px rgba(23, 162, 184, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(23, 162, 184, 1), 0 0 28px rgba(23, 162, 184, 0.7);
  }
}

@keyframes pulseButton {
  from {
    transform: scale(1);
    box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.8), 0 0 10px rgba(23, 162, 184, 0.4);
  }
  to {
    transform: scale(1.04);
    box-shadow: 0 0 0 4px rgba(23, 162, 184, 1), 0 0 22px rgba(23, 162, 184, 0.8);
  }
}

@keyframes badgeBounce {
  0% {
    transform: scale(0.3) translateY(-10px);
    opacity: 0;
  }
  70% {
    transform: scale(1.1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.12s ease-out;
}

.tab-fade-enter,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
