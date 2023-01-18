<template lang="pug">
b-img(src="~/assets/img/landsur.jpg" v-bind="mainProps")
</template>

<script>
export default {
  data: () => ({
    mainProps: { blank: false, width: 'auto', height: 'auto', class: '' }
  })
}
</script>

<style lang="scss">
</style>
