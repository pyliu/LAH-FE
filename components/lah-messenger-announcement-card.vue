<template lang="pug">
b-card.announcement-card.w-100(
  :header-border-variant="borderVariant"
  :header-bg-variant="borderVariant"
  :header-text-variant="textVariant"
  :header="header"
)
  template(#header style="position:relative"): .d-flex.font-weight-bold.align-items-center.w-100
    span.mr-auto.text-truncate(:title="dataJson.title") {{ dataJson.title }}
    span.ml-1.text-nowrap \#{{ dataJson.id }}
  b-card-text(ref="content" v-html="content" @click="handleSpecialClick($event)")
  .attachments.mt-2.pt-2.border-top(v-if="attachments && attachments.length > 0")
    .small.text-muted.mb-1
      b-icon.mr-1(icon="paperclip")
      span 附加檔案 ({{ attachments.length }})
    .d-flex.flex-wrap.align-items-center
      b-button.mr-2.mb-1.text-left(
        v-for="(att, aIdx) in attachments"
        :key="`card_att_${dataJson.id}_${aIdx}`"
        size="sm"
        variant="outline-secondary"
        @click="downloadAttachment(channel, dataJson.id, att.name)"
        :title="`點擊下載：${getAttachmentDisplayName(att.name)} (${formatFileSize(att.size)})`"
      )
        b-icon.mr-1(icon="paperclip")
        span.small.text-truncate(style="max-width: 200px; display: inline-block; vertical-align: middle;") {{ getAttachmentDisplayName(att.name) }}
        b-badge.ml-1(variant="light") {{ formatFileSize(att.size) }}

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
    rawAttachments: { type: Array, default: () => [] },
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
      const regex = typeof this.regexpMarkdImage === 'function' ? this.regexpMarkdImage() : this.regexpMarkdImage
      if (regex && typeof regex.test === 'function') {
        regex.lastIndex = 0
        if (regex.test(markd)) {
          markd = this.$utils.convertInlineMarkd(markd)
        }
      }
      const withFiles = this.$utils.replaceFilepath(markd)
      const withCases = this.replaceRegCase ? this.replaceRegCase(withFiles) : withFiles
      return this.formatMessengerLinks ? this.formatMessengerLinks(withCases) : withCases
    },
    attachments () {
      if (Array.isArray(this.rawAttachments) && this.rawAttachments.length > 0) {
        return this.rawAttachments
      }
      if (Array.isArray(this.dataJson?.attachments)) {
        return this.dataJson.attachments
      }
      return []
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
  width: 100%;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
  max-width: 100%;
  ::v-deep .card-header {
    padding: 0.5rem 0.75rem !important;
    font-size: 1rem;
    line-height: 1.5;
  }
  ::v-deep .card-body {
    padding: 0.75rem;
    font-size: 0.95rem;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;

    .card-text,
    p {
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 0 !important;
      margin-bottom: 0.5rem;
      max-width: 100% !important;
      width: 100%;
      color: inherit;
      box-shadow: none !important;

      &:last-child {
        margin-bottom: 0;
      }
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      border-radius: 4px;
      margin: 6px auto;
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
