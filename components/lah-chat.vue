<template lang="pug">
div
  h5.center.my-5(v-if="$utils.empty(list)")
    b-icon.mr-1(icon="shield-fill-exclamation" variant="warning")
    span 目前未收到任何訊息
  transition-group(v-else name="list" mode="out-in")
    lah-chat-message.mr-1.animate__animated(
      enter-active-class="animate__slideInUp"
      leave-active-class="animate__slideInDown"
      v-for="(item, idx) in list"
      :raw="item" :prev="list[idx - 1]"
      :key="`msg-${idx}`"
      :ref="`msg-${idx}`"
    )
</template>

<script>
export default {
  data: () => ({
    list: []
  }),
  computed: {
  }
}
</script>

<style lang="scss" scoped>
</style>
