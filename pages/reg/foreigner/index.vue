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
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mx-1(
          ref="plus"
          icon="file-circle-plus"
          size="lg"
          title="新建資料"
          variant="primary"
          :disabled="isBusy"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData"
          header="土地參考資訊檔異動情形"
        )
        //- lah-countdown-button(
        //-   ref="countdown"
        //-   title="立即重新讀取"
        //-   variant="outline-secondary"
        //-   badge-variant="secondary"
        //-   icon="sync-alt"
        //-   action="ld-cycle"
        //-   size="lg"
        //-   :milliseconds="cachedMs"
        //-   :disabled="isBusy || isWrongDaysPeriod"
        //-   :busy="isBusy"
        //-   @end="reload"
        //-   @click="reload"
        //-   auto-start
        //-   end-attention
        //-   no-badge
        //- )

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
    size="lg",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 新增項目
    b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中..
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
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
            this.notify(`查詢成功，找到 ${this.rows.length} 筆外國人資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'foreigner_pdf_list',
            keyword: this.keyword,
            start: this.dateRange.begin,
            end: this.dateRange.end,
            reload: this.forceReload
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
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.$refs.add?.show()
    },
    landNumber (item) {
      const val = item.AA49
      if (val) {
        const mainNumber = val.substring(0, 4)
        const subNumber = val.substring(4)
        return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      return ''
    },
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
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
