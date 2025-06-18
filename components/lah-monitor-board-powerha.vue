<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }} - {{ headBatchDatetime }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="!footer"
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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
      ul
        li 顯示主資料庫 HACMP/PowerHA 叢集狀態
          ul
            li: ol
              li 請於 NODE1 的 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkAIXSh51" target="_blank" title="下載腳本") health_check_aix_51_HX.sh]」以利完成後送出通知電子郵件。(⭐請依各所實際環境修正腳本內路徑及收件者資訊⭐)
              li e.g. 在 root 的 crontab 新增「15 8-17 * * 1-6 /ha/health_check_aix_51_HA.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
            li: ol
              li 請於 NODE2 的 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkAIXSh52" target="_blank" title="下載腳本") health_check_aix_52.sh]」以利完成後送出通知電子郵件。(⭐請依各所實際環境修正腳本內收件者資訊⭐)
              li e.g. 在 root 的 crontab 新增「15 8-17 * * 1-6 /ha/health_check_aix_52.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
        li 分析電子郵件以顯示資料庫兩個NODE的啟用狀態。
        li 依 crontab 設定時間檢查後並送出電子郵件通知(桃園所 👉 每天 08:15 ~ 17:15 每小時檢查一次)。
        li 儀表板預設約每60分鐘更新檢查監控郵件一次。
      //- b-img.w-100.shadow(src="~/assets/img/mb_dnp.jpg", fluid, thumbnail)
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料
  div(v-else)
    b-table(
      :items="reportData",
      small,
      hover,
      responsive
    )
    //- .d-flex.justify-content-between.font-weight-bold
    //-   b-badge.my-auto.mr-1(:variant="light", pill) {{ badgeText }}
    //-   a.truncate(
    //-     href="#",
    //-     @click="popupLogContent(headMessage)",
    //-     title="顯示詳細記錄"
    //-   ) {{ extractNodes }}
    //-   lah-badge-human-datetime(
    //-     :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'",
    //-     :seconds="headMessage.timestamp"
    //-   )
    //- .text-muted.small.dnp-content(v-html="extractDNPValues")
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
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
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardPowerha',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 PowerHA',
    fetchType: 'subject',
    fetchKeyword: '[Health Check] - p8_',
    fetchDay: 1,
    nodes: {
      p8_51: {
        clusterInfo: {},
        highUsageFileSystems: [],
        oracleErrors: {},
        aixErrors: [],
        uniqueErrorsMap: new Map()
      },
      p8_52: {
        clusterInfo: {},
        highUsageFileSystems: [],
        oracleErrors: {},
        aixErrors: [],
        uniqueErrorsMap: new Map()
      }
    },
    reportData: [],
    nodeRegex: /ORAH[A-H]HA[1-2]/igm,
    foundNodes: [],
    // dnpRegex: /DNP.+ORAH[A-H]HA[1-2]\n\s+PgSpFree.+\n/igm,
    dnpRegex: /DNP.+ORAH[A-H]HA[1-2]\r\n\s+PgSpFree.+\r\n/igm,
    foundDNPValues: []
  }),
  computed: {
    checkAIXSh51 () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}/assets/sh/health_check_aix_51_HA.sh`
    },
    checkAIXSh52 () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}/assets/sh/health_check_aix_52.sh`
    },
    allBatches () {
      try {
        // Group messages by timestamp (minute precision)
        const groupedByTime = {}
        this.messages
          .filter(msg => msg.subject.includes('p8_51') || msg.subject.includes('p8_52'))
          .forEach((msg) => {
            const timeMatch = msg.subject.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)
            if (timeMatch) {
              const timestamp = timeMatch[1]
              if (!groupedByTime[timestamp]) {
                groupedByTime[timestamp] = { p8_51: [], p8_52: [] }
              }

              if (msg.subject.includes('p8_51')) {
                groupedByTime[timestamp].p8_51.push(msg)
              } else if (msg.subject.includes('p8_52')) {
                groupedByTime[timestamp].p8_52.push(msg)
              }
            }
          })

        // Analyze each batch
        const batches = Object.entries(groupedByTime).map(([timestamp, data]) => ({
          timestamp,
          hasBoth: data.p8_51.length > 0 && data.p8_52.length > 0,
          p8_51Count: data.p8_51.length,
          p8_52Count: data.p8_52.length,
          messages: data
        }))

        return batches.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      } catch (error) {
        console.error('Error analyzing batches:', error)
        return []
      }
    },
    headBatch () {
      if (this.allBatches.length > 0) {
        return this.allBatches[0]
      }
      return null
    },
    headBatchDatetime () {
      if (this.$utils.empty(this.headP8_51)) {
        return 'N/A'
      }
      try {
        const date = new Date(this.headP8_51.timestamp * 1000) // 將 UNIX 時間戳轉換為毫秒
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
      if (this.headBatch && this.headBatch.p8_51Count > 0) {
        return this.headBatch.messages.p8_51[0]
      }
      return null
    },
    headP8_52 () {
      if (this.headBatch && this.headBatch.p8_52Count > 0) {
        return this.headBatch.messages.p8_52[0]
      }
      return null
    },
    headMessage () {
      return this.messages[0]
    },
    headContent () {
      return this.headMessage.message || ''
    },
    extractNodes () {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.foundNodes = [...this.headContent.matchAll(this.nodeRegex)]
      const tmp = this.foundNodes.join(' ↔ ')
      if (this.$utils.empty(tmp)) {
        return '找不到 /ORAH[A-H]HA[1-2]/igm 配對資訊'
      }
      return tmp
    },
    extractDNPValues () {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.foundDNPValues = [...this.headContent.matchAll(this.dnpRegex)]
      if (this.foundDNPValues.length > 1) {
        return this.$utils.convertMarkd('- ' + this.foundDNPValues[0] + '- ' + this.foundDNPValues[1])
      }
      return this.$utils.convertMarkd(this.foundDNPValues.join('\n'))
    },
    light () {
      const now = +new Date()
      if (
        this.$utils.empty(this.headMessage) ||
        now - this.headMessage.timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      return this.foundNodes.length === 2 ? 'success' : 'danger'
    },
    emojiLight () {
      switch (this.light) {
        case 'danger': return '🔴'
        case 'success': return '🟢'
        default: return '🟡'
      }
    },
    badgeText () {
      switch (this.light) {
        case 'danger': return 'BROKEN'
        case 'success': return 'ACTIVE'
        default: return 'OUTDATED'
      }
    }
  },
  watch: {
    messages (val) {
      // this.$utils.warn('messages', val)
    },
    allBatches (val) {
      // this.$utils.warn('allBatches', val)
    },
    headBatch (val) {
      this.$utils.warn('headBatch', val)
      this.compare()
    },
    headP8_51 (val) {
      // this.$utils.warn('headP8_51', val)
      this.nodes.p8_51.clusterInfo = this.getClusterStatus(val.message)
      this.nodes.p8_51.highUsageFileSystems = this.getFileSystemUsage(val.message)
      this.nodes.p8_51.oracleErrors = this.getOracleErrors(val.message)
      this.nodes.p8_51.aixErrors = this.getAIXErrors(val.message)
      this.nodes.p8_51.uniqueErrorsMap = this.getUniqueOracleErrors(val.message)
      // force reactive
      this.nodes.p8_51 = { ...this.nodes.p8_51 }
    },
    headP8_52 (val) {
      // this.$utils.warn('headP8_52', val)
      this.nodes.p8_52.clusterInfo = this.getClusterStatus(val.message)
      this.nodes.p8_52.highUsageFileSystems = this.getFileSystemUsage(val.message)
      this.nodes.p8_52.oracleErrors = this.getOracleErrors(val.message)
      this.nodes.p8_52.aixErrors = this.getAIXErrors(val.message)
      this.nodes.p8_52.uniqueErrorsMap = this.getUniqueOracleErrors(val.message)
      // force reactive
      this.nodes.p8_52 = { ...this.nodes.p8_52 }
    },
    'nodes.p8_51' () {
      this.$utils.warn('nodes.p8_51', this.nodes.p8_51)
    },
    'nodes.p8_52' () {
      this.$utils.warn('nodes.p8_52', this.nodes.p8_52)
    },
    reportData () {
      this.$utils.warn('reportData', this.reportData)
    }
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
  },
  methods: {
    /**
     * 1. 擷取 HACMP/PowerHA 叢集狀態
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object} 包含叢集名稱和節點狀態的物件。
     */
    getClusterStatus (logContent) {
      const clusterInfo = {
        clusterName: null,
        nodes: []
      }

      // 使用正規表示式擷取叢集名稱
      const clusterNameMatch = logContent.match(/Cluster Name:\s*(\S+)/)
      if (clusterNameMatch && clusterNameMatch[1]) {
        clusterInfo.clusterName = clusterNameMatch[1]
      }

      // 定位到節點狀態區塊
      // 使用正規表達式 split(/Node\s+State/) 來處理 "Node" 和 "State" 間的任何空白字元
      const nodeStateSection = logContent.split(/Node\s+State/)[1]
      if (nodeStateSection) {
        const lines = nodeStateSection.trim().split('\n')
        // 從分隔線的下一行 (index 1) 開始迴圈
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()

          // 如果遇到空行或下一個段落的標誌，就停止解析
          if (line === '' || line.startsWith('#')) {
            break
          }

          const parts = line.split(/\s+/)
          if (parts.length >= 2) {
            const nodeName = parts[0]
            const state = parts[1]
            clusterInfo.nodes.push({ name: nodeName, state })
          }
        }
      }

      return clusterInfo
    },
    /**
     * 2. 分析檔案系統用量
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @param {number} threshold - 使用率警示閾值 (例如：80)。
     * @returns {Array<object>} 回傳超過閾值的檔案系統列表。
     */
    getFileSystemUsage (logContent, threshold = 80) {
      const highUsageFileSystems = []

      // 定位到檔案系統用量區塊
      const fsSectionMatch = logContent.match(/--> Filesystem usage \(in GB\)...([\s\S]*?)--> I\/O statistics/)
      if (fsSectionMatch && fsSectionMatch[1]) {
        const lines = fsSectionMatch[1].trim().split('\n')
        // 略過標頭
        const dataLines = lines.slice(1)

        dataLines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          // 確保該行是有效的檔案系統資訊
          if (parts.length >= 6 && parts[3].endsWith('%')) {
            const filesystem = parts[0] //
            const usedPercentStr = parts[3] //
            const mountedOn = parts[parts.length - 1] //
            const usedPercent = parseInt(usedPercentStr.replace('%', ''), 10)

            if (usedPercent > threshold) {
              highUsageFileSystems.push({
                filesystem,
                usedPercent,
                mountedOn
              })
            }
          }
        })
      }

      return highUsageFileSystems
    },
    /**
     * 3. 檢查 Oracle 資料庫錯誤
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object} 包含錯誤總數和各類錯誤計數的物件。
     */
    getOracleErrors (logContent) {
      const oracleErrors = {
        totalErrors: 0,
        errorSummary: {}
      }

      // 定位到 Oracle 錯誤日誌區塊
      const errorSectionMatch = logContent.match(/--> Checking Oracle Alert Log for errors \(ORA-\)...([\s\S]*?)--> Total lines in alert.log/)
      if (errorSectionMatch && errorSectionMatch[1]) {
        const errorLines = errorSectionMatch[1].trim().split('\n')

        errorLines.forEach((line) => {
          if (line.startsWith('ORA-')) {
            oracleErrors.totalErrors++
            // 擷取錯誤碼，例如 "ORA-00130"
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
    /**
     * 4. 擷取 AIX 錯誤報告摘要
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<object>} 包含所有錯誤摘要的陣列。
     */
    getAIXErrors (logContent) {
      const errorReports = []
      const summarySectionMatch = logContent.match(/--> Error Summary:([\s\S]*?)--> Detailed Error Report/)
      if (summarySectionMatch && summarySectionMatch[1]) {
        const lines = summarySectionMatch[1].trim().split('\n').slice(1)
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length > 4) {
            // 將每一筆錯誤的完整資訊存為一個物件
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
    /**
     * 5. (新增) 擷取首次出現的 Oracle 錯誤，並存入 Map
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Map<string, string>} 一個 Map，鍵為錯誤碼，值為首次出現的完整錯誤訊息。
     */
    getUniqueOracleErrors (logContent) {
      const uniqueErrorsMap = new Map()

      // 定位到 Oracle 錯誤日誌區塊
      const errorSectionMatch = logContent.match(/--> Checking Oracle Alert Log for errors \(ORA-\)...([\s\S]*?)--> Total lines in alert.log/)
      if (errorSectionMatch && errorSectionMatch[1]) {
        const errorLines = errorSectionMatch[1].trim().split('\n')

        errorLines.forEach((line) => {
          if (line.startsWith('ORA-')) {
            // 擷取錯誤碼，例如 "ORA-01555"
            const errorCodeMatch = line.match(/ORA-\d+/)
            if (errorCodeMatch) {
              const errorCode = errorCodeMatch[0]
              // 如果 Map 中還沒有這個錯誤碼，就將它和完整的 log 存進去
              if (!uniqueErrorsMap.has(errorCode)) {
                uniqueErrorsMap.set(errorCode, line.trim())
              }
            }
          }
        })
      }
      return uniqueErrorsMap
    },
    /**
     * (新增) 擷取所有檔案系統的掛載點
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<string>} - 包含所有掛載點的字串陣列。
     */
    getAllMountPoints (logContent) {
      const mountPoints = []
      const fsSectionMatch = logContent.match(/--> Filesystem usage \(in GB\)...([\s\S]*?)--> I\/O statistics/)
      if (fsSectionMatch && fsSectionMatch[1]) {
        const lines = fsSectionMatch[1].trim().split('\n').slice(1) // 略過標頭
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length > 1) { // 確保是有效行
            mountPoints.push(parts[parts.length - 1]) // 最後一個元素就是掛載點
          }
        })
      }
      return mountPoints
    },
    /**
     * 將陣列或 Map 轉換為易於閱讀的換行字串
     * @param {Array|Map} data - 要格式化的資料
     * @returns {string} - 格式化後的字串，若無資料則回傳 "無"
     */
    formatForDisplay (data) {
      if (!data || (Array.isArray(data) && data.length === 0) || (data instanceof Map && data.size === 0)) {
        return '無'
      }

      if (Array.isArray(data)) {
        // 處理 Filesystem 和 AIX Error 的陣列
        if (data.length > 0 && typeof data[0] === 'object') {
          return data.map(item => `${item.mountedOn} (${item.usedPercent})`).join('\n')
        }
        return data.join('\n')
      }

      if (data instanceof Map) {
        // 處理 Oracle Error 的 Map
        return Array.from(data.values()).join('\n')
      }

      return String(data)
    },
    compare () {
      try {
        // 1. 讀取兩個日誌檔案
        const logContent51 = this.headP8_51?.message
        const logContent52 = this.headP8_52?.message

        // 2. 分別解析兩台主機的資料
        const dataP851 = {
          cluster: this.getClusterStatus(logContent51),
          filesystem: this.getFileSystemUsage(logContent51, 80),
          oracleErrors: this.getUniqueOracleErrors(logContent51),
          aixErrors: this.getAIXErrors(logContent51),
          mountPoints: this.getAllMountPoints(logContent51)
        }

        const dataP852 = {
          cluster: this.getClusterStatus(logContent52),
          filesystem: this.getFileSystemUsage(logContent52, 80),
          oracleErrors: this.getUniqueOracleErrors(logContent52),
          aixErrors: this.getAIXErrors(logContent52),
          mountPoints: this.getAllMountPoints(logContent52)
        }

        // 準備格式化後的字串
        const clusterName51 = dataP851.cluster.clusterName
        const clusterName52 = dataP852.cluster.clusterName

        const nodeState51 = this.formatForDisplay(dataP851.cluster.nodes.map(n => `${n.name}: ${n.state}`))
        const nodeState52 = this.formatForDisplay(dataP852.cluster.nodes.map(n => `${n.name}: ${n.state}`))

        const filesystem51 = this.formatForDisplay(dataP851.filesystem)
        const filesystem52 = this.formatForDisplay(dataP852.filesystem)

        const oracleErrors51 = this.formatForDisplay(dataP851.oracleErrors)
        const oracleErrors52 = this.formatForDisplay(dataP852.oracleErrors)

        // 處理 AIX Error
        const aixErrorCount51 = dataP851.aixErrors.length
        const aixErrorCount52 = dataP852.aixErrors.length

        // (新增) 為了比對，將掛載點陣列排序後轉為字串
        const mountPointsStr51 = [...dataP851.mountPoints].sort().join('\n')
        const mountPointsStr52 = [...dataP852.mountPoints].sort().join('\n')

        this.reportData.length = 0
        // 進行比對及資料收集
        this.reportData.push({
          項目: '叢集名稱',
          p8_51: clusterName51,
          p8_52: clusterName52,
          '⚠': clusterName51 === clusterName52 ? '✅' : '❌'
        })
        this.reportData.push({
          項目: '節點狀態',
          p8_51: nodeState51,
          p8_52: nodeState52,
          '⚠': nodeState51 === nodeState52 ? '✅' : '❌'
        })
        this.reportData.push({
          項目: 'Filesystem 目錄',
          p8_51: mountPointsStr51,
          p8_52: mountPointsStr52,
          '⚠': mountPointsStr51 === mountPointsStr52 ? '✅' : '❌'
        })
        this.reportData.push({
          項目: 'Filesystem > 80%',
          p8_51: filesystem51,
          p8_52: filesystem52,
          '⚠': filesystem51 === filesystem52 ? '✅' : '❌'
        })
        this.reportData.push({
          項目: 'Oracle Error',
          p8_51: oracleErrors51,
          p8_52: oracleErrors52,
          '⚠': oracleErrors51 === oracleErrors52 ? '✅' : '❌'
        })
        this.reportData.push({
          項目: 'AIX Error',
          p8_51: aixErrorCount51 > 0 ? `${aixErrorCount51} 個錯誤` : '無',
          p8_52: aixErrorCount52 > 0 ? `${aixErrorCount52} 個錯誤` : '無',
          '⚠': aixErrorCount51 === aixErrorCount52 ? '✅' : '❌'
        })
      } catch (err) {
        this.$utils.error('執行過程中發生錯誤:', err.message)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dnp-content {
  ul, ol {
    padding-left: 10.25px;
  }
}
</style>
