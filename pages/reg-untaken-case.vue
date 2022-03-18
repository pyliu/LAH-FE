<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 領件管控查詢
          lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            h5 資料庫搜尋說明
            ul
              li 搜尋已結案但未歸檔的登記案件資料
              li 請勿搜尋#[strong.text-danger 過大區間]，可能造成讀取時間過長而失敗
            hr
            h5 狀態說明
            ul
              li 🟢 已領件
              li 🟡 借閱中
              li 🔴 未領件
            hr
            h5 請參照下列步驟搜尋
            ol
              li 選擇日期區間(預設為今天)
              li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

        .d-flex.small
          lah-datepicker.mr-1(v-model="dateRange" :begin="new Date()")

          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy || isWrongDaysPeriod"
            @click="$fetch"
            no-icon-gutter
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
      :total-rows="filteredDataCount"
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
        template(#cell(收件字號)="{ item }"): div: b-link(@click="popup(item)").
          {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
        template(#cell(登記原因)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
        template(#cell(結案日期)="{ item }"): .text-nowrap {{ item.結案日期.split(' ')[0] }}
        template(#cell(customize)="{ item }"): lah-reg-untaken-mgt(:parent-data="item" :case-id="item.ID")
        template(#cell(UNTAKEN_TAKEN_STATUS)="{ item }"): .text-nowrap {{ statusLight(item) }} {{ statusText(item) }}
    b-modal(
      ref="caseDetail"
      size="xl"
      hide-footer
      centered
      no-close-on-backdrop
      scrollable
    )
      template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedData.ID) }}
      h4.text-center.text-info.my-5(v-if="modalLoading")
        b-spinner.my-auto(small type="grow")
        strong.ld-txt 查詢中...
      lah-reg-case-detail(:parent-data="clickedData" @ready="modalLoading = !$event.detail")
</template>

<script>
export default {
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalLoading: true,
    clickedData: undefined,
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
        key: 'UNTAKEN_TAKEN_STATUS',
        label: '狀態',
        sortable: true
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '登記原因',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '結案日期',
        sortable: true
      },
      {
        key: '結案人員',
        sortable: true
      },
      {
        key: 'customize',
        label: '領件設定',
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

      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_untaken_case',
        start: this.dateRange.begin,
        end: this.dateRange.end,
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
        const remainSec = data.cache_remaining_time
        const remainMs = remainSec * 1000
        if (remainMs && remainMs > 0) {
          this.setCache(this.cacheKey, data, remainMs)
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remainMs)
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
  },
  head: {
    title: '案件領狀管控-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    cacheKey () { return `query_reg_untaken_case_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () { return `找到 ${this.filteredDataCount} 筆「已結案未歸檔」登記案件資料` },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    filteredData () {
      return this.rows
    },
    filteredDataCount () {
      return this.filteredData.length
    }
  },
  fetchOnServer: false,
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    statusLight (item) {
      if (!this.$utils.empty(item?.UNTAKEN_LENT_DATE) && this.$utils.empty(item?.UNTAKEN_RETURN_DATE)) {
        return '🟡'
      } else if (this.$utils.empty(item?.UNTAKEN_TAKEN_STATUS)) {
        return '🔴'
      }
      return '🟢'
    },
    statusText (item) {
      const light = this.statusLight(item)
      switch (light) {
        case '🟡':
          return '借閱中'
        case '🔴':
          return '未領件'
        default:
          return item.UNTAKEN_TAKEN_STATUS
      }
    },
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
      this.clickedData = data
      this.$refs.caseDetail.show()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
