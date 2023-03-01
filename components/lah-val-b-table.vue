<template lang="pug">
b-table.text-center(
  :ref="refId",
  :busy="busy",
  :items="items",
  :fields="fields",
  :head-variant="headVariant",
  :variant="variant",
  :dark="headVariant === 'dark' ? false : true",
  responsive,
  caption-top,
  selectable,
  striped,
  hover,
  bordered,
  small,
  no-border-collapse,
  select-mode="single",
  selected-variant="success",
  :borderless="false",
  :outlined="false",
  :fixed="false",
  :foot-clone="false"
)
  template(#table-busy): span.ld-txt 讀取中...
  template(#cell(p1ma_parkflag)="{ item }")
    div {{ p1ma_parkflagText(item) }}
</template>

<script>
export default {
  name: 'LahValBTable',
  props: {
    headVariant: { type: String, default: 'dark' },
    variant: { type: String, default: '' },
    items: { type: Array, default: () => [] },
    fields: { type: Array, default: undefined },
    busy: { type: Boolean, default: false },
    refId: { type: String, default: 'LahValBTable' }
  },
  data: () => ({}),
  computed: {},
  methods: {
    selectAllRows () {
      this.$refs[this.refId]?.selectAllRows()
    },
    clearSelected () {
      this.$refs[this.refId]?.clearSelected()
    },
    p1ma_parkflagText (row) {
      if (row.p1ma_parkflag) {
        switch (row.p1ma_parkflag) {
          case '0':
            return '車位單獨計價'
          case '1':
            return '車位已含總額'
          default:
            return row.p1ma_parkflag
        }
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
