<template lang="pug">
b-card.channel-card(no-body)
  template(#header): .d-flex.justify-content-between.align-items-center
    .d-flex.align-items-center.text-truncate
      b-button.p-0.mr-1(
        v-if="showBackButton"
        variant="link"
        size="sm"
        @click="$emit('close')"
        title="返回全所頻道"
      )
        b-icon(icon="arrow-left-circle-fill" font-scale="1.2" variant="secondary")
      b-icon.mr-1(
        icon="envelope-fill"
        variant="info"
      )
      span.font-weight-bold {{ displayTitle }}
      b-badge.ml-1(
        variant="info"
        pill
        v-if="showUnread(targetUserId)"
      ) {{ getUnread(targetUserId) }}
      b-badge.ml-1(variant="secondary" pill) {{ personalList.length }}

    .d-flex.align-items-center
      b-button.border-0.mr-1(
        size="sm"
        variant="outline-info"
        class="py-0 px-2 s-80"
        :disabled="isFetchingHistory || personalList.length === 0"
        @click="loadHistory"
        title="載入較早訊息"
      )
        b-spinner(small v-if="isFetchingHistory")
        b-icon(icon="arrow-up-circle" v-else)

      b-button.border-0(
        size="sm"
        variant="outline-secondary"
        class="py-0 px-2 s-80"
        :disabled="isRefreshing"
        @click="refresh"
        :title="`重新整理【${displayTitle}】訊息`"
      )
        b-icon(icon="arrow-clockwise" :animation="isRefreshing ? 'spin' : undefined")

  b-card-body.p-2.d-flex.flex-column.position-relative
    b-overlay(:show="isRefreshing" no-wrap opacity="0.6" spinner-variant="info" rounded="sm")
    .message-scroll-area(ref="msgBox")
      .text-center.my-5.text-muted(v-if="personalList.length === 0")
        b-icon(
          icon="envelope-open"
          font-scale="2.5"
          variant="secondary"
        )
        .mt-2 目前【{{ displayTitle }}】無訊息
      transition-group(v-else name="list" tag="div")
        lah-messenger-message(
          v-for="(item, idx) in personalList"
          :key="`personal-msg-${item.id || idx}`"
          :raw="item"
          :prev="personalList[idx - 1]"
          @reply="reply"
          @remove="refresh"
        )

  template(#footer): .position-relative
    //- 剪貼簿截圖 / 上傳圖片預覽縮圖
    .d-flex.flex-wrap.p-1.mb-1.bg-light.rounded.border(v-if="inputImages.length > 0")
      .position-relative.m-1(v-for="(img, idx) in inputImages" :key="`personal-img-${idx}`")
        b-img(:src="img" thumbnail style="max-height: 50px; max-width: 70px;")
        b-button.close-btn(size="sm" variant="danger" @click="inputImages.splice(idx, 1)") ✕
    //- 待上傳附件預覽
    .d-flex.flex-wrap.align-items-center.p-1.mb-1.bg-light.rounded.border(v-if="uploadFiles.length > 0")
      span.small.text-muted.mr-1 待上傳附件:
      b-badge.mr-1.mb-1.p-1(v-for="(f, fIdx) in uploadFiles" :key="`personal-att-${fIdx}`" variant="info")
        b-icon.mr-1(icon="paperclip")
        span {{ f.name }} ({{ formatFileSize(f.size) }})
        b-icon.ml-1(icon="x-circle" style="cursor: pointer;" @click="removeUploadFile(fIdx)")
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
        :placeholder="`傳送私訊給【${targetUserName}】... (Ctrl+Enter)`"
        @keyup.enter.ctrl="send"
        @keyup.enter.shift="send"
        @paste="pasteImage($event, pastedImage)"
        no-resize
        rows="2"
      )
      b-button.ml-1.d-flex.flex-column.align-items-center.justify-content-center(
        @click="send"
        :variant="isValid ? 'primary' : 'outline-primary'"
        :disabled="!isValid"
        title="傳送私訊 (Ctrl+Enter)"
        style="min-width: 48px;"
      )
        b-icon(icon="cursor" rotate="45")
    .d-flex.align-items-center.justify-content-between.mt-1
      .d-flex.align-items-center
        b-button.mr-1(
          size="sm"
          @click="showEmoji = !showEmoji"
          variant="outline-secondary"
          title="表情符號"
        )
          span.h6.mb-0 😀
        b-button.mr-1(
          size="sm"
          @click="pickImage"
          variant="outline-success"
          title="附加圖片"
        )
          b-icon(icon="image")
        b-button.mr-1(
          size="sm"
          @click="pickAttachment"
          variant="outline-info"
          title="附加檔案"
        )
          b-icon(icon="paperclip")
        input(
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="handleFileChange"
        )
      span.small.text-muted.mr-1(style="font-size: 0.75rem;") Ctrl+Enter 快速傳送
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'

export default {
  name: 'LahMessengerChannelPersonal',
  components: {
    LahMessengerMessage,
    LahMessengerEmojiPickup,
    LahMessengerImageUpload
  },
  mixins: [lahMessengerBase],
  props: {
    targetUser: {
      type: [String, Object],
      default: ''
    },
    showBackButton: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    currentTargetUser: '',
    inputText: '',
    inputImages: [],
    uploadFiles: [],
    showEmoji: false,
    isFetchingHistory: false,
    isRefreshing: false,
    fetchTimer: null
  }),
  computed: {
    targetUserId () {
      const u = this.currentTargetUser || this.targetUser
      if (typeof u === 'object' && u !== null) {
        return (u.userid || u.id || '').toUpperCase() || this.userid
      }
      return (u || '').toUpperCase() || this.userid
    },
    targetUserName () {
      const u = this.currentTargetUser || this.targetUser
      if (typeof u === 'object' && u !== null && (u.username || u.name)) {
        return u.username || u.name
      }
      if (this.targetUserId === this.userid) {
        return '自己'
      }
      return this.userMap[this.targetUserId] || this.targetUserId
    },
    isSelf () {
      return this.targetUserId === this.userid
    },
    displayTitle () {
      if (this.isSelf) {
        return '個人私訊 (自己)'
      }
      return `私訊【${this.targetUserName}】`
    },
    personalList () {
      const msgs = this.messages?.[this.targetUserId] || []
      return this.sortMessages(msgs)
    },
    isValid () {
      return (this.uploadFiles && this.uploadFiles.length > 0) || !this.$utils.empty(this.inputText?.trim()) || this.inputImages.length > 0
    }
  },
  watch: {
    targetUser: {
      immediate: true,
      handler (val) {
        if (val) {
          this.currentTargetUser = val
          if (this.connected) {
            this.fetchPersonalMessages(30)
            this.resetUnread(this.targetUserId)
          }
        }
      }
    },
    targetUserId (newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this.resetUnread(newVal)
        if (this.connected) {
          this.fetchPersonalMessages(30)
        }
      }
    },
    connected: {
      immediate: true,
      handler (val) {
        if (val) {
          this.attachWsListener()
          this.fetchPersonalMessages(30)
        }
      }
    },
    'personalList.length' () {
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
    if (!this.currentTargetUser && this.targetUser) {
      this.currentTargetUser = this.targetUser
    }
    this.attachWsListener()
    if (this.connected && (!this.personalList || this.personalList.length === 0)) {
      this.fetchPersonalMessages(30)
    }
    this.resetUnread(this.targetUserId)
    this.$nextTick(this.scrollToBottom)
  },
  activated () {
    if (this.connected && (!this.personalList || this.personalList.length === 0)) {
      this.fetchPersonalMessages(30)
    }
    this.resetUnread(this.targetUserId)
    this.$nextTick(this.scrollToBottom)
  },
  beforeDestroy () {
    clearTimeout(this.fetchTimer)
    this.detachWsListener()
  },
  methods: {
    setTargetUser (user) {
      this.currentTargetUser = user
      this.refresh()
    },
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
        if (msg?.command === 'previous' && msg.payload?.channel === this.targetUserId) {
          setTimeout(() => {
            this.isFetchingHistory = false
          }, 800)
          if (msg.success) {
            this.notify(`已載入【${this.displayTitle}】較早歷史訊息`, { variant: 'success' })
            this.$nextTick(this.scrollToTop)
          } else {
            this.notify(`【${this.displayTitle}】已無更早的歷史訊息`, { variant: 'warning' })
          }
        }
      }
    },
    fetchPersonalMessages (count = 30) {
      clearTimeout(this.fetchTimer)
      this.fetchTimer = setTimeout(() => {
        const channel = this.targetUserId
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
      const channel = this.targetUserId
      const ws = this.websocket || this.$store?.getters?.websocket
      if (!ws || ws.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理')
        return
      }
      this.isRefreshing = true
      this.$set(this.messages, channel, [])
      this.fetchPersonalMessages(30)
      this.resetUnread(channel)

      setTimeout(() => {
        this.isRefreshing = false
        this.$nextTick(this.scrollToBottom)
        this.notify(`已重新讀取【${this.displayTitle}】最新資料`, { variant: 'success' })
      }, 600)
    },
    getHeadId () {
      const list = this.messages?.[this.targetUserId] || []
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
        this.warning(`【${this.displayTitle}】目前無訊息基準點可向上讀取`)
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
          channel: this.targetUserId,
          headId,
          count: 15
        })
      )
      this.notify(`正在載入【${this.displayTitle}】較早歷史訊息...`, { variant: 'info' })
    },
    pickAttachment () {
      this.$refs.fileInput?.click()
    },
    handleFileChange (e) {
      const files = Array.from(e.target.files || [])
      files.forEach(f => this.uploadFiles.push(f))
      e.target.value = ''
    },
    removeUploadFile (idx) {
      this.uploadFiles.splice(idx, 1)
    },
    send () {
      if (!this.isValid) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通連線未就緒，無法發送訊息')
        return
      }

      const hasFiles = this.uploadFiles.length > 0
      const filesToUpload = hasFiles ? [...this.uploadFiles] : []
      if (hasFiles) {
        this.$store.commit('addPendingAttachmentUpload', {
          channel: this.targetUserId,
          files: filesToUpload
        })
        this.uploadFiles = []
        if (this.empty(this.inputText) && (!this.inputImages || this.inputImages.length === 0)) {
          this.inputText = filesToUpload.map(f => f.name).join(', ')
        }
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
          this.packMessage(markdText, { channel: this.targetUserId })
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
          props: { to: this.targetUserId, modalId: 'messenger-personal-img-modal' },
          on: {
            publish: (b64) => {
              this.sendImage(b64, '上傳圖片', this.targetUserId)
              this.hideModalById('messenger-personal-img-modal')
            }
          }
        }),
        { id: 'messenger-personal-img-modal', size: 'md', title: `附加圖片至【${this.displayTitle}】` }
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
