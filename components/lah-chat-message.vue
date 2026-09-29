<template lang="pug">
.mb-2.chat-msg-wrapper
  //- 如果訊息日期與前一則不同，顯示日期分隔列
  .d-flex.msg-item.justify-content-center.system.date.my-2(
    v-if="showMdate"
  ): p.date-pill(v-html="'📅 ' + mdate")

  //- 顯示發送者資訊（非自己且非系統）
  .s-75.font-weight-bold.align-middle.mb-1.sender-line(
    v-if="!myMessage && !system"
    @click="avatarClick($event)"
    :style="{ cursor: 'pointer' }"
    title="顯示使用者卡片"
  )
    b-avatar.my-auto.mr-1(
      :src="isAnnouncement ? '/tyland.jpg' : avatarSrc"
      size="1.35rem"
      variant="primary"
      button
    )
    span.mr-1.text-dark {{ sender }}
    em.text-muted.small(v-if="from") ({{ from }})

  .d-flex.msg-item.my-1(:class="classes")
    //- 公告卡片 (若是公告物件)
    announcement-card(
      v-if="isAnnouncement"
      :data-json="announcementPayload"
      :channel="channel"
      :message-id="id"
    )

    //- 訊息本體氣泡 (他人或系統訊息)
    .bubble-wrap(v-else-if="!myMessage")
      .font-weight-bold.text-dark.small.mb-1.border-bottom.pb-1(v-if="hasTitle") {{ displayTitle }}
      p(ref="remoteMessage" v-html="message" @click="handleImgClick($event)")

    //- 時間與操作按鈕 (非系統訊息)
    .time.s-60.mx-1.text-muted.text-right(v-if="!system")
      b-icon.align-middle.mr-1.readIcon(
        v-if="isRead"
        icon="check"
        :variant="myMessage ? 'success' : 'secondary'"
        title="已讀取"
      )
      b-icon.clickableIcon(
        v-if="!isAnnouncement && !myMessage && (userMap[senderId] || (userNames && userNames[senderId]))"
        icon="reply-fill"
        title="回覆此訊息"
        font-scale="1.3"
        flip-h
        @click="reply"
      )
      div(v-if="!isAnnouncement" v-b-tooltip.v-secondary.bottom="timeDistance") {{ mtime }}

    //- 自己的訊息本體氣泡
    .bubble-wrap(v-if="myMessage")
      .font-weight-bold.text-dark.small.mb-1.border-bottom.pb-1(v-if="hasTitle") {{ displayTitle }}
      p(ref="myMessage" v-html="message" @click="handleImgClick($event)")
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerUserCard from '~/components/lah-messenger-user-card.vue'
import LahMessengerMessageInput from '~/components/lah-messenger-message-input.vue'

export default {
  name: 'LahChatMessage',
  mixins: [lahMessengerBase],
  props: {
    json: {
      type: Object,
      default: () => ({})
    },
    prev: { type: Object, default: undefined }
  },
  computed: {
    cascadeInfo () {
      try {
        return JSON.parse(this.json?.remove)
      } catch (e) {
        return undefined
      }
    },
    isCascadeMessage () { return (this.json.flag & 1) === 1 && typeof this.cascadeInfo === 'object' },
    isRead () { return (this.json.flag & 2) === 2 },
    announcementPayload () { return this.json?.message },
    isAnnouncement () { return typeof this.announcementPayload === 'object' },
    myAnnouncement () { return this.isAnnouncement && this.announcementPayload?.sender === this.userid },

    id () { return this.json?.id },
    type () { return this.json?.type },
    senderId () { return this.json?.sender || '' },
    sender () {
      return (this.userMap && this.userMap[this.senderId]) ||
             (this.userNames && this.userNames[this.senderId]) ||
             this.senderId
    },
    from () { return this.json?.from_ip || this.json?.ip || this.json?.from || '' },
    channel () { return this.json?.channel },

    rawText () {
      const raw = this.json?.content || this.json?.message || ''
      return typeof raw === 'string' ? raw : (raw?.content || raw?.title || '')
    },
    hasTitle () {
      const t = (this.json?.title || '').trim()
      return !!t && !['dontcare', 'title', '即時通訊息'].includes(t)
    },
    displayTitle () {
      return (this.json?.title || '').trim()
    },
    message () {
      const text = this.rawText
      if (!text) { return '' }
      let rendered = text
      if (this.$utils?.highlightPipeline) {
        rendered = this.$utils.highlightPipeline(rendered)
      }
      if (this.$utils?.convertMarkd) {
        rendered = this.$utils.convertMarkd(rendered)
      }
      if (this.$utils?.emojify) {
        rendered = this.$utils.emojify(rendered)
      }
      return rendered
    },

    myMessage () {
      return !!(this.userid && this.senderId && this.userid.toUpperCase() === this.senderId.toUpperCase())
    },
    system () { return this.senderId === 'system' || this.sender === 'system' },

    mdate () {
      if (this.isAnnouncement) {
        return this.json?.message?.create_datetime?.split(' ')[0] || ''
      }
      if (this.json?.date) { return this.json.date }
      if (this.json?.create_datetime) { return this.json.create_datetime.split(' ')[0] }
      return ''
    },
    prevMdate () {
      if (this.prev) {
        if (typeof this.prev.message === 'object') {
          return this.prev.message.create_datetime?.split(' ')[0] || ''
        }
        if (this.prev.date) { return this.prev.date }
        if (this.prev.create_datetime) { return this.prev.create_datetime.split(' ')[0] }
      }
      return ''
    },
    showMdate () {
      return Boolean(this.mdate && this.prevMdate !== this.mdate)
    },
    mtime () {
      if (this.json?.time) { return this.json.time }
      if (this.json?.create_datetime) { return this.json.create_datetime.split(' ')[1] || '' }
      return ''
    },
    timeDistance () {
      const dt = this.json?.create_datetime || `${this.json?.date || ''} ${this.json?.time || ''}`.trim()
      if (dt && this.$utils?.formatDistanceToNow) {
        return this.$utils.formatDistanceToNow(+new Date(dt))
      }
      return ''
    },

    classes () {
      return [
        this.myMessage ? 'justify-content-end' : this.system ? 'justify-content-center' : 'justify-content-start',
        this.myMessage ? 'mine' : this.system ? 'system' : ''
      ]
    },
    avatarSrc () {
      const base = this.apiQueryUrl || (process.client ? `http://${location.hostname}` : 'http://220.1.34.75')
      return `${base}/get_user_img.php?id=${this.senderId}_avatar&name=${this.sender}_avatar`
    },
    replyTitle () {
      const clean = this.rawText.replace(/(<([^>]+)>)/gi, '')
      return clean.length > 20 ? `${clean.substring(0, 20)} ... ` : clean
    }
  },
  methods: {
    avatarClick (event) {
      event.stopPropagation()
      this.modal(this.$createElement(LahMessengerUserCard, {
        props: {
          id: this.senderId,
          name: this.sender
        }
      }), {
        title: `${this.sender}`,
        size: 'md'
      })
    },
    reply () {
      this.modal(this.$createElement(LahMessengerMessageInput, {
        props: {
          text: this.rawText,
          to: this.senderId,
          reply: this.replyTitle || ' ... '
        },
        on: {
          sent: () => { this.hideModalById('message-reply-modal') }
        }
      }), {
        id: 'message-reply-modal',
        size: 'md',
        title: `回覆：${this.sender} - ${this.replyTitle || ' ... '}`
      })
    },
    handleImgClick (event) {
      const element = event.target
      if (element.tagName === 'IMG') {
        const src = element.src
        if (src && (src.startsWith('data:') || src.startsWith('http'))) {
          this.modal(this.$createElement('b-img', {
            props: {
              src,
              fluid: true
            },
            class: 'd-block mx-auto'
          }), {
            title: '查看圖片',
            size: 'lg',
            hideFooter: true
          })
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-msg-wrapper {
  .date-pill {
    padding: 2px 14px;
    background: #e2e8f0;
    color: #4a5568;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    margin-bottom: 0 !important;
  }
}

.msg-item {
  position: relative;
  align-items: flex-end;

  .bubble-wrap {
    max-width: 85%;
    display: inline-block;
    border-radius: 10px;
    background: #ffffff;
    color: #1a202c;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

    p {
      margin-bottom: 0 !important;
      word-break: break-word;
      line-height: 1.55;

      ::v-deep img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 6px;
        margin: 6px 0;
        cursor: pointer;
        transition: opacity 0.2s;
        &:hover {
          opacity: 0.9;
        }
      }
    }
  }

  &.mine {
    .bubble-wrap {
      background: #e2f7cb;
      border-color: #d0ecc0;
      color: #1f2937;
    }
  }

  &.system {
    .bubble-wrap {
      background: #edf2f7;
      text-align: center;
      max-width: 95%;
      font-size: 0.85rem;
    }
  }

  .time {
    display: inline-block;
    user-select: none;
    .clickableIcon {
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        color: #007bff;
      }
    }
    .readIcon {
      font-size: 1.1rem;
    }
  }
}
</style>
