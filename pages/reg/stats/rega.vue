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
          @click="getRegaData(true)",
          no-icon-gutter
        )
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 {{ site }} 日期區間(預設上個月)的統計資料案件查詢頁面
      ul
        li X!@#@$

  b-table(
    ref="display",
    :items="items",
    :fields="fields",
    :busy="isBusy",
    :responsive="'lg'",
    :head-variant="'dark'",
    primary-key="ITEM",
    class="text-center",
    select-mode="single",
    selected-variant="success",
    caption-top,
    selectable,
    striped,
    hover,
    bordered,
    small,
    @row-selected="rowSelected"
  )
    template(#cell(ITEM_NAME)="{ item }")
      b-link(
        title="點擊開啟案件列表",
        @click="caseList(item)"
      ).d-flex.justify-content-between.align-items-center
        .col-4(v-for="(token, idx) in item.ITEM_NAME.split('/')", :key="`${item.ITEM}_${idx}`") {{ token }}

  b-modal(
    ref="cases",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) {{ selectedRow?.ITEM_NAME || '統計案件資料列表' }} ({{ selectedRow?.COUNT }}件)
    lah-pagination(
      v-if="selectedCaseCount > pagination.perPage"
      v-model="pagination",
      :total-rows="selectedCaseCount",
      @input="handlePaginationInput"
    )
    b-table(
      :items="selectedCases",
      :fields="selectedFields",
      :busy="isBusy",
      :head-variant="'dark'",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      class="text-center",
      caption-top,
      striped,
      hover,
      bordered,
      small
    )
      template(#cell(ID)="{ item }")
        b-link(@click="popup(item.ID)") {{ $utils.caseId(item.ID) }}
      template(#cell(RA40)="{ item }")
        div {{ $utils.addDateDivider(item.RA40) }}
</template>

<script>
import lahRegCaseDetail from '~/components/lah-reg-case-detail.vue';
export default {
  fetchOnServer: false,
  async asyncData ({ isDev, route, store, env, params, query, req, res, redirect, error, $content }) {
    const itemMap = await $content('rega').fetch()
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0),
      itemMap
    }
  },
  data: () => ({
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    rows: [],
    fields: [
      { key: 'ITEM_NAME', label: '工作項目', sortable: true, thStyle: { width: '33vw' } },
      { key: 'ITEM', label: '項目', sortable: true },
      { key: 'COUNT', label: '件數', sortable: true },
      { key: 'LAND_COUNT', label: '土地筆數', sortable: true },
      { key: 'LAND_AREA', label: '土地面積', sortable: true },
      { key: 'BUILD_COUNT', label: '建物筆數', sortable: true },
      { key: 'BUILD_AREA', label: '建物面積', sortable: true }
    ],
    groupByItem: {},
    selectedRow: {},
    selectedFields: [
      { key: 'ID', label: '案號', sortable: true },
      { key: 'RA40', label: '註記日期', sortable: true }
    ],
    pagination: {
      perPage: 20,
      currentPage: 1
    }
  }),
  head: {
    title: '登記統計資料案件查詢-桃園市地政局'
  },
  computed: {
    period () {
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    },
    items () {
      if (!this.$utils.empty(this.groupByItem)) {
        const tmp = []
        Object.keys(this.groupByItem).forEach((key) => {
          // this.$utils.warn(key, this.groupByItem[key])
          tmp.push({
            ITEM_NAME: this.itemMap[key],
            ITEM: key,
            COUNT: this.groupByItem[key].length,
            LAND_COUNT: this.groupByItem[key].reduce((acc, currentItem) => {
              return parseInt(acc) + parseInt(currentItem.RECA)
            }, 0),
            LAND_AREA: this.groupByItem[key].reduce((acc, currentItem) => {
              let f = (parseFloat(acc) + parseFloat(currentItem.RA10)).toFixed(2)
              // Convert to string and trim trailing .00 if exists
              if (f.endsWith('.00')) {
                f = parseInt(f).toString()
              } else {
                // Remove trailing zero if there's one
                f = f.replace(/\.0+$/, '')
              }
              return f
            }, 0),
            BUILD_COUNT: this.groupByItem[key].reduce((acc, currentItem) => {
              return parseInt(acc) + parseInt(currentItem.RECD)
            }, 0),
            BUILD_AREA: this.groupByItem[key].reduce((acc, currentItem) => {
              let f = (parseFloat(acc) + parseFloat(currentItem.RA08)).toFixed(2)
              // Convert to string and trim trailing .00 if exists
              if (f.endsWith('.00')) {
                f = parseInt(f).toString()
              } else {
                // Remove trailing zero if there's one
                f = f.replace(/\.0+$/, '')
              }
              return f
            }, 0),
            CASES: this.groupByItem[key].reduce((acc, currentItem) => {
              acc.push({
                ID: `${currentItem.RA03}${currentItem.RA04_1}${currentItem.RA04_2}`,
                RA40: currentItem.RA40
              })
              return acc
            }, [])
          })
        })
        return tmp
      }
      return []
    },
    selectedCases () { return this.selectedRow?.CASES || [] },
    selectedCaseCount () { return this.selectedCases.length }
  },
  watch: {
    // items (val) { this.$utils.warn(val) },
    // selectedRow (val) { this.$utils.warn(val) }
  },
  created () {},
  mounted () {
    setTimeout(() => this.getRegaData(false), 400)
  },
  methods: {
    handleDate (e) {},
    prepareRCODAData () {
      this.$axios.post(this.$consts.API.JSON.MOICAD, {
        type: 'rcoda'
      }).then(({ data }) => {
        this.$utils.warn(data)
      })
    },
    getRegaData (reload = false) {
      if (!this.isBusy) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.MOICAD, {
          type: 'rega',
          st: this.dateRange.begin,
          ed: this.dateRange.end,
          reload
        }).then(({ data }) => {
          this.groupByItem = { ...this.$utils.groupBy(data.raw, 'ITEM') }
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    rowSelected (rows) {
      if (Array.isArray(rows) && rows.length > 0) {
        this.selectedRow = rows[0]
        this.pagination.currentPage = 1
        this.$refs.cases?.show()
      }
    },
    popup (ID) {
      const id = this.$utils.caseId(ID)
      this.modal(this.$createElement(lahRegCaseDetail, {
        props: {
          caseId: id
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.timeout(() => this.warning(`⚠ 無法找到 ${this.$utils.caseId(id)} 登記案件資料。`), 400)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(id)}`,
        size: 'xl'
      })
    },
    caseList (item) {
      this.selectedRow = item
      this.pagination.currentPage = 1
      this.$refs.cases?.show()
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('rega-perPage', payload.perPage)
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
