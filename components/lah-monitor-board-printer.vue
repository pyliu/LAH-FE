<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    //- [修改] 標題增加顯示 IP:PORT
    strong {{ header }} - {{ serverIp }}:{{ serverPort }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="isBusy"
      )
      //- 深度自癒按鈕 (API F)
      lah-button(
        icon="medkit",
        variant="outline-danger",
        no-border,
        no-icon-gutter,
        @click="triggerSelfHeal",
        title="觸發深度自癒流程 (重啟 Spooler)"
      )
      //- 設定按鈕
      lah-button(
        icon="cogs",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="$refs.configModal.show()",
        title="連線設定"
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

  //- 說明 Modal
  lah-help-modal(ref="help", :modal-title="`${header} 說明`", size="lg")
    ul
      li 監控伺服器 (Server IP) 上的實體印表機狀態。
      li
        strong 狀態燈號：
        span 綠燈表示所有印表機正常，紅燈表示有錯誤或無法連線。
      li
        strong 深度自癒：
        span 強制重啟伺服器 Print Spooler 服務並清理暫存，用於解決卡單問題。
      li
        strong 單機重整：
        span 針對特定印表機執行暫停與恢復操作。
      li
        strong PDF 列印：
        span 可上傳 PDF 檔案至指定印表機進行列印測試。
      li.text-danger
        strong CORS 注意事項：
        span 若遇到 CORS 錯誤，請確認後端已允許 X-API-KEY 標頭。本組件已自動移除 CLIENT_IP 標頭以避免衝突。

  //- 設定 Modal
  b-modal(
    ref="configModal",
    :title="`API 連線設定 (ID: ${id})`",
    size="sm",
    hide-footer
  )
    b-form-group(label="伺服器 IP" label-for="server-ip")
      b-form-input#server-ip(v-model="serverIp" placeholder="220.1.34.78")
    b-form-group(label="連接埠" label-for="server-port")
      b-form-input#server-port(v-model="serverPort" placeholder="8888")
    b-form-group(label="API Key" label-for="api-key")
      b-form-input#api-key(v-model="apiKey" type="password" placeholder="X-API-KEY")

    .text-right
      lah-button(icon="check" @click="saveConfig") 儲存並重整

  //- PDF 列印 Modal
  b-modal(
    ref="printModal",
    title="上傳 PDF 列印",
    size="md",
    hide-footer
  )
    div.mb-3
      span 目標印表機：
      strong.text-primary.ml-2 {{ printTarget }}

    b-form-group(
      label="雙面列印設定"
      v-slot="{ ariaDescribedby }"
    )
      b-form-radio-group(
        v-model="duplex"
        :options="duplexOptions"
        :aria-describedby="ariaDescribedby"
        name="duplex-options"
        buttons
        button-variant="outline-primary"
        size="sm"
      )

    b-form-group(
      label="選擇 PDF 檔案"
      label-for="pdf-file"
      description="檔案將直接傳送至印表機伺服器列印"
    )
      b-form-file(
        id="pdf-file"
        v-model="pdfFile"
        :state="Boolean(pdfFile)"
        placeholder="請選擇或拖曳檔案..."
        drop-placeholder="放開以選擇檔案"
        accept=".pdf"
      )

    .d-flex.justify-content-end.mt-4
      lah-button(
        icon="print"
        variant="primary"
        @click="uploadPdf"
        :disabled="!pdfFile || isBusy"
        :loading="isBusy"
      ) 開始列印

  slot

  //- 內容區
  .center(v-if="printers.length === 0")
    div(v-if="isBusy")
      lah-fa-icon(icon="spinner", action="spin") 載入中...
    div(v-else) ⚠ 無法取得印表機列表，請檢查連線設定與 CORS 權限。

  div(v-else)
    b-table(
      :items="printers"
      :fields="printerFields"
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
      @row-clicked="onRowClick"
      tbody-tr-class="pointer"
    )
      //- 操作欄位 (移至第一欄)
      template(#cell(action)="{ item }")
        b-button-group
          //- PDF 列印按鈕 (維持非 Ready 禁用，避免在錯誤狀態下投遞任務)
          lah-button(
            icon="file-pdf",
            variant="outline-dark",
            no-icon-gutter,
            @click.stop="openPrintModal(item.Name)",
            :disabled="item.Status !== 'Ready'"
            title="上傳 PDF 進行列印測試 (僅 Ready 狀態可用)"
          )
          //- 重新整理 (API D) [修正] 移除 disabled 限制，允許隨時嘗試修復
          lah-button.ml-1(
            icon="sync",
            variant="outline-primary",
            no-icon-gutter,
            @click.stop="refreshPrinter(item.Name)",
            title="重新整理此印表機 (WMI Suspend/Resume)"
          )

      //- 狀態欄位 (API A/B)
      //- 針對過長狀態進行格式化，並加入 Tooltip
      template(#cell(Status)="{ item }")
        b-badge.p-2(
          :variant="getPaperBadgeVariant(item.Status)"
          pill
          v-b-tooltip.hover
          :title="item.Status"
        ) {{ formatStatus(item.Status) }}
        .small.text-muted(v-if="item.DetailedStatus") {{ item.DetailedStatus }}

      //- IP 欄位顯示
      template(#cell(IP)="{ item }")
        div.text-nowrap.text-truncate(
          style="max-width: 120px;"
          v-b-tooltip.hover
          :title="item.IP"
        )
          span(v-if="isValidIPv4(item.IP)") {{ item.IP }}
          span.text-muted.font-italic(v-else) {{ formatIp(item.IP) }}

      //- 佇列數量欄位 (Jobs 欄位) - 整合清除按鈕
      template(#cell(Jobs)="{ item }")
        .d-flex.align-items-center.justify-content-center
          span.mr-2(:class="{'text-danger font-weight-bold': getJobsCount(item.Jobs) > 0}") {{ getJobsCount(item.Jobs) }}
          //- 清除佇列按鈕，此按鈕通常用於故障排除，故維持開啟，除非您希望也一併禁用
          lah-button(
            v-if="getJobsCount(item.Jobs) > 0"
            icon="trash-alt",
            variant="outline-danger",
            size="sm",
            no-icon-gutter,
            pill,
            @click.stop="clearQueue(item.Name)",
            title="清除此印表機佇列"
          )

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
// [關鍵] 直接引入原生 axios，避開 Nuxt 插件的全域攔截器與設定
import axios from 'axios';
import dynamicHeight from '~/mixins/dynamic-height-mixin.js';
import lahMonitorBoardBase from '~/mixins/lah-monitor-board-base';

export default {
  name: 'LahMonitorBoardPrinter',
  mixins: [lahMonitorBoardBase, dynamicHeight],
  props: {
    footer: { type: Boolean, default: false },
    // 用於區分不同實例的 ID，預設為 default
    id: { type: String, default: 'default' }
  },
  data: () => ({
    header: '印表機監控',
    serverIp: '220.1.34.78', // 預設 IP
    serverPort: '8888',
    apiKey: 'YourSecretApiKey123', // 預設 Key

    printers: [],
    // 調整欄位順序：操作移至第一欄
    printerFields: [
      { key: 'action', label: '操作', class: 'text-center' },
      { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
      { key: 'Name', label: '印表機名稱', sortable: true },
      { key: 'IP', label: 'IP', sortable: true }, // [新增] IP 欄位
      { key: 'Jobs', label: '佇列數', sortable: true, class: 'text-center' }
    ],

    // PDF 列印相關
    printTarget: '',
    pdfFile: null,
    duplex: 1, // 預設值 1 (雙面長邊)
    duplexOptions: [
      { text: '單面', value: 0 },
      { text: '雙面 (長邊翻頁)', value: 1 },
      { text: '雙面 (短邊翻頁)', value: 2 }
    ]
  }),
  computed: {
    apiUrlBase () {
      return `http://${this.serverIp}:${this.serverPort}`
    },
    // 根據印表機狀態決定整體燈號
    light () {
      if (this.printers.length === 0) { return 'warning' }
      // 若有任何印表機狀態不是 Ready 或 Idle，或是無法連線，則顯示紅燈
      const hasError = this.printers.some((p) => {
        const s = (p.Status || '').toLowerCase()
        return s.includes('error') || s.includes('offline') || s.includes('paper jam')
      })
      return hasError ? 'danger' : 'success'
    }
  },
  mounted () {
    this.reloadMs = 60000 // 每分鐘更新一次
    // 使用動態 Key 讀取設定
    const cachedConfig = localStorage.getItem(this.storageKey)
    if (cachedConfig) {
      const config = JSON.parse(cachedConfig)
      this.serverIp = config.serverIp || this.serverIp
      this.serverPort = config.serverPort || this.serverPort
      this.apiKey = config.apiKey || this.apiKey
    }
    this.reload()
  },
  methods: {
    // 格式化過長的狀態文字
    formatStatus (status) {
      if (!status) { return 'Unknown' }
      // 如果包含 " - "，通常表示後面有長串的可能原因，只顯示前半段
      if (status.includes(' - ')) {
        return status.split(' - ')[0] + ' ... '
      }
      return status
    },
    // 格式化過長的非 IP 文字
    formatIp (ip) {
      if (!ip) { return '' }
      if (ip.length > 20) {
        return ip.substring(0, 15) + ' ...'
      }
      return ip
    },
    // 驗證 IPv4 格式
    isValidIPv4 (ip) {
      if (!ip) { return false }
      // 簡單的 IPv4 正規表示式檢查
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      return ipv4Regex.test(ip)
    },
    // 點擊行觸發狀態查詢
    onRowClick (item) {
      this.checkStatus(item.Name)
    },
    saveConfig () {
      localStorage.setItem(this.storageKey, JSON.stringify({
        serverIp: this.serverIp,
        serverPort: this.serverPort,
        apiKey: this.apiKey
      }))
      this.$refs.configModal.hide()
      this.reload()
    },
    getJobsCount (jobs) {
      // 如果 jobs 為 null, undefined 或非陣列，回傳 0
      if (!jobs || !Array.isArray(jobs)) {
        return 0
      }
      return jobs.length
    },
    // API A: 獲取所有印表機清單
    async reload () {
      this.isBusy = true
      try {
        // [修正] 使用原生 axios
        const { data } = await axios.get(`${this.apiUrlBase}/printers`, {
          headers: {
            'X-API-KEY': this.apiKey
          }
        })

        // 解析資料結構: data.data 是印表機陣列
        if (data && data.data && Array.isArray(data.data.data)) {
          this.printers = data.data.data
          this.updated = this.$utils.now()
        } else if (data && Array.isArray(data.data)) {
          this.printers = data.data
          this.updated = this.$utils.now()
        } else {
          this.$utils.warn('無法解析回傳資料結構', data)
          this.printers = []
        }
      } catch (err) {
        this.$utils.error('列印伺服器API錯誤', err)
        this.printers = []
      } finally {
        this.isBusy = false
      }
    },
    // API B: 查詢特定印表機狀態
    async checkStatus (name) {
      // 1. 先嘗試從目前的 printers 列表中尋找
      const localPrinter = this.printers.find(p => p.Name === name)
      if (localPrinter) {
        this.modal(this.$createElement('pre', JSON.stringify(localPrinter, null, 2)), {
          title: `${name} 詳細狀態`
        })
        return
      }

      // 2. 找不到才去 Server 撈
      try {
        // [修正] 使用原生 axios
        const { data } = await axios.get(`${this.apiUrlBase}/printer/status`, {
          params: { name },
          // [修正] 移除 CLIENT_IP
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.modal(this.$createElement('pre', JSON.stringify(data, null, 2)), {
          title: `${name} 詳細狀態`
        })
      } catch (err) {
        this.alert(`查詢失敗: ${err.message}`)
      }
    },
    // 開啟 PDF 列印 Modal
    openPrintModal (name) {
      this.printTarget = name
      this.pdfFile = null
      this.duplex = 1
      this.$refs.printModal.show()
    },
    // API C: 上傳 PDF 並列印 (使用原生 axios)
    async uploadPdf () {
      if (!this.pdfFile) { return }

      this.isBusy = true
      try {
        // 先讀取成 ArrayBuffer
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsArrayBuffer(this.pdfFile)
        })

        // [關鍵修正] 使用獨立的 axios 實例發送請求，完全避開 Nuxt 插件
        // 注意：這裡直接使用 import 進來的 axios
        await axios.post(`${this.apiUrlBase}/printer/print-pdf`, fileData, {
          params: {
            name: this.printTarget,
            duplex: this.duplex
          },
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/pdf'
            // 原生 axios 不會自動加 CLIENT_IP，所以不需要設為 undefined
          }
        })

        this.notify('PDF 已傳送列印', { type: 'success' })
        this.$refs.printModal.hide()
        this.pdfFile = null
        setTimeout(this.reload, 2000)
      } catch (err) {
        // 捕捉 axios 錯誤
        const msg = err.response?.data?.message || err.message
        this.alert(`列印失敗: ${msg}`)
      } finally {
        this.isBusy = false
      }
    },
    // API D: 執行單一印表機重新整理
    async refreshPrinter (name) {
      const confirm = await this.$bvModal.msgBoxConfirm(`確定要重新整理(暫停/恢復) ${name} 嗎？`, {
        title: '確認操作',
        okVariant: 'primary',
        centered: true
      })
      if (!confirm) { return }

      this.isBusy = true
      try {
        // [修正] 使用原生 axios
        await axios.get(`${this.apiUrlBase}/printer/refresh`, {
          params: { name },
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('指令已發送', { type: 'success' })
        setTimeout(this.reload, 2000)
      } catch (err) {
        this.alert(`操作失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    // API E: 手動清除特定佇列
    async clearQueue (name) {
      const confirm = await this.$bvModal.msgBoxConfirm(`確定要強制清除 ${name} 的所有佇列工作嗎？此操作不可回復。`, {
        title: '危險操作確認',
        okVariant: 'danger',
        centered: true
      })
      if (!confirm) { return }

      this.isBusy = true
      try {
        // [修正] 使用原生 axios
        await axios.get(`${this.apiUrlBase}/printer/clear`, {
          params: { name },
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('清除指令已發送', { type: 'success' })
        setTimeout(this.reload, 2000)
      } catch (err) {
        this.alert(`清除失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    // API F: 觸發深度自癒流程
    async triggerSelfHeal () {
      const confirm = await this.$bvModal.msgBoxConfirm('確定要執行深度自癒流程嗎？\n這將會重啟伺服器的 Spooler 服務，期間所有列印將暫停。', {
        title: '系統維護確認',
        okVariant: 'danger',
        centered: true
      })
      if (!confirm) { return }

      this.isBusy = true
      try {
        // [修正] 使用原生 axios
        await axios.get(`${this.apiUrlBase}/service/self-heal`, {
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('自癒流程已啟動，請稍候...', { type: 'warning' })
        setTimeout(this.reload, 5000)
      } catch (err) {
        this.alert(`啟動失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    getPaperBadgeVariant (status) {
      if (!status) { return 'secondary' }
      const s = status.toLowerCase()
      if (s.includes('error') || s.includes('offline') || s.includes('jam')) { return 'danger' }
      if (s.includes('warning') || s.includes('toner')) { return 'warning' }
      return 'success'
    }
  }
}
</script>

<style lang="scss" scoped>
.s-90 {
  font-size: 0.9rem;
}
.pointer {
  cursor: pointer;
}
</style>
