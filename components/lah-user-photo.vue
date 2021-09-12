<template lang="pug">
  .center
    b-img-lazy(
      :fluid="fluid"
      :thumbnail="thumbnail"
      :src="src"
      :blank="blank"
      :block="block"
      :left="left"
      :right="right"
      :center="center"
      :rounded="rounded"
    )
</template>

<script>
export default {
  props: {
    userData: { type: Object, default: () => ({}) },
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    fluid: { type: Boolean, default: true },
    thumbnail: { type: Boolean, default: false },
    left: { type: Boolean, default: false },
    right: { type: Boolean, default: false },
    blank: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    center: { type: Boolean, default: false },
    rounded: { type: Boolean, default: false }
  },
  computed: {
    userId () {
      return this.userData.id || this.id
    },
    userName () {
      return this.userData.name || this.name
    },
    src () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userId}&name=${this.userName}&timestamp=${this.timestamp}`
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
