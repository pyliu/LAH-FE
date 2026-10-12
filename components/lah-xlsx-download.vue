<template lang="pug">
b-card(
  :class="noBorder ? ['border-0'] : []"
  no-body
)
  .p-3.border-bottom.bg-light.d-flex
    .font-weight-bold.text-secondary.mb-2 匯出設定：
    b-form-checkbox.mr-1(
      v-model="optHeaderRow"
      name="opt-header-row"
    ) 輸出功能名稱及產製時間
    b-form-checkbox.mr-1(
      v-model="optFreezeHeader"
      name="opt-freeze-header"
    ) 凍結標題列
    b-form-checkbox.mb-0(
      v-show="false"
      v-model="optAutoWidth"
      name="opt-auto-width"
    ) 標題列完整字數分配寬度

  .d-flex.justify-content-center: lah-button.my-1(
    icon="download",
    title="點我下載EXCEL檔案",
    size="lg",
    action="slide-ttb",
    @click="download",
    :variant="done ? 'success' : 'outline-secondary'",
    :disabled="!done || isExporting",
    :busy="isExporting"
  ) 開始下載
  lah-fa-icon(icon="list-alt", variant="secondary") 處理紀錄
  b-list-group(flush): b-list-group-item(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    lah-fa-icon(
      v-if="idx === 0"
      icon="angle-double-right",
      variant="danger",
      action="move-fade-ltr"
    )
    span.ml-1 {{ msg }}
</template>

<script>
import FileSaver from 'file-saver'

const STORAGE_KEY = 'lah-xlsx-download.options'

export default {
  name: 'LahXlsxDownload',
  props: {
    header: { type: String, default: '' },
    filename: { type: String, default: '' },
    jsonArray: { type: Array, default: () => [] },
    type: { type: String, default: '' },
    params: { type: Object, default: () => ({}) },
    noBorder: { type: Boolean, default: true }
  },
  data: () => ({
    optHeaderRow: true,
    optFreezeHeader: true,
    optAutoWidth: true,
    isExporting: false,
    messages: [],
    done: false
  }),
  watch: {
    optHeaderRow () {
      this.saveOptions()
    },
    optFreezeHeader () {
      this.saveOptions()
    },
    optAutoWidth () {
      this.saveOptions()
    },
    jsonArray (val) {
      this.addMessage(`查到 ${val.length} 筆資料。`)
      this.done = !this.$utils.empty(val)
    }
  },
  created () {},
  mounted () {
    this.loadSavedOptions()
    if (!this.$utils.empty(this.header)) {
      this.addMessage(`準備 ${this.header} 資料轉換 ... `)
    }
    if (!this.$utils.empty(this.jsonArray)) {
      this.addMessage(`查到 ${this.jsonArray.length} 筆資料。`)
      this.done = !this.$utils.empty(this.jsonArray)
    }
  },
  methods: {
    addMessage (msg) {
      this.messages.unshift(`${msg} (${this.$utils.time()})`)
    },
    loadSavedOptions () {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (typeof parsed.optHeaderRow === 'boolean') {
              this.optHeaderRow = parsed.optHeaderRow
            }
            if (typeof parsed.optFreezeHeader === 'boolean') {
              this.optFreezeHeader = parsed.optFreezeHeader
            }
            if (typeof parsed.optAutoWidth === 'boolean') {
              this.optAutoWidth = parsed.optAutoWidth
            }
          }
        }
      } catch (e) {
        console.warn('載入 Excel 匯出設定失敗', e)
      }
    },
    saveOptions () {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            optHeaderRow: this.optHeaderRow,
            optFreezeHeader: this.optFreezeHeader,
            optAutoWidth: this.optAutoWidth
          }))
        }
      } catch (e) {
        console.warn('儲存 Excel 匯出設定失敗', e)
      }
    },
    getExcelJS () {
      if (typeof window !== 'undefined' && window.ExcelJS) {
        return Promise.resolve(window.ExcelJS)
      }
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
          return reject(new Error('非瀏覽器環境無法載入 ExcelJS'))
        }
        const existing = document.querySelector('script[src="/js/exceljs.min.js"]')
        if (existing) {
          if (window.ExcelJS) { return resolve(window.ExcelJS) }
          existing.addEventListener('load', () => resolve(window.ExcelJS))
          existing.addEventListener('error', reject)
          return
        }
        const script = document.createElement('script')
        script.src = '/js/exceljs.min.js'
        script.onload = () => resolve(window.ExcelJS)
        script.onerror = () => reject(new Error('載入 /js/exceljs.min.js 失敗'))
        document.head.appendChild(script)
      })
    },
    calcHeaderWidth (text) {
      const str = String(text ?? '')
      let len = 0
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        if (code > 255) {
          len += 2.2
        } else {
          len += 1.1
        }
      }
      return Math.max(Math.ceil(len) + 4, 12)
    },
    async download () {
      if (!this.done || this.isExporting) {
        if (!this.done) {
          this.addMessage('⚠ 無資料 ... 請稍後再試！')
        }
        return
      }

      this.isExporting = true
      try {
        this.addMessage('載入 ExcelJS 模組中 ...')
        const ExcelJS = await this.getExcelJS()

        this.addMessage('建立活頁簿與處理表格資料中 ...')
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'LAH'
        workbook.lastModifiedBy = 'LAH'
        workbook.created = new Date()
        workbook.modified = new Date()

        const sheetTitle = (this.header || 'Sheet1').replace(/[*?:/\\[\]]/g, '').slice(0, 31) || 'Sheet1'
        const worksheet = workbook.addWorksheet(sheetTitle)

        // 1. 取得所有欄位名稱 (keys)
        const columns = []
        const keySet = new Set()
        this.jsonArray.forEach((item) => {
          if (item && typeof item === 'object') {
            Object.keys(item).forEach((k) => {
              if (!keySet.has(k)) {
                keySet.add(k)
                columns.push(k)
              }
            })
          }
        })

        if (columns.length === 0) {
          this.addMessage('⚠ 無有效資料欄位 ...')
          return
        }

        // 2. 選項 1: 第一列輸出該頁功能名稱及產製時間(分別置於最前面及最後面位置)
        if (this.optHeaderRow) {
          const featureName = this.header || (typeof document !== 'undefined' ? document.title : '') || '資料匯出'
          const timeStr = `產製時間：${this.$utils.now('tw') || this.$utils.now()}`

          const row1Values = new Array(columns.length).fill('')
          row1Values[0] = featureName
          if (columns.length > 1) {
            row1Values[columns.length - 1] = timeStr
          } else {
            row1Values[0] = `${featureName} (${timeStr})`
          }

          const titleRow = worksheet.addRow(row1Values)
          titleRow.height = 24

          const cellA1 = titleRow.getCell(1)
          cellA1.font = { name: 'Microsoft JhengHei', size: 12, bold: true }
          cellA1.alignment = { vertical: 'middle', horizontal: 'left' }

          if (columns.length > 1) {
            const cellLast = titleRow.getCell(columns.length)
            cellLast.font = { name: 'Microsoft JhengHei', size: 10, color: { argb: 'FF555555' } }
            cellLast.alignment = { vertical: 'middle', horizontal: 'right' }
          }
        }

        // 3. 輸出標題列 (各欄名稱)
        const headerRow = worksheet.addRow(columns)
        headerRow.height = 24
        headerRow.eachCell((cell) => {
          cell.font = { name: 'Microsoft JhengHei', size: 11, bold: true }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          }
          cell.alignment = { vertical: 'middle', horizontal: 'center' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
          }
        })

        // 4. 輸出資料列
        this.jsonArray.forEach((item) => {
          const rowData = columns.map((k) => {
            const val = item ? item[k] : ''
            return val === null || val === undefined ? '' : val
          })
          const dataRow = worksheet.addRow(rowData)
          dataRow.eachCell((cell) => {
            cell.font = { name: 'Microsoft JhengHei', size: 10 }
            cell.alignment = { vertical: 'middle' }
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE8E8E8' } },
              left: { style: 'thin', color: { argb: 'FFE8E8E8' } },
              bottom: { style: 'thin', color: { argb: 'FFE8E8E8' } },
              right: { style: 'thin', color: { argb: 'FFE8E8E8' } }
            }
          })
        })

        // 5. 選項 2: 凍結第一列(標題列)
        if (this.optFreezeHeader) {
          if (this.optHeaderRow) {
            // 前兩列凍結 (功能名稱列 + 標題列)
            worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
          } else {
            // 僅凍結第一列標題列
            worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
          }
        } else {
          worksheet.views = []
        }

        // 6. 選項 3: 標題列欄位寬度依據該欄字數分配
        if (this.optAutoWidth) {
          columns.forEach((colKey, idx) => {
            const col = worksheet.getColumn(idx + 1)
            col.width = this.calcHeaderWidth(colKey)
          })
        }

        // 7. 匯出檔案
        this.addMessage('轉換為 Excel 二進位資料中 ...')
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const filename = this.$utils.empty(this.filename)
          ? this.$utils.twDateStr(new Date(), true)
          : this.filename

        this.addMessage(`準備下載 ${filename}.xlsx ...`)
        FileSaver.saveAs(blob, `${filename}.xlsx`)
        this.addMessage(`${filename}.xlsx 已開始下載請查看瀏覽器下載清單。`)
      } catch (err) {
        console.error('Excel 匯出失敗', err)
        this.addMessage(`❌ 匯出失敗：${err.message || err}`)
      } finally {
        this.isExporting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
