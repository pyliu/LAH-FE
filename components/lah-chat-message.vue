<template lang="pug">
.mb-1
  //- show date if the message has previous days' message
  .d-flex.msg-item.justify-content-center.system.date(
    v-if="showMdate && id > 0"
  ): p(v-html="mdate")

  .s-75.font-weight-bold.align-middle(
    v-if="!myMessage && !system"
    @click="avatarClick($event)"
    :style="{ cursor: 'pointer' }"
    title="顯示使用者卡片"
  )
    b-avatar.my-auto.mr-1(
      v-if="['remote'].includes(type) || isAnnouncement"
      :src="isAnnouncement ? '/tyland.jpg' : this.avatarSrc"
      size="1.25rem"
      variant="primary"
      button
    )
    span.mr-1 {{ sender }}
    em {{ from }}

  .d-flex.msg-item.my-1(:class="classes")

    //- special card message for announcement
    announcement-card(
      v-if="isAnnouncement"
      :data-json="announcementPayload"
      :channel="channel"
      :message-id="id"
    )

    //- remote or system message
    p(ref="remoteMessage" v-else-if="!myMessage" v-html="message" @click="handleImgClick($event)")

    //- timestamp for the message
    .time.s-60.mx-1.text-muted.text-right(v-if="!system")
      b-icon.align-middle.mr-1.readIcon(
        v-if="isRead"
        icon="check"
        :variant="myMessage ? 'success' : 'light'"
        title="已讀取"
      )
      b-icon.mr-1.clickableIcon(
        v-if="messageRemovable"
        icon="x-circle"
        variant="danger"
        title="移除這則訊息"
        scale="1.5"
        @click="remove"
      )
      b-icon.clickableIcon(
        v-if="!isAnnouncement && !myMessage && userMap[senderId]"
        icon="reply-fill"
        title="回覆此訊息"
        font-scale="1.5"
        flip-h
        @click="isMyChannel ? reply() : emitReply()"
      )
      div(v-if="!isAnnouncement", v-b-tooltip.v-secondary.bottom="timeDistance") {{ mtime }}

    //- my message
    p(ref="myMessage" v-if="myMessage" v-html="message" @click="handleImgClick($event)")
</template>

<script>

import lahUserCard from '~/components/lah-user-card.vue'

export default {
  components: { lahUserCard },
  props: {
    json: {
      type: Object,
      default: () => ({
        content: 'message body',
        create_datetime: '2022-03-29 14:55:30',
        expire_datetime: '',
        flag: 0,
        from_ip: '192.168.xxx.xxx',
        id: 0,
        priority: 3,
        sender: 'HAXXXXXXXX',
        title: 'title'
      })
    },
    prev: { type: Object, default: undefined }
  },
  data: () => ({}),
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

    showMdate () { return this.prevMdate !== this.mdate },
    isMyChannel () { return this.currentChannel === this.userid },
    myMessage () { return this.userid === this.senderId },
    system () { return this.sender === 'system' },
    id () { return this.json?.id },
    type () { return this.json?.type },
    message () { return this.$utils.emojify(this.json?.message) },
    senderId () { return this.json?.sender },
    sender () { return this.userMap[this.senderId] || this.senderId },
    from () { return this.json?.ip },
    mtime () { return this.json?.time },
    timeDistance () { return this.$utils.formatDistanceToNow(+new Date(`${this.json.date} ${this.json.time}`)) },
    channel () { return this.json?.channel },
    prevMdate () {
      if (this.prev) {
        // announcement card date is inside the message
        if (this.isAnnouncement) {
          return this.prev?.message?.create_datetime?.split(' ')[0]
        }
        return this.prev?.date
      }
      return ''
    },
    mdate () {
      // announcement card date is inside the message
      if (this.isAnnouncement) {
        return this.json?.message?.create_datetime?.split(' ')[0]
      }
      return this.json?.date
    },
    classes () {
      return [
        this.myMessage ? 'justify-content-end' : this.system ? 'justify-content-center' : 'justify-content-start',
        this.myMessage ? 'mine' : this.system ? 'system' : ''
      ]
    },
    avatarSrc () { return `${this.apiQueryUrl}/get_user_img.php?id=${this.json?.sender}_avatar&name=${this.sender}_avatar` },
    replyTitle () {
      const clean = this.message.replace(/(<([^>]+)>)/gi, '')
      return clean.replace(/%[A-F\d]{2}/g, 'U').length > 20 ? `${clean.substring(0, 20)} ... ` : clean
    },
    announcementRemovable () { return this.myAnnouncement },
    messageRemovable () {
      if (this.id < 1) { return false }
      if (this.isMyChannel && this.myMessage) { return true }
      const nowTs = +new Date()
      const msgTs = +new Date(`${this.json.date} ${this.json.time}`)
      const offset = nowTs - msgTs
      // my message and wthin a day
      return this.myMessage && offset <= 86400000
    }
  },
  created () {
  },
  mounted () {
    // this.$refs.remoteMessage && this.sendReadCommand()
    // this.$refs.myMessage && this.checkReadCommand()
  },
  methods: {
    sendReadCommand () { /* placeholder for debouncing */ },
    checkReadCommand () {
      if (this.isCascadeMessage && !this.isRead) {
        const json = {
          type: 'command',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          channel: 'system'
        }
        json.message = {
          command: 'check_read',
          channel: this.cascadeInfo.to,
          id: this.cascadeInfo.id,
          sender: this.userid,
          senderChannelMessageId: this.id,
          senderChannelMessageFlag: this.json?.flag || 0
        }
        this.connected && this.websocket.send(JSON.stringify(json))
        // in case remote not read the message, checks again after 20s
        this.timeout(() => this.checkReadCommand(), 20000)
      }
    },
    handleImgClick (event) {
      const element = event.target
      if (element.tagName === 'IMG') {
        if (element.src.startsWith('data:')) {
          // not click on avatar img
        } else if (this.$utils.$(element).hasClass('avatar') && this.cascadeInfo) {
          this.modal(this.$createElement(lahUserCard, { props: { id: this.cascadeInfo.to } }), {
            title: this.cascadeInfo.to,
            size: 'xl'
          })
        }
      }
    },
    avatarClick (event) {
      event.stopPropagation()
      this.modal(this.$createElement(lahUserCard, {
        props: {
          id: this.json?.sender,
          name: this.sender
        }
      }), {
        title: `${this.sender}`,
        size: 'xl'
      })
    },
    reply () {
      this.modal(this.$createElement(MessageInput, {
        props: {
          text: this.message,
          to: this.senderId,
          reply: this.replyTitle || ' ... '
        },
        on: {
          sent: () => { this.hideModalById('message-reply-modal') }
        }
      }), {
        id: 'message-reply-modal',
        size: 'xl',
        title: `回覆：${this.sender} - ${this.replyTitle || ' ... '}`
      })
    },
    emitReply () {
      this.$emit('reply', this.json)
    },
    remove () {
      this.confirm('刪除本則訊息?').then((YN) => {
        if (YN) {
          // TODO: send request to ws to remvoe the message from channel
          this.sendRemoveMessage()
          // to tell outter board removing this message in the list
          this.$emit('remove', this.json)
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
          // in my channel, it needs to remove the pm as well; parsed json expect: { to: 'HAXXXX', id: xxxx }
          cascade: this.currentChannel === this.userid && this.json.flag === 1 ? JSON.parse(this.json.remove) : ''
        }),
        channel: 'system'
      }
      this.websocket.send(JSON.stringify(json))
    }
  }
}
</script>

<style lang="scss">
.msg-item {
  position: relative;
  overflow: hidden;

  p {
    display: inline-block;
    border-radius: 5px;
    background: #e6e9e9;
    color: rgb(10, 10, 10);
    padding: 5px;
    max-width: 85%;
    text-align: left;
    box-sizing: border-box;
    margin-bottom: 0rem !important;
  }

  &.mine {
    p {
      background: rgb(214, 247, 220);
      color: rgb(0, 0, 0);
      margin-bottom: 0rem !important;
    }
  }
  &.system {
    p {
      text-align: center;
      font-weight: bold;
      padding: 5px 10px 5px 10px;
      border-radius: 10px;
      background: #e9ebec;
      color: #2e2e2e;
      font-size: .75rem;
      max-width: 95%;
    }
    margin-top: .25rem;
    margin-bottom: 0.5rem;
  }
  &.date {
    p {
      width: 100%;
      padding: 5px 15px 5px 15px;
    }
  }
  .time {
    display: inline-block;
    align-self: flex-end;
    .clickableIcon {
      cursor: pointer;
      transition: all .5s;
      z-index: 1002;
      &:hover {
        font-size: .75rem;
        font-weight: bold;
        color: rgb(0, 81, 255);
      }
    }
    .readIcon {
      font-size: 1.5rem;
      font-weight: bold;
    }
  }
}
</style>
