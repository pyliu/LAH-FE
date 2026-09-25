<template lang="pug">
div(style="position:relative" @paste="pasteImage($event, pasted)")
  div(v-if="!empty(replyHeader)", v-html="replyHeader")
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

  lah-transition: .d-flex.justify-content-between.p-1.preview.mt-2(v-if="realtime && !empty(mergedMessage)" ref="preview")
    span.text-white.font-weight-bold 編輯預覽
    lah-messenger-message.mr-2.my-message(:raw="messageJson", :preview="true")

</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahMessengerEmojiPickup from '~/components/lah-messenger-emoji-pickup.vue'

export default {
  name: 'LahMessengerMessageInputEditMessage',
  components: {
    LahMessengerImageUpload,
    LahMessengerEmojiPickup,
    LahMessengerMessage: () => import('~/components/lah-messenger-message.vue'),
    LahMessengerHelp
  },
  mixins: [lahMessengerBase],
  props: {
    raw: { type: Object, required: true }
  },
  data: () => ({
    realtime: true,
    emoji: false,
    faces: ['😀', '😁', '😂', '😃', '😅', '😆', '👍', '👌'],
    message: '',
    images: [],
    replyHeader: '',
    replyHeaderPlain: ''
  }),
  computed: {
    cascadeInfo () {
      try {
        return JSON.parse(this.raw?.remove)
      } catch (e) {
        return undefined
      }
    },
    randFace () { return this.faces[this.$utils._.random(this.faces.length - 1)] },
    notValid () { return this.empty(this.message) && this.empty(this.images) },
    mergedMessage () {
      const protectedText = this.protectLocalPath(this.message)
      if (this.$utils.empty(this.images)) {
        return protectedText
      }
      const imgMdText = this.images.map((base64, idx) => {
        return `![編輯訊息-${idx}](${base64})`
      }).join('\n')
      return `${protectedText}\n\n***\n\n${imgMdText}`
    },
    messageJson () {
      return {
        id: this.raw.id,
        channel: this.raw.channel,
        date: this.date(),
        time: this.time(),
        message: `${this.replyHeader ? this.replyHeader + '\n' : ''}${this.mergedMessage}`,
        prepend: false,
        sender: this.userid,
        type: 'mine'
      }
    }
  },
  created () {
    const rawMsg = this.raw?.message || ''
    const regex = typeof this.regexpReplyHeader === 'function' ? this.regexpReplyHeader() : this.regexpReplyHeader
    const matched = regex ? rawMsg.match(regex) : null
    if (matched) {
      this.replyHeader = matched[0]
      this.message = rawMsg.replace(regex, '').trim()
    } else {
      this.message = rawMsg.trim()
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
          to: this.raw.channel,
          modalId: 'image-upload-modal-edit'
        },
        on: {
          publish: (b64) => {
            !this.images.includes(b64) && this.images.push(b64)
            this.hideModalById('image-upload-modal-edit')
          }
        }
      }), {
        id: 'image-upload-modal-edit',
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
      const payload = {
        id: this.raw.id,
        channel: this.raw.channel,
        message: `${this.replyHeader ? this.replyHeader + '\n' : ''}${this.mergedMessage}`
      }
      const json = {
        type: 'command',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        channel: 'system',
        message: JSON.stringify({
          command: 'edit_message',
          channel: this.raw.channel,
          id: this.raw.id,
          payload,
          cascade: this.cascadeInfo
        })
      }
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(JSON.stringify(json))
        this.$emit('sent', payload)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
