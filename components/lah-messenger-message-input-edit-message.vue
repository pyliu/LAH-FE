<template lang="pug">
div(style="position:relative" @paste="pasteImage($event, pasted)")
  div(v-if="!empty(replyHeader)", v-html="replyHeader")
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
      title="儲存修改 (Ctrl+Enter)"
      style="min-width: 54px;"
    )
      b-icon(icon="cursor" rotate="45" font-scale="1.2")
      span.small.mt-1 儲存

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
        b-button(
          @click="help"
          variant="success"
          title="顯示語法說明"
        ): b-icon(icon="question-circle-fill")

    .d-flex.flex-wrap.align-items-center.my-1(v-if="existingAttachments.length > 0 || uploadFiles.length > 0")
      span.small.text-muted.mr-1(v-if="existingAttachments.length > 0") 現有附件:
      b-badge.mr-1.mb-1.p-1(
        v-for="(att, aIdx) in existingAttachments"
        :key="`exist_att_${aIdx}`"
        variant="secondary"
      )
        b-icon.mr-1(icon="paperclip")
        span {{ getAttachmentDisplayName(att.name) }} ({{ formatFileSize(att.size) }})
      span.small.text-muted.mx-1(v-if="uploadFiles.length > 0") 新增附件:
      b-badge.mr-1.mb-1.p-1(
        v-for="(f, fIdx) in uploadFiles"
        :key="`new_att_${fIdx}`"
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
    uploadFiles: [],
    replyHeader: '',
    replyHeaderPlain: ''
  }),
  computed: {
    existingAttachments () {
      return this.raw?.attachments || (this.raw?.message && typeof this.raw.message === 'object' && this.raw.message.attachments) || []
    },
    cascadeInfo () {
      try {
        return JSON.parse(this.raw?.remove)
      } catch (e) {
        return undefined
      }
    },
    randFace () {
      const count = this.faces.length
      const idx = typeof this.$utils?.rand === 'function'
        ? this.$utils.rand(count)
        : Math.floor(Math.random() * count)
      return this.faces[idx] || '😀'
    },
    notValid () { return this.empty(this.message) && this.empty(this.images) && this.empty(this.uploadFiles) },
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
        size: 'md',
        title: '挑選圖片'
      })
    },
    openPreview () {
      const rendered = this.$utils.convertMarkd(this.mergedMessage)
      const formatted = this.formatMessengerLinks ? this.formatMessengerLinks(rendered) : rendered
      this.modal(this.$createElement('div', {
        domProps: {
          innerHTML: formatted
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
        if (this.uploadFiles.length > 0) {
          const filesToUpload = [...this.uploadFiles]
          this.uploadFiles = []
          filesToUpload.forEach(async (file) => {
            try {
              await this.uploadAttachment(this.raw.channel, this.raw.id, file)
              this.notify(`訊息 #${this.raw.id} 附件 ${file.name} 上傳成功`, { type: 'success' })
            } catch (err) {
              this.$utils.error(`上傳 ${file.name} 失敗`, err)
              this.notify(`訊息 #${this.raw.id} 附件 ${file.name} 上傳失敗`, { type: 'danger' })
            }
          })
        }
        this.$emit('sent', payload)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
