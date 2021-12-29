<template lang="pug">
b-card
  .center(v-if="messages.length === 0") ⚠ 無資料
  ul(v-else): li(v-for="(item, idx) in messages")
    .d-flex.justify-content-between.font-weight-bold
      a.truncate-short(
        href="#",
        @click="popupLogContent(item)",
        :title="item.subject"
      ) {{ item.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(icon="clock", regular, :title="$utils.tsToAdDateStr(item.timestamp, true)") {{ displayDatetime(item.timestamp) }}
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
    messages: []
  }),
  created () {
    this.reload()
  },
  methods: {
    reload () {
      this.isBusy = true
      // to update untaken data in sqlite db
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: this.queryType,
          keyword: this.keyword,
          days: this.days
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
@mixin truncateBase() {
  width: calc((100vw - 300px) / 3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.truncate {
  @include truncateBase();
  p {
    margin-bottom: 0px !important;
  }
}
.truncate-short {
  @include truncateBase();
  width: calc((100vw - 350px) / 4);
}
ul {
  padding-left: 21.25px;
}
</style>
