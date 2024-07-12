<template lang="pug">
.d-flex.flex-wrap.justify-content-between.lah
  slot
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {},
  data: () => ({}),
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.lah {
  .card {
    width: 32vw;
    // width: calc((100vw - 300px) / 3);
    height: calc((100vh - 80px) / 3);
    overflow: auto;
    margin-bottom: 1.25rem;
  }
}
</style>
