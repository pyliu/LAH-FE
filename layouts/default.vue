<template lang="pug">
  b-container(v-cloak fluid)
    Nuxt
    lah-footer
</template>

<script>
export default {
  created () {
    // this.$acts.cancel('page cahnged ... previous axios request has been cancelled!')
    this.login()
  }
}
</script>

<style lang="scss" scoped>
</style>
