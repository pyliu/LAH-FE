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
    userData: { type: Object, required: true },
    fluid: { type: Boolean, default: true },
    thumbnail: { type: Boolean, default: false }
  },
  computed: {
    src () {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${this.userData['id']}&name=${this.userData['name']}`
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
