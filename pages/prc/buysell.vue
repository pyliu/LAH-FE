<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex.align-items-center
        .my-auto.font-weight-bold.h3.mb-0 地價買賣實例作業工具
        lah-button(
          icon="info",
          action="bounce",
          variant="outline-success",
          size="lg",
          no-border,
          no-icon-gutter,
          @click="showModalById('buysell-help-modal')",
          title="操作說明"
        )
        lah-help-modal(:modal-id="'buysell-help-modal'" size="lg")
          h5.font-weight-bold.text-primary.mb-3 地價買賣實例作業工具操作指引
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 1. 買賣實例對應區段表
            b-card-body.s-90
              ol.mb-0
                li #[strong 買賣實例清冊（必填）]：需包含 A 欄（實例號/序號）、E 欄（區段號，可多個以逗號或分號分隔）、G 欄（年月/日期）、K 欄（單價）。
                li #[strong 評議總表（必填）]：需包含 A 欄（區段號）、L 欄（擬評/現值）。
                li #[strong 物價指數（選填）]：需包含 A 欄（年月/日期）、B 欄（指數）。若未上傳，指數預設為 1。
                li 點擊「開始處理並下載」，系統將自動產生並下載排版完成的 #[code 買例整理結果_v8.6.xlsx]。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 2. 買賣實例檢核（v2.4）
            b-card-body.s-90
              ol.mb-0
                li 支援 29 條結構化檢核規則（基礎欄位、樓層用途、門牌臨街、建物單價、耐用年數折舊、工期利潤率、勘查日期、裝潢現值、漏號/重號等）。
                li 雙頁籤架構：可在「檢核項目與參數」即時自訂建物標準單價表與工期利潤率表，支援設定匯出、匯入與還原。
                li 支援人工判定（待確認、有問題、無問題）與人工備註，狀態自動保存於本機，並提供註記備份與還原。
                li 支援多欄位排序、調查人員/分組/規則/判定狀態快速篩選，並可匯出保留原始 Excel 格式及異常統計之檢核清冊。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 3. 查核案件挑檔
            b-card-body.s-90
              ol.mb-0
                li #[strong 步驟 1 本月買賣案件清冊（必填）]：可切換選擇「第一種 WEB 版」或「第二種 區估系統版」。
                li #[strong 步驟 2～4（選填）]：房地合一稅異常清冊（C 欄序號）、大量估價異常-房地與土地（可微調差異 % 門檻）。
                li 比對後在畫面呈現異常摘要與申報代理人案件統計，並自動下載整列紅底標記之 #[code 實價登錄查核案件比對完成.xlsx]。
          b-card(no-body)
            b-card-header.bg-light.font-weight-bold 4. 實價登錄10日檢核
            b-card-body.s-90
              ol.mb-0
                li 專為每十日一期的買賣、預售、租賃申報明細提供全面智慧檢核（內建 42 條專業防呆規則）。
                li 支援拖曳多個檔案或多工作表自動辨識（買賣、預售、租賃、略過）。
                li 支援人工審查判定（ok/warn/bad）與備註記錄、本機暫存與備份匯入。
                li 支援基準日、面積容許誤差、公設比上下限、格局上限、人名模糊比對等參數微調，並可一鍵匯出全案件檢核清冊 Excel。

  lah-transition(appear)
    b-tabs(
      v-model="activeTabIdx",
      pills,
      card,
      active-nav-item-class="font-weight-bold",
      content-class="mt-3"
    )
      //- =========================================================================
      //- 分頁 1: 買賣實例對應區段表
      //- =========================================================================
      b-tab(active)
        template(#title)
          lah-fa-icon(icon="table", variant="primary")
          span.ml-1 買賣實例對應區段表

        b-alert.d-flex.align-items-center(show, variant="info")
          lah-fa-icon(icon="lightbulb", size="lg", variant="primary")
          .ml-2
            div.font-weight-bold 請依序上傳檔案進行配對與指數化計算：
            div.s-85.text-muted 系統將依「買例清冊」中的區段號（E 欄）及年月（G 欄），對照「評議總表」的擬評價格（L 欄）及「物價指數」計算最終單價與各項統計指標。

        b-card-group(deck)
          b-card.border-primary.shadow-sm(header-bg-variant="primary", header-text-variant="white")
            template(#header)
              .d-flex.justify-content-between.align-items-center
                span.font-weight-bold 步驟 1: 上傳買賣實例清冊 (必填)
                b-badge(variant="light") A、E、G、K 欄
            b-form-group.mb-2
              b-form-file(
                v-model="fileRaw",
                placeholder="請選擇買例清冊 (支援 .xlsx / .xls)",
                drop-placeholder="拖曳檔案至此...",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
            .d-flex.justify-content-between.align-items-center
              span.s-85(:class="msgRawClass") {{ msgRawText }}
              span.s-80.text-muted 需包含區段、日期、單價

          b-card.border-info.shadow-sm(header-bg-variant="info", header-text-variant="white")
            template(#header)
              .d-flex.justify-content-between.align-items-center
                span.font-weight-bold 步驟 2: 上傳評議總表 (必填)
                b-badge(variant="light") A、L 欄
            b-form-group.mb-2
              b-form-file(
                v-model="fileValuation",
                placeholder="請選擇評議總表 (支援 .xlsx / .xls)",
                drop-placeholder="拖曳檔案至此...",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
            .d-flex.justify-content-between.align-items-center
              span.s-85(:class="msgValClass") {{ msgValText }}
              span.s-80.text-muted 需包含區段、擬評現值

          b-card.border-secondary.shadow-sm(header-bg-variant="secondary", header-text-variant="white")
            template(#header)
              .d-flex.justify-content-between.align-items-center
                span.font-weight-bold 步驟 3: 上傳物價指數 (選填)
                b-badge(variant="light") A、B 欄
            b-form-group.mb-2
              b-form-file(
                v-model="fileIndex",
                placeholder="請選擇物價指數表 (可略過)",
                drop-placeholder="拖曳檔案至此...",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
            .d-flex.justify-content-between.align-items-center
              span.s-85(:class="msgIdxClass") {{ msgIdxText }}
              span.s-80.text-muted 預設所有指數為 1.0

        .text-center.my-4
          lah-button(
            icon="file-excel",
            size="lg",
            variant="success",
            :disabled="!canProcessSalesList || processingSalesList",
            :busy="processingSalesList",
            @click="handleSalesListProcess"
          ) 開始處理並下載 Excel
          .s-85.text-muted.mt-2(v-if="statusSalesListText") {{ statusSalesListText }}

      //- =========================================================================
      //- 分頁 2: 買賣實例檢核 (v2.4)
      //- =========================================================================
      b-tab
        template(#title)
          lah-fa-icon(icon="tasks", variant="primary")
          span.ml-1 買賣實例檢核
        lah-prc-audit

      //- =========================================================================
      //- 分頁 3: 查核案件挑檔
      //- =========================================================================
      b-tab
        template(#title)
          lah-fa-icon(icon="filter", variant="primary")
          span.ml-1 查核案件挑檔

        b-alert.d-flex.align-items-center(show, variant="info")
          lah-fa-icon(icon="lightbulb", size="lg", variant="primary")
          .ml-2
            div.font-weight-bold 實價登錄查核案件批次挑檔比對工具：
            div.s-85.text-muted 比對本月買賣案件清冊與房地合一稅、大量估價異常清冊，自動標記各項異常原因、統計申報代理人案件量，並匯出完整標註之 Excel 報表。

        b-card.border-primary.shadow-sm.mb-3(header-bg-variant="primary", header-text-variant="white")
          template(#header)
            .d-flex.justify-content-between.align-items-center
              span.font-weight-bold 步驟 1: 上傳「本月買賣案件清冊」(必填基準檔)
              b-badge(variant="light") 支援兩種檔案來源
          b-row
            b-col(md="6")
              b-form-group(label="清冊來源格式：", label-class="font-weight-bold s-90")
                b-form-radio-group(v-model="pickFileType", :options="pickFileTypeOptions", buttons, button-variant="outline-primary")
            b-col(md="6")
              b-form-group(label="選擇檔案：", label-class="font-weight-bold s-90")
                b-form-file(
                  v-model="pickFile1",
                  placeholder="請上傳買賣案件清冊 (支援 .xlsx / .xls)",
                  browse-text="瀏覽",
                  accept=".xlsx, .xls"
                )

        b-row
          b-col(md="4")
            b-card.border-secondary.shadow-sm.mb-3
              template(#header)
                .font-weight-bold 步驟 2: 房地合一稅異常清冊 (選填)
              b-form-file.mb-2(
                v-model="pickFile2",
                placeholder="請上傳房地合一異常清冊",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
              .s-80.text-muted 系統讀取 C 欄申報書序號

          b-col(md="4")
            b-card.border-secondary.shadow-sm.mb-3
              template(#header)
                .font-weight-bold 步驟 3: 大量估價異常-房地 (選填)
              b-form-file.mb-2(
                v-model="pickFile3",
                placeholder="請上傳大量估價房地清冊",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
              b-input-group(size="sm", prepend="異常門檻 (±%)")
                b-form-input(type="number", v-model.number="pickThreshold3", min="0", max="100", step="1")

          b-col(md="4")
            b-card.border-secondary.shadow-sm.mb-3
              template(#header)
                .font-weight-bold 步驟 4: 大量估價異常-土地 (選填)
              b-form-file.mb-2(
                v-model="pickFile4",
                placeholder="請上傳大量估價土地清冊",
                browse-text="瀏覽",
                accept=".xlsx, .xls"
              )
              b-input-group(size="sm", prepend="異常門檻 (±%)")
                b-form-input(type="number", v-model.number="pickThreshold4", min="0", max="100", step="1")

        .text-center.my-3
          lah-button(
            icon="cogs",
            size="lg",
            variant="primary",
            :disabled="!pickFile1 || pickProcessing",
            :busy="pickProcessing",
            @click="handleCasePickProcess"
          ) 開始比對挑檔並匯出清冊
          lah-button.ml-2(
            icon="undo",
            size="lg",
            variant="outline-secondary",
            @click="resetCasePickForm"
          ) 重設清除

        b-alert(v-if="pickStatusText", :show="true", :variant="pickStatusVariant", class="mt-3")
          span.font-weight-bold {{ pickStatusText }}
          span.ml-2.s-85 {{ pickProgressText }}

        div(v-if="pickResultSummary" class="mt-4")
          h5.font-weight-bold.text-dark 比對統計結果摘要：
          b-row
            b-col(md="3")
              b-card.text-center.bg-light
                .text-muted.s-85 基準案件總數
                .h4.font-weight-bold.text-primary.mb-0 {{ pickResultSummary.totalCases }} 件
            b-col(md="3")
              b-card.text-center.bg-light
                .text-muted.s-85 房地合一異常
                .h4.font-weight-bold.text-danger.mb-0 {{ pickResultSummary.taxHits }} 件
            b-col(md="3")
              b-card.text-center.bg-light
                .text-muted.s-85 大量估價異常(房地)
                .h4.font-weight-bold.text-warning.mb-0 {{ pickResultSummary.houseHits }} 件
            b-col(md="3")
              b-card.text-center.bg-light
                .text-muted.s-85 大量估價異常(土地)
                .h4.font-weight-bold.text-info.mb-0 {{ pickResultSummary.landHits }} 件

          div(v-if="pickAgentList && pickAgentList.length" class="mt-4")
            h5.font-weight-bold.text-dark 異常案件申報代理人件數統計：
            b-table.shadow-sm(
              :items="pickAgentList",
              :fields="agentTableFields",
              striped,
              hover,
              responsive,
              bordered,
              small,
              head-variant="dark"
            )

      //- =========================================================================
      //- 分頁 4: 實價登錄10日檢核
      //- =========================================================================
      b-tab
        template(#title)
          lah-fa-icon(icon="calendar-check", variant="primary")
          span.ml-1 實價登錄10日檢核
        lah-prc-tenday
</template>

<script>
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import LahPrcAudit from '~/components/lah-prc-audit.vue'
import LahPrcTenday from '~/components/lah-prc-tenday.vue'

export default {
  name: 'PrcBuySell',
  components: {
    LahPrcAudit,
    LahPrcTenday
  },
  data: () => ({
    activeTabIdx: 0,

    // =========================================================================
    // 工具 A: 買賣實例對應區段表 相關資料
    // =========================================================================
    fileRaw: null,
    fileValuation: null,
    fileIndex: null,
    msgRawText: '',
    msgRawOk: false,
    msgValText: '',
    msgValOk: false,
    msgIdxText: '',
    msgIdxOk: false,
    processingSalesList: false,
    statusSalesListText: '',

    // =========================================================================
    // 工具 D: 查核案件挑檔 相關資料
    // =========================================================================
    pickFileType: '1',
    pickFileTypeOptions: [
      { text: '第一種 (WEB版: 地政資訊網申報產製)', value: '1' },
      { text: '第二種 (區估系統版: 產製給大量估價系統匯入檔)', value: '2' }
    ],
    pickFile1: null,
    pickFile2: null,
    pickFile3: null,
    pickFile4: null,
    pickThreshold3: 10,
    pickThreshold4: 10,
    pickProcessing: false,
    pickProgressText: '',
    pickStatusText: '',
    pickStatusVariant: 'info',
    pickResultSummary: null,
    pickAgentList: []
  }),
  head () {
    return {
      title: '買賣實例作業工具 - 桃園市地政地價小幫手',
      script: [
        { src: '/js/exceljs.min.js', ssr: false }
      ]
    }
  },
  computed: {
    msgRawClass () {
      return this.msgRawOk ? 'text-success' : 'text-danger'
    },
    msgValClass () {
      return this.msgValOk ? 'text-success' : 'text-danger'
    },
    msgIdxClass () {
      return this.msgIdxOk ? 'text-success' : 'text-danger'
    },
    canProcessSalesList () {
      return !!(this.fileRaw && this.fileValuation && this.msgRawOk && this.msgValOk)
    },
    agentTableFields () {
      return [
        { key: 'name', label: '申報代理人', sortable: true },
        { key: 'count', label: '異常案件數', sortable: true, class: 'text-center font-weight-bold text-danger' }
      ]
    }
  },
  watch: {
    fileRaw (newVal) {
      this.validateFile('raw', newVal)
    },
    fileValuation (newVal) {
      this.validateFile('val', newVal)
    },
    fileIndex (newVal) {
      this.validateFile('idx', newVal)
    }
  },
  mounted () {
    if (typeof window !== 'undefined') {
      window.XLSX = XLSX
      window.saveAs = saveAs
    }
  },
  methods: {
    // 取得 ExcelJS (確保已由 static/js/exceljs.min.js 載入)
    getExcelJS () {
      if (typeof window !== 'undefined' && window.ExcelJS) {
        return Promise.resolve(window.ExcelJS)
      }
      return new Promise((resolve, reject) => {
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
        script.onerror = reject
        document.head.appendChild(script)
      })
    },

    // =========================================================================
    // 工具 A: 買賣實例對應區段表 處理邏輯
    // =========================================================================
    async validateFile (type, file) {
      const fieldMsgKey = type === 'raw' ? 'msgRawText' : (type === 'val' ? 'msgValText' : 'msgIdxText')
      const fieldOkKey = type === 'raw' ? 'msgRawOk' : (type === 'val' ? 'msgValOk' : 'msgIdxOk')

      if (!file) {
        this[fieldMsgKey] = ''
        this[fieldOkKey] = false
        return
      }

      this[fieldMsgKey] = '檢查中...'
      try {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(new Uint8Array(e.target.result))
          reader.onerror = reject
          reader.readAsArrayBuffer(file)
        })

        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0]
        if (!headers || headers.length === 0) {
          throw new Error('此活頁簿無任何標題行')
        }

        let isValid = true
        let errorMsg = ''
        const checkCol = (colIdx, keywords, colName) => {
          const val = headers[colIdx] ? String(headers[colIdx]) : ''
          const match = keywords.some(k => val.includes(k))
          if (!match) {
            isValid = false
            errorMsg += `[${colName}] 欄位名稱未符合預期 (目前值: "${val || '空白'}")，`
          }
        }

        if (type === 'raw') {
          checkCol(0, ['實例', '序號', '編號'], 'A欄')
          checkCol(4, ['區段'], 'E欄')
          checkCol(6, ['年月', '日期'], 'G欄')
          checkCol(10, ['價', '元', '土地', '正常'], 'K欄')
        } else if (type === 'val') {
          checkCol(0, ['區段'], 'A欄')
          checkCol(11, ['擬評', '現值', '價格'], 'L欄')
        } else if (type === 'idx') {
          checkCol(0, ['年月', '日期'], 'A欄')
          checkCol(1, ['指數'], 'B欄')
        }

        if (isValid) {
          this[fieldMsgKey] = '✓ 格式正確'
          this[fieldOkKey] = true
        } else {
          this[fieldMsgKey] = '✕ ' + errorMsg.slice(0, -1)
          this[fieldOkKey] = false
        }
      } catch (err) {
        this[fieldMsgKey] = '✕ 檔案讀取失敗: ' + err.message
        this[fieldOkKey] = false
      }
    },

    extractPureNumber (val) {
      if (val === null || val === undefined) { return null }
      const s = String(val)
        .replace(/[\uFF01-\uFF5E]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
        .replace(/\s+/g, '')
      const n = parseInt(s, 10)
      return isNaN(n) ? null : n
    },

    parseSectionList (raw) {
      if (raw === null || raw === undefined || String(raw).trim() === '') { return [] }
      const parts = String(raw)
        .split(/[,，、;；]/)
        .map(s => this.extractPureNumber(s))
        .filter(n => n !== null)
      return [...new Set(parts)]
    },

    normalizeDate (rawDate) {
      if (!rawDate) { return null }
      const s = String(rawDate).replace(/[/\-.]/g, '')
      const d = parseInt(s, 10)
      if (isNaN(d)) { return null }
      return (d > 999999) ? Math.floor(d / 100) : d
    },

    readExcelToArray (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' })
            resolve(jsonData)
          } catch (err) { reject(err) }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    },

    fillInst (ws, r, c, v1, v2, v3, style) {
      const set = (off, val) => {
        const cell = ws.getCell(r + off, c)
        cell.value = val
        cell.alignment = style.alignment
        cell.border = style.border
      }
      set(0, v1)
      set(1, v2)
      set(2, v3)
    },

    async handleSalesListProcess () {
      if (!this.fileRaw || !this.fileValuation) {
        this.warning('請至少上傳「買例清冊」和「評議總表」！')
        return
      }

      this.processingSalesList = true
      this.statusSalesListText = '讀取檔案中...'

      try {
        const [rawRows, valRows, idxRows] = await Promise.all([
          this.readExcelToArray(this.fileRaw),
          this.readExcelToArray(this.fileValuation),
          this.fileIndex ? this.readExcelToArray(this.fileIndex) : Promise.resolve([])
        ])

        this.statusSalesListText = '建立資料對照索引中...'

        const valMap = new Map()
        for (let i = 1; i < valRows.length; i++) {
          const row = valRows[i]
          const sec = this.extractPureNumber(row[0])
          const val = parseFloat(row[11])
          if (sec !== null && !isNaN(val)) {
            valMap.set(sec, val)
          }
        }

        const idxMap = new Map()
        if (idxRows.length > 0) {
          for (let i = 1; i < idxRows.length; i++) {
            const row = idxRows[i]
            const d = this.normalizeDate(row[0])
            const val = parseFloat(row[1])
            if (d !== null && !isNaN(val)) {
              idxMap.set(d, val)
            }
          }
        }

        this.statusSalesListText = '計算買賣實例指數化價格中...'

        const secGroups = new Map()
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          const rawId = row[0]
          const secList = this.parseSectionList(row[4])
          const rawDate = this.normalizeDate(row[6])
          const origPrice = parseFloat(row[10])

          if (secList.length === 0 || !rawId || isNaN(origPrice)) { continue }

          let factor = 1.0
          if (rawDate && idxMap.has(rawDate)) {
            factor = idxMap.get(rawDate)
          }
          const adjPrice = Math.round(origPrice * factor)

          secList.forEach((sec, idx) => {
            if (!secGroups.has(sec)) {
              secGroups.set(sec, [])
            }
            secGroups.get(sec).push({
              origSec: secList[0],
              id: rawId,
              date: rawDate || '',
              price: adjPrice,
              isCross: idx > 0
            })
          })
        }

        const sortedSecs = Array.from(secGroups.keys()).sort((a, b) => a - b)
        if (sortedSecs.length === 0) {
          throw new Error('未比對到任何有效的實例區段資料，請確認檔案格式與欄位。')
        }

        let maxCount = 0
        sortedSecs.forEach((sec) => {
          const c = secGroups.get(sec).length
          if (c > maxCount) { maxCount = c }
        })

        this.statusSalesListText = '使用 ExcelJS 繪製並排版報表中...'
        const ExcelJS = await this.getExcelJS()
        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('買例對應區段表')

        const fontDefault = { name: '標楷體', size: 12 }
        const borderThin = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        const alignCenter = { vertical: 'middle', horizontal: 'center' }
        const alignRight = { vertical: 'middle', horizontal: 'right' }
        const styleCenter = { font: fontDefault, alignment: alignCenter, border: borderThin }
        const styleRight = { font: fontDefault, alignment: alignRight, border: borderThin }

        const titleRow = ws.getRow(1)
        titleRow.height = 36
        const totalCols = 10 + maxCount
        const endColLetter = ((n) => {
          let s = ''
          while (n > 0) {
            const m = (n - 1) % 26
            s = String.fromCharCode(65 + m) + s
            n = Math.floor((n - m) / 26)
          }
          return s
        })(totalCols)

        ws.mergeCells(`A1:${endColLetter}1`)
        const titleCell = ws.getCell('A1')
        titleCell.value = '買賣實例對應區段表'
        titleCell.font = { name: '標楷體', size: 20, bold: true }
        titleCell.alignment = alignCenter

        const h1 = ['區段號', '擬評價格', '實例總件數', '跨區段註記', '平均價格', '差異度(%)', '最高價格', '差異度(%)', '最低價格', '差異度(%)']
        const h2 = ['', '', '', '', '', '', '', '', '', '']
        const h3 = ['', '', '', '', '', '', '', '', '', '']

        for (let i = 1; i <= maxCount; i++) {
          h1.push(`實例 ${i}`)
          h2.push('交易年月')
          h3.push('單價')
        }

        const r2 = ws.getRow(2)
        const r3 = ws.getRow(3)
        const r4 = ws.getRow(4)
        r2.values = h1
        r3.values = h2
        r4.values = h3

        for (let c = 1; c <= totalCols; c++) {
          if (c <= 10) {
            ws.mergeCells(2, c, 4, c)
            const cell = ws.getCell(2, c)
            cell.font = fontDefault
            cell.alignment = alignCenter
            cell.border = borderThin
          } else {
            [2, 3, 4].forEach((r) => {
              const cell = ws.getCell(r, c)
              cell.font = fontDefault
              cell.alignment = alignCenter
              cell.border = borderThin
            })
          }
        }

        let currRow = 5
        for (const sec of sortedSecs) {
          const list = secGroups.get(sec)
          const prices = list.map(x => x.price)
          const targetVal = valMap.has(sec) ? valMap.get(sec) : null

          const sum = prices.reduce((a, b) => a + b, 0)
          const avg = Math.round(sum / prices.length)
          const max = Math.max(...prices)
          const min = Math.min(...prices)

          const diffAvg = targetVal ? ((avg - targetVal) / targetVal * 100).toFixed(1) + '%' : '-'
          const diffMax = targetVal ? ((max - targetVal) / targetVal * 100).toFixed(1) + '%' : '-'
          const diffMin = targetVal ? ((min - targetVal) / targetVal * 100).toFixed(1) + '%' : '-'
          const crossCount = list.filter(x => x.isCross).length

          this.fillInst(ws, currRow, 1, sec, '', '', styleCenter)
          ws.mergeCells(currRow, 1, currRow + 2, 1)

          this.fillInst(ws, currRow, 2, targetVal !== null ? targetVal.toLocaleString('zh-TW') : '無現值', '', '', styleRight)
          ws.mergeCells(currRow, 2, currRow + 2, 2)

          this.fillInst(ws, currRow, 3, list.length, '', '', styleCenter)
          ws.mergeCells(currRow, 3, currRow + 2, 3)

          this.fillInst(ws, currRow, 4, crossCount > 0 ? `跨${crossCount}` : '-', '', '', styleCenter)
          ws.mergeCells(currRow, 4, currRow + 2, 4)

          this.fillInst(ws, currRow, 5, avg.toLocaleString('zh-TW'), '', '', styleRight)
          ws.mergeCells(currRow, 5, currRow + 2, 5)

          this.fillInst(ws, currRow, 6, diffAvg, '', '', styleRight)
          ws.mergeCells(currRow, 6, currRow + 2, 6)

          this.fillInst(ws, currRow, 7, max.toLocaleString('zh-TW'), '', '', styleRight)
          ws.mergeCells(currRow, 7, currRow + 2, 7)

          this.fillInst(ws, currRow, 8, diffMax, '', '', styleRight)
          ws.mergeCells(currRow, 8, currRow + 2, 8)

          this.fillInst(ws, currRow, 9, min.toLocaleString('zh-TW'), '', '', styleRight)
          ws.mergeCells(currRow, 9, currRow + 2, 9)

          this.fillInst(ws, currRow, 10, diffMin, '', '', styleRight)
          ws.mergeCells(currRow, 10, currRow + 2, 10)

          for (let colIdx = 0; colIdx < maxCount; colIdx++) {
            const actualCol = 11 + colIdx
            if (colIdx < list.length) {
              const inst = list[colIdx]
              const idDisplay = inst.isCross ? `${inst.id}(${inst.origSec})` : inst.id
              this.fillInst(ws, currRow, actualCol, idDisplay, inst.date, inst.price.toLocaleString('zh-TW'), styleRight)
              ws.getCell(currRow, actualCol).alignment = alignCenter
              ws.getCell(currRow + 1, actualCol).alignment = alignCenter
            } else {
              this.fillInst(ws, currRow, actualCol, '', '', '', styleCenter)
            }
          }
          currRow += 3
        }

        ws.columns.forEach((col, idx) => {
          if (idx === 0) { col.width = 12 } else if (idx === 1) { col.width = 14 } else if (idx === 2 || idx === 3) { col.width = 10 } else if (idx >= 4 && idx <= 9) { col.width = 12 } else { col.width = 15 }
        })

        const buffer = await wb.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        saveAs(blob, '買例整理結果_v8.6.xlsx')

        this.statusSalesListText = '處理完成！已自動下載檔案。'
        this.success('買賣實例對應區段表處理完成並已匯出！')
      } catch (err) {
        this.statusSalesListText = '處理失敗: ' + err.message
        this.alert('處理過程發生錯誤：' + err.message, { variant: 'danger' })
      } finally {
        this.processingSalesList = false
      }
    },

    // =========================================================================
    // 工具 D: 查核案件挑檔 處理邏輯
    // =========================================================================
    resetCasePickForm () {
      this.pickFile1 = null
      this.pickFile2 = null
      this.pickFile3 = null
      this.pickFile4 = null
      this.pickResultSummary = null
      this.pickAgentList = []
      this.pickStatusText = ''
      this.pickProgressText = ''
    },

    async readExcelSheet (file) {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(new Uint8Array(e.target.result))
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
      return { workbook, worksheet, rows }
    },

    async handleCasePickProcess () {
      if (!this.pickFile1) {
        this.warning('請上傳檔案一：本月買賣案件清冊！')
        return
      }

      this.pickProcessing = true
      this.pickStatusText = '讀取比對檔案中...'
      this.pickStatusVariant = 'info'
      this.pickProgressText = ''

      try {
        const baseDoc = await this.readExcelSheet(this.pickFile1)
        const baseRows = baseDoc.rows
        if (!baseRows || baseRows.length <= 1) {
          throw new Error('檔案一（買賣案件清冊）無有效資料行！')
        }

        const agentColIdx = (this.pickFileType === '1') ? 56 : 59
        const f2Set = new Set()
        const f3Map = new Map()
        const f4Map = new Map()

        if (this.pickFile2) {
          const doc2 = await this.readExcelSheet(this.pickFile2)
          doc2.rows.slice(1).forEach((r) => {
            const seq = String(r[2] || '').trim()
            if (seq) { f2Set.add(seq) }
          })
        }

        if (this.pickFile3) {
          const doc3 = await this.readExcelSheet(this.pickFile3)
          doc3.rows.slice(1).forEach((r) => {
            const seq = String(r[1] || '').trim()
            const diff = parseFloat(r[6])
            if (seq && !isNaN(diff)) { f3Map.set(seq, diff) }
          })
        }

        if (this.pickFile4) {
          const doc4 = await this.readExcelSheet(this.pickFile4)
          doc4.rows.slice(1).forEach((r) => {
            const seq = String(r[1] || '').trim()
            const diff = parseFloat(r[6])
            if (seq && !isNaN(diff)) { f4Map.set(seq, diff) }
          })
        }

        const th3 = parseFloat(this.pickThreshold3) || 10
        const th4 = parseFloat(this.pickThreshold4) || 10

        let taxHitCount = 0
        let houseHitCount = 0
        let landHitCount = 0
        const matchedFlags = []
        const agentStats = new Map()

        for (let i = 1; i < baseRows.length; i++) {
          const row = baseRows[i]
          const seq = String(row[1] || '').trim()
          const reasons = []

          if (f2Set.has(seq)) {
            reasons.push('房地合一稅異常')
            taxHitCount++
          }

          if (f3Map.has(seq)) {
            const diff = f3Map.get(seq)
            if (Math.abs(diff) >= th3) {
              reasons.push(`大量估價異常(房地)差額${diff}%`)
              houseHitCount++
            }
          }

          if (f4Map.has(seq)) {
            const diff = f4Map.get(seq)
            if (Math.abs(diff) >= th4) {
              reasons.push(`大量估價異常(土地)差額${diff}%`)
              landHitCount++
            }
          }

          const hasHit = reasons.length > 0
          matchedFlags.push({
            isHit: hasHit,
            reason: reasons.join('、')
          })

          if (hasHit) {
            const agentName = String(row[agentColIdx] || '').trim() || '未填寫/無代理人'
            agentStats.set(agentName, (agentStats.get(agentName) || 0) + 1)
          }
        }

        this.pickResultSummary = {
          totalCases: baseRows.length - 1,
          taxHits: taxHitCount,
          houseHits: houseHitCount,
          landHits: landHitCount
        }

        this.pickAgentList = Array.from(agentStats.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        this.pickStatusText = '標記完成！正在以 ExcelJS 匯出紅底格式報表...'
        await this.exportCasePickWorkbook(baseRows, matchedFlags)

        this.pickStatusText = '比對挑檔完成！已自動下載標註清冊。'
        this.pickStatusVariant = 'success'
        this.success('查核案件挑檔比對成功！')
      } catch (err) {
        this.pickStatusText = '比對失敗: ' + err.message
        this.pickStatusVariant = 'danger'
        this.alert(err.message, { variant: 'danger' })
      } finally {
        this.pickProcessing = false
      }
    },

    async exportCasePickWorkbook (baseRows, matchedFlags) {
      const ExcelJS = await this.getExcelJS()
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('挑檔比對結果')

      const headerRow = [...baseRows[0], '查核異常標記', '異常原因說明']
      ws.addRow(headerRow)

      const headerLine = ws.getRow(1)
      headerLine.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF17324D' }
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      })

      const redFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' }
      }
      const redFont = {
        color: { argb: 'FF9C0006' }
      }

      for (let i = 0; i < matchedFlags.length; i++) {
        const flag = matchedFlags[i]
        const rowData = [...baseRows[i + 1], flag.isHit ? '異常' : '', flag.reason]
        const addedRow = ws.addRow(rowData)

        if (flag.isHit) {
          addedRow.eachCell((cell) => {
            cell.fill = redFill
            cell.font = redFont
          })
        }
      }

      ws.columns.forEach((col, idx) => {
        if (idx >= baseRows[0].length) {
          col.width = 25
        }
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, '實價登錄查核案件比對完成.xlsx')
    }
  }
}
</script>

<style lang="scss" scoped>
.s-90 {
  font-size: 90%;
}
.s-85 {
  font-size: 85%;
}
.s-80 {
  font-size: 80%;
}
</style>
