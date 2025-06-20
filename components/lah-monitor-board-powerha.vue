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
        icon="code-compare",
        no-border,
        no-icon-gutter,
        @click="$refs.detail.show()",
        title="顯示兩個節點回報差異"
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
              li e.g. 在 root 的 crontab 新增「45 7-17 * * 1-6 /ha/health_check_aix_51_HA.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
            li: ol
              li 請於 NODE2 的 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkAIXSh52" target="_blank" title="下載腳本") health_check_aix_52.sh]」以利完成後送出通知電子郵件。(⭐請依各所實際環境修正腳本內收件者資訊⭐)
              li e.g. 在 root 的 crontab 新增「45 7-17 * * 1-6 /ha/health_check_aix_52.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
        li 分析電子郵件以顯示資料庫兩個NODE的啟用狀態。
        li 依 crontab 設定時間檢查後並送出電子郵件通知(桃園所 👉 每天 07:45 ~ 17:45 每小時檢查一次)。
        li 儀表板預設約每60分鐘更新檢查監控郵件一次。
        h6 ✨ 腳本相關設定請依各所調整，如郵件收件者、HXWEB ... 等，但是郵件標題 "[Health Check] - p8_" 請勿修改，智慧監控是依規則此抓郵件的。
        h6 ✨ AIX主機要認得的郵件伺服器(不然寄不出郵件) 👉 /etc/hosts 加入 entry (以桃園所設定為例 👉 220.1.34.50 mail.ha.cenweb.land.moi)
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
      :items="briefData"
      :fields="briefFields"
      striped
      hover
      responsive
      bordered
      caption-top
      no-border-collapse
      small
      head-variant="dark"
      class="s-80"
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      @row-selected="$refs.detail.show()"
    )
      template(#cell(item)="{ item }")
        div(v-if="item.item === '檔案系統超過 80%'") 超過 80%
        div(v-else) {{ item.item }}
      template(#cell(p8_51)="{ item }")
        div(v-if="item.item === '檔案系統' || item.item === '檔案系統超過 80%'")
          div(v-if="item.p8_51.length === 0") 無
          .d-flex.justify-content-between.flex-wrap(v-else)
            b-button.m-1.d-flex.align-items-center(
              v-for="(fs, idx) in item.p8_51"
              :key="`fs_btn_${idx}`"
              :size="'sm'"
              variant="outline-secondary"
              pill
            )
              .mr-1 {{ fs.mountedOn }}
              b-badge(
                pill
                :variant="fsVariant(fs.usedPercent)"
              ) {{ fs.usedPercent }}%

        h6(v-else-if="item.item === '節點狀態'"): b-badge(
          :variant="item.p8_51 === 'ONLINE' ? 'success' : 'danger'"
          pill
        ) {{ item.p8_51 }}

        div(v-else v-html="item.p8_51")
      template(#cell(p8_52)="{ item }")
        div(v-if="item.item === '檔案系統' || item.item === '檔案系統超過 80%'")
          div(v-if="item.p8_51.length === 0") 無
          .d-flex.justify-content-between.flex-wrap(v-else)
            b-button.m-1.d-flex.align-items-center(
              v-for="(fs, idx) in item.p8_52"
              :key="`fs_btn_${idx}`"
              :size="'sm'"
              variant="outline-secondary"
              pill
            )
              .mr-1 {{ fs.mountedOn }}
              b-badge(
                pill
                :variant="fsVariant(fs.usedPercent)"
              ) {{ fs.usedPercent }}%

        h6(v-else-if="item.item === '節點狀態'"): b-badge(
          :variant="item.p8_52 === 'ONLINE' ? 'danger' : 'secondary'"
          pill
        ) {{ item.p8_52 }}

        div(v-else v-html="item.p8_52")

  b-modal(
    ref="detail",
    size="xl",
    :title="`51/52 節點回報總覽 ${headBatchDatetime}`",
    hide-footer
  )
    b-table(
      :items="reportData"
      :fields="reportFields"
      striped
      hover
      responsive
      bordered
      caption-top
      no-border-collapse
      small
      head-variant="dark"
      class="s-90"
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
    )
      template(#cell(p8_51)="{ item }")
        div(v-if="item.item === '檔案系統' || item.item === '檔案系統超過 80%'")
          div(v-if="item.p8_51.length === 0") 無
          .d-flex.justify-content-between.flex-wrap(v-else)
            b-button.m-1.d-flex.align-items-center(
              v-for="(fs, idx) in item.p8_51"
              :key="`fs_btn_${idx}`"
              :size="'sm'"
              variant="outline-secondary"
              pill
            )
              .mr-1 {{ fs.mountedOn }}
              b-badge(
                pill
                :variant="fsVariant(fs.usedPercent)"
              ) {{ fs.usedPercent }}%

        h4(v-else-if="item.item === '節點狀態'"): b-badge(
          :variant="item.p8_51 === 'ONLINE' ? 'success' : 'danger'"
          pill
        ) {{ item.p8_51 }}

        div(v-else v-html="item.p8_51")
      template(#cell(p8_52)="{ item }")
        div(v-if="item.item === '檔案系統' || item.item === '檔案系統超過 80%'")
          div(v-if="item.p8_51.length === 0") 無
          .d-flex.justify-content-between.flex-wrap(v-else)
            b-button.m-1.d-flex.align-items-center(
              v-for="(fs, idx) in item.p8_52"
              :key="`fs_btn_${idx}`"
              :size="'sm'"
              variant="outline-secondary"
              pill
            )
              .mr-1 {{ fs.mountedOn }}
              b-badge(
                pill
                :variant="fsVariant(fs.usedPercent)"
              ) {{ fs.usedPercent }}%

        h4(v-else-if="item.item === '節點狀態'"): b-badge(
          :variant="item.p8_52 === 'ONLINE' ? 'danger' : 'secondary'"
          pill
        ) {{ item.p8_52 }}

        div(v-else v-html="item.p8_52")
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
    footer: { type: Boolean, default: false },
    maxHeightOffset: { type: Number, default: 170 }
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
    reportFields: [
      { key: 'item', label: '項目', sortable: true, thStyle: { width: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
      { key: 'p8_51', label: '節點51', sortable: false, thStyle: { width: '40%' } },
      { key: 'p8_52', label: '節點52', sortable: false, thStyle: { width: '40%' } },
      { key: 'result', label: '檢測', sortable: true }
    ],
    briefFields: [
      { key: 'item', label: '項目', sortable: true, thStyle: { width: '20%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
      { key: 'p8_51', label: '節點51', thStyle: { width: '40%' } },
      { key: 'p8_52', label: '節點52', thStyle: { width: '40%' } }
    ],
    maxHeight: 600
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
    briefData () {
      if (this.$utils.empty(this.reportData)) {
        return []
      }
      const targetItems = ['節點狀態', 'Oracle 程式數', '檔案系統超過 80%', 'Oracle 錯誤', 'AIX 錯誤']
      return targetItems
        .map(targetItem => this.reportData.find(item => item.item === targetItem))
        .filter(item => item !== undefined) // Remove any undefined items if not found
    },
    light () {
      if (
        this.$utils.empty(this.headBatch) ||
        Math.abs((new Date() - new Date(this.headBatch.timestamp * 1000)) / (1000 * 60 * 60) - 2) <= 0.1
      ) {
        return 'warning'
      }
      if (!this.headBatch.hasBoth) {
        return 'danger'
      }
      return 'success'
    },
    headMessage () {
      return this.messages[0]
    },
    // Method 1: Simple check using string search in the message
    isP8_51Offline () {
      const dataObj = this.headBatch
      // Check if p8_51 messages exist
      if (!dataObj.messages || !dataObj.messages.p8_51 || dataObj.messages.p8_51.length === 0) {
        return null // No data available
      }
      // Get the first (or latest) message from p8_51
      const p8_51Message = dataObj.messages.p8_51[0].message
      // Look for ORAHAHA1 node status in the message
      // Since p8_51 corresponds to ORAHAHA1, check if ORAHAHA1 is OFFLINE
      const orahaha1Match = p8_51Message.match(/ORAHAHA1\s+(\w+)/)

      if (orahaha1Match) {
        return orahaha1Match[1] === 'OFFLINE'
      }
      return null // Status not found
    },
    // Method 2: More robust parsing of the cluster status section
    parsedClusterStatus () {
      const dataObj = { ...this.headBatch }
      // Check if p8_51 messages exist
      if (dataObj === null || !dataObj.messages || !dataObj.messages.p8_51 || dataObj.messages.p8_51.length === 0) {
        this.$utils.warn('this!!')
        return null
      }
      const message = dataObj.messages.p8_51[0].message
      // Extract the cluster status section
      const clusterStatusMatch = message.match(/Node\s+State\s*\n-+\s+-+\s*\n([\s\S]*?)\n\n/)
      if (clusterStatusMatch) {
        const statusSection = clusterStatusMatch[1]
        const lines = statusSection.split('\n')
        const nodeStatuses = {}
        lines.forEach((line) => {
          const match = line.match(/(\w+)\s+(\w+)\s*$/)
          if (match) {
            nodeStatuses[match[1]] = match[2]
          }
        })
        return {
          nodeStatuses,
          isORAHAHA1Offline: nodeStatuses.ORAHAHA1 === 'OFFLINE',
          isORAHAHA2Offline: nodeStatuses.ORAHAHA2 === 'OFFLINE'
        }
      }

      return null
    },
    // Method 3: Quick one-liner check
    isP8_51OfflineQuick () {
      const message = this.headBatch?.messages?.p8_51?.[0]?.message
      if (!message) { return false }
      // Regular expression to match ORAHAHA1 followed by any whitespace and then OFFLINE
      const regex = /ORAHAHA1\s+OFFLINE/
      return regex.test(message)
    }
  },
  watch: {
    // messages (val) {
    //   this.$utils.warn('messages', val)
    // },
    // allBatches (val) {
    //   this.$utils.warn('allBatches', val)
    // },
    headBatch (val) {
      this.$utils.warn('headBatch', val)
      this.$utils.warn('parsedClusterStatus', this.parsedClusterStatus)
      this.$utils.warn('isP8_51Offline', this.isP8_51Offline)
      this.$utils.warn('isP8_51OfflineQuick', this.isP8_51OfflineQuick)
    },
    // 'nodes.p8_51' () {
    //   this.$utils.warn('nodes.p8_51', this.nodes.p8_51)
    // },
    // 'nodes.p8_52' () {
    //   this.$utils.warn('nodes.p8_52', this.nodes.p8_52)
    // },
    // reportData () {
    //   this.$utils.warn('reportData', this.reportData)
    // },
    parsedClusterStatus (val) {
      this.$utils.warn('parsedClusterStatus', val)
    },
    headP8_51 (val) {
      // this.$utils.warn('headP8_51', val)
      this.nodes.p8_51.clusterInfo = this.getClusterStatus(val.message)
      this.nodes.p8_51.highUsageFileSystems = this.getFileSystemUsage(val.message)
      this.nodes.p8_51.oracleErrors = this.getOracleErrors(val.message)
      this.nodes.p8_51.aixErrors = this.getAIXErrors(val.message)
      this.nodes.p8_51.uniqueErrorsMap = this.getUniqueOracleErrors(val.message)
      this.nodes.p8_51.hacmpPids = this.getHacmpSubsystems(val.message)
      this.nodes.p8_51.dnpValues = this.getDnpValues(val.message)
      this.nodes.p8_51.memoryStats = this.getMemoryStats(val.message)
      this.nodes.p8_51.oracleProcs = this.getOracleProcessCount(val.message)
      this.nodes.p8_51.ioStats = this.getIoStats(val.message)
      this.nodes.p8_51.haDataVgMounts = this.getHADataVgMounts(val.message)
      this.nodes.p8_51.allMounts = this.getAllMountPoints(val.message)
      // force reactive
      this.nodes.p8_51 = { ...this.nodes.p8_51 }
      this.prepareReportData()
    },
    headP8_52 (val) {
      // this.$utils.warn('headP8_52', val)
      this.nodes.p8_52.clusterInfo = this.getClusterStatus(val.message)
      this.nodes.p8_52.highUsageFileSystems = this.getFileSystemUsage(val.message)
      this.nodes.p8_52.oracleErrors = this.getOracleErrors(val.message)
      this.nodes.p8_52.aixErrors = this.getAIXErrors(val.message)
      this.nodes.p8_52.uniqueErrorsMap = this.getUniqueOracleErrors(val.message)
      this.nodes.p8_52.hacmpPids = this.getHacmpSubsystems(val.message)
      this.nodes.p8_52.dnpValues = this.getDnpValues(val.message)
      this.nodes.p8_52.memoryStats = this.getMemoryStats(val.message)
      this.nodes.p8_52.oracleProcs = this.getOracleProcessCount(val.message)
      this.nodes.p8_52.ioStats = this.getIoStats(val.message)
      this.nodes.p8_52.haDataVgMounts = this.getHADataVgMounts(val.message)
      this.nodes.p8_52.allMounts = this.getAllMountPoints(val.message)
      // force reactive
      this.nodes.p8_52 = { ...this.nodes.p8_52 }
      this.prepareReportData()
    }
  },
  created () {
    this.prepareReportData = this.$utils.debounce(this.compare, 400)
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
    this.maxHeight = parseInt(window.innerHeight - this.maxHeightOffset)
  },
  methods: {
    isTimestampNHoursAgo (timestampStr, targetHours, toleranceHours = 0.1) {
      const timestampDate = new Date(timestampStr)
      const now = new Date()
      const diffInHours = (now - timestampDate) / (1000 * 60 * 60)
      return {
        timestamp: timestampStr,
        currentTime: now.toLocaleString(),
        differenceInHours: Math.round(diffInHours * 100) / 100,
        isTargetHoursAgo: Math.abs(diffInHours - targetHours) <= toleranceHours,
        actualHoursAgo: Math.round(diffInHours)
      }
    },
    fsVariant (usedPercent) {
      const parsedInt = parseInt(usedPercent)
      if (parsedInt > 80) {
        return 'danger'
      } else if (parsedInt > 60) {
        return 'warning'
      } else if (parsedInt > 40) {
        return 'info'
      }
      return 'success'
    },
    // Helper function to get both node statuses
    getBothNodeStatuses () {
      const clusterStatus = this.parseClusterStatus(this.headBatch)
      if (clusterStatus) {
        return {
          p8_51_ORAHAHA1_isOffline: clusterStatus.isORAHAHA1Offline,
          p8_52_ORAHAHA2_isOffline: clusterStatus.isORAHAHA2Offline,
          nodeStatuses: clusterStatus.nodeStatuses
        }
      }
      return null
    },
    /**
     * 擷取 HACMP/PowerHA 叢集名稱
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {string} 叢集名稱，若找不到則回傳 "N/A"。
     */
    getClusterName (logContent) {
      const clusterNameMatch = logContent.match(/Cluster Name:\s*(\S+)/)
      if (clusterNameMatch && clusterNameMatch[1]) {
        return clusterNameMatch[1]
      }
      return 'N/A'
    },
    /**
     * 擷取叢集中各節點的狀態
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<object>} 包含節點物件的陣列，例如 [{ name: 'ORAHAHA1', state: 'ONLINE' }]
     */
    getNodeState (logContent) {
      const nodes = []
      // 使用正規表達式來處理 "Node" 和 "State" 間的任何空白字元
      const nodeStateSection = logContent.split(/Node\s+State/)[1]

      if (nodeStateSection) {
        const lines = nodeStateSection.trim().split('\n')
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line === '' || line.startsWith('#')) {
            break
          }
          const parts = line.split(/\s+/)
          if (parts.length >= 2) {
            nodes.push({ name: parts[0], state: parts[1] })
          }
        }
      }
      return nodes
    },
    /**
     * 1. 擷取 HACMP/PowerHA 叢集狀態
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object} 包含叢集名稱和節點狀態的物件。
     */
    getClusterStatus (logContent) {
      return {
        clusterName: this.getClusterName(logContent),
        nodes: this.getNodeState(logContent)
      }
    },
    /**
     * 擷取 HACMP/PowerHA 中共用磁區群組 (Volume Group) 的掛載資訊
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<object>} - 包含每個檔案系統詳細資訊的物件陣列。
     * 例如: [{ fileSystem: '/oracle', volumeGroup: 'datavg', resourceGroup: 'reg_ctl', nodeList: 'ORAHAHA1,ORAHAHA2' }]
     */
    getHADataVgMounts (logContent) {
      const mounts = []

      // 1. 定位到標頭，並將其之後的所有行都納入考慮
      const lines = logContent.split('\n')
      // 建立一個正規表示式來匹配標頭，\s+ 代表一個或多個空白字元
      const headerRegex = /^#\s*File\s+System\s+Volume\s+Group\s+Resource\s+Group\s+Node\s+List\s*$/

      // 使用正規表示式的 .test() 方法來尋找符合格式的標頭行
      const headerIndex = lines.findIndex(line => headerRegex.test(line.trim()))
      // *** 修正結束 ***

      if (headerIndex === -1) {
        // 如果找不到標頭，直接回傳空陣列
        return mounts
      }

      // 從標頭的下一行開始逐行解析
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()

        // 如果遇到空行或下一個大段落的分隔線，就停止
        if (line === '' || line.startsWith('===')) {
          break
        }

        const parts = line.split(/\s+/)
        if (parts.length === 4) {
          mounts.push({
            fileSystem: parts[0],
            volumeGroup: parts[1],
            resourceGroup: parts[2],
            nodeList: parts[3]
          })
        }
      }

      return mounts
    },
    /**
     * 擷取所有檔案系統的掛載點
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<string>} - 包含所有掛載點的字串陣列。
     */
    getAllMountPoints (logContent) {
      const mounts = []
      const fsSectionMatch = logContent.match(/--> Filesystem usage \(in GB\)...([\s\S]*?)--> I\/O statistics/)
      if (fsSectionMatch && fsSectionMatch[1]) {
        const lines = fsSectionMatch[1].trim().split('\n').slice(1) // 略過標頭
        lines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          // 確保是包含百分比的有效資料行
          if (parts.length >= 6 && parts[3].endsWith('%')) {
            mounts.push({
              mountedOn: parts[parts.length - 1], // 最後一個元素是掛載點
              usedPercent: parts[3].replace('%', '') // 第四個元素是使用率百分比
            })
          }
        })
      }
      // 使用率高的排在前面
      mounts.sort((a, b) => {
        // 將 '73%' 這樣的字串轉換為數字 73 以便比較
        const percentB = parseFloat(b.usedPercent)
        const percentA = parseFloat(a.usedPercent)
        // 回傳 b - a 即可實現由大到小的反向排序
        return percentB - percentA
      })
      return mounts
    },
    /**
     * 找出使用率超過指定閾值的檔案系統
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
     * 擷取首次出現的 Oracle 錯誤，並存入 Map
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
     * 擷取 AIX 錯誤報告摘要
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
     * 檢查 Oracle 資料庫錯誤
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
     * 擷取 HACMP/PowerHA 各子系統的進程資訊 (PID)
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object} 包含三類子系統資訊的物件，每類都是一個物件陣列。
     */
    getHacmpSubsystems (logContent) {
      const subsystems = {
        rsct: [],
        powerha: [],
        caa: []
      }

      const sections = {
        rsct: logContent.match(/Status of the RSCT subsystems used by PowerHA SystemMirror:([\s\S]*?)Status of the PowerHA SystemMirror subsystems:/),
        powerha: logContent.match(/Status of the PowerHA SystemMirror subsystems:([\s\S]*?)Status of the CAA subsystems:/),
        caa: logContent.match(/Status of the CAA subsystems:([\s\S]*?)Details of PowerHA SystemMirror cluster manager:/)
      }

      for (const key in sections) {
        if (sections[key] && sections[key][1]) {
          const lines = sections[key][1].trim().split('\n').slice(1) // 略過標頭
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
    /**
     * 擷取 HACMP/PowerHA 的 DNP (Do Not Ping) 數值
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {Array<object>} 包含每個節點 DNP 數值的物件陣列。
     */
    getDnpValues (logContent) {
      const dnpValues = []
      const dnpSectionMatch = logContent.match(/Current DNP values([\s\S]*?)CAA Cluster Capabilities/)

      if (dnpSectionMatch && dnpSectionMatch[1]) {
        const textBlock = dnpSectionMatch[1]
        // 使用正規表達式匹配每個節點的區塊
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
    /**
     * 擷取系統資源中的虛擬記憶體統計
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object|null} 包含總記憶體和已用虛擬記憶體的物件，或 null。
     */
    getMemoryStats (logContent) {
      const memSectionMatch = logContent.match(/--> Virtual memory and CPU statistics([\s\S]*?)(?===+)/)
      if (!memSectionMatch) { return null }

      const stats = {
        totalMemory: 'N/A',
        activeVirtualMemory: 'N/A' // AVM
      }

      // 擷取總記憶體
      const configMatch = memSectionMatch[0].match(/System configuration:.*mem=(\S+)/)
      if (configMatch) {
        stats.totalMemory = configMatch[1]
      }

      // 擷取最後一筆 avm 數值
      const dataLines = memSectionMatch[0].trim().split('\n')
      const lastDataLine = dataLines[dataLines.length - 1]
      const parts = lastDataLine.trim().split(/\s+/)

      if (parts.length > 2) {
        stats.activeVirtualMemory = parts[2] // 'avm' 是第三個欄位
      }

      return stats
    },
    /**
     * 擷取 Oracle 預估的程序數量
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {number|null} 程序數量或 null。
     */
    getOracleProcessCount (logContent) {
      const match = logContent.match(/--> Checking Oracle process count \(estimated\)\.\.\.([\s\n]*)(\d+)/)
      if (match && match[2]) {
        return parseInt(match[2], 10)
      }
      return null
    },
    /**
     * 擷取系統資源中的 I/O 統計資訊
     * @param {string} logContent - 日誌檔案的完整文字內容。
     * @returns {object} 包含系統設定和磁碟 I/O 列表的物件。
     */
    getIoStats (logContent) {
      const ioStats = {
        systemConfig: {},
        cpu: {},
        disks: []
      }

      const ioSectionMatch = logContent.match(/--> I\/O statistics...([\s\S]*?)--> Virtual memory/)
      if (!ioSectionMatch || !ioSectionMatch[1]) { return ioStats }

      const textBlock = ioSectionMatch[1]

      // 解析 System configuration
      const configMatch = textBlock.match(/System configuration:\s*(.*)/)
      if (configMatch) {
        configMatch[1].trim().split(/\s+/).forEach((pair) => {
          const [key, value] = pair.split('=')
          ioStats.systemConfig[key] = value
        })
      }

      // 解析 avg-cpu
      const cpuMatch = textBlock.match(/% user\s+% sys\s+% idle\s+% iowait\s+physc\s+% entc\s*\n\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/)
      if (cpuMatch) {
        ioStats.cpu = {
          user: cpuMatch[1],
          sys: cpuMatch[2],
          idle: cpuMatch[3],
          iowait: cpuMatch[4],
          physc: cpuMatch[5],
          entc: cpuMatch[6]
        }
      }

      // 解析 Disks
      const disksSectionMatch = textBlock.match(/Disks:\s+% tm_act([\s\S]*)/)
      if (disksSectionMatch && disksSectionMatch[1]) {
        const diskLines = disksSectionMatch[1].trim().split('\n')
        diskLines.forEach((line) => {
          const parts = line.trim().split(/\s+/)
          if (parts.length === 6) {
            ioStats.disks.push({
              disk: parts[0],
              tm_act_percent: parts[1],
              kbps: parts[2],
              tps: parts[3],
              kb_read: parts[4],
              kb_wrtn: parts[5]
            })
          }
        })
      }

      return ioStats
    },
    /**
     * 將陣列或 Map 轉換為易於閱讀的換行字串
     * @param {Array|Map} data - 要格式化的資料
     * @returns {string} - 格式化後的字串，若無資料則回傳 "無"
     */
    formatForDisplay (data) {
    // 處理 null 或空的陣列/Map
      if (data === null || data === undefined) {
        return '無'
      }
      if ((Array.isArray(data) && data.length === 0) || (data instanceof Map && data.size === 0)) {
        return '無'
      }

      // *** 新增開始: 專門處理子系統 PID 物件 ***
      // 透過檢查物件是否含有 'rsct' 和 'powerha' 這些獨特的鍵來識別它
      if (typeof data === 'object' && data !== null && data.hasOwnProperty('rsct') && data.hasOwnProperty('powerha')) {
        const outputLines = []
        const formatSection = (title, subsystems) => {
          if (subsystems && subsystems.length > 0) {
            outputLines.push(`${title}:`)
            subsystems.forEach((s) => {
              outputLines.push(`  - ${s.subsystem} (PID: ${s.pid}) ${s.status}`)
            })
          }
        }

        formatSection('RSCT', data.rsct)
        formatSection('PowerHA', data.powerha)
        formatSection('CAA', data.caa)

        return outputLines.length > 0 ? outputLines.join('\n') : '無'
      }
      // *** 新增結束 ***

      // 處理陣列 (Array) 的特殊顯示規則
      if (Array.isArray(data)) {
        if (data.length > 0 && data[0] && data[0].hasOwnProperty('mountedOn')) {
          return data.map(item => `${item.mountedOn} (${item.usedPercent})`).join('\n')
        }
        if (data.length > 0 && data[0] && data[0].hasOwnProperty('identifier')) {
          return data.map(item => item.description).join('\n')
        }
        return data.join('\n')
      }

      // 處理 Map 物件
      if (data instanceof Map) {
        return Array.from(data.values()).join('\n')
      }

      // 處理包含巢狀結構的純物件
      if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2)
      }

      // 處理原始型別 (string, number 等)
      return String(data)
    },
    /**
     * 將各種資料類型轉換為易於在網頁上閱讀的 HTML 片段
     * @param {any} data - 要格式化的資料
     * @returns {string} - 格式化後的 HTML 字串
     */
    formatPIDsHtmlDisplay (data) {
    // 處理 null 或空的陣列/Map，直接回傳文字
      if (data === null || data === undefined) {
        return '無'
      }
      if ((Array.isArray(data) && data.length === 0) || (data instanceof Map && data.size === 0)) {
        return '無'
      }

      // 專門處理子系統 PID 物件
      if (typeof data === 'object' && data !== null && data.rsct && data.powerha) {
        const outputLines = []
        const formatSection = (title, subsystems) => {
          if (subsystems && subsystems.length > 0) {
            // 將標題變為粗體
            outputLines.push(`<strong>${title}:</strong>`)
            subsystems.forEach((s) => {
              // 將前面的空格替換成 &nbsp; 來實現縮排效果
              outputLines.push(`&nbsp;&nbsp;- ${s.subsystem} (PID: ${s.pid}) ${s.status}`)
            })
          }
        }

        formatSection('RSCT', data.rsct)
        formatSection('PowerHA', data.powerha)
        formatSection('CAA', data.caa)

        // 使用 <br> 作為換行符
        return outputLines.length > 0 ? outputLines.join('<br>') : '無'
      }

      // 處理原始型別
      return String(data)
    },
    /**
     * 將DNP (Do Not Ping) 數值的資料類型轉換為易於在網頁上閱讀的 HTML 片段
     * @param {any} data - 要格式化的資料
     * @returns {string} - 格式化後的 HTML 字串
     */
    formatNDPHtmlDisplay (data) {
    // 處理 null 或空的陣列/Map，直接回傳文字
      if (data === null || data === undefined) {
        return '無'
      }
      if ((Array.isArray(data) && data.length === 0) || (data instanceof Map && data.size === 0)) {
        return '無'
      }
      const ORAHAHA1 = data[0]
      const first = `pgSpFree: ${ORAHAHA1.pgSpFree}, pctTotalTimeIdle: ${ORAHAHA1.pctTotalTimeIdle}`
      const ORAHAHA2 = data[1]
      const second = `pgSpFree: ${ORAHAHA2.pgSpFree}, pctTotalTimeIdle: ${ORAHAHA2.pctTotalTimeIdle}`
      return `<strong>ORAHAHA1</strong><br/>&nbsp;&nbsp;- ${first}<br/><strong>ORAHAHA2</strong><br/>&nbsp;&nbsp;- ${second}`
    },
    /**
     * 將 MemoryStats 數值的資料類型轉換為易於在網頁上閱讀的 HTML 片段
     * @param {any} data - 要格式化的資料
     * @returns {string} - 格式化後的 HTML 字串
     */
    formatMemoryStatsHtmlDisplay (data) {
    // 處理 null 或空的陣列/Map，直接回傳文字
      if (data === null || data === undefined) {
        return '無'
      }
      if ((Array.isArray(data) && data.length === 0) || (data instanceof Map && data.size === 0)) {
        return '無'
      }
      return `
        總容量: <b>${data.totalMemory}</b>
        活躍數: ${(data.activeVirtualMemory / 1024).toFixed(2)}MB
      `
    },
    /**
     * 將 I/O 統計物件轉換為易於閱讀的 HTML 片段
     * @param {object} ioStats - 從 getIoStats() 函式得到的物件
     * @returns {string} - 格式化後的 HTML 字串
     */
    formatIOStatsHtmlDisplay (ioStats) {
    // 檢查是否有有效的資料
      if (!ioStats || !ioStats.systemConfig || !ioStats.disks) {
        return '無 I/O 統計資料'
      }

      let html = ''

      // 1. 處理 System Configuration
      if (ioStats.systemConfig) {
        html += '<strong>System Configuration:</strong><br>'
        const configDetails = Object.entries(ioStats.systemConfig)
          .map(([key, value]) => `&nbsp;&nbsp;${key}: ${value}`)
          .join(', ')
        html += `${configDetails}<br><br>`
      }

      // 2. 處理 CPU Statistics
      if (ioStats.cpu) {
        html += '<strong>CPU Statistics:</strong><br>'
        const cpuDetails = Object.entries(ioStats.cpu)
          .map(([key, value]) => `&nbsp;&nbsp;% ${key}: ${value}`)
          .join(', ')
        html += `${cpuDetails}<br><br>`
      }

      // 3. 處理 Disks (使用表格)
      if (ioStats.disks && ioStats.disks.length > 0) {
        html += '<strong>Disk I/O:</strong>'
        html += `
        <style>
            .io-disk-table { font-size: 0.9em; border-collapse: collapse; margin-top: 5px; width: 100%; }
            .io-disk-table th, .io-disk-table td { border: 1px solid #ccc; padding: 6px; text-align: right; }
            .io-disk-table th { background-color: #f8f8f8; }
            .io-disk-table td:first-child { text-align: left; }
        </style>
        <table class="io-disk-table">
            <thead>
                <tr>
                    <th>Disk</th>
                    <th>% tm_act</th>
                    <th>Kbps</th>
                    <th>tps</th>
                    <th>Kb_read</th>
                    <th>Kb_wrtn</th>
                </tr>
            </thead>
            <tbody>
        `

        ioStats.disks.forEach((disk) => {
          html += `
                <tr>
                    <td>${disk.disk}</td>
                    <td>${disk.tm_act_percent}</td>
                    <td>${disk.kbps}</td>
                    <td>${disk.tps}</td>
                    <td>${disk.kb_read}</td>
                    <td>${disk.kb_wrtn}</td>
                </tr>
            `
        })

        html += '</tbody></table>'
      }

      return html
    },
    compare () {
      try {
        // 0. 清除之前 reportData 資料
        this.reportData.length = 0
        const clusterName51 = this.nodes.p8_51.clusterInfo.clusterName
        const clusterName52 = this.nodes.p8_52.clusterInfo.clusterName
        this.reportData.push({
          item: '叢集名稱',
          p8_51: clusterName51,
          p8_52: clusterName52,
          result: clusterName51 === clusterName52 ? '✅' : '❌'
        })

        const nodeState51 = this.formatForDisplay(this.nodes.p8_51.clusterInfo.nodes.map(n => `${n.name}: ${n.state}`))
        const nodeState52 = this.formatForDisplay(this.nodes.p8_52.clusterInfo.nodes.map(n => `${n.name}: ${n.state}`))
        this.reportData.push({
          item: '節點狀態',
          p8_51: (() => {
            try {
              const namePrefix = this.nodes.p8_51.clusterInfo.clusterName.split('1_')[0]
              return this.nodes.p8_51.clusterInfo.nodes.find(n => n.name.startsWith(`${namePrefix}1`)).state || 'N/A'
            } catch (err) {
              return err.message
            }
          })(),
          p8_52: (() => {
            try {
              const namePrefix = this.nodes.p8_52.clusterInfo.clusterName.split('1_')[0]
              return this.nodes.p8_52.clusterInfo.nodes.find(n => n.name.startsWith(`${namePrefix}2`)).state || 'N/A'
            } catch (err) {
              return err.message
            }
          })(),
          result: nodeState51 === nodeState52 ? '✅' : '❌'
        })

        this.reportData.push({
          item: '檔案系統超過 80%',
          p8_51: this.nodes.p8_51.highUsageFileSystems,
          p8_52: this.nodes.p8_52.highUsageFileSystems,
          result: this.nodes.p8_51.highUsageFileSystems.length > 0 || this.nodes.p8_52.highUsageFileSystems.length > 0 ? '❌' : '✅'
        })

        const oracleErrors51 = this.formatForDisplay(this.nodes.p8_51.oracleErrors.length)
        const oracleErrors52 = this.formatForDisplay(this.nodes.p8_52.oracleErrors.length)
        this.reportData.push({
          item: 'Oracle 錯誤',
          p8_51: oracleErrors51,
          p8_52: oracleErrors52,
          result: oracleErrors51 > 0 || oracleErrors52 > 0 ? '⚠' : '✅'
        })

        // 處理 AIX Error
        const aixErrorCount51 = this.nodes.p8_51.aixErrors.length
        const aixErrorCount52 = this.nodes.p8_52.aixErrors.length
        this.reportData.push({
          item: 'AIX 錯誤',
          p8_51: aixErrorCount51 > 0 ? `${aixErrorCount51} 個錯誤` : '無',
          p8_52: aixErrorCount52 > 0 ? `${aixErrorCount52} 個錯誤` : '無',
          result: aixErrorCount51 === aixErrorCount52 ? '✅' : '❌'
        })

        const allmounts51 = this.nodes.p8_51.allMounts
        const allmounts52 = this.nodes.p8_52.allMounts
        this.reportData.push({
          item: '檔案系統',
          p8_51: allmounts51,
          p8_52: allmounts52,
          result: allmounts51.length - allmounts52.length === 7 ? '✅' : '❌'
        })

        const hacmpPids51 = this.nodes.p8_51.hacmpPids
        const hacmpPids52 = this.nodes.p8_52.hacmpPids
        this.reportData.push({
          item: '子系統 PID',
          p8_51: this.formatPIDsHtmlDisplay(hacmpPids51),
          p8_52: this.formatPIDsHtmlDisplay(hacmpPids52),
          result: '✅'
        })

        const dnpValues51 = this.nodes.p8_51.dnpValues
        const dnpValues52 = this.nodes.p8_52.dnpValues
        this.reportData.push({
          item: 'NDP 數值',
          p8_51: this.formatNDPHtmlDisplay(this.nodes.p8_51.dnpValues),
          p8_52: this.formatNDPHtmlDisplay(this.nodes.p8_52.dnpValues),
          result: dnpValues51.length === 2 && dnpValues52.length === 2 ? '✅' : '❌'
        })

        this.reportData.push({
          item: '記憶體',
          p8_51: this.formatMemoryStatsHtmlDisplay(this.nodes.p8_51.memoryStats),
          p8_52: this.formatMemoryStatsHtmlDisplay(this.nodes.p8_52.memoryStats),
          result: '✅'
        })

        this.reportData.push({
          item: 'Oracle 程式數',
          p8_51: this.nodes.p8_51.oracleProcs,
          p8_52: this.nodes.p8_52.oracleProcs,
          result: '✅'
        })

        this.reportData.push({
          item: 'I/O 統計',
          p8_51: this.formatIOStatsHtmlDisplay(this.nodes.p8_51.ioStats),
          p8_52: this.formatIOStatsHtmlDisplay(this.nodes.p8_52.ioStats),
          result: '✅'
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
