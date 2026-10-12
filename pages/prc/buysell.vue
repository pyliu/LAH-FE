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
        lah-help-modal(:modal-id="'buysell-help-modal'", size="lg")
          h5.font-weight-bold.text-primary.mb-3 地價買賣實例作業工具操作指引
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 1. 買賣實例對應區段表
            b-card-body.s-90
              ol.mb-0
                li #[strong 買賣實例清冊（必填）]：需包含 A 欄（實例號/序號）、E 欄（區段號，可多個以逗號或分號分隔）、G 欄（年月/日期）、K 欄（單價）。
                li #[strong 評議總表（必填）]：需包含 A 欄（區段號）、L 欄（擬評/現值）。
                li #[strong 物價指數（選填）]：需包含 A 欄（年月/日期）、B 欄（指數）。若未上傳，指數預設為 1。
                li 點擊「開始處理並下載」，系統將自動產生並下載排版完成的 #[code 買例整理結果.xlsx]。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 2. 買賣實例檢核（v2.5）
            b-card-body.s-90
              ol.mb-0
                li 支援 30 條結構化檢核規則（含全新 Z01 區段號對應轄區、基礎欄位、樓層用途、門牌臨街、建物單價、耐用折舊、工期利潤、勘查日期、裝潢現值、漏號/重號等）。
                li 三頁籤架構：提供「檢核作業」、「檢核項目與參數」與全新「區段號對照表」。
                li 內建 1,065 筆區段號對照表（115.10.12 彙總版），支援下載範例檔、自訂對照表 Excel 匯入與還原預設。
                li 全面改依「所屬轄區」與「轄管人員」分類統計與快速篩選，支援跨轄區案件自動比對。
                li 支援人工判定（待確認、有問題、無問題）與人工備註，狀態自動保存於本機，並提供註記備份與還原。
                li 匯出保留原始 Excel 格式及異常明細、轄區統計、編號檢核之多工作表檢核清冊。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 3. 查核案件挑檔
            b-card-body.s-90
              ol.mb-0
                li #[strong 步驟 1 本月買賣案件清冊（必填）]：可切換選擇「WEB 版」或「區估系統版」。
                li #[strong 步驟 2～4（選填）]：房地合一稅異常清冊（C 欄序號）、大量估價異常-房地與土地（可微調差異 % 門檻）。
                li 比對後在畫面呈現異常摘要與申報代理人案件統計，並自動下載標註紅底之 #[code 實價登錄查核案件比對完成.xlsx]。
          b-card(no-body)
            b-card-header.bg-light.font-weight-bold 4. 實價登錄10日檢核
            b-card-body.s-90
              ol.mb-0
                li 專為每十日一期的買賣、預售、租賃申報明細提供全面智慧檢核（內建 42 條專業防呆規則）。
                li 支援拖曳多個檔案或多工作表自動辨識（買賣、預售、租賃、略過）。
                li 支援人工審查判定（ok/warn/bad）與備註記錄、本機暫存與備份匯入。
                li 支援基準日、面積容許誤差、公設比上下限、格局上限、人名模糊比對等參數微調，並可一鍵匯出全案件檢核清冊 Excel。

  lah-transition(appear)
    .buysell-layout
      //- 左側導覽列 (維持如圖中分類)
      aside.buysell-sidebar
        .sb-nav
          //- 分類 1: 公告土地現值作業
          .sb-sec(:class="{ closed: secClosed[0] }")
            button.sb-cat(type="button", @click="toggleSec(0)")
              span.sb-ico: lah-fa-icon(icon="book-open", size="sm")
              span.sb-catname 公告土地現值作業
              lah-fa-icon.sb-chev(icon="chevron-down", size="xs")
            ul.sb-items
              li
                button.sb-item(
                  type="button",
                  :class="{ active: activeTabIdx === 0 }",
                  @click="activeTabIdx = 0"
                )
                  span.sb-dot •
                  span 買賣實例對應區段表
              li
                button.sb-item(
                  type="button",
                  :class="{ active: activeTabIdx === 1 }",
                  @click="activeTabIdx = 1"
                )
                  span.sb-dot •
                  span 買賣實例檢核

          //- 分類 2: 實價登錄
          .sb-sec(:class="{ closed: secClosed[1] }")
            button.sb-cat(type="button", @click="toggleSec(1)")
              span.sb-ico: lah-fa-icon(icon="id-card", size="sm")
              span.sb-catname 實價登錄
              lah-fa-icon.sb-chev(icon="chevron-down", size="xs")
            ul.sb-items
              li
                button.sb-item(
                  type="button",
                  :class="{ active: activeTabIdx === 2 }",
                  @click="activeTabIdx = 2"
                )
                  span.sb-dot •
                  span 查核案件挑檔
              li
                button.sb-item(
                  type="button",
                  :class="{ active: activeTabIdx === 3 }",
                  @click="activeTabIdx = 3"
                )
                  span.sb-dot •
                  span 10日檢核

      //- 右側內容工作台
      main.buysell-main
        //- 工具 A: 買賣實例對應區段表
        .buysell-pane(v-show="activeTabIdx === 0")
          .ui-frame
            .ui-head
              div
                h2 買賣實例對應區段表
                span.sub 版本日期：115.09.17｜區段號數量不限，支援物價指數換算
            .ui-body
              section.ui-card
                h3.ui-card-h
                  span.n 1
                  | 載入資料
                  span.aside 買賣實例清冊、評議總表為必填，物價指數為選填
                .ui-card-b
                  .ui-note
                    b 跨區段：
                    | E 欄可填入多個區段號（數量不限），以逗號「,」、頓號「、」或分號分隔，第一個視為主區段。
                    br
                    b 物價指數：
                    | 未上傳時，指數預設為 1，直接以 K 欄單價排序。
                  .ui-filegrid
                    .ui-filebox
                      .fb-h
                        | 買賣實例清冊
                        span.ui-badge.req 必填
                      input#fileRaw.ui-file(
                        type="file",
                        accept=".xlsx, .xls",
                        ref="fileRawInput",
                        @change="onFileRawChange"
                      )
                      span#msgRaw.ui-msg(:class="msgRawStatusClass") {{ msgRawText }}
                      .fb-spec 須包含：A 實例號、E 區段號、G 年月、K 單價
                    .ui-filebox
                      .fb-h
                        | 評議總表
                        span.ui-badge.req 必填
                      input#fileValuation.ui-file(
                        type="file",
                        accept=".xlsx, .xls",
                        ref="fileValuationInput",
                        @change="onFileValChange"
                      )
                      span#msgVal.ui-msg(:class="msgValStatusClass") {{ msgValText }}
                      .fb-spec 須包含：A 區段號、L 擬評
                    .ui-filebox.opt
                      .fb-h
                        | 物價指數
                        span.ui-badge.opt 選填
                      input#fileIndex.ui-file(
                        type="file",
                        accept=".xlsx, .xls",
                        ref="fileIndexInput",
                        @change="onFileIdxChange"
                      )
                      span#msgIdx.ui-msg(:class="msgIdxStatusClass") {{ msgIdxText }}
                      .fb-spec 須包含：A 年月、B 指數；未上傳時指數為 1
                .ui-actions
                  button#processBtn.ui-btn.primary(
                    type="button",
                    :disabled="!canProcessSalesList || processingSalesList",
                    @click="handleSalesListProcess"
                  ) {{ processingSalesList ? '處理中…' : '開始處理並下載' }}
                  span.note 處理完成後自動下載「買例整理結果」Excel
              #status.ui-status(
                v-if="statusSalesListText",
                :class="statusSalesListClass"
              ) {{ statusSalesListText }}

        //- 工具 C: 買賣實例檢核
        .buysell-pane(v-show="activeTabIdx === 1")
          lah-prc-audit

        //- 工具 D: 查核案件挑檔
        .buysell-pane(v-show="activeTabIdx === 2")
          .ui-frame
            .ui-head
              div
                h2 查核案件挑檔
                span.sub 版本日期：115.09.17（整合入口版，原獨立版 115.08.11）｜比對房地合一稅與大量估價異常清冊
            .ui-body
              section.ui-card
                h3.ui-card-h
                  span.n 1
                  | 本月買賣案件清冊
                  span.ui-badge.req 必填
                  span.aside 請先選擇清冊格式
                .ui-card-b
                  .ui-radio
                    label
                      input(
                        type="radio",
                        name="pickFile1Format",
                        value="web",
                        v-model="pickFileType"
                      )
                      span
                        b WEB 版：
                        | 第 15 列為標題列（A 欄＝申報書序號／Q 欄＝申報代理人）
                    label
                      input(
                        type="radio",
                        name="pickFile1Format",
                        value="system",
                        v-model="pickFileType"
                      )
                      span
                        b 區估系統版：
                        | 需有名為「買賣」的工作表，第 1 列為標題列（A 欄＝申報書序號／BD 欄＝申報代理人）
                  input#pickFile1.ui-file(
                    type="file",
                    accept=".csv, .xlsx, .xls",
                    ref="pickFile1Input",
                    @change="onPickFile1Change"
                  )

              section.ui-card
                h3.ui-card-h
                  span.n 2
                  | 異常清冊
                  span.ui-badge.opt 選填
                  span.aside 未上傳的清冊不列入比對
                .ui-card-b
                  .ui-filegrid
                    .ui-filebox.opt
                      .fb-h 房地合一稅異常清冊
                      input#pickFile2.ui-file(
                        type="file",
                        accept=".csv, .xlsx, .xls",
                        ref="pickFile2Input",
                        @change="onPickFile2Change"
                      )
                      .fb-spec C 欄：申報書序號
                    .ui-filebox.opt
                      .fb-h 大量估價異常－房地
                      .fb-row
                        input#pickFile3.ui-file(
                          type="file",
                          accept=".csv, .xlsx, .xls",
                          ref="pickFile3Input",
                          @change="onPickFile3Change"
                        )
                        label.fb-th(title="差異百分比大於此值即視為異常")
                          span 差異大於
                          input#pickThreshold3.ui-input(
                            type="number",
                            v-model.number="pickThreshold3",
                            min="0",
                            step="1"
                          )
                          span %
                      .fb-spec B 欄：序號＋2 碼；BN 欄：差異 %
                    .ui-filebox.opt
                      .fb-h 大量估價異常－土地
                      .fb-row
                        input#pickFile4.ui-file(
                          type="file",
                          accept=".csv, .xlsx, .xls",
                          ref="pickFile4Input",
                          @change="onPickFile4Change"
                        )
                        label.fb-th(title="差異百分比大於此值即視為異常")
                          span 差異大於
                          input#pickThreshold4.ui-input(
                            type="number",
                            v-model.number="pickThreshold4",
                            min="0",
                            step="1"
                          )
                          span %
                      .fb-spec B 欄：序號＋2 碼；BN 欄：差異 %
                  .ui-hint 大量估價清冊的差異百分比大於右側設定值即視為異常；比對結果中，有任一項異常的案件整列以紅底紅字標示，並另附「代理人統計」工作表。
                .ui-actions
                  button#pickProcessBtn.ui-btn.primary(
                    type="button",
                    :disabled="!pickFile1 || pickProcessing",
                    @click="handleCasePickProcess"
                  ) {{ pickProcessing ? '比對中…' : '開始比對並匯出結果' }}
                  button.ui-btn(
                    type="button",
                    :disabled="pickProcessing",
                    @click="resetCasePickForm"
                  ) 重設清除
                  span.note 完成後自動下載「實價登錄查核案件比對完成」Excel

              #pickStatus.ui-status(
                v-if="pickStatusText",
                :class="pickStatusClass"
              ) {{ pickStatusText }}

              section#pickResultCard.ui-card(v-if="pickResultSummary")
                h3.ui-card-h
                  span.n 3
                  | 比對結果摘要
                .ui-card-b
                  .ui-stats
                    .col
                      h4 總案件數
                      .big {{ pickResultSummary.totalCount }}
                        small 件
                    .col
                      h4 有異常案件
                      .big(:class="{ bad: pickResultSummary.anyCount > 0 }") {{ pickResultSummary.anyCount }}
                        small 件
                    .col
                      h4 房地合一稅異常
                      .big(:class="{ bad: pickResultSummary.taxCount > 0 }") {{ pickResultSummary.taxCount }}
                        small 件
                    .col
                      h4 大量估價異常
                      .big(:class="{ bad: pickResultSummary.valCount > 0 }") {{ pickResultSummary.valCount }}
                        small 件
                  .ui-tablewrap(v-if="pickAgentList && pickAgentList.length")
                    table.ui-table
                      thead
                        tr
                          th 申報代理人
                          th.num 總件數
                          th.num 房地合一稅異常
                          th.num 大量估價異常
                      tbody
                        tr(
                          v-for="agent in pickAgentList",
                          :key="agent.name",
                          :class="{ bad: agent.bad }"
                        )
                          td: b {{ agent.name }}
                          td.num {{ agent.total }}
                          td.num(:class="agent.taxAnomaly > 0 ? 'hit' : 'zero'") {{ agent.taxAnomaly }}
                          td.num(:class="agent.valAnomaly > 0 ? 'hit' : 'zero'") {{ agent.valAnomaly }}

        //- 工具 E: 10日檢核
        .buysell-pane(v-show="activeTabIdx === 3")
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
    secClosed: [false, false],

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
    statusSalesListClass: 'info',

    // =========================================================================
    // 工具 D: 查核案件挑檔 相關資料
    // =========================================================================
    pickFileType: 'web',
    pickFile1: null,
    pickFile2: null,
    pickFile3: null,
    pickFile4: null,
    pickThreshold3: 10,
    pickThreshold4: 10,
    pickProcessing: false,
    pickStatusText: '',
    pickStatusClass: 'info',
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
    msgRawStatusClass () {
      return this.msgRawOk ? 'ok' : (this.msgRawText ? 'fail' : '')
    },
    msgValStatusClass () {
      return this.msgValOk ? 'ok' : (this.msgValText ? 'fail' : '')
    },
    msgIdxStatusClass () {
      return this.msgIdxOk ? 'ok' : (this.msgIdxText ? 'fail' : '')
    },
    canProcessSalesList () {
      return !!(this.fileRaw && this.fileValuation && this.msgRawOk && this.msgValOk)
    }
  },
  mounted () {
    if (typeof window !== 'undefined') {
      window.XLSX = XLSX
      window.saveAs = saveAs
    }
  },
  methods: {
    toggleSec (idx) {
      this.$set(this.secClosed, idx, !this.secClosed[idx])
    },
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
    onFileRawChange (e) {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
      this.fileRaw = file
      this.validateFile('raw', file)
    },
    onFileValChange (e) {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
      this.fileValuation = file
      this.validateFile('val', file)
    },
    onFileIdxChange (e) {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
      this.fileIndex = file
      this.validateFile('idx', file)
    },

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
            errorMsg += `[${colName}] 異常 (${val || '空'}), `
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
          this[fieldMsgKey] = '✕ ' + errorMsg.slice(0, -2)
          this[fieldOkKey] = false
        }
      } catch (err) {
        this[fieldMsgKey] = '✕ 讀取失敗: ' + err.message
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
      this.statusSalesListClass = 'info'
      this.statusSalesListText = '步驟 1/5: 讀取檔案中...'

      try {
        const [rawRows, valRows, idxRows] = await Promise.all([
          this.readExcelToArray(this.fileRaw),
          this.readExcelToArray(this.fileValuation),
          this.fileIndex ? this.readExcelToArray(this.fileIndex) : Promise.resolve([])
        ])

        this.statusSalesListText = '步驟 2/5: 建立查找表...'

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

        this.statusSalesListText = '步驟 3/5: 分析買例資料...'

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

        this.statusSalesListText = '步驟 4/5: 使用 ExcelJS 繪製並排版報表中...'
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
        saveAs(blob, '買例整理結果.xlsx')

        this.statusSalesListText = '✓ 處理完成！已自動下載「買例整理結果.xlsx」。'
        this.statusSalesListClass = 'success'
        this.success('買賣實例對應區段表處理完成並已匯出！')
      } catch (err) {
        this.statusSalesListText = '✕ 處理失敗: ' + err.message
        this.statusSalesListClass = 'error'
        this.alert('處理過程發生錯誤：' + err.message, { variant: 'danger' })
      } finally {
        this.processingSalesList = false
      }
    },

    // =========================================================================
    // 工具 D: 查核案件挑檔 處理邏輯
    // =========================================================================
    colToIdx (colStr) {
      let idx = 0
      for (let i = 0; i < colStr.length; i++) {
        idx = idx * 26 + (colStr.charCodeAt(i) - 64)
      }
      return idx - 1
    },

    readWorkbook (file) {
      return new Promise((resolve, reject) => {
        if (!file) {
          resolve(null)
          return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            resolve(XLSX.read(data, { type: 'array' }))
          } catch (err) {
            reject(new Error(`無法解析檔案「${file.name}」：${err.message}`))
          }
        }
        reader.onerror = () => reject(new Error(`無法讀取檔案「${file.name}」`))
        reader.readAsArrayBuffer(file)
      })
    },

    onPickFile1Change (e) {
      this.pickFile1 = e.target.files && e.target.files[0] ? e.target.files[0] : null
    },
    onPickFile2Change (e) {
      this.pickFile2 = e.target.files && e.target.files[0] ? e.target.files[0] : null
    },
    onPickFile3Change (e) {
      this.pickFile3 = e.target.files && e.target.files[0] ? e.target.files[0] : null
    },
    onPickFile4Change (e) {
      this.pickFile4 = e.target.files && e.target.files[0] ? e.target.files[0] : null
    },

    resetCasePickForm () {
      this.pickFile1 = null
      this.pickFile2 = null
      this.pickFile3 = null
      this.pickFile4 = null
      this.pickResultSummary = null
      this.pickAgentList = []
      this.pickStatusText = ''
      this.pickStatusClass = 'info'
      if (this.$refs.pickFile1Input) { this.$refs.pickFile1Input.value = '' }
      if (this.$refs.pickFile2Input) { this.$refs.pickFile2Input.value = '' }
      if (this.$refs.pickFile3Input) { this.$refs.pickFile3Input.value = '' }
      if (this.$refs.pickFile4Input) { this.$refs.pickFile4Input.value = '' }
    },

    async handleCasePickProcess () {
      if (!this.pickFile1) {
        this.alert('請至少上傳「步驟 1：本月買賣案件清冊」！')
        return
      }

      this.pickProcessing = true
      this.pickStatusClass = 'info'
      this.pickStatusText = '步驟 1/4：讀取檔案中...'
      this.pickResultSummary = null
      this.pickAgentList = []

      try {
        const [wb1, wb2, wb3, wb4] = await Promise.all([
          this.readWorkbook(this.pickFile1),
          this.readWorkbook(this.pickFile2),
          this.readWorkbook(this.pickFile3),
          this.readWorkbook(this.pickFile4)
        ])

        // ===== 檔案 1：依格式決定標題列與代理人欄 =====
        let data1 = []
        let headerRowIndex = 0
        let agentColIdx = 0

        if (this.pickFileType === 'web') {
          data1 = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1, defval: '' })
          headerRowIndex = 14 // 第 15 列
          agentColIdx = this.colToIdx('Q')
        } else {
          if (!wb1.Sheets['買賣']) {
            throw new Error('檔案 1 中找不到名稱為「買賣」的工作表！請確認上傳了正確的區估系統檔案，或改選 WEB 版格式。')
          }
          data1 = XLSX.utils.sheet_to_json(wb1.Sheets['買賣'], { header: 1, defval: '' })
          headerRowIndex = 0 // 第 1 列
          agentColIdx = this.colToIdx('BD')
        }

        if (data1.length <= headerRowIndex) {
          throw new Error(`檔案 1 資料列數不足，找不到第 ${headerRowIndex + 1} 列標題列，請確認清冊格式選擇是否正確。`)
        }

        const idxFile1A = this.colToIdx('A')
        const taxAnomalySet = new Set()
        const valueAnomalySet = new Set()

        // ===== 檔案 2：房地合一稅異常（C 欄序號）=====
        this.pickStatusText = '步驟 2/4：建立異常清單...'
        if (wb2) {
          const data2 = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1, defval: '' })
          const idxC = this.colToIdx('C')
          for (let i = 1; i < data2.length; i++) {
            if (data2[i] && data2[i][idxC]) {
              taxAnomalySet.add(String(data2[i][idxC]).trim())
            }
          }
        }

        // ===== 檔案 3、4：大量估價（B 欄序號去末 2 碼，BN 欄差異%）=====
        const idxB = this.colToIdx('B')
        const idxBN = this.colToIdx('BN')
        const processValuationData = (wb, threshold) => {
          if (!wb) { return }
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
          for (let i = 1; i < data.length; i++) {
            const row = data[i]
            if (!row || row.length === 0) { continue }
            const idVal = row[idxB]
            const diffVal = row[idxBN]
            if (idVal && diffVal !== undefined && diffVal !== '' && parseFloat(diffVal) > threshold) {
              let idStr = String(idVal).trim()
              if (idStr.length >= 2) {
                idStr = idStr.slice(0, -2)
              }
              valueAnomalySet.add(idStr)
            }
          }
        }

        let threshold3 = parseFloat(this.pickThreshold3)
        let threshold4 = parseFloat(this.pickThreshold4)
        if (isNaN(threshold3)) { threshold3 = 10 }
        if (isNaN(threshold4)) { threshold4 = 10 }

        processValuationData(wb3, threshold3)
        processValuationData(wb4, threshold4)

        // ===== 產出比對資料 =====
        this.pickStatusText = '步驟 3/4：比對案件中...'
        const resultRows = []
        const summaryStats = {}
        let totalCount = 0
        let taxCount = 0
        let valCount = 0
        let anyCount = 0

        const originalHeader = data1[headerRowIndex] || []
        resultRows.push({
          values: ['抽查', ...originalHeader, '房地合一稅異常', '大量估價價格異常'],
          anomaly: false
        })

        for (let i = headerRowIndex + 1; i < data1.length; i++) {
          const row = data1[i]
          if (!row || row.length === 0 || row.join('').trim() === '') { continue }

          const key = String(row[idxFile1A] || '').trim()
          let agent = String(row[agentColIdx] || '').trim()
          if (!agent) { agent = '未填寫' }

          const isTax = key !== '' && taxAnomalySet.has(key)
          const isVal = key !== '' && valueAnomalySet.has(key)

          resultRows.push({
            values: ['', ...row, isTax ? '房地合一稅異常' : '無異常', isVal ? '大量估價價格異常' : '無異常'],
            anomaly: isTax || isVal
          })

          totalCount++
          if (isTax) { taxCount++ }
          if (isVal) { valCount++ }
          if (isTax || isVal) { anyCount++ }

          if (!summaryStats[agent]) {
            summaryStats[agent] = { total: 0, taxAnomaly: 0, valAnomaly: 0 }
          }
          summaryStats[agent].total++
          if (isTax) { summaryStats[agent].taxAnomaly++ }
          if (isVal) { summaryStats[agent].valAnomaly++ }
        }

        // ===== 建立 Excel（ExcelJS）=====
        this.pickStatusText = '步驟 4/4：產生 Excel...'
        const ExcelJS = await this.getExcelJS()
        const outWb = new ExcelJS.Workbook()

        // 工作表 1：比對結果（異常列紅底 #FFC7CE、紅字 #9C0006）
        const ws1 = outWb.addWorksheet('比對結果')
        const maxCols = resultRows.reduce((m, r) => Math.max(m, r.values.length), 0)
        resultRows.forEach((item, idx) => {
          const excelRow = ws1.addRow(item.values)
          if (idx === 0) {
            for (let c = 1; c <= maxCols; c++) {
              const cell = excelRow.getCell(c)
              cell.font = { bold: true }
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }
            }
          } else if (item.anomaly) {
            for (let c = 1; c <= maxCols; c++) {
              const cell = excelRow.getCell(c)
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }
              cell.font = { color: { argb: 'FF9C0006' } }
            }
          }
        })

        // 工作表 2：代理人統計（依總件數由多到少）
        const ws2 = outWb.addWorksheet('代理人統計')
        ws2.columns = [
          { header: '申報代理人', width: 30 },
          { header: '總件數', width: 12 },
          { header: '房地合一稅異常件數', width: 20 },
          { header: '大量估價異常件數', width: 20 }
        ]
        ws2.getRow(1).font = { bold: true }
        const sortedAgents = Object.keys(summaryStats).sort((a, b) => summaryStats[b].total - summaryStats[a].total)
        sortedAgents.forEach((agent) => {
          const s = summaryStats[agent]
          ws2.addRow([agent, s.total, s.taxAnomaly, s.valAnomaly])
        })

        const buffer = await outWb.xlsx.writeBuffer()
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '實價登錄查核案件比對完成.xlsx')

        // ===== 更新畫面摘要 =====
        this.pickResultSummary = {
          totalCount,
          taxCount,
          valCount,
          anyCount
        }
        this.pickAgentList = sortedAgents.map((agent) => {
          const s = summaryStats[agent]
          return {
            name: agent,
            total: s.total,
            taxAnomaly: s.taxAnomaly,
            valAnomaly: s.valAnomaly,
            bad: s.taxAnomaly > 0 || s.valAnomaly > 0
          }
        })

        const skipped = [!wb2 && '房地合一稅', !wb3 && '大量估價-房地', !wb4 && '大量估價-土地'].filter(Boolean)
        let msg = `✓ 比對與分析完成，檔案已自動下載。\n共 ${totalCount} 件，其中異常 ${anyCount} 件（房地合一稅 ${taxCount} 件、大量估價 ${valCount} 件）`
        if (skipped.length > 0) {
          msg += `\n未上傳、未列入比對：${skipped.join('、')}`
        }
        this.pickStatusText = msg
        this.pickStatusClass = 'success'
        this.success('查核案件挑檔比對成功！')
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        this.pickStatusText = '✕ 發生錯誤：' + error.message
        this.pickStatusClass = 'error'
        this.alert('比對挑檔發生錯誤：' + error.message, { variant: 'danger' })
      } finally {
        this.pickProcessing = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.buysell-layout {
  --ui-ink: #17324D;
  --ui-ink2: #2A4A69;
  --ink: #17324D;
  --ink-2: #2A4A69;
  --paper: #EEF2F1;
  --line: #CFD8D6;
  --line-2: #E3E9E7;
  --soft: #F7FAF9;
  --text: #1B2429;
  --muted: #5A6A72;
  --err: #B42318;
  --err-bg: #FDECEA;
  --err-bd: #F3B8B2;
  --warn: #8A5A00;
  --warn-bg: #FFF1CC;
  --warn-bd: #EBCB7A;
  --info: #1D5FA8;
  --info-bg: #E6F0FB;
  --info-bd: #B5CFEE;
  --ok: #2E7D4F;
  --ok-bg: #E5F4EA;
  --ok-bd: #B7DFC4;

  font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", "微軟正黑體", sans-serif;
  font-variant-numeric: tabular-nums;
  display: flex;
  min-height: calc(100vh - 120px);
  background-color: var(--paper);

  .buysell-sidebar {
    width: 248px;
    min-width: 248px;
    background: #17324D;
    color: #C9D6E2;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.12);
    user-select: none;

    .sb-nav {
      flex: 1;
      padding: 12px 0;

      .sb-sec {
        margin-bottom: 4px;

        .sb-cat {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          font-size: 13.5px;
          font-weight: 700;
          color: #93A9BE;
          letter-spacing: 0.5px;
          text-align: left;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;
          }

          .sb-ico {
            width: 22px;
            height: 22px;
            display: grid;
            place-items: center;
            flex-shrink: 0;
            color: #C9D6E2;
          }

          .sb-catname {
            flex: 1;
            overflow: hidden;
            white-space: nowrap;
          }

          .sb-chev {
            transition: transform 0.2s ease;
            color: #93A9BE;
          }
        }

        &.closed {
          .sb-chev {
            transform: rotate(-90deg);
          }
          .sb-items {
            display: none;
          }
        }

        .sb-items {
          list-style: none;
          margin: 0;
          padding: 0 0 6px;

          li {
            margin: 0;
          }

          .sb-item {
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 18px 10px 42px;
            font-size: 14px;
            color: #D5E0EA;
            white-space: nowrap;
            position: relative;
            cursor: pointer;
            border: none;
            background: transparent;
            transition: all 0.15s ease;

            .sb-dot {
              font-size: 16px;
              color: #5C7792;
              line-height: 1;
              flex-shrink: 0;
            }

            &:hover {
              background: rgba(255, 255, 255, 0.08);
              color: #ffffff;
            }

            &.active {
              background: rgba(255, 255, 255, 0.14);
              color: #ffffff;
              font-weight: 700;

              .sb-dot {
                color: #F2B705;
              }

              &::after {
                content: "";
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: #F2B705;
              }
            }
          }
        }
      }
    }
  }

  .buysell-main {
    flex: 1 1 0%;
    min-width: 0;
    padding: 16px 20px 32px;
    overflow-x: auto;
    background-color: var(--paper);

    .buysell-pane {
      width: 100%;
    }
  }

  /* ════════ 共用元件（四個工具一致） ════════ */
  .ui-frame {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(23, 50, 77, 0.06);
    font-size: 15px;
    line-height: 1.6;
    color: var(--text);
  }

  .ui-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    min-height: 62px;
    padding: 10px 20px;
    background: var(--ui-ink);
    color: #fff;
    flex-shrink: 0;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.5px;
      line-height: 1.4;
      color: #fff;
    }

    .sub {
      display: block;
      font-size: 12px;
      color: #C3D3E0;
      line-height: 1.5;
    }
  }

  .ui-body {
    flex: 1;
    overflow: auto;
    background: var(--paper);
    padding: 16px 20px 32px;
    scrollbar-gutter: stable;
  }

  /* 卡片 */
  .ui-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 6px;
    margin-bottom: 16px;
  }

  .ui-card-h {
    margin: 0;
    padding: 12px 18px;
    border-bottom: 1px solid var(--line-2);
    font-size: 16.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    color: var(--text);
    line-height: 1.5;

    .n {
      display: inline-grid;
      place-items: center;
      width: 25px;
      height: 25px;
      border-radius: 50%;
      background: var(--ui-ink);
      color: #fff;
      font-size: 13.5px;
      flex-shrink: 0;
    }

    .aside {
      margin-left: auto;
      font-weight: 400;
      font-size: 13px;
      color: var(--muted);
    }
  }

  .ui-card-b {
    padding: 15px 18px;
  }

  .ui-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 11px 18px;
    border-top: 1px solid var(--line-2);
    background: var(--soft);
    border-radius: 0 0 6px 6px;

    .note {
      color: var(--muted);
      font-size: 13px;
    }
  }

  /* 按鈕 */
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid var(--line);
    background: #fff;
    color: var(--text);
    border-radius: 5px;
    padding: 5px 12px;
    font-size: 14px;
    line-height: 1.5;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: #F2F5F4;
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &.primary {
      background: var(--ui-ink);
      border-color: var(--ui-ink);
      color: #fff;
      font-weight: 600;
      padding: 8px 22px;

      &:hover {
        background: var(--ui-ink2);
      }

      &:disabled {
        background: #8C9BA5;
        border-color: #8C9BA5;
        opacity: 1;
      }
    }
  }

  /* 輸入 */
  .ui-input {
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 5px 8px;
    font-size: 14px;
    background: #fff;
    color: var(--text);
    line-height: 1.5;

    &:focus {
      outline: 2px solid #9FB8D3;
      outline-offset: 0;
      border-color: var(--ui-ink2);
    }
  }

  .ui-file {
    width: 100%;
    height: 38px;
    font-size: 13.5px;
    border: 1px solid var(--line);
    border-radius: 5px;
    padding: 4px 5px;
    background: #fff;
    color: var(--muted);

    &:focus {
      outline: 2px solid #9FB8D3;
      outline-offset: 0;
      border-color: var(--ui-ink2);
    }

    &::file-selector-button {
      margin-right: 10px;
      padding: 3px 12px;
      border: 1px solid var(--line);
      background: var(--soft);
      border-radius: 4px;
      color: var(--text);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;

      &:hover {
        background: #E6ECEB;
      }
    }
  }

  /* 提示、標籤、狀態 */
  .ui-note {
    border: 1px solid var(--info-bd);
    background: var(--info-bg);
    color: #17497F;
    border-radius: 6px;
    padding: 9px 13px;
    font-size: 13.5px;
    line-height: 1.6;
    margin-bottom: 14px;

    b {
      font-weight: 700;
    }
  }

  .ui-badge {
    display: inline-block;
    font-size: 12px;
    line-height: 20px;
    padding: 0 8px;
    border-radius: 10px;
    font-weight: 600;
    white-space: nowrap;

    &.req {
      background: var(--err-bg);
      color: var(--err);
    }

    &.opt {
      background: #E9EEEC;
      color: var(--muted);
    }
  }

  .ui-status {
    margin: 0 0 16px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 13.5px;
    white-space: pre-wrap;
    line-height: 1.7;

    &.info {
      background: var(--soft);
      border: 1px solid var(--line-2);
      color: var(--muted);
      font-family: Consolas, "Courier New", monospace;
    }

    &.success {
      background: var(--ok-bg);
      border: 1px solid #B7DFC4;
      color: #1E6B3F;
      font-weight: 600;
    }

    &.error {
      background: var(--err-bg);
      border: 1px solid var(--err-bd);
      color: var(--err);
      font-weight: 600;
    }
  }

  /* 上傳檔案方塊 */
  .ui-filegrid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  .ui-filebox {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 12px 14px;
    background: #fff;

    &.opt {
      border-style: dashed;
      background: var(--soft);
    }
  }

  .fb-h {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 15px;
    color: var(--text);

    .ui-badge {
      margin-left: auto;
    }
  }

  .fb-spec {
    margin-top: auto;
    font-size: 12.5px;
    color: var(--muted);
    line-height: 1.6;
    border-top: 1px dotted var(--line);
    padding-top: 7px;
  }

  .ui-msg {
    display: block;
    min-height: 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);

    &.ok {
      color: var(--ok);
    }

    &.fail {
      color: var(--err);
    }
  }

  /* 選項列、內嵌欄位 */
  .ui-radio {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border: 1px solid var(--line-2);
    background: var(--soft);
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 12px;

    label {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 0;
    }

    input {
      margin-top: 5px;
      accent-color: var(--ui-ink);
    }

    b {
      font-weight: 700;
      color: var(--ui-ink);
    }

    span {
      color: var(--muted);
    }
  }

  .fb-row {
    display: flex;
    align-items: center;
    gap: 8px 10px;
    flex-wrap: wrap;

    .ui-file {
      flex: 1 1 220px;
      min-width: 220px;
    }
  }

  .fb-th {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    margin-bottom: 0;

    .ui-input {
      width: 64px;
      height: 38px;
      text-align: center;
      font-weight: 700;
      padding: 4px 6px;
    }
  }

  .ui-hint {
    font-size: 12.5px;
    color: var(--muted);
    margin-top: 8px;
  }

  /* 統計列 */
  .ui-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid var(--line);
    border-radius: 6px;
    overflow: hidden;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .col {
      padding: 11px 15px;
      border-left: 1px solid var(--line-2);

      &:first-child {
        border-left: 0;
        background: #F4F7FA;
      }
    }

    h4 {
      margin: 0 0 4px;
      font-size: 13.5px;
      color: var(--muted);
      font-weight: 500;
    }

    .big {
      font-size: 27px;
      font-weight: 700;
      line-height: 1.15;
      color: var(--ui-ink);

      &.bad {
        color: var(--err);
      }

      small {
        font-size: 13px;
        font-weight: 400;
        color: var(--muted);
        margin-left: 3px;
      }
    }
  }

  /* 資料表 */
  .ui-tablewrap {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 6px;
    margin-top: 14px;
  }

  .ui-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;

    th {
      background: #F4F7FA;
      font-weight: 600;
      font-size: 13px;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid var(--line);
      white-space: nowrap;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid var(--line-2);
    }

    .num {
      text-align: right;
    }

    tr.bad td {
      background: #FFF8F7;
    }

    td.hit {
      color: var(--err);
      font-weight: 700;
    }

    td.zero {
      color: #A3ADB3;
    }
  }
}
</style>
