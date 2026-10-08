<template lang="pug">
.mb-1
  //- 如果訊息日期與前一則不同，顯示日期分隔列
  .d-flex.msg-item.justify-content-center.system.date(
    v-if="!preview && showMdate && id > 0"
  ): p(v-html="'📅 ' + mdate")

  //- 顯示發送者資訊
  .s-75.font-weight-bold.align-middle(
    v-if="!myMessage && !system"
    @click="remoteAvatarClick($event)"
    :style="{ cursor: 'pointer' }"
    title="顯示使用者卡片"
  )
    b-avatar.my-auto.mr-1(
      v-if="['remote'].includes(type) || isAnnouncement"
      :src="isAnnouncement ? '/tyland.jpg' : this.avatarSrc"
      size="1.25rem"
      button
    )
    span.mr-1 {{ sender }} 💬
    em {{ from }}

  //- 私訊對象提示
  .d-flex.justify-content-end(v-if="messageTo")
    .s-75.font-weight-bold.align-middle(
      :style="{ cursor: 'pointer' }"
      :title="`訊息送給${messageTo.name}`"
      @click="mineAvatarClick($event)"
    )
      span.mr-1 📧 {{ messageTo.name }}
      b-avatar.my-auto(
        v-if="['remote'].includes(type) || isAnnouncement"
        :src="this.messageToavatarSrc"
        size="1.25rem"
        button
      )

  //- 訊息主體
  .d-flex.msg-item.my-1(
    :class="classes"
    style="min-height: 36px"
  )
    //- 公告卡片
    lah-messenger-announcement-card.w-100(
      v-if="isAnnouncement"
      :data-json="announcementPayload"
      :raw-attachments="attachments"
      :channel="channel"
      :message-id="id"
      :class="isToday ? 'today-card' : ''"
    )

    //- 遠端或系統文字訊息
    .d-flex.flex-column.align-items-start(v-else-if="!myMessage" style="max-width: 85%;")
      p.message-bubble(ref="remoteMessage" v-html="message" @click="handleSpecialClick($event)" style="max-width: 100%;")
      .attachments.d-flex.flex-wrap.align-items-center.mt-1(v-if="attachments.length > 0")
        b-button.mr-1.mb-1.p-1.text-left(
          v-for="(att, aIdx) in attachments"
          :key="`att_${id}_${aIdx}`"
          size="sm"
          variant="outline-secondary"
          @click="downloadAttachment(channel, id, att.name)"
          :title="`點擊下載：${getAttachmentDisplayName(att.name)} (${formatFileSize(att.size)})`"
        )
          b-icon.mr-1(icon="paperclip")
          span.small.text-truncate(style="max-width: 160px; display: inline-block; vertical-align: middle;") {{ getAttachmentDisplayName(att.name) }}
          b-badge.ml-1(variant="light") {{ formatFileSize(att.size) }}

    //- 狀態、時間與操作按鈕
    .time.s-60.mx-1.text-muted.text-right(
      v-if="!system && !isAnnouncement"
      :class="myMessage ? ['mb-n1'] : []"
    )
      .d-flex.align-items-center.justify-content-end(v-if="!preview")
        b-icon.clickableIcon(
          v-if="isAdmin || messageRemovable"
          icon="x-circle"
          variant="danger"
          title="移除訊息"
          scale="1.5"
          @click="remove"
        )
        b-icon.align-middle.clickableIcon.mx-2(
          v-if="isAdmin || (myMessage && messageRemovable)"
          icon="pencil-fill"
          variant="primary"
          title="編輯"
          scale="1.5"
          @click="edit"
        )
        b-icon.clickableIcon(
          v-if="!isAnnouncement && !myMessage && userMap[senderId]"
          icon="reply-fill"
          title="回覆此訊息"
          font-scale="1.5"
          @click="isMyChannel ? reply() : emitReply()"
        )
      //- 今日與時間
      .d-flex.align-items-center.justify-content-end.flex-nowrap
        b-icon.align-middle.readIcon(
          v-if="isRead && myMessage"
          icon="check-all"
          :variant="myMessage ? 'secondary' : 'light'"
          title="已讀取"
        )
        .d-flex.align-items-center.flex-nowrap
          span.mr-1.text-primary.font-weight-bold(v-if="isToday && !preview", style="white-space: nowrap") [今日]
          div(v-if="!isAnnouncement", v-b-tooltip.v-secondary.bottom="timeDistance") {{ mtime }}

    //- 自己的文字訊息
    .d-flex.flex-column.align-items-end(v-if="myMessage" style="max-width: 85%;")
      p.message-bubble(
        ref="myMessage"
        v-html="message"
        @click="handleSpecialClick($event)"
        style="max-width: 100%;"
      )
      .attachments.d-flex.flex-wrap.align-items-center.mt-1(v-if="attachments.length > 0")
        b-button.ml-1.mb-1.p-1.text-left(
          v-for="(att, aIdx) in attachments"
          :key="`att_my_${id}_${aIdx}`"
          size="sm"
          variant="outline-success"
          @click="downloadAttachment(channel, id, att.name)"
          :title="`點擊下載：${getAttachmentDisplayName(att.name)} (${formatFileSize(att.size)})`"
        )
          b-icon.mr-1(icon="paperclip")
          span.small.text-truncate(style="max-width: 160px; display: inline-block; vertical-align: middle;") {{ getAttachmentDisplayName(att.name) }}
          b-badge.ml-1(variant="light") {{ formatFileSize(att.size) }}

</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerAnnouncementCard from '~/components/lah-messenger-announcement-card.vue'
import LahMessengerMessageInputEditMessage from '~/components/lah-messenger-message-input-edit-message.vue'
import LahMessengerMessageInput from '~/components/lah-messenger-message-input.vue'
import LahMessengerUserCard from '~/components/lah-messenger-user-card.vue'

export default {
  name: 'LahMessengerMessage',
  components: {
    LahMessengerAnnouncementCard,
    LahMessengerUserCard,
    LahMessengerMessageInput,
    LahMessengerMessageInputEditMessage
  },
  mixins: [lahMessengerBase],
  props: {
    raw: { type: Object, required: true },
    prev: { type: Object, default: undefined },
    preview: { type: Boolean, default: false }
  },
  computed: {
    isAdmin () { return !!this.authority?.isAdmin },
    cascadeInfo () {
      try {
        return JSON.parse(this.raw?.remove)
      } catch (e) {
        return undefined
      }
    },
    isCascadeMessage () { return (this.raw.flag & 1) === 1 && typeof this.cascadeInfo === 'object' },
    isRead () { return (this.raw.flag & 2) === 2 },
    announcementPayload () {
      if (typeof this.raw?.message === 'object' && this.raw.message !== null) {
        return {
          ...this.raw.message,
          id: this.raw.id || this.raw.message.id,
          attachments: this.attachments
        }
      }
      return this.raw?.message
    },
    isAnnouncement () { return typeof this.announcementPayload === 'object' },
    myAnnouncement () { return this.isAnnouncement && this.announcementPayload.sender === this.userid },
    showMdate () { return this.prevMdate !== this.mdate },
    isMyChannel () { return this.currentChannel === this.userid },
    myMessage () { return this.userid === this.senderId },
    system () { return this.sender === 'system' },
    id () { return this.raw?.id },
    type () { return this.raw?.type },
    attachments () {
      if (Array.isArray(this.raw?.attachments)) {
        return this.raw.attachments
      }
      if (typeof this.raw?.message === 'object' && Array.isArray(this.raw.message.attachments)) {
        return this.raw.message.attachments
      }
      return []
    },

    isToday () {
      const d = new Date()
      const todayStr = d.getFullYear() + '-' +
                       String(d.getMonth() + 1).padStart(2, '0') + '-' +
                       String(d.getDate()).padStart(2, '0')
      return this.mdate === todayStr
    },

    messageToRawTxt () {
      if (!this.isAnnouncement && this.regexpReplyHeader) {
        const regex = typeof this.regexpReplyHeader === 'function' ? this.regexpReplyHeader() : this.regexpReplyHeader
        if (regex && typeof regex.exec === 'function') {
          regex.lastIndex = 0
          const foundArr = regex.exec(this.raw?.message)
          if (foundArr) {
            return foundArr[0]
          }
        }
      }
      return undefined
    },
    messageTo () {
      if (this.cascadeInfo) {
        return {
          id: this.cascadeInfo.to,
          name: this.userMap[this.cascadeInfo.to] || this.cascadeInfo.to
        }
      }
      const foundArr = /id=(\w+)_avatar&name=(.+)_avatar/igm.exec(this.messageToRawTxt)
      if (foundArr) {
        return {
          id: foundArr[1],
          name: foundArr[2]
        }
      }
      return undefined
    },
    messageToavatarSrc () {
      return `${this.apiQueryUrl}/get_user_img.php?id=${this.messageTo?.id}_avatar&name=${this.messageTo?.name}_avatar`
    },
    cleanRawMessage () {
      if (this.messageToRawTxt) {
        return this.raw?.message?.replace(this.messageToRawTxt, '')
      }
      return this.raw?.message || ''
    },
    message () {
      const highlighted = this.$utils.highlightPipeline(this.cleanRawMessage)
      const markd = this.$utils.emojify ? this.$utils.emojify(this.$utils.convertMarkd(highlighted)) : this.$utils.convertMarkd(highlighted)
      const regex = typeof this.regexpMarkdImage === 'function' ? this.regexpMarkdImage() : this.regexpMarkdImage
      if (regex && typeof regex.test === 'function') {
        regex.lastIndex = 0
        if (regex.test(markd)) {
          const inlined = this.$utils.convertInlineMarkd(markd)
          const withFiles = this.$utils.replaceFilepath ? this.$utils.replaceFilepath(inlined) : inlined
          const withCases = this.replaceRegCase ? this.replaceRegCase(withFiles) : withFiles
          return this.trimBlockBreaks(this.formatMessengerLinks ? this.formatMessengerLinks(withCases) : withCases)
        }
      }
      const withFiles = this.$utils.replaceFilepath ? this.$utils.replaceFilepath(markd) : markd
      const withCases = this.replaceRegCase ? this.replaceRegCase(withFiles) : withFiles
      return this.trimBlockBreaks(this.formatMessengerLinks ? this.formatMessengerLinks(withCases) : withCases)
    },
    senderId () { return this.raw?.sender },
    sender () { return this.userMap[this.senderId] || this.senderId },
    from () { return this.raw?.ip || this.raw?.from },
    mtime () { return this.raw?.time },
    timeDistance () {
      return this.$utils.formatDistanceToNow(+new Date(`${this.raw.date} ${this.raw.time}`))
    },
    channel () { return this.raw?.channel },
    prevMdate () {
      if (this.prev) {
        if (this.isAnnouncement) {
          return this.prev?.message?.create_datetime?.split(' ')[0]
        }
        return this.prev?.date
      }
      return ''
    },
    mdate () {
      if (this.isAnnouncement) {
        return this.raw?.message?.create_datetime?.split(' ')[0]
      }
      return this.raw?.date
    },
    classes () {
      return [
        this.myMessage ? 'justify-content-end' : this.system ? 'justify-content-center' : 'justify-content-start',
        this.myMessage ? 'mine' : this.system ? 'system' : '',
        this.isToday ? 'is-today' : '',
        this.isAnnouncement ? 'w-100 is-announcement' : ''
      ]
    },
    avatarSrc () {
      return `${this.apiQueryUrl}/get_user_img.php?id=${this.raw.sender}_avatar&name=${this.sender}_avatar`
    },
    replyTitle () {
      const clean = this.message?.replace(/(<([^>]+)>)/gi, '') || ''
      return clean.length > 20 ? `${clean.substring(0, 20)} ... ` : clean
    },
    announcementRemovable () { return this.myAnnouncement },
    messageRemovable () {
      if (this.id < 1) { return false }
      if (this.isMyChannel && this.myMessage) { return true }
      const nowTs = +new Date()
      const msgTs = +new Date(`${this.raw.date} ${this.raw.time}`)
      const offset = nowTs - msgTs
      return this.myMessage && offset <= 86400000
    }
  },
  created () {
    this.sendReadCommand = this.$utils.debounce(() => {
      if (this.windowVisible && this.connected && this.channel) {
        if (!this.isRead && this.senderId !== this.userid) {
          const json = {
            type: 'command',
            sender: this.userid,
            date: this.date(),
            time: this.time(),
            channel: 'system',
            message: JSON.stringify({
              command: 'set_read',
              channel: this.channel,
              id: this.id,
              flag: this.raw.flag,
              sender: this.userid,
              cascade: this.isMyChannel
            })
          }
          this.websocket.send(JSON.stringify(json))
        }
      } else {
        setTimeout(() => this.sendReadCommand && this.sendReadCommand(), 3000)
      }
    }, 15000)
  },
  mounted () {
    this.$refs.remoteMessage && this.sendReadCommand && this.sendReadCommand()
    this.$refs.myMessage && this.checkReadCommand()
  },
  methods: {
    // 伺服器即時廣播 (parseInline + breaks) 會在區塊標籤 (p/hr/ul/h1~h6...) 之間塞入 <br>，
    // 造成橫線 (hr) 與段落間距過大；區塊標籤前後的 <br> 沒有意義，統一移除以符合歷史載入與 Electron 版的顯示
    trimBlockBreaks (html) {
      if (!html || typeof html !== 'string') {
        return html || ''
      }
      const blockTags = 'p|h[1-6]|ul|ol|li|pre|blockquote|table|div|hr'
      return html
        .replace(new RegExp(`(</(?:${blockTags})>|<hr\\s*/?>)\\s*(?:<br\\s*/?>\\s*)+`, 'gi'), '$1')
        .replace(new RegExp(`(?:<br\\s*/?>\\s*)+(?=<(?:${blockTags})\\b)`, 'gi'), '')
    },
    checkReadCommand () {
      if (this.isCascadeMessage && !this.isRead) {
        const json = {
          type: 'command',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          channel: 'system',
          message: JSON.stringify({
            command: 'check_read',
            channel: this.cascadeInfo.to,
            id: this.cascadeInfo.id,
            sender: this.userid,
            senderChannelMessageId: this.id,
            senderChannelMessageFlag: this.raw?.flag || 0
          })
        }
        this.connected && this.websocket.send(JSON.stringify(json))
        setTimeout(() => this.checkReadCommand(), 20000)
      }
    },
    remoteAvatarClick (event) {
      event.stopPropagation()
      this.modal(this.$createElement(LahMessengerUserCard, {
        props: { id: this.raw.sender, name: this.sender }
      }), { title: `${this.sender}`, size: 'md' })
    },
    mineAvatarClick (event) {
      event.stopPropagation()
      this.modal(this.$createElement(LahMessengerUserCard, {
        props: { id: this.messageTo?.id, name: this.messageTo?.name }
      }), { title: `${this.messageTo?.name}`, size: 'md' })
    },
    reply () {
      this.modal(this.$createElement(LahMessengerMessageInput, {
        props: { text: this.message, to: this.senderId, reply: this.replyTitle || ' ... ' },
        on: { sent: () => { this.hideModalById('message-reply-modal') } }
      }), {
        id: 'message-reply-modal',
        size: 'md',
        title: `回覆：${this.sender} - ${this.replyTitle || ' ... '}`
      })
    },
    edit () {
      this.modal(this.$createElement(LahMessengerMessageInputEditMessage, {
        props: { raw: this.raw },
        on: {
          sent: (payload) => {
            this.hideModalById('message-edit-modal')
            this.$emit('edit', payload)
          }
        }
      }), { id: 'message-edit-modal', size: 'md', title: '編輯訊息' })
    },
    emitReply () { this.$emit('reply', this.raw) },
    remove () {
      this.confirm('刪除本則訊息?').then((YN) => {
        if (YN) {
          this.sendRemoveMessage()
          this.$emit('remove', this.raw)
        }
      })
    },
    sendRemoveMessage () {
      const json = {
        type: 'command',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        message: JSON.stringify({
          command: 'remove_message',
          channel: this.channel,
          id: this.id,
          cascade: this.raw.remove?.startsWith('{') ? JSON.parse(this.raw.remove) : ''
        }),
        channel: 'system'
      }
      this.websocket.send(JSON.stringify(json))
    }
  }
}
</script>

<style lang="scss" scoped>
.msg-item {
  position: relative;
  overflow: visible;
  max-width: 100%;

  &.w-100,
  &.is-announcement {
    width: 100%;
  }

  p.message-bubble,
  > p {
    display: inline-block;
    border-radius: 8px;
    background: #e9ecef;
    color: #212529;
    padding: 8px 12px;
    max-width: 85%;
    text-align: left;
    box-sizing: border-box;
    margin-bottom: 0rem !important;
    transition: all 0.3s ease;
    border-left: 3px solid transparent;
    word-break: break-word;

    ::v-deep p {
      margin-top: 0;
      margin-bottom: 0;
      + p {
        margin-top: 0.25rem;
      }
    }

    ::v-deep hr {
      margin-top: 5px;
      margin-bottom: 5px;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    ::v-deep ul,
    ::v-deep ol {
      margin-top: 2px;
      margin-bottom: 4px;
      padding-left: 1.25rem;
      &:last-child {
        margin-bottom: 0;
      }
    }

    ::v-deep li {
      margin-bottom: 2px;
      line-height: 1.45;
      &:last-child {
        margin-bottom: 0;
      }
    }

    ::v-deep pre,
    ::v-deep code {
      font-size: 0.875rem;
      word-break: break-all;
      white-space: pre-wrap;
    }

    ::v-deep blockquote {
      margin: 4px 0;
      padding-left: 8px;
      border-left: 3px solid #ccc;
      color: #666;
    }

    ::v-deep img,
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      border-radius: 4px;
      margin: 4px auto;
      object-fit: contain;
    }

    ::v-deep a[target="_blank"],
    ::v-deep a.messenger-external-link {
      &::after {
        content: ' ↗';
        font-size: 0.82em;
        font-weight: bold;
        display: inline-block;
        vertical-align: super;
        line-height: 1;
        opacity: 0.8;
        text-decoration: none !important;
      }
    }

    ::v-deep .lah-reg-case-link {
      color: #0056b3;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: inline-block;
      padding: 0 3px;
      border-radius: 3px;
      user-select: text;

      &:hover {
        color: #00356b;
        background-color: rgba(0, 123, 255, 0.12);
        text-decoration: underline;
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  &.is-today {
    p.message-bubble,
    > p {
      background: #fdfdfd;
      border-left: 4px solid #17a2b8;
    }

    &.mine {
      p.message-bubble,
      > p {
        background: #e6f9eb;
        border-left: 0;
        border-right: 4px solid #28a745;
      }
    }

    .today-card {
      box-shadow: 0 6px 16px rgba(0, 123, 255, 0.25);
      border: 1px solid rgba(0, 123, 255, 0.3);
    }
  }

  &.mine {
    p.message-bubble,
    > p {
      background: #dcf8c6;
      color: #000;
      margin-bottom: 0rem !important;
    }
  }

  &.system {
    > p {
      text-align: center;
      font-weight: bold;
      padding: 5px 12px;
      border-radius: 20px;
      background: #adb5bd;
      color: #fff;
      font-size: .75rem;
      max-width: 95%;
      border: none;
    }
    margin-top: .5rem;
    margin-bottom: .75rem;
  }

  &.date {
    > p {
      width: 100%;
      font-size: 0.9rem;
      background-color: #f1f3f5;
      color: #495057;
      text-align: center;
      border: none;
    }
  }

  .time {
    display: inline-block;
    align-self: flex-end;
    white-space: nowrap;

    .clickableIcon {
      cursor: pointer;
      transition: all .2s;
      z-index: 1002;
      &:hover {
        transform: scale(1.2);
        color: #007bff !important;
      }
    }
    .readIcon {
      font-size: 1.2rem;
      font-weight: bold;
      margin-right: 2px;
    }
  }
}
</style>
