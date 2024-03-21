<template lang="pug">
lah-button.mx-1(
  :variant="variant",
  :title="title"
  @click="emitClick",
  pill,
  no-icon
)
  b-badge(variant="light", pill) {{ count }}
</template>

<script>
export default {
  props: {
    count: { type: Number, default: 0 },
    variant: { type: String, default: 'secondary' },
    title: { type: String, default: '' }
  },
  computed: {},
  methods: {
    emitClick (evt) {
      this.$emit('click', evt)
      evt.stopPropagation()
    }
  }
}
</script>
<style lang="scss" scoped>

</style>
