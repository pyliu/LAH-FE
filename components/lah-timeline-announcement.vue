<template lang="pug">
b-card(:class="cardCss", no-body, title="最新公告").announcement-timeline
  lah-notification-timeline(
    :items="timelineItems"
  )
  .d-flex.justify-content-end(v-if="!noMore && loadButton")
    b-button-group(size="sm")
      lah-button.border-0(
        v-if="itemCount !== 1"
        icon="undo-alt",
        title="回復預設顯示",
        variant="outline-success",
        action="cycle-alt",
        @click="reset",
        no-icon-gutter
      )
      b-select.border-0(
        v-model="selectedCount",
        :options="[1, 3, 5, 10]"
      )
      lah-button.border-0(
        icon="caret-down",
        title="讀取更多 ... ",
        variant="outline-secondary",
        action="move-fade-ttb",
        @click="loadMore",
        no-icon-gutter
      )

</template>

<script>
export default {
  emit: ['announcement-count'],
  props: {
    initCount: { type: Number, default: 1 },
    loadButton: { type: Boolean, default: true },
    loadCount: { type: Number, default: 1 },
    noBorder: { type: Boolean, default: false }
  },
  data: () => ({
    timelineItems: [],
    selectedCount: 1,
    noMore: false
  }),
  computed: {
    cardCss () {
      return this.noBorder ? ['border-0'] : []
    },
    itemCount () { return this.timelineItems.length },
    lastId () {
      return this.itemCount > 0 ? this.timelineItems[this.itemCount - 1].id : 0
    }
  },
  created () {
    this.selectedCount = this.loadCount
  },
  mounted () {
    this.loadInitBatch()
  },
  methods: {
    loadInitBatch () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: 'announcement',
        limit: this.initCount
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
        this.$emit('announcement-count', { count: this.timelineItems?.length || 0 })
      })
    },
    loadMore (count) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification_before',
        channel: 'announcement',
        before: this.lastId,
        limit: this.selectedCount
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          const loadedCount = data.data_count
          if (loadedCount === 0) {
            this.warning('沒有更多公告')
            this.noMore = true
          } else {
            this.timelineItems = [...this.timelineItems, ...data.raw]
            if (loadedCount < this.selectedCount) {
              this.noMore = true
              this.info('已無更多公告')
            }
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
    },
    reset () {
      this.timelineItems.splice(this.initCount, this.itemCount - 1)
      this.selectedCount = this.loadCount
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
