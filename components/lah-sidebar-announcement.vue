<template lang="pug">
b-card(no-body, title="最新公告").announcement-timeline
  lah-notification-timeline(
    :items="timelineItems",
    :loading="isBusy"
  )
  .d-flex.justify-content-end(v-if="!noMore && loadButton")
    b-button-group(size="sm")
      lah-button.border-0(
        icon="caret-down",
        size="sm",
        title="讀取更多 ... ",
        variant="outline-secondary",
        action="move-fade-ttb",
        @click="loadMore",
        no-icon-gutter
      )
      b-select.border-0(
        v-model="selectedCount",
        size="sm",
        :options="[1, 3, 5]"
      )

</template>

<script>
export default {
  props: {
    loadButton: { type: Boolean, default: true },
    loadCount: { type: Number, default: 1 }
  },
  data: () => ({
    timelineItems: [],
    selectedCount: 1,
    noMore: false
  }),
  computed: {
    itemCount () { return this.timelineItems.length },
    lastId () {
      return this.itemCount > 0 ? this.timelineItems[this.itemCount - 1].id : 0
    }
  },
  created () {
    this.selectedCount = this.loadCount
  },
  mounted () {
    this.loadFirst()
  },
  methods: {
    loadFirst () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: 'announcement',
        limit: 1
      }).then(({ data }) => {
        /**
         * message example: {
            content: "⚠️ 為因應連續假期 ... "
            create_datetime: "2022-04-01 15:07:24"
            expire_datetime: ""
            flag: 0
            from_ip: "192.168.XX.XX"
            id: 29
            priority: 2
            sender: "HAXXXXXXXX"
            title: "通報 ..."
          }
         */
        if (this.$utils.statusCheck(data.status)) {
          this.timelineItems = [...this.timelineItems, ...data.raw]
        } else {
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    loadMore (count) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification_before',
        channel: 'announcement',
        before: this.lastId,
        limit: this.loadCount
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          if (data.data_count === 0) {
            this.warning('沒有更多公告')
            this.noMore = true
          } else {
            this.timelineItems = [...this.timelineItems, ...data.raw]
          }
        } else {
          this.$utils.warn(data.message)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.announcement-timeline {
  font-size: 1rem;
  color: black;
  // padding: 5px;
}
</style>
