<template lang="pug">
//- 主要卡片結構，綁定邊框顏色和閃爍效果
b-card(:border-variant="border", :class="[attentionCss]")
  //- 卡片標頭
  template(#header, v-if="showHeader"): .d-flex.justify-content-between.align-items-center
    //- 狀態指示燈
    lah-fa-icon(icon="circle", :variant="light")
    //- 標題
    strong {{ header }} - {{ clusterName }} - {{ headBatchDatetime }}
    //- 右上角按鈕群組
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="!footer",
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', fetchKeyword, 1)",
        title="讀取1天內訊息"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )

  //- 說明彈窗 (Modal)
  lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
    lah-powerha-help-content

  //- 主要內容插槽
  slot

  //- 無資料時的提示訊息
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料，請參照說明確認AIX節點是否有安裝檢測腳本。

  //- 主要資料表格
  div(v-else)
    b-table(
      :items="reportData",
      :fields="reportFields",
      striped,
      hover,
      responsive,
      bordered,
      caption-top,
      no-border-collapse,
      small,
      head-variant="dark",
      class="s-90",
      selectable,
      select-mode="single",
      selected-variant="success",
      :sticky-header="`${stickyHeaderMaxHeight}px`"
    )
      template(#cell(p8_51)="{ item }"): lah-powerha-report-cell(
        :item="item",
        :node-data="nodes.p8_51",
        node-key="p8_51",
        @show-errpt="popupErrptModal"
      )

      template(#cell(p8_52)="{ item }"): lah-powerha-report-cell(
        :item="item",
        :node-data="nodes.p8_52",
        node-key="p8_52",
        @show-errpt="popupErrptModal"
      )

  //- 卡片頁尾 (可選)
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer",
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import LahPowerhaHelpContent from '~/components/lah-monitor-board-powerha-help-content.vue'
import LahPowerhaReportCell from '~/components/lah-monitor-board-powerha-report-cell.vue'
import LahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'
import { HA_STATE_DEFINITIONS, REPORT_FIELDS } from '~/constants/lah-monitor-board-powerha-constants'

export default {
  name: 'LahMonitorBoardPowerhaCompare',
  components: {
    LahPowerhaReportCell,
    LahPowerhaHelpContent,
    LahMonitorBoardRaw
  },
  mixins: [lahMonitorBoardBase],
  props: {
    showHeader: { type: Boolean, default: true },
    footer: { type: Boolean, default: false },
    maxHeightOffset: { type: Number, default: 125 }
  },
  data: () => ({
    header: '資料庫 PowerHA',
    fetchType: 'subject',
    fetchKeyword: '[Health Check] - p8_',
    fetchDay: 1,
    nodes: {
      p8_51: {},
      p8_52: {}
    },
    reportData: [],
    resizeObserver: null,
    // 修改說明：新增 zoomDetectorFrame 屬性來存放 iframe 實例
    zoomDetectorFrame: null
  }),
  computed: {
    reportFields () {
      return REPORT_FIELDS
    },
    allBatches () {
      try {
        const groupedByTime = this.messages
          .filter(msg => msg.subject.includes('p8_51') || msg.subject.includes('p8_52'))
          .reduce((acc, msg) => {
            const timeMatch = msg.subject.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)
            if (timeMatch) {
              const timestamp = timeMatch[1]
              if (!acc[timestamp]) {
                acc[timestamp] = { p8_51: [], p8_52: [] }
              }
              if (msg.subject.includes('p8_51')) {
                acc[timestamp].p8_51.push(msg)
              } else if (msg.subject.includes('p8_52')) {
                acc[timestamp].p8_52.push(msg)
              }
            }
            return acc
          }, {})

        const batches = Object.entries(groupedByTime).map(([timestamp, data]) => ({
          timestamp,
          hasBoth: data.p8_51.length > 0 && data.p8_52.length > 0,
          p8_51Count: data.p8_51.length,
          p8_52Count: data.p8_52.length,
          messages: data
        }))

        return batches.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      } catch (error) {
        this.$utils.error('Error analyzing batches:', error)
        return []
      }
    },
    headBatch () {
      return this.allBatches.length > 0 ? this.allBatches[0] : null
    },
    headBatchDatetime () {
      if (this.$utils.empty(this.headP8_51)) {
        return 'N/A'
      }
      try {
        const date = new Date(this.headP8_51.timestamp * 1000)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } catch (err) {
        this.$utils.error(err)
        return ''
      }
    },
    headP8_51 () {
      return this.headBatch?.messages?.p8_51?.[0] || null
    },
    headP8_52 () {
      return this.headBatch?.messages?.p8_52?.[0] || null
    },
    clusterName () {
      if (this.is51Online) { return this.getClusterName(this.headP8_51.message) }
      if (this.is52Online) { return this.getClusterName(this.headP8_52.message) }
      return 'N/A'
    },
    is51Online () {
      if (!this.headP8_51) { return null }
      const match = this.headP8_51.message.match(/ORAH[0A-H]HA1\s+(\w+)/)
      return match ? match[1] === 'ONLINE' : null
    },
    is52Online () {
      if (!this.headP8_52) { return null }
      const match = this.headP8_52.message.match(/ORAH[A-H]HA2\s+(\w+)/)
      return match ? match[1] === 'ONLINE' : null
    },
    isBatchStale () {
      if (!this.headBatch) { return true }
      const mailDate = new Date(this.headBatch.timestamp)
      const now = new Date()
      const ageInMinutes = (now - mailDate) / (1000 * 60)
      return ageInMinutes > 30
    },
    isMissingLogs () {
      return this.headBatch && !this.headBatch.hasBoth
    },
    isClusterUnstable () {
      const state51 = this.nodes.p8_51?.clusterInfo?.nodes?.[0]?.clusterState
      const state52 = this.nodes.p8_52?.clusterInfo?.nodes?.[1]?.clusterState
      return (state51 && state51 !== 'ST_STABLE') || (state52 && state52 !== 'ST_STABLE')
    },
    light () {
      if (this.isBatchStale) { return 'warning' }
      if (this.isMissingLogs) { return 'danger' }
      if (this.isClusterUnstable) { return 'danger' }
      return 'success'
    },
    headMessage () {
      return this.messages[0]
    }
  },
  watch: {
    headBatch (batch) {
      if (batch) {
        this.processAllNodeData(batch)
      } else {
        this.nodes = { p8_51: {}, p8_52: {} }
        this.reportData = []
      }
    }
  },
  created () {
    this.prepareReportData = this.$utils.debounce(this.buildReport, 400)
  },
  mounted () {
    this.reloadMs = (15 * 60 + this.$utils.rand(60)) * 1000

    // 1. 高度計算函式
    this.updateMaxHeight = () => {
      this.$nextTick(() => {
        if (this.$el?.getBoundingClientRect) {
          const topOffset = this.$el.getBoundingClientRect().top
          this.calcStickyHeaderMaxHeight(topOffset - this.maxHeightOffset)
        }
      })
    }
    // 2. Debounced 版本的函式
    this.debouncedUpdateHeight = this.$utils.debounce(this.updateMaxHeight, 150)
    // 3. ResizeObserver
    this.resizeObserver = new ResizeObserver(this.debouncedUpdateHeight)
    this.resizeObserver.observe(this.$el)
    // 4. 'resize' 事件監聽
    window.addEventListener('resize', this.debouncedUpdateHeight)

    // 5. 新增：建立並設定隱藏的 iframe 用於偵測縮放
    this.zoomDetectorFrame = document.createElement('iframe')
    // 設定樣式使其完全不可見且不影響佈局
    const frameStyle = this.zoomDetectorFrame.style
    frameStyle.position = 'absolute'
    frameStyle.top = '-9999px'
    frameStyle.left = '-9999px'
    frameStyle.width = '100%'
    frameStyle.height = '100%'
    frameStyle.border = 'none'
    frameStyle.opacity = '0'
    frameStyle.pointerEvents = 'none' // 避免攔截滑鼠事件
    // 附加到元件 DOM 中
    this.$el.appendChild(this.zoomDetectorFrame)
    // 監聽 iframe 內部的 resize 事件，這是偵測縮放的關鍵
    this.zoomDetectorFrame.contentWindow.addEventListener('resize', this.debouncedUpdateHeight)
    // 6. 立即執行一次以設定初始高度
    this.updateMaxHeight()

    if (!this.footer) {
      this.reloadTimer = setInterval(() => { this.reload() }, this.reloadMs)
    }
  },
  beforeDestroy () {
    clearTimeout(this.reloadTimer)
    // 1. 移除 'resize' 事件監聽器
    window.removeEventListener('resize', this.debouncedUpdateHeight)
    // 2. 停止 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    // 3. 新增：清理 iframe 相關的資源
    if (this.zoomDetectorFrame) {
      // 移除 iframe 上的事件監聽器
      this.zoomDetectorFrame.contentWindow.removeEventListener('resize', this.debouncedUpdateHeight)
      // 從 DOM 中移除 iframe
      if (this.zoomDetectorFrame.parentNode) {
        this.zoomDetectorFrame.parentNode.removeChild(this.zoomDetectorFrame)
      }
      this.zoomDetectorFrame = null
    }
  },
  methods: {
    processAllNodeData (batch) {
      if (batch.messages.p8_51.length > 0) {
        this.nodes.p8_51 = this.parseNodeLog(batch.messages.p8_51[0].message)
      }
      if (batch.messages.p8_52.length > 0) {
        this.nodes.p8_52 = this.parseNodeLog(batch.messages.p8_52[0].message)
      }
      this.$nextTick(() => {
        this.prepareReportData()
      })
    },
    parseNodeLog (logText) {
      return {
        clusterInfo: this.getClusterStatus(logText),
        highUsageFileSystems: this.getFileSystemUsage(logText, 80),
        oracleErrors: this.getOracleErrors(logText),
        aixErrors: this.getAIXErrors(logText),
        errpts: this.parseAixHealthCheckErrpt(logText),
        allMounts: this.getAllMountPoints(logText),
        hacmpPids: this.getHacmpSubsystems(logText),
        dnpValues: this.getDnpValues(logText),
        memoryStats: this.getMemoryStats(logText),
        oracleProcs: this.getOracleProcessCount(logText),
        ioStats: this.getIoStats(logText)
      }
    },
    buildReport () {
      if (!this.nodes.p8_51.clusterInfo || !this.nodes.p8_52.clusterInfo) {
        this.reportData = []
        return
      }
      try {
        const p851State = this.getHAStateDefinition(this.nodes.p8_51.clusterInfo.nodes[0]?.clusterState)
        const p852State = this.getHAStateDefinition(this.nodes.p8_52.clusterInfo.nodes[1]?.clusterState)

        this.reportData = [
          { item: '叢集名稱', p8_51: this.nodes.p8_51.clusterInfo.clusterName, p8_52: this.nodes.p8_52.clusterInfo.clusterName, result: this.nodes.p8_51.clusterInfo.clusterName === this.nodes.p8_52.clusterInfo.clusterName ? '✅' : '❌' },
          { item: '節點狀態', p8_51: this.is51Online ? 'ONLINE' : 'OFFLINE', p8_52: this.is52Online ? 'ONLINE' : 'OFFLINE', result: this.is51Online && !this.is52Online ? '✅' : '❌' },
          { item: '叢集狀態', p8_51: { code: p851State.code, ...p851State }, p8_52: { code: p852State.code, ...p852State }, result: p851State.type === 'normal' && p852State.type === 'normal' ? '✅' : '❌' },
          { item: '檔案系統超過 80%', p8_51: this.nodes.p8_51.highUsageFileSystems, p8_52: this.nodes.p8_52.highUsageFileSystems, result: this.nodes.p8_51.highUsageFileSystems.length > 0 || this.nodes.p8_52.highUsageFileSystems.length > 0 ? '❌' : '✅' },
          { item: 'Oracle 錯誤', p8_51: this.nodes.p8_51.oracleErrors.totalErrors, p8_52: this.nodes.p8_52.oracleErrors.totalErrors, result: this.nodes.p8_51.oracleErrors.totalErrors > 0 || this.nodes.p8_52.oracleErrors.totalErrors > 0 ? '⚠' : '✅' },
          { item: 'AIX 錯誤', p8_51: this.nodes.p8_51.aixErrors.length, p8_52: this.nodes.p8_52.aixErrors.length, result: this.nodes.p8_51.aixErrors.length === 0 && this.nodes.p8_52.aixErrors.length === 0 ? '✅' : '❌' },
          { item: '檔案系統', p8_51: this.nodes.p8_51.allMounts, p8_52: this.nodes.p8_52.allMounts, result: this.nodes.p8_51.allMounts.length - this.nodes.p8_52.allMounts.length === 7 ? '✅' : '❌' },
          { item: '子系統 PID', p8_51: this.nodes.p8_51.hacmpPids, p8_52: this.nodes.p8_52.hacmpPids, result: '✅' },
          { item: 'NDP 數值', p8_51: this.nodes.p8_51.dnpValues, p8_52: this.nodes.p8_52.dnpValues, result: this.nodes.p8_51.dnpValues.length === 2 && this.nodes.p8_52.dnpValues.length === 2 ? '✅' : '❌' },
          { item: '記憶體', p8_51: this.nodes.p8_51.memoryStats, p8_52: this.nodes.p8_52.memoryStats, result: '✅' },
          { item: 'Oracle 程式數', p8_51: this.nodes.p8_51.oracleProcs, p8_52: this.nodes.p8_52.oracleProcs, result: this.nodes.p8_51.oracleProcs > 0 ? '✅' : '❌' },
          { item: 'I/O 統計', p8_51: this.nodes.p8_51.ioStats, p8_52: this.nodes.p8_52.ioStats, result: '✅' }
        ]
      } catch (err) {
        this.$utils.error('建立報告時發生錯誤:', err)
        this.reportData = []
      }
    },
    getHAStateDefinition (stateCode) {
      if (!stateCode) {
        return { name: '無資料', type: 'unknown', description: '缺少狀態碼。' }
      }
      const definition = HA_STATE_DEFINITIONS[stateCode]
      if (definition) {
        return { code: stateCode, ...definition }
      }
      return {
        code: stateCode,
        name: `未知狀態(${stateCode})`,
        type: 'unknown',
        description: `找不到狀態碼 "${stateCode}" 的相關資訊。`
      }
    },
    popupErrptModal (errpts, title = '') {
      this.modal(this.$createElement('b-table', {
        props: {
          items: errpts,
          headVariant: 'dark',
          small: true,
          hover: true,
          striped: true
        }
      }), {
        title: `AIX 錯誤詳情 - ${title}`,
        size: 'lg'
      })
    },
    formatErrptTimestamp (timestampStr) {
      if (timestampStr && timestampStr.length === 10) {
        const month = timestampStr.substring(0, 2)
        const day = timestampStr.substring(2, 4)
        const hour = timestampStr.substring(4, 6)
        const minute = timestampStr.substring(6, 8)
        const seconds = '00'
        return `${month}-${day} ${hour}:${minute}:${seconds}`
      }
      return timestampStr
    },
    parseAixHealthCheckErrpt (logText) {
      const lines = logText.split('\n')
      const summaryStartIndex = lines.findIndex(line => line.includes('--> Error Summary:'))
      if (summaryStartIndex === -1) {
        return []
      }
      let summaryEndIndex = lines.findIndex(line => line.includes('--> Detailed Error Report'))
      if (summaryEndIndex === -1) {
        summaryEndIndex = lines.length
      }
      const dataLines = lines.slice(summaryStartIndex + 2, summaryEndIndex)
      const resultArray = []
      for (const line of dataLines) {
        if (line.trim() === '') {
          continue
        }
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 5) {
          const jsonObject = {
            IDENTIFIER: parts[0],
            TIMESTAMP: this.formatErrptTimestamp(parts[1]),
            T: parts[2],
            C: parts[3],
            RESOURCE_NAME: parts[4],
            DESCRIPTION: parts.slice(5).join(' ')
          }
          resultArray.push(jsonObject)
        }
      }
      return resultArray
    },
    getClusterName (logContent) {
      const clusterNameMatch = logContent.match(/Cluster Name:\s*(\S+)/)
      if (clusterNameMatch && clusterNameMatch[1]) {
        return clusterNameMatch[1].replace(/_cluster$/i, '')
      }
      return 'N/A'
    },
    getClusterManagerState (logContent) {
      const regex = /Details of PowerHA SystemMirror cluster manager:[\s\S]*?Current state:\s*(\S+)/
      const match = logContent.match(regex)
      if (match && match[1]) {
        return match[1]
      }
      return 'N/A'
    },
    getNodeState (logContent) {
      const nodes = []
      const nodeStateSection = logContent.split(/Node\s+State/)[1]
      if (nodeStateSection) {
        const lines = nodeStateSection.trim().split('\n')
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line.startsWith('ORA')) {
            const parts = line.split(/\s+/)
            if (parts.length >= 2) {
              nodes.push({
                name: parts[0],
                state: parts[1],
                clusterState: this.getClusterManagerState(logContent)
              })
            }
          }
        }
      }
      return nodes
    },
    getClusterStatus (logContent) {
      return {
        clusterName: this.getClusterName(logContent),
        nodes: this.getNodeState(logContent)
      }
    },
    getAllMountPoints (logContent) {
      const mounts = []
      const fsSectionMatch = logContent.match(/--> Filesystem usage \(in GB\)...([\s\S]*?)--> I\/O statistics/)
      if (fsSectionMatch && fsSectionMatch[1]) {
        const lines = fsSectionMatch[1].trim().split('\n').slice(1)
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 6 && parts[3].endsWith('%')) {
            mounts.push({
              mountedOn: parts[parts.length - 1],
              usedPercent: parts[3].replace('%', '')
            })
          }
        })
      }
      mounts.sort((a, b) => {
        const percentB = parseFloat(b.usedPercent)
        const percentA = parseFloat(a.usedPercent)
        return percentB - percentA
      })
      return mounts
    },
    getFileSystemUsage (logContent, threshold = 80) {
      const highUsageFileSystems = []
      const fsSectionMatch = logContent.match(/--> Filesystem usage \(in GB\)...([\s\S]*?)--> I\/O statistics/)
      if (fsSectionMatch && fsSectionMatch[1]) {
        const lines = fsSectionMatch[1].trim().split('\n').slice(1)
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 6 && parts[3].endsWith('%')) {
            const usedPercent = parseInt(parts[3].replace('%', ''), 10)
            if (usedPercent > threshold) {
              highUsageFileSystems.push({
                filesystem: parts[0],
                usedPercent,
                mountedOn: parts[parts.length - 1]
              })
            }
          }
        })
      }
      return highUsageFileSystems
    },
    getAIXErrors (logContent) {
      const errorReports = []
      const summarySectionMatch = logContent.match(/--> Error Summary:([\s\S]*?)--> Detailed Error Report/)
      if (summarySectionMatch && summarySectionMatch[1]) {
        const lines = summarySectionMatch[1].trim().split('\n').slice(1)
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length > 4) {
            errorReports.push({
              identifier: parts[0],
              timestamp: parts[1],
              type: parts[2],
              class: parts[3],
              resourceName: parts[4],
              description: parts.slice(5).join(' ')
            })
          }
        })
      }
      return errorReports
    },
    getOracleErrors (logContent) {
      const oracleErrors = {
        totalErrors: 0,
        errorSummary: {}
      }
      const errorSectionMatch = logContent.match(/--> Checking Oracle Alert Log for errors \(ORA-\)...([\s\S]*?)--> Total lines in alert.log/)
      if (errorSectionMatch && errorSectionMatch[1]) {
        const errorLines = errorSectionMatch[1].trim().split('\n')
        errorLines.forEach((line) => {
          if (line.startsWith('ORA-')) {
            oracleErrors.totalErrors++
            const errorCodeMatch = line.match(/ORA-\d+/)
            if (errorCodeMatch) {
              const errorCode = errorCodeMatch[0]
              if (oracleErrors.errorSummary[errorCode]) {
                oracleErrors.errorSummary[errorCode]++
              } else {
                oracleErrors.errorSummary[errorCode] = 1
              }
            }
          }
        })
      }
      return oracleErrors
    },
    getHacmpSubsystems (logContent) {
      const subsystems = { rsct: [], powerha: [], caa: [] }
      const sections = {
        rsct: logContent.match(/Status of the RSCT subsystems used by PowerHA SystemMirror:([\s\S]*?)Status of the PowerHA SystemMirror subsystems:/),
        powerha: logContent.match(/Status of the PowerHA SystemMirror subsystems:([\s\S]*?)Status of the CAA subsystems:/),
        caa: logContent.match(/Status of the CAA subsystems:([\s\S]*?)Details of PowerHA SystemMirror cluster manager:/)
      }
      for (const key in sections) {
        if (sections[key] && sections[key][1]) {
          const lines = sections[key][1].trim().split('\n').slice(1)
          lines.forEach((line) => {
            const parts = line.trim().split(/\s+/)
            if (parts.length === 4) {
              subsystems[key].push({
                subsystem: parts[0],
                group: parts[1],
                pid: parts[2],
                status: parts[3]
              })
            }
          })
        }
      }
      return subsystems
    },
    getDnpValues (logContent) {
      const dnpValues = []
      const dnpSectionMatch = logContent.match(/Current DNP values([\s\S]*?)CAA Cluster Capabilities/)
      if (dnpSectionMatch && dnpSectionMatch[1]) {
        const textBlock = dnpSectionMatch[1]
        const nodeMatches = textBlock.matchAll(/NodeName - (\S+)[\s\n]+PgSpFree = (\S+)\s+PvPctBusy = (\S+)\s+PctTotalTimeIdle = (\S+)/g)
        for (const match of nodeMatches) {
          dnpValues.push({
            nodeName: match[1],
            pgSpFree: match[2],
            pvPctBusy: match[3],
            pctTotalTimeIdle: match[4]
          })
        }
      }
      return dnpValues
    },
    getMemoryStats (logContent) {
      const memSectionMatch = logContent.match(/--> Virtual memory and CPU statistics([\s\S]*?)(?===+)/)
      if (!memSectionMatch) { return null }
      const stats = { totalMemory: 'N/A', activeVirtualMemory: 'N/A' }
      const configMatch = memSectionMatch[0].match(/System configuration:.*mem=(\S+)/)
      if (configMatch) {
        stats.totalMemory = configMatch[1]
      }
      const dataLines = memSectionMatch[0].trim().split('\n')
      const lastDataLine = dataLines[dataLines.length - 1]
      const parts = lastDataLine.trim().split(/\s+/)
      if (parts.length > 2) {
        stats.activeVirtualMemory = parts[2]
      }
      return stats
    },
    getOracleProcessCount (logContent) {
      const match = logContent.match(/--> Checking Oracle process count \(estimated\)\.\.\.([\s\n]*)(\d+)/)
      if (match && match[2]) {
        return parseInt(match[2], 10)
      }
      return null
    },
    getIoStats (logContent) {
      const ioStats = { systemConfig: {}, cpu: {}, disks: [] }
      const ioSectionMatch = logContent.match(/--> I\/O statistics...([\s\S]*?)--> Virtual memory/)
      if (!ioSectionMatch || !ioSectionMatch[1]) { return ioStats }
      const textBlock = ioSectionMatch[1]
      const configMatch = textBlock.match(/System configuration:\s*(.*)/)
      if (configMatch) {
        configMatch[1].trim().split(/\s+/).forEach((pair) => {
          const [key, value] = pair.split('=')
          ioStats.systemConfig[key] = value
        })
      }
      const cpuMatch = textBlock.match(/% user\s+% sys\s+% idle\s+% iowait\s+physc\s+% entc\s*\n\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/)
      if (cpuMatch) {
        ioStats.cpu = { user: cpuMatch[1], sys: cpuMatch[2], idle: cpuMatch[3], iowait: cpuMatch[4], physc: cpuMatch[5], entc: cpuMatch[6] }
      }
      const disksSectionMatch = textBlock.match(/Disks:\s+% tm_act([\s\S]*)/)
      if (disksSectionMatch && disksSectionMatch[1]) {
        const diskLines = disksSectionMatch[1].trim().split('\n')
        diskLines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length === 6) {
            ioStats.disks.push({ disk: parts[0], tm_act_percent: parts[1], kbps: parts[2], tps: parts[3], kb_read: parts[4], kb_wrtn: parts[5] })
          }
        })
      }
      return ioStats
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
