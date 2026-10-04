<template lang="pug">
div(style="position:relative" @paste="pasteImage($event, pasted)")
  .d-flex(v-if="isAnnouncementChannel")
    b-input-group.mr-auto(size="sm" prepend="標題"): b-input(
      v-model="messageTitle"
      placeholder=" ... 必要欄位 ..."
      v-b-tooltip.focus="`輸入 ${$utils && $utils.length ? $utils.length(messageTitle) : (messageTitle ? messageTitle.length : 0)} / 92 個字元`"
      :state="titleValid"
    )
    b-input-group.priority.ml-1(size="sm" prepend="緊急程度"): b-select(
      v-model="priority"
      :options="priorityOpts"
    )
  b-input-group(v-if="pickUser" size="sm" prepend="傳給")
    b-select(v-model="toUser" :options="toUsersOpts" :disabled="toMe")
    b-checkbox.my-auto.ml-1(v-model="toMe") 給我自己
  b-input-group.my-2(size="sm")
    b-textarea(
      ref="msgTextarea"
      v-model="message"
      debounce="200"
      placeholder="... 訊息內容 ..."
      size="sm"
      rows="5"
      no-resize
      no-auto-shrink
      autofocus
      @keyup.enter.ctrl="send"
    )
    b-button.ml-1.d-flex.flex-column.align-items-center.justify-content-center(
      @click="send"
      :disabled="notValid"
      :variant="notValid ? 'outline-primary' : 'primary'"
      title="送出 (Ctrl+Enter)"
      style="min-width: 54px;"
    )
      b-icon(icon="cursor" rotate="45" font-scale="1.2")
      span.small.mt-1 送出

  .position-relative.my-2
    .d-flex.align-items-center
      b-checkbox(v-model="realtime" switch v-if="!emoji") 預覽
      div.mr-auto
      b-button-group.mr-1(size="sm")
        b-button.mr-1(
          v-if="!realtime"
          variant="outline-secondary"
          title="👀 預覽"
          @click="openPreview"
        ): b-icon(icon="eye")
        b-button.mr-1(@click="emoji = !emoji" variant="outline-secondary" :title="`挑選表情 ${randFace}`") #[span.h5 {{ randFace }}]
        b-button.mr-1(
          @click="pick"
          variant="outline-success"
          title="附加圖片"
        ): b-icon(icon="images")
        b-button.mr-1(
          @click="pickAttachment"
          variant="outline-info"
          title="附加檔案"
        ): b-icon(icon="paperclip")
        input(
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="handleFileChange"
        )
        b-button.mr-1(
          @click="openFullEditor"
          variant="outline-primary"
          title="開啟完整編輯視窗"
        ): b-icon(icon="pencil-square")
        b-button(
          @click="help"
          variant="success"
          title="顯示語法說明"
        ): b-icon(icon="question-circle-fill")

    .d-flex.flex-wrap.align-items-center.my-1(v-if="uploadFiles.length > 0")
      span.small.text-muted.mr-1 附件 ({{ uploadFiles.length }}):
      b-badge.mr-1.mb-1.p-1(
        v-for="(f, fIdx) in uploadFiles"
        :key="`input_att_${fIdx}`"
        variant="info"
      )
        b-icon.mr-1(icon="paperclip")
        span {{ f.name }} ({{ formatFileSize(f.size) }})
        b-icon.ml-1(icon="x-circle" style="cursor: pointer;" @click="removeUploadFile(fIdx)")

    lah-transition(fade): .float-emoji(v-if="emoji" ref="floatEmoji")
      .d-flex.justify-content-between.align-items-center.px-1.mb-1.border-bottom.pb-1
        span.small.text-muted 點選表情插入訊息
        b-button(variant="link" size="sm" class="p-0 text-muted" @click="emoji = false" title="關閉")
          b-icon(icon="x" font-scale="1.2")
      lah-messenger-emoji-pickup(@click="addEmoji")

  .d-flex.flex-wrap.align-items-center
    transition-group(name="listY" tag="div")
      b-img.memento.m-1(
        v-for="(base64data, idx) in images"
        :key="`imgAttached_${idx}`"
        :src="base64data"
        @click="remove(base64data)"
        thumbnail
        fluid
        v-b-tooltip="'刪除這張圖片'"
        style="width: 138.5px"
      )

  lah-transition(v-if="realtime"): .d-flex.justify-content-between.p-1.preview.mt-2(v-if="!empty(mergedMessage)" ref="preview")
    span.text-white.font-weight-bold(v-if="isAnnouncementChannel") 預覽
    span.text-white.font-weight-bold(v-else) 將傳給 {{ this.userMap[this.toUser] || this.toUser }}
    lah-messenger-announcement-card(
      v-if="isAnnouncementChannel"
      :data-json="announcementJson"
      :channel="to"
      :preview="true"
    )
    lah-messenger-message.mr-2.my-message(
      v-else
      :raw="messageJson"
      :preview="true"
    )

</template>

<script>
import Vue from 'vue'
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerAnnouncementCard from '~/components/lah-messenger-announcement-card.vue'
import LahMessengerMessageInputModal from '~/components/lah-messenger-message-input-modal.vue'

export default {
  name: 'LahMessengerMessageInput',
  components: {
    LahMessengerImageUpload,
    LahMessengerAnnouncementCard,
    LahMessengerMessage: () => import('~/components/lah-messenger-message.vue'),
    LahMessengerEmojiPickup,
    LahMessengerHelp,
    LahMessengerMessageInputModal
  },
  mixins: [lahMessengerBase],
  props: {
    to: { type: String, required: true },
    text: { type: String, default: '' },
    reply: { type: String, default: '' },
    pickUser: { type: Boolean, default: false }
  },
  data: () => ({
    toMe: false,
    toUser: '',
    realtime: true,
    emoji: false,
    faces: ['😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉', '😊', '😋', '😌', '😍', '😎', '😏', '😐', '😑', '😒', '😓', '😔', '😕', '😖', '😗', '😘', '😙', '😚', '😛', '😜', '😝', '😞', '😟', '😡', '😢', '😣', '😤', '😥', '😦', '😧', '😨', '😩', '😪', '😫', '😬', '😭', '😮', '😯', '😰', '😱', '😲', '😳', '😴', '😵', '😶', '😷', '👍', '👌'],
    messageTitle: '',
    priority: 3,
    message: '',
    images: [],
    uploadFiles: [],
    priorityOpts: [
      { text: '最高', value: 0 },
      { text: '高', value: 1 },
      { text: '中', value: 2 },
      { text: '正常', value: 3 }
    ]
  }),
  computed: {
    randFace () {
      const count = this.faces.length
      const idx = typeof this.$utils?.rand === 'function'
        ? this.$utils.rand(count)
        : Math.floor(Math.random() * count)
      return this.faces[idx] || '😀'
    },
    titleValid () {
      const len = this.$utils?.length ? this.$utils.length(this.messageTitle) : (this.messageTitle?.length || 0)
      return !this.empty(this.messageTitle) && len <= 92
    },
    notValid () {
      if (this.isAnnouncementChannel && !this.titleValid) {
        return true
      }
      return this.empty(this.message) && this.empty(this.images) && this.empty(this.uploadFiles)
    },
    toName () { return this.userMap[this.toUser] || this.toUser },
    isAnnouncementChannel () {
      return (this.to ? this.to.startsWith('announcement') : this.currentChannel.startsWith('announcement'))
    },
    mergedMessage () {
      const protectedText = this.protectLocalPath(this.message)
      if (this.empty(this.images)) {
        return protectedText
      }
      const imgMdText = this.images.map((base64, idx) => {
        return `![給${this.toName}${idx}](${base64})`
      }).join('\n')
      return `${protectedText}\n\n***\n\n${imgMdText}`
    },
    replyHeader () {
      if (this.empty(this.reply)) {
        return ''
      }
      return `給 <span class="b-avatar-img"><img src="${this.apiQueryUrl}/get_user_img.php?id=${this.toUser}_avatar&name=${this.toName}_avatar" alt="avatar" class="avatar mt-n1"></span> ${this.toName} 的訊息\n> ${this.reply}\n\n***\n`
    },
    messageJson () {
      return {
        id: 0,
        channel: this.to,
        date: this.date(),
        time: this.time(),
        message: `${this.replyHeader}${this.mergedMessage}`,
        prepend: false,
        sender: this.userid,
        type: 'mine'
      }
    },
    announcementJson () {
      return {
        id: 0,
        title: this.messageTitle,
        content: this.mergedMessage,
        priority: this.priority,
        sender: this.userid,
        create_datetime: `${this.date()} ${this.time()}`
      }
    },
    toUsersOpts () {
      const opts = [{ value: '', text: '選擇同仁' }]
      if (this.uniqueConnectedUsers && this.uniqueConnectedUsers.length > 0) {
        this.uniqueConnectedUsers.forEach((u) => {
          if (u.userid !== this.userid) {
            opts.push({
              value: u.userid,
              text: `${u.username || this.userMap[u.userid] || u.userid} (${u.userid})`
            })
          }
        })
      }
      return opts
    }
  },
  watch: {
    toMe (flag) {
      if (flag) {
        this.toUser = this.userid
      }
    },
    realtime (flag) {
      const storage = this.$localForage || this.$localforage || Vue?.$localforage
      if (storage && typeof storage.setItem === 'function') {
        storage.setItem('message-input-realtime', flag).catch(err => console.warn(err))
      }
    }
  },
  async created () {
    const storage = this.$localForage || this.$localforage || Vue?.$localforage
    let userSetting = true
    if (storage && typeof storage.getItem === 'function') {
      try {
        const cached = await storage.getItem('message-input-realtime')
        if (cached !== null && cached !== undefined) {
          userSetting = cached
        }
      } catch (err) {
        console.warn('讀取 message-input-realtime 快取失敗', err)
      }
    }
    this.realtime = userSetting !== false
    this.toUser = this.userMap[this.to] ? this.to : (this.to || this.userid)
    if (!this.empty(this.text)) {
      this.message = this.text
    }
  },
  methods: {
    pasted (base64) {
      if (!this.images.includes(base64)) {
        this.images.push(base64)
      }
    },
    remove (base64data) {
      const index = this.images.indexOf(base64data)
      if (index > -1) {
        this.images.splice(index, 1)
      }
    },
    addEmoji (emoji) {
      this.emoji = false
      const element = this.$refs.msgTextarea?.$el || this.$refs.msgTextarea
      if (element && element.selectionStart !== undefined) {
        const appended = this.message.substring(0, element.selectionStart).trim() + ' ' + emoji + ' '
        this.message = appended + this.message.substring(element.selectionEnd, this.message.length).trim()
        this.$nextTick(() => {
          element.focus()
          element.selectionEnd = appended.length
        })
      } else {
        this.message = this.message + ' ' + emoji
      }
    },
    pick () {
      this.modal(this.$createElement(LahMessengerImageUpload, {
        props: {
          to: this.toUser || this.to,
          modalId: 'image-upload-modal-input'
        },
        on: {
          publish: (b64) => {
            !this.images.includes(b64) && this.images.push(b64)
            this.hideModalById('image-upload-modal-input')
          }
        }
      }), {
        id: 'image-upload-modal-input',
        size: 'md',
        title: '挑選圖片'
      })
    },
    openPreview () {
      this.modal(this.$createElement('div', {
        domProps: {
          innerHTML: this.$utils.convertMarkd(this.mergedMessage)
        }
      }), {
        title: '預覽',
        size: 'md'
      })
    },
    help () {
      this.modal(this.$createElement(LahMessengerHelp), {
        title: '即時通功能與語法說明',
        size: 'lg'
      })
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
      if (this.notValid) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('WebSocket 尚未連線，無法發送訊息')
        return
      }

      const targetChannel = this.isAnnouncementChannel ? (this.to || this.currentChannel || 'announcement') : (this.toUser || this.to)
      if (this.uploadFiles.length > 0) {
        const filesToUpload = [...this.uploadFiles]
        this.uploadFiles = []
        this.$store.commit('addPendingAttachmentUpload', {
          channel: targetChannel,
          files: filesToUpload
        })
        if (this.empty(this.message) && this.empty(this.images)) {
          this.message = filesToUpload.map(f => f.name).join(', ')
        }
      }

      if (this.isAnnouncementChannel) {
        this.websocket.send(this.packMessage(this.mergedMessage, {
          channel: targetChannel,
          title: this.messageTitle,
          priority: this.priority
        }))
        this.message = ''
        this.messageTitle = ''
        this.images = []
        this.$emit('sent')
      } else {
        const msgText = `${this.replyHeader}${this.mergedMessage}`
        this.websocket.send(this.packMessage(msgText, {
          channel: targetChannel,
          title: 'dontcare',
          priority: 2
        }))
        this.message = ''
        this.images = []
        this.$emit('sent')
      }
    },
    openFullEditor () {
      const targetChannel = this.isAnnouncementChannel
        ? (this.to || this.currentChannel || 'announcement')
        : (this.toUser || this.to)
      const targetTitle = this.isAnnouncementChannel
        ? '全所公告'
        : (this.userMap[this.toUser] || this.toUser || this.to)

      this.modal(this.$createElement(LahMessengerMessageInputModal, {
        props: {
          channel: targetChannel,
          channelName: targetTitle,
          dataJson: {
            title: this.messageTitle,
            content: this.message,
            images: [...this.images],
            uploadFiles: [...this.uploadFiles],
            priority: this.priority
          }
        },
        on: {
          sent: () => {
            this.message = ''
            this.messageTitle = ''
            this.images = []
            this.uploadFiles = []
            this.hideModalById('message-input-modal')
            this.$emit('sent')
          },
          cancel: () => {
            this.hideModalById('message-input-modal')
          }
        }
      }), {
        id: 'message-input-modal',
        size: 'xl',
        title: `完整編輯視窗 - 【${targetTitle}】`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.priority {
  max-width: 175px;
}
.float-emoji {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-height: 160px;
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 8px;
  z-index: 1050;
  box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.18);
}
.preview {
  border-radius: 8px;
  background-color: #6c757d;
  box-shadow: 0 -3px 10px rgba(0,0,0,0.2);
}
.memento {
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
}
</style>
