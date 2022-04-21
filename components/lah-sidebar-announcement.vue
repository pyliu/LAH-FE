<template lang="pug">
b-card(no-body).announcement-timeline: lah-notification-timeline(
  :items="timelineItems",
  :loading="isBusy"
)
</template>

<script>
export default {
  data: () => ({
    timelineItems: []
  }),
  mounted () {
    this.loadAnnouncements()
  },
  methods: {
    loadAnnouncements () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: 'announcement',
        limit: 1
      }).then(({ data }) => {
        console.warn(data)
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
