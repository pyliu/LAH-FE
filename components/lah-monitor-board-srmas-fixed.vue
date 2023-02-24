<template lang="pug">
b-card.border-0(no-body)
  .font-weight-bold
    lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}
    b-badge.ml-1.my-auto(:variant="variant", pill) {{ items.length }}
  div(v-for="(item, idx) in items")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(icon="angle-double-right")
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ packedTitle(item) }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.phpTsToAdDateStr(item.bad.timestamp, true)",
        :variant="isToday(item.bad.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.bad.timestamp * 1000) }}
    .truncate.text-muted.small {{ recoverMessage(item) }}
</template>

<script>
import intersection from 'lodash/intersection'
export default {
  name: 'LahMonitorBoardSrmasItem',
  props: {
    titleText: { type: String, default: 'SRMAS項目標題' },
    titleIcon: { type: String, default: 'exclamation-triangle' },
    variant: { type: String, default: 'dark' },
    modalSize: { type: String, default: 'lg' },
    items: {
      type: Array,
      require: true,
      default: () => ([])
    }
  },
  computed: {
    today () { return this.$utils.toADDate(new Date(), 'yyyy-LL-dd') }
  },
  methods: {
    packedTitle (item) {
      const badSubjectTokens = item.bad.subject?.split('-')
      const goodSubjectTokens = item.good.subject?.split('-')
      const commons = intersection(goodSubjectTokens, badSubjectTokens)
      return commons.join('-')
    },
    packedMessage (item) {
      const joins = [`🔴 ${item.bad.message}`, `🟢 ${item.good.message}`]
      return this.$utils.convertMarkd(joins.join('\n***\n'))
    },
    recoverMessage (item) {
      return [...this.packedMessage(item).matchAll(/耗時[^<]+/gm)].join().replace('發生', '回復')
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    popupLogContent (item) {
      this.modal(this.packedMessage(item), {
        title: `${this.titleText} - ${this.packedTitle(item)}`,
        size: this.modalSize,
        html: true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
