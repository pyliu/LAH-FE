<template lang="pug">
div(style="position:relative" @paste="pasteImage($event, pasted)")
  .d-flex(v-if="isAnnouncementChannel")
    b-input-group.mr-auto(size="sm" prepend="標題"): b-input(
      v-model="messageTitle"
      placeholder=" ... 必要欄位 ..."
      v-b-tooltip.focus="`輸入 ${$utils.length(messageTitle)} / 92 個字元`"
      :state="titleValid"
    )
    b-input-group.priority.ml-1(size="sm" prepend="緊急程度"): b-select(
      v-model="priority"
      :options="priorityOpts"
    )
  b-input-group(v-if="pickUser" size="sm" prepend="傳給")
    b-select(v-model="toUser" :options="toUsersOpts" :disabled="toMe")
    b-checkbox.my-auto.ml-1(v-model="toMe") 給我自己
  b-textarea.my-2(
    ref="msgTextarea"
    v-model="message"
    debounce="200"
    placeholder="... 訊息內容 ..."
    size="sm"
    rows="5"
    no-resize
    no-auto-shrink
    autofocus
  )
  
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
        @click="send"
        :disabled="notValid"
        :variant="notValid ? 'outline-primary' : 'primary'"
        title="送出"
      ): b-icon(icon="cursor" rotate="45")
      b-button(
        @click="help"
        variant="success"
        title="顯示語法說明"
      ): b-icon(icon="question-circle-fill")
  .d-flex.flex-wrap.align-items-center
    transition-group(name="listY" mode="out-in")
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

  lah-transition(fade): .float-emoji(v-if="emoji" ref="floatEmoji")
    lah-messenger-emoji-pickup(@click="addEmoji")

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
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'
import LahMessengerAnnouncementCard from '~/components/lah-messenger-announcement-card.vue'

export default {
  name: 'LahMessengerMessageInput',
  components: {
    LahMessengerImageUpload,
    LahMessengerAnnouncementCard,
    LahMessengerMessage: () => import('~/components/lah-messenger-message.vue'),
    LahMessengerEmojiPickup,
    LahMessengerHelp
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
    priorityOpts: [
      { text: '最高', value: 0 },
      { text: '高', value: 1 },
      { text: '中', value: 2 },
      { text: '正常', value: 3 }
    ]
  }),
  computed: {
    randFace () { return this.faces[this.$utils._.random(this.faces.length - 1)] },
    titleValid () { return !this.empty(this.messageTitle) && this.$utils.length(this.messageTitle) <= 92 },
    notValid () {
      if (this.isAnnouncementChannel && !this.titleValid) {
        return true
      }
      return this.empty(this.message) && this.empty(this.images)
    },
    toName () { return this.userMap[this.toUser] || this.toUser },
    isAnnouncementChannel () { return this.currentChannel.startsWith('announcement') },
    mergedMessage () {
      const protectedText = this.protectLocalPath(this.message)
      if (this.$utils.empty(this.images)) {
        return protectedText
      }
      const imgMdText = this.images.map((base64, idx) => {
        return `![給${this.toName}${idx}](${base64})`
      }).join('\n')
      return `${protectedText}\n\n***\n\n${imgMdText}`
    },
    replyHeader () {
      if (this.empty(this.reply)) return ''
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
      if (this.connectedUsers && this.connectedUsers.length > 0) {
        this.connectedUsers.forEach(u => {
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
    }
  },
  async created () {
    const userSetting = await this.$localForage.getItem('message-input-realtime')
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
        size: 'xl',
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
        size: 'lg'
      })
    },
    help () {
      this.modal(this.$createElement(LahMessengerHelp), {
        title: '訊息語法說明',
        size: 'xl'
      })
    },
    send () {
      if (this.notValid) return
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('WebSocket 尚未連線，無法發送訊息')
        return
      }

      if (this.isAnnouncementChannel) {
        const announcementPayload = {
          title: this.messageTitle,
          content: this.mergedMessage,
          priority: this.priority,
          sender: this.userid,
          channel: this.currentChannel
        }
        const json = {
          type: 'command',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          channel: 'system',
          message: JSON.stringify({
            command: 'announcement',
            channel: this.currentChannel,
            payload: announcementPayload
          })
        }
        this.websocket.send(JSON.stringify(json))
        this.$emit('sent')
      } else {
        const targetChannel = this.toUser || this.to
        const msgText = `${this.replyHeader}${this.mergedMessage}`
        const json = {
          type: 'mine',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          title: 'dontcare',
          from: this.userip,
          message: msgText,
          channel: targetChannel,
          priority: 2
        }
        this.websocket.send(JSON.stringify(json))
        this.$emit('sent')
      }
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
  top: -160px;
  left: 0;
  width: 100%;
  max-height: 150px;
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 8px;
  padding: 8px;
  z-index: 1050;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
