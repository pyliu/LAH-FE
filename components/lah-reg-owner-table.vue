<template lang="pug">
div
  lah-transition: lah-pagination(
    v-if="count > pagination.perPage"
    v-model="pagination",
    :total-rows="count"
    :caption="`找到 ${count} 筆資料`"
  )
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
    :items="rows",
    :fields="fieldsToUse",
    :per-page="pagination.perPage",
    :current-page="pagination.currentPage",
    :busy="isBusy"
  )
    template(#table-busy)
    template(#cell(序號)="data")
      template(v-if="data.rowSelected")
        span(aria-hidden="true") &check;
        span(class="sr-only") Selected
      template(v-else)
        span(aria-hidden="true") &nbsp;
        span(class="sr-only") Not selected
      span {{ (pagination.perPage * (pagination.currentPage - 1)) + data.index + 1 }}
</template>
<script>

export default {
  emit: [],
  component: {},
  props: {
    raw: { type: Array, default: () => [] },
    tableSize: { type: String, default: 'xl' },
    tableType: { type: String, default: 'land' }
  },
  data: () => ({
    keyword: '',
    rows: [],
    fields: [
      { key: '資料集代號', sortable: true },
      { key: '段號', sortable: true },
      { key: '段名', sortable: true },
      { key: '地號', sortable: true },
      { key: '建號', sortable: true },
      { key: '登次', sortable: true },
      { key: '權利範圍類別', sortable: true },
      { key: '分母', sortable: true },
      { key: '分子', sortable: true },
      { key: '所有權人統編', sortable: true },
      { key: '所有權人姓名', sortable: true },
      { key: '登記日期', sortable: true },
      { key: '登記原因發生日期', sortable: true },
      { key: '住址', sortable: true },
      { key: '其他登記事項代碼', sortable: true },
      { key: '其他登記事項內容', sortable: true },
      { key: '出生日期', sortable: true }
    ],
    pagination: {
      perPage: 6,
      currentPage: 1
    }
  }),
  computed: {
    count () { return this.rows?.length || 0 },
    cacheKey () { return `lah-reg-${this.tableType}-owner-table` },
    landFields () {
      return this.fields.filter(f => f.key !== '建號')
    },
    buildingFields () {
      return this.fields.filter(f => f.key !== '地號')
    },
    fieldsToUse () {
      return this.tableType === 'land' ? this.landFields : this.buildingFields
    }
  },
  watch: {
    raw (newVal) {
      this.rows = [...newVal]
    }
  },
  created () {},
  mounted () {
    this.rows = [...this.raw]
  },
  methods: {
    reset () {
      this.rows = []
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
