<template lang="pug">
div
  .d-flex.justify-content-between
    b-input-group.col-2.ml-n3(prepend="類別", size="sm"): b-select(v-model="modeVal", :options="modeOpts")
    b-link.text-light(@click="reload", title="非必要勿使用") 重新讀取
  lah-reg-b-table(
    ref="tbl",
    :baked-data="filtered",
    :busy="isBusy",
    :max-height-offset="135",
    :type="tableSize",
    :fields="fields"
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
    tableSize: { type: String, default: 'md' },
    mode: { type: String, default: 'all' }
  },
  data: () => ({
    modeVal: '',
    modeOpts: [
      { value: 'all', text: '全部案件' },
      { value: 'normal', text: '一般案件' },
      { value: 'easy', text: '簡易案件' }
    ],
    keyword: '',
    rows: [],
    fields: [
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '作業人員', sortable: true },
      { key: '收件時間', sortable: true },
      { key: '結案日期', sortable: true }
    ]
  }),
  computed: {
    modeText () {
      if (this.modeVal === 'easy') {
        return '簡易案件'
      } else if (this.modeVal === 'normal') {
        return '一般案件'
      }
      return '全部案件'
    },
    count () { return this.filtered?.length || 0 },
    cacheKey () { return `lah-reg-initial-review-table-${this.userId}-${this.begin}-${this.end}` },
    filtered () {
      if (this.modeVal === 'easy') {
        return this.rows.filter(row => row.RM08 === '9')
      } else if (this.modeVal === 'normal') {
        return this.rows.filter(row => row.RM08 !== '9')
      }
      return this.rows
    }
  },
  watch: {},
  created () { this.modeVal = this.mode },
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
