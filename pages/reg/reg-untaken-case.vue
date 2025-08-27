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
        b-link.s-90.text-muted.mr-1.align-self-center(
          v-if="advTags.length > 0"
          href="#"
          @click.prevent="resetAdvSearch"
        ) 重設
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
          no-icon-gutter
        ) 進階篩選
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
  lah-transition
    .d-flex.flex-wrap.align-items-center.border-0.mt-n4.p-0.py-2(v-if="advTags.length > 0")
      b-form-tag(
        v-for="(tag, idx) in advTags"
        :key="`tag-${idx}`"
        @remove="removeAdvTag(tag)"
        :title="`移除篩選：${tag.text}`"
        :variant="tag.variant"
        pill
        class="mr-1 mb-1 adv-tag-style"
      ) {{ tag.text }}

  lah-pagination(
    ref="pagination"
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
    title="進階篩選",
    size="lg",
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center
        span 進階篩選
        small.text-muted.ml-2 按住 Ctrl 鍵可多選
    .center.d-flex
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　收件字"): b-form-select(
        v-model="advOpts.caseWord",
        :options="advOpts.caseWordOpts",
        title="收件字",
        multiple,
        :select-size="4"
      )
      b-input-group.align-self-stretch(prepend="　收件號")
        b-input.h-100(
          v-model="advOpts.caseId",
          placeholder="... 可輸入部分收件號 ...",
          debounce="800",
          trim
        )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-form-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="結案人員"): b-form-select(
        v-model="advOpts.caseCloser",
        :options="advOpts.caseCloserOpts",
        title="結案人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="結案日期"): b-form-select(
        v-model="advOpts.caseCloseDate",
        :options="advOpts.caseCloseDateOpts",
        title="結案日期",
        multiple,
        :select-size="4"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="領件狀態"): b-form-select(
        v-model="advOpts.caseLight",
        :options="advOpts.caseLightOpts",
        title="領件狀態",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="領件日期"): b-form-select(
        v-model="advOpts.caseTakenDate",
        :options="advOpts.caseTakenDateOpts",
        title="領件日期",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="借閱人員"): b-form-select(
        v-model="advOpts.caseBorrower",
        :options="advOpts.caseBorrowerOpts",
        title="借閱人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="借閱日期"): b-form-select(
        v-model="advOpts.caseLentDate",
        :options="advOpts.caseLentDateOpts",
        title="借閱日期",
        multiple,
        :select-size="4"
      )

    .center.d-flex.my-1
      lah-button.mr-auto(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-primary.ml-2 找到 {{ filteredDataCount }} 筆
</template>

<script>
import lahRegUntakenMgt from '~/components/lah-reg-untaken-mgt.vue'
export default {
  components: { lahRegUntakenMgt },
  data: () => ({
    maxHeight: 400, // default height
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
      { key: 'UNTAKEN_TAKEN_STATUS', label: '狀態', sortable: true },
      { key: 'customize', label: '設定', sortable: false, thStyle: 'width: 250px' },
      { key: 'UNTAKEN_TAKEN_TIME', label: '領件時間', sortable: true, thStyle: 'width: 100px' },
      { key: '收件字號', sortable: true },
      { key: '收件日期', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '結案日期', sortable: true },
      { key: '結案人員', sortable: true }
    ],
    warnDays: 730,
    advOpts: {
      caseId: '',
      caseWord: [],
      caseWordOpts: [],
      caseReason: [],
      caseReasonOpts: [],
      caseCloser: [],
      caseCloserOpts: [],
      casePreliminator: [],
      casePreliminatorOpts: [],
      caseLight: [],
      caseLightOpts: [
        { text: '🟢 已領件', value: '🟢' },
        { text: '🟡 借閱中', value: '🟡' },
        { text: '🔴 未領件', value: '🔴' }
      ],
      caseTakenDate: [],
      caseTakenDateOpts: [],
      caseCloseDate: [],
      caseCloseDateOpts: [],
      caseBorrower: [],
      caseBorrowerOpts: [],
      caseLentDate: [],
      caseLentDateOpts: []
    }
  }),
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
        this.calculateTableHeight()
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
      if (this.advTags.length === 0) {
        return this.rows
      }
      let pipelineItems = [...this.rows]
      // String filters
      if (!this.$utils.empty(this.advOpts.caseId)) {
        pipelineItems = pipelineItems.filter(item => item.RM03.includes(this.advOpts.caseId.toUpperCase()))
      }
      // Array filters
      if (this.advOpts.caseWord.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseWord.includes(item.RM02))
      }
      if (this.advOpts.caseReason.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseReason.includes(item.登記原因))
      }
      if (this.advOpts.caseCloser.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseCloser.includes(item.結案人員))
      }
      if (this.advOpts.casePreliminator.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.casePreliminator.includes(item.初審人員))
      }
      if (this.advOpts.caseLight.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseLight.includes(this.statusLight(item)))
      }
      if (this.advOpts.caseTakenDate.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseTakenDate.includes(this.takenDate(item)))
      }
      if (this.advOpts.caseCloseDate.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseCloseDate.includes(this.$utils.addDateDivider(item.RM58_1)))
      }
      if (this.advOpts.caseLentDate.length > 0) {
        pipelineItems = pipelineItems.filter((item) => {
          const d = item?.UNTAKEN_LENT_DATE?.split('T')[0]
          return this.advOpts.caseLentDate.includes(d)
        })
      }
      if (this.advOpts.caseBorrower.length > 0) {
        pipelineItems = pipelineItems.filter((item) => {
          const borrowerId = item?.UNTAKEN_BORROWER
          if (this.$utils.empty(borrowerId)) { return false }
          const borrowerText = `${borrowerId} ${this.userNames[borrowerId]}`
          return this.advOpts.caseBorrower.includes(borrowerText)
        })
      }
      return pipelineItems
    },
    filteredDataCount () {
      return this.filteredData.length
    },
    advTags () {
      const tags = []
      const config = [
        { key: 'caseWord', prefix: '收件字', variant: 'primary' },
        { key: 'caseId', prefix: '收件號', variant: 'info' },
        { key: 'caseReason', prefix: '登記原因', variant: 'success' },
        { key: 'casePreliminator', prefix: '初審人員', variant: 'secondary' },
        { key: 'caseCloser', prefix: '結案人員', variant: 'danger' },
        { key: 'caseCloseDate', prefix: '結案日期', variant: 'dark' },
        { key: 'caseLight', prefix: '領件狀態', variant: 'warning' },
        { key: 'caseTakenDate', prefix: '領件日期', variant: 'light' },
        { key: 'caseBorrower', prefix: '借閱人員', variant: 'primary' },
        { key: 'caseLentDate', prefix: '借閱日期', variant: 'info' }
      ]

      config.forEach(({ key, prefix, variant }) => {
        const value = this.advOpts[key]
        if (Array.isArray(value)) {
          value.forEach((val) => {
            let textToShow = val
            if (key === 'casePreliminator' || key === 'caseCloser') {
              const opts = key === 'casePreliminator' ? this.advOpts.casePreliminatorOpts : this.advOpts.caseCloserOpts
              const found = opts.find(opt => opt.value === val)
              if (found) { textToShow = found.text }
            }
            tags.push({ type: key, value: val, text: `${prefix}：${textToShow}`, variant })
          })
        } else if (!this.$utils.empty(value)) {
          tags.push({ type: key, value, text: `${prefix}：${value.toUpperCase()}`, variant })
        }
      })
      return tags
    }
  },
  fetchOnServer: false,
  watch: {
    advTags () {
      this.calculateTableHeight()
    },
    rows (val) {
      const lightOpts = this.advOpts.caseLightOpts
      this.advOpts = {
        caseId: '',
        caseWord: [],
        caseWordOpts: [],
        caseReason: [],
        caseReasonOpts: [],
        caseCloser: [],
        caseCloserOpts: [],
        casePreliminator: [],
        casePreliminatorOpts: [],
        caseLight: [],
        caseLightOpts: lightOpts,
        caseTakenDate: [],
        caseTakenDateOpts: [],
        caseCloseDate: [],
        caseCloseDateOpts: [],
        caseBorrower: [],
        caseBorrowerOpts: [],
        caseLentDate: [],
        caseLentDateOpts: []
      }
      if (val) {
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].filter(Boolean).sort()
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].filter(Boolean).sort()

        const preliminatorMap = new Map()
        val.forEach((item) => {
          if (item.初審人員 && !preliminatorMap.has(item.初審人員)) {
            preliminatorMap.set(item.初審人員, {
              text: `${item.RM45} ${item.初審人員}`,
              value: item.初審人員
            })
          }
        })
        this.advOpts.casePreliminatorOpts = [...preliminatorMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        const closerMap = new Map()
        val.forEach((item) => {
          if (item.結案人員 && !closerMap.has(item.結案人員)) {
            closerMap.set(item.結案人員, {
              text: `${item.RM59} ${item.結案人員}`,
              value: item.結案人員
            })
          }
        })
        this.advOpts.caseCloserOpts = [...closerMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        this.advOpts.caseTakenDateOpts = [...new Set(val.map(item => this.takenDate(item)))].filter(Boolean).sort()
        this.advOpts.caseCloseDateOpts = [...new Set(val.map(item => this.$utils.addDateDivider(item.RM58_1)))].filter(Boolean).sort()
        this.advOpts.caseBorrowerOpts = [...new Set(val.map((item) => {
          const bid = this.borrower(item)
          return bid ? `${bid} ${this.userNames[bid]}` : ''
        }))].filter(Boolean).sort()
        this.advOpts.caseLentDateOpts = [...new Set(val.map((item) => {
          const d = this.lentDate(item)
          return d ? d.split('T')[0] : ''
        }))].filter(Boolean).sort()
      }
      this.calculateTableHeight()
    },
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    }
  },
  mounted () {
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.calculateTableHeight)
  },
  methods: {
    calculateTableHeight () {
      this.$nextTick(() => {
        const paginationEl = this.$refs.pagination?.$el
        if (paginationEl) {
          const rect = paginationEl.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const availableHeight = viewportHeight - rect.bottom
          const bottomOffset = 15
          const newMaxHeight = availableHeight - bottomOffset
          this.maxHeight = Math.max(200, newMaxHeight)
        }
      })
    },
    removeAdvTag (tagToRemove) {
      const { type, value } = tagToRemove
      if (this.advOpts[type] && Array.isArray(this.advOpts[type])) {
        const index = this.advOpts[type].indexOf(value)
        if (index > -1) {
          this.advOpts[type].splice(index, 1)
        }
      } else {
        this.advOpts[type] = ''
      }
    },
    statusLight (item) {
      if (!this.$utils.empty(item?.UNTAKEN_BORROWER) && this.$utils.empty(item?.UNTAKEN_RETURN_DATE)) {
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
        caseId: '',
        caseWord: [],
        caseReason: [],
        caseCloser: [],
        casePreliminator: [],
        caseLight: [],
        caseTakenDate: [],
        caseCloseDate: [],
        caseBorrower: [],
        caseLentDate: []
      }
      // MODIFIED: Use $nextTick to ensure DOM is updated before recalculating
      this.$nextTick(() => {
        // wait transition animation finish then re-calculate
        this.timeout(this.calculateTableHeight, 800)
      })
    },
    takenDate (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      return ts ? this.$utils.formatDate(new Date(ts)) : ''
    },
    takenTime (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      return ts ? this.$utils.formatTime(new Date(ts)) : ''
    },
    borrower (item) {
      return item?.UNTAKEN_BORROWER || ''
    },
    lentDate (item) {
      return item?.UNTAKEN_LENT_DATE || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.adv-tag-style {
  font-size: 0.95rem;
}
</style>
