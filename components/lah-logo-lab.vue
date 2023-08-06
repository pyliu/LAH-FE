<template lang="pug">
b-img(src="~/assets/img/landlab.jpg" v-bind="mainProps")
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
