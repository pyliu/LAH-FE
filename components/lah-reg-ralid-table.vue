<template lang="pug">
client-only
  div
    //- 篩選與操作工具列
    .d-flex.flex-wrap.justify-content-between.align-items-center.mb-2
      .d-flex.flex-wrap.align-items-center
        b-form-select.mr-2.mb-1(
          v-model="district",
          :options="districtOptions",
          size="sm",
          style="width: 11rem"
        )
        b-form-checkbox.mr-2.mb-1(
          v-model="onlySelected",
          :disabled="selectedCodes.length === 0",
          switch
        ) 僅看已選 ({{ selectedCodes.length }})
        b-button.mr-1.mb-1(
          v-if="hasFilter",
          size="sm",
          variant="outline-secondary",
          @click="resetFilter"
        ) 清除篩選
        b-button.mr-1.mb-1(
          v-if="selectedCodes.length > 0",
          size="sm",
          variant="outline-warning",
          @click="clearSelected"
        ) 清空已選
      .d-flex.flex-wrap.align-items-center
        b-button.mr-1.mb-1(
          size="sm",
          variant="outline-primary",
          :disabled="isBusy",
          @click="query(true)",
          title="略過快取，重新向資料庫查詢最新統計"
        )
          lah-fa-icon.mr-1(icon="arrows-rotate")
          | 重新讀取
        b-button.mb-1(
          size="sm",
          variant="outline-success",
          :disabled="exportTargetRows.length === 0",
          @click="exportXlsx"
        )
          lah-fa-icon.mr-1(icon="file-excel" regular)
          | {{ selectedCodes.length > 0 ? `匯出已選 EXCEL (${selectedCodes.length})` : '匯出 EXCEL' }}

    //- 統計摘要列
    .small.mb-2.p-2.border.rounded.bg-light
      .d-flex.flex-wrap.align-items-center
        span.mr-3
          strong 篩選統計：
          | 顯示 {{ summary.sectionCount }} / {{ count }} 個段別
        span.mr-3 土地標示部共 #[strong.text-primary {{ format(summary.landCount) }}] 筆
        span.mr-3 總面積 #[strong.text-success {{ areaM2(summary.area) }}]（{{ area(summary.area) }} ／ {{ areaHa(summary.area) }}）
      .mt-1.pt-1.border-top(v-if="selectedCodes.length > 0")
        .d-flex.flex-wrap.align-items-center
          span.mr-3.text-info
            strong 已選取試算 ({{ selectedSummary.sectionCount }} 個段別)：
          span.mr-3 共 #[strong.text-primary {{ format(selectedSummary.landCount) }}] 筆
          span.mr-3 總面積 #[strong.text-success {{ areaM2(selectedSummary.area) }}]（{{ area(selectedSummary.area) }} ／ {{ areaHa(selectedSummary.area) }}）
        .d-flex.flex-wrap.align-items-center.mt-1
          b-badge.mr-1.mb-1.selected-tag(
            v-for="item in selectedRows",
            :key="`sel_${item.段代碼}`",
            variant="success",
            title="點擊移除此段別",
            @click="toggleRow(item)"
          ) {{ item.段代碼 }} {{ item.段名稱 }} ({{ format(item.土地標示部筆數) }}筆) ✕

    b-table.text-center(
      ref="section_search_tbl",
      :items="filteredData",
      :fields="fields",
      :busy="isBusy",
      :sticky-header="`${maxHeight}px`",
      :sort-by.sync="sortBy",
      :sort-desc.sync="sortDesc",
      :tbody-tr-class="rowClass",
      responsive="sm",
      head-variant="dark",
      primary-key="段代碼",
      striped,
      hover,
      bordered,
      small,
      no-border-collapse,
      caption-top,
      show-empty,
      empty-text="查無符合條件之段小段資料",
      @row-clicked="toggleRow"
    )
      template(#head(SELECTED))
        b-form-checkbox(
          :checked="isAllFilteredSelected",
          :disabled="filteredData.length === 0",
          title="全選或取消全選目前篩選結果",
          @change="toggleSelectAllFiltered"
        )
      template(#cell(SELECTED)="{ item }")
        b-form-checkbox(
          :checked="isSelected(item.段代碼)",
          @change="toggleRow(item)"
          @click.native.stop
        )
      template(v-slot:cell(區代碼)="{ item }")
        span(v-html="highlight(item.區代碼)")
      template(v-slot:cell(區名稱)="{ item }")
        span(v-html="highlight(item.區名稱)")
      template(v-slot:cell(段代碼)="{ item }")
        span.font-weight-bold(v-html="highlight(item.段代碼)")
      template(v-slot:cell(段名稱)="{ item }")
        span(v-html="highlight(item.段名稱)")
      template(v-slot:cell(面積)="{ item }")
        div(v-b-tooltip.d400="`${area(item.面積)} ／ ${areaHa(item.面積)}`")
          div {{ areaM2(item.面積) }}
          small.text-muted {{ area(item.面積) }}
      template(v-slot:cell(土地標示部筆數)="{ item }")
        span.font-weight-bold {{ format(item.土地標示部筆數) }} 筆
      template(#cell(PCT)="{ item }")
        div.small 面積 {{ item._areaPct }}% / 筆數 {{ item._countPct }}%
</template>

<script>
import lahXlsxDownload from '~/components/lah-xlsx-download.vue'

export default {
  emit: ['update:keyword'],
  components: { lahXlsxDownload },
  props: {
    keyword: { type: String, default: '' }
  },
  data: () => ({
    rows: [],
    district: '',
    onlySelected: false,
    selectedCodes: [],
    sortBy: '段代碼',
    sortDesc: false,
    fields: [
      {
        key: 'SELECTED',
        label: '選取',
        sortable: false,
        thStyle: { width: '3.5rem' }
      },
      {
        key: '區代碼',
        sortable: true
      },
      {
        key: '區名稱',
        sortable: true
      },
      {
        key: '段代碼',
        sortable: true
      },
      {
        key: '段名稱',
        sortable: true
      },
      {
        key: '面積',
        label: '面積 (㎡ / 坪)',
        sortable: true
      },
      {
        key: '土地標示部筆數',
        sortable: true
      },
      {
        key: 'PCT',
        label: '占全轄區比例',
        sortable: false
      }
    ]
  }),
  computed: {
    count () { return this.rows?.length || 0 },
    cacheKey () { return 'lah-reg-ralid-table' },
    districtOptions () {
      const map = {}
      this.rows.forEach((r) => {
        if (r.區代碼 && !map[r.區代碼]) {
          map[r.區代碼] = `${r.區代碼} ${r.區名稱 || ''}`.trim()
        }
      })
      const opts = Object.keys(map).sort().map(code => ({
        value: code,
        text: map[code]
      }))
      return [{ value: '', text: `全部行政區 (${opts.length})` }, ...opts]
    },
    hasFilter () {
      return Boolean((this.keyword && this.keyword.trim()) || this.district || this.onlySelected)
    },
    filteredData () {
      const kw = (this.keyword || '').trim().toLowerCase()
      return this.rows.filter((row) => {
        if (this.district && row.區代碼 !== this.district) {
          return false
        }
        if (this.onlySelected && !this.selectedCodes.includes(row.段代碼)) {
          return false
        }
        if (kw) {
          return (
            String(row.段代碼 || '').toLowerCase().includes(kw) ||
            String(row.段名稱 || '').toLowerCase().includes(kw) ||
            String(row.區代碼 || '').toLowerCase().includes(kw) ||
            String(row.區名稱 || '').toLowerCase().includes(kw)
          )
        }
        return true
      })
    },
    selectedRows () {
      const set = new Set(this.selectedCodes)
      return this.rows.filter(r => set.has(r.段代碼))
    },
    exportTargetRows () {
      return this.selectedCodes.length > 0 ? this.selectedRows : this.filteredData
    },
    isAllFilteredSelected () {
      if (this.filteredData.length === 0) { return false }
      return this.filteredData.every(r => this.selectedCodes.includes(r.段代碼))
    },
    summary () {
      return this.calcSummary(this.filteredData)
    },
    selectedSummary () {
      return this.calcSummary(this.selectedRows)
    },
    maxHeight () {
      if (!this.$isServer && window) {
        return window.innerHeight - 210
      }
      return 600
    }
  },
  watch: {
    selectedCodes (val) {
      if (val.length === 0 && this.onlySelected) {
        this.onlySelected = false
      }
    }
  },
  created () {},
  mounted () { this.query(false) },
  methods: {
    round2 (n) {
      return Math.round((n + Number.EPSILON) * 100) / 100
    },
    normalizeRows (raw) {
      if (!Array.isArray(raw)) { return [] }
      const list = raw.map(r => ({
        ...r,
        區代碼: String(r.區代碼 || ''),
        區名稱: String(r.區名稱 || ''),
        段代碼: String(r.段代碼 || ''),
        段名稱: String(r.段名稱 || ''),
        面積: parseFloat(r.面積) || 0,
        土地標示部筆數: parseInt(r.土地標示部筆數, 10) || 0
      }))
      const totalArea = list.reduce((acc, r) => acc + r.面積, 0)
      const totalCount = list.reduce((acc, r) => acc + r.土地標示部筆數, 0)
      list.forEach((r) => {
        r._areaPct = totalArea > 0 ? this.round2(r.面積 / totalArea * 100) : 0
        r._countPct = totalCount > 0 ? this.round2(r.土地標示部筆數 / totalCount * 100) : 0
      })
      return list
    },
    calcSummary (list) {
      const area = list.reduce((acc, r) => acc + (parseFloat(r.面積) || 0), 0)
      const landCount = list.reduce((acc, r) => acc + (parseInt(r.土地標示部筆數, 10) || 0), 0)
      return {
        sectionCount: list.length,
        area: this.round2(area),
        landCount
      }
    },
    query (force = false) {
      this.getCache(this.cacheKey).then((rows) => {
        if (!force && Array.isArray(rows) && rows.length > 0) {
          this.rows = this.normalizeRows(rows)
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'ralid'
          }).then(({ data }) => {
            const raw = data.raw || []
            this.rows = this.normalizeRows(raw)
            this.setCache(this.cacheKey, raw, 24 * 60 * 60 * 1000)
            this.setCache('ralid_sections', raw, 24 * 60 * 60 * 1000)
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    isSelected (code) {
      return this.selectedCodes.includes(code)
    },
    toggleRow (item) {
      if (!item || !item.段代碼) { return }
      const idx = this.selectedCodes.indexOf(item.段代碼)
      if (idx >= 0) {
        this.selectedCodes.splice(idx, 1)
      } else {
        this.selectedCodes.push(item.段代碼)
      }
    },
    toggleSelectAllFiltered (checked) {
      const filteredCodes = this.filteredData.map(r => r.段代碼)
      if (checked) {
        const merged = new Set([...this.selectedCodes, ...filteredCodes])
        this.selectedCodes = Array.from(merged)
      } else {
        const removeSet = new Set(filteredCodes)
        this.selectedCodes = this.selectedCodes.filter(c => !removeSet.has(c))
      }
    },
    rowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      return this.isSelected(item.段代碼) ? 'table-success' : ''
    },
    resetFilter () {
      this.district = ''
      this.onlySelected = false
      this.$emit('update:keyword', '')
    },
    clearSelected () {
      this.selectedCodes = []
      this.onlySelected = false
    },
    format (val) {
      if (val === null || val === undefined || val === '') { return '0' }
      const parts = String(val).split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
    },
    area (val) {
      const n = parseFloat(val) || 0
      return `${this.format((n * 0.3025).toFixed(2))} 坪`
    },
    areaM2 (val) {
      const n = parseFloat(val) || 0
      return `${this.format(this.round2(n))} 平方米`
    },
    areaHa (val) {
      const n = parseFloat(val) || 0
      return `${this.format((n / 10000).toFixed(4))} 公頃`
    },
    highlight (text) {
      const str = String(text || '')
      if (this.$utils.empty(this.keyword)) { return str }
      return this.$utils.highlight(
        str,
        this.keyword,
        'highlight-yellow'
      )
    },
    exportXlsx () {
      if (typeof window === 'undefined' || this.exportTargetRows.length === 0) { return }
      const exportRows = this.exportTargetRows.map(r => ({
        區代碼: r.區代碼,
        區名稱: r.區名稱,
        段代碼: r.段代碼,
        段名稱: r.段名稱,
        '面積(平方公尺)': this.round2(r.面積),
        '面積(坪)': (r.面積 * 0.3025).toFixed(2),
        '面積(公頃)': (r.面積 / 10000).toFixed(4),
        土地標示部筆數: r.土地標示部筆數,
        '占全轄區面積%': r._areaPct,
        '占全轄區筆數%': r._countPct
      }))
      const suffix = this.selectedCodes.length > 0 ? `已選${this.selectedCodes.length}段別` : (this.keyword || this.district || '全部')
      const filename = `土地標示部段別統計_${suffix}`
      const header = `土地標示部段別統計 (${suffix})`

      this.modal(this.$createElement(lahXlsxDownload, {
        props: {
          header,
          filename,
          jsonArray: exportRows
        }
      }), {
        title: '匯出 XLSX 檔案 - 土地標示部段別統計'
      })
    },
    exportCsv () {
      this.exportXlsx()
    }
  }
}
</script>

<style lang="scss" scoped>
.selected-tag {
  cursor: pointer;
}
</style>
