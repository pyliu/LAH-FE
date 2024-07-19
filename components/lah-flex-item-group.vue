<template lang="pug">
.lah.d-flex.flex-wrap.justify-content-around
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
    width: 31vw;
    height: calc((100vh - 165px) / 3);
    overflow: auto;
    margin-bottom: 1.25rem;
    .card-body {
      // height: calc((100vh - 300px) / 3);
      overflow: auto;
      .card { width: 100%; }
    }
  }
}
</style>
