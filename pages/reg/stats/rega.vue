<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 登記統計資料案件查詢
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")

        lah-datepicker(
          v-model="dateRange",
          :begin="initBegin",
          :end="initEnd",
          size="lg",
          @input="handleDate"
        )
        lah-button.ml-1(
          icon="magnifying-glass",
          size="lg",
          title="重新搜尋",
          :disabled="isBusy",
          no-icon-gutter
        )
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 {{ site }} 日期區間(預設上個月)的統計資料案件查詢頁面
      ul
        li X!@#@$

  b-table(
    ref="display",
    :items="rows",
    :fields="fields"
  )
</template>

<script>
export default {
  fetchOnServer: false,
  async asyncData ({ isDev, route, store, env, params, query, req, res, redirect, error, $content }) {
    const siteCodeMap = await $content('statsSiteCode').fetch()
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0),
      siteCodeMap
    }
  },
  data: () => ({
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    rows: [],
    fields: []
  }),
  head: {
    title: '登記統計資料案件查詢-桃園市地政局'
  },
  computed: {
    period () {
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    },
    codes () {
      return this.siteCodeMap[this.site]
    },
    boardCount () {
      return Object.values(this.$refs).length
    }
  },
  watch: {
    // dateRange (val) { console.warn(val) }
  },
  created () {
    this.prepareRCODAData()
  },
  mounted () {},
  methods: {
    handleDate (e) {},
    prepareRCODAData () {
      this.$axios.post(this.$consts.API.JSON.MOICAD, {
        type: 'rcoda'
      }).then(({ data }) => {
        this.$utils.warn(data)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.col-md-4 {
  margin-bottom: 1.25rem;
  > .card {
    height: 100%;
  }
}
</style>
