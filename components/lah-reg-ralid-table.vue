<template lang="pug">
client-only
  b-table.text-center(
    ref="section_search_tbl",
    :items="filteredData",
    :fields="fields",
    :busy="isBusy",
    responsive="sm",
    head-variant="dark",
    primary-key="段代碼",
    select-mode="single",
    selected-variant="success",
    selectable,
    striped,
    hover,
    bordered,
    small,
    no-border-collapse,
    caption-top
  )
    template(v-slot:cell(段代碼)="{ item }")
      span(v-html="highlight(item.段代碼)")
    template(v-slot:cell(段名稱)="{ item }")
      span(v-html="highlight(item.段名稱)")
    template(v-slot:cell(面積)="{ item }")
      span(v-b-tooltip.d400="area(item.面積)") {{ areaM2(item.面積) }}
    template(v-slot:cell(土地標示部筆數)="{ item }") {{ format(item.土地標示部筆數) }} 筆
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    keyword: { type: String, default: '' }
  },
  data: () => ({
    rows: [],
    fields: [
      {
        key: '區代碼',
        sortable: true
      }, {
        key: '區名稱',
        sortable: true
      },
      {
        key: '段代碼',
        sortable: true
      },
      {
        key: '段名稱',
        sortable: true
      },
      {
        key: '面積',
        sortable: true
      },
      {
        key: '土地標示部筆數',
        sortable: true
      }
    ]
  }),
  computed: {
    count () { return this.rows?.length || 0 },
    cacheKey () { return `lah-reg-ralid-table-${this.text}` },
    filteredData () {
      if (!this.$utils.empty(this.keyword)) {
        return this.rows.filter((row) => {
          return row.段代碼.includes(this.keyword) || row.段名稱.includes(this.keyword)
        })
      }
      return this.rows
    }
  },
  watch: {},
  created () {},
  mounted () { this.query() },
  methods: {
    query () {
      this.rows = []
      this.getCache(this.cacheKey).then((rows) => {
        if (rows) {
          this.rows = rows
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'ralid'
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.setCache(this.cacheKey, this.rows, 24 * 60 * 60 * 1000)
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    format (val) {
      return val ? val.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
    },
    area (val) {
      return val ? this.format((val * 3025 / 10000).toFixed(2)) + ' 坪' : ''
    },
    areaM2 (val) {
      return val ? this.format(val) + ' 平方米' : ''
    },
    highlight (text) {
      return this.$utils.highlight(
        text,
        this.keyword,
        'highlight-yellow'
      )
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
