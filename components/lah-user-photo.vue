<template>
  <div class="center">
    <b-img
      :fluid="fluid"
      :thumbnail="thumbnail"
      :src="src"
    />
  </div>
</template>

<script>
export default {
  props: {
    userData: { type: Object, default: () => ({}) },
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    fluid: { type: Boolean, default: true },
    thumbnail: { type: Boolean, default: false }
  },
  computed: {
    userId () {
      return this.userData['id'] || this.id
    },
    userName () {
      return this.userData['name'] || this.name
    },
    src () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userId}&name=${this.userName}`
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
