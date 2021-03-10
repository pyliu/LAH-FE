<template lang="pug">
  .d-flex.justify-content-between.my-1
    b-pagination.my-auto(
      v-model="currentPageModel"
      :total-rows="totalRows"
      :per-page="perPage"
      last-number
      first-number
    )
    .my-auto.text-muted(v-html="caption")
    b-input-group.my-auto.fixed-width(prepend="每頁" append="筆"): b-input(
      v-model="perPageModel"
      type="number"
      min="10"
      number
    )
</template>

<script>
export default {
  props: {
    totalRows: { type: Number, default: 0, require: true },
    perPage: { type: Number, default: 25, require: true },
    currentPage: { type: Number, default: 1 },
    caption: { type: String, default: '' }
  },
  data: () => ({
    currentPageModel: 1,
    perPageModel: 25
  }),
  watch: {
    perPageModel (val) {
      this.$emit('update', {perPage: this.perPageModel, currentPage: this.currentPageModel});
    },
    currentPageModel (val) {
      this.$emit('update', {perPage: this.perPageModel, currentPage: this.currentPageModel});
    }
  },
  created () {
    this.currentPageModel = this.currentPage
    this.perPageModel = this.perPage
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  width: 160px !important;
}
</style>
