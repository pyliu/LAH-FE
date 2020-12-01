<template>
  <b-container v-cloak fluid>
    <lah-header />
    <Nuxt />
    <lah-footer />
    <lah-sidebar />
  </b-container>
</template>

<script>
import lahHeader from '../components/lah-header.vue'
export default {
  components: { lahHeader },
}
</script>

<style lang="scss" scoped>
</style>
