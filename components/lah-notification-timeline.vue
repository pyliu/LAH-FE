<template lang="pug">
b-list-group: b-list-group-item.flex-column.align-items-start(
  v-for="(item, index) in orderedItems",
  :key="`${item.timestamp}-${item.title}-${index}`"
)
  .item-head(:class="[bootstrapVariant]")
  .item-tail(v-if="index !== itemsCount - 1")
  b-spinner.ml-4(v-if="item.spinner" :variant="bootstrapVariant")
  .item-content(v-if="!item.spinner")
    .d-flex.w-100.justify-content-between.font-weight-bold
      h5.mb-1.truncate(v-html="item.title", :title="textTitle(item.title)")
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="'muted'"
        v-b-tooltip="humanFriendlyTime ? formatFull(item.timestamp) : formatAgo(item.timestamp)"
      ) {{ displayTimestamp(item.timestamp) }}
    .item-description(v-html="cleanText(item.content)")
</template>

<script>
import { format, formatDistanceToNow } from 'date-fns'
// Require tw locale
import { zhTW } from 'date-fns/locale'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

export default {
  name: 'LahNotificationTimeline',
  props: {
    /**
     * [{ timestamp: +new Date(), title: '...', content: '...'}, { ... }, ...]
     */
    items: { type: Array, default: () => ([]) },
    reverse: { type: Boolean, default: false },
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    humanFriendlyTime: { type: Boolean, default: true }
  },
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      if (this.isBusy) {
        return this.items.length + 1
      }
      return this.items.length
    },
    orderedItems () {
      let items = this.items
      if (this.isBusy) {
        items = [...items, { spinner: true, timestamp: 'time', title: 'loading' }]
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
    formatAgo (timestamp) {
      return formatDistanceToNow(timestamp, { addSuffix: true, locale: zhTW })
    },
    formatFull (timestamp) {
      const dateFormat = this.dateFormat || 'yyyy-MM-dd HH:mm:ss'
      return format(timestamp, dateFormat, { locale: zhTW })
    },
    displayTimestamp (timestamp) {
      return this.humanFriendlyTime ? this.formatAgo(timestamp) : this.formatFull(timestamp)
    },
    cleanText (text) {
      return DOMPurify?.sanitize(marked.parse(text?.trimEnd().replaceAll('\n', '   \n').replaceAll('\r', '')))
    },
    textTitle (title) {
      return this.cleanText(title)?.replace(/(<([^>]+)>)/gi, '')
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
</style>
