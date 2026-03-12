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
      //- 完整列表按鈕 (避免在 Display Mode 下再次顯示此按鈕，造成無限 Modal)
      //- [修改] 當目前顯示模式已經是 xl 時，隱藏此按鈕
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
      lah-button(
        icon="tv",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="cycleSize",
        :title="`切換顯示模式 (目前: ${localSize})`"
      )

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

      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明與設定"
      )

  //- 說明 Modal 增加設定區塊
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

    //- 維護區塊
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

        lah-button.mr-2(
          icon="redo-alt",
          variant="outline-warning",
          @click="restartScript"
          title="重新啟動 PowerShell Agent 腳本"
        ) 重啟腳本

        lah-button(
          icon="file-alt",
          variant="outline-dark",
          @click="fetchServerLogs"
          title="查看伺服器紀錄 (最後500行)"
        ) 查看紀錄

    hr

    h6.font-weight-bold.mb-2 功能說明
    ul
      li 監控伺服器 (Server IP) 上的實體印表機狀態。
      li.text-danger
        strong 部署需求：
        span 需在列印伺服器上安裝並執行
        code Printer_API_Agent.ps1
        span  腳本。
        .mt-2
          b-button-group(size="sm")
            b-button(variant="outline-primary" :href="agentDownloadUrl" target="_blank" pill)
              lah-fa-icon(icon="download").mr-1
              span 下載 Agent 腳本
            b-button.ml-1(variant="outline-info" :href="guideDownloadUrl" target="_blank" pill)
              lah-fa-icon(icon="file-pdf").mr-1
              span 下載部署指南

      //- [修改] 特別強調燈號說明，具體列出判斷條件
      li.mt-2.mb-2
        div.mb-1
          strong 狀態燈號綜合判定說明：
          span 儀表板燈號會綜合考量「單機狀態」、「佇列數量」與「異常比例」：
        ul.mt-2.mb-2(style="list-style-type: none; padding-left: 0.5rem;")
          li.mb-2
            b-badge.mr-2(variant="success" class="p-2") 🟢 綠燈 (正常)
            span 所有印表機運作正常，無錯誤訊息且伺服器佇列工作數在安全範圍。
          li.mb-2
            b-badge.mr-2(variant="warning" class="p-2") 🟡 黃燈 (警示)
            span 單機出現警告狀況 (如：#[strong.text-warning 碳粉不足])，或伺服器整體佇列工作數 #[strong 大於 5 筆]，或異常印表機比例 #[strong 超過 20%]。
          li
            b-badge.mr-2(variant="danger" class="p-2") 🔴 紅燈 (異常)
            span 單機發生嚴重錯誤 (如：#[strong.text-danger 斷線、離線、無回應、卡紙])，或伺服器整體佇列工作數 #[strong 大於 10 筆]，或異常印表機比例 #[strong 超過 30%]。

      li
        strong 狀態篩選：
        span 使用標題旁的下拉選單可過濾顯示特定狀態的印表機。
      li
        strong 深度自癒：
        span 強制重啟伺服器 Print Spooler 服務並清理暫存，用於解決卡單問題。
      li
        strong 重啟腳本：
        span 重新啟動伺服器上的 Agent 腳本，用於解決腳本卡死或更新後重啟。
      li
        strong 單機重整：
        span 針對特定印表機執行暫停與恢復操作。
      li
        strong PDF 列印：
        span 可上傳 PDF 檔案至指定印表機進行列印測試 (僅 Ready 狀態顯示)。
      li
        strong 資訊編輯：
        span 可在詳細資訊視窗中編輯印表機的「位置」與「備註」。
      li(v-if="!isDisplayMode")
        strong 自動更新：
        span 每 {{ reloadMs / 60000 }} 分鐘自動重新整理一次。
      li(v-else)
        strong 展示模式：
        span 資料由外部提供，本組件不執行自動更新。

    h6.font-weight-bold.mb-2 地政系統進階列印操作說明
    ul
      li 利用專屬監控頁面可進行櫃台已列印的謄本、規費收據預覽或是重印 👉 #[b-link(:href="`http://${this.apiSvrIp}:${this.apiSvrPort}/project/printer/`" target="_blank" rel="noopener") 點我開啟新視窗]

  //- 伺服器紀錄 Modal
  b-modal(
    ref="logsModal",
    title="伺服器紀錄 (最後500行)"
    size="xl"
    scrollable
    hide-footer
    @shown="scrollLogsToBottom"
  )
    pre.bg-dark.text-white.p-3.rounded(ref="logsContent" v-if="serverLogs" style="font-size: 0.85rem; min-height: 400px;") {{ serverLogs }}
    div.text-center.text-muted.py-5(v-else) 暫無紀錄或載入中...

  //- 完整資料列表 Modal
  b-modal(
    ref="fullTableModal"
    :title="`完整印表機清單 - ${serverIp}:${serverPort}`"
    size="xl"
    hide-footer
    body-class="p-0"
  )
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
    :title="detailModalTitle"
    size="lg"
    hide-footer
    @hide="cancelEdit"
  )
    div(v-if="selectedPrinter")
      //- 上半部：狀態摘要
      b-card.mb-3(no-body)
        b-card-body.d-flex.align-items-center.justify-content-between
          div
            h5.mb-1 {{ selectedPrinter.Name }}
            div.text-muted
              span.mr-2 IP: {{ selectedPrinter.IP || 'N/A' }}
              b-badge(v-if="selectedPrinter.Location && !isEditing" variant="light") {{ selectedPrinter.Location }}

          div.text-right
            //- 傳入完整的物件進行狀態判定
            b-badge.p-2.mb-1(:variant="getPaperBadgeVariant(selectedPrinter)" pill)
              lah-fa-icon.mr-1(v-if="isDetailLoading" icon="spinner" action="spin")
              span.h6.mb-0 {{ formatStatus(selectedPrinter) }}
            div.small.text-danger(v-if="selectedPrinter.ErrorDetails || selectedPrinter.DetailedStatus") {{ selectedPrinter.ErrorDetails || selectedPrinter.DetailedStatus }}

      //- 中間：詳細屬性列表
      b-row
        //- [左側]
        b-col(cols="12" md="6")
          b-list-group.mb-3
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 佇列工作數 (Jobs)
              strong(:class="{'text-danger': getJobsCount(selectedPrinter.Jobs) > 0}") {{ getJobsCount(selectedPrinter.Jobs) }}
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 驅程式 (Driver)
              span.text-truncate(style="max-width: 200px;" :title="selectedPrinter.Driver || selectedPrinter.DriverName") {{ selectedPrinter.Driver || selectedPrinter.DriverName || 'Unknown' }}
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 位置 (Location)
              div(v-if="isEditing" style="flex: 1; margin-left: 10px;")
                b-form-input(v-model="editForm.location" size="sm" placeholder="請輸入位置")
              span(v-else) {{ selectedPrinter.Location || '未設定' }}

        //- [右側]
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
            b-list-group-item.d-flex.justify-content-between.align-items-center
              span.text-muted 備註 (Comment)
              div(v-if="isEditing" style="flex: 1; margin-left: 10px;")
                b-form-input(v-model="editForm.comment" size="sm" placeholder="請輸入備註")
              span.text-truncate(v-else style="max-width: 150px;" :title="selectedPrinter.Comment") {{ selectedPrinter.Comment || '無' }}

      //- 底部：操作按鈕區
      hr

      .d-flex.justify-content-end.flex-wrap
        template(v-if="isEditing")
          lah-button.mr-2.mb-2(
            icon="save"
            variant="success"
            @click="updatePrinterInfo"
            :loading="isBusy"
            :disabled="isBusy"
          ) 儲存變更
          lah-button.mb-2(
            icon="times"
            variant="outline-secondary"
            @click="cancelEdit"
            :disabled="isBusy"
          ) 取消

        template(v-else)
          lah-button.mr-auto.mb-2(
            icon="edit"
            variant="outline-primary"
            @click="initEdit"
            title="編輯位置與備註"
            :disabled="isBusy || isDetailLoading"
          ) 編輯資訊

          lah-button.mr-2.mb-2(
            icon="sync-alt",
            variant="outline-success",
            @click="fetchStatusFromApi(selectedPrinter.Name)",
            :loading="isDetailLoading",
            :disabled="isBusy || isDetailLoading",
            title="從伺服器讀取最新狀態"
          ) 更新狀態

          lah-button.mr-2.mb-2(
            v-if="selectedPrinter.Status === 'Ready'"
            icon="file-pdf",
            variant="outline-dark",
            @click="openPrintModal(selectedPrinter.Name)",
            title="上傳 PDF 進行列印測試",
            :disabled="isBusy || isDetailLoading"
          ) PDF 測試列印

          lah-button.mr-2.mb-2(
            icon="trash-alt",
            variant="outline-danger",
            @click="clearQueue(selectedPrinter.Name)",
            :disabled="getJobsCount(selectedPrinter.Jobs) === 0 || isBusy || isDetailLoading"
            title="強制清除所有佇列工作"
          ) 清除佇列

          lah-button.mb-2(
            icon="sync",
            variant="primary",
            @click="refreshPrinter(selectedPrinter.Name)",
            title="暫停並重新啟動此印表機 (WMI)",
            :disabled="isBusy || isDetailLoading"
          ) 嘗試修復

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
  div.center.d-flex.flex-column.justify-content-center.align-items-center.flex-grow-1(v-if="printers.length === 0")
    div(v-if="isBusy")
      lah-fa-icon(icon="spinner", action="spin") 載入中...
    div(v-else) ⚠ 無法取得印表機列表，請檢查連線設定與 CORS 權限。

  div.d-flex.flex-column.flex-grow-1.overflow-hidden(v-else)
    //- XS 尺寸：儀表板顯示
    div.h-100(v-if="localSize === 'xs'")
      b-row.text-center.h-100(no-gutters)
        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="success"
            text-variant="white"
            body-class="p-1 d-flex align-items-center justify-content-center overflow-hidden"
          )
            svg(viewBox="0 0 100 70" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="font-family: inherit;")
              text(x="50" y="42" text-anchor="middle" fill="currentColor" font-weight="bold" font-size="38") {{ dashboardStats.ready }}
              text(x="50" y="62" text-anchor="middle" fill="currentColor" font-size="14") 正常

        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="warning"
            text-variant="dark"
            body-class="p-1 d-flex align-items-center justify-content-center overflow-hidden"
          )
            svg(viewBox="0 0 100 70" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="font-family: inherit;")
              text(x="50" y="42" text-anchor="middle" fill="currentColor" font-weight="bold" font-size="38") {{ dashboardStats.warning }}
              text(x="50" y="62" text-anchor="middle" fill="currentColor" font-size="14") 警告

        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="danger"
            text-variant="white"
            body-class="p-1 d-flex align-items-center justify-content-center overflow-hidden"
          )
            svg(viewBox="0 0 100 70" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="font-family: inherit;")
              text(x="50" y="42" text-anchor="middle" fill="currentColor" font-weight="bold" font-size="38") {{ dashboardStats.error }}
              text(x="50" y="62" text-anchor="middle" fill="currentColor" font-size="14") 異常

        b-col.p-1(
          :cols="dashboardColCols"
          :style="{ height: dashboardStyle === 'grid' ? '50%' : '100%' }"
        )
          b-card.h-100.shadow-sm(
            bg-variant="info"
            text-variant="white"
            body-class="p-1 d-flex align-items-center justify-content-center overflow-hidden"
          )
            svg(viewBox="0 0 100 70" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="font-family: inherit;")
              text(x="50" y="42" text-anchor="middle" fill="currentColor" font-weight="bold" font-size="38") {{ dashboardStats.jobs }}
              text(x="50" y="62" text-anchor="middle" fill="currentColor" font-size="14") 佇列

    //- 其他尺寸：列表顯示
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
            title="上傳 PDF 進行列印測試",
            :disabled="isBusy"
          )
          lah-button.ml-1(
            icon="sync",
            variant="outline-primary",
            no-icon-gutter,
            @click.stop="refreshPrinter(item.Name)",
            title="重新整理此印表機 (WMI Suspend/Resume)",
            :disabled="isBusy"
          )

      template(#cell(Status)="{ item }")
        b-badge.p-2(
          :variant="getPaperBadgeVariant(item)"
          pill
          v-b-tooltip.hover
          :title="getStatusTooltip(item)"
        ) {{ formatStatus(item) }}

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

      template(#cell(Location)="{ item }")
        b-badge(v-if="item.Location" variant="light") {{ item.Location }}

      template(#cell(Driver)="{ item }")
        div.text-truncate(style="max-width: 200px;" :title="item.Driver || item.DriverName") {{ item.Driver || item.DriverName }}

      template(#cell(Comment)="{ item }")
        div.text-truncate(style="max-width: 150px;" :title="item.Comment") {{ item.Comment }}

      template(#cell(ErrorDetails)="{ item }")
        div.text-danger.small {{ item.ErrorDetails || item.DetailedStatus }}

      template(#cell(PortName)="{ item }")
        div.text-truncate(style="max-width: 150px;" :title="item.PortName") {{ item.PortName }}

  template(#footer, v-if="footer && !isDisplayMode"): lah-monitor-board-footer(
    ref="footer",
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="reload",
    :reload="() => { reload(true) }",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
import axios from 'axios';
import _ from 'lodash';
import dynamicHeight from '~/mixins/dynamic-height-mixin.js';

export default {
  name: 'LahMonitorBoardPrinter',
  mixins: [dynamicHeight],
  props: {
    footer: { type: Boolean, default: false },
    id: { type: String, default: 'default' },
    size: { type: String, default: 'xs' },
    serverIp: { type: String, default: '127.0.0.1' },
    serverPort: { type: String, default: '8888' },
    apiKey: { type: String, default: 'YourSecretApiKey123' },
    reloadMs: {
      type: [Number, String],
      default: 300000,
      validator (value) {
        return !isNaN(Number(value)) && Number(value) > 0
      }
    },
    inPrinters: { type: Array, default: () => [] }
  },
  data () {
    return {
      isBusy: false,
      isDetailLoading: false,
      updated: '',
      fetchingState: null,
      header: '列印伺服器監控',
      filterStatus: '全部',
      localSize: 'xs',
      dashboardStyle: 'horizontal',
      selectedPrinter: null,
      isEditing: false,
      editForm: {
        location: '',
        comment: ''
      },
      cancelSource: null,
      serverLogs: '',
      printers: [],

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
        { value: 'xl', text: '完整列表 (XL)' }
      ]
    }
  },
  computed: {
    detailModalTitle () {
      if (!this.selectedPrinter) { return '載入中...' }
      const loadingText = this.isDetailLoading ? ' (更新中...)' : ''
      return `${this.selectedPrinter.Name} - 詳細資訊${loadingText}`
    },
    downloadUrlBase () {
      return `http://${this.apiSvrIp}:${this.apiSvrPort}`
    },
    agentDownloadUrl () {
      return `${this.downloadUrlBase}/assets/sh/Printer_API_Agent.ps1`
    },
    guideDownloadUrl () {
      return `${this.downloadUrlBase}/assets/sh/Printer_API_Agent_Windows_Server_部署指南.pdf`
    },
    isDisplayMode () {
      return this.inPrinters && this.inPrinters.length > 0
    },
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
        return [
          { key: 'action', label: '操作', class: 'text-center' },
          { key: 'Status', label: '狀態', sortable: true, class: 'text-center' },
          { key: 'Name', label: '名稱', sortable: true },
          { key: 'Location', label: '位置', sortable: true },
          { key: 'IP', label: 'IP', sortable: true },
          { key: 'Jobs', label: '佇列', sortable: true, class: 'text-center' },
          { key: 'Comment', label: '備註', sortable: true },
          { key: 'ErrorDetails', label: '錯誤細節', sortable: true },
          { key: 'Driver', label: '驅動程式', sortable: true },
          { key: 'PortName', label: '連接埠', sortable: true }
        ]
      } else {
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
    queueLight () {
      if (this.printers.length === 0) { return 'warning' }
      const totalJobs = this.printers.reduce((sum, printer) => {
        return sum + this.getJobsCount(printer.Jobs)
      }, 0)
      if (totalJobs > 10) { return 'danger' }
      if (totalJobs > 5) { return 'warning' }
      return 'success'
    },
    errorRatioLight () {
      if (this.printers.length === 0) { return 'success' }

      const totalCount = this.printers.length
      const errorCount = this.printers.filter(p => this.getPaperBadgeVariant(p) === 'danger').length
      const errorRatio = errorCount / totalCount

      if (errorRatio > 0.30) { return 'danger' }
      if (errorRatio > 0.20) { return 'warning' }

      return 'success'
    },
    notReadyLight () {
      if (this.printers.length === 0) { return 'success' }
      const statuses = this.printers.map(p => this.getPaperBadgeVariant(p))
      if (statuses.includes('danger')) { return 'danger' }
      if (statuses.includes('warning')) { return 'warning' }
      return 'success'
    },
    light () {
      const qLight = this.queueLight
      const eLight = this.errorRatioLight

      if (qLight === 'danger' || eLight === 'danger') { return 'danger' }
      if (qLight === 'warning' || eLight === 'warning') { return 'warning' }
      return 'success'
    },
    statusOptions () {
      return [
        { value: '全部', text: '全部顯示' },
        { value: 'not_ready', text: '⚠ 非就緒狀態' },
        { value: '就緒', text: '就緒' },
        { value: '警示', text: '警示' },
        { value: '錯誤', text: '錯誤' }
      ]
    },
    filteredPrinters () {
      if (this.filterStatus === '全部') {
        return this.printers
      }
      if (this.filterStatus === 'not_ready') {
        return this.printers.filter(p => this.getPaperBadgeVariant(p) !== 'success')
      }
      if (this.filterStatus === '就緒') {
        return this.printers.filter(p => this.getPaperBadgeVariant(p) === 'success')
      }
      if (this.filterStatus === '警示') {
        return this.printers.filter(p => this.getPaperBadgeVariant(p) === 'warning')
      }
      if (this.filterStatus === '錯誤') {
        return this.printers.filter(p => this.getPaperBadgeVariant(p) === 'danger')
      }
      return this.printers
    },
    dashboardStats () {
      const list = this.printers

      const readyCount = list.filter((p) => {
        const variant = this.getPaperBadgeVariant(p)
        return variant === 'success'
      }).length

      const warningCount = list.filter((p) => {
        const variant = this.getPaperBadgeVariant(p)
        return variant === 'warning'
      }).length

      const errorCount = list.filter((p) => {
        const variant = this.getPaperBadgeVariant(p)
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
    inPrinters (newVal) {
      if (newVal && newVal.length > 0) {
        this.printers = [...newVal]
        this.updated = this.$utils.now()
      }
    }
  },
  created () {
    this.debouncedFetchStatus = _.debounce(this.fetchStatusFromApi, 300)

    if (this.inPrinters && this.inPrinters.length > 0) {
      this.printers = [...this.inPrinters]
      this.updated = this.$utils.now()
    }
    this.localSize = this.size
  },
  mounted () {
    this.emitLightUpdate(this.light, '')
    const cachedConfig = localStorage.getItem(this.storageKey)
    if (cachedConfig) {
      const config = JSON.parse(cachedConfig)
      this.filterStatus = config.filterStatus || this.filterStatus
      this.dashboardStyle = config.dashboardStyle || this.dashboardStyle

      // [修正] 當外部明確傳入 size 為 xs 時 (儀表板模式)，不套用快取的尺寸設定，強制維持 xs
      if (this.size !== 'xs' && config.localSize) {
        this.localSize = config.localSize
      }
    }

    if (this.isDisplayMode) {
      this.localSize = this.size
    } else {
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
    cycleSize () {
      const options = this.sizeOptions.map(o => o.value)
      const idx = options.indexOf(this.localSize)
      const nextIdx = (idx + 1) % options.length
      this.localSize = options[nextIdx]
    },
    getStatusTooltip (item) {
      const status = this.formatStatus(item)
      const error = item.ErrorDetails || item.DetailedStatus
      if (error) {
        return `${status} : ${error}`
      }
      return status
    },
    formatStatus (item) {
      if (!item) { return '未知' }
      const variant = this.getPaperBadgeVariant(item)
      if (variant === 'danger') { return '錯誤' }
      if (variant === 'warning') { return '警示' }
      return '就緒'
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
      let saveSize = this.localSize
      const cachedConfig = localStorage.getItem(this.storageKey)

      if (cachedConfig) {
        const config = JSON.parse(cachedConfig)
        // [修正] 如果目前在儀表板模式(size=xs)，不要把 xs 蓋掉原本快取中的大表格尺寸 (例如 md, lg)
        // 這樣才不會因為在儀表板切換了 filterStatus，導致連帶把尺寸洗成 xs
        if (this.size === 'xs' && this.localSize === 'xs' && config.localSize) {
          saveSize = config.localSize
        }
      }

      localStorage.setItem(this.storageKey, JSON.stringify({
        filterStatus: this.filterStatus,
        localSize: saveSize,
        dashboardStyle: this.dashboardStyle
      }))
    },
    getJobsCount (jobs) {
      if (typeof jobs === 'number') { return jobs }
      if (Array.isArray(jobs)) { return jobs.length }
      return 0
    },
    async reload (force = false) {
      if (this.isDisplayMode) {
        this.updated = this.$utils.now()
        return
      }

      const isForce = force === true || (typeof force === 'object' && force.type === 'click')

      const cacheKey = `lah-monitor-board-printer-cache-${this.serverIp}`
      const now = Date.now()

      if (!isForce) {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (now - parsed.timestamp < this.reloadMs) {
              this.printers = parsed.data
              this.updated = parsed.updated || this.$utils.now()
              console.warn(`${this.serverIp} 快取有效，使用快取資料，距離上次更新 ${(now - parsed.timestamp) / 1000}s 秒`)
              return
            }
          } catch (e) {
            console.error('Cache parsing error', e)
          }
        }
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

        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: now,
          updated: this.updated,
          data: this.printers
        }))
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
    },
    cancelRequest () {
      if (this.cancelSource) {
        this.cancelSource.cancel('Operation canceled by the user.')
        this.cancelSource = null
      }
    },
    async fetchStatusFromApi (name) {
      this.isDetailLoading = true
      this.cancelRequest()
      const source = axios.CancelToken.source()
      this.cancelSource = source

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
      } finally {
        if (this.cancelSource === source) {
          this.isDetailLoading = false
          this.cancelSource = null
        }
      }
    },
    async fetchServerLogs () {
      this.isBusy = true
      this.serverLogs = ''
      try {
        const { data } = await axios.get(`${this.apiUrlBase}/server/logs`, {
          params: { lines: 500 },
          headers: { 'X-API-KEY': this.apiKey }
        })

        let content = data
        if (data && data.data) {
          content = data.data
        }

        if (typeof content === 'object') {
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
    scrollLogsToBottom () {
      this.$nextTick(() => {
        const pre = this.$refs.logsContent
        if (pre) {
          const modalBody = pre.parentElement
          if (modalBody) {
            modalBody.scrollTop = modalBody.scrollHeight
          }
        }
      })
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
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/pdf'
          }
        })

        this.notify('PDF 已傳送列印', { type: 'success' })
        this.$refs.printModal.hide()
        this.pdfFile = null
        setTimeout(() => this.reload(true), 2000)
      } catch (err) {
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
        await axios.get(`${this.apiUrlBase}/printer/refresh`, {
          params: { name },
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('指令已發送', { type: 'success' })
        setTimeout(() => {
          this.reload(true)
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
    async restartScript () {
      const confirm = await this.$bvModal.msgBoxConfirm('確定要重新啟動伺服器上的 Agent 腳本嗎？\n這將會暫時中斷監控連線。', {
        title: '重啟腳本確認',
        okVariant: 'warning',
        centered: true
      })
      if (!confirm) { return }

      this.isBusy = true
      try {
        await axios.get(`${this.apiUrlBase}/server/restart-script`, {
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('重啟指令已發送，請稍候...', { type: 'warning' })
        setTimeout(() => this.reload(true), 5000)
      } catch (err) {
        this.alert(`啟動失敗: ${err.message}`)
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
        await axios.get(`${this.apiUrlBase}/printer/clear`, {
          params: { name },
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('清除指令已發送', { type: 'success' })
        setTimeout(() => {
          this.reload(true)
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
        await axios.get(`${this.apiUrlBase}/service/self-heal`, {
          headers: { 'X-API-KEY': this.apiKey }
        })
        this.notify('自癒流程已啟動，請稍候...', { type: 'warning' })
        setTimeout(() => this.reload(true), 5000)
      } catch (err) {
        this.alert(`啟動失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    initEdit () {
      if (this.selectedPrinter) {
        this.editForm.location = this.selectedPrinter.Location || ''
        this.editForm.comment = this.selectedPrinter.Comment || ''
        this.isEditing = true
      }
    },
    cancelEdit () {
      this.isEditing = false
      this.editForm.location = ''
      this.editForm.comment = ''
    },
    async updatePrinterInfo () {
      if (!this.selectedPrinter) { return }

      this.isBusy = true
      try {
        await axios.get(`${this.apiUrlBase}/printer/update`, {
          params: {
            name: this.selectedPrinter.Name,
            location: this.editForm.location,
            comment: this.editForm.comment
          },
          headers: { 'X-API-KEY': this.apiKey }
        })

        this.notify('資訊已更新', { type: 'success' })
        this.isEditing = false

        this.$set(this.selectedPrinter, 'Location', this.editForm.location)
        this.$set(this.selectedPrinter, 'Comment', this.editForm.comment)

        const idx = this.printers.findIndex(p => p.Name === this.selectedPrinter.Name)
        if (idx !== -1) {
          const updatedPrinter = { ...this.printers[idx] }
          updatedPrinter.Location = this.editForm.location
          updatedPrinter.Comment = this.editForm.comment

          const newPrinters = [...this.printers]
          newPrinters[idx] = updatedPrinter
          this.printers = newPrinters
        }

        const cacheKey = `lah-monitor-board-printer-cache-${this.serverIp}`
        const now = Date.now()
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: now,
          updated: this.updated,
          data: this.printers
        }))
      } catch (err) {
        this.alert(`更新失敗: ${err.message}`)
      } finally {
        this.isBusy = false
      }
    },
    // [修改] 調整判斷邏輯優先級，確保「碳粉不足」明確落入警示 (warning) 中
    getPaperBadgeVariant (item) {
      if (!item) { return 'secondary' }

      let statusStr = ''
      let detailStr = ''

      if (typeof item === 'string') {
        statusStr = item
      } else {
        statusStr = item.Status || ''
        detailStr = item.ErrorDetails || item.DetailedStatus || ''
      }

      const s = statusStr.toLowerCase()
      const d = detailStr.toLowerCase()

      // 1. 最高優先級：明確的嚴重錯誤 (斷線、離線、無回應、卡紙) -> error (danger)
      if (
        d.includes('not responding') || d.includes('無回應') ||
        d.includes('offline') || d.includes('離線') || d.includes('斷線') ||
        d.includes('jam') || d.includes('卡紙') ||
        s.includes('not responding') || s.includes('無回應') ||
        s.includes('offline') || s.includes('離線') || s.includes('斷線') ||
        s.includes('jam') || s.includes('卡紙')
      ) {
        return 'danger'
      }

      // 2. 次高優先級：明確的警示狀況 (碳粉不足) -> warning
      // 即便 API 回傳 Status 是 "錯誤"，只要細節標明是碳粉問題，就強制視為黃燈
      if (
        d.includes('toner') || d.includes('碳粉') ||
        s.includes('toner') || s.includes('碳粉')
      ) {
        return 'warning'
      }

      // 3. 兜底判斷 (如果不是上述明確情況，才用通用的 Error / Warning 來決定)
      if (d.includes('error') || d.includes('錯誤') || s.includes('error') || s.includes('錯誤')) {
        return 'danger'
      }

      if (d.includes('warning') || d.includes('警告') || s.includes('warning') || s.includes('警告')) {
        return 'warning'
      }

      // 若無異常則視為就緒
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
