<template lang="pug">
  .d-flex.justify-content-between.my-1
    b-pagination.my-auto(
      v-model="current"
      :total-rows="totalRows"
      :per-page="value.perPage"
      :size="size"
      last-number
      first-number
    )
    .my-auto.text-muted(v-html="caption")
    b-input-group.my-auto.m0(
      prepend="每頁"
      append="筆"
      :size="size"
      :class="gridColumnClass"
    ): b-input.text-right(
      v-model="pageCount"
      type="number"
      min="10"
      number
    )
</template>

<script>
export default {
  props: {
    totalRows: { type: Number, default: 0, require: true },
    value: { type: Object, default: { currentPage: 1, perPage: 1 }, required: true},
    caption: { type: String, default: '' },
    size: { type: String, default: 'md' }
  },
  data: () => ({
    current: 1,
    pageCount: 23
  }),
  computed: {
    gridColumnClass () {
      if (this.size === 'lg') {
        return `lg-width`
      }
      if (this.size === 'sm') {
        return `sm-width`
      }
      return 'md-width'
    }
  },
  watch: {
    current (val) {
      this.$emit("input", { ...this.value, currentPage: val })
    },
    pageCount (val) {
      this.$emit("input", { ...this.value, perPage: val })
    }
  }
}
</script>

<style lang="scss" scoped>
.calc-width {
  width: calc(12.5%);
}
.sm-width {
  width: 135px !important;
}
.md-width {
  width: 165px !important;
}
.lg-width {
  width: 210px !important;
}
</style>
