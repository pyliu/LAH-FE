<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 土地參考資訊檔異動
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 資料庫搜尋說明
          ul
            li 搜尋土地參考資訊檔異動情形的資料
            li 請勿搜尋#[strong.text-danger 過大區間]，可能造成讀取時間過長而失敗
          hr
          h5 請參照下列步驟搜尋
          ol
            li 選擇查詢區間
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

      .d-flex.small
        lah-datepicker.mr-1(v-model="dateRange")

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
          icon="file-excel",
          size="lg",
          title="匯出EXCEL",
          variant="outline-success",
          action="move-fade-ltr",
          regular,
          no-icon-gutter,
          :disabled="!dataReady",
          @click="xlsx"
        )
        lah-countdown-button(
          ref="countdown"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :disabled="isBusy || isWrongDaysPeriod"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center(
      v-if="committed"
      id="land-ref-table"
      ref="table"
      caption-top
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="rows"
      :responsive="'lg'"
      :striped="true"
      :hover="true"
      :bordered="true"
      :borderless="false"
      :outlined="false"
      :small="true"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      :no-border-collapse="true"
      :head-variant="'dark'"
      :fields="fields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
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
      template(#cell(RM56_1)="{ item: { RM56_1 } }"): .text-nowrap {{ humanTWDate(RM56_1) }}
      template(#cell(AA48)="{ item }"): .text-nowrap {{ item.AA48 }}:{{ item.AA48_CHT }}
      template(#cell(AA49)="{ item }"): .text-nowrap {{ landNumber(item) }}
      template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
      template(#cell(AS_TYPE)="{ item }"): .text-nowrap {{ item.AS_TYPE }}:{{ item.AS_TYPE_CHT }}
      template(#cell(GG00)="{ item }"): .text-nowrap {{ item.GG00 }}:{{ item.GG00_CHT }}
      template(#cell(GG01)="{ item }"): .text-nowrap {{ item.GG01 }}
      template(#cell(GG30_2)="{ item }"): .text-left.content-max-width {{ item.GG30_2 }}
      template(#cell(AF08)="{ item }"): .text-nowrap {{ item.AF08 }}:{{ item.AF08_CHT }}
      template(#cell(AF09)="{ item }"): .text-left.content-max-width {{ item.AF09 }}
  b-modal(
    :id="modalId"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedId) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:case-id="clickedId" @ready="modalLoading = !$event.detail")
</template>

<script>
export default {
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalId: 'this should be an uuid',
    modalLoading: true,
    clickedId: undefined,
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
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'RM56_1',
        label: '校對日期',
        sortable: true
      },
      {
        key: 'AA48',
        label: '段代碼',
        sortable: true
      },
      {
        key: 'AA49',
        label: '地號',
        sortable: true
      },
      {
        key: 'AS_TYPE',
        label: '異動別',
        sortable: true
      },
      {
        key: 'GG30_2',
        label: '其他登記事項',
        sortable: true
      },
      {
        key: 'AF08',
        label: '土參類別',
        sortable: true
      },
      {
        key: 'AF09',
        label: '土參內容',
        sortable: true
      }
    ],
    maxHeight: 600,
    warnDays: 730
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
            this.notify(`查詢成功，找到 ${this.rows.length} 筆土地參考資訊檔異動情形資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'land_ref_change',
            start: this.dateRange.begin,
            end: this.dateRange.end,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remain_s = data.cache_remaining_time
            const remain_ms = remain_s * 1000
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, data, remain_ms)
              if (this.$refs.countdown) {
                this.$refs.countdown.setCountdown(remain_ms)
                this.$refs.countdown.startCountdown()
              }
            }
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
    title: '土地參考資訊檔異動情形查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.rows.length },
    cacheKey () { return `query_land_ref_change_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () { return `找到 ${this.queryCount} 筆「土地參考資訊檔」案件異動資料` },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 }
  },
  fetchOnServer: false,
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
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
      this.modalLoading = true
      this.clickedId = `${data.RM01}${data.RM02}${data.RM03}`
      this.showModalById(this.modalId)
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
    },
    xlsx () {
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
      this.downloadXlsx('土地參考資訊檔異動情形', jsons)
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
