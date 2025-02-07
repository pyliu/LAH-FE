<template lang="pug">
div
  .d-flex.justify-content-between
    span 👉 {{ modeText }}
    b-link.text-light(@click="reload", title="非必要勿使用") 重新讀取
  lah-reg-b-table(
    ref="tbl",
    :baked-data="filtered",
    :busy="isBusy",
    :max-height-offset="135",
    :type="tableSize",
    @count-changed="handlePaginationCount"
    enable-keyword-filter
    no-caption
  )
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
    keyword: '',
    rows: []
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
  watch: {},
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
    reset () {
      this.rows = []
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
