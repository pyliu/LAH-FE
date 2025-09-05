<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 辦畢通知控管
        lah-button(
          icon="info"
          action="bounce"
          variant="outline-success"
          no-border
          no-icon-gutter
          @click="showModalById('help-modal')"
          title="說明"
        )
        lah-help-modal(:modal-id="'help-modal'" size="lg" modal-title="辦畢通知控管說明")
          h5.d-flex.align-items-center
            lah-fa-icon(icon="database" variant="secondary")
            span.ml-2 資料庫搜尋
          ul
            li 系統預設載入 #[strong.text-primary 近一個月] 的「已結案未歸檔」登記案件資料。
            li 您可以手動調整 #[strong.text-primary 收件日期] 區間，然後點擊 #[lah-fa-icon(icon="search" variant="primary")] 按鈕進行搜尋。
            li 請避免選擇過大的日期範圍，以免查詢時間過長導致失敗。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="filter" variant="secondary")
            span.ml-2 進階篩選
          ul
            li 點擊 #[strong 進階篩選] 按鈕可針對目前已載入的資料進行二次過濾。
            li 所有篩選欄位皆支援 #[strong 多重選取]。
            li 「收件號」欄位支援區間搜尋，例如輸入 #[strong 200-900] 可篩選出該範圍內的案件。
            li 已設定的篩選條件會以 #[b-tag(variant="info" pill) 標籤] 的形式顯示在主畫面上，點擊標籤上的 "x" 即可快速移除該條件。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="file-excel" regular variant="secondary")
            span.ml-2 EXCEL 匯出
          ul
            li 點擊 #[lah-fa-icon(icon="file-excel" regular variant="success")] 按鈕，可以將目前表格中 #[strong (已篩選)] 的資料匯出成 XLSX 檔。

      .d-flex.small
        b-link.s-85.my-auto.mr-2(
          v-if="advTags.length > 0"
          @click="resetAdvSearch"
          title="清除所有篩選條件"
        ) 重設
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
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
        lah-button-xlsx.mr-1(
          :jsons="xlsxData"
          header="辦畢通知控管"
          :disabled="!dataReady"
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
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-transition
    .d-flex.mt-n4(v-if="advTags.length > 0")
      //- Tag container with collapse functionality
      .mr-auto.tags-container(
        ref="tagsContainer"
        :class="{ 'tags-collapsed': !tagsExpanded }"
      )
        b-tag.mr-1.my-1(
          v-for="(tag, index) in advTags"
          :key="`${tag.key}-${tag.value}-${index}`"
          :variant="tag.variant"
          @remove="removeAdvTag(tag)"
          pill
          removable
        ) {{ tag.text }}
      //- Toggle button appears only when there is overflow
      lah-button(
        v-if="showTagsToggle"
        :icon="tagsExpanded ? 'angle-double-up' : 'angle-double-down'"
        variant="link"
        size="sm"
        @click="tagsExpanded = !tagsExpanded"
        :title="tagsExpanded ? '收合篩選條件' : '顯示所有篩選條件'"
        no-icon-gutter
      )

  lah-pagination(
    v-model="pagination"
    :total-rows="filterDataCount"
    :caption="foundText"
  )

  lah-transition: b-table.text-center.align-middle(
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
    template(#cell(收件字號)="{ item }"): .align-middle.text-nowrap: b-link(@click="popup(item)" :title="item.收件字號").
      {{ `${item.RM01}-${item.RM02}-${item.RM03}` }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
    template(#cell(預定結案日期)="{ item }"): .text-nowrap {{ item.預定結案日期.split(' ')[0] }}
    template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
    template(#cell(辦理情形)="{ item }"): .text-nowrap {{ item.RM30 }}:{{ item.辦理情形 }}
    template(#cell(customize)="{ item }"): lah-reg-case-notify(:case-id="`${item.ID}`" :parent-data="item")

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
    lah-reg-case-detail(@ready="modalLoading = !$event.detail" :parent-data="clickedData")

  b-modal(
    ref="searchPlus",
    title="進階篩選",
    hide-footer
  )
    .center.d-flex
      b-input-group(prepend="　收件號")
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號(可200-900) ...", trim)
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　收件字")
        b-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字",
          multiple
        )
      b-input-group(prepend="辦畢通知"): b-select(
        v-model="advOpts.caseNotify",
        :options="advOpts.caseNotifyOpts",
        title="辦畢通知狀態",
        multiple
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple
      )
      b-input-group(prepend="辦理情形"): b-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形",
        multiple
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple
      )
      b-input-group(prepend="複審人員"): b-select(
        v-model="advOpts.caseReviewer",
        :options="advOpts.caseReviewerOpts",
        title="複審人員",
        multiple
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="代理統編"): b-select(
        v-model="advOpts.proxyId",
        :options="advOpts.proxyIdOpts",
        title="代理人統編",
        multiple
      )
      b-input-group(prepend="代理姓名"): b-select(
        v-model="advOpts.proxyName",
        :options="advOpts.proxyNameOpts",
        title="代理人姓名",
        multiple
      )

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
import _ from 'lodash'
import dynamicHeight from '~/mixins/dynamic-height-mixin'

export default {
  mixins: [dynamicHeight],

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
    tagsExpanded: false, // state for tag container
    showTagsToggle: false, // visibility of the toggle button
    fields: [
      '#',
      {
        key: 'customize',
        label: '辦畢通知',
        sortable: false,
        thStyle: { width: '220px' }
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
        key: '預定結案日期',
        sortable: true
      },
      {
        key: '代理人姓名',
        sortable: true
      },
      {
        key: '代理人住址',
        sortable: true
      },
      {
        key: '代理人電話',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '複審人員',
        sortable: true
      }
    ],
    advOpts: {
      caseYear: '',
      caseYearOpts: [],
      caseWord: [], // multiple select
      caseWordOpts: [],
      caseNum: '', // input
      caseReason: [], // multiple select
      caseReasonOpts: [],
      caseState: [], // multiple select
      caseStateOpts: [],
      casePreliminator: [], // multiple select
      casePreliminatorOpts: [],
      caseReviewer: [], // multiple select
      caseReviewerOpts: [],
      caseNotify: [], // multiple select
      caseNotifyOpts: [
        { text: '🟢 已通知', value: '1' },
        { text: '🔴 未通知', value: '0' }
      ],
      proxyName: [], // multiple select
      proxyNameOpts: [],
      proxyId: [], // multiple select
      proxyIdOpts: []
    }
  }),

  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 400)
        return
      }

      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_not_done_case',
        start: this.dateRange.begin,
        end: this.dateRange.end,
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.notify(data.message, {
          type: this.$utils.statusCheck(data.status) ? 'info' : 'warning'
        })
        const remainS = data.cache_remaining_time
        const remainMs = remainS * 1000
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
    title: '辦畢通知控管-桃園市地政局'
  },

  computed: {
    dataReady () {
      return this.rows.length > 0
    },
    filterDataCount () {
      return this.filteredData.length
    },
    cacheKey () {
      return `query_reg_not_done_case_${this.dateRange.begin}_${this.dateRange.end}`
    },
    foundText () {
      return `找到 ${this.filterDataCount} 筆「已結案未歸檔」案件資料`
    },
    daysPeriod () {
      return this.dateRange.days || 0
    },
    isWrongDaysPeriod () {
      return this.daysPeriod < 1
    },
    filteredData () {
      if (this.advTags.length === 0) {
        return this.rows
      }

      const filters = [
        // single value filters with range support
        {
          key: 'caseNum',
          condition: (item, val) => {
            if (!item.RM03) { return false } // Guard for safety
            const numVal = val.trim()

            // Range search logic with regex to handle spaces around dash
            if (/\d+\s*[-~]\s*\d+/.test(numVal)) {
              const match = numVal.match(/(\d+)\s*[-~]\s*(\d+)/)
              if (match) {
                const start = parseInt(match[1], 10)
                const end = parseInt(match[2], 10)
                const itemNum = parseInt(item.RM03, 10)
                if (!isNaN(start) && !isNaN(end) && !isNaN(itemNum)) {
                  return itemNum >= start && itemNum <= end
                }
              }
              return false
            }

            // Fallback to simple 'contains' search on RM03 for single numbers
            return item.RM03.includes(numVal)
          }
        },
        // multiple values filters
        { key: 'caseWord', condition: (item, val) => val.some(word => item.收件字號.includes(word)) },
        { key: 'caseReason', condition: (item, val) => val.includes(item.登記原因) },
        { key: 'caseState', condition: (item, val) => val.includes(item.辦理情形) },
        { key: 'casePreliminator', condition: (item, val) => val.includes(item.初審人員) },
        { key: 'caseReviewer', condition: (item, val) => val.includes(item.複審人員) },
        // NOTE: This filter requires backend to provide 'CASE_NOTIFY_AUTHORITY' field with 1 or 0
        { key: 'caseNotify', condition: (item, val) => val.includes(String(item.CASE_NOTIFY_AUTHORITY)) },
        { key: 'proxyName', condition: (item, val) => val.includes(item.代理人姓名) },
        { key: 'proxyId', condition: (item, val) => val.includes(item.代理人統編) }
      ]

      let pipelineItems = [...this.rows]

      for (const filter of filters) {
        const value = this.advOpts[filter.key]
        // Use lodash's isEmpty to handle both empty strings and empty arrays
        if (!_.isEmpty(value)) {
          // Special handling for 'caseNotify': if all options are selected, it means "ALL", so we skip filtering.
          if (filter.key === 'caseNotify' && value.length === this.advOpts.caseNotifyOpts.length) {
            continue
          }
          pipelineItems = pipelineItems.filter(item => filter.condition(item, value))
        }
      }

      return pipelineItems
    },
    advTags () {
      const tags = []
      // A map to define labels and variants for each filter key
      const tagConfig = {
        caseWord: { label: '字', variant: 'primary' },
        caseNum: { label: '號', variant: 'secondary' },
        caseReason: { label: '登記原因', variant: 'success' },
        caseState: { label: '辦理情形', variant: 'info' },
        casePreliminator: { label: '初審人員', variant: 'dark' },
        caseReviewer: { label: '複審人員', variant: 'secondary' },
        caseNotify: { label: '辦畢通知', variant: 'warning' },
        proxyName: { label: '代理人姓名', variant: 'danger' },
        proxyId: { label: '代理人統編', variant: 'light' }
      }

      for (const key in tagConfig) {
        const values = this.advOpts[key]
        if (!_.isEmpty(values)) {
          const { label, variant } = tagConfig[key]
          if (Array.isArray(values)) {
            values.forEach((value) => {
              // For caseNotify, display text instead of value
              const textValue = key === 'caseNotify'
                ? (this.advOpts.caseNotifyOpts.find(opt => opt.value === value)?.text || value)
                : value
              const displayText = textValue.trim() // Remove icon for tag text
              tags.push({
                key, // e.g., 'caseReason'
                value, // e.g., '買賣'
                text: `${label}：${displayText}`,
                variant
              })
            })
          } else {
            // For single value inputs like caseNum
            tags.push({
              key, // e.g., 'caseNum'
              value: values,
              text: `${label}：${values}`,
              variant
            })
          }
        }
      }
      return tags
    },
    xlsxData () {
      const notifyDesc = (status) => {
        if (status === 1) { return '已通知' }
        if (status === 0) { return '未通知' }
        return '未知'
      }
      return this.filteredData.map(item => ({
        // 逾期燈號: lightDesc(item.燈號),
        辦畢通知狀態: notifyDesc(item.CASE_NOTIFY_AUTHORITY),
        收件字號: item.收件字號,
        收件日期: item.收件日期,
        預定結案日期: item.預定結案日期,
        登記原因: `${item.RM09}:${item.登記原因}`,
        辦理情形: `${item.RM30}:${item.辦理情形}`,
        初審人員: item.初審人員,
        複審人員: item.複審人員,
        代理人姓名: item.代理人姓名,
        代理人住址: item.代理人住址,
        代理人電話: item.代理人電話
      }))
    }
  },

  fetchOnServer: false,

  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    },
    advTags () {
      // Reset expansion state when tags change
      this.tagsExpanded = false
      // Use nextTick to allow the DOM to update with the new tags
      this.$nextTick(() => {
        const container = this.$refs.tagsContainer
        if (container) {
          // Show toggle if the content scroll height is larger than the container's
          // visible (client) height. A hardcoded pixel value is used for reliability.
          this.showTagsToggle = container.scrollHeight > 39 // Approx 2.4rem
        } else {
          this.showTagsToggle = false
        }
      })
    },
    rows (val) {
      this.resetAdvSearch()
      if (!_.isEmpty(val)) {
        const genOptions = (key, useCompact = false) => {
          let opts = _.map(val, key)
          if (useCompact) {
            opts = _.compact(opts)
          }
          opts = _.uniq(opts)
          opts = _.sortBy(opts)
          return opts
        }
        this.advOpts.caseReasonOpts = genOptions('登記原因')
        this.advOpts.caseStateOpts = genOptions('辦理情形')
        this.advOpts.casePreliminatorOpts = genOptions('初審人員', true)
        this.advOpts.caseReviewerOpts = genOptions('複審人員', true)
        this.advOpts.caseWordOpts = genOptions('RM02')
        this.advOpts.proxyNameOpts = genOptions('代理人姓名', true)
        this.advOpts.proxyIdOpts = genOptions('代理人統編', true)
      }
    }
  },

  created () {
    this.maxHeightOffset = 145
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
      this.clickedData = data
      this.$refs.caseDetail.show()
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseWord: [],
          caseNum: '',
          caseReason: [],
          caseState: [],
          casePreliminator: [],
          caseReviewer: [],
          caseNotify: [],
          proxyName: [],
          proxyId: []
        }
      }
    },
    removeAdvTag (tagToRemove) {
      const { key, value } = tagToRemove
      const currentValues = this.advOpts[key]
      if (Array.isArray(currentValues)) {
        // It's a multi-select, remove the specific value from the array
        this.advOpts[key] = currentValues.filter(v => v !== value)
      } else {
        // It's a single value (e.g., input), just clear it
        this.advOpts[key] = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.badge {
  font-size: .85rem;
}
.tags-container {
  transition: max-height 0.25s ease-in-out;
}
.tags-container.tags-collapsed {
  max-height: 2.4rem; /* Approx one line of tags with margin */
  overflow: hidden;
}
</style>
