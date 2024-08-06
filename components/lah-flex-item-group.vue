<template lang="pug">
transition-group.lah(name="list-reverse")
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
  display: flex;
  flex-wrap: wrap;
  // justify-content: space-evenly;
  justify-content: space-between;
  > * {
    align-items: stretch; /* Stretch child elements to fill the height */
  }
  > .card {
    width: 31vw;
    // height: calc((100vh - 165px) / 3);
    // overflow: hidden;
    margin-bottom: 1.25rem;
    .card-body {
      // height: calc((100vh - 300px) / 3);
      overflow: auto;
      .card { width: 100%; }
    }
  }
}
</style>
