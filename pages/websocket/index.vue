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
        li 本頁面將即時通各功能分頁一次展開並列顯示（公告、課室頻道、全所頻道、線上使用者）。
        li 左側第一欄為 #[b.text-danger 全所公告]，具備管理者權限可直接發布新公告。
        li 第二欄為 #[b.text-primary 使用者所屬課室頻道]，支援對話、表情符號、截圖貼上與附加圖片。
        li 第三欄為 #[b.text-success 全事務所頻道]，可與全所所有線上同仁進行即時公務交流。
        li 第四欄為 #[b.text-info 線上使用者列表]，即時呈現各部門上線同仁名單與狀態。
        li 接收端若要接收桌面即時通知，請確保已開啟 #[b 桃園地政即時通] 桌面端程式。
      b-badge.ml-2(
        :variant="connected ? 'success' : 'warning'"
        pill
      )
        span {{ currentWsConnStr }} {{ connected ? '伺服器已連線' : '伺服器連線中 / 斷線' }}
        b-icon.ml-1(:icon="connected ? 'wifi' : 'wifi-off'")
    .d-flex.align-items-center
      lah-button(
        icon="sync-alt"
        variant="outline-primary"
        size="sm"
        pill
        action="cycle-alt"
        @click="initAllChannels"
        title="重新整理所有頻道內容與名單"
      )
        span.font-weight-bold 重新整理所有頻道

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

  //- 四欄主排版佈局 (由左至右：公告、使用者部門、全所、線上使用者)
  .quad-container.mt-2
    .row.h-100.mx-n1
      //- ================= 第 1 欄：全所公告 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        b-card.channel-card(no-body)
          template(#header): .d-flex.justify-content-between.align-items-center
            .d-flex.align-items-center.text-truncate
              b-icon.mr-1(icon="megaphone-fill" variant="danger")
              span.font-weight-bold 全所公告
              b-badge.ml-1(variant="danger" pill v-if="showUnread('announcement')") {{ getUnread('announcement') }}
              b-badge.ml-1(variant="secondary" pill) {{ announcementList.length }}
            .d-flex.align-items-center
              //- 僅管理者或有發布權限之同仁顯示發布按鈕
              b-button.mr-1(
                v-if="isAuthorized"
                size="sm"
                variant="outline-danger"
                class="py-0 px-2 s-80"
                @click="openPostAnnouncement"
                title="發布新公告"
              )
                b-icon(icon="plus")
                span.ml-1 發布
              b-button.mr-1(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isFetchingHistory.announcement || announcementList.length === 0"
                @click="loadHistory('announcement')"
                title="載入較早公告"
              )
                b-spinner(small v-if="isFetchingHistory.announcement" class="mr-1")
                b-icon(icon="arrow-up-circle" v-else)
                span.ml-1 較早
              b-button(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isRefreshing.announcement"
                @click="refreshChannel('announcement')"
                title="重新整理公告"
              )
                b-icon(icon="arrow-clockwise" :animation="isRefreshing.announcement ? 'spin' : undefined")
          b-card-body.p-2.d-flex.flex-column.position-relative
            b-overlay(:show="isRefreshing.announcement" no-wrap opacity="0.6" spinner-variant="danger" rounded="sm")
            .message-scroll-area(ref="announcementMsgBox")
              .text-center.my-5.text-muted(v-if="announcementList.length === 0")
                b-icon(icon="inbox-fill" font-scale="2.5" variant="secondary")
                .mt-2 目前尚無公告訊息
              transition-group(v-else name="list" tag="div")
                lah-messenger-message(
                  v-for="(item, idx) in announcementList"
                  :key="`announcement-${item.id || idx}`"
                  :raw="item"
                  :prev="announcementList[idx - 1]"
                  @remove="refreshChannel('announcement')"
                )

      //- ================= 第 2 欄：使用者部門頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        b-card.channel-card(no-body)
          template(#header): .d-flex.justify-content-between.align-items-center
            .d-flex.align-items-center.text-truncate
              b-icon.mr-1(icon="building" variant="primary")
              span.font-weight-bold {{ effectiveDeptName }}
              b-badge.ml-1(variant="primary" pill v-if="showUnread(effectiveDeptChannel)") {{ getUnread(effectiveDeptChannel) }}
              b-badge.ml-1(variant="secondary" pill) {{ deptList.length }}
            .d-flex.align-items-center
              //- 僅系統管理者有權切換觀看其他課室頻道
              b-select.mr-1(
                v-if="isAdmin"
                v-model="selectedDeptChannel"
                :options="deptChannelsOpts"
                size="sm"
                class="py-0 s-80"
                style="width: 105px;"
                @change="onDeptChannelChange"
                title="切換課室頻道"
              )
              b-button.mr-1(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isFetchingHistory.dept || deptList.length === 0"
                @click="loadHistory(effectiveDeptChannel)"
                title="載入較早訊息"
              )
                b-spinner(small v-if="isFetchingHistory.dept" class="mr-1")
                b-icon(icon="arrow-up-circle" v-else)
                span.ml-1 較早
              b-button(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isRefreshing.dept"
                @click="refreshChannel(effectiveDeptChannel)"
                title="重新整理課室訊息"
              )
                b-icon(icon="arrow-clockwise" :animation="isRefreshing.dept ? 'spin' : undefined")
          b-card-body.p-2.d-flex.flex-column.position-relative
            b-overlay(:show="isRefreshing.dept" no-wrap opacity="0.6" spinner-variant="primary" rounded="sm")
            .message-scroll-area(ref="deptMsgBox")
              .text-center.my-5.text-muted(v-if="deptList.length === 0")
                b-icon(icon="chat-square-dots" font-scale="2.5" variant="secondary")
                .mt-2 目前【{{ effectiveDeptName }}】無訊息
              transition-group(v-else name="list" tag="div")
                lah-messenger-message(
                  v-for="(item, idx) in deptList"
                  :key="`dept-msg-${item.id || idx}`"
                  :raw="item"
                  :prev="deptList[idx - 1]"
                  @reply="replyDept"
                  @remove="refreshChannel(effectiveDeptChannel)"
                )
          template(#footer): .position-relative
            //- 剪貼簿截圖 / 上傳圖片預覽縮圖
            .d-flex.flex-wrap.p-1.mb-1.bg-light.rounded.border(v-if="deptInputImages.length > 0")
              .position-relative.m-1(v-for="(img, idx) in deptInputImages" :key="`dept-img-${idx}`")
                b-img(:src="img" thumbnail style="max-height: 50px; max-width: 70px;")
                b-button.close-btn(size="sm" variant="danger" @click="deptInputImages.splice(idx, 1)") ✕
            //- 表情符號彈出視窗
            lah-transition(fade): .float-emoji(v-if="deptEmoji")
              .d-flex.justify-content-between.align-items-center.px-1.mb-1.border-bottom.pb-1
                span.small.text-muted 點選表情符號
                b-button(variant="link" size="sm" class="p-0 text-muted" @click="deptEmoji = false") ✕
              lah-messenger-emoji-pickup(@click="addDeptEmoji")
            b-input-group(size="sm")
              b-textarea(
                ref="deptTextarea"
                v-model="deptInputText"
                :placeholder="`傳送到【${effectiveDeptName}】... (Ctrl+Enter)`"
                @keyup.enter.ctrl="sendDept"
                @keyup.enter.shift="sendDept"
                @paste="pasteImage($event, pastedDept)"
                no-resize
                rows="2"
              )
              b-button.ml-1(
                @click="sendDept"
                :variant="deptValid ? 'primary' : 'outline-primary'"
                :disabled="!deptValid"
                title="傳送訊息"
              )
                b-icon(icon="cursor" rotate="45")
              b-button.mx-1(
                @click="deptEmoji = !deptEmoji"
                variant="outline-secondary"
                title="表情符號"
              )
                span.h6 😀
              b-button(
                @click="pickImage(effectiveDeptChannel)"
                variant="outline-success"
                title="附加圖片"
              )
                b-icon(icon="image")

      //- ================= 第 3 欄：全所頻道 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        b-card.channel-card(no-body)
          template(#header): .d-flex.justify-content-between.align-items-center
            .d-flex.align-items-center.text-truncate
              b-icon.mr-1(icon="chat-quote-fill" variant="success")
              span.font-weight-bold 全所頻道
              b-badge.ml-1(variant="success" pill v-if="showUnread('lds')") {{ getUnread('lds') }}
              b-badge.ml-1(variant="secondary" pill) {{ ldsList.length }}
            .d-flex.align-items-center
              b-button.mr-1(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isFetchingHistory.lds || ldsList.length === 0"
                @click="loadHistory('lds')"
                title="載入較早訊息"
              )
                b-spinner(small v-if="isFetchingHistory.lds" class="mr-1")
                b-icon(icon="arrow-up-circle" v-else)
                span.ml-1 較早
              b-button(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isRefreshing.lds"
                @click="refreshChannel('lds')"
                title="重新整理全所訊息"
              )
                b-icon(icon="arrow-clockwise" :animation="isRefreshing.lds ? 'spin' : undefined")
          b-card-body.p-2.d-flex.flex-column.position-relative
            b-overlay(:show="isRefreshing.lds" no-wrap opacity="0.6" spinner-variant="success" rounded="sm")
            .message-scroll-area(ref="ldsMsgBox")
              .text-center.my-5.text-muted(v-if="ldsList.length === 0")
                b-icon(icon="chat-square-dots" font-scale="2.5" variant="secondary")
                .mt-2 目前全所聊天室無訊息
              transition-group(v-else name="list" tag="div")
                lah-messenger-message(
                  v-for="(item, idx) in ldsList"
                  :key="`lds-msg-${item.id || idx}`"
                  :raw="item"
                  :prev="ldsList[idx - 1]"
                  @reply="replyLds"
                  @remove="refreshChannel('lds')"
                )
          template(#footer): .position-relative
            //- 剪貼簿截圖 / 上傳圖片預覽縮圖
            .d-flex.flex-wrap.p-1.mb-1.bg-light.rounded.border(v-if="ldsInputImages.length > 0")
              .position-relative.m-1(v-for="(img, idx) in ldsInputImages" :key="`lds-img-${idx}`")
                b-img(:src="img" thumbnail style="max-height: 50px; max-width: 70px;")
                b-button.close-btn(size="sm" variant="danger" @click="ldsInputImages.splice(idx, 1)") ✕
            //- 表情符號彈出視窗
            lah-transition(fade): .float-emoji(v-if="ldsEmoji")
              .d-flex.justify-content-between.align-items-center.px-1.mb-1.border-bottom.pb-1
                span.small.text-muted 點選表情符號
                b-button(variant="link" size="sm" class="p-0 text-muted" @click="ldsEmoji = false") ✕
              lah-messenger-emoji-pickup(@click="addLdsEmoji")
            b-input-group(size="sm")
              b-textarea(
                ref="ldsTextarea"
                v-model="ldsInputText"
                placeholder="傳送到【全所聊天室】... (Ctrl+Enter)"
                @keyup.enter.ctrl="sendLds"
                @keyup.enter.shift="sendLds"
                @paste="pasteImage($event, pastedLds)"
                no-resize
                rows="2"
              )
              b-button.ml-1(
                @click="sendLds"
                :variant="ldsValid ? 'primary' : 'outline-primary'"
                :disabled="!ldsValid"
                title="傳送訊息"
              )
                b-icon(icon="cursor" rotate="45")
              b-button.mx-1(
                @click="ldsEmoji = !ldsEmoji"
                variant="outline-secondary"
                title="表情符號"
              )
                span.h6 😀
              b-button(
                @click="pickImage('lds')"
                variant="outline-success"
                title="附加圖片"
              )
                b-icon(icon="image")

      //- ================= 第 4 欄：線上使用者列表 =================
      .col-xl-3.col-lg-6.col-12.px-1.mb-2.h-100
        b-card.channel-card(no-body)
          template(#header): .d-flex.justify-content-between.align-items-center
            .d-flex.align-items-center.text-truncate
              b-icon.mr-1(icon="people-fill" variant="info")
              span.font-weight-bold 線上使用者
              b-badge.ml-1(pill :variant="connectedUsersBadgeVariant") {{ uniqueConnectedUsersCount }} 人
            .d-flex.align-items-center
              b-button(
                size="sm"
                variant="outline-secondary"
                class="py-0 px-2 s-80"
                :disabled="isRefreshing.online"
                @click="refreshOnlineUsers"
                title="重新整理線上同仁名單"
              )
                b-icon(icon="arrow-clockwise" :animation="isRefreshing.online ? 'spin' : undefined")
          //- 搜尋與排序過濾列
          .px-2.py-1.bg-light.border-bottom.d-flex.align-items-center
            b-input.mr-2(
              v-model.trim="onlineKeyword"
              placeholder="搜尋姓名或帳號..."
              size="sm"
            )
            b-checkbox.text-nowrap.s-80(
              v-model="onlineAscending"
              v-b-tooltip="'依人數由少至多排序'"
              size="sm"
              switch
            ) 排序
          b-card-body.p-2.d-flex.flex-column.position-relative
            b-overlay(:show="isRefreshing.online" no-wrap opacity="0.6" spinner-variant="info" rounded="sm")
            .message-scroll-area(ref="onlineScrollArea")
              b-list-group.online-users-list(flush)
                b-list-group-item.px-2.py-2(
                  v-for="(deptItem, idx) in onlineUsersByDept"
                  :key="`online-dept-${deptItem.id || idx}`"
                  v-if="deptItem.users.length > 0"
                ): .d-flex.align-items-start
                  .text-nowrap.mr-auto.lah-shadow.my-1
                    b-link(
                      v-if="isAdmin"
                      @click="deptItem.id !== 'none' && (selectedDeptChannel = deptItem.id)"
                      :title="deptItem.id !== 'none' ? `點擊將第二欄切換至 ${deptItem.text}` : ''"
                      class="text-decoration-none"
                    )
                      span.font-weight-bold.text-dark {{ deptItem.text }}
                      b-badge.ml-1(variant="success" pill) {{ deptItem.users.length }}
                    span.font-weight-bold.text-dark(v-else)
                      span {{ deptItem.text }}
                      b-badge.ml-1(variant="success" pill) {{ deptItem.users.length }}
                  b-avatar-group(
                    size="2.5rem"
                    :overlap="overlapRatio(deptItem.users.length)"
                  ): transition-group.d-flex.justify-content-end.flex-wrap(name="listY" tag="div"): lah-messenger-user-avatar.shadow.my-1(
                    v-for="(user, uidx) in deptItem.users"
                    :key="`avatar-${user ? (user.userid || user.id) : 'unknown'}-${uidx}`"
                    :user-data="user"
                    size="2.5rem"
                  )
              .text-center.my-5.text-muted(v-if="uniqueConnectedUsersCount === 0")
                b-icon(icon="person-x" font-scale="2.5" variant="secondary")
                .mt-2 目前無線上使用者
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import { DEPT_CODE_MAP } from '~/constants/lah-messenger-constants'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerMessageInput from '~/components/lah-messenger-message-input.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahMessengerUserAvatar from '~/components/lah-messenger-user-avatar.vue'

export default {
  name: 'WebsocketMessengerQuadDashboard',
  components: {
    LahMessengerMessage,
    LahMessengerMessageInput,
    LahMessengerEmojiPickup,
    LahMessengerImageUpload,
    LahMessengerUserAvatar
  },
  mixins: [lahMessengerBase],
  data: () => ({
    selectedDeptChannel: '',
    deptInputText: '',
    deptInputImages: [],
    deptEmoji: false,
    ldsInputText: '',
    ldsInputImages: [],
    ldsEmoji: false,
    onlineKeyword: '',
    onlineAscending: false,
    onlineTimer: null,
    isFetchingHistory: {
      announcement: false,
      dept: false,
      lds: false
    },
    isRefreshing: {
      announcement: false,
      dept: false,
      lds: false,
      online: false
    },
    onlineAvatarsMaxPerLine: 8,
    onlineResizeObserver: null,
    deptChannelsOpts: [
      { text: '資訊課', value: 'inf' },
      { text: '登記課', value: 'reg' },
      { text: '地價課', value: 'val' },
      { text: '測量課', value: 'sur' },
      { text: '行政課', value: 'adm' },
      { text: '人事室', value: 'hr' },
      { text: '會計室', value: 'acc' },
      { text: '主任祕書室', value: 'supervisor' }
    ]
  }),
  head: {
    title: '即時通訊儀表板'
  },
  computed: {
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
    effectiveDeptChannel () {
      return this.selectedDeptChannel || this.userdept || 'inf'
    },
    effectiveDeptName () {
      return this.getDepartmentName(this.effectiveDeptChannel)
    },
    isAdmin () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!auth?.isAdmin
    },
    isAuthorized () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!(auth?.isAdmin || auth?.isNotifyMgtStaff)
    },
    announcementList () {
      const general = this.messages?.announcement || []
      const deptAnnKey = 'announcement_' + this.userdept
      const deptAnn = (this.userdept && this.messages && this.messages[deptAnnKey]) || []
      return this.sortMessages([...general, ...deptAnn])
    },
    deptList () {
      const msgs = this.messages?.[this.effectiveDeptChannel] || []
      return this.sortMessages(msgs)
    },
    ldsList () {
      const msgs = this.messages?.lds || []
      return this.sortMessages(msgs)
    },
    deptValid () {
      return !this.$utils.empty(this.deptInputText?.trim()) || this.deptInputImages.length > 0
    },
    ldsValid () {
      return !this.$utils.empty(this.ldsInputText?.trim()) || this.ldsInputImages.length > 0
    },
    connectedUsersBadgeVariant () {
      if (this.uniqueConnectedUsersCount > 100) {
        return 'danger'
      }
      if (this.uniqueConnectedUsersCount > 75) {
        return 'warning'
      }
      return 'success'
    },
    onlineUsersByDept () {
      const keyword = this.onlineKeyword
      const filter = [
        { text: '資訊課', users: [], id: 'inf' },
        { text: '登記課', users: [], id: 'reg' },
        { text: '地價課', users: [], id: 'val' },
        { text: '測量課', users: [], id: 'sur' },
        { text: '行政課', users: [], id: 'adm' },
        { text: '人事室', users: [], id: 'hr' },
        { text: '會計室', users: [], id: 'acc' },
        { text: '主任祕書室', users: [], id: 'supervisor' },
        { text: '無歸屬', users: [], id: 'none' }
      ]
      const getDeptKey = (deptStr) => {
        if (!deptStr) {
          return 'none'
        }
        const s = String(deptStr).toLowerCase().trim()
        if (DEPT_CODE_MAP[deptStr]) {
          return DEPT_CODE_MAP[deptStr]
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
        if (s.includes('秘') || s.includes('祕') || s === 'supervisor') {
          return 'supervisor'
        }
        return 'none'
      }
      const users = this.uniqueConnectedUsers
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        if (!user) {
          continue
        }
        if (
          this.$utils.empty(keyword) ||
          user.userid?.includes(keyword) ||
          user.username?.includes(keyword)
        ) {
          const deptKey = getDeptKey(user?.dept)
          switch (deptKey) {
            case 'inf': filter[0].users.push(user); break
            case 'reg': filter[1].users.push(user); break
            case 'val': filter[2].users.push(user); break
            case 'sur': filter[3].users.push(user); break
            case 'adm': filter[4].users.push(user); break
            case 'hr': filter[5].users.push(user); break
            case 'acc': filter[6].users.push(user); break
            case 'supervisor': filter[7].users.push(user); break
            default: filter[8].users.push(user)
          }
        }
      }
      return filter.sort((a, b) => {
        if (a.users.length > b.users.length) {
          return this.onlineAscending ? 1 : -1
        }
        if (a.users.length < b.users.length) {
          return this.onlineAscending ? -1 : 1
        }
        return 0
      })
    }
  },
  watch: {
    connected (val) {
      if (val) {
        this.initAllChannels()
      }
    },
    websocket: {
      immediate: true,
      handler (newWs, oldWs) {
        if (oldWs && typeof oldWs.removeEventListener === 'function') {
          oldWs.removeEventListener('message', this.handlePageWsMessage)
        }
        if (newWs && typeof newWs.addEventListener === 'function') {
          newWs.removeEventListener('message', this.handlePageWsMessage)
          newWs.addEventListener('message', this.handlePageWsMessage)
        }
      }
    },
    userdept: {
      immediate: true,
      handler (val) {
        if (val && (!this.isAdmin || !this.selectedDeptChannel)) {
          this.selectedDeptChannel = val
        }
      }
    },
    'deptList.length' () {
      this.$nextTick(() => {
        if (this.isFetchingHistory.dept) {
          this.scrollToTopByChannel(this.effectiveDeptChannel)
        } else {
          this.scrollToBottom('deptMsgBox')
        }
      })
    },
    'ldsList.length' () {
      this.$nextTick(() => {
        if (this.isFetchingHistory.lds) {
          this.scrollToTopByChannel('lds')
        } else {
          this.scrollToBottom('ldsMsgBox')
        }
      })
    },
    'announcementList.length' () {
      this.$nextTick(() => {
        if (this.isFetchingHistory.announcement) {
          this.scrollToTopByChannel('announcement')
        } else {
          this.scrollToBottom('announcementMsgBox')
        }
      })
    },
    uniqueConnectedUsersCount () {
      this.updateOnlineAvatarsMaxPerLine()
    }
  },
  mounted () {
    this.$store.commit('isDashboardActive', true)
    this.selectedDeptChannel = this.userdept || 'inf'
    this.attachWsListener()
    if (this.connected) {
      this.initAllChannels()
    }
    clearInterval(this.onlineTimer)
    this.onlineTimer = setInterval(() => {
      this.queryOnlineUsers()
    }, 60 * 1000)

    this.updateOnlineAvatarsMaxPerLine()
    window.addEventListener('resize', this.updateOnlineAvatarsMaxPerLine)
    if (typeof ResizeObserver !== 'undefined' && this.$refs.onlineScrollArea) {
      this.onlineResizeObserver = new ResizeObserver(() => {
        this.updateOnlineAvatarsMaxPerLine()
      })
      this.onlineResizeObserver.observe(this.$refs.onlineScrollArea)
    }

    this.$nextTick(() => {
      this.scrollToBottom('announcementMsgBox')
      this.scrollToBottom('deptMsgBox')
      this.scrollToBottom('ldsMsgBox')
      this.resetUnread('announcement')
      this.resetUnread(this.effectiveDeptChannel)
      this.resetUnread('lds')
    })
  },
  beforeDestroy () {
    this.$store.commit('isDashboardActive', false)
    clearInterval(this.onlineTimer)
    this.detachWsListener()
    window.removeEventListener('resize', this.updateOnlineAvatarsMaxPerLine)
    if (this.onlineResizeObserver) {
      this.onlineResizeObserver.disconnect()
      this.onlineResizeObserver = null
    }
  },
  methods: {
    attachWsListener () {
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && typeof ws.addEventListener === 'function') {
        ws.removeEventListener('message', this.handlePageWsMessage)
        ws.addEventListener('message', this.handlePageWsMessage)
      }
    },
    detachWsListener () {
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && typeof ws.removeEventListener === 'function') {
        ws.removeEventListener('message', this.handlePageWsMessage)
      }
    },
    getChannelCategory (channel) {
      if (!channel) {
        return ''
      }
      if (channel === 'announcement' || channel.startsWith('announcement_')) {
        return 'announcement'
      }
      if (channel === this.effectiveDeptChannel) {
        return 'dept'
      }
      if (channel === 'lds') {
        return 'lds'
      }
      return ''
    },
    handlePageWsMessage (e) {
      let incoming
      try {
        incoming = JSON.parse(e.data)
      } catch (err) {
        return
      }
      if (!incoming) {
        return
      }

      // 1. 處理 ACK 回執 (例如 previous 命令結束通知)
      if (incoming.type === 'ack') {
        let msg = incoming.message
        if (typeof msg === 'string') {
          try {
            msg = JSON.parse(msg)
          } catch (e) {}
        }
        if (msg?.command === 'previous') {
          const ch = msg.payload?.channel
          const cat = this.getChannelCategory(ch)
          if (cat) {
            setTimeout(() => {
              this.isFetchingHistory[cat] = false
            }, 800)
          }
          if (msg.success) {
            this.notify(`已載入【${this.getChannelName(ch)}】較早歷史訊息`, { variant: 'success' })
            this.$nextTick(() => {
              this.scrollToTopByChannel(ch)
            })
          } else {
            this.notify(`【${this.getChannelName(ch)}】已無更早的歷史訊息`, { variant: 'warning' })
          }
        }
        return
      }

      // 2. 判斷是否為歷史訊息 (prepend: true)
      const isHistory = Boolean(
        incoming.prepend === true ||
        (incoming.message && typeof incoming.message === 'object' && incoming.message.prepend === true)
      )

      const channel = incoming.channel
      if (!channel || channel === 'system') {
        return
      }

      // 確保任何頻道訊息（最新拉取或歷史訊息）都能正確加入對應頻道陣列
      if (incoming.message && channel !== 'system') {
        if (!this.messages[channel]) {
          this.$store.commit('addChannel', channel)
        }
        const chMsgs = this.messages[channel]
        if (Array.isArray(chMsgs)) {
          const incId = this.extractMessageId(incoming)
          const isDuplicate = chMsgs.some((m) => {
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
              chMsgs.unshift(incoming)
            } else {
              chMsgs.push(incoming)
            }
            chMsgs.sort(this.compareMessages)
            this.$nextTick(() => {
              if (isHistory || this.isFetchingHistory[this.getChannelCategory(channel)]) {
                this.scrollToTopByChannel(channel)
              }
            })
          }
        }
      }
    },
    initAllChannels () {
      this.fetchChannelMessages('announcement', 30)
      if (this.userdept) {
        this.fetchChannelMessages('announcement_' + this.userdept, 30)
      }
      this.fetchChannelMessages(this.effectiveDeptChannel, 30)
      this.fetchChannelMessages('lds', 30)
      this.queryOnlineUsers()
      this.resetUnread('announcement')
      this.resetUnread(this.effectiveDeptChannel)
      this.resetUnread('lds')
      this.$nextTick(() => {
        this.scrollToBottom('announcementMsgBox')
        this.scrollToBottom('deptMsgBox')
        this.scrollToBottom('ldsMsgBox')
      })
    },
    fetchChannelMessages (channel, count = 30) {
      if (this.websocket && this.websocket.readyState === 1 && channel) {
        this.$store.commit('addChannel', channel)
        this.websocket.send(
          JSON.stringify({
            type: 'command',
            sender: this.userid,
            date: this.date(),
            time: this.time(),
            channel: 'system',
            message: JSON.stringify({
              command: 'latest',
              channel,
              count
            })
          })
        )
      }
    },
    refreshChannel (channel) {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理')
        return
      }
      const cat = this.getChannelCategory(channel)
      if (cat) {
        this.$set(this.isRefreshing, cat, true)
      }

      // 清空該頻道的訊息快取，以確保能完整重新向伺服器拉取最新資料
      if (channel === 'announcement') {
        this.$set(this.messages, 'announcement', [])
        if (this.userdept) {
          this.$set(this.messages, 'announcement_' + this.userdept, [])
        }
        this.fetchChannelMessages('announcement', 30)
        if (this.userdept) {
          this.fetchChannelMessages('announcement_' + this.userdept, 30)
        }
        this.resetUnread('announcement')
      } else {
        this.$set(this.messages, channel, [])
        this.fetchChannelMessages(channel, 30)
        this.resetUnread(channel)
      }

      setTimeout(() => {
        if (cat) {
          this.$set(this.isRefreshing, cat, false)
        }
        this.$nextTick(() => {
          if (cat === 'announcement') {
            this.scrollToBottom('announcementMsgBox')
          } else if (cat === 'dept') {
            this.scrollToBottom('deptMsgBox')
          } else if (cat === 'lds') {
            this.scrollToBottom('ldsMsgBox')
          }
        })
        this.notify(`已重新讀取【${this.getChannelName(channel)}】最新資料`, { variant: 'success' })
      }, 600)
    },
    refreshOnlineUsers () {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理')
        return
      }
      this.$set(this.isRefreshing, 'online', true)
      this.queryOnlineUsers()
      setTimeout(() => {
        this.$set(this.isRefreshing, 'online', false)
        this.notify('已重新整理線上同仁名單', { variant: 'success' })
      }, 600)
    },
    overlapRatio (count) {
      const maxInRow = this.onlineAvatarsMaxPerLine || 8
      // 若一排可以完整顯示部門成員就不需要重疊
      if (count <= maxInRow) {
        return 0.0
      }
      if (count < maxInRow + 2) { return 0.3 }
      if (count < Math.round(maxInRow * 2.5)) { return 0.4 }
      if (count < 64) { return 0.5 }
      return 0.6
    },
    updateOnlineAvatarsMaxPerLine () {
      this.$nextTick(() => {
        const el = this.$refs.onlineScrollArea
        if (el) {
          const width = el.clientWidth
          // 扣除左側課室標籤 (~95px) 與邊距
          const available = width - 100
          if (available > 0) {
            // 頭像尺寸為 2.5rem = 40px
            this.onlineAvatarsMaxPerLine = Math.max(Math.floor(available / 40), 5)
          }
        }
      })
    },
    queryOnlineUsers () {
      if (this.websocket && this.websocket.readyState === 1) {
        // 使用 'chat' 頻道查詢，使 WebSocket Server 廣播/回傳所有課室之所有在線同仁名單
        this.websocket.send(
          this.packCommand({
            command: 'online',
            channel: 'chat'
          })
        )
      }
    },
    onDeptChannelChange (newDept) {
      if (!this.isAdmin) {
        return
      }
      if (newDept) {
        this.refreshChannel(newDept)
      }
    },
    getChannelHeadId (channel) {
      let list = this.messages?.[channel] || []
      if (!list || list.length === 0) {
        if (channel === 'announcement' || channel.startsWith('announcement_')) {
          list = this.announcementList
        } else if (channel === this.effectiveDeptChannel) {
          list = this.deptList
        } else if (channel === 'lds') {
          list = this.ldsList
        }
      }
      if (!list || list.length === 0) {
        return 0
      }
      let minId = Infinity
      for (let i = 0; i < list.length; i++) {
        const id = this.extractMessageId(list[i])
        if (id > 0 && id < minId) {
          minId = id
        }
      }
      return minId === Infinity ? 0 : minId
    },
    loadHistory (channel) {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法載入歷史訊息')
        return
      }
      const headId = this.getChannelHeadId(channel)
      if (headId <= 0) {
        this.warning(`【${this.getChannelName(channel)}】目前無訊息基準點可向上讀取`)
        return
      }
      const cat = this.getChannelCategory(channel)
      if (cat) {
        this.isFetchingHistory[cat] = true
        setTimeout(() => {
          this.isFetchingHistory[cat] = false
        }, 10000)
      }
      this.scrollToTopByChannel(channel)
      this.websocket.send(
        JSON.stringify({
          type: 'command',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          channel: 'system',
          message: JSON.stringify({
            command: 'previous',
            channel,
            headId,
            count: 15
          })
        })
      )
      if (channel === 'announcement' && this.userdept) {
        const deptAnnChan = 'announcement_' + this.userdept
        const deptHeadId = this.getChannelHeadId(deptAnnChan)
        if (deptHeadId > 0) {
          this.websocket.send(
            JSON.stringify({
              type: 'command',
              sender: this.userid,
              date: this.date(),
              time: this.time(),
              channel: 'system',
              message: JSON.stringify({
                command: 'previous',
                channel: deptAnnChan,
                headId: deptHeadId,
                count: 15
              })
            })
          )
        }
      }
      this.notify(`正在載入【${this.getChannelName(channel)}】較早歷史訊息...`, { variant: 'info' })
    },
    scrollToTopByChannel (channel) {
      let refName = ''
      if (channel === 'announcement' || channel.startsWith('announcement_')) {
        refName = 'announcementMsgBox'
      } else if (channel === this.effectiveDeptChannel) {
        refName = 'deptMsgBox'
      } else if (channel === 'lds') {
        refName = 'ldsMsgBox'
      }
      if (refName && this.$refs[refName]) {
        const el = this.$refs[refName]
        this.$nextTick(() => {
          try {
            if (typeof el.scrollTo === 'function') {
              el.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              el.scrollTop = 0
            }
          } catch (err) {
            el.scrollTop = 0
          }
        })
      }
    },
    sendChannelMessage (channel, text, images = []) {
      if (this.$utils.empty(text) && (!images || images.length === 0)) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通連線未就緒，無法發送訊息')
        return
      }
      let imgMdText = (images || [])
        .map((base64, idx) => `![preview-${idx}](${base64})`)
        .join('\n')
      if (!this.$utils.empty(text) && !this.$utils.empty(imgMdText)) {
        imgMdText = `\n\n***\n\n${imgMdText}`
      }
      const protectedText = this.protectLocalPath(text || '')
      const fullText = `${protectedText} ${imgMdText}`.trim()
      const markdText = this.$utils.convertMarkd(fullText)

      try {
        this.websocket.send(
          this.packMessage(markdText, { channel })
        )
      } catch (e) {
        console.error(`[即時通] 發送至 ${channel} 失敗:`, e)
        this.warning(`發送失敗: ${e.message}`)
      }
    },
    sendDept () {
      if (!this.deptValid) {
        return
      }
      this.sendChannelMessage(this.effectiveDeptChannel, this.deptInputText, this.deptInputImages)
      this.deptInputText = ''
      this.deptInputImages = []
      this.deptEmoji = false
      this.$nextTick(() => {
        this.$refs.deptTextarea?.$el?.focus()
      })
    },
    sendLds () {
      if (!this.ldsValid) {
        return
      }
      this.sendChannelMessage('lds', this.ldsInputText, this.ldsInputImages)
      this.ldsInputText = ''
      this.ldsInputImages = []
      this.ldsEmoji = false
      this.$nextTick(() => {
        this.$refs.ldsTextarea?.$el?.focus()
      })
    },
    pastedDept (base64) {
      if (base64 && !this.deptInputImages.includes(base64)) {
        this.deptInputImages.push(base64)
      }
    },
    pastedLds (base64) {
      if (base64 && !this.ldsInputImages.includes(base64)) {
        this.ldsInputImages.push(base64)
      }
    },
    addDeptEmoji (emoji) {
      this.deptEmoji = false
      this.deptInputText = (this.deptInputText ? this.deptInputText + ' ' : '') + emoji + ' '
      this.$nextTick(() => {
        this.$refs.deptTextarea?.$el?.focus()
      })
    },
    addLdsEmoji (emoji) {
      this.ldsEmoji = false
      this.ldsInputText = (this.ldsInputText ? this.ldsInputText + ' ' : '') + emoji + ' '
      this.$nextTick(() => {
        this.$refs.ldsTextarea?.$el?.focus()
      })
    },
    replyDept (raw) {
      const sender = this.userMap[raw.sender] || raw.sender
      const hrIdx = raw.message?.indexOf('<hr>')
      const text = hrIdx === -1 ? raw.message : raw.message.substring(hrIdx + 4)
      const tmp = document.createElement('div')
      tmp.innerHTML = `@${sender} ${text}`
      let innerText = tmp.textContent || ''
      if (this.$utils.length(innerText) > 20) {
        innerText = innerText.substring(0, 20) + ' ... '
      }
      this.deptInputText = `${innerText}\n\n***\n\n`
      this.$nextTick(() => {
        this.$refs.deptTextarea?.$el?.focus()
      })
    },
    replyLds (raw) {
      const sender = this.userMap[raw.sender] || raw.sender
      const hrIdx = raw.message?.indexOf('<hr>')
      const text = hrIdx === -1 ? raw.message : raw.message.substring(hrIdx + 4)
      const tmp = document.createElement('div')
      tmp.innerHTML = `@${sender} ${text}`
      let innerText = tmp.textContent || ''
      if (this.$utils.length(innerText) > 20) {
        innerText = innerText.substring(0, 20) + ' ... '
      }
      this.ldsInputText = `${innerText}\n\n***\n\n`
      this.$nextTick(() => {
        this.$refs.ldsTextarea?.$el?.focus()
      })
    },
    openPostAnnouncement () {
      this.$store.commit('currentChannel', 'announcement')
      this.modal(this.$createElement(LahMessengerMessageInput, {
        props: {
          to: 'announcement',
          pickUser: false
        },
        on: {
          sent: () => {
            this.hideModalById('announcement-modal')
            setTimeout(() => this.fetchChannelMessages('announcement'), 500)
          }
        }
      }), {
        id: 'announcement-modal',
        size: 'lg',
        title: '發布全所公告'
      })
    },
    pickImage (channel) {
      this.modal(
        this.$createElement(LahMessengerImageUpload, {
          props: { to: channel, modalId: 'messenger-image-upload-modal' },
          on: {
            publish: (b64) => {
              this.sendImage(b64, '上傳圖片', channel)
              this.hideModalById('messenger-image-upload-modal')
            }
          }
        }),
        { id: 'messenger-image-upload-modal', size: 'md', title: `附加圖片至【${this.getChannelName(channel)}】` }
      )
    },
    triggerReconnect () {
      this.$root.$emit('lah-messenger:connect')
      this.notify('正在要求即時通伺服器重新連線...', { variant: 'info' })
    },
    scrollToBottom (refName) {
      const scroll = () => {
        const el = this.$refs[refName]
        if (el) {
          el.scrollTop = el.scrollHeight
        }
      }
      scroll()
      this.$nextTick(scroll)
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
</script>

<style lang="scss" scoped>
.websocket-dashboard-page {
  .quad-container {
    height: calc(100vh - 145px);
    min-height: 620px;
  }

  .channel-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    ::v-deep .card-header {
      padding: 0.5rem 0.75rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      flex-shrink: 0;
    }

    ::v-deep .card-body {
      padding: 0.5rem;
      flex: 1 1 auto;
      overflow: hidden;
      min-height: 0;
      display: flex;
      flex-direction: column;
      background-color: #fafbfc;
    }

    ::v-deep .card-footer {
      padding: 0.5rem;
      background: #ffffff;
      border-top: 1px solid #e9ecef;
      flex-shrink: 0;
    }
  }

  .message-scroll-area {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding-right: 4px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .float-emoji {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 180px;
    overflow-y: auto;
    background: #ffffff;
    border: 1px solid #ced4da;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1050;
    padding: 6px;
  }

  .close-btn {
    position: absolute;
    top: -5px;
    right: -5px;
    padding: 0 5px;
    font-size: 10px;
    line-height: 14px;
    border-radius: 50%;
  }
}
</style>
