<template>
  <b-container v-cloak fluid>
    <lah-header />
    <Nuxt />
    <lah-footer />
    <lah-sidebar />
  </b-container>
</template>

<script>
export default {
  middleware: [
    'ip'
  ]
}
</script>

<style lang="scss" scoped>
</style>
