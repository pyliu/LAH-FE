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
          :disabled="!dataReady",
          no-icon-gutter
        ) 進階篩選
        lah-button.mr-1(
          icon="layer-group",
          size="lg",
          title="批次修改設定",
          variant="outline-info",
          @click="openBatchUpdateModal",
          :disabled="!dataReady",
          no-icon-gutter
        ) 批次修改
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
        lah-button-xlsx.mr-1(
          :jsons="xlsxData"
          header="領件控管案件"
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
      b-input-group.align-self-stretch(prepend="　收件號")
        b-input.h-100(
          v-model="advOpts.caseId",
          placeholder="... 可輸入部分收件號 ...",
          debounce="800",
          trim
        )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　收件字"): b-form-select(
        v-model="advOpts.caseWord",
        :options="advOpts.caseWordOpts",
        title="收件字",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="登記原因"): b-form-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="發件人員"): b-form-select(
        v-model="advOpts.caseSetter",
        :options="advOpts.caseSetterOpts",
        title="發件人員",
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

    .center.mt-2
      lah-button.mr-1(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-primary.ml-2 找到 {{ filteredDataCount }} 筆

  b-modal(
    ref="batchUpdateModal",
    title="批次修改領件狀態",
    size="md",
    no-close-on-backdrop,
    :hide-header-close="batchProcessing"
  )
    b-form-fieldset(:disabled="batchProcessing")
      .d-flex
        b-input-group.mr-1(prepend="　收件年"): b-form-select(
          v-model="batchYear",
          :options="batchYearOpts",
          :state="!$utils.empty(batchYear)"
        )
        b-input-group(prepend="　收件字"): b-form-select(
          v-model="batchWord",
          :options="batchWordOpts",
          :state="!$utils.empty(batchWord)"
        )
      .d-flex.my-1
        b-input-group.mr-1(prepend="收件號起"): b-input(
          v-model="batchNumS",
          placeholder="... 000001 ...",
          :state="isStartNumState",
          trim,
          @blur="formatCaseNumber('batchNumS')"
        )
        b-input-group(prepend="收件號迄"): b-input(
          v-model="batchNumE",
          placeholder="... 000100 ...",
          :state="isEndNumState",
          trim,
          @blur="formatCaseNumber('batchNumE')"
        )
      hr
      .d-flex.justify-content-between
        .d-flex.text-nowrap.w-50.p-1
          .my-auto.mr-1 領件狀態
          b-select.h-100(
            v-model="batchReceiveStatus",
            :options="batchStatusOpts"
          )

        .d-flex.text-nowrap.w-50.p-1
          .my-auto.mr-1 領件日期
          b-datepicker(
            v-model="batchReceiveDate"
            boundary="viewport"
            variant="primary"
            placeholder="... 變更領件日期 ..."
            label-help="使用方向鍵操作移動日期"
            label-today-button="今天"
            label-reset-button="重設"
            label-close-button="關閉"
            :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
            :max="maxDate"
            hide-header
            today-button
            close-button
            reset-button
          )
    hr
    div(v-if="batchProcessing")
      lah-message(
        :message="batchProgressMessage",
        variant="info"
      )
      b-progress.mt-2(
        :value="progress",
        :max="progressMax",
        :variant="progressVariant",
        show-progress,
        animated,
        :precision="0"
      )
    div(v-else)
      div.text-monospace.p-2(v-if="isBatchFormInvalid")
        lah-message(
          :message="batchMessage",
          variant="danger"
        )
      div.text-monospace.border.p-2(v-else)
        div 針對 #[strong.text-info {{ batchYear }}-{{ batchWord }}] 區間 #[strong.text-danger {{ batchNumS }} ~ {{ batchNumE }}]
        div 設定為 #[strong.text-success {{ batchReceiveStatus }}]
        div 領件日期為 #[strong.text-success {{ batchReceiveDate }}]
        div 領件時間為 #[strong.text-info {{ batchReceiveTime }}]

    template(#modal-footer="{ cancel }")
      lah-button(
        :icon="batchProcessing ? 'spinner' : 'check'"
        :spin="batchProcessing"
        variant="primary"
        :disabled="isBatchFormInvalid || batchProcessing"
        @click="handleBatchUpdate"
        pill
      )
        span {{ batchProcessing ? '處理中' : '確認送出' }}

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
      caseSetter: [],
      caseSetterOpts: [],
      caseBorrower: [],
      caseBorrowerOpts: [],
      caseLentDate: [],
      caseLentDateOpts: []
    },
    // Batch Update Options (flattened)
    batchYear: '',
    batchYearOpts: [],
    batchWord: '',
    batchWordOpts: [],
    batchNumS: '',
    batchNumE: '',
    batchReceiveStatus: '',
    batchReceiveDate: null,
    batchReceiveTime: null,
    // Other batch update states
    batchStatusOpts: ['', '已領件', '免發狀', '附件領回', '內部更正', '駁回', '撤回', '郵寄', 'i領件'],
    batchMessage: '',
    maxDate: new Date(),
    batchProcessing: false,
    progress: 0,
    progressMax: 0
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
      if (this.advOpts.caseSetter.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseSetter.includes(item.UNTAKEN_NOTE))
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
        { key: 'caseSetter', prefix: '發件人員', variant: 'info' },
        { key: 'caseBorrower', prefix: '借閱人員', variant: 'primary' },
        { key: 'caseLentDate', prefix: '借閱日期', variant: 'info' }
      ]

      config.forEach(({ key, prefix, variant }) => {
        const value = this.advOpts[key]
        if (Array.isArray(value)) {
          value.forEach((val) => {
            let textToShow = val
            if (key === 'casePreliminator' || key === 'caseCloser' || key === 'caseSetter') {
              let opts
              if (key === 'casePreliminator') { opts = this.advOpts.casePreliminatorOpts } else if (key === 'caseCloser') { opts = this.advOpts.caseCloserOpts } else { opts = this.advOpts.caseSetterOpts }
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
    },
    caseNumberRangeForBatch () {
      const { batchYear, batchWord } = this
      if (!this.$utils.empty(batchYear) && !this.$utils.empty(batchWord)) {
        const numbers = this.rows
          .filter(item => item.RM01 === batchYear && item.RM02 === batchWord)
          .map(item => item.RM03)
          .sort((a, b) => a.localeCompare(b))
        if (numbers.length > 0) {
          return {
            min: numbers[0],
            max: numbers[numbers.length - 1]
          }
        }
      }
      return { min: null, max: null }
    },
    isStartNumState () {
      const { batchNumS } = this
      if (this.$utils.empty(batchNumS)) { return null }
      const range = this.caseNumberRangeForBatch
      if (!range.min) { return null } // Can't validate without a range
      // A valid start number must be >= min and <= max (in case user only fills start)
      return batchNumS >= range.min && batchNumS <= range.max
    },
    isEndNumState () {
      const { batchNumE } = this
      if (this.$utils.empty(batchNumE)) { return null }
      const range = this.caseNumberRangeForBatch
      if (!range.max) { return null } // Can't validate without a range
      // A valid end number must be <= max and >= min (in case user only fills end)
      return batchNumE <= range.max && batchNumE >= range.min
    },
    isBatchFormInvalid () {
      // 1. Check for empty fields
      if (this.$utils.empty(this.batchYear) || this.$utils.empty(this.batchWord) || this.$utils.empty(this.batchNumS) || this.$utils.empty(this.batchNumE) || this.$utils.empty(this.batchReceiveStatus) || this.$utils.empty(this.batchReceiveDate)) {
        return true
      }
      // 2. Check for logical validity
      const orderValid = this.batchNumS <= this.batchNumE
      const startInRange = this.isStartNumState
      const endInRange = this.isEndNumState
      // Any invalid state (false) will make the form invalid
      if (orderValid === false || startInRange === false || endInRange === false) {
        return true
      }
      // All checks passed
      return false
    },
    batchProgressMessage () {
      if (this.progress < this.progressMax) {
        return `批次處理中，請勿關閉視窗 ... ${this.progress} / ${this.progressMax}`
      }
      return '批次處理完成 ... 等待重新整理資料'
    },
    progressVariant () {
      if (this.progressMax === 0) {
        return 'secondary'
      }
      const percentage = (this.progress / this.progressMax) * 100
      if (percentage <= 75) {
        return 'secondary'
      } else if (percentage <= 90) {
        return 'warning'
      }
      return 'success'
    },
    xlsxData () {
      // helper function to format date and time safely
      const formatToMinguoDate = (dateString) => {
        if (this.$utils.empty(dateString)) {
          return ''
        }
        const date = new Date(dateString)
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return ''
        }
        const year = date.getFullYear() - 1911
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      const formatTime = (dateString) => {
        const ts = Date.parse(dateString)
        return ts ? this.$utils.formatTime(new Date(ts)) : ''
      }
      const jsons = this.filteredData.map((data) => {
        const obj = {
          收件年: data.RM01,
          收件字: data.RM02,
          收件號: data.RM03,
          收件日期: data.收件日期,
          登記原因: data.登記原因,
          初審人員: data.初審人員,
          發件人員: this.userNames[data.UNTAKEN_NOTE] || data.UNTAKEN_NOTE || '',
          借閱人員: this.userNames[data.UNTAKEN_BORROWER] || data.UNTAKEN_BORROWER || '',
          借閱日期: formatToMinguoDate(data.UNTAKEN_LENT_DATE),
          借閱時間: formatTime(data.UNTAKEN_LENT_DATE),
          歸還日期: formatToMinguoDate(data.UNTAKEN_RETURN_DATE),
          歸還時間: formatTime(data.UNTAKEN_RETURN_DATE),
          領件日期: formatToMinguoDate(data.UNTAKEN_TAKEN_DATE),
          領件時間: formatTime(data.UNTAKEN_TAKEN_DATE),
          領件狀態: data.UNTAKEN_TAKEN_STATUS
        }
        return obj
      })
      return jsons
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
        caseSetter: [],
        caseSetterOpts: [],
        caseBorrower: [],
        caseBorrowerOpts: [],
        caseLentDate: [],
        caseLentDateOpts: []
      }
      if (val) {
        const wordMap = new Map()
        val.forEach((item) => {
          if (item.RM02 && !wordMap.has(item.RM02)) {
            wordMap.set(item.RM02, {
              text: `${item.RM02} ${item.收件字}`,
              value: item.RM02
            })
          }
        })
        this.advOpts.caseWordOpts = [...wordMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        const reasonMap = new Map()
        val.forEach((item) => {
          if (item.登記原因 && !reasonMap.has(item.登記原因)) {
            reasonMap.set(item.登記原因, {
              text: `${item.RM09} ${item.登記原因}`,
              value: item.登記原因
            })
          }
        })
        this.advOpts.caseReasonOpts = [...reasonMap.values()].sort((a, b) => a.text.localeCompare(b.text))

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
        // new setter opts
        const setterMap = new Map()
        val.forEach((item) => {
          const setterId = item?.UNTAKEN_NOTE
          if (setterId && !setterMap.has(setterId)) {
            setterMap.set(setterId, {
              text: `${setterId} ${this.userNames[setterId] || ''}`.trim(),
              value: setterId
            })
          }
        })
        this.advOpts.caseSetterOpts = [...setterMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        // For batch update modal
        this.batchYearOpts = [...new Set(val.map(item => item.RM01))].filter(Boolean).sort()
        this.batchWordOpts = [...new Set(val.map(item => item.RM02))].filter(Boolean).sort()
      }
      this.calculateTableHeight()
    },
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    },
    batchYear () {
      this.prefillBatchStartNumber()
    },
    batchWord () {
      this.prefillBatchStartNumber()
    },
    batchNumS () {
      this.validateBatchRangeDebounced()
    },
    batchNumE () {
      this.validateBatchRangeDebounced()
    },
    batchReceiveDate (newDate) {
      if (newDate) {
        // When a date is picked, automatically set the time to now
        this.batchReceiveTime = this.$utils.formatTime(new Date())
      } else {
        // When date is cleared, clear the time
        this.batchReceiveTime = null
      }
    }
  },
  created () {
    this.validateBatchRangeDebounced = this.$utils.debounce(this.validateBatchRange, 1200)
  },
  mounted () {
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.calculateTableHeight)
  },
  methods: {
    validateBatchRange () {
      // Clear message first
      this.batchMessage = ''
      const { batchNumS, batchNumE, batchYear, batchWord } = this
      const range = this.caseNumberRangeForBatch
      const orderValid = batchNumS <= batchNumE

      if (!this.$utils.empty(batchNumS) && !this.$utils.empty(batchNumE) && !orderValid) {
        this.batchMessage = `收件號起號 ${batchNumS} 不可大於迄號 ${batchNumE}`
        return
      }
      if (!this.$utils.empty(batchNumS) && this.isStartNumState === false) {
        this.batchMessage = `收件號起號 ${batchNumS} 超出 ${batchYear}-${batchWord} 的資料範圍 (${range.min} ~ ${range.max})`
        return
      }
      if (!this.$utils.empty(batchNumE) && this.isEndNumState === false) {
        this.batchMessage = `收件號迄號 ${batchNumE} 超出 ${batchYear}-${batchWord} 的資料範圍 (${range.min} ~ ${range.max})`
      }
    },
    formatCaseNumber (key) {
      const value = this[key]
      if (this.$utils.empty(value)) {
        return
      }
      const formatted = String(value).replace(/\D/g, '').substring(0, 6).padStart(6, '0')
      if (formatted !== value) {
        this[key] = formatted
      }
    },
    openBatchUpdateModal () {
      // Reset advanced search filters
      this.resetAdvSearch()
      // Reset batch update modal form data
      this.batchYear = ''
      this.batchWord = ''
      this.batchNumS = ''
      this.batchNumE = ''
      this.batchReceiveStatus = ''
      this.batchReceiveDate = null
      this.batchReceiveTime = null
      this.batchMessage = ''
      // Set the default year to the max year in options
      if (this.batchYearOpts.length > 0) {
        // Math.max can handle string numbers correctly
        const maxYear = Math.max(...this.batchYearOpts)
        this.batchYear = String(maxYear)
      }
      // Show the modal
      this.$refs.batchUpdateModal.show()
    },
    async handleBatchUpdate () {
      if (this.isBatchFormInvalid) {
        this.batchMessage = '請填寫所有必填欄位或修正錯誤'
        return
      }
      this.batchProcessing = true
      this.batchMessage = '' // Clear previous error messages

      // Find target cases
      const targetCases = this.rows.filter(item =>
        item.RM01 === this.batchYear &&
        item.RM02 === this.batchWord &&
        item.RM03 >= this.batchNumS &&
        item.RM03 <= this.batchNumE
      )

      if (targetCases.length === 0) {
        this.batchMessage = '在指定的區間內找不到任何案件可供更新'
        this.batchProcessing = false
        return
      }

      this.progress = 0
      this.progressMax = targetCases.length

      try {
        const tasks = targetCases.map(item => this.handleBatchSingleUpdate(item))
        const results = await Promise.all(tasks)
        const successCount = results.filter(Boolean).length
        this.success(`成功更新 ${successCount} / ${this.progressMax} 筆案件`)
      } catch (error) {
        this.$utils.error(error)
        this.alert('批次更新時發生錯誤', { title: '錯誤' })
      } finally {
        this.timeout(() => {
          this.batchProcessing = false
          this.progress = 0
          this.progressMax = 0
          // this.$refs.batchUpdateModal.hide()
          // this.reload() // Reload data in the main table
        }, 2000)
      }
    },
    async handleBatchSingleUpdate (item) {
      this.progress++
      const updateData = {
        id: item.ID,
        taken_date: this.$utils.formatDate(this.batchReceiveDate, `yyyy-MM-dd ${this.batchReceiveTime}`) || '',
        taken_status: this.batchReceiveStatus || '',
        borrower: '',
        lent_date: '',
        return_date: '',
        note: this.user.id
      }
      // to update untaken data in sqlite db
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...updateData
        })
        if (this.$utils.statusCheck(data.status)) {
          this.$utils.log('OK', updateData)
          return true
        } else {
          this.$utils.error(item.ID, data.message)
          return false
        }
      } catch (err) {
        this.alert(err.message, { title: item.收件字號 })
        this.$utils.error(err)
        return false
      }
    },
    prefillBatchStartNumber () {
      this.batchNumS = this.caseNumberRangeForBatch.min || ''
    },
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
        caseLentDate: [],
        caseSetter: []
      }
      // Use $nextTick to wait for DOM update and then timeout to wait for transition
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
