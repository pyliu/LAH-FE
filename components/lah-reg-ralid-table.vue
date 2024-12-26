<template lang="pug">
client-only
  b-table.text-center(
    v-if="count > 0",
    ref="section_search_tbl",
    :items="json.raw",
    :fields="fields",
    :busy="!json",
    responsive="sm",
    head-variant="dark",
    primary-key="段代碼",
    striped,
    hover,
    bordered,
    small,
    no-border-collapse,
    caption-top
  )
    template(v-slot:cell(面積)="{ item }")
      span(v-b-tooltip.d400="area(item.面積)") {{ areaM2(item.面積) }}
    template(v-slot:cell(土地標示部筆數)="{ item }") {{ format(item.土地標示部筆數) }} 筆
  lah-fa-icon(v-else, icon="exclamation-triangle", variant="danger", size="lg") 查無區段資料
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {},
  data: () => ({
    json: [],
    text: '',
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
    count () { return this.json.data_count || 0 },
    cacheKey () { return `lah-reg-ralid-table-${this.text}` }
  },
  watch: {
    json (val) { this.$utils.warn(val) }
  },
  created () {},
  mounted () { this.query() },
  methods: {
    query () {
      this.json = []
      this.getCache(this.cacheKey).then((json) => {
        if (json) {
          this.json = json
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'ralid',
            text: this.text
          }).then(({ data }) => {
            this.json = data
            this.setCache(this.cacheKey, data, 24 * 60 * 60 * 1000)
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
