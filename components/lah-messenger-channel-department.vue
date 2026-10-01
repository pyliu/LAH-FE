<template lang="pug">
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
        :disabled="isFetchingHistory || deptList.length === 0"
        @click="loadHistory"
        title="載入較早訊息"
      )
        b-spinner(small v-if="isFetchingHistory")
        b-icon(icon="arrow-up-circle" v-else)
      b-button(
        size="sm"
        variant="outline-secondary"
        class="py-0 px-2 s-80"
        :disabled="isRefreshing"
        @click="refresh"
        title="重新整理課室訊息"
      )
        b-icon(icon="arrow-clockwise" :animation="isRefreshing ? 'spin' : undefined")

  b-card-body.p-2.d-flex.flex-column.position-relative
    b-overlay(:show="isRefreshing" no-wrap opacity="0.6" spinner-variant="primary" rounded="sm")
    .message-scroll-area(ref="msgBox")
      .text-center.my-5.text-muted(v-if="deptList.length === 0")
        b-icon(icon="chat-square-dots" font-scale="2.5" variant="secondary")
        .mt-2 目前【{{ effectiveDeptName }}】無訊息
      transition-group(v-else name="list" tag="div")
        lah-messenger-message(
          v-for="(item, idx) in deptList"
          :key="`dept-msg-${item.id || idx}`"
          :raw="item"
          :prev="deptList[idx - 1]"
          @reply="reply"
          @remove="refresh"
        )

  template(#footer): .position-relative
    //- 剪貼簿截圖 / 上傳圖片預覽縮圖
    .d-flex.flex-wrap.p-1.mb-1.bg-light.rounded.border(v-if="inputImages.length > 0")
      .position-relative.m-1(v-for="(img, idx) in inputImages" :key="`dept-img-${idx}`")
        b-img(:src="img" thumbnail style="max-height: 50px; max-width: 70px;")
        b-button.close-btn(size="sm" variant="danger" @click="inputImages.splice(idx, 1)") ✕
    //- 表情符號彈出視窗
    lah-transition(fade): .float-emoji(v-if="showEmoji")
      .d-flex.justify-content-between.align-items-center.px-1.mb-1.border-bottom.pb-1
        span.small.text-muted 點選表情符號
        b-button(variant="link" size="sm" class="p-0 text-muted" @click="showEmoji = false") ✕
      lah-messenger-emoji-pickup(@click="addEmoji")
    b-input-group(size="sm")
      b-textarea(
        ref="textarea"
        v-model="inputText"
        :placeholder="`傳送到【${effectiveDeptName}】... (Ctrl+Enter)`"
        @keyup.enter.ctrl="send"
        @keyup.enter.shift="send"
        @paste="pasteImage($event, pastedImage)"
        no-resize
        rows="2"
      )
      b-button.ml-1(
        @click="send"
        :variant="isValid ? 'primary' : 'outline-primary'"
        :disabled="!isValid"
        title="傳送訊息"
      )
        b-icon(icon="cursor" rotate="45")
      b-button.mx-1(
        @click="showEmoji = !showEmoji"
        variant="outline-secondary"
        title="表情符號"
      )
        span.h6 😀
      b-button(
        @click="pickImage"
        variant="outline-success"
        title="附加圖片"
      )
        b-icon(icon="image")
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'

export default {
  name: 'LahMessengerChannelDepartment',
  components: {
    LahMessengerMessage,
    LahMessengerEmojiPickup,
    LahMessengerImageUpload
  },
  mixins: [lahMessengerBase],
  props: {
    channel: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    selectedDeptChannel: '',
    inputText: '',
    inputImages: [],
    showEmoji: false,
    isFetchingHistory: false,
    isRefreshing: false,
    fetchTimer: null,
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
  computed: {
    effectiveDeptChannel () {
      return this.selectedDeptChannel || this.channel || this.userdept || 'inf'
    },
    effectiveDeptName () {
      return this.getDepartmentName(this.effectiveDeptChannel)
    },
    isAdmin () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!auth?.isAdmin
    },
    deptList () {
      const msgs = this.messages?.[this.effectiveDeptChannel] || []
      return this.sortMessages(msgs)
    },
    isValid () {
      return !this.$utils.empty(this.inputText?.trim()) || this.inputImages.length > 0
    }
  },
  watch: {
    channel: {
      immediate: true,
      handler (val) {
        if (val) {
          this.selectedDeptChannel = val
        }
      }
    },
    userdept: {
      immediate: true,
      handler (val) {
        if (val && !this.channel && (!this.isAdmin || !this.selectedDeptChannel)) {
          this.selectedDeptChannel = val
        }
      }
    },
    effectiveDeptChannel (newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.resetUnread(newVal)
        if (this.connected) {
          this.fetchDepartmentMessages(30)
        }
      }
    },
    connected: {
      immediate: true,
      handler (val) {
        if (val) {
          this.attachWsListener()
          this.fetchDepartmentMessages(30)
        }
      }
    },
    'deptList.length' () {
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
    if (!this.selectedDeptChannel) {
      this.selectedDeptChannel = this.channel || this.userdept || 'inf'
    }
    this.attachWsListener()
    if (this.connected && (!this.deptList || this.deptList.length === 0)) {
      this.fetchDepartmentMessages(30)
    }
    this.resetUnread(this.effectiveDeptChannel)
    this.$nextTick(this.scrollToBottom)
  },
  activated () {
    if (this.connected && (!this.deptList || this.deptList.length === 0)) {
      this.fetchDepartmentMessages(30)
    }
    this.resetUnread(this.effectiveDeptChannel)
    this.$nextTick(this.scrollToBottom)
  },
  beforeDestroy () {
    clearTimeout(this.fetchTimer)
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

      if (incoming.type === 'ack') {
        let msg = incoming.message
        if (typeof msg === 'string') {
          try {
            msg = JSON.parse(msg)
          } catch (e) {}
        }
        if (msg?.command === 'previous' && msg.payload?.channel === this.effectiveDeptChannel) {
          setTimeout(() => {
            this.isFetchingHistory = false
          }, 800)
          if (msg.success) {
            this.notify(`已載入【${this.effectiveDeptName}】較早歷史訊息`, { variant: 'success' })
            this.$nextTick(this.scrollToTop)
          } else {
            this.notify(`【${this.effectiveDeptName}】已無更早的歷史訊息`, { variant: 'warning' })
          }
        }
      }
    },
    onDeptChannelChange (newDept) {
      if (!this.isAdmin) {
        return
      }
      this.$emit('channel-change', newDept)
      this.refresh()
    },
    fetchDepartmentMessages (count = 30) {
      clearTimeout(this.fetchTimer)
      this.fetchTimer = setTimeout(() => {
        const channel = this.effectiveDeptChannel
        const ws = this.websocket || this.$store?.getters?.websocket
        if (ws && ws.readyState === 1 && channel) {
          this.$store.commit('addChannel', channel)
          ws.send(
            this.packCommand({
              command: 'latest',
              channel,
              count
            })
          )
        }
      }, 50)
    },
    refresh () {
      const channel = this.effectiveDeptChannel
      const ws = this.websocket || this.$store?.getters?.websocket
      if (!ws || ws.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理')
        return
      }
      this.isRefreshing = true
      this.$set(this.messages, channel, [])
      this.fetchDepartmentMessages(30)
      this.resetUnread(channel)

      setTimeout(() => {
        this.isRefreshing = false
        this.$nextTick(this.scrollToBottom)
        this.notify(`已重新讀取【${this.effectiveDeptName}】最新資料`, { variant: 'success' })
      }, 600)
    },
    getHeadId () {
      const list = this.messages?.[this.effectiveDeptChannel] || []
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
      const ws = this.websocket || this.$store?.getters?.websocket
      if (!ws || ws.readyState !== 1) {
        this.warning('即時通未連線，無法載入歷史訊息')
        return
      }
      const headId = this.getHeadId()
      if (headId <= 0) {
        this.warning(`【${this.effectiveDeptName}】目前無訊息基準點可向上讀取`)
        return
      }
      this.isFetchingHistory = true
      setTimeout(() => {
        this.isFetchingHistory = false
      }, 10000)
      this.scrollToTop()
      ws.send(
        this.packCommand({
          command: 'previous',
          channel: this.effectiveDeptChannel,
          headId,
          count: 15
        })
      )
      this.notify(`正在載入【${this.effectiveDeptName}】較早歷史訊息...`, { variant: 'info' })
    },
    send () {
      if (!this.isValid) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通連線未就緒，無法發送訊息')
        return
      }
      let imgMdText = (this.inputImages || [])
        .map((base64, idx) => `![preview-${idx}](${base64})`)
        .join('\n')
      if (!this.$utils.empty(this.inputText) && !this.$utils.empty(imgMdText)) {
        imgMdText = `\n\n***\n\n${imgMdText}`
      }
      const protectedText = this.protectLocalPath(this.inputText || '')
      const fullText = `${protectedText} ${imgMdText}`.trim()
      const markdText = this.$utils.convertMarkd(fullText)

      try {
        this.websocket.send(
          this.packMessage(markdText, { channel: this.effectiveDeptChannel })
        )
        this.inputText = ''
        this.inputImages = []
        this.showEmoji = false
        this.$nextTick(() => {
          this.$refs.textarea?.$el?.focus()
        })
      } catch (e) {
        this.warning(`發送失敗: ${e.message}`)
      }
    },
    reply (raw) {
      const sender = this.userMap[raw.sender] || raw.sender
      const hrIdx = raw.message?.indexOf('<hr>')
      const text = hrIdx === -1 ? raw.message : raw.message.substring(hrIdx + 4)
      const tmp = document.createElement('div')
      tmp.innerHTML = `@${sender} ${text}`
      let innerText = tmp.textContent || ''
      if (this.$utils.length(innerText) > 20) {
        innerText = innerText.substring(0, 20) + ' ... '
      }
      this.inputText = `${innerText}\n\n***\n\n`
      this.$nextTick(() => {
        this.$refs.textarea?.$el?.focus()
      })
    },
    pastedImage (base64) {
      if (base64 && !this.inputImages.includes(base64)) {
        this.inputImages.push(base64)
      }
    },
    addEmoji (emoji) {
      this.showEmoji = false
      this.inputText = (this.inputText ? this.inputText + ' ' : '') + emoji + ' '
      this.$nextTick(() => {
        this.$refs.textarea?.$el?.focus()
      })
    },
    pickImage () {
      this.modal(
        this.$createElement(LahMessengerImageUpload, {
          props: { to: this.effectiveDeptChannel, modalId: 'messenger-dept-img-modal' },
          on: {
            publish: (b64) => {
              this.sendImage(b64, '上傳圖片', this.effectiveDeptChannel)
              this.hideModalById('messenger-dept-img-modal')
            }
          }
        }),
        { id: 'messenger-dept-img-modal', size: 'md', title: `附加圖片至【${this.effectiveDeptName}】` }
      )
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
    .btn {
      white-space: nowrap;
    }
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
</style>
