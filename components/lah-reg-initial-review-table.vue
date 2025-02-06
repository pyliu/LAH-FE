<template lang="pug">
div
  .d-flex.justify-content-between
    span {{ modeText }}
    b-link(@click="reload") 重新讀取
  lah-transition: lah-pagination(
    v-if="count > pagination.perPage"
    v-model="pagination",
    :total-rows="count"
    :caption="`找到 ${count} 筆資料`"
  )
  lah-reg-b-table(
    ref="tbl",
    :baked-data="filtered",
    :busy="isBusy",
    :max-height-offset="135"
    :per-page="pagination.perPage",
    :current-page="pagination.currentPage",
    :type="tableSize",
    no-caption
  )
    //- template(v-slot:cell(段代碼)="{ item }")
    //-   span(v-html="highlight(item.段代碼)")
    //- template(v-slot:cell(段名稱)="{ item }")
    //-   span(v-html="highlight(item.段名稱)")
    //- template(v-slot:cell(面積)="{ item }")
    //-   span(v-b-tooltip.d400="area(item.面積)") {{ areaM2(item.面積) }}
    //- template(v-slot:cell(土地標示部筆數)="{ item }") {{ format(item.土地標示部筆數) }} 筆
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {
    userId: { type: String, default: '', require: true },
    begin: { type: String, default: '' },
    end: { type: String, default: '' },
    tableSize: { type: String, default: 'md' },
    mode: { type: String, default: 'all' }
  },
  data: () => ({
    rows: [],
    pagination: {
      perPage: 15,
      currentPage: 1
    }
  }),
  computed: {
    modeText () {
      if (this.mode === 'easy') {
        return '簡易案件'
      } else if (this.mode === 'normal') {
        return '一般案件'
      }
      return '全部案件'
    },
    count () { return this.filtered?.length || 0 },
    cacheKey () { return `lah-reg-initial-review-table-${this.userId}` },
    filtered () {
      if (this.mode === 'easy') {
        return this.rows.filter(row => row.RM08 === '9')
      } else if (this.mode === 'normal') {
        return this.rows.filter(row => row.RM08 !== '9')
      }
      return this.rows
    }
  },
  watch: {
    // rows (val) { this.$utils.warn(val) }
  },
  created () {},
  mounted () { this.query() },
  methods: {
    query (force = false) {
      this.getCache(this.cacheKey).then((rows) => {
        if (rows && !force) {
          this.reset()
          this.rows = [...rows]
        } else {
          this.reload()
        }
      })
    },
    reload () {
      this.reset()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsms_rm45_case',
        user_id: this.userId,
        st: this.begin,
        ed: this.end
      }).then(({ data }) => {
        this.rows = data.baked || []
        this.setCache(this.cacheKey, this.rows, 24 * 60 * 60 * 1000)
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    highlight (text) {
      return this.$utils.highlight(
        text,
        this.keyword,
        'highlight-yellow'
      )
    },
    reset () {
      this.rows = []
      this.pagination.currentPage = 1
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
