<template lang="pug">
VuemojiPicker(@emojiClick="trigger('select', $event)")
</template>

<script>
import { VuemojiPicker, EmojiClickEventDetail } from 'vuemoji-picker'

export default {
  components: { VuemojiPicker },
  data: () => ({})
}
</script>

<style lang="scss" scoped>
</style>
