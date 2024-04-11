<template lang="pug">
b-card.border-0(no-body)
  .d-flex.align-items-center.font-weight-bold
    lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}
    b-badge.ml-1.my-auto(:variant="variant", pill) {{ items.length }}
  transition-group(name="list"): div(v-for="(item, idx) in items", :key="`srmas_${idx}`")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(icon="angle-double-right")
      b-link.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ warnTitle(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
    .truncate.text-muted.small(@click="popupLogContent(item)") {{ item.message }}
</template>

<script>
export default {
  name: 'LahMonitorBoardSrmasItem',
  props: {
    titleText: { type: String, default: 'SRMAS項目標題' },
    titleIcon: { type: String, default: 'exclamation-triangle' },
    variant: { type: String, default: 'dark' },
    modalSize: { type: String, default: 'md' },
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
      const warnLines = item.message.split('\r\n')
      // ex:警告-設備無回應
      const warnLineSubject = warnLines[0]
      // ex: 主機：220.1.34.206
      const warnHostLine = warnLines[1]
      return `${warnLineSubject}(${warnHostLine})`
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    popupLogContent (item) {
      this.modal(this.$utils.convertMarkd(item.message), {
        title: `${this.titleText} - ${item.subject}`,
        size: this.modalSize,
        html: true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
