<template lang="pug">
b-card.border-0(no-body)
  .font-weight-bold #[lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}]
  div(v-for="(item, idx) in items")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(icon="angle-double-right")
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ item.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ item.message }}
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
    isToday (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
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
