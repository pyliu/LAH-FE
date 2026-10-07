<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center.st-header-bar
        .d-flex.mr-auto.align-items-center
          .h3.mb-0 月份統計報表看板
          lah-button.h3.mb-0(
            icon="question",
            size="lg",
            icon-size="1x",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            v-b-modal.help-modal,
            title="說明"
          )
        .d-flex.align-items-center
          span.st-date-pill.h3.mb-0.mr-2(v-if="date")
            lah-fa-icon(icon="calendar-alt", regular)  統計月份：{{ date.substr(0, 3) }} 年 {{ date.substr(3, 2) }} 月 ({{ date }})
          lah-button.st-refresh-btn.h3.mb-0(
            icon="sync",
            action="cycle",
            size="lg",
            icon-size="1x",
            variant="outline-primary",
            :disabled="isBusy",
            @click="refresh",
            title="清除快取並重新整理"
          ) 重新整理快取
    lah-help-modal(:modal-id="'help-modal'", size="md")
      h5 {{ siteName }}月份統計報表看板說明
      ul
        li 預設載入上個月的統計資料（民國年月共 5 碼，如 #[code 11509]）。
        li 可使用「上月 / 下月」按鈕快速切換，或直接輸入 5 碼民國年月。
        li 點擊任一統計項目卡片可檢視該月案件明細；點擊卡片左側 Excel 按鈕可直接於瀏覽器匯出 #[code .xlsx] 報表。
        li 可透過「排序」切換預設分類排序、數量由多到少、數量由少到多或依代碼排序。
        li 開啟「顯示所有原因」可查詢該月份全部有案件之登記原因統計。

  .container-fluid.st-page
    .st-filter-card.mb-3
      b-form-row.align-items-center
        .col-xl-3.col-lg-4.col-md-6.mb-2.mb-xl-0
          b-input-group(size="sm", prepend="統計年月")
            b-input-group-prepend
              b-button(variant="outline-secondary", size="sm", @click="stepMonth(-1)", title="上個月", :disabled="isBusy")
                lah-fa-icon(icon="chevron-left") 上月
            b-form-input(
              v-model="ymInput",
              type="text",
              size="sm",
              maxlength="5",
              placeholder="例: 11509",
              :state="ymValid",
              @input="onYmInput",
              @blur="normalizeYm",
              @keyup.enter="applyYmNow",
              class="text-center font-weight-bold"
            )
            b-input-group-append
              b-button(variant="outline-secondary", size="sm", @click="stepMonth(1)", :disabled="!canNextMonth || isBusy", title="下個月")
                lah-fa-icon(icon="chevron-right", append) 下月
        .col-xl-2.col-lg-2.col-md-6.mb-2.mb-xl-0
          b-input-group(size="sm", prepend="筆數 ≥")
            b-form-input(
              type="number",
              v-model.number="filterCount",
              size="sm",
              min="0",
              max="1000"
            )
        .col-xl-2.col-lg-3.col-md-4.mb-2.mb-md-0
          b-input-group(size="sm", prepend="排序")
            b-form-select(
              v-model="sortBy",
              :options="sortOptions",
              size="sm"
            )
        .col-xl-3.col-lg-3.col-md-5.mb-2.mb-md-0
          b-input-group(size="sm", prepend="關鍵字")
            b-form-input(
              type="text",
              v-model.trim="keyword",
              size="sm",
              placeholder="篩選代碼或原因名稱…"
            )
        .col-xl-2.col-lg-12.col-md-3.text-md-right
          b-form-checkbox(
            inline,
            v-model="allRegReason",
            switch,
            class="my-auto small font-weight-bold"
          ) 顯示所有原因

    .st-kpi-grid
      .st-kpi
        div
          .st-kpi-label 統計項目數
          .st-kpi-num {{ filteredItems.length }}
        .st-kpi-ico.brand
          lah-fa-icon(icon="th-large", size="lg", no-gutter)
      .st-kpi
        div
          .st-kpi-label 案件總計筆數
          .st-kpi-num {{ totalCaseCount }}
        .st-kpi-ico.ok
          lah-fa-icon(icon="calculator", size="lg", no-gutter)
      .st-kpi
        div
          .st-kpi-label 專項業務指標
          .st-kpi-num {{ specialItemCount }}
        .st-kpi-ico.info
          lah-fa-icon(icon="briefcase", size="lg", no-gutter)
      .st-kpi
        div
          .st-kpi-label 登記原因指標
          .st-kpi-num {{ reasonItemCount }}
        .st-kpi-ico.warn
          lah-fa-icon(icon="tags", size="lg", no-gutter)

    .st-sec-bar
      .st-sec-title
        lah-fa-icon(icon="chart-pie", variant="primary")
          span 查詢結果
        small.st-sec-sub(v-if="date") （{{ date.substr(0, 3) }} 年 {{ date.substr(3, 2) }} 月，點擊卡片檢視明細，點擊左側圖示匯出 EXCEL）

    transition-group.st-grid(name="list", tag="div")
      .st-item(
        v-for="(item, idx) in filteredItems",
        :key="`stats_${item.category}_${item.id || idx}`",
        :class="`cat-${borderVar(item)}`",
        @click.stop="queryDetail(item)",
        title="按我取得詳細資料"
      )
        .st-item-main
          lah-button.st-xlsx-btn(
            pill,
            regular,
            no-icon-gutter,
            icon="file-excel",
            size="sm",
            variant="outline-success",
            action="move-fade-ltr",
            title="匯出EXCEL",
            @click="exportXlsx(item)"
          )
          .st-item-text
            span.st-code(v-if="!$utils.empty(item.id)") {{ item.id }}
            span.st-name {{ item.text }}
        b-badge.st-count(:variant="badgeVar(item.count)", pill) {{ item.count }}

    .st-empty(v-if="!isBusy && filteredItems.length === 0")
      lah-fa-icon(icon="folder-open", regular, size="2x", no-gutter, class="mb-2")
      div {{ items.length > 0 ? '沒有符合篩選條件的統計項目' : '查詢後端資料失敗或尚無統計資料' }}

  b-modal(
    ref="regCaseModal",
    size="xl",
    :title="modalTitle",
    hide-footer,
    scrollable
  )
    lah-reg-b-table(
      :baked-data="modalRegCases",
      type="md"
    )

  b-modal(
    ref="regularCaseModal",
    size="xl",
    :title="modalTitle",
    hide-footer,
    scrollable
  )
    b-table(
      :items="modalRegularCases",
      :busy="isBusy",
      head-variant="dark",
      caption-top,
      :caption="`找到 ${modalRegularCases.length} 件`",
      striped,
      hover,
      bordered,
      responsive,
      small
    )
</template>

<script>
import * as XLSX from 'xlsx'

export default {
  fetchOnServer: false,
  data: () => ({
    year: 110,
    month: 3,
    ymInput: '',
    maxYm: '',
    filterCount: 0,
    sortBy: 'default',
    sortOptions: [
      { value: 'default', text: '預設分類' },
      { value: 'count_desc', text: '數量：多 → 少' },
      { value: 'count_asc', text: '數量：少 → 多' },
      { value: 'code_asc', text: '代碼 / 名稱' }
    ],
    keyword: '',
    allRegReason: false,
    items: [],
    ok: false,
    modalTitle: '案件明細',
    modalRegCases: [],
    modalRegularCases: [],
    ymTimer: null
  }),
  head: {
    title: '統計報表看板-桃園市地政局'
  },
  computed: {
    date () {
      return `${('00' + this.year).slice(-3)}${('0' + this.month).slice(-2)}`
    },
    ymValid () {
      if (!/^\d{5}$/.test(this.ymInput)) {
        return false
      }
      const y = parseInt(this.ymInput.substr(0, 3), 10)
      const m = parseInt(this.ymInput.substr(3, 2), 10)
      if (y < 100 || m < 1 || m > 12) {
        return false
      }
      if (this.maxYm && this.ymInput > this.maxYm) {
        return false
      }
      return null
    },
    canNextMonth () {
      if (!this.maxYm) {
        return true
      }
      return this.date < this.maxYm
    },
    filteredItems () {
      const minCount = isNaN(this.filterCount) || this.filterCount < 0 ? 0 : parseInt(this.filterCount, 10)
      const kw = (this.keyword || '').replace(/\?/g, '').trim()
      const kwRegex = kw ? new RegExp(kw, 'i') : null
      const list = this.items.filter((it) => {
        if ((parseInt(it.count, 10) || 0) < minCount) {
          return false
        }
        if (kwRegex) {
          return kwRegex.test(it.id || '') || kwRegex.test(it.text || '')
        }
        return true
      })
      if (this.sortBy === 'count_desc') {
        return [...list].sort((a, b) => (parseInt(b.count, 10) || 0) - (parseInt(a.count, 10) || 0))
      }
      if (this.sortBy === 'count_asc') {
        return [...list].sort((a, b) => (parseInt(a.count, 10) || 0) - (parseInt(b.count, 10) || 0))
      }
      if (this.sortBy === 'code_asc') {
        return [...list].sort((a, b) => {
          const codeA = a.id || ''
          const codeB = b.id || ''
          if (codeA !== codeB) {
            return codeA.localeCompare(codeB, 'zh-Hant')
          }
          return (a.text || '').localeCompare(b.text || '', 'zh-Hant')
        })
      }
      return list
    },
    totalCaseCount () {
      return this.filteredItems.reduce((s, it) => s + (parseInt(it.count, 10) || 0), 0)
    },
    specialItemCount () {
      return this.filteredItems.filter(it => it.category !== 'stats_reg_reason' && it.category !== 'stats_reg_all').length
    },
    reasonItemCount () {
      return this.filteredItems.filter(it => it.category === 'stats_reg_reason' || it.category === 'stats_reg_all').length
    }
  },
  watch: {
    allRegReason () {
      this.reload()
    }
  },
  mounted () {
    const now = new Date()
    const curY = now.getFullYear() - 1911
    const curM = now.getMonth() + 1
    this.maxYm = `${('00' + curY).slice(-3)}${('0' + curM).slice(-2)}`
    this.year = curY
    this.month = now.getMonth() // default to last month
    if (this.month === 0) {
      this.month = 12
      this.year--
    }
    this.ymInput = this.date
    this.reload()
  },
  methods: {
    onYmInput (val) {
      const digits = String(val || '').replace(/\D/g, '').slice(0, 5)
      if (digits !== this.ymInput) {
        this.ymInput = digits
      }
      if (digits.length === 5) {
        const y = parseInt(digits.substr(0, 3), 10)
        const m = parseInt(digits.substr(3, 2), 10)
        if (y >= 100 && m >= 1 && m <= 12 && (!this.maxYm || digits <= this.maxYm)) {
          if (this.year !== y || this.month !== m) {
            this.year = y
            this.month = m
            clearTimeout(this.ymTimer)
            this.ymTimer = setTimeout(() => {
              this.reload()
            }, 400)
          }
        }
      }
    },
    applyYmNow () {
      this.normalizeYm()
      clearTimeout(this.ymTimer)
      this.reload()
    },
    normalizeYm () {
      if (this.ymValid === false) {
        this.ymInput = this.date
      }
    },
    stepMonth (delta) {
      const totalMonths = this.year * 12 + (this.month - 1) + delta
      const nYear = Math.floor(totalMonths / 12)
      const nMonth = (totalMonths % 12) + 1
      const nextYm = `${('00' + nYear).slice(-3)}${('0' + nMonth).slice(-2)}`
      if (nYear < 100) {
        return
      }
      if (this.maxYm && nextYm > this.maxYm) {
        return
      }
      this.year = nYear
      this.month = nMonth
      this.ymInput = nextYm
      clearTimeout(this.ymTimer)
      this.ymTimer = setTimeout(() => {
        this.reload()
      }, 250)
    },
    borderVar (item) {
      switch (item.category) {
        case 'stats_court':
        case 'stats_refund':
        case 'stats_reg_reject':
        case 'stats_reg_fix':
        case 'stats_reg_remote':
        case 'stats_reg_subcase':
        case 'stats_regf':
          return 'info'
        case 'stats_reg_reason':
        case 'stats_reg_all':
          return 'primary'
        case 'stats_sur_rain':
          return 'warning'
        default:
          return 'secondary'
      }
    },
    badgeVar (count) {
      const c = parseInt(count, 10) || 0
      if (c < 10) {
        return 'secondary'
      } else if (c < 50) {
        return 'dark'
      } else if (c < 100) {
        return 'info'
      } else if (c < 200) {
        return 'primary'
      } else if (c < 400) {
        return 'success'
      } else if (c < 750) {
        return 'warning'
      }
      return 'danger'
    },
    refresh () {
      this.confirm(`確定要清除 ${this.date} 已快取資料？`).then((ans) => {
        if (ans) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.STATS, {
            type: 'stats_refresh_month',
            date: this.date
          }).then(({ data }) => {
            const ok = data.status > 0
            if (ok) {
              this.success(data.message || `已清除 ${this.date} 快取資料`)
              this.reload()
            } else {
              this.warning(data.message || '清除快取失敗')
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    fetchStatType (type) {
      return this.$axios.post(this.$consts.API.JSON.STATS, {
        type,
        date: this.date
      }).then(({ data }) => {
        if (data.status > 0 && Array.isArray(data.raw)) {
          this.ok = true
          data.raw.forEach((rawItem) => {
            const existed = this.items.find(it => it.id === (rawItem.id || '') && it.text === rawItem.text)
            if (!existed) {
              this.items.push({
                id: rawItem.id || '',
                text: rawItem.text || '',
                count: rawItem.count || 0,
                category: type
              })
            }
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      })
    },
    async reload () {
      if (this.isBusy) {
        return
      }
      this.isBusy = true
      this.items = []
      this.ok = false
      const baseTypes = [
        'stats_reg_subcase',
        'stats_reg_remote',
        'stats_court',
        'stats_refund',
        'stats_sur_rain',
        'stats_reg_reject',
        'stats_reg_fix',
        'stats_regf'
      ]
      try {
        for (const t of baseTypes) {
          await this.fetchStatType(t)
        }
        await this.fetchStatType(this.allRegReason ? 'stats_reg_all' : 'stats_reg_reason')
      } finally {
        this.isBusy = false
      }
    },
    resolveQueryConfig (item) {
      if (this.$utils.empty(item.id)) {
        switch (item.category) {
          case 'stats_court':
            return { qType: 'reg_court_cases_by_month', title: '法院囑託案件', isRegCase: true }
          case 'stats_reg_fix':
            return { qType: 'reg_fix_cases_by_month', title: '登記補正案件', isRegCase: true }
          case 'stats_reg_reject':
            return { qType: 'reg_reject_cases_by_month', title: '登記駁回案件', isRegCase: true }
          case 'stats_refund':
            return { qType: 'expba_refund_cases_by_month', title: '主動退費案件', isRegCase: false }
          case 'stats_sur_rain':
            return { qType: 'sur_rain_cases_by_month', title: '測量因雨延期案件', isRegCase: false }
          case 'stats_reg_remote':
            return { qType: 'reg_remote_cases_by_month', title: '遠途先審案件', isRegCase: false }
          case 'stats_reg_subcase':
            return { qType: 'reg_subcases_by_month', title: '本所處理跨所子號案件', isRegCase: false }
          case 'stats_regf':
            return { qType: 'regf_by_month', title: '外國人地權登記統計', isRegCase: false }
          default:
            return null
        }
      }
      const label = this.$utils.empty(item.text) ? `登記原因 ${item.id}` : `${item.id}：${item.text}`
      return { qType: 'reg_reason_cases_by_month', title: label, isRegCase: true }
    },
    queryDetail (item) {
      const cfg = this.resolveQueryConfig(item)
      if (!cfg) {
        this.warning('本項目未支援取得詳細列表功能')
        return
      }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: cfg.qType,
        query_month: this.date,
        reason_code: item.id || undefined
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.modalTitle = `${cfg.title} (${this.date})`
          if (cfg.isRegCase) {
            this.modalRegCases = data.baked || []
            this.$refs.regCaseModal?.show()
          } else {
            this.modalRegularCases = data.raw || []
            this.$refs.regularCaseModal?.show()
          }
        } else {
          this.warning(data.message || '查無案件明細資料')
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    exportXlsx (item) {
      const cfg = this.resolveQueryConfig(item)
      if (!cfg) {
        this.warning('本項目未支援匯出XLSX功能')
        return
      }
      this.isBusy = true
      this.info(`正在擷取「${item.text || item.id}」資料並產生 XLSX ...`, { title: '匯出 EXCEL 檔案' })
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: cfg.qType,
        query_month: this.date,
        reason_code: item.id || undefined
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          const rows = cfg.isRegCase ? (data.baked || []) : (data.raw || [])
          if (!rows || rows.length === 0) {
            this.warning('查無明細資料可匯出', { title: '匯出 EXCEL 檔案' })
            return
          }
          let exportRows = []
          if (cfg.isRegCase) {
            const regCols = [
              '收件字號', '收件時間', '登記原因', '辦理情形',
              '收件人員', '作業人員', '初審人員', '複審人員',
              '准登人員', '登錄人員', '校對人員', '結案人員', '結案狀態'
            ]
            exportRows = rows.map((r) => {
              const o = {}
              regCols.forEach((k) => {
                o[k] = r[k] !== undefined && r[k] !== null ? String(r[k]) : ''
              })
              return o
            })
          } else {
            exportRows = rows.map((r) => {
              const o = {}
              Object.keys(r).forEach((k) => {
                o[k] = r[k] !== undefined && r[k] !== null ? String(r[k]) : ''
              })
              return o
            })
          }

          const ws = XLSX.utils.json_to_sheet(exportRows)
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
          const colWidths = []
          for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxLen = 10
            for (let R = range.s.r; R <= range.e.r; ++R) {
              const addr = XLSX.utils.encode_cell({ r: R, c: C })
              const cell = ws[addr]
              if (cell && cell.v !== undefined) {
                cell.t = 's'
                cell.v = String(cell.v)
                const len = this.$utils.length(cell.v) || cell.v.length
                if (len > maxLen) {
                  maxLen = len
                }
              }
            }
            colWidths.push({ wch: Math.min(maxLen + 3, 42) })
          }
          ws['!cols'] = colWidths

          const wb = XLSX.utils.book_new()
          const sheetName = (item.text || item.id || '統計明細').replace(/[\\/?*[\]:]/g, '').slice(0, 31) || 'Sheet1'
          XLSX.utils.book_append_sheet(wb, ws, sheetName)

          const d = new Date()
          const today = `${d.getFullYear() - 1911}${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)}`
          const codePrefix = this.$utils.empty(item.id) ? '' : `${item.id}_`
          const filename = `${today}_${this.date}_${codePrefix}${item.text || item.id}.xlsx`
          XLSX.writeFile(wb, filename)

          this.success(`已下載 ${filename}（共 ${exportRows.length} 筆）`, { title: '匯出 EXCEL 檔案' })
        } else {
          this.warning(data.message || '查無明細資料可匯出', { title: '匯出 EXCEL 檔案' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.st-page {
  max-width: 1680px;
  margin: 0 auto;
  padding-bottom: 32px;
}

.st-header-bar {
  font-size: 1.75rem;

  ::v-deep .btn {
    font-size: 1.75rem;
    line-height: 1.2;
  }
}

.st-date-pill {
  background: #dbeafe;
  color: #2563eb;
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 1.75rem;
  line-height: 1.2;
  font-weight: 700;
}

.st-refresh-btn {
  border-radius: 999px !important;
}

.st-filter-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;

  ::v-deep .input-group-sm {
    > .form-control,
    > .custom-select,
    > .input-group-prepend > .input-group-text,
    > .input-group-append > .input-group-text,
    > .input-group-prepend > .btn,
    > .input-group-append > .btn {
      height: calc(1.5em + 0.5rem + 2px);
      border-width: 1px;
    }
    > .input-group-prepend > .input-group-text,
    > .input-group-append > .input-group-text,
    > .input-group-prepend > .btn,
    > .input-group-append > .btn {
      display: inline-flex;
      align-items: center;
    }
  }
}

.st-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin: 16px 0;
}

.st-kpi {
  background: #fff;
  border-radius: 14px;
  padding: 14px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.st-kpi-label {
  color: #6b7280;
  font-size: 0.85rem;
}

.st-kpi-num {
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.15;
  color: #1f2937;
  font-variant-numeric: tabular-nums;
}

.st-kpi-ico {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  &.brand {
    background: #dbeafe;
    color: #2563eb;
  }
  &.ok {
    background: #dcfce7;
    color: #16a34a;
  }
  &.info {
    background: #cffafe;
    color: #0891b2;
  }
  &.warn {
    background: #fef3c7;
    color: #d97706;
  }
}

.st-sec-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin: 14px 0 10px;
  gap: 8px;
}

.st-sec-title {
  font-weight: 700;
  font-size: 1rem;
  color: #1f2937;
}

.st-sec-sub {
  color: #6b7280;
  font-weight: 400;
  font-size: 0.82rem;
}

.st-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 12px;
}

.st-item {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #2563eb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  &.cat-info {
    border-left-color: #0891b2;
  }
  &.cat-primary {
    border-left-color: #2563eb;
  }
  &.cat-warning {
    border-left-color: #d97706;
  }
  &.cat-secondary {
    border-left-color: #6b7280;
  }
}

.st-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.st-xlsx-btn {
  flex-shrink: 0;
}

.st-item-text {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
}

.st-code {
  background: #f3f5f9;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1px 6px;
  font-size: 0.76rem;
  font-weight: 700;
  font-family: monospace;
}

.st-name {
  font-weight: 600;
  font-size: 0.92rem;
  color: #1f2937;
  word-break: break-word;
}

.st-count {
  font-size: 0.88rem;
  padding: 5px 10px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.st-empty {
  background: #fff;
  border-radius: 14px;
  border: 1px dashed #e5e7eb;
  padding: 48px 16px;
  text-align: center;
  color: #6b7280;

  i {
    font-size: 2.2rem;
    opacity: 0.45;
    margin-bottom: 8px;
    display: block;
  }
}

@media (max-width: 900px) {
  .st-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
