<template lang="pug">
  b-img(src="~/assets/img/tyland.png" v-bind="mainProps")
</template>

<script>
export default {
  data () {
    return {
      mainProps: { blank: false, width: 220, height: 220, class: 'mb-2 lah-shadow' }
    }
  }
}
</script>

<style lang="scss">
</style>
