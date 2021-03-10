<template lang="pug">
  .d-flex.justify-content-between.my-1
    b-pagination.my-auto(
      v-model="value.currentPage"
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
    caption: { type: String, default: '' },
    size: { type: String, default: 'sm' },
    col: { type: String, default: '' }
  },
  computed: {
    gridColumnClass () {
      if (!this.$utils.empty(this.col)) {
        const val = parseInt(this.col)
        if (val > 0 && val < 13) {
          return `col-${val} mr-n3`
        }
      }
      if (this.size === 'lg') {
        return `col-3 mr-n3`
      }
      if (this.size === 'md') {
        return `col-2 mr-n3`
      }
      return 'calc-width'
    }
  },
  watch: {
    value (val) {
      this.$emit('input', val);
    }
  }
}
</script>

<style lang="scss" scoped>
.calc-width {
  width: calc(12.5%);
}
.m0 {
  margin: 0;
}
</style>
