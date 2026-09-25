<template lang="pug">
.center(v-if="loading" style="height: 300px"): b-icon(font-scale="3" icon="circle-fill" animation="throb" variant="secondary")
div(v-else :class="blockCss")
  .msg(
    ref="box"
    @scroll="scrollTop = $event.target.scrollTop"
    @dragover="dragover"
    @dragleave="dragleave"
    @drop="drop"
  )
    b-icon.old-message-arrow(
      v-if="showOldMessageArrow"
      icon="arrow-up-circle-fill"
      font-scale="2"
      variant="secondary"
      :title="`讀取之前${historyCount}筆訊息`"
      @click="delayLoadHistoryMessage"
    )
    b-button.post-message-btn(
      v-if="showPostAnnouncementBtn"
      ref="postMessageBtn"
      @click="openMessageInput"
      size="sm"
      variant="primary"
      pill
      :title="`發布訊息@${currentChannelName}`"
    )
      b-icon(icon="chat-right-text" flip-h)
      span.ml-1.d-none.d-md-inline 發布
    
    h5.center.my-5(v-if="empty(list)")
      b-icon.mr-1(icon="shield-fill-exclamation" variant="success")
      span 目前尚無任何訊息 
    transition-group(v-else name="list" mode="out-in")
      lah-messenger-message.mr-1.animate__animated(
        enter-active-class="animate__slideInUp"
        leave-active-class="animate__slideInDown"
        v-for="(item, idx) in list"
        :raw="item"
        :prev="list[idx - 1]"
        :key="`msg-${item.id || idx}`"
        :ref="`msg-${idx}`"
        @reply="$emit('reply', $event)"
        @remove="$emit('remove', $event)"
      )
</template>

<script>
import debounce from 'lodash/debounce'
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMessage from '~/components/lah-messenger-message.vue'
import LahMessengerMessageInput from '~/components/lah-messenger-message-input.vue'

export default {
  name: 'LahMessengerMessageBoard',
  components: { LahMessengerMessage, LahMessengerMessageInput },
  mixins: [lahMessengerBase],
  props: {
    list: { type: Array, required: true }
  },
  data: () => ({
    loading: true,
    displayOldMessageArrow: false,
    scrollTop: 0,
    scrollBehavior: 'last',
    dropImage: undefined,
    pickedEncodingData: '',
    historyCount: 15
  }),
  computed: {
    isAuthorized () {
      if (this.currentChannel === this.userid) {
        return true
      }
      return this.authority?.isAdmin || this.authority?.isNotifyMgtStaff
    },
    isDepartment () { return this.currentChannel.startsWith('announcement_') },
    blockCss () {
      if (this.isAnnouncement || this.isDepartment || this.isMine) {
        return 'announcement-container'
      }
      return 'chat-container'
    },
    messageCount () { return this.list.length },
    showOldMessageArrow () {
      return this.displayOldMessageArrow && this.scrollTop < 50 && this.list.length > 0 && !this.fetchingHistory
    },
    showPostAnnouncementBtn () {
      return !this.chatRooms.includes(this.currentChannel) && this.isAuthorized
    }
  },
  watch: {
    messageCount (n, o) {
      if (o > n) this.loading = true
      this.delayScrollToMessage()
    },
    fetchingHistory (flag) {
      setTimeout(() => { this.scrollBehavior = flag ? 'first' : 'last' }, 600)
    },
    dropImage (file) {
      file && this.upload()
    },
    loading (flag) {
      !flag && this.delayScrollToMessage()
    }
  },
  created () {
    this.delayLoadHistoryMessage = debounce(this.loadHistoryMessage, 400)
    this.delayAttention = debounce(this.attention, 600)
    this.delayScrollToMessage = debounce(() => {
      this.loading = false
      this.scrollToMessage()
    }, 250)
  },
  mounted () {
    setTimeout(() => {
      this.displayOldMessageArrow = true
      this.loading = false
    }, 1000)
  },
  methods: {
    loadHistoryMessage () {
      if (this.fetchingHistory) {
        this.warning('讀取之前訊息中，請稍待 ... ')
      } else if (this.connected && this.list.length > 0) {
        this.$store.commit('fetchingHistory', true)
        const jsonString = JSON.stringify({
          type: 'command',
          sender: this.userid,
          date: this.date(),
          time: this.time(),
          message: JSON.stringify({
            command: 'previous',
            channel: this.currentChannel,
            headId: this.list[0].id,
            count: this.historyCount
          }),
          channel: 'system'
        })
        this.websocket.send(jsonString)
        this.scrollBehavior = 'first'
        setTimeout(() => { this.$store.commit('fetchingHistory', false) }, 30000)
      }
    },
    upload (directly = false) {
      if (!this.dropImage) return
      if (this.currentChannel.startsWith('announcement') || this.currentChannel === this.userid) {
        this.warning('非聊天室不支援拖放圖片直接發送')
        return
      }
      if (['image/jpeg', 'image/png', 'image/gif'].includes(this.dropImage?.type)) {
        this.isBusy = true
        this.pickedEncodingData = ''
        const filename = this.dropImage.name
        const formData = new FormData()
        formData.append('file', this.dropImage)
        formData.append('width', 1920)
        formData.append('height', 1080)
        formData.append('quality', 80)
        const uploadUrl = `${this.apiQueryUrl}${this.$consts.API.FILE.BASE64}`
        this.$upload.post(uploadUrl, formData).then(({ data }) => {
          if (!this.empty(data.encoded) && !this.empty(data.uri)) {
            this.pickedEncodingData = `${data.uri}${data.encoded}`
            this.$store.commit('addImageMemento', this.pickedEncodingData)
            if (this.$utils.statusCheck(data.status)) {
              if (directly) {
                this.sendImage(this.pickedEncodingData, filename, this.currentChannel)
              }
            } else {
              this.warning(data.message, { title: '上傳圖檔結果' })
            }
          } else {
            this.warning('回傳的影像編碼有誤', { title: '上傳圖檔結果' })
          }
        }).catch((err) => {
          console.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.warning('僅支援 JPG/PNG/GIF 圖檔')
      }
    },
    dragover (event) {
      event.preventDefault()
      if (!event.currentTarget.classList.contains('dropable')) {
        event.currentTarget.classList.add('dropable')
      }
    },
    dragleave (event) {
      event.currentTarget.classList.remove('dropable')
    },
    drop (event) {
      event.stopPropagation()
      event.preventDefault()
      if (this.currentChannel.startsWith('announcement') || this.currentChannel === this.userid) {
        this.warning('非聊天室不支援拖放圖檔')
      } else if (event.dataTransfer.files.length > 0) {
        this.dropImage = event.dataTransfer.files[0]
        this.upload(true)
      }
      event.currentTarget.classList.remove('dropable')
    },
    getLastSender () {
      const lastRemoteMessage = [...this.list].reverse().find(message => {
        return message.type === 'remote' && message.sender !== this.userid
      })
      return lastRemoteMessage?.sender
    },
    openMessageInput () {
      this.modal(this.$createElement(LahMessengerMessageInput, {
        props: {
          to: this.getLastSender() || this.currentChannel,
          pickUser: this.currentChannel === this.userid
        },
        on: {
          sent: () => { this.hideModalById('message-input-modal') }
        }
      }), {
        id: 'message-input-modal',
        size: 'xl',
        title: this.currentChannelName
      })
    },
    scrollToMessage () {
      const target = this.scrollBehavior === 'first' ? this.$refs['msg-0'] : this.$refs[`msg-${this.list.length - 1}`]
      if (this.$refs.box && target) {
        const message = target[0]
        if (message && message.$el) {
          if (message.$el.scrollIntoView && this.currentChannelMessageCount > 10) {
            message.$el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
          } else {
            this.$refs.box.scrollTop = this.scrollBehavior === 'first' ? 0 : this.$refs.box.scrollHeight
          }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.announcement-container,
.chat-container {
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.msg {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem;
}
.old-message-arrow {
  position: absolute;
  top: 10px;
  right: 15px;
  z-index: 10;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
    color: #007bff !important;
  }
}
.post-message-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  opacity: 0.85;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  &:hover {
    opacity: 1;
  }
}
</style>
