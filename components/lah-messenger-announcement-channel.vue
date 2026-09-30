<template lang="pug">
b-card.channel-card(no-body)
  template(#header): .d-flex.justify-content-between.align-items-center
    .d-flex.align-items-center.text-truncate
      b-icon.mr-1(icon="megaphone-fill" variant="danger")
      span.font-weight-bold 全所公告
      b-badge.ml-1(variant="danger" pill v-if="showUnread('announcement')") {{ getUnread('announcement') }}
      b-badge.ml-1(variant="secondary" pill) {{ announcementList.length }}
    .d-flex.align-items-center
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
        :disabled="isFetchingHistory || announcementList.length === 0"
        @click="loadHistory"
        title="載入較早公告"
      )
        b-spinner(small v-if="isFetchingHistory" class="mr-1")
        b-icon(icon="arrow-up-circle" v-else)
        span.ml-1 較早
      b-button(
        size="sm"
        variant="outline-secondary"
        class="py-0 px-2 s-80"
        :disabled="isRefreshing"
        @click="refresh"
        title="重新整理公告"
      )
        b-icon(icon="arrow-clockwise" :animation="isRefreshing ? 'spin' : undefined")

  b-card-body.p-2.d-flex.flex-column.position-relative
    b-overlay(:show="isRefreshing" no-wrap opacity="0.6" spinner-variant="danger" rounded="sm")
    .message-scroll-area(ref="msgBox")
      .text-center.my-5.text-muted(v-if="announcementList.length === 0")
        b-icon(icon="inbox-fill" font-scale="2.5" variant="secondary")
        .mt-2 目前尚無公告訊息
      transition-group(v-else name="list" tag="div")
        lah-messenger-message(
          v-for="(item, idx) in announcementList"
          :key="`announcement-${item.id || idx}`"
          :raw="item"
          :prev="announcementList[idx - 1]"
          @remove="refresh"
        )
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerMessageInput from '~/components/lah-messenger-message-input.vue'

export default {
  name: 'LahMessengerAnnouncementChannel',
  components: {
    LahMessengerMessage,
    LahMessengerMessageInput
  },
  mixins: [lahMessengerBase],
  data: () => ({
    isFetchingHistory: false,
    isRefreshing: false
  }),
  computed: {
    isAuthorized () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!(auth?.isAdmin || auth?.isNotifyMgtStaff)
    },
    announcementList () {
      const general = this.messages?.announcement || []
      const deptAnnKey = 'announcement_' + this.userdept
      const deptAnn = (this.userdept && this.messages && this.messages[deptAnnKey]) || []
      return this.sortMessages([...general, ...deptAnn])
    }
  },
  watch: {
    'announcementList.length' () {
      this.$nextTick(() => {
        if (this.isFetchingHistory) {
          this.scrollToTop()
        } else {
          this.scrollToBottom()
        }
      })
    },
    websocket: {
      immediate: true,
      handler (newWs, oldWs) {
        if (oldWs && typeof oldWs.removeEventListener === 'function') {
          oldWs.removeEventListener('message', this.handleWsMessage)
        }
        if (newWs && typeof newWs.addEventListener === 'function') {
          newWs.removeEventListener('message', this.handleWsMessage)
          newWs.addEventListener('message', this.handleWsMessage)
        }
      }
    }
  },
  mounted () {
    this.attachWsListener()
    this.fetchAnnouncementMessages(30)
    this.resetUnread('announcement')
    this.$nextTick(this.scrollToBottom)
  },
  beforeDestroy () {
    this.detachWsListener()
  },
  methods: {
    attachWsListener () {
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && typeof ws.addEventListener === 'function') {
        ws.removeEventListener('message', this.handleWsMessage)
        ws.addEventListener('message', this.handleWsMessage)
      }
    },
    detachWsListener () {
      const ws = this.websocket || this.$store?.getters?.websocket
      if (ws && typeof ws.removeEventListener === 'function') {
        ws.removeEventListener('message', this.handleWsMessage)
      }
    },
    handleWsMessage (e) {
      let incoming
      try {
        incoming = JSON.parse(e.data)
      } catch (err) {
        return
      }
      if (!incoming) {
        return
      }

      // 處理 ACK 回執 (previous 載入歷史公告結束)
      if (incoming.type === 'ack') {
        let msg = incoming.message
        if (typeof msg === 'string') {
          try {
            msg = JSON.parse(msg)
          } catch (e) {}
        }
        if (msg?.command === 'previous') {
          const ch = msg.payload?.channel
          if (ch === 'announcement' || ch?.startsWith('announcement_')) {
            setTimeout(() => {
              this.isFetchingHistory = false
            }, 800)
            if (msg.success) {
              this.notify('已載入較早歷史公告', { variant: 'success' })
              this.$nextTick(this.scrollToTop)
            } else {
              this.notify('已無更早的歷史公告', { variant: 'warning' })
            }
          }
        }
      }
    },
    fetchAnnouncementMessages (count = 30) {
      if (this.websocket && this.websocket.readyState === 1) {
        this.$store.commit('addChannel', 'announcement')
        this.websocket.send(
          this.packCommand({
            command: 'latest',
            channel: 'announcement',
            count
          })
        )
        if (this.userdept) {
          const deptAnnChan = 'announcement_' + this.userdept
          this.$store.commit('addChannel', deptAnnChan)
          this.websocket.send(
            this.packCommand({
              command: 'latest',
              channel: deptAnnChan,
              count
            })
          )
        }
      }
    },
    refresh () {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理公告')
        return
      }
      this.isRefreshing = true
      this.$set(this.messages, 'announcement', [])
      if (this.userdept) {
        this.$set(this.messages, 'announcement_' + this.userdept, [])
      }
      this.fetchAnnouncementMessages(30)
      this.resetUnread('announcement')

      setTimeout(() => {
        this.isRefreshing = false
        this.$nextTick(this.scrollToBottom)
        this.notify('已重新讀取【全所公告】最新資料', { variant: 'success' })
      }, 600)
    },
    getHeadId (channel) {
      const list = this.messages?.[channel] || []
      let minId = Infinity
      for (let i = 0; i < list.length; i++) {
        const id = this.extractMessageId(list[i])
        if (id > 0 && id < minId) {
          minId = id
        }
      }
      return minId === Infinity ? 0 : minId
    },
    loadHistory () {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法載入歷史公告')
        return
      }
      const headId = this.getHeadId('announcement')
      if (headId <= 0) {
        this.warning('【全所公告】目前無訊息基準點可向上讀取')
        return
      }
      this.isFetchingHistory = true
      setTimeout(() => {
        this.isFetchingHistory = false
      }, 10000)
      this.scrollToTop()

      this.websocket.send(
        this.packCommand({
          command: 'previous',
          channel: 'announcement',
          headId,
          count: 15
        })
      )

      if (this.userdept) {
        const deptAnnChan = 'announcement_' + this.userdept
        const deptHeadId = this.getHeadId(deptAnnChan)
        if (deptHeadId > 0) {
          this.websocket.send(
            this.packCommand({
              command: 'previous',
              channel: deptAnnChan,
              headId: deptHeadId,
              count: 15
            })
          )
        }
      }
      this.notify('正在載入較早歷史公告...', { variant: 'info' })
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
            setTimeout(() => this.fetchAnnouncementMessages(30), 500)
          }
        }
      }), {
        id: 'announcement-modal',
        size: 'lg',
        title: '發布全所公告'
      })
    },
    scrollToTop () {
      const el = this.$refs.msgBox
      if (el) {
        this.$nextTick(() => {
          try {
            if (typeof el.scrollTo === 'function') {
              el.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
              el.scrollTop = 0
            }
          } catch (e) {
            el.scrollTop = 0
          }
        })
      }
    },
    scrollToBottom () {
      const el = this.$refs.msgBox
      if (el) {
        const scroll = () => {
          el.scrollTop = el.scrollHeight
        }
        scroll()
        this.$nextTick(scroll)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
</style>
