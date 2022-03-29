<template lang="pug">
div
  h5.center.my-5(v-if="$utils.empty(list)")
    b-icon.mr-1(icon="shield-fill-exclamation" variant="warning")
    span 目前未收到任何訊息
  transition-group(v-else name="list" mode="out-in")
    lah-chat-message.mr-1.animate__animated(
      enter-active-class="animate__slideInUp",
      leave-active-class="animate__slideInDown",
      v-for="(item, idx) in list",
      :json="item",
      :prev="list[idx - 1]",
      :key="`msg-${idx}`",
      :ref="`msg-${idx}`"
    )
</template>

<script>
export default {
  props: {
    channel: { type: String, default: () => this.myinfo.id, require: true },
    limit: { type: Number, default: 10 }
  },
  data: () => ({
    list: []
  }),
  fetch () {
    if (!this.$utils.empty(this.channel)) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
        type: 'get_notification',
        channel: this.channel,
        limit: this.limit
      }).then(({ data }) => {
        console.warn(data)
        if (this.$utils.statusCheck(data.status)) {
          this.list = [...data.raw]
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
  },
  computed: {
  },
  watch: {
    channel (dontcare) {
      this.$fetch()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
