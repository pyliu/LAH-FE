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
            li 選擇日期區間(預設為本月份)
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

      .d-flex.small
        lah-datepicker.mr-1(v-model="dateRange")

        lah-button.mr-1(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
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

  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="info",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
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
      :items="filteredData"
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
        {{ item.RM01 }}-{{ item.RM02 }}-{{ item.RM03 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      template(#cell(登記原因)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
      template(#cell(結案日期)="{ item }"): .text-nowrap {{ item.結案日期.split(' ')[0] }}
      template(#cell(customize)="{ item }"): lah-reg-untaken-mgt(:parent-data="item" :case-id="item.ID")
      template(#cell(UNTAKEN_TAKEN_STATUS)="{ item }"): .text-nowrap {{ statusLight(item) }} {{ statusText(item) }}
      //- template(#cell(UNTAKEN_TAKEN_DATE)="{ item }") {{ takenDate(item) }} {{ takenTime(item) }}
      template(#cell(UNTAKEN_TAKEN_TIME)="{ item }") {{ takenDate(item) }} {{ takenTime(item) }}

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

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex
      //- b-input-group(prepend="年")
      //-   b-select(
      //-     v-model="advOpts.caseYear",
      //-     :options="advOpts.caseYearOpts",
      //-     title="收件年"
      //-   )
      b-input-group.mr-1(prepend="　收件字")
        //- b-select(
        //-   v-model="advOpts.caseWord",
        //-   :options="advOpts.caseWordOpts",
        //-   title="收件字"
        //- )
        b-input(
          v-model="advOpts.caseWord",
          title="收件字",
          placeholder=".. 字代碼 ..",
          debounce="800",
          :state="validAdvTagsWord",
          trim
        )
      b-input-group(prepend="　收件號")
        //- b-input.mr-1(v-model="advOpts.caseWord", placeholder="... 收件字 ...", trim)
        b-input(
          v-model="advOpts.caseNum",
          placeholder="... 收件號 ...",
          debounce="800",
          trim
        )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因"
      )
      b-input-group(prepend="領件狀態"): b-select(
        v-model="advOpts.caseLight",
        :options="advOpts.caseLightOpts",
        title="領件狀態"
      )

    .center.d-flex.my-1
      b-input-group(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group(prepend="結案人員"): b-select(
        v-model="advOpts.caseCloser",
        :options="advOpts.caseCloserOpts",
        title="結案人員"
      )

    .center.d-flex.my-1
      b-input-group(prepend="領件日期"): b-select(
        v-model="advOpts.caseTakenDate",
        :options="advOpts.caseTakenDateOpts",
        title="領件日期"
      )
      b-input-group(prepend="結案日期"): b-select(
        v-model="advOpts.caseCloseDate",
        :options="advOpts.caseCloseDateOpts",
        title="結案日期"
      )

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filteredDataCount }} 筆
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
        key: 'customize',
        label: '設定',
        sortable: false,
        thStyle: 'width: 250px'
      },
      // {
      //   key: 'UNTAKEN_TAKEN_DATE',
      //   label: '領件日期',
      //   sortable: true,
      //   thStyle: 'width: 120px'
      // },
      {
        key: 'UNTAKEN_TAKEN_TIME',
        label: '領件時間',
        sortable: true,
        thStyle: 'width: 100px'
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
      }
    ],
    maxHeight: 600,
    warnDays: 730,
    advOpts: {
      caseYear: '',
      caseYearOpts: [],
      caseWord: '',
      caseWordOpts: [],
      caseNum: '',
      caseReason: '',
      caseReasonOpts: [],
      caseCloser: '',
      caseCloserOpts: [],
      casePreliminator: '',
      casePreliminatorOpts: [],
      caseLight: '',
      caseLightOpts: [
        { text: '', value: '' },
        { text: '🟢 已領件', value: '🟢' },
        { text: '🟡 借閱中', value: '🟡' },
        { text: '🔴 未領件', value: '🔴' }
      ],
      caseTakenDate: '',
      caseTakenDateOpts: [],
      caseCloseDate: '',
      caseCloseDateOpts: []
    }
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
      if (this.advTags.length > 0) {
        let pipelineItems = this.rows
        if (!this.$utils.empty(this.advOpts.caseNum)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseNum) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseWord)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseWord.toUpperCase()) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseYear)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(`${this.advOpts.caseYear}年`) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseReason)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.登記原因 === this.advOpts.caseReason
          })
        }
        if (!this.$utils.empty(this.advOpts.caseCloser)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.結案人員 === this.advOpts.caseCloser
          })
        }
        if (!this.$utils.empty(this.advOpts.casePreliminator)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.初審人員 === this.advOpts.casePreliminator
          })
        }
        if (!this.$utils.empty(this.advOpts.caseLight)) {
          pipelineItems = pipelineItems.filter((item) => {
            const light = this.statusLight(item)
            return light === this.advOpts.caseLight
          })
        }
        if (!this.$utils.empty(this.advOpts.caseTakenDate)) {
          pipelineItems = pipelineItems.filter((item) => {
            return this.takenDate(item) === this.advOpts.caseTakenDate
          })
        }
        if (!this.$utils.empty(this.advOpts.caseCloseDate)) {
          pipelineItems = pipelineItems.filter((item) => {
            return this.$utils.addDateDivider(item.RM58_1) === this.advOpts.caseCloseDate
          })
        }
        return pipelineItems
      }
      return this.rows
    },
    filteredDataCount () {
      return this.filteredData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.caseYear)) {
        tags.push(`年：${this.advOpts.caseYear}`)
      }
      if (!this.$utils.empty(this.advOpts.caseWord)) {
        tags.push(`字：${this.advOpts.caseWord.toUpperCase()}`)
      }
      if (!this.$utils.empty(this.advOpts.caseNum)) {
        tags.push(`號：${this.advOpts.caseNum}`)
      }
      if (!this.$utils.empty(this.advOpts.caseReason)) {
        tags.push(`登記原因：${this.advOpts.caseReason}`)
      }
      if (!this.$utils.empty(this.advOpts.caseCloser)) {
        tags.push(`結案人員：${this.advOpts.caseCloser}`)
      }
      if (!this.$utils.empty(this.advOpts.casePreliminator)) {
        tags.push(`初審人員：${this.advOpts.casePreliminator}`)
      }
      if (!this.$utils.empty(this.advOpts.caseLight)) {
        tags.push(`領件狀態：${this.advOpts.caseLight}`)
      }
      if (!this.$utils.empty(this.advOpts.caseTakenDate)) {
        tags.push(`領件日期：${this.advOpts.caseTakenDate}`)
      }
      if (!this.$utils.empty(this.advOpts.caseCloseDate)) {
        tags.push(`結案日期：${this.advOpts.caseCloseDate}`)
      }
      return tags
    },
    validAdvTagsWord () {
      if (this.$utils.empty(this.advOpts.caseWord)) {
        return null
      }
      return this.advOpts.caseWord.length === 4
    }
  },
  fetchOnServer: false,
  watch: {
    rows (val) {
      this.advOpts = {
        ...{
          caseYear: '',
          caseYearOpts: [],
          caseWord: '',
          caseWordOpts: [],
          caseNum: '',
          caseReason: '',
          caseReasonOpts: [],
          caseCloser: '',
          caseCloserOpts: [],
          casePreliminator: '',
          casePreliminatorOpts: [],
          caseLight: '',
          caseLightOpts: this.advOpts.caseLightOpts,
          caseTakenDate: '',
          caseTakenDateOpts: [],
          caseCloseDate: '',
          caseCloseDateOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].sort()
        this.advOpts.caseCloserOpts = [...new Set(val.map(item => item.結案人員))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].sort((a, b) => {
          if (a.startsWith('HA')) {
            return -1
          }
          if (a === b) {
            return 0
          }
          return a < b
        })
        this.advOpts.caseTakenDateOpts = [...new Set(val.map(item => this.takenDate(item)))].filter(d => !this.$utils.empty(d)).sort()
        this.advOpts.caseCloseDateOpts = [...new Set(val.map(item => this.$utils.addDateDivider(item.RM58_1)))].sort()

        this.advOpts.caseReasonOpts.unshift('')
        this.advOpts.caseCloserOpts.unshift('')
        this.advOpts.casePreliminatorOpts.unshift('')
        this.advOpts.caseYearOpts.unshift('')
        this.advOpts.caseWordOpts.unshift('')
        this.advOpts.caseTakenDateOpts.unshift('')
        this.advOpts.caseCloseDateOpts.unshift('')
      }
    },
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
      if (
        !this.$utils.empty(item?.UNTAKEN_BORROWER) &&
        // !this.$utils.empty(item?.UNTAKEN_LENT_DATE) &&
        this.$utils.empty(item?.UNTAKEN_RETURN_DATE)
      ) {
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
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseYear: '',
          caseWord: '',
          caseNum: '',
          caseReason: '',
          caseCloser: '',
          casePreliminator: '',
          caseLight: '',
          caseTakenDate: '',
          caseCloseDate: ''
        }
      }
    },
    takenDate (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      if (ts) {
        return this.$utils.formatDate(new Date(ts))
      }
      return ''
    },
    takenTime (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      if (ts) {
        return this.$utils.formatTime(new Date(ts))
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
