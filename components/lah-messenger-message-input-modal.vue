<template lang="pug">
.lah-messenger-message-input-modal(style="position: relative" @paste="pasteImage($event, pasted)")
  .d-flex.justify-content-between.align-items-center.pb-2.mb-2.border-bottom
    .d-flex.align-items-center
      lah-fa-icon(icon="paper-plane" variant="primary").mr-2
      strong.h6.mb-0 傳送訊息至【{{ targetDisplayName }}】
      b-badge.ml-2(variant="primary" pill) 完整編輯
    .d-flex.align-items-center
      b-button-group(size="sm")
        b-dropdown(
          variant="outline-info"
          size="sm"
          right
          no-caret
          title="快速套用常用訊息範本"
        )
          template(#button-content)
            lah-fa-icon(icon="magic").mr-1
            span 範本
          b-dropdown-item(@click="applyTemplate('work')") 💼 工作聯絡 / 業務回報
          b-dropdown-item(@click="applyTemplate('meeting')") 📌 行政 / 會議提醒
          b-dropdown-item(@click="applyTemplate('issue')") ⚠️ 系統問題 / 異常回報
          b-dropdown-item(@click="applyTemplate('leave')") 🏖️ 請假 / 差勤報備
          b-dropdown-divider
          b-dropdown-item(@click="applyTemplate('empty')") 🧹 清空內文
        lah-button(
          icon="undo-alt"
          variant="outline-secondary"
          size="sm"
          title="重設所有欄位"
          @click="resetFields"
        ) 重設
        lah-button(
          icon="question"
          variant="outline-success"
          size="sm"
          title="語法說明"
          @click="help"
        ) 說明
      b-checkbox.ml-3(v-model="realtime" switch) 即時預覽

  .row
    div(:class="realtime ? 'col-lg-7 col-12' : 'col-12'")
      //- 1. 標題輸入區 (選填)
      .mb-2
        .d-flex.justify-content-between.align-items-center.mb-1
          .d-flex.align-items-center
            lah-fa-icon.mr-1(icon="tag" variant="primary")
            strong 標題
            span.small.text-muted.ml-1 (選填)
          b-badge(:variant="titleCharVariant" pill) {{ titleCharCount }} / 84 字元 (約 {{ titleChineseCount }} / 42 中文字)
        b-input-group(size="sm")
          b-input(
            v-model="title"
            :state="titleValid"
            placeholder="可輸入訊息標題或主旨 (選填)"
            @focus="lastFocusedField = 'title'"
          )
        .d-flex.align-items-center.flex-wrap.mt-1.small
          span.text-muted.mr-1 常用標籤：
          b-badge.cursor-pointer.mr-1.mb-1(
            v-for="tag in titlePrefixes"
            :key="tag"
            variant="light"
            class="border"
            @click="insertTitlePrefix(tag)"
          ) {{ tag }}

      //- 3. Markdown 排版工具列
      .editor-toolbar.d-flex.flex-wrap.align-items-center.p-1.bg-light.rounded-top.border
        b-button-group(size="sm").mr-2.mb-1
          b-button(variant="white" size="sm" @click="insertFormat('**', '**', '粗體文字')" title="粗體")
            strong B
          b-button(variant="white" size="sm" @click="insertFormat('*', '*', '斜體文字')" title="斜體")
            em I
          b-button(variant="white" size="sm" @click="insertBlueText" title="深藍重點")
            span(style="color: #0056b3; font-weight: bold;") 藍字
          b-button(variant="white" size="sm" @click="insertRedText" title="紅色警示")
            span(style="color: #dc3545; font-weight: bold;") 紅字
          b-button(variant="white" size="sm" @click="insertGreenText" title="綠色重點")
            span(style="color: #28a745; font-weight: bold;") 綠字
          b-button(variant="white" size="sm" @click="insertOrangeText" title="橘色提醒")
            span(style="color: #e67e22; font-weight: bold;") 橘字

        b-button-group(size="sm").mr-2.mb-1
          b-button(variant="white" size="sm" @click="insertFormat('### ', '', '標題')" title="標題 H3") H3
          b-button(variant="white" size="sm" @click="insertFormat('- ', '', '清單項目')" title="項目清單")
            lah-fa-icon(icon="list-ul")
          b-button(variant="white" size="sm" @click="insertFormat('1. ', '', '編號項目')" title="編號清單")
            lah-fa-icon(icon="list-ol")
          b-button(variant="white" size="sm" @click="insertFormat('- [ ] ', '', '待辦事項')" title="待辦清單")
            lah-fa-icon(icon="check-square")
          b-button(variant="white" size="sm" @click="insertFormat('> ', '', '引用說明')" title="引用區塊")
            lah-fa-icon(icon="quote-left")
          b-button(variant="white" size="sm" @click="insertDivider" title="分隔線") ―
          b-button(variant="white" size="sm" @click="insertLink" title="超連結")
            lah-fa-icon(icon="link")

        b-button-group(size="sm").mb-1
          b-button(variant="white" size="sm" @click="pickImage" title="附加圖片")
            lah-fa-icon(icon="images" variant="success")
          b-button(variant="white" size="sm" @click="pickAttachment" title="附加檔案")
            lah-fa-icon(icon="paperclip" variant="info")
          input(
            ref="fileInput"
            type="file"
            multiple
            style="display: none"
            @change="handleFileChange"
          )

      //- 4. 常用 Emoji 快捷盤
      .emoji-palette.d-flex.align-items-center.flex-wrap.p-1.bg-white.border-left.border-right
        span.small.text-muted.mr-1.ml-1 常用表情：
        span.emoji-item(
          v-for="emoji in commonEmojis"
          :key="emoji"
          @click="insertEmoji(emoji)"
          :title="`插入 ${emoji}`"
        ) {{ emoji }}

      //- 5. 內文輸入框
      b-textarea.overflow-auto.content-textarea(
        ref="contentInput"
        v-model="content"
        rows="7"
        max-rows="14"
        placeholder="支援 Markdown 與顏色標籤，可直接按 Ctrl + V 貼上截圖，Ctrl + Enter 送出"
        :state="validContent"
        @paste="pasteImage($event, pasted)"
        @focus="lastFocusedField = 'content'"
        @keyup.enter.ctrl="send"
      )

      .d-flex.justify-content-between.align-items-center.mt-1.small
        span.text-muted 提示：支援 #[kbd Ctrl + V] 貼上截圖，#[kbd Ctrl + Enter] 送出
        span.text-muted 內文字數：{{ (content || '').length }} 字

      //- 6. 附加截圖展示區
      .my-2(v-if="images.length > 0")
        .d-flex.align-items-center.mb-1
          lah-fa-icon(icon="images" variant="success").mr-1
          strong.small 附加截圖 ({{ images.length }} 張，點擊可刪除)
        .d-flex.flex-wrap.align-items-center
          transition-group(name="listY" mode="out-in")
            b-img.memento.m-1(
              v-for="(b64, idx) in images"
              :key="`imgAtt_${idx}`"
              :src="b64"
              @click="removeImage(b64)"
              thumbnail
              fluid
              v-b-tooltip="'點擊刪除這張圖片'"
              style="width: 100px; height: 70px; object-fit: cover;"
            )

      //- 7. 附加檔案展示區
      .my-2(v-if="uploadFiles.length > 0")
        .d-flex.align-items-center.mb-1
          lah-fa-icon(icon="paperclip" variant="info").mr-1
          strong.small 待上傳附件 ({{ uploadFiles.length }} 個)
        .d-flex.flex-wrap.align-items-center
          b-badge.mr-1.mb-1.p-2(
            v-for="(f, fIdx) in uploadFiles"
            :key="`new_att_${fIdx}`"
            variant="info"
          )
            lah-fa-icon(icon="paperclip").mr-1
            span {{ f.name }} ({{ formatFileSize(f.size) }})
            b-icon.ml-2(icon="x-circle" style="cursor: pointer;" @click="removeUploadFile(fIdx)")

      //- 8. 動作按鈕列
      .d-flex.justify-content-end.align-items-center.mt-3.pt-2.border-top
        b-button(
          variant="outline-secondary"
          size="sm"
          class="mr-2"
          @click="cancel"
        ) 取消
        lah-button(
          icon="paper-plane"
          :variant="notValid ? 'outline-primary' : 'primary'"
          :disabled="notValid || isSending"
          :is-busy="isSending"
          @click="send"
        ) 傳送訊息 (Ctrl+Enter)

    //- 右側：即時擬真預覽
    div(v-if="realtime" class="col-lg-5 col-12 mt-3 mt-lg-0")
      .sticky-preview-wrapper
        .d-flex.align-items-center.justify-content-between.mb-2
          .font-weight-bold.small
            lah-fa-icon(icon="desktop" variant="success").mr-1
            span 即時擬真預覽
          b-badge(variant="secondary" pill) 訊息泡泡
        .preview-card-wrap.p-2.bg-light.rounded.border
          lah-messenger-message(
            :raw="previewMessageJson"
            :preview="true"
          )
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'

export default {
  name: 'LahMessengerMessageInputModal',
  components: {
    LahMessengerHelp,
    LahMessengerImageUpload,
    LahMessengerMessage: () => import('~/components/lah-messenger-message.vue')
  },
  mixins: [lahMessengerBase],
  props: {
    dataJson: { type: Object, default: () => ({}) },
    channel: { type: String, required: true },
    channelName: { type: String, default: '' },
    targetName: { type: String, default: '' }
  },
  data: () => ({
    realtime: true,
    lastFocusedField: 'content',
    title: '',
    content: '',
    priority: 2,
    images: [],
    uploadFiles: [],
    isSending: false,
    commonEmojis: [
      '😀', '😁', '😂', '😃', '😄', '😅', '😆', '👍', '👌', '🙏',
      '🐻', '❄️', '⚡', '😎', '🌂', '💙', '📢', '📌', '⚠️', '🚨',
      '💡', '⏰', '📅', '🍱', '☕', '🚌', '👏', '🎉', '✅', '❌'
    ],
    titlePrefixes: [
      '【公事聯絡】', '【業務回報】', '【問題請教】', '【系統問題】', '【請假報備】', '【緊急通知】'
    ]
  }),
  computed: {
    targetDisplayName () {
      if (this.channelName) { return this.channelName }
      if (this.targetName) { return this.targetName }
      if (this.channel === 'lds') { return '全事務所' }
      if (this.userMap && this.userMap[this.channel]) { return this.userMap[this.channel] }
      return this.channel
    },
    titleCharCount () {
      return this.$utils.length(this.title || '')
    },
    titleChineseCount () {
      return Math.ceil(this.titleCharCount / 2)
    },
    titleCharVariant () {
      if (this.titleCharCount > 84) { return 'danger' }
      if (this.titleCharCount >= 70) { return 'warning' }
      return 'secondary'
    },
    titleValid () {
      return this.$utils.empty(this.title) || this.titleCharCount <= 84
    },
    validContent () {
      return !this.$utils.empty(this.content) || this.images.length > 0 || this.uploadFiles.length > 0
    },
    notValid () {
      return !this.titleValid || !this.validContent
    },
    mergedContent () {
      let c = this.content || ''
      if (this.images.length > 0) {
        const notIncluded = this.images.filter(img => !c.includes(img))
        if (notIncluded.length > 0) {
          const imgMd = notIncluded.map((img, idx) => `![附加截圖-${idx + 1}](${img})`).join('\n\n')
          c = c ? `${c}\n\n${imgMd}` : imgMd
        }
      }
      return c
    },
    fullMessageText () {
      if (this.title && !this.mergedContent.includes(this.title)) {
        return `### ${this.title}\n\n${this.mergedContent}`
      }
      return this.mergedContent
    },
    allPreviewAttachments () {
      return this.uploadFiles.map(f => ({ name: f.name, size: f.size }))
    },
    previewMessageJson () {
      return {
        id: 0,
        channel: this.channel,
        date: this.date(),
        time: this.time(),
        message: this.fullMessageText,
        prepend: false,
        sender: this.userid,
        type: 'mine',
        attachments: this.allPreviewAttachments
      }
    }
  },
  watch: {
    realtime (val) {
      this.updateModalSize(val)
    }
  },
  created () {
    this.title = this.dataJson?.title || ''
    this.content = this.dataJson?.content || ''
    if (Array.isArray(this.dataJson?.images)) {
      this.images = [...this.dataJson.images]
    }
    if (Array.isArray(this.dataJson?.uploadFiles)) {
      this.uploadFiles = [...this.dataJson.uploadFiles]
    }
  },
  mounted () {
    this.updateModalSize(this.realtime)
  },
  methods: {
    updateModalSize (isRealtime) {
      this.$nextTick(() => {
        let dialog = this.$el?.closest ? this.$el.closest('.modal-dialog') : null
        if (!dialog && this.$el) {
          let parent = this.$el.parentElement
          while (parent) {
            if (parent.classList && parent.classList.contains('modal-dialog')) {
              dialog = parent
              break
            }
            parent = parent.parentElement
          }
        }
        if (!dialog) {
          dialog = document.querySelector('#message-input-modal .modal-dialog') ||
                   document.querySelector('.modal.show .modal-dialog')
        }
        if (dialog) {
          if (isRealtime) {
            dialog.classList.remove('modal-lg')
            dialog.classList.add('modal-xl')
          } else {
            dialog.classList.remove('modal-xl')
            dialog.classList.add('modal-lg')
          }
        }
      })
    },
    insertTitlePrefix (prefix) {
      if (!this.title) {
        this.title = prefix
      } else if (!this.title.startsWith(prefix)) {
        this.title = `${prefix} ${this.title.replace(/^【.*?】\s*/, '')}`
      }
    },
    insertFormat (prefix, suffix = '', defaultText = '') {
      const textarea = this.$refs.contentInput?.$el || this.$refs.contentInput
      if (!textarea) {
        this.content += `${prefix}${defaultText}${suffix}`
        return
      }
      const start = textarea.selectionStart || 0
      const end = textarea.selectionEnd || 0
      const oldText = this.content || ''
      const selected = oldText.substring(start, end)
      const replaceText = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`
      this.content = oldText.substring(0, start) + replaceText + oldText.substring(end)
      this.$nextTick(() => {
        textarea.focus()
        const newCursor = selected ? start + replaceText.length : start + prefix.length
        textarea.setSelectionRange(newCursor, newCursor + (selected ? 0 : defaultText.length))
      })
    },
    insertBlueText () {
      this.insertFormat('<font color="#0056b3"><b>', '</b></font>', '深藍色重點')
    },
    insertRedText () {
      this.insertFormat('<font color="#dc3545"><b>', '</b></font>', '紅色警示')
    },
    insertGreenText () {
      this.insertFormat('<font color="#28a745"><b>', '</b></font>', '綠色重點')
    },
    insertOrangeText () {
      this.insertFormat('<font color="#e67e22"><b>', '</b></font>', '橘色提醒')
    },
    insertDivider () {
      this.insertFormat('\n---\n', '', '')
    },
    insertLink () {
      this.insertFormat('[連結名稱](', ')', 'https://')
    },
    insertEmoji (emoji) {
      if (this.lastFocusedField === 'title') {
        this.title = (this.title || '') + emoji
      } else {
        this.insertFormat(emoji, '', '')
      }
    },
    pasted (base64) {
      if (!this.images.includes(base64)) {
        this.images.push(base64)
      }
    },
    removeImage (base64data) {
      const index = this.images.indexOf(base64data)
      if (index > -1) {
        this.images.splice(index, 1)
      }
    },
    pickImage () {
      this.modal(this.$createElement(LahMessengerImageUpload, {
        props: {
          to: this.channel,
          modalId: 'image-upload-modal-full'
        },
        on: {
          publish: (b64) => {
            !this.images.includes(b64) && this.images.push(b64)
            this.hideModalById('image-upload-modal-full')
          }
        }
      }), {
        id: 'image-upload-modal-full',
        size: 'md',
        title: '挑選圖片'
      })
    },
    pickAttachment () {
      this.$refs.fileInput?.click()
    },
    handleFileChange (e) {
      const files = Array.from(e.target.files || [])
      if (!files.length) { return }
      files.forEach((f) => {
        if (!this.uploadFiles.some(item => item.name === f.name && item.size === f.size)) {
          this.uploadFiles.push(f)
        }
      })
      e.target.value = ''
    },
    removeUploadFile (idx) {
      this.uploadFiles.splice(idx, 1)
    },
    applyTemplate (type) {
      switch (type) {
        case 'work':
          this.title = '【工作回報】業務處理進度'
          this.content = '各位同仁好 💼\n今日相關業務進度回報如下：\n- **辦理項目**：\n- **目前進度**：<font color="#0056b3"><b>已完成</b></font>\n- **後續配合事項**：請承辦同仁撥空檢視，謝謝！'
          break
        case 'meeting':
          this.title = '【會議提醒】業務研討會議'
          this.content = `各位同仁好 📌\n提醒今日會議時間與地點：\n- **時間**：<font color="#0056b3"><b>${this.date()} 09:30</b></font>\n- **地點**：會議室\n- **備註**：請準時與會，謝謝！`
          break
        case 'issue':
          this.title = '【系統問題】操作異常回報'
          this.content = `資訊課同仁您好 ⚠️\n目前系統操作發生異常，情況如下：\n- **系統名稱**：\n- **問題描述**：\n- **發生時間**：${this.time()}\n請協助確認，謝謝！`
          break
        case 'leave':
          this.title = '【差勤報備】公出 / 請假通知'
          this.content = '各位同仁好 🏖️\n今日因公外出/請假事由如下：\n- **差勤類別**：\n- **起訖時間**：\n- **職務代理人**：\n如有緊急事務請聯繫代理人，謝謝！'
          break
        case 'empty':
          this.content = ''
          this.images = []
          break
      }
    },
    resetFields () {
      this.title = this.dataJson?.title || ''
      this.content = this.dataJson?.content || ''
      this.images = []
      this.uploadFiles = []
    },
    help () {
      this.modal(this.$createElement(LahMessengerHelp), {
        title: '即時通功能與語法說明',
        size: 'lg'
      })
    },
    cancel () {
      this.$emit('cancel')
      this.$bvModal && this.$bvModal.hide('message-input-modal')
    },
    send () {
      if (this.notValid) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通 WebSocket 尚未連線，無法送出訊息')
        return
      }
      this.isSending = true
      try {
        if (this.uploadFiles.length > 0) {
          const filesToUpload = [...this.uploadFiles]
          this.uploadFiles = []
          this.$store.commit('addPendingAttachmentUpload', {
            channel: this.channel,
            files: filesToUpload
          })
        }
        const packet = this.packMessage(this.fullMessageText, {
          channel: this.channel,
          title: this.title || 'dontcare',
          priority: this.priority
        })
        this.websocket.send(packet)
        this.notify('訊息傳送成功', { type: 'success' })
        this.$emit('sent', {
          channel: this.channel,
          title: this.title,
          content: this.fullMessageText,
          priority: this.priority
        })
        this.$bvModal && this.$bvModal.hide('message-input-modal')
      } catch (e) {
        this.alert(e.message)
      } finally {
        this.isSending = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-messenger-message-input-modal {
  .content-textarea {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .editor-toolbar {
    border-bottom: 0;
    button {
      padding: 2px 7px;
    }
  }

  .emoji-palette {
    border-bottom: 1px solid #e2e8f0;
    padding: 3px 6px;
    max-height: 68px;
    overflow-y: auto;

    .emoji-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      padding: 1px 4px;
      cursor: pointer;
      border-radius: 4px;
      user-select: none;
      transition: transform 0.15s ease, background-color 0.15s ease;

      &:hover {
        transform: scale(1.25);
        background-color: #e9ecef;
      }
    }
  }

  .sticky-preview-wrapper {
    position: sticky;
    top: 10px;
  }

  .preview-card-wrap {
    min-height: 200px;
    overflow-y: auto;
    max-height: 520px;
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
}
</style>
