<template lang="pug">
b-card.p-3.border-0(no-body)
  .center(v-if="itemsCount === 0") ⚠ 無資料
  b-list-group(v-else)
    transition-group(name="list"): b-list-group-item.flex-column.align-items-start(
      v-for="(item, index) in orderedItems",
      :key="`${item.create_datetime}-${item.title}-${index}`"
    )
      .item-head(:class="[itemVariant(item)]")
      .item-tail(v-if="index !== itemsCount - 1")
      b-spinner.ml-4(v-if="item.spinner" :variant="bootstrapVariant", size="sm")
      .item-content(v-if="!item.spinner")

        .d-flex.w-100.justify-content-between.font-weight-bold
          a.mb-1.truncate(
            :title="cleanTags(item.title)",
            v-html="item.title",
            v-b-toggle="[`content-${index}`, `content-${index}-preview`]",
            href="javascript:void(0)"
          )
          lah-fa-icon.small.my-auto.text-nowrap(
            icon="clock",
            regular,
            :title="item.create_datetime",
            :variant="'muted'"
            v-b-tooltip="item.create_datetime"
          ) {{ displayTimestamp(item.create_datetime) }}

        b-collapse(
          :id="`content-${index}-preview`",
          visible
        ): .small.mb-1.text-muted.w-100.truncate
          |{{ cleanTags(item.content) }}

        b-collapse(:id="`content-${index}`")
          .item-description.timeline-img(
            @click="handleContentClick($event)",
            v-html="cleanText(item.content)"
          )
          .d-flex.justify-content-end.small.text-muted.mt-2
            b-button(
              variant="outline-secondary",
              size="sm",
              title="顯示使用者資訊",
              @click="showUserCard(item)"
            ) {{ displaySender(item) }}
</template>

<script>
import { formatDistanceToNow } from 'date-fns'
// Require tw locale
import { zhTW } from 'date-fns/locale'
import lahUserCard from '~/components/lah-user-card.vue'

export default {
  name: 'LahNotificationTimeline',
  components: { lahUserCard },
  props: {
    /**
     * [{ create_datetime: '2022-04-20 15:16:00', title: '...', content: '...'}, { ... }, ...]
     */
    items: { type: Array, default: () => ([]) },
    reverse: { type: Boolean, default: false },
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    humanFriendlyTime: { type: Boolean, default: true },
    loading: { type: Boolean, default: false }
  },
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      if (this.loading) {
        return this.items.length + 1
      }
      return this.items.length
    },
    orderedItems () {
      let items = this.items
      if (this.loading) {
        items = [...items, { spinner: true, create_datetime: 'time', title: 'loading' }]
      }
      if (this.reverse) {
        items.reverse()
      }
      return items
    }
  },
  mounted () {
    console.log(this.orderedItems)
  },
  methods: {
    itemVariant (item) {
      const priority = parseInt(item.priority) || 0
      switch (priority) {
        case 0: return 'danger'
        case 1: return 'warning'
        case 2: return 'info'
        default: return 'secondary'
      }
    },
    displayTimestamp (datetimeStr) {
      return this.humanFriendlyTime ? formatDistanceToNow(Date.parse(datetimeStr), { addSuffix: true, locale: zhTW }) : datetimeStr
    },
    displaySender (item) {
      return `${item.sender} ${this.userNames[item.sender]}`
    },
    cleanText (text) {
      const domsafe = this.$utils.convertMarkd(text)
      // convert for images ...
      return this.$utils.convertInlineMarkd(domsafe?.replaceAll('\n', ''))
    },
    removeBase64Img (text) {
      return text?.replaceAll(/!\[.+\]\(data:image\/.+\)/gm, '')
    },
    cleanTags (title) {
      return this.cleanText(title)?.replace(/(<([^>]+)>)/gi, '')
    },
    handleContentClick (event) {
      if (this.$utils.equal(event.target.tagName, 'IMG')) {
        this.modal(this.$createElement('IMG', {
          attrs: { src: event.target.src },
          class: ['img-thumbnail', 'img-fluid', 'rounded', 'mx-auto', 'd-block']
        }), {
          size: 'lg',
          title: `顯示圖片 - alt: ${event.target.alt}`
        })
      }
    },
    showUserCard (item) {
      const h = this.$createElement
      this.modal(h('lah-user-card', {
        props: { id: item.sender }
      }), {
        title: `使用者資訊 - ${this.userNames[item.sender]}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.list-group-item {
  position: relative;
  border: none;
  margin: 0;
  padding: 0 0 20px;
  box-sizing: border-box;
  padding-bottom: 0;
}
.item-head {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-radius: 100px;
}
.item-tail {
  position: absolute;
  top: 10px;
  left: 4px;
  height: calc(100% - 10px);
  border-left: 2px solid #e8e8e8;
}
.item-content {
  position: relative;
  top: -6px;
  margin: 0 0 0 18px;
  word-break: break-word;
}
.item-description {
  display: block;
  text-align: left;
}
.primary {
  background-color: #007bff;
  color: #007bff;
  border-color: #007bff;
}
.secondary {
  background-color: #6c757d;
  color: #6c757d;
  border-color: #6c757d;
}
.success {
  background-color: #28a745;
  color: #28a745;
  border-color: #28a745;
}
.info {
  background-color: #17a2b8;
  color: #17a2b8;
  border-color: #17a2b8;
}
.warning {
  background-color: #ffc107;
  color: #ffc107;
  border-color: #ffc107;
}
.danger {
  background-color: #dc3545;
  color: #dc3545;
  border-color: #dc3545;
}
.light {
  background-color: #f8f9fa;
  color: #f8f9fa;
  border-color: #f8f9fa;
}
.dark {
  background-color: #343a40;
  color: #343a40;
  border-color: #343a40;
}
</style>
