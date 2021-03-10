<template lang="pug">
  .d-flex.justify-content-between.my-1
    b-pagination.my-auto(
      v-model="value.currentPage"
      :total-rows="totalRows"
      :per-page="value.perPage"
      last-number
      first-number
    )
    .my-auto.text-muted(v-html="caption")
    b-input-group.my-auto.fixed-width(prepend="每頁" append="筆"): b-input(
      v-model="value.perPage"
      type="number"
      min="10"
      number
    )
</template>

<script>
export default {
  props: {
    totalRows: { type: Number, default: 0, require: true },
    value: { type: Object, default: { currentPage: 1, perPage: 25 } },
    caption: { type: String, default: '' }
  },
  data: () => ({
  }),
  watch: {
    value (val) {
      this.$emit('input', val);
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  width: 160px !important;
}
</style>
