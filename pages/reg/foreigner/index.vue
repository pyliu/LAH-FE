<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人資料建置及查詢
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 建檔說明
          ol
            li 點選上傳按鈕開啟介面
            li 選取掃描的PDF檔案
            li 輸入備註說明以供後續搜尋使用
            li 點擊上傳按鈕並等待完成
          hr
          h5 搜尋說明
          ol
            li 選擇查詢區間(預設為本月份)
            li 鍵入關鍵字(非必要)
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

      .d-flex.small
        lah-datepicker(v-model="dateRange")
        b-input.h-100.mx-1(
          v-model="keyword",
          placeholder="關鍵字...(非必要)"
        )
        lah-button(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          action="swim"
          variant="outline-dark"
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mx-1(
          ref="plus"
          icon="file-circle-plus"
          size="lg"
          title="新建資料"
          :disabled="isBusy"
          @click="$refs.add.show()"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData"
          header="土地參考資訊檔異動情形"
        )

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition: b-table.text-center(
    v-if="committed"
    ref="table"
    select-mode="single"
    selected-variant="success"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="rows"
    :responsive="'lg'"
    :head-variant="'dark'"
    :fields="fields"
    :per-page="pagination.perPage"
    :current-page="pagination.currentPage"
    :borderless="false"
    :outlined="false"
    :dark="false"
    :fixed="false"
    :foot-clone="false"
    caption-top
    selectable
    striped
    hover
    bordered
    small
    no-border-collapse
  )
    template(#table-busy): span.ld-txt 讀取中...
    template(v-slot:cell(#)="{ item, index, rowSelected }")
      template(v-if="rowSelected")
        span(aria-hidden="true") &check;
        span.sr-only 勾選
      template(v-else)
        span(aria-hidden="true") &nbsp;
        span.sr-only 無勾選
      span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
    template(#cell(RM01)="{ item }"): div: b-link(@click="popup(item)").
      {{ item.RM01 }}-{{ item.RM02 }}-{{ item.RM03 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
  b-modal(
    ref="add",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 新增項目
    lah-reg-foreigner-case-addition
</template>

<script>
export default {
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    keyword: '',
    rows: [],
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    fields: [
      '#',
      {
        key: 'RM01',
        label: '收件案號',
        sortable: true
      }
    ],
    maxHeight: 600
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
        return
      }

      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload !== true && json) {
          this.rows = json.raw
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'foreigner_pdf_list',
            keyword: this.keyword,
            start: this.dateRange.begin,
            end: this.dateRange.end
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      })
    }
  },
  head: {
    title: '外國人資料建置及查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.rows.length },
    cacheKey () { return `query_land_ref_change_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () { return `找到 ${this.queryCount} 筆「外國人」資料` },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    xlsxData () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.rows.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            obj[this.getLabel(key)] = value
          }
        }
        return obj
      })
      return jsons
    }
  },
  fetchOnServer: false,
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'br' })
      }
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.forceReload = false
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.$refs.add?.show()
    },
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
