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
        li 本頁面將即時通各功能分頁一次展開並列顯示（公告、課室頻道、全所頻道/私訊、線上使用者）。
        li 左側第一欄為 #[b.text-danger 全所公告]，具備管理者權限可直接發布新公告。
        li 第二欄為 #[b.text-primary 使用者所屬課室頻道]，支援對話、表情符號、截圖貼上與附加圖片。
        li 第三欄為 #[b.text-success 全事務所頻道]，可與全所同仁即時交流；點擊第四欄同仁可切換為 #[b.text-info 個人私訊]。
        li 第四欄為 #[b.text-info 線上使用者列表]，即時呈現各部門上線同仁名單與狀態。
        li 接收端若要接收桌面即時通知，請確保已開啟 #[b 桃園地政即時通] 桌面端程式。
      b-badge.ml-2(
        :variant="connected ? 'success' : 'warning'"
        pill
      )
        span {{ currentWsConnStr }} {{ connected ? '伺服器已連線' : '伺服器連線中 / 斷線' }}
        b-icon.ml-1(:icon="connected ? 'wifi' : 'wifi-off'")
    .d-flex.align-items-center(v-if="connected")
      //- 側邊抽屜展開個人訊息按鈕
      lah-button.mr-2(
        size="lg"
        pill
        :variant="personalSidebarVisible ? 'info' : 'outline-primary'"
        :action="personalSidebarVisible ? '' : 'bounce'"
        @click="togglePersonalSidebar(activePersonalUser || userid)"
        :title="personalSidebarVisible ? '收起個人私訊抽屜' : '以右側抽屜彈出個人訊息'"
      )
        b-icon.mr-1(icon="layout-sidebar-reverse")
        span.font-weight-bold 個人訊息
        b-badge.ml-1(
          v-if="myPersonalUnread > 0"
          variant="danger"
          pill
        ) {{ myPersonalUnread }}

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
        lah-messenger-channel-announcement(ref="announcementChannel")

      //- ================= 第 2 欄：使用者部門頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        lah-messenger-channel-department(
          ref="departmentChannel"
          :channel="selectedDeptChannel"
          @channel-change="onDeptChannelChange"
        )

      //- ================= 第 3 欄：全所頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        lah-messenger-channel-lds(ref="ldsChannel")

      //- ================= 第 4 欄：線上使用者列表 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        lah-messenger-online-users(
          ref="onlineUsers"
          @dept-click="onDeptClick"
          @user-chat="onUserChat"
        )

  //- 右側專屬個人私訊抽屜 (提供給想要邊看全所、邊看私訊的同仁)
  b-sidebar(
    id="dashboard-personal-sidebar"
    v-model="personalSidebarVisible"
    right
    shadow="lg"
    backdrop
    no-header
    no-close-on-route-change
    width="480px"
    sidebar-class="dashboard-personal-sidebar-custom"
    body-class="p-0 d-flex flex-column h-100 overflow-hidden"
  )
    template(#default)
      .sidebar-header.d-flex.justify-content-between.align-items-center.px-3.py-2.bg-info.text-white.shadow-sm
        .d-flex.align-items-center
          b-icon.mr-2(icon="chat-dots-fill")
          span.font-weight-bold.h6.mb-0 {{ sidebarPersonalTitle }}
          b-badge.ml-2(
            v-if="myPersonalUnread > 0"
            variant="danger"
            pill
          ) {{ myPersonalUnread }} 未讀
        .d-flex.align-items-center
          b-button(
            variant="link"
            class="text-white p-1 text-decoration-none"
            title="關閉私訊抽屜"
            @click="personalSidebarVisible = false"
          )
            b-icon(icon="x-lg" font-scale="1.1")
      .sidebar-body.flex-grow-1.overflow-hidden
        lah-messenger-channel-personal(
          ref="sidebarPersonalChannel"
          :target-user="sidebarTargetUser || userid"
          :show-back-button="false"
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
    personalSidebarVisible: false,
    sidebarTargetUser: ''
  }),
  head: {
    title: '即時通訊儀表板'
  },
  computed: {
    myPersonalUnread () {
      return this.getUnread(this.userid) || 0
    },
    sidebarPersonalTitle () {
      if (this.sidebarTargetUser && this.sidebarTargetUser !== this.userid) {
        const name = this.userMap[this.sidebarTargetUser] || this.sidebarTargetUser
        return `個人訊息 (${name})`
      }
      return '我的個人訊息'
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
    }
  },
  mounted () {
    this.$store.commit('isDashboardActive', true)
    if (!this.userSelectedDept) {
      this.selectedDeptChannel = this.userdept || 'inf'
    }
  },
  beforeDestroy () {
    this.$store.commit('isDashboardActive', false)
  },
  methods: {
    togglePersonalSidebar (targetUid) {
      if (this.personalSidebarVisible) {
        this.personalSidebarVisible = false
      } else {
        this.openPersonalSidebar(targetUid)
      }
    },
    openPersonalSidebar (targetUid) {
      const uid = targetUid || this.activePersonalUser || this.userid
      this.sidebarTargetUser = uid
      this.personalSidebarVisible = true
      this.$nextTick(() => {
        this.$refs.sidebarPersonalChannel?.setTargetUser(uid)
      })
    },
    initAllChannels () {
      if (!this.userSelectedDept && this.userdept) {
        this.selectedDeptChannel = this.userdept
      }
      this.$refs.announcementChannel?.refresh()
      this.$refs.departmentChannel?.refresh()
      this.$refs.ldsChannel?.refresh()
      this.$refs.sidebarPersonalChannel?.refresh()
      this.$refs.onlineUsers?.refresh()
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
      }
    },
    onDeptClick (deptId) {
      if (this.isAdmin && deptId && deptId !== 'none') {
        this.selectedDeptChannel = deptId
        this.userSelectedDept = true
      }
    },
    onUserChat (user) {
      if (user?.userid) {
        this.activePersonalUser = user.userid
        this.openPersonalSidebar(user.userid)
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
::v-deep .dashboard-personal-sidebar-custom {
  .b-sidebar-header {
    display: none;
  }
}
</style>
