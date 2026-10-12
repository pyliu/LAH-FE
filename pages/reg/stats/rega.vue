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
    lah-help-modal(:modal-id="'help-modal'" size="lg")
      h5 查詢 {{ site }} 統計資料案件，預設撈上個月的資料
      ul
        li 選擇日期區間後按「重新搜尋」，依註記日期（RA40）撈取資料。
        li 點擊該列即可顯示案件列表。
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
      b-link.hover(
        title="點擊開啟案件列表",
        @click="caseList(item)"
      ).d-flex.justify-content-between.align-items-center
        .col-4(
          v-for="(token, idx) in item.ITEM_NAME.split('/')",
          :key="`${item.ITEM}_${idx}`",
          :class="itemNameCss(item, idx)"
        ) {{ token }}

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
</template>

<script>
import lahRegCaseDetail from '~/components/lah-reg-case-detail.vue'
import lahXlsxDownload from '~/components/lah-xlsx-download.vue'

export default {
  components: { lahRegCaseDetail, lahXlsxDownload },
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
          const cases = this.normalizeCases(this.groupByItem[key])
          const sum = field => cases.reduce((acc, c) => acc + c[field], 0)
          tmp.push({
            ITEM_NAME: this.itemMap[key],
            ITEM: key,
            COUNT: cases.length,
            LAND_COUNT: sum('RECA'),
            LAND_AREA: this.round2(sum('RA10')),
            BUILD_COUNT: sum('RECD'),
            BUILD_AREA: this.round2(sum('RA08')),
            MISSING: cases.filter(c => c._flags.includes('MISSING')).length,
            CASES: cases
          })
        })
        return tmp
      }
      return []
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
    filter: {
      deep: true,
      handler () { this.pagination.currentPage = 1 }
    }
    // items (val) { this.$utils.warn(val) },
    // selectedRow (val) { this.$utils.warn(val) }
  },
  created () {},
  mounted () {
    setTimeout(() => this.getRegaData(false), 400)
  },
  methods: {
    handleDate (e) {},
    round2 (n) {
      return Math.round((n + Number.EPSILON) * 100) / 100
    },
    // 空值/非數字視為 0 並標示「資料缺漏」；加總於彙總時一次完成再四捨五入
    normalizeCases (rows) {
      const idCount = {}
      const cases = rows.map((row) => {
        let missing = false
        const toNum = (v) => {
          const n = parseFloat(v)
          if (isNaN(n)) { missing = true; return 0 }
          return n
        }
        const c = {
          ...row,
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
      const tokens = item.ITEM_NAME.split('/')
      if (idx === 1 && tokens.length !== 2) {
        return ['text-success']
      }
      return ['font-weight-bold']
    }
  }
}
</script>

<style lang="scss" scoped>
.hover:hover {
  font-size: 1.1rem;
  position: relative;
  display: block;
  background-color: rgb(250, 220, 225);
  text-decoration: none;
}
</style>
