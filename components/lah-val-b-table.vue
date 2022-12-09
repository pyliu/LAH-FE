<template lang="pug">
b-table.text-center(
  :ref="refId",
  :busy="busy",
  :items="items",
  :fields="fields",
  :head-variant="headVariant",
  :variant="variant",
  caption-top,
  selectable,
  striped,
  hover,
  bordered,
  small,
  no-border-collapse,
  select-mode="single",
  selected-variant="success",
  :responsive="'lg'",
  :borderless="false",
  :outlined="false",
  :dark="headVariant === 'dark' ? false : true",
  :fixed="false",
  :foot-clone="false"
)
  template(#table-busy): span.ld-txt 讀取中...
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
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
