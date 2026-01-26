<template lang="pug">
//- [修改] 新增 body-class 以支援外部高度限制時的內部佈局
b-card(
  :border-variant="border",
  :class="[attentionCss]",
  body-class="d-flex flex-column overflow-hidden"
)
  template(#header): .d-flex.justify-content-between.align-items-center
    .d-flex.align-items-center
      lah-fa-icon(icon="server", :variant="light")
      //- [修改] 標題增加顯示 IP:PORT (直接使用 prop)
      strong.mr-2 {{ header }} - {{ serverIp }}:{{ serverPort }}

      //- [新增] 狀態篩選下拉選單 (XS 模式隱藏)
      b-form-select(
        v-if="localSize !== 'xs'"
        v-model="filterStatus"
        :options="statusOptions"
        size="sm"
        style="width: auto; min-width: 110px;"
        title="依狀態篩選"
      )

    b-button-group.ml-auto(size="sm")
      //- [修改] 移除 Header 上的顯示設定 UI (已移至 Help Modal)

      //- 完整列表按鈕 (避免在 Display Mode 下再次顯示此按鈕，造成無限 Modal)
      //- [修改] 當目前顯示模式已經是 xl 時，隱藏此按鈕
      //- [修改] 位置互換：移至切換模式按鈕之前
      lah-button(
        v-if="!isDisplayMode && localSize !== 'xl'"
        icon="list",
        variant="outline-info",
        no-border,
        no-icon-gutter,
        @click="$refs.fullTableModal.show()",
        title="顯示完整詳細列表"
      )

      //- [新增] 儀表板排列切換按鈕 (只在 XS 顯示)
      lah-button(
        v-if="localSize === 'xs'"
        :icon="dashboardStyle === 'grid' ? 'th-list' : 'th-large'"
        variant="outline-primary"
        no-border
        no-icon-gutter
        @click="toggleDashboardStyle"
        :title="`切換排列 (目前: ${dashboardStyle === 'grid' ? '田字' : '橫向'})`"
      )

      //- [新增] 循環切換顯示模式按鈕
      //- [修改] 位置互換：移至完整列表按鈕之後
      lah-button(
        icon="tv",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="cycleSize",
        :title="`切換顯示模式 (目前: ${localSize})`"
      )

      //- [移除] 伺服器紀錄按鈕 (移至 Help Modal)

      //- [修改] 在展示模式(isDisplayMode)或不顯示footer時，顯示header的重新整理按鈕
      lah-button(
        v-if="!footer && !isDisplayMode"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="isBusy"
      )
      //- 深度自癒按鈕 (API F) (已移至 Help Modal)

      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明與設定"
      )

  //- [修改] 說明 Modal 增加設定區塊
  lah-help-modal(ref="help", :modal-title="`${header} 設定與說明 - ${serverIp}`", size="lg")
    //- 設定區塊
    div.mb-4.p-3.bg-light.rounded
      h6.font-weight-bold.mb-3
        lah-fa-icon(icon="cog").mr-2
        span 顯示設定

      div.d-flex.flex-wrap.align-items-center
        b-form-group.mb-0.mr-4(label="顯示模式" label-for="size-select" label-cols="auto" content-cols="auto")
          b-form-select#size-select(
            v-model="localSize"
            :options="sizeOptions"
            size="sm"
            :disabled="isDisplayMode"
            title="展示模式下依外部設定為主"
          )

        b-form-group.mb-0(
          v-if="localSize === 'xs'"
          label="儀表板排列"
          label-cols="auto"
          content-cols="auto"
        )
          b-form-radio-group(
            v-model="dashboardStyle"
            :options="[{ text: '橫向 (1x4)', value: 'horizontal' }, { text: '田字 (2x2)', value: 'grid' }]"
            buttons
            button-variant="outline-secondary"
            size="sm"
          )

    //- [新增] 維護區塊 (從 Header 移入)
    div.mb-4.p-3.bg-light.rounded
      h6.font-weight-bold.mb-3
        lah-fa-icon(icon="tools").mr-2
        span 系統維護

      div.d-flex.align-items-center
        lah-button.mr-2(
          icon="medkit",
          variant="outline-danger",
          @click="triggerSelfHeal"
          title="重新啟動 Spooler 服務"
        ) 觸發深度自癒
        
        //- [移動] 伺服器紀錄按鈕
        lah-button(
          icon="file-alt",
          variant="outline-dark",
          @click="fetchServerLogs"
          title="查看伺服器紀錄 (最後100行)"
        ) 查看紀錄

    hr

    h6.font-weight-bold.mb-2 功能說明
    ul
      li 監控伺服器 (Server IP) 上的實體印表機狀態。
      //- [新增] 部署說明
      li.text-danger
        strong 部署需求：
        span 需在列印伺服器上安裝並執行
        code Printer_API_Agent.ps1
        span  腳本。
        .mt-2
          b-button-group(size="sm")
            //- [修改] 改回使用 href 屬性，避開 window.open 被瀏覽器阻擋的問題
            //- [修改] 使用 apiSvrIp 和 apiSvrPort
            b-button(variant="outline-primary" :href="agentDownloadUrl" target="_blank" pill)
              lah-fa-icon(icon="download").mr-1
              span 下載 Agent 腳本
            b-button.ml-1(variant="outline-info" :href="guideDownloadUrl" target="_blank" pill)
              lah-fa-icon(icon="file-pdf").mr-1
              span 下載部署指南
      li
        strong 狀態燈號：
        span 綠燈表示所有印表機正常，紅燈表示有錯誤或無法連線。
      li
        strong 狀態篩選：
        span 使用標題旁的下拉選單可過濾顯示特定狀態的印表機。
      li
        strong 深度自癒：
        span 強制重啟伺服器 Print Spooler 服務並清理暫存，用於解決卡單問題。
      li
        strong 單機重整：
        span 針對特定印表機執行暫停與恢復操作。
      li
        strong PDF 列印：
        span 可上傳 PDF 檔案至指定印表機進行列印測試 (僅 Ready 狀態顯示)。
      li(v-if="!isDisplayMode")
        strong 自動更新：
        span 每 {{ reloadMs / 60000 }} 分鐘自動重新整理一次。
      li(v-else)
        strong 展示模式：
        span 資料由外部提供，本組件不執行自動更新。

  //- [新增] 伺服器紀錄 Modal
  b-modal(
    ref="logsModal",
    title="伺服器紀錄 (最後100行)"
    size="xl"
    scrollable
    hide-footer
  )
    pre.bg-dark.text-white.p-3.rounded(v-if="serverLogs" style="font-size: 0.85rem; min-height: 400px;") {{ serverLogs }}
    div.text-center.text-muted.py-5(v-else) 暫無紀錄或載入中...

  //- [新增] 完整資料列表 Modal
  //- [修改] 使用遞迴組件顯示完整列表
  b-modal(
    ref="fullTableModal"
    :title="`完整印表機清單 - ${serverIp}:${serverPort}`"
    size="xl"
    hide-footer
    body-class="p-0"
  )
    //- [修改] 將預設 size 改為 xl
    //- 傳入 printers 陣列，關閉 footer
    lah-monitor-board-printer(
      :in-printers="printers"
      size="xl"
      :footer="false"
      :server-ip="serverIp"
      :server-port="serverPort"
      :api-key="apiKey"
      class="border-0 shadow-none"
    )

  //- 詳細資料 Modal
  b-modal(
    ref="detailModal"
    :title="selectedPrinter ? `${selectedPrinter.Name} - 詳細資訊` : '載入中...'"
    size="lg"
    hide-footer
  )
    div(v-if="selectedPrinter")
      //- 上半部：狀態摘要
      b-card.mb-3(no-body)
        b-card-body.d-flex.align-items-center.justify-content-between
          div
            h5.mb-1 {{ selectedPrinter.Name }}
            div.text-muted
              span.mr-2 IP: {{ selectedPrinter.IP || 'N/A' }}
              b-badge(v-if="selectedPrinter.Location" variant="light") {{ selectedPrinter.Location }}

          div.text-right
            b-badge.p-2.mb-1(:variant="getPaperBadgeVariant(selectedPrinter.Status)" pill)
              span.h6.mb-0 {{ formatStatus(selectedPrinter.Status) }}
            div.small.text-danger(v-if="selectedPrinter.ErrorDetails || selectedPrinter.DetailedStatus") {{ selectedPrinter.ErrorDetails || selectedPrinter.DetailedStatus }}

      //- 中間：詳細屬性列表
      b-row
        //- [左側] 1.佇列 2.驅動 3.位置
        b-col(cols="12" md="6")
          b-list-group.mb-3
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 佇列工作數 (Jobs)
              strong(:class="{'text-danger': getJobsCount(selectedPrinter.Jobs) > 0}") {{ getJobsCount(selectedPrinter.Jobs) }}
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 驅動程式 (Driver)
              span.text-truncate(style="max-width: 200px;" :title="selectedPrinter.Driver || selectedPrinter.DriverName") {{ selectedPrinter.Driver || selectedPrinter.DriverName || 'Unknown' }}
            b-list-group-item.d-flex.justify-content-between.align-items-center(v-if="selectedPrinter.Location")
              span.text-muted 位置 (Location)
              span {{ selectedPrinter.Location }}

        //- [右側] 1.共用名稱 2.連接埠 3.錯誤訊息
        b-col(cols="12" md="6")
          b-list-group.mb-3
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 共用名稱 (Share)
              span {{ selectedPrinter.ShareName || '無' }}
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 連接埠 (Port)
              span {{ selectedPrinter.PortName || 'Unknown' }}
            b-list-group-item.d-flex.justify-content-between.align-items-center(v-if="selectedPrinter.ErrorDetails")
              span.text-muted 錯誤訊息
              b-badge(variant="danger") {{ selectedPrinter.ErrorDetails }}
            //- [新增] 備註欄位顯示
            b-list-group-item.d-flex.justify-content-between.align-items-center(v-if="selectedPrinter.Comment")
              span.text-muted 備註 (Comment)
              span.text-truncate(style="max-width: 150px;" :title="selectedPrinter.Comment") {{ selectedPrinter.Comment }}

      //- 底部：操作按鈕區
      hr

      .d-flex.justify-content-end.flex-wrap
        lah-button.mr-2.mb-2(
          v-if="selectedPrinter.Status === 'Ready'"
          icon="file-pdf",
          variant="outline-dark",
          @click="openPrintModal(selectedPrinter.Name)",
          title="上傳 PDF 進行列印測試"
        ) PDF 測試列印

        lah-button.mr-2.mb-2(
          icon="trash-alt",
          variant="outline-danger",
          @click="clearQueue(selectedPrinter.Name)",
          :disabled="getJobsCount(selectedPrinter.Jobs) === 0"
          title="強制清除所有佇列工作"
        ) 清除佇列

        lah-button.mb-2(
          icon="sync",
          variant="primary",
          @click="refreshPrinter(selectedPrinter.Name)",
          title="暫停並重新啟動此印表機 (WMI)"
        ) 重新整理 (修復)

    div.text-center.py-5(v-else)
      lah-fa-icon(icon="spinner" action="spin" size="2x")
      div.mt-2 正在讀取詳細資訊...

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
  //- [修改] 增加 flex 排版類別，確保內容佔滿剩餘高度並正確置中
  div.center.d-flex.flex-column.justify-content-center.align-items-center.flex-grow-1(v-if="printers.length === 0")
    div(v-if="isBusy")
      lah-fa-icon(icon="spinner", action="spin") 載入中...
    div(v-else) ⚠ 無法取得印表機列表，請檢查連線設定與 CORS 權限。

  //- [修改] 增加外層 flex 與 overflow 類別，確保表格或儀表板能正確捲動
  div.d-flex.flex-column.flex-grow-1.overflow-hidden(v-else)
    //- XS 尺寸：儀表板顯示
    //- [修改] 改用 h-100 撐滿高度，並移除 overflow-auto 以避免卷軸，實現自動縮放
    div.h-100(v-if="localSize === 'xs'")
      //- [修改] b-row 增加 h-100
      b-row.text-center.h-100(no-gutters)
        //- [修改] 針對每一個 col 設定高度，若為 grid 則高度減半 (50%)，橫向則全高 (100%)
        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          //- [修改] b-card 移除 min-height, 增加 h-100, 調整 padding 為 p-1
          b-card.h-100.shadow-sm(
            bg-variant="success" 
            text-variant="white" 
            body-class="p-1 d-flex flex-column justify-content-center align-items-center"
          )
            h2.mb-0.font-weight-bold {{ dashboardStats.ready }}
            div.small 正常
        
        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="warning" 
            text-variant="dark" 
            body-class="p-1 d-flex flex-column justify-content-center align-items-center"
          )
            h2.mb-0.font-weight-bold {{ dashboardStats.warning }}
            div.small 警告

        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="danger" 
            text-variant="white" 
            body-class="p-1 d-flex flex-column justify-content-center align-items-center"
          )
            h2.mb-0.font-weight-bold {{ dashboardStats.error }}
            div.small 異常

        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="info" 
            text-variant="white" 
            body-class="p-1 d-flex flex-column justify-content-center align-items-center"
          )
            h2.mb-0.font-weight-bold {{ dashboardStats.jobs }}
            div.small 佇列

    //- 其他尺寸：列表顯示
    //- [修改] 增加 mb-0 移除下方 margin
    b-table(
      v-else
      :items="filteredPrinters"
      :fields="printerFields"
      striped
      hover
      responsive
      bordered
      caption-top
      no-border-collapse
      small
      head-variant="dark"
      class="s-90 mb-0"
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      @row-clicked="onRowClick"
      tbody-tr-class="pointer"
      show-empty
    )
      template(#empty)
        .text-center.text-muted.my-2
          lah-fa-icon(icon="filter")
          span.ml-2 沒有符合「{{ filterStatus }}」狀態的印表機

      template(#cell(action)="{ item }")
        b-button-group
          lah-button(
            v-if="item.Status === 'Ready'"
            icon="file-pdf",
            variant="outline-dark",
            no-icon-gutter,
            @click.stop="openPrintModal(item.Name)",
            title="上傳 PDF 進行列印測試"
          )
          lah-button.ml-1(
            icon="sync",
            variant="outline-primary",
            no-icon-gutter,
            @click.stop="refreshPrinter(item.Name)",
            title="重新整理此印表機 (WMI Suspend/Resume)"
          )

      template(#cell(Status)="{ item }")
        b-badge.p-2(
          :variant="getPaperBadgeVariant(item.Status)"
          pill
          v-b-tooltip.hover
          :title="getStatusTooltip(item)"
        ) {{ formatStatus(item.Status) }}

      template(#cell(IP)="{ item }")
        div.text-nowrap.text-truncate(
          style="max-width: 120px;"
          v-b-tooltip.hover
          :title="item.IP"
        )
          span(v-if="isValidIPv4(item.IP)") {{ item.IP }}
          span.text-muted.font-italic(v-else) {{ formatIp(item.IP) }}

      template(#cell(Jobs)="{ item }")
        .d-flex.align-items-center.justify-content-center
          span.mr-2(:class="{'text-danger font-weight-bold': getJobsCount(item.Jobs) > 0}") {{ getJobsCount(item.Jobs) }}
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

      //- [新增] XL 模式的插槽：Location
      template(#cell(Location)="{ item }")
        b-badge(v-if="item.Location" variant="light") {{ item.Location }}

      //- [新增] XL 模式的插槽：Driver
      template(#cell(Driver)="{ item }")
        div.text-truncate(style="max-width: 200px;" :title="item.Driver || item.DriverName") {{ item.Driver || item.DriverName }}

      //- [新增] XL 模式的插槽：Comment
      template(#cell(Comment)="{ item }")
        div.text-truncate(style="max-width: 150px;" :title="item.Comment") {{ item.Comment }}

      //- [新增] XL 模式的插槽：ErrorDetails
      template(#cell(ErrorDetails)="{ item }")
        div.text-danger.small {{ item.ErrorDetails || item.DetailedStatus }}
      
      //- [新增] XL 模式的插槽：PortName
      template(#cell(PortName)="{ item }")
        div.text-truncate(style="max-width: 150px;" :title="item.PortName") {{ item.PortName }}

  template(#footer, v-if="footer && !isDisplayMode"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="reload",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
// [新增] 引入 mapState
import axios from 'axios';
import _ from 'lodash';
import dynamicHeight from '~/mixins/dynamic-height-mixin.js';

export default {
  name: 'LahMonitorBoardPrinter',
  mixins: [dynamicHeight],
  props: {
    footer: { type: Boolean, default: false },
    id: { type: String, default: 'default' },
    size: { type: String, default: 'xs' }, // [修改] 預設值改為 xs
    serverIp: { type: String, default: '127.0.0.1' },
    serverPort: { type: String, default: '8888' },
    apiKey: { type: String, default: 'YourSecretApiKey123' },
    reloadMs: { type: Number, default: 300000 },
    // [新增] 外部注入印表機資料 (展示模式用)
    inPrinters: { type: Array, default: () => [] }
  },
  data () {
    return {
      isBusy: false,
      updated: '',
      fetchingState: null,
      header: '列印伺服器監控',
      filterStatus: 'not_ready',
      localSize: this.size,
      dashboardStyle: 'horizontal',
      selectedPrinter: null,
      cancelSource: null,
      serverLogs: '',
      printers: [],

      // [移除] 舊的 fullTableFields 定義，現在由 printerFields(xl) 動態處理

      printTarget: '',
      pdfFile: null,
      duplex: 1,
      duplexOptions: [
        { text: '單面', value: 0 },
        { text: '雙面 (長邊翻頁)', value: 1 },
        { text: '雙面 (短邊翻頁)', value: 2 }
      ],
      sizeOptions: [
        { value: 'xs', text: '儀表板 (XS)' },
        { value: 'sm', text: '精簡列表 (SM)' },
        { value: 'md', text: '標準列表 (MD)' },
        { value: 'lg', text: '詳細列表 (LG)' },
        { value: 'xl', text: '完整列表 (XL)' } // [新增] XL 選項
      ]
    }
  },
  computed: {
    // [修改] 下載連結 (使用 apiSvrIp 和 apiSvrPort)
    downloadUrlBase () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}`
    },
    agentDownloadUrl () {
      return `${this.downloadUrlBase}/assets/sh/Printer_API_Agent.ps1`
    },
    guideDownloadUrl () {
      return `${this.downloadUrlBase}/assets/sh/Printer_API_Agent_Windows_Server_部署指南.pdf`
    },
    // [新增] 判斷是否為展示模式
    isDisplayMode () {
      return this.inPrinters && this.inPrinters.length > 0
    },
    // [修改] 如果 light 為 success (綠燈)，不顯示邊框 (return 空字串)
    border () {
      if (this.light === 'success') {
        return ''
      }
      return this.light
    },
    attentionCss () {
      return ''
    },
    storageKey () {
      return `lah-monitor-board-printer-config-${this.serverIp}`
    },
    apiUrlBase () {
      return `http://${this.serverIp}:${this.serverPort}`
    },
    printerFields () {
      if (this.localSize === 'sm') {
        return [
          { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
          { key: 'Name', label: '印表機名稱', sortable: true }
        ]
      } else if (this.localSize === 'md') {
        return [
          { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
          { key: 'Name', label: '印表機名稱', sortable: true },
          { key: 'Location', label: '位置', sortable: true },
          { key: 'IP', label: 'IP', sortable: true }
        ]
      } else if (this.localSize === 'xl') {
        // [新增] xl 模式：包含詳細欄位 (Location, Driver, etc.)
        // [修改] Status 移到 Name 前面
        return [
          { key: 'action', label: '操作', class: 'text-center' },
          { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
          { key: 'Name', label: '名稱', sortable: true },
          { key: 'Location', label: '位置', sortable: true },
          { key: 'IP', label: 'IP', sortable: true },
          { key: 'Jobs', label: '佇列', sortable: true, class: 'text-center' },
          // { key: 'PortName', label: '連接埠', sortable: true }, // 可選
          { key: 'Comment', label: '備註', sortable: true },
          { key: 'ErrorDetails', label: '錯誤細節', sortable: true },
          { key: 'Driver', label: '驅動程式', sortable: true },
          { key: 'PortName', label: '連接埠', sortable: true } // [新增] PortName
        ]
      } else {
        // lg (default)
        return [
          { key: 'action', label: '操作', class: 'text-center' },
          { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
          { key: 'Name', label: '印表機名稱', sortable: true },
          { key: 'Location', label: '位置', sortable: true },
          { key: 'IP', label: 'IP', sortable: true },
          { key: 'Jobs', label: '佇列數', sortable: true, class: 'text-center' }
        ]
      }
    },
    // [新增] 佇列燈號邏輯
    queueLight () {
      if (this.printers.length === 0) { return 'warning' }
      const totalJobs = this.printers.reduce((sum, printer) => {
        return sum + this.getJobsCount(printer.Jobs)
      }, 0)
      if (totalJobs > 10) { return 'danger' }
      if (totalJobs > 5) { return 'warning' }
      return 'success'
    },
    // [新增] 狀態燈號邏輯
    notReadyLight () {
      if (this.printers.length === 0) { return 'success' }
      const statuses = this.printers.map(p => this.getPaperBadgeVariant(p.Status))
      if (statuses.includes('danger')) { return 'danger' }
      if (statuses.includes('warning')) { return 'warning' }
      return 'success'
    },
    // [修改] 綜合燈號：使用 queueLight
    light () {
      return this.queueLight
      // 保留以下邏輯方便測試 (綜合判斷)
      // if (this.queueLight === 'danger' || this.notReadyLight === 'danger') { return 'danger' }
      // if (this.queueLight === 'warning' || this.notReadyLight === 'warning') { return 'warning' }
      // return 'success'
    },
    statusOptions () {
      const uniqueStatuses = [...new Set(this.printers.map(p => p.Status || 'Unknown'))].sort()
      const options = [
        { value: '全部', text: '全部顯示' },
        { value: 'not_ready', text: '⚠ 非就緒狀態' }
      ]
      uniqueStatuses.forEach((status) => {
        options.push({
          value: status,
          text: this.formatStatus(status)
        })
      })
      return options
    },
    filteredPrinters () {
      if (this.filterStatus === '全部') {
        return this.printers
      }
      if (this.filterStatus === 'not_ready') {
        return this.printers.filter(p => (p.Status || 'Unknown') !== 'Ready')
      }
      return this.printers.filter(p => (p.Status || 'Unknown') === this.filterStatus)
    },
    dashboardStats () {
      const list = this.printers

      const readyCount = list.filter((p) => {
        const s = (p.Status || '').toLowerCase()
        return s.includes('ready') && !s.includes('error') && !s.includes('offline') && !s.includes('warning')
      }).length

      const warningCount = list.filter((p) => {
        const variant = this.getPaperBadgeVariant(p.Status)
        return variant === 'warning'
      }).length

      const errorCount = list.filter((p) => {
        const variant = this.getPaperBadgeVariant(p.Status)
        return variant === 'danger'
      }).length

      const totalJobs = list.reduce((acc, p) => acc + this.getJobsCount(p.Jobs), 0)

      return {
        ready: readyCount,
        warning: warningCount,
        error: errorCount,
        jobs: totalJobs
      }
    },
    dashboardColCols () {
      return this.dashboardStyle === 'grid' ? 6 : 3
    }
  },
  watch: {
    filterStatus () {
      this.storeConfig()
    },
    localSize () {
      this.storeConfig()
    },
    dashboardStyle () {
      this.storeConfig()
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    },
    // [新增] 監聽外部傳入的印表機資料
    inPrinters (newVal) {
      if (newVal && newVal.length > 0) {
        this.printers = [...newVal]
        this.updated = this.$utils.now()
      }
    }
  },
  created () {
    this.debouncedFetchStatus = _.debounce(this.fetchStatusFromApi, 300)

    // [新增] created 時檢查是否為展示模式
    if (this.inPrinters && this.inPrinters.length > 0) {
      this.printers = [...this.inPrinters]
      this.updated = this.$utils.now()
    }
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    const cachedConfig = localStorage.getItem(this.storageKey)
    if (cachedConfig) {
      const config = JSON.parse(cachedConfig)
      this.filterStatus = config.filterStatus || this.filterStatus
      this.localSize = config.localSize || this.localSize
      this.dashboardStyle = config.dashboardStyle || this.dashboardStyle
    }

    // [修改] 如果是展示模式，強制使用 prop 的 size，忽略快取
    if (this.isDisplayMode) {
      this.localSize = this.size
    }
    // [修改] 只有非展示模式才自動載入
    else {
      this.reload()
    }
  },
  beforeDestroy () {
    this.emitLightUpdate('', this.light)
  },
  methods: {
    notify (msg, options = { type: 'info' }) {
      this.$bvToast.toast(msg, {
        title: '訊息',
        variant: options.type,
        solid: true
      })
    },
    alert (msg) {
      this.$bvModal.msgBoxOk(msg, {
        title: '警告',
        centered: true,
        okVariant: 'danger'
      })
    },
    // [新增] 循環切換 Size
    cycleSize () {
      const options = this.sizeOptions.map(o => o.value)
      const idx = options.indexOf(this.localSize)
      const nextIdx = (idx + 1) % options.length
      this.localSize = options[nextIdx]
    },
    // [修改] 移除 downloadAgent 方法
    // [修改] 移除 downloadGuide 方法
    getStatusTooltip (item) {
      const status = this.formatStatus(item.Status)
      const error = item.ErrorDetails || item.DetailedStatus
      if (error) {
        return `${status} : ${error}`
      }
      return status
    },
    formatStatus (status) {
      if (!status) { return '未知' }
      const map = {
        Ready: '就緒',
        Offline: '離線',
        Error: '錯誤',
        Warning: '警告',
        Printing: '列印中',
        Paused: '暫停',
        Deleting: '刪除中',
        'Paper Jam': '卡紙',
        'Door Open': '門蓋未關',
        'Toner Low': '碳粉不足',
        'Warming Up': '暖機中'
      }
      if (map[status]) { return map[status] }
      const s = status.toLowerCase()
      if (s.includes('ready')) { return '就緒' }
      if (s.includes('offline')) { return '離線' }
      if (s.includes('error')) { return '錯誤' }
      if (s.includes('warning')) { return '警告' }
      if (s.includes('jam')) { return '卡紙' }
      if (status.includes(' - ')) {
        return status.split(' - ')[0] + ' ... '
      }
      return status
    },
    formatIp (ip) {
      if (!ip) { return '' }
      if (ip.length > 20) {
        return ip.substring(0, 15) + ' ...'
      }
      return ip
    },
    isValidIPv4 (ip) {
      if (!ip) { return false }
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      return ipv4Regex.test(ip)
    },
    onRowClick (item) {
      this.checkStatus(item.Name)
    },
    storeConfig () {
      localStorage.setItem(this.storageKey, JSON.stringify({
        filterStatus: this.filterStatus,
        localSize: this.localSize,
        dashboardStyle: this.dashboardStyle
      }))
    },
    getJobsCount (jobs) {
      if (typeof jobs === 'number') { return jobs }
      if (Array.isArray(jobs)) { return jobs.length }
      return 0
    },
    async reload () {
      // [新增] 展示模式下不執行 API 請求，僅更新時間
      if (this.isDisplayMode) {
        this.updated = this.$utils.now()
        return
      }

      this.isBusy = true
      try {
        const { data } = await axios.get(`${this.apiUrlBase}/printers`, {
          headers: {
            'X-API-KEY': this.apiKey
          }
        })
        if (data && data.data && Array.isArray(data.data.data)) {
          this.printers = data.data.data
          this.updated = this.$utils.now()
        } else if (data && Array.isArray(data.data)) {
          this.printers = data.data
          this.updated = this.$utils.now()
        } else {
          this.$utils.warn('無法解析回傳資料結構，保留現有資料', data)
        }
      } catch (err) {
        this.$utils.error('列印伺服器API錯誤，保留現有資料', err)
      } finally {
        this.isBusy = false
      }
    },
    checkStatus (name) {
      this.$refs.detailModal.show()
      const localPrinter = this.printers.find(p => p.Name === name)
      this.selectedPrinter = localPrinter || null
      // 展示模式下也可以查詢詳細狀態，視需求而定，這裡保留原邏輯
      this.debouncedFetchStatus(name)
    },
    cancelRequest () {
      if (this.cancelSource) {
        this.cancelSource.cancel('Operation canceled by the user.')
        this.cancelSource = null
      }
    },
    async fetchStatusFromApi (name) {
      this.cancelRequest()
      this.cancelSource = axios.CancelToken.source()
      try {
        const { data } = await axios.get(`${this.apiUrlBase}/printer/status`, {
          params: { name },
          headers: { 'X-API-KEY': this.apiKey },
          cancelToken: this.cancelSource.token
        })
        const printerData = (data && data.data) ? data.data : data
        if (printerData && (printerData.Name || printerData.Status)) {
          this.selectedPrinter = printerData
          const idx = this.printers.findIndex(p => p.Name === name)
          if (idx !== -1) {
            this.$set(this.printers, idx, printerData)
          }
        } else {
          this.$utils.warn('API 回傳詳細資料無效，保留顯示快取資料', data)
        }
        this.cancelSource = null
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }
        if (!this.selectedPrinter) {
          this.alert(`查詢失敗: ${err.message}`)
          this.$refs.detailModal.hide()
        } else {
          this.$utils.warn('無法取得最新詳細狀態，顯示快取資料', err)
        }
      }
    },
    // [修改] 取得伺服器日誌，並反轉內容
    async fetchServerLogs () {
      this.isBusy = true
      this.serverLogs = ''
      try {
        const { data } = await axios.get(`${this.apiUrlBase}/server/logs`, {
          params: { lines: 100 },
          headers: { 'X-API-KEY': this.apiKey }
        })

        let content = data
        if (data && data.data) {
          content = data.data
        }

        // [新增] 日誌反轉邏輯
        if (typeof content === 'string') {
          // 如果是純文字，按行分割 -> 反轉 -> 重新組合
          this.serverLogs = content.split('\n').reverse().join('\n')
        } else if (Array.isArray(content)) {
          // 如果是陣列，直接反轉
          this.serverLogs = JSON.stringify(content.reverse(), null, 2)
        } else if (typeof content === 'object') {
          // 如果是物件，轉字串 (無法反轉，除非轉換為 entries)
          this.serverLogs = JSON.stringify(content, null, 2)
        } else {
          this.serverLogs = content
        }

        this.$refs.logsModal.show()
      } catch (err) {
        this.alert(`無法取得紀錄: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    openPrintModal (name) {
      this.printTarget = name
      this.pdfFile = null
      this.duplex = 1
      this.$refs.printModal.show()
    },
    async uploadPdf () {
      if (!this.pdfFile) { return }
      this.isBusy = true
      try {
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsArrayBuffer(this.pdfFile)
        })
        await axios.post(`${this.apiUrlBase}/printer/print-pdf`, fileData, {
          params: {
            name: this.printTarget,
            duplex: this.duplex
          },
          headers: {
            // [修改] 使用 apiKey prop
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
        setTimeout(() => {
          this.reload()
          if (this.selectedPrinter && this.selectedPrinter.Name === name) {
            this.checkStatus(name)
          }
        }, 2000)
      } catch (err) {
        this.alert(`操作失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
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
        setTimeout(() => {
          this.reload()
          if (this.selectedPrinter && this.selectedPrinter.Name === name) {
            this.checkStatus(name)
          }
        }, 2000)
      } catch (err) {
        this.alert(`清除失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
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
    },
    toggleDashboardStyle () {
      this.dashboardStyle = this.dashboardStyle === 'grid' ? 'horizontal' : 'grid'
    },
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: `LahMonitorBoardPrinter${this.serverIp}`,
        new: n,
        old: o
      })
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