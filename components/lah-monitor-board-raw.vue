<template lang="pug">
b-card
  .d-flex.justify-content-between.mb-1
    div
    b-input-group.ml-auto(size="sm", append="天", style="max-width: 80px"): b-input(v-model="daysBefore", type="number", min="1", max="90")
  .center(v-if="messages.length === 0") ⚠ 無資料
  ol(v-else): li(v-for="(item, idx) in messages")
    .d-flex.justify-content-between.font-weight-bold
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        :title="item.subject"
      ) {{ item.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ item.message }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
export default {
  mixins: [lahMonitorBoardBase],
  props: {
    queryType: { type: String, require: true, default: 'subject' },
    keyword: { type: String, require: true, default: '' },
    days: { type: Number, default: 1 }
  },
  data: () => ({
    daysBefore: 0,
    messages: []
  }),
  watch: {
    daysBefore (val) {
      this._reload()
    }
  },
  created () {
    this._reload = this.$utils.debounce(this.reload, 1000)
    this.daysBefore = this.days || 1
  },
  methods: {
    _reload () {
      /* placeholder for debounced reload method */
    },
    reload () {
      this.isBusy = true
      // to update untaken data in sqlite db
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: this.queryType,
          keyword: this.keyword,
          days: this.daysBefore
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.messages = [...data.raw]
          } else {
            this.warning(data.message)
          }
        })
        .catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
