<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center
        .d-flex.mr-auto.align-items-center.header-left-group
          div 登記統計資料案件查詢
          lah-button(icon="question" variant="outline-success" size="lg" no-border no-icon-gutter v-b-modal.help-modal title="說明")

        .d-flex.align-items-center.header-right-group
          b-input-group.mr-1(size="lg" style="width: 16rem")
            b-form-input(
              v-model="headerSearchKeyword",
              size="lg",
              placeholder="搜尋項目或案號(Enter)...",
              trim,
              @keyup.enter="handleHeaderSearchEnter"
            )
            template(#append v-if="headerSearchKeyword")
              b-button(variant="outline-secondary" size="lg" @click="headerSearchKeyword = ''" title="清除搜尋")
                lah-fa-icon(icon="times")

          b-button.mr-1.text-nowrap(
            size="lg",
            :variant="showOnlyAbnormalItems ? 'danger' : 'outline-danger'",
            :disabled="isBusy || totalAbnormalCount === 0",
            @click="showOnlyAbnormalItems = !showOnlyAbnormalItems",
            :title="showOnlyAbnormalItems ? '點擊顯示所有項目' : '點擊僅顯示含異常之工作項目'"
          )
            lah-fa-icon.mr-1(icon="triangle-exclamation")
            | 異常項目
            b-badge.ml-1(v-if="totalAbnormalCount > 0" :variant="showOnlyAbnormalItems ? 'light' : 'danger'")
              | {{ totalAbnormalItemCount }}項/{{ totalAbnormalCount }}件

          lah-button.mr-1.text-nowrap(
            icon="list-check",
            size="lg",
            variant="outline-primary",
            :disabled="isBusy || totalAbnormalCount === 0",
            @click="openGlobalAbnormalModal",
            title="開啟全所跨項目異常案件總表"
          ) 異常清冊

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
    lah-help-modal(:modal-id="'help-modal'" size="lg")
      h5 查詢 {{ site }} 統計資料案件，預設撈上個月的資料
      ul
        li 選擇日期區間後按「重新搜尋」，依註記日期（RA40）撈取資料。
        li 點擊該列即可顯示案件列表。
      h6.mt-3 頂部搜尋與異常過濾說明
      ul
        li #[b 搜尋項目或案號]：輸入關鍵字即時過濾主表工作項目（支援項目名稱與代碼）；若鍵入案號並按 #[kbd Enter]，可跨項目查找全所案件（單筆直接開啟案件詳情、多筆開啟案件清冊）。
        li #[b-badge(variant="danger") 異常項目]：點擊可切換主表格，僅顯示含有異常案件的工作項目。
        li #[b-badge(variant="primary") 異常清冊]：點擊開啟全所跨項目異常案件總覽，支援分類切換標籤與 Excel 報表匯出。
        li #[b-badge(variant="danger") ⚠ 異常件數]：主表格「件數」旁顯示該項目之異常件數，點擊可直接開啟該項目並自動帶入異常篩選。
      h6.mt-3 數字不對時怎麼查？
      ol
        li 先在彙總表找到數字異常的工作項目，點擊該列開啟案件列表。
        li 案件列表預設依土地面積由大到小排序，最大的幾件通常就是造成差異的原因。
        li 頂部摘要列顯示目前篩選結果的合計，可直接與彙總表或手上報表核對。
        li 用「面積 ≥ / ≤」、「面積為 0」、「僅看異常」或案號關鍵字縮小範圍。
        li 「占項目面積」欄位顯示該案占此項目總面積的百分比，可快速看出影響最大的案件。
        li 點案號可開啟案件詳情；按「匯出 EXCEL」可將目前篩選結果下載為 Excel 報表比對。
      h6.mt-3 標示說明
      ul
        li #[b-badge(variant="warning") 資料缺漏] 面積或筆數為空值或非數字，計算時視為 0。
        li #[b-badge(variant="danger") 面積為0] 土地與建物面積皆為 0。
        li #[b-badge(variant="danger") 筆數/面積不符] 筆數為 0 但面積大於 0。
        li #[b-badge(variant="danger") 面積偏大] 面積超過該項目平均值加 3 倍標準差（該項目至少 5 件才判斷）。
        li #[b-badge(variant="info") 重複案號] 同一項目內案號重複出現。
      h6.mt-3 計算說明
      ul
        li 面積為所有案件加總後再四捨五入至小數第 2 位。
        li 「面積 ≥ / ≤」只要土地或建物面積任一符合即顯示。
  b-table(
    ref="display",
    :items="displayItems",
    :fields="fields",
    :busy="isBusy",
    :sticky-header="`${maxHeight}px`",
    no-border-collapse,
    class="text-center mb-0",
    :responsive="'lg'",
    :head-variant="'dark'",
    primary-key="ITEM",
    select-mode="single",
    selected-variant="success",
    caption-top,
    selectable,
    striped,
    hover,
    bordered,
    small,
    show-empty,
    empty-text="沒有符合條件的工作項目",
    @row-selected="rowSelected"
  )
    template(#cell(ITEM_NAME)="{ item }")
      b-link.hover(
        title="點擊開啟案件列表",
        @click="caseList(item)"
      ).d-flex.justify-content-between.align-items-center
        .col-4(
          v-for="(token, idx) in (item.ITEM_NAME || '').split('/')",
          :key="`${item.ITEM}_${idx}`",
          :class="itemNameCss(item, idx)"
        ) {{ token }}
    template(#cell(COUNT)="{ item }")
      .d-flex.align-items-center.justify-content-center
        span {{ item.COUNT }}
        b-badge.ml-1.cursor-pointer(
          v-if="item.ABNORMAL_COUNT > 0",
          variant="danger",
          pill,
          @click.stop="openItemAbnormalCases(item)",
          title="點擊開啟此項目異常案件"
        ) ⚠ {{ item.ABNORMAL_COUNT }}

  b-modal(
    ref="cases",
    size="lg",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) {{ selectedRow?.ITEM_NAME || '統計案件資料列表' }} ({{ selectedRow?.COUNT }}件)
    .d-flex.flex-wrap.align-items-center.mb-2
      b-form-input.mr-1.mb-1(v-model="filter.keyword" size="sm" placeholder="搜尋案號" trim style="width: 9rem")
      b-form-input.mr-1.mb-1(v-model="filter.min" type="number" min="0" step="any" size="sm" placeholder="面積 ≥" style="width: 7rem")
      b-form-input.mr-1.mb-1(v-model="filter.max" type="number" min="0" step="any" size="sm" placeholder="面積 ≤" style="width: 7rem")
      b-form-checkbox.mr-2.mb-1(v-model="filter.zero" switch) 面積為 0
      b-form-checkbox.mr-2.mb-1(v-model="filter.abnormal" switch) 僅看異常
      b-button.mr-1.mb-1(size="sm" variant="outline-secondary" @click="resetFilter") 清除
      b-button.mb-1(size="sm" variant="outline-success" :disabled="filteredCases.length === 0" @click="exportXlsx")
        lah-fa-icon.mr-1(icon="file-excel" regular)
        | 匯出 EXCEL
    .small.mb-2.p-1.border.rounded.bg-light
      span.mr-3 顯示 {{ caseSummary.count }} / {{ selectedCases.length }} 件
      span.mr-3 土地 {{ caseSummary.landCount }} 筆 / {{ caseSummary.landArea }}
      span.mr-3 建物 {{ caseSummary.buildCount }} 筆 / {{ caseSummary.buildArea }}
      b-badge.mr-1(v-if="caseSummary.abnormal > 0" variant="danger") 異常 {{ caseSummary.abnormal }} 件
      b-badge(v-if="selectedRow && selectedRow.MISSING > 0" variant="warning") 資料缺漏 {{ selectedRow.MISSING }} 件
    lah-pagination(
      v-if="filteredCases.length > pagination.perPage"
      v-model="pagination",
      :total-rows="filteredCases.length",
      @input="handlePaginationInput"
    )
    b-table(
      :items="filteredCases",
      :fields="selectedFields",
      :busy="isBusy",
      :head-variant="'dark'",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :sort-by.sync="sortBy",
      :sort-desc.sync="sortDesc",
      class="text-center",
      caption-top,
      show-empty,
      empty-text="沒有符合條件的案件",
      striped,
      hover,
      bordered,
      small
    )
      template(#cell(ID)="{ item }")
        b-link(@click="popup(item.ID)") {{ $utils.caseId(item.ID) }}
      template(#cell(RA40)="{ item }")
        div {{ $utils.addDateDivider(item.RA40) }}
      template(#cell(PCT)="{ item }")
        div.small 土 {{ item._landPct }}% / 建 {{ item._buildPct }}%
      template(#cell(FLAGS)="{ item }")
        b-badge.mr-1(
          v-for="flag in item._flags",
          :key="flag",
          :variant="flagLabels[flag].variant"
        ) {{ flagLabels[flag].text }}

  b-modal(
    ref="globalCases",
    size="xl",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title)
      span(v-if="globalModalType === 'abnormal'") 全所登記統計異常案件清冊 ({{ globalFilteredCases.length }}件)
      span(v-else) 登記統計案件搜尋結果「{{ globalSearchTerm }}」({{ globalFilteredCases.length }}件)

    .d-flex.flex-wrap.align-items-center.mb-2(v-if="globalModalType === 'abnormal'")
      b-button-group(size="sm").mr-2.mb-1
        b-button(
          :variant="globalFilterFlag === '' ? 'primary' : 'outline-primary'",
          @click="setGlobalFilterFlag('')"
        ) 全部 ({{ allAbnormalCases.length }})
        b-button(
          :variant="globalFilterFlag === 'ZERO' ? 'danger' : 'outline-danger'",
          @click="setGlobalFilterFlag('ZERO')"
        ) 面積為0 ({{ flagCounts.ZERO }})
        b-button(
          :variant="globalFilterFlag === 'MISMATCH' ? 'danger' : 'outline-danger'",
          @click="setGlobalFilterFlag('MISMATCH')"
        ) 筆數/面積不符 ({{ flagCounts.MISMATCH }})
        b-button(
          :variant="globalFilterFlag === 'OUTLIER' ? 'danger' : 'outline-danger'",
          @click="setGlobalFilterFlag('OUTLIER')"
        ) 面積偏大 ({{ flagCounts.OUTLIER }})
        b-button(
          :variant="globalFilterFlag === 'MISSING' ? 'warning' : 'outline-warning'",
          @click="setGlobalFilterFlag('MISSING')"
        ) 資料缺漏 ({{ flagCounts.MISSING }})
        b-button(
          :variant="globalFilterFlag === 'DUP' ? 'info' : 'outline-info'",
          @click="setGlobalFilterFlag('DUP')"
        ) 重複案號 ({{ flagCounts.DUP }})

    .d-flex.flex-wrap.align-items-center.mb-2
      b-form-input.mr-1.mb-1(v-model="globalFilter.keyword" size="sm" placeholder="搜尋案號或工作項目" trim style="width: 12rem")
      b-form-input.mr-1.mb-1(v-model="globalFilter.min" type="number" min="0" step="any" size="sm" placeholder="面積 ≥" style="width: 7rem")
      b-form-input.mr-1.mb-1(v-model="globalFilter.max" type="number" min="0" step="any" size="sm" placeholder="面積 ≤" style="width: 7rem")
      b-button.mr-1.mb-1(size="sm" variant="outline-secondary" @click="resetGlobalFilter") 清除
      b-button.mb-1(size="sm" variant="outline-success" :disabled="globalFilteredCases.length === 0" @click="exportGlobalXlsx")
        lah-fa-icon.mr-1(icon="file-excel" regular)
        | 匯出 EXCEL

    .small.mb-2.p-1.border.rounded.bg-light
      span.mr-3 顯示 {{ globalCaseSummary.count }} / {{ globalBaseCases.length }} 件
      span.mr-3 土地 {{ globalCaseSummary.landCount }} 筆 / {{ globalCaseSummary.landArea }}
      span.mr-3 建物 {{ globalCaseSummary.buildCount }} 筆 / {{ globalCaseSummary.buildArea }}
      b-badge.mr-1(v-if="globalCaseSummary.abnormal > 0" variant="danger") 異常 {{ globalCaseSummary.abnormal }} 件

    lah-pagination(
      v-if="globalFilteredCases.length > globalPagination.perPage"
      v-model="globalPagination",
      :total-rows="globalFilteredCases.length",
      @input="handleGlobalPaginationInput"
    )

    b-table(
      :items="globalFilteredCases",
      :fields="globalSelectedFields",
      :busy="isBusy",
      :head-variant="'dark'",
      :per-page="globalPagination.perPage",
      :current-page="globalPagination.currentPage",
      :sort-by.sync="globalSortBy",
      :sort-desc.sync="globalSortDesc",
      class="text-center",
      caption-top,
      show-empty,
      empty-text="沒有符合條件的案件",
      striped,
      hover,
      bordered,
      small
    )
      template(#cell(ITEM_NAME)="{ item }")
        .text-left
          span.badge.badge-secondary.mr-1 {{ item.ITEM }}
          span {{ item.ITEM_NAME }}
      template(#cell(ID)="{ item }")
        b-link(@click="popup(item.ID)") {{ $utils.caseId(item.ID) }}
      template(#cell(RA40)="{ item }")
        div {{ $utils.addDateDivider(item.RA40) }}
      template(#cell(PCT)="{ item }")
        div.small 土 {{ item._landPct }}% / 建 {{ item._buildPct }}%
      template(#cell(FLAGS)="{ item }")
        b-badge.mr-1(
          v-for="flag in item._flags",
          :key="flag",
          :variant="flagLabels[flag] ? flagLabels[flag].variant : 'secondary'"
        ) {{ flagLabels[flag] ? flagLabels[flag].text : flag }}
</template>

<script>
import lahRegCaseDetail from '~/components/lah-reg-case-detail.vue'
import lahXlsxDownload from '~/components/lah-xlsx-download.vue'
import dynamicHeight from '~/mixins/dynamic-height-mixin'

export default {
  components: { lahRegCaseDetail, lahXlsxDownload },
  mixins: [dynamicHeight],
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
      { key: 'RA40', label: '註記日期', sortable: true },
      { key: 'RA10', label: '土地面積', sortable: true },
      { key: 'RECA', label: '土地筆數', sortable: true },
      { key: 'RA08', label: '建物面積', sortable: true },
      { key: 'RECD', label: '建物筆數', sortable: true },
      { key: 'PCT', label: '占項目面積', sortable: false },
      { key: 'FLAGS', label: '標示', sortable: false }
    ],
    sortBy: 'RA10',
    sortDesc: true,
    filter: {
      keyword: '',
      min: '',
      max: '',
      zero: false,
      abnormal: false
    },
    flagLabels: {
      MISSING: { text: '資料缺漏', variant: 'warning' },
      ZERO: { text: '面積為0', variant: 'danger' },
      MISMATCH: { text: '筆數/面積不符', variant: 'danger' },
      OUTLIER: { text: '面積偏大', variant: 'danger' },
      DUP: { text: '重複案號', variant: 'info' }
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    // Header 搜尋與全所異常過濾狀態
    headerSearchKeyword: '',
    showOnlyAbnormalItems: false,
    globalModalType: 'abnormal', // 'abnormal' | 'search'
    globalSearchTerm: '',
    globalTargetCases: [],
    globalFilterFlag: '', // '' (全部) 或 'ZERO' | 'MISMATCH' | 'OUTLIER' | 'MISSING' | 'DUP'
    globalFilter: {
      keyword: '',
      min: '',
      max: ''
    },
    globalSelectedFields: [
      { key: 'ITEM_NAME', label: '工作項目', sortable: true, thStyle: { width: '20%' } },
      { key: 'ID', label: '案號', sortable: true },
      { key: 'RA40', label: '註記日期', sortable: true },
      { key: 'RA10', label: '土地面積', sortable: true },
      { key: 'RECA', label: '土地筆數', sortable: true },
      { key: 'RA08', label: '建物面積', sortable: true },
      { key: 'RECD', label: '建物筆數', sortable: true },
      { key: 'PCT', label: '占項目面積', sortable: false },
      { key: 'FLAGS', label: '標示', sortable: false }
    ],
    globalSortBy: 'RA10',
    globalSortDesc: true,
    globalPagination: {
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
          const cases = this.normalizeCases(this.groupByItem[key], key)
          const sum = field => cases.reduce((acc, c) => acc + c[field], 0)
          const abnormalCount = cases.filter(c => c._flags && c._flags.length > 0).length
          tmp.push({
            ITEM_NAME: this.itemMap[key] || key,
            ITEM: key,
            COUNT: cases.length,
            LAND_COUNT: sum('RECA'),
            LAND_AREA: this.round2(sum('RA10')),
            BUILD_COUNT: sum('RECD'),
            BUILD_AREA: this.round2(sum('RA08')),
            MISSING: cases.filter(c => c._flags.includes('MISSING')).length,
            ABNORMAL_COUNT: abnormalCount,
            CASES: cases
          })
        })
        return tmp
      }
      return []
    },
    displayItems () {
      let list = this.items
      if (this.showOnlyAbnormalItems) {
        list = list.filter(item => item.ABNORMAL_COUNT > 0)
      }
      const kw = String(this.headerSearchKeyword || '').trim().toUpperCase()
      if (kw) {
        list = list.filter(item =>
          (item.ITEM && item.ITEM.toUpperCase().includes(kw)) ||
          (item.ITEM_NAME && item.ITEM_NAME.toUpperCase().includes(kw)) ||
          (Array.isArray(item.CASES) && item.CASES.some(c => c.ID && c.ID.toUpperCase().includes(kw)))
        )
      }
      return list
    },
    allCases () {
      const list = []
      this.items.forEach((item) => {
        if (Array.isArray(item.CASES)) {
          item.CASES.forEach(c => list.push(c))
        }
      })
      return list
    },
    allAbnormalCases () {
      return this.allCases.filter(c => c._flags && c._flags.length > 0)
    },
    totalAbnormalCount () {
      return this.allAbnormalCases.length
    },
    totalAbnormalItemCount () {
      return this.items.filter(item => item.ABNORMAL_COUNT > 0).length
    },
    flagCounts () {
      const counts = { ZERO: 0, MISMATCH: 0, OUTLIER: 0, MISSING: 0, DUP: 0 }
      this.allAbnormalCases.forEach((c) => {
        (c._flags || []).forEach((f) => {
          if (counts[f] !== undefined) {
            counts[f]++
          }
        })
      })
      return counts
    },
    globalBaseCases () {
      if (this.globalModalType === 'search') {
        return this.globalTargetCases || []
      }
      return this.allAbnormalCases || []
    },
    globalFilteredCases () {
      const { keyword, min, max } = this.globalFilter
      const kw = String(keyword || '').trim().toUpperCase()
      const hasMin = min !== '' && min !== null && !isNaN(parseFloat(min))
      const hasMax = max !== '' && max !== null && !isNaN(parseFloat(max))
      const flag = this.globalFilterFlag

      return this.globalBaseCases.filter((c) => {
        if (this.globalModalType === 'abnormal' && flag) {
          if (!c._flags || !c._flags.includes(flag)) { return false }
        }
        if (kw) {
          const matchId = c.ID && c.ID.toUpperCase().includes(kw)
          const matchItem = c.ITEM && c.ITEM.toUpperCase().includes(kw)
          const matchName = c.ITEM_NAME && c.ITEM_NAME.toUpperCase().includes(kw)
          if (!matchId && !matchItem && !matchName) { return false }
        }
        if (hasMin || hasMax) {
          const ok = [c.RA10, c.RA08].some(a => (!hasMin || a >= parseFloat(min)) && (!hasMax || a <= parseFloat(max)))
          if (!ok) { return false }
        }
        return true
      })
    },
    globalCaseSummary () {
      const cases = this.globalFilteredCases
      const sum = field => cases.reduce((acc, c) => acc + c[field], 0)
      return {
        count: cases.length,
        landCount: sum('RECA'),
        landArea: this.round2(sum('RA10')),
        buildCount: sum('RECD'),
        buildArea: this.round2(sum('RA08')),
        abnormal: cases.filter(c => c._flags && c._flags.length > 0).length
      }
    },
    selectedCases () { return this.selectedRow?.CASES || [] },
    selectedCaseCount () { return this.selectedCases.length },
    filteredCases () {
      const { keyword, min, max, zero, abnormal } = this.filter
      const kw = String(keyword || '').trim().toUpperCase()
      const hasMin = min !== '' && min !== null && !isNaN(parseFloat(min))
      const hasMax = max !== '' && max !== null && !isNaN(parseFloat(max))
      return this.selectedCases.filter((c) => {
        if (kw && !c.ID.toUpperCase().includes(kw)) { return false }
        if (hasMin || hasMax) {
          const ok = [c.RA10, c.RA08].some(a => (!hasMin || a >= parseFloat(min)) && (!hasMax || a <= parseFloat(max)))
          if (!ok) { return false }
        }
        if (zero && !c._flags.includes('ZERO')) { return false }
        if (abnormal && c._flags.length === 0) { return false }
        return true
      })
    },
    caseSummary () {
      const cases = this.filteredCases
      const sum = field => cases.reduce((acc, c) => acc + c[field], 0)
      return {
        count: cases.length,
        landCount: sum('RECA'),
        landArea: this.round2(sum('RA10')),
        buildCount: sum('RECD'),
        buildArea: this.round2(sum('RA08')),
        abnormal: cases.filter(c => c._flags.length > 0).length
      }
    }
  },
  watch: {
    isBusy (val) {
      if (!val) {
        this.$nextTick(() => {
          this.calculateMaxHeight()
          setTimeout(() => this.calculateMaxHeight(), 300)
        })
      }
    },
    displayItems () {
      this.$nextTick(() => {
        this.calculateMaxHeight()
      })
    },
    filter: {
      deep: true,
      handler () { this.pagination.currentPage = 1 }
    },
    globalFilter: {
      deep: true,
      handler () { this.globalPagination.currentPage = 1 }
    },
    globalFilterFlag () {
      this.globalPagination.currentPage = 1
    }
    // items (val) { this.$utils.warn(val) },
    // selectedRow (val) { this.$utils.warn(val) }
  },
  created () {},
  async mounted () {
    const cachedPerPage = await this.getCache('rega-perPage')
    if (cachedPerPage) { this.pagination.perPage = cachedPerPage }
    const cachedGlobalPerPage = await this.getCache('rega-global-perPage')
    if (cachedGlobalPerPage) { this.globalPagination.perPage = cachedGlobalPerPage }
    setTimeout(() => this.getRegaData(false), 400)

    this.updateMaxHeight = this.calculateMaxHeight
    this.debouncedUpdateHeight = this.$utils.debounce(this.updateMaxHeight, 100)
    window.addEventListener('resize', this.debouncedUpdateHeight)
    if (this.zoomDetectorFrame?.contentWindow) {
      this.zoomDetectorFrame.contentWindow.addEventListener('resize', this.debouncedUpdateHeight)
    }
    if (window.ResizeObserver && this.$el) {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
      this.resizeObserver = new ResizeObserver(this.debouncedUpdateHeight)
      this.resizeObserver.observe(this.$el)
    }
    this.calculateMaxHeight()
  },
  beforeDestroy () {
    if (this.debouncedUpdateHeight) {
      window.removeEventListener('resize', this.debouncedUpdateHeight)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    calculateMaxHeight () {
      this.$nextTick(() => {
        if (typeof window === 'undefined') { return }
        let tableTop = 0
        const tableEl = this.$refs.display?.$el
        if (tableEl && typeof tableEl.getBoundingClientRect === 'function') {
          tableTop = tableEl.getBoundingClientRect().top
        } else if (this.$el && typeof this.$el.getBoundingClientRect === 'function') {
          tableTop = 64
        }
        if (tableTop > 0) {
          const bottomOffset = 20
          const availableHeight = Math.max(200, Math.floor(window.innerHeight - tableTop - bottomOffset))
          if (Math.abs(this.maxHeight - availableHeight) > 2) {
            this.maxHeight = availableHeight
          }
        }
      })
    },
    handleDate (e) {},
    round2 (n) {
      return Math.round((n + Number.EPSILON) * 100) / 100
    },
    // 空值/非數字視為 0 並標示「資料缺漏」；加總於彙總時一次完成再四捨五入
    normalizeCases (rows, itemKey = '') {
      const idCount = {}
      const key = itemKey || (rows[0] ? rows[0].ITEM : '')
      const itemName = this.itemMap[key] || key
      const cases = rows.map((row) => {
        let missing = false
        const toNum = (v) => {
          const n = parseFloat(v)
          if (isNaN(n)) { missing = true; return 0 }
          return n
        }
        const c = {
          ...row,
          ITEM: key,
          ITEM_NAME: itemName,
          ID: `${row.RA03}${row.RA04_1}${row.RA04_2}`,
          RA10: toNum(row.RA10),
          RA08: toNum(row.RA08),
          RECA: toNum(row.RECA),
          RECD: toNum(row.RECD),
          _flags: []
        }
        idCount[c.ID] = (idCount[c.ID] || 0) + 1
        if (missing) { c._flags.push('MISSING') }
        if (c.RA10 === 0 && c.RA08 === 0) { c._flags.push('ZERO') }
        if ((c.RECA === 0 && c.RA10 > 0) || (c.RECD === 0 && c.RA08 > 0)) { c._flags.push('MISMATCH') }
        return c
      })
      const landTotal = cases.reduce((acc, c) => acc + c.RA10, 0)
      const buildTotal = cases.reduce((acc, c) => acc + c.RA08, 0)
      // 面積超過 平均 + 3 倍標準差 視為偏大（至少 5 件才判斷）
      const limit = (field) => {
        const vals = cases.map(c => c[field]).filter(v => v > 0)
        if (vals.length < 5) { return Infinity }
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length
        const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length)
        return std > 0 ? mean + 3 * std : Infinity
      }
      const landLimit = limit('RA10')
      const buildLimit = limit('RA08')
      cases.forEach((c) => {
        if (c.RA10 > landLimit || c.RA08 > buildLimit) { c._flags.push('OUTLIER') }
        if (idCount[c.ID] > 1) { c._flags.push('DUP') }
        c._landPct = landTotal > 0 ? this.round2(c.RA10 / landTotal * 100) : 0
        c._buildPct = buildTotal > 0 ? this.round2(c.RA08 / buildTotal * 100) : 0
      })
      return cases
    },
    resetFilter () {
      this.filter = { keyword: '', min: '', max: '', zero: false, abnormal: false }
      this.sortBy = 'RA10'
      this.sortDesc = true
    },
    resetGlobalFilter () {
      this.globalFilter = { keyword: '', min: '', max: '' }
      this.globalFilterFlag = ''
      this.globalSortBy = 'RA10'
      this.globalSortDesc = true
    },
    setGlobalFilterFlag (flag) {
      this.globalFilterFlag = flag
      this.globalPagination.currentPage = 1
    },
    openItemAbnormalCases (item) {
      this.selectedRow = item
      this.pagination.currentPage = 1
      this.resetFilter()
      this.filter.abnormal = true
      this.$refs.cases?.show()
    },
    handleHeaderSearchEnter () {
      const kw = String(this.headerSearchKeyword || '').trim().toUpperCase()
      if (!kw) { return }

      const matched = this.allCases.filter(c => c.ID && c.ID.toUpperCase().includes(kw))
      if (matched.length === 1) {
        this.popup(matched[0].ID)
        return
      }
      if (matched.length > 1) {
        this.openGlobalSearchModal(matched, kw)
        return
      }
      if (this.displayItems.length > 0) {
        this.info(`已為您篩選出 ${this.displayItems.length} 個符合「${kw}」之工作項目。`)
      } else {
        this.warning(`查無符合「${kw}」之案號或工作項目。`)
      }
    },
    openGlobalSearchModal (matchedCases, kw) {
      this.globalModalType = 'search'
      this.globalSearchTerm = kw
      this.globalTargetCases = matchedCases
      this.resetGlobalFilter()
      this.globalPagination.currentPage = 1
      this.$refs.globalCases?.show()
    },
    openGlobalAbnormalModal () {
      this.globalModalType = 'abnormal'
      this.globalSearchTerm = ''
      this.globalTargetCases = this.allAbnormalCases
      this.resetGlobalFilter()
      this.globalPagination.currentPage = 1
      this.$refs.globalCases?.show()
    },
    handleGlobalPaginationInput (payload) {
      this.setCache('rega-global-perPage', payload.perPage)
    },
    exportGlobalXlsx () {
      if (typeof window === 'undefined' || this.globalFilteredCases.length === 0) { return }
      const exportRows = this.globalFilteredCases.map(c => ({
        項目代碼: c.ITEM,
        工作項目: c.ITEM_NAME,
        案號: this.$utils.caseId(c.ID),
        註記日期: this.$utils.addDateDivider(c.RA40),
        土地面積: c.RA10,
        土地筆數: c.RECA,
        建物面積: c.RA08,
        建物筆數: c.RECD,
        '土地面積占比%': c._landPct,
        '建物面積占比%': c._buildPct,
        標示: (c._flags || []).map(f => this.flagLabels[f] ? this.flagLabels[f].text : f).join('/')
      }))
      const title = this.globalModalType === 'abnormal' ? '全所登記統計異常案件清冊' : `登記統計案件搜尋_${this.globalSearchTerm}`
      const filename = `${title}_${this.dateRange.begin}_${this.dateRange.end}`
      const header = `${title} (${this.dateRange.begin} ~ ${this.dateRange.end})`

      this.modal(this.$createElement(lahXlsxDownload, {
        props: {
          header,
          filename,
          jsonArray: exportRows
        }
      }), {
        title: `匯出 XLSX 檔案 - ${title}`
      })
    },
    exportXlsx () {
      if (typeof window === 'undefined' || this.filteredCases.length === 0) { return }
      const exportRows = this.filteredCases.map(c => ({
        案號: this.$utils.caseId(c.ID),
        註記日期: this.$utils.addDateDivider(c.RA40),
        土地面積: c.RA10,
        土地筆數: c.RECA,
        建物面積: c.RA08,
        建物筆數: c.RECD,
        '土地面積占比%': c._landPct,
        '建物面積占比%': c._buildPct,
        標示: c._flags.map(f => this.flagLabels[f].text).join('/')
      }))
      const itemName = this.selectedRow?.ITEM || '登記案件清冊'
      const filename = `${itemName}_${this.dateRange.begin}_${this.dateRange.end}`
      const header = `${itemName} (${this.dateRange.begin} ~ ${this.dateRange.end})`

      this.modal(this.$createElement(lahXlsxDownload, {
        props: {
          header,
          filename,
          jsonArray: exportRows
        }
      }), {
        title: `匯出 XLSX 檔案 - ${itemName}`
      })
    },
    exportCsv () {
      this.exportXlsx()
    },
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
          if (this.totalAbnormalCount === 0) {
            this.showOnlyAbnormalItems = false
          }
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    rowSelected (rows) {
      if (Array.isArray(rows) && rows.length > 0) {
        this.selectedRow = rows[0]
        this.pagination.currentPage = 1
        this.resetFilter()
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
      this.resetFilter()
      this.$refs.cases?.show()
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('rega-perPage', payload.perPage)
    },
    itemNameCss (item, idx) {
      if (idx === 0) {
        return ['text-info']
      }
      const tokens = (item.ITEM_NAME || '').split('/')
      if (idx === 1 && tokens.length !== 2) {
        return ['text-success']
      }
      return ['font-weight-bold']
    }
  }
}
</script>

<style lang="scss" scoped>
.header-left-group {
  ::v-deep .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.header-right-group {
  display: flex;
  align-items: center;

  ::v-deep > .btn,
  ::v-deep .input-group .btn,
  ::v-deep .b-form-datepicker > .btn,
  ::v-deep .b-form-datepicker.form-control,
  ::v-deep input.form-control {
    height: 48px !important;
    box-sizing: border-box;
  }

  ::v-deep > .btn,
  ::v-deep .input-group .btn,
  ::v-deep .b-form-datepicker > .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.5;
  }

  ::v-deep .input-group {
    height: 48px;
  }
}

.hover:hover {
  font-size: 1.1rem;
  position: relative;
  display: block;
  background-color: rgb(250, 220, 225);
  text-decoration: none;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
