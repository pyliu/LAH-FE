<template lang="pug">
div
  .d-flex.justify-content-between
    b-link.text-light(@click="reload", title="非必要勿使用") 重新讀取
  lah-reg-b-table(
    ref="tbl",
    :baked-data="rows",
    :fields="fields",
    :busy="isBusy",
    :max-height-offset="135",
    :type="tableSize",
    enable-keyword-filter
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
    tableSize: { type: String, default: 'md' }
  },
  data: () => ({
    keyword: '',
    rows: [],
    fields: [
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '複審人員', sortable: true },
      { key: '收件時間', sortable: true },
      { key: '結案日期', sortable: true }
    ]
  }),
  computed: {
    count () { return this.rows?.length || 0 },
    cacheKey () { return `lah-reg-final-review-table-${this.userId}-${this.begin}-${this.end}` }
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
        type: 'crsms_rm47_case',
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
