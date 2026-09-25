<template lang="pug">
b-card.announcement-card(
  :header-border-variant="borderVariant"
  :header-bg-variant="borderVariant"
  :header-text-variant="textVariant"
  :header="header"
)
  template(#header style="position:relative"): .d-flex.font-weight-bold.align-items-center
    span(style="width: 380px").mr-auto {{ dataJson.title }}
    span.ml-1 \#{{ dataJson.id }}
  b-card-text(ref="content" v-html="content" @click="handleSpecialClick($event)")
  
  template(#footer): .protected-footer.d-flex.justify-content-between.align-items-center.text-muted
    span {{ dataJson.sender }}#[span.ml-1(v-if="sender !== dataJson.sender") {{ sender }}]
    b-button-group(v-if="!preview && (mine || isAdmin)", size="sm")
      b-button(
        variant="outline-primary"
        title="編輯公告"
        @click="edit"
      )
        b-icon.align-middle(icon="pencil-fill" scale="0.8")
        span.align-middle.ml-1 編輯
      b-button(
        variant="outline-danger"
        title="移除公告"
        @click="remove"
      )
        b-icon.align-middle(icon="x-circle" scale="0.8")
        span.align-middle.ml-1 移除
    span {{ dataJson.create_datetime }}
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import LahMessengerMessageInputEditAnnouncement from '~/components/lah-messenger-message-input-edit-announcement.vue'

export default {
  name: 'LahMessengerAnnouncementCard',
  components: {
    LahMessengerMessageInputEditAnnouncement
  },
  mixins: [lahMessengerBase],
  props: {
    dataJson: { type: Object, required: true },
    channel: { type: String, required: true },
    preview: { type: Boolean, default: false }
  },
  computed: {
    isAdmin () { return this.authority.isAdmin },
    mine () { return this.$utils.equal(this.dataJson.sender, this.userid) },
    header () { return this.dataJson.title },
    borderVariant () {
      const priority = parseInt(this.dataJson.priority)
      switch (priority) {
        case 0: return 'danger'
        case 1: return 'warning'
        case 2: return 'info'
        default: return 'secondary'
      }
    },
    textVariant () {
      const priority = parseInt(this.dataJson.priority)
      switch (priority) {
        case 1: return 'dark'
        case 0:
        case 2:
        default: return 'white'
      }
    },
    sender () { return this.userMap[this.dataJson.sender] || this.dataJson.sender },
    content () {
      if (this.$utils.empty(this.dataJson.content)) {
        return ''
      }
      const highlighted = this.$utils.highlightPipeline(this.dataJson.content)
      let markd = this.$utils.convertMarkd(highlighted)
      if (this.regexpMarkdImage && this.regexpMarkdImage().test(markd)) {
        markd = this.$utils.convertInlineMarkd(markd)
      }
      return this.$utils.replaceFilepath(markd)
    }
  },
  methods: {
    remove () {
      this.confirm(`刪除公告 - 「${this.dataJson.title}」？`).then((YN) => {
        if (YN) {
          this.sendRemoveMessage()
          this.$emit('remove', this.dataJson)
        }
      })
    },
    edit () {
      this.modal(this.$createElement(LahMessengerMessageInputEditAnnouncement, {
        props: {
          dataJson: this.dataJson,
          channel: this.channel
        },
        on: {
          sent: (payload) => {
            this.hideModalById('message-edit-modal')
            this.$emit('edit', payload)
          }
        }
      }), {
        id: 'message-edit-modal',
        size: 'xl',
        title: '編輯公告'
      })
    },
    sendRemoveMessage () {
      const jsonString = JSON.stringify({
        type: 'command',
        sender: this.userid,
        date: this.date(),
        time: this.time(),
        message: JSON.stringify({
          command: 'remove_message',
          channel: this.channel,
          id: this.dataJson.id
        }),
        channel: 'system'
      })
      this.websocket && this.websocket.send(jsonString)
    }
  }
}
</script>

<style lang="scss" scoped>
.announcement-card {
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
  ::v-deep .card-header {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
  }
  ::v-deep .card-body {
    padding: 0.75rem;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  ::v-deep .card-footer {
    padding: 6px 12px !important;
    font-size: 0.8rem;
    background-color: #f8f9fa;
  }
}

.protected-footer {
  font-size: 12px !important;
  line-height: 1.5 !important;
  zoom: 1 !important;

  &, *, span {
    font-size: 12px !important;
    line-height: 1.5 !important;
    letter-spacing: normal !important;
  }

  ::v-deep .btn {
    font-size: 11px !important;
    padding: 2px 6px !important;
    height: auto !important;
    display: inline-flex;
    align-items: center;

    .b-icon {
      font-size: 11px !important;
      width: 1em !important;
      height: 1em !important;
    }
  }
}
</style>
