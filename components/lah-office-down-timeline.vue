<template lang="pug">
b-card.p-3.border-0(no-body)
  .center(v-if="itemsCount === 0") ⚠ 無資料
  b-list-group(v-else)
    transition-group(name="list"): b-list-group-item.flex-column.align-items-start(
      v-for="(item, index) in officesData",
      :key="`${item.timestamp}-${item.id}-${index}`"
    )
      .item-head(:title="`${item.name}`")
      .item-tail(v-if="index !== itemsCount - 1")
      b-spinner.ml-4(v-if="item.spinner" :variant="bootstrapVariant", small)
      .item-content(v-if="!item.spinner")
        .d-flex.w-100.justify-content-between.font-weight-bold
          a.mb-1.truncate(
            :title="cleanTags(item.name)",
            v-html="item.name",
            v-b-toggle="[`content-${index}`, `content-${index}-preview`]",
            href="javascript:void(0)"
          )
          lah-fa-icon.small.my-auto.text-nowrap(
            icon="clock",
            regular,
            variant="muted"
          ) {{ formatTimestamp(item.timestamp) }}

        b-collapse(
          :id="`content-${index}-preview`",
          visible
        ): .small.mb-1.text-muted.w-100.truncate
          |{{ cleanTags(item.message) }}

</template>

<script>
import { formatDistanceToNow } from 'date-fns'
// Require tw locale
import { zhTW } from 'date-fns/locale'

export default {
  name: 'LahOfficeDownTimeline',
  components: {},
  props: {
    reverse: { type: Boolean, default: false },
    dateFormat: { type: String, default: 'yyyy-MM-dd HH:mm:ss' },
    variant: { type: String, default: 'primary' },
    humanFriendlyTime: { type: Boolean, default: true },
    count: { type: String, default: '100' }
  },
  data: () => ({
    officesData: []
  }),
  fetch () {
    this.$axios
      .post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_down',
        count: parseInt(this.count)
      })
      .then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.officesData = [...data.raw]
        }
        this.updated = this.$utils.formatTime(new Date())
      })
      .catch((err) => {
        this.$utils.error(err)
      })
      .finally(() => {
        this.isBusy = false
        this.timeout(this.reload, 5 * 60 * 1000).then((handle) => { this.timer = handle })
      })
  },
  computed: {
    bootstrapVariant () {
      return this.variant || 'primary'
    },
    itemsCount () {
      return this.officesData.length
    }
  },
  watch: {
    officesData (val) {
      console.warn(val)
    }
  },
  mounted () {},
  methods: {
    formatTimestamp (ts) {
      return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true, locale: zhTW })
    },
    displaySender (item) {
      return `${item.sender} ${this.userNames[item.sender]}`
    },
    cleanText (text) {
      const highlighted = this.$utils.highlightPipeline(text)
      const domsafe = this.$utils.convertMarkd(highlighted)
      if (/!\[.+\]\(data:image\/.+\)/gm.test(domsafe)) {
        // convert for images ...
        return this.$utils.convertInlineMarkd(domsafe?.repaceAll('\n', ''))
      }
      return domsafe
    },
    removeBase64Img (text) {
      return text?.replaceAll(/!\[.+\]\(data:image\/.+\)/gm, '')
    },
    cleanTags (message) {
      return this.cleanText(message)?.replace(/(<([^>]+)>)/gi, '')
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
</style>
