<template lang="pug">
b-card.border-0(no-body)
  .d-flex.align-items-center.h6
    lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}
    b-badge.ml-1.my-auto(:variant="variant", pill) {{ items.length }}
  div(v-for="(item, idx) in items")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(icon="angle-double-right")
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ warnTitle(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.bad.timestamp) ? 'success' : 'muted'",
        :seconds="item.bad.timestamp"
      )
    .truncate.text-muted.small {{ recoverMessage(item) }}
</template>

<script>
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
    warnTitle (item) {
      const warnLines = item.bad.message.split('\r\n')
      // ex:警告-設備無回應
      const warnLineSubject = warnLines[0]
      // ex: 主機：220.1.34.206
      const warnHostLine = warnLines[1]
      return `${warnLineSubject}(${warnHostLine})`
    },
    packedMessage (item) {
      const joins = [`🔴 ${item.bad.message}`, `🟢 ${item.good.message}`]
      return this.$utils.convertMarkd(joins.join('\n***\n'))
    },
    recoverMessage (item) {
      const goodLines = item.good.message.split('\r\n')
      return goodLines[goodLines.length - 1]
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    popupLogContent (item) {
      this.modal(this.packedMessage(item), {
        title: `${this.titleText} - ${this.warnTitle(item)}`,
        size: this.modalSize,
        html: true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
