<template lang="pug">
.lah-messenger-message-input-edit-announcement(style="position: relative" @paste="pasteImage($event, pasted)")
  .d-flex.justify-content-between.align-items-center.pb-2.mb-2.border-bottom
    .d-flex.align-items-center
      lah-fa-icon(:icon="isEdit ? 'edit' : 'bullhorn'" :variant="isEdit ? 'warning' : 'primary'").mr-2
      strong.h6.mb-0 {{ isEdit ? `編輯公告 #${dataJson.id}` : '發布全所公告' }}
      b-badge.ml-2(:variant="isEdit ? 'warning' : 'primary'" pill) {{ isEdit ? '編輯模式' : '新增模式' }}
    .d-flex.align-items-center
      b-button-group(size="sm")
        b-dropdown(
          variant="outline-info"
          size="sm"
          right
          no-caret
          title="快速套用常用公告範本"
        )
          template(#button-content)
            lah-fa-icon(icon="magic").mr-1
            span 範本
          b-dropdown-item(@click="applyTemplate('training')") 🎓 活動/教育訓練
          b-dropdown-item(@click="applyTemplate('maintenance')") 💻 系統維護/停機公告
          b-dropdown-item(@click="applyTemplate('meeting')") 📌 行政/會議通知
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
      //- 1. 緊急程度按鈕組
      .bg-light.p-2.rounded.mb-2.border
        .d-flex.align-items-center.justify-content-between.flex-wrap
          .d-flex.align-items-center.mb-1.mb-md-0
            lah-fa-icon.mr-1(icon="tachometer-alt" variant="info")
            strong.small 緊急程度：
          b-button-group(size="sm")
            b-button(
              v-for="p in priorityButtons"
              :key="p.value"
              :variant="priority === p.value ? p.activeVariant : 'outline-secondary'"
              @click="priority = p.value"
              size="sm"
            ) {{ p.text }}

      //- 2. 標題輸入區
      .mb-2
        .d-flex.justify-content-between.align-items-center.mb-1
          .d-flex.align-items-center
            lah-fa-icon.mr-1(icon="tag" variant="primary")
            strong 標題 #[span.text-danger *]
          b-badge(:variant="titleCharVariant" pill) {{ titleCharCount }} / 84 字元 (約 {{ titleChineseCount }} / 42 中文字)
        b-input-group(size="sm")
          b-input(
            v-model="title"
            :state="titleValid"
            placeholder="例如：🐻❄️⚡【第四梯次】環境教育訓練 ⚡"
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

      //- 7. 附加檔案展示區 (現有與新增)
      .my-2(v-if="existingAttachments.length > 0 || uploadFiles.length > 0")
        .d-flex.align-items-center.mb-1
          lah-fa-icon(icon="paperclip" variant="info").mr-1
          strong.small 附加檔案
        .d-flex.flex-wrap.align-items-center
          b-badge.mr-1.mb-1.p-2(
            v-for="(att, aIdx) in existingAttachments"
            :key="`exist_att_${aIdx}`"
            variant="secondary"
          )
            lah-fa-icon(icon="file").mr-1
            span [已上傳] {{ getAttachmentDisplayName(att.name) }} ({{ formatFileSize(att.size) }})
          b-badge.mr-1.mb-1.p-2(
            v-for="(f, fIdx) in uploadFiles"
            :key="`new_att_${fIdx}`"
            variant="info"
          )
            lah-fa-icon(icon="paperclip").mr-1
            span [即將上傳] {{ f.name }} ({{ formatFileSize(f.size) }})
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
          :icon="isEdit ? 'save' : 'paper-plane'"
          :variant="notValid ? 'outline-primary' : 'primary'"
          :disabled="notValid || isSending"
          :is-busy="isSending"
          @click="send"
        ) {{ isEdit ? '儲存公告' : '發布公告' }} (Ctrl+Enter)

    //- 右側：即時擬真預覽
    div(v-if="realtime" class="col-lg-5 col-12 mt-3 mt-lg-0")
      .sticky-preview-wrapper
        .d-flex.align-items-center.justify-content-between.mb-2
          .font-weight-bold.small
            lah-fa-icon(icon="desktop" variant="success").mr-1
            span 即時擬真預覽
          b-badge(variant="secondary" pill) 擬真卡片
        .preview-card-wrap.p-2.bg-light.rounded.border
          lah-notification-announcement-card(
            :data-json="previewDataJson"
            :show-actions="false"
          )
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerHelp from '~/components/lah-messenger-help.vue'
import LahMessengerImageUpload from '~/components/lah-messenger-image-upload.vue'
import LahNotificationAnnouncementCard from '~/components/lah-notification-announcement-card.vue'

export default {
  name: 'LahMessengerMessageInputEditAnnouncement',
  components: {
    LahMessengerHelp,
    LahMessengerImageUpload,
    LahNotificationAnnouncementCard
  },
  mixins: [lahMessengerBase],
  props: {
    dataJson: { type: Object, default: () => ({}) },
    channel: { type: String, default: 'announcement' }
  },
  data: () => ({
    realtime: true,
    lastFocusedField: 'content',
    title: '',
    content: '',
    priority: 3,
    images: [],
    uploadFiles: [],
    isSending: false,
    priorityButtons: [
      { text: '🟢 正常', value: 3, activeVariant: 'success' },
      { text: '🔵 中等', value: 2, activeVariant: 'info' },
      { text: '🟠 高度', value: 1, activeVariant: 'warning' },
      { text: '🔴 最高', value: 0, activeVariant: 'danger' }
    ],
    commonEmojis: [
      '🐻', '❄️', '⚡', '😎', '🌂', '💙', '📢', '📌', '⚠️', '🚨',
      '💡', '⏰', '📅', '🍱', '☕', '🚌', '👍', '👏', '🎉', '✅',
      '❌', '👉', '🔹', '⭐'
    ],
    titlePrefixes: [
      '【重要公告】', '【活動通知】', '【教育訓練】', '【系統維護】', '【會議通知】'
    ]
  }),
  computed: {
    isEdit () {
      return !this.$utils.empty(this.dataJson?.id) && this.dataJson.id !== 0 && this.dataJson.id !== '?'
    },
    existingAttachments () {
      return Array.isArray(this.dataJson?.attachments) ? this.dataJson.attachments : []
    },
    allPreviewAttachments () {
      return [
        ...this.existingAttachments,
        ...this.uploadFiles.map(f => ({ name: f.name, size: f.size }))
      ]
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
      return !this.$utils.empty(this.title) && this.titleCharCount <= 84
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
    previewDataJson () {
      return {
        id: this.dataJson?.id || '#',
        title: this.title,
        content: this.mergedContent,
        priority: this.priority,
        sender: this.dataJson?.sender || this.userid,
        create_datetime: this.dataJson?.create_datetime || `${this.date()} ${this.time()}`,
        attachments: this.allPreviewAttachments
      }
    }
  },
  created () {
    this.title = this.dataJson?.title || ''
    this.content = this.dataJson?.content || ''
    this.priority = typeof this.dataJson?.priority !== 'undefined' ? parseInt(this.dataJson.priority) : 3
  },
  methods: {
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
          modalId: 'image-upload-modal-announcement'
        },
        on: {
          publish: (b64) => {
            !this.images.includes(b64) && this.images.push(b64)
            this.hideModalById('image-upload-modal-announcement')
          }
        }
      }), {
        id: 'image-upload-modal-announcement',
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
        case 'training':
          this.title = '🐻❄️⚡【第四梯次】環境教育訓練 ⚡'
          this.content = '各位同仁好 😎\n明日為【第四梯次】環境教育訓練，地點為基隆海科館，且本次活動有提供早餐(包子饅頭)。\n\n請參加同仁於<font color="#0056b3"><b>7時45分</b></font>準時於國強一街車道口集合(<font color="#0056b3"><b>8:00準時出發</b></font>)，並請自行攜帶個人用品及雨具🌂\n\n💙另提醒尚未請公假的同仁，記得請公假喔~'
          this.priority = 3
          break
        case 'maintenance':
          this.title = '⚠️【系統維護】伺服器例行維護停機公告'
          this.content = '各位同仁好 📢\n為進行伺服器系統維護作業，預計於下列時段暫停服務：\n- **停機時段**：<font color="#dc3545"><b>本週五 18:00 ～ 21:00</b></font>\n- **影響範圍**：地政便民服務系統、相關查詢作業\n- **注意事項**：請各同仁提早存檔並關閉系統。\n造成不便，敬請見諒！如有問題請洽資訊課。'
          this.priority = 1
          break
        case 'meeting':
          this.title = '📌【會議通知】行政業務研討會議'
          this.content = `各位同仁好 📌\n訂於下列時間召開行政業務研討會議，請準時出席：\n- **時間**：<font color="#0056b3"><b>${this.date()} 09:30</b></font>\n- **地點**：4樓第一會議室\n- **主席**：主任\n- **出列席**：各課室主管及業務承辦同仁\n- **備註**：請攜帶業務報告資料，謝謝配合！`
          this.priority = 2
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
      this.priority = typeof this.dataJson?.priority !== 'undefined' ? parseInt(this.dataJson.priority) : 3
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
      this.$bvModal && this.$bvModal.hide('announcement-modal')
      this.$bvModal && this.$bvModal.hide('message-edit-modal')
    },
    async send () {
      if (this.notValid) {
        return
      }
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通 WebSocket 尚未連線，無法送出公告')
        return
      }
      this.isSending = true
      try {
        if (this.isEdit) {
          const payload = {
            id: this.dataJson.id,
            channel: this.channel,
            title: this.title,
            content: this.mergedContent,
            priority: this.priority
          }
          const json = {
            type: 'command',
            sender: this.userid,
            date: this.date(),
            time: this.time(),
            channel: 'system',
            message: JSON.stringify({
              command: 'edit_message',
              channel: this.channel,
              id: this.dataJson.id,
              payload
            })
          }
          this.websocket.send(JSON.stringify(json))
          if (this.uploadFiles.length > 0) {
            const filesToUpload = [...this.uploadFiles]
            this.uploadFiles = []
            for (const file of filesToUpload) {
              try {
                await this.uploadAttachment(this.channel, this.dataJson.id, file)
                this.notify(`公告 #${this.dataJson.id} 附件 ${file.name} 上傳成功`, { type: 'success' })
              } catch (err) {
                this.$utils.error(`上傳 ${file.name} 失敗`, err)
                this.notify(`公告 #${this.dataJson.id} 附件 ${file.name} 上傳失敗: ${err.message}`, { type: 'danger' })
              }
            }
          }
          this.notify('公告已成功更新', { type: 'success' })
          this.$emit('sent', payload)
        } else {
          // 新增公告模式
          if (this.uploadFiles.length > 0) {
            const filesToUpload = [...this.uploadFiles]
            this.uploadFiles = []
            this.$store.commit('addPendingAttachmentUpload', {
              channel: this.channel,
              files: filesToUpload
            })
          }
          const packet = this.packMessage(this.mergedContent, {
            channel: this.channel || 'announcement',
            title: this.title,
            priority: this.priority
          })
          this.websocket.send(packet)
          this.notify('公告發布成功', { type: 'success' })
          this.$emit('sent', {
            channel: this.channel,
            title: this.title,
            content: this.mergedContent,
            priority: this.priority
          })
        }
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
.lah-messenger-message-input-edit-announcement {
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
