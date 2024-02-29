<template lang="pug">
div
  b-table.text-center.s-90(
    ref="tbl",
    striped,
    hover,
    responsive,
    bordered,
    caption-top,
    no-border-collapse,
    small,
    head-variant="dark",
    selectable,
    select-mode="single",
    selected-variant="success",
    :items="logs",
    :fields="fields",
    :busy="isBusy || busy",
    :sticky-header="`${maxHeight}px`"
  )
    template(#table-busy)
    template(#cell(MS03)="data")
    template(#cell(收件字號)="data")
    template(#cell(初審人員)="data")
    template(#cell(作業人員)="data")
    template(#cell(收件時間)="data")
    template(#cell(限辦期限)="data")
  b-modal(ref="detail", hide-footer, centered, no-close-on-backdrop, scrollable)
    template(#modal-title)
</template>

<script>
export default {
  name: 'LahAdmSmslogTable',
  props: {
    /** expected raw log schema
     * MS30 傳送狀態
     *   I：補正, D：駁回, C：延期複丈, F：結案
     * MS31 傳送結果
     *   S：成功, F：失敗
     * MS_TYPE 案件種類
     *   R：登記, S：複丈
     */
    logs: { type: Array, default: () => ([]) },
    busy: { type: Boolean, default: false }
  },
  data: () => ({
    fields: [
      { key: 'MS03', label: '收件年', sortable: true },
      { key: 'MS04_1', label: '收件字', sortable: true },
      { key: 'MS04_2', label: '收件號', sortable: true },
      { key: 'MS07_1', label: '傳送日期', sortable: true },
      { key: 'MS07_2', label: '傳送時間', sortable: true },
      { key: 'MS14', label: '手機號碼', sortable: true },
      { key: 'MS_MAIL', label: '電子郵件', sortable: true },
      { key: 'MS30', label: '傳送狀態', sortable: true },
      { key: 'MS31', label: '傳送結果', sortable: true },
      { key: 'MS33', label: '傳送紀錄', sortable: true },
      { key: 'MS_TYPE', label: '傳送種類', sortable: true },
      { key: 'MS_NOTE', label: '簡訊內容', sortable: true }
    ],
    maxHeight: 600
  }),
  computed: {
    count () { return this.logs?.length || 0 },
    maxHeightStyle () { return `max-height: ${this.maxHeight}px` }
  },
  watch: {},
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - this.maxHeightOffset)
  },
  methods: {
    distanceFromNow (val) {
      const head = val.substring(0, 3)
      const adHead = 1911 + parseInt(val)
      const adDate = val.replace(head, adHead)
      return this.$utils.formatDistanceToNow(+new Date(adDate))
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
