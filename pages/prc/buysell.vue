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
            b-card-header.bg-light.font-weight-bold 2. 買賣實例智慧檢核系統
            b-card-body.s-90
              ol.mb-0
                li 設定作業年期（預設次年期現值作業，自動計算篩選移轉區間）。
                li 上傳一或多個 Excel 實例檔，系統自動依移轉區間過濾符合資料。
                li 可自由勾選 8 大智慧檢核項目（基礎數值、樓層用途、門牌臨街、單價區間、耐用經歷、工期利潤、勘查日期、裝潢現值）。
                li 檢核後產出異常清冊，並可一鍵匯出含上色標記之 #[code 買賣實例檢核清冊.xlsx]。
          b-card(no-body)
            b-card-header.bg-light.font-weight-bold 3. 查核案件挑檔
            b-card-body.s-90
              ol.mb-0
                li #[strong 步驟 1 本月買賣案件清冊（必填）]：可切換選擇「第一種 WEB 版」或「第二種 區估系統版」。
                li #[strong 步驟 2～4（選填）]：房地合一稅異常清冊（C 欄序號）、大量估價異常-房地與土地（可微調差異 % 門檻）。
                li 比對後在畫面呈現異常摘要與申報代理人案件統計，並自動下載整列紅底標記之 #[code 實價登錄查核案件比對完成.xlsx]。

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
          .ml-2.s-90
            strong 提示說明：
            span 物價指數為選填，若未上傳則直接使用 K 欄單價進行排序。E 欄可填入多個區段號（數量不限），以逗號「,」、頓號「、」或分號分隔，第一個視為主區段。

        b-row
          //- 卡片 1: 買賣實例清冊
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm(no-body)
              b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
                span 1. 買賣實例清冊 #[b-badge(variant="danger") 必填]
              b-card-body
                b-form-file(
                  v-model="fileRaw",
                  accept=".xlsx, .xls",
                  placeholder="請選擇買賣實例清冊...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .mt-2.d-flex.align-items-center(style="min-height: 24px;")
                  span.small.font-weight-bold(:class="msgRawClass") {{ msgRaw }}
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 必須包含：
                  br
                  | A: 實例號, E: 區段號（可多個）
                  br
                  | G: 年月, K: 單價

          //- 卡片 2: 評議總表
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm(no-body)
              b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
                span 2. 評議總表 #[b-badge(variant="danger") 必填]
              b-card-body
                b-form-file(
                  v-model="fileValuation",
                  accept=".xlsx, .xls",
                  placeholder="請選擇評議總表...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .mt-2.d-flex.align-items-center(style="min-height: 24px;")
                  span.small.font-weight-bold(:class="msgValClass") {{ msgVal }}
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 必須包含：
                  br
                  | A: 區段號, L: 擬評

          //- 卡片 3: 物價指數
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm.border-dashed(no-body)
              b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
                span 3. 物價指數 #[b-badge(variant="secondary") 選填]
              b-card-body
                b-form-file(
                  v-model="fileIndex",
                  accept=".xlsx, .xls",
                  placeholder="請選擇物價指數表...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .mt-2.d-flex.align-items-center(style="min-height: 24px;")
                  span.small.font-weight-bold(:class="msgIdxClass") {{ msgIdx }}
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 選填項目：
                  br
                  | A: 年月, B: 指數
                  br
                  | 若未上傳，指數預設為 1

        b-button(
          block,
          size="lg",
          variant="primary",
          :disabled="salesProcessing || !fileRaw || !fileValuation",
          @click="processSalesList"
        )
          lah-fa-icon(v-if="salesProcessing", icon="spinner", action="spin")
          lah-fa-icon(v-else, icon="rocket")
          span.ml-2 {{ salesProcessing ? salesProgressText : '開始處理並下載 Excel' }}

        b-alert.mt-3.whitespace-pre-wrap(
          v-if="salesStatusText",
          show,
          :variant="salesStatusVariant"
        ) {{ salesStatusText }}

      //- =========================================================================
      //- 分頁 2: 買賣實例智慧檢核
      //- =========================================================================
      b-tab
        template(#title)
          lah-fa-icon(icon="clipboard-check", variant="success")
          span.ml-1 買賣實例智慧檢核
          b-badge.ml-1(v-if="auditResults.length > 0", :variant="auditErrorCount > 0 ? 'danger' : 'success'") {{ auditResults.length }}

        b-alert.d-flex.align-items-center(show, variant="info")
          lah-fa-icon(icon="shield-alt", size="lg", variant="success")
          .ml-2.s-90
            strong 智慧檢核系統：
            span 導入桃園市 114 年度標準單價、耐用年數修正防呆與透天厝精確免驗規則。非篩選區間內之交易案件將自動過濾。

        b-row
          //- 左側：條件與上傳
          b-col(cols="12", lg="5").mb-3
            b-card.h-100.shadow-sm(no-body)
              b-card-header.bg-white.font-weight-bold 1. 資料匯入與條件設定
              b-card-body
                b-form-group(label="作業年期（為次年現值作業）：", label-class="font-weight-bold")
                  .d-flex.align-items-center
                    b-form-input(
                      v-model.number="auditTargetYear",
                      type="number",
                      style="width: 110px;",
                      class="text-center font-weight-bold"
                    )
                    .ml-2.p-2.bg-light.rounded.border.flex-grow-1.s-85
                      span.text-muted 移轉年月自動篩選：
                      span.font-weight-bold.text-primary.ml-1 {{ auditDateRangeHint }}

                b-form-group(label="上傳資料檔（支援多檔選取）：", label-class="font-weight-bold")
                  b-form-file(
                    v-model="auditFiles",
                    accept=".xlsx, .xls",
                    multiple,
                    placeholder="請選擇一或多個 Excel 檔案...",
                    browse-text="瀏覽"
                  )
                    template(slot="file-name" slot-scope="{ names }")
                      b-badge(variant="dark") {{ names[0] }}
                      b-badge(v-if="names.length > 1", variant="dark", class="ml-1") + {{ names.length - 1 }} 更多檔案

                b-button(
                  block,
                  variant="success",
                  size="lg",
                  :disabled="auditProcessing || !auditFiles || auditFiles.length === 0",
                  @click="runAudit"
                )
                  lah-fa-icon(v-if="auditProcessing", icon="spinner", action="spin")
                  lah-fa-icon(v-else, icon="play-circle")
                  span.ml-2 {{ auditProcessing ? '檢核運算中...' : '開始智慧檢核' }}

          //- 右側：8 大檢核項目開關
          b-col(cols="12", lg="7").mb-3
            b-card.h-100.shadow-sm(no-body)
              b-card-header.bg-white.d-flex.justify-content-between.align-items-center
                span.font-weight-bold 8 大智慧檢核項目與邏輯說明
                b-form-checkbox(
                  v-model="selectAllAuditRules",
                  @change="toggleAllAuditRules"
                ) 全選 / 取消
              b-card-body.p-3
                .custom-scrollbar(style="max-height: 280px; overflow-y: auto;")
                  b-form-checkbox-group(v-model="activeAuditRules", stacked)
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="basic")
                        strong.text-dark 1. 基礎欄位與數值防呆
                        .text-muted.s-80 必填欄位檢查（透天厝免驗移轉層數）；總價及單價不可≤0；跨區段地價連動備註。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="floorCat")
                        strong.text-dark 2. 樓層用途與類別對應
                        .text-muted.s-80 公寓/華廈/大樓總樓層數限制；移轉層次與類別代碼相符性（透天厝免驗移轉樓高）。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="addressMatch")
                        strong.text-dark 3. 門牌臨街與宗地條件
                        .text-muted.s-80 門牌需含街道名稱；有巷為裡地、無巷為臨街地；不規則形狀寬深必為0，方形>0。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="price")
                        strong.text-dark 4. 建物單價區間檢核
                        .text-muted.s-80 依構造與總樓層，核對單價是否落在「桃園市 114 年度標準單價表」區間。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="durability")
                        strong.text-dark 5. 耐用年數與經歷防呆
                        .text-muted.s-80 經歷嚴格小於耐用；與法定年限不符時，修正理由須符合標準格式文字。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="profit")
                        strong.text-dark 6. 建築工期與利潤率
                        .text-muted.s-80 依總樓層自動推算合理工期並比對法定利潤率區間；利潤需大於 0。
                    .mb-2.p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="date")
                        strong.text-dark 7. 勘查日期合理性
                        .text-muted.s-80 勘查日期不可早於交易案件移轉年月，且不可晚於當年度 9 月 30 日。
                    .p-2.rounded.border-light.bg-light
                      b-form-checkbox(value="deco")
                        strong.text-dark 8. 裝潢費與現值比對
                        .text-muted.s-80 全棟裝潢費需大於 0 且總額小於全棟建物現值（透天住宅用途免驗）。

        //- 執行 Log
        b-collapse(v-model="showAuditLog", id="audit-log-collapse")
          b-card.bg-dark.text-light.font-mono.s-85.mb-3(no-body)
            b-card-body.p-2.custom-scrollbar(style="max-height: 140px; overflow-y: auto;")
              div(v-for="(log, idx) in auditLogs", :key="`log_${idx}`") &gt; {{ log }}

        //- 檢核統計與結果清單
        b-card.shadow-sm.mb-3(v-if="auditResults.length > 0", no-body)
          b-card-header.bg-white.d-flex.justify-content-between.align-items-center
            span.font-weight-bold 檢核結果統計與異常清單
            lah-button(
              icon="file-excel",
              variant="outline-success",
              size="sm",
              @click="exportAuditExcel",
              :disabled="auditResults.length === 0"
            ) 匯出標記異常清冊

          b-card-body
            b-row.text-center.mb-3
              b-col(cols="4")
                .p-3.rounded.bg-light.border
                  .text-muted.small 總檢核筆數
                  .h3.font-weight-bold.text-primary.mb-0 {{ auditResults.length }}
              b-col(cols="4")
                .p-3.rounded.bg-light.border
                  .text-muted.small 通過筆數
                  .h3.font-weight-bold.text-success.mb-0 {{ auditResults.length - auditErrorCount }}
              b-col(cols="4")
                .p-3.rounded.bg-light.border
                  .text-muted.small 異常筆數
                  .h3.font-weight-bold.text-danger.mb-0 {{ auditErrorCount }}

            .table-responsive(v-if="auditErrorCount > 0")
              table.table.table-sm.table-bordered.table-hover.s-90.mb-0
                thead.thead-light
                  tr.text-center
                    th(style="width: 100px;") 狀態
                    th(style="width: 150px;") 買賣實例編號
                    th(style="width: 140px;") 調查承辦人
                    th 異常診斷說明
                tbody
                  tr(
                    v-for="(row, rIdx) in auditErrorList",
                    :key="`audit_err_${rIdx}`",
                    class="table-danger"
                  )
                    td.text-center
                      b-badge(variant="danger") 異常
                    td.font-weight-bold.text-center {{ row['買賣實例編號'] || '-' }}
                    td.text-center {{ cleanSurveyorName(row['調查人員']) }}
                    td.text-danger
                      div(v-for="(issue, iIdx) in row._issuesList", :key="`issue_${iIdx}`") • {{ issue }}

            b-alert.mb-0.text-center(v-else, show, variant="success")
              lah-fa-icon(icon="check-circle", size="lg")
              span.ml-2.font-weight-bold 🎉 太棒了！本批資料全數通過智慧檢核，無任何異常！

      //- =========================================================================
      //- 分頁 3: 查核案件挑檔
      //- =========================================================================
      b-tab
        template(#title)
          lah-fa-icon(icon="search-dollar", variant="warning")
          span.ml-1 查核案件挑檔

        b-alert.d-flex.align-items-center(show, variant="info")
          lah-fa-icon(icon="info-circle", size="lg", variant="warning")
          .ml-2.s-90
            strong 比對說明：
            span 步驟 1 為必填，步驟 2～4 為選填。未上傳之清冊不列入比對。有任一異常之案件將標示紅底紅字，並自動產出代理人案件統計工作表。

        //- 步驟 1: 本月買賣案件清冊
        b-card.shadow-sm.mb-3(no-body)
          b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
            span 步驟 1：本月買賣案件清冊 #[b-badge(variant="danger") 必填]
          b-card-body
            b-form-group.mb-2
              b-form-radio-group(v-model="pickFile1Format", stacked)
                b-form-radio(value="web")
                  strong 第一種－WEB 版：
                  span.text-muted 第 15 列為標題列（A 欄＝申報書序號／Q 欄＝申報代理人）
                b-form-radio(value="system")
                  strong 第二種－區估系統版：
                  span.text-muted 需有名為「買賣」之工作表，第 1 列為標題列（A 欄＝申報書序號／BD 欄＝申報代理人）
            b-form-file(
              v-model="pickFile1",
              accept=".csv, .xlsx, .xls",
              placeholder="請選擇本月買賣案件清冊...",
              browse-text="瀏覽"
            )

        //- 步驟 2~4: 異常比對清冊
        b-row
          //- 步驟 2: 房地合一稅異常清冊
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm.border-dashed(no-body)
              b-card-header.bg-white.font-weight-bold 步驟 2：房地合一稅異常 #[b-badge(variant="secondary") 選填]
              b-card-body
                b-form-file(
                  v-model="pickFile2",
                  accept=".csv, .xlsx, .xls",
                  placeholder="請選擇房地合一稅異常檔...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 選填項目
                  br
                  | 比對欄位：C 欄（申報書序號）

          //- 步驟 3: 大量估價異常－房地
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm.border-dashed(no-body)
              b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
                span 步驟 3：大量估價－房地 #[b-badge(variant="secondary") 選填]
                .d-flex.align-items-center
                  span.s-80.text-muted.mr-1 差異&gt;
                  b-form-input(
                    v-model.number="pickThreshold3",
                    type="number",
                    size="sm",
                    style="width: 55px;",
                    class="text-center font-weight-bold p-1"
                  )
                  span.s-80.text-muted.ml-1 %
              b-card-body
                b-form-file(
                  v-model="pickFile3",
                  accept=".csv, .xlsx, .xls",
                  placeholder="請選擇大量估價(房地)檔...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 選填項目（B 欄序號去末2碼）
                  br
                  | BN 欄差異 % 大於門檻即標記

          //- 步驟 4: 大量估價異常－土地
          b-col(cols="12", md="4").mb-3
            b-card.h-100.shadow-sm.border-dashed(no-body)
              b-card-header.bg-white.font-weight-bold.d-flex.justify-content-between.align-items-center
                span 步驟 4：大量估價－土地 #[b-badge(variant="secondary") 選填]
                .d-flex.align-items-center
                  span.s-80.text-muted.mr-1 差異&gt;
                  b-form-input(
                    v-model.number="pickThreshold4",
                    type="number",
                    size="sm",
                    style="width: 55px;",
                    class="text-center font-weight-bold p-1"
                  )
                  span.s-80.text-muted.ml-1 %
              b-card-body
                b-form-file(
                  v-model="pickFile4",
                  accept=".csv, .xlsx, .xls",
                  placeholder="請選擇大量估價(土地)檔...",
                  browse-text="瀏覽",
                  size="sm"
                )
                .p-2.mt-2.bg-light.rounded.text-muted.s-85
                  | 選填項目（B 欄序號去末2碼）
                  br
                  | BN 欄差異 % 大於門檻即標記

        b-button(
          block,
          size="lg",
          variant="warning",
          :disabled="pickProcessing || !pickFile1",
          @click="processCasePick"
        )
          lah-fa-icon(v-if="pickProcessing", icon="spinner", action="spin")
          lah-fa-icon(v-else, icon="search")
          span.ml-2.font-weight-bold {{ pickProcessing ? pickProgressText : '開始比對並匯出結果 Excel' }}

        b-alert.mt-3.whitespace-pre-wrap(
          v-if="pickStatusText",
          show,
          :variant="pickStatusVariant"
        ) {{ pickStatusText }}

        //- 比對結果摘要與代理人統計
        b-card.shadow-sm.mt-3(v-if="pickResultSummary", no-body)
          b-card-header.bg-white.font-weight-bold 比對結果摘要與代理人案件統計
          b-card-body
            b-row.text-center.mb-3
              b-col(cols="6", md="3").mb-2
                .p-3.rounded.bg-light.border
                  .text-muted.small 總案件數
                  .h3.font-weight-bold.text-primary.mb-0 {{ pickResultSummary.total }}
              b-col(cols="6", md="3").mb-2
                .p-3.rounded.bg-light.border
                  .text-muted.small 有異常案件
                  .h3.font-weight-bold.text-danger.mb-0 {{ pickResultSummary.any }}
              b-col(cols="6", md="3").mb-2
                .p-3.rounded.bg-light.border
                  .text-muted.small 房地合一稅異常
                  .h3.font-weight-bold.text-warning.mb-0 {{ pickResultSummary.tax }}
              b-col(cols="6", md="3").mb-2
                .p-3.rounded.bg-light.border
                  .text-muted.small 大量估價異常
                  .h3.font-weight-bold.text-info.mb-0 {{ pickResultSummary.val }}

            .table-responsive.custom-scrollbar(style="max-height: 480px; overflow-y: auto;")
              table.table.table-sm.table-bordered.table-hover.s-90.mb-0
                thead.thead-light.sticky-top
                  tr.text-center
                    th 申報代理人
                    th(style="width: 140px;") 總件數
                    th(style="width: 160px;") 房地合一稅異常
                    th(style="width: 160px;") 大量估價異常
                tbody
                  tr(
                    v-for="(item, idx) in pickAgentList",
                    :key="`pick_ag_${idx}`",
                    :class="{ 'table-danger': item.taxAnomaly > 0 || item.valAnomaly > 0 }"
                  )
                    td.font-weight-bold {{ item.agent }}
                    td.text-right {{ item.total }}
                    td.text-right(:class="{ 'text-danger font-weight-bold': item.taxAnomaly > 0 }") {{ item.taxAnomaly }}
                    td.text-right(:class="{ 'text-danger font-weight-bold': item.valAnomaly > 0 }") {{ item.valAnomaly }}

</template>

<script>
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'

export default {
  data: () => ({
    activeTabIdx: 0,

    // =========================================================================
    // 工具 1: 買賣實例對應區段表資料
    // =========================================================================
    fileRaw: null,
    fileValuation: null,
    fileIndex: null,
    msgRaw: '',
    msgRawOk: false,
    msgVal: '',
    msgValOk: false,
    msgIdx: '',
    msgIdxOk: false,
    salesProcessing: false,
    salesProgressText: '',
    salesStatusText: '',
    salesStatusVariant: 'info',

    // =========================================================================
    // 工具 2: 買賣實例智慧檢核資料
    // =========================================================================
    auditTargetYear: 115,
    auditFiles: [],
    selectAllAuditRules: true,
    activeAuditRules: [
      'basic',
      'floorCat',
      'addressMatch',
      'price',
      'durability',
      'profit',
      'date',
      'deco'
    ],
    showAuditLog: true,
    auditLogs: [],
    auditProcessing: false,
    auditMergedData: [],
    auditResults: [],
    auditErrorCount: 0,

    // =========================================================================
    // 工具 3: 查核案件挑檔資料
    // =========================================================================
    pickFile1Format: 'web',
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
    auditDateRangeHint () {
      const yr = parseInt(this.auditTargetYear, 10)
      if (!yr || yr < 100) { return '請輸入有效的作業年期' }
      const start = `${yr - 2}0902`
      const end = `${yr - 1}0901`
      return `${start} ～ ${end}`
    },
    auditErrorList () {
      return this.auditResults.filter(r => r._status === 'FAIL')
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
  created () {
    const currentRocYear = new Date().getFullYear() - 1911
    this.auditTargetYear = currentRocYear + 1
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
    // 工具 1 邏輯: 買賣實例對應區段表
    // =========================================================================
    async validateFile (type, file) {
      const setMsg = (ok, text) => {
        if (type === 'raw') { this.msgRawOk = ok; this.msgRaw = text }
        if (type === 'val') { this.msgValOk = ok; this.msgVal = text }
        if (type === 'idx') { this.msgIdxOk = ok; this.msgIdx = text }
      }

      if (!file) {
        setMsg(true, '')
        return
      }

      setMsg(true, '檢查格式中...')
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
        if (!headers || headers.length === 0) { throw new Error('工作表無標題') }

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
          setMsg(true, '✅ 格式正確')
        } else {
          setMsg(false, '❌ ' + errorMsg.slice(0, -2))
        }
      } catch (err) {
        setMsg(false, '❌ 讀取失敗: ' + err.message)
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

    async processSalesList () {
      if (!this.fileRaw || !this.fileValuation) {
        this.notify('請至少上傳「買賣實例清冊」與「評議總表」！', { type: 'warning' })
        return
      }
      if ((!this.msgRawOk || !this.msgValOk) && !confirm('部分檔案欄位格式似乎有誤，確定要繼續處理嗎？')) {
        return
      }

      this.salesProcessing = true
      this.salesStatusText = ''
      this.salesProgressText = '步驟 1/5: 讀取檔案中...'

      try {
        const ExcelJS = await this.getExcelJS()
        const promises = [this.readExcelToArray(this.fileRaw), this.readExcelToArray(this.fileValuation)]
        promises.push(this.fileIndex ? this.readExcelToArray(this.fileIndex) : Promise.resolve([]))
        const [rawRows, valRows, idxRows] = await Promise.all(promises)

        this.salesProgressText = '步驟 2/5: 建立查找表...'
        const indexList = []
        if (idxRows.length > 0) {
          for (let i = 1; i < idxRows.length; i++) {
            const d = this.normalizeDate(idxRows[i][0])
            const r = parseFloat(idxRows[i][1])
            if (d && !isNaN(r)) { indexList.push({ date: d, rate: r }) }
          }
          indexList.sort((a, b) => a.date - b.date)
        }
        const valuationMap = new Map()
        for (let i = 1; i < valRows.length; i++) {
          const key = this.extractPureNumber(valRows[i][0])
          if (key !== null) { valuationMap.set(key, valRows[i][11]) }
        }

        this.salesProgressText = '步驟 3/5: 分析買例資料...'
        let idxSurv = 7
        if (rawRows[0]) {
          rawRows[0].forEach((h, idx) => {
            if (h && String(h).includes('調查人員')) { idxSurv = idx }
          })
        }
        const processedInstances = []
        const skippedIds = []
        let crossCount = 0
        let maxSpan = 0

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          const rawId = row[0]
          if (!rawId || String(rawId).trim() === '') { continue }

          const sectionList = this.parseSectionList(row[4])
          if (sectionList.length === 0) {
            skippedIds.push(rawId)
            continue
          }

          const mainSec = sectionList[0]
          if (sectionList.length > 1) { crossCount++ }
          if (sectionList.length > maxSpan) { maxSpan = sectionList.length }

          let priceIndex = 1.0
          if (indexList.length > 0) {
            const targetDate = this.normalizeDate(row[6])
            if (targetDate) {
              let foundRate = null
              for (let k = 0; k < indexList.length; k++) {
                if (indexList[k].date <= targetDate) { foundRate = indexList[k].rate } else { break }
              }
              if (foundRate !== null) { priceIndex = foundRate }
            }
          }
          let cleanPrice = 0
          if (row[10]) {
            const p = parseInt(String(row[10]).replace(/[,\s]/g, ''), 10)
            if (!isNaN(p)) { cleanPrice = p }
          }
          const unitPrice = Math.round(cleanPrice * priceIndex)
          processedInstances.push({
            instId: rawId,
            mainSec,
            sectionList,
            surveyor: row[idxSurv] || '',
            unitPrice,
            valuation: valuationMap.get(mainSec) ?? null
          })
        }

        this.salesProgressText = '步驟 4/5: 排版中...'
        const sections = {}
        processedInstances.forEach((inst) => {
          const associated = [...inst.sectionList].sort((a, b) => a - b)
          if (!sections[inst.mainSec]) { sections[inst.mainSec] = { meta: { valuation: null, surveyor: null }, instances: [] } }
          sections[inst.mainSec].meta.valuation = inst.valuation
          sections[inst.mainSec].meta.surveyor = inst.surveyor

          const record = { instId: inst.instId, price: inst.unitPrice, surveyor: inst.surveyor, allSections: associated }
          associated.forEach((secId) => {
            if (!sections[secId]) { sections[secId] = { meta: { valuation: null, surveyor: null }, instances: [] } }
            sections[secId].instances.push(record)
          })
        })

        for (const secId in sections) {
          const secData = sections[secId]
          if (secData.meta.valuation == null) { secData.meta.valuation = valuationMap.get(this.extractPureNumber(secId)) }
          if (!secData.meta.surveyor || String(secData.meta.surveyor).trim() === '') {
            const surveySet = new Set()
            secData.instances.forEach((inst) => { if (inst.surveyor) { surveySet.add(inst.surveyor) } })
            if (surveySet.size > 0) { secData.meta.surveyor = Array.from(surveySet).join('、') }
          }
        }

        this.salesProgressText = '步驟 5/5: 產生 Excel 樣式檔案...'
        const outWb = new ExcelJS.Workbook()
        const outWs = outWb.addWorksheet('買例整理結果')
        outWs.columns = [
          { header: '區段號', key: 'A', width: 12 },
          { header: '擬評', key: 'B', width: 12 },
          { header: '推估價', key: 'C', width: 12 },
          { header: '調查人員', key: 'D', width: 15 },
          { header: '固定欄', key: 'E', width: 15 }
        ]

        let currentRow = 2
        const sortedIds = Object.keys(sections).map(Number).sort((a, b) => a - b)
        const excelStyle = {
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }

        for (const secId of sortedIds) {
          const secData = sections[secId]
          secData.instances.sort((a, b) => a.price - b.price)
          const r = currentRow
          const cell = (ro, co, v) => { outWs.getCell(r + ro, co).value = v }

          cell(0, 1, secId)
          cell(1, 1, secId)
          cell(2, 1, secId)
          cell(0, 2, secData.meta.valuation)
          cell(1, 2, secData.meta.valuation)
          cell(2, 2, secData.meta.valuation)
          const sName = secData.meta.surveyor || ''
          cell(0, 4, sName)
          cell(1, 4, sName)
          cell(2, 4, sName)
          cell(0, 5, '跨區段號')
          cell(1, 5, '實例號')
          cell(2, 5, '實例單價')

          let colIdx = 6
          for (const inst of secData.instances) {
            const others = inst.allSections.filter(s => s !== secId)
            if (others.length === 0) {
              this.fillInst(outWs, r, colIdx, null, inst.instId, inst.price, excelStyle)
              colIdx++
            } else {
              for (const ref of others) {
                this.fillInst(outWs, r, colIdx, ref, inst.instId, inst.price, excelStyle)
                colIdx++
              }
            }
          }

          ;['A', 'B', 'C'].forEach(c => outWs.mergeCells(`${c}${r}:${c}${r + 2}`))
          for (let i = 0; i < 3; i++) {
            for (let j = 1; j <= 5; j++) {
              const c = outWs.getCell(r + i, j)
              c.alignment = { vertical: 'middle', horizontal: 'center' }
              c.border = excelStyle.border
            }
          }
          currentRow += 3
        }

        const buffer = await outWb.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        FileSaver.saveAs(blob, '買例整理結果_v8.6.xlsx')

        let summary = `✅ 處理完成！Excel 已自動下載。\n共處理實例 ${processedInstances.length} 筆，產生區段 ${sortedIds.length} 個\n跨區段實例 ${crossCount} 筆，單筆最多跨 ${maxSpan} 個區段`
        if (skippedIds.length > 0) {
          const preview = skippedIds.slice(0, 10).join('、')
          summary += `\n⚠️ 略過無區段號之實例 ${skippedIds.length} 筆：${preview}${skippedIds.length > 10 ? ' 等' : ''}`
        }
        this.salesStatusText = summary
        this.salesStatusVariant = 'success'
        this.notify('買例整理完成並已啟動下載', { type: 'success' })
      } catch (err) {
        console.error(err)
        this.salesStatusText = '❌ 發生錯誤: ' + err.message
        this.salesStatusVariant = 'danger'
        this.alert('處理失敗：' + err.message)
      } finally {
        this.salesProcessing = false
      }
    },

    // =========================================================================
    // 工具 2 邏輯: 買賣實例智慧檢核
    // =========================================================================
    toggleAllAuditRules (val) {
      if (val) {
        this.activeAuditRules = ['basic', 'floorCat', 'addressMatch', 'price', 'durability', 'profit', 'date', 'deco']
      } else {
        this.activeAuditRules = []
      }
    },

    cleanSurveyorName (str) {
      return (str || '').replace(/^[A-Za-z0-9_-]+/, '')
    },

    auditLog (msg, isReset = false) {
      if (isReset) { this.auditLogs = [] }
      this.auditLogs.push(msg)
    },

    normalizeAuditText (str) {
      if (!str) { return '' }
      return str.replace(/\s+/g, '')
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[一二三四五六七八九]/g, s => '123456789'['一二三四五六七八九'.indexOf(s)])
    },

    readAuditFileAsync (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
            resolve(json)
          } catch (err) { reject(err) }
        }
        reader.readAsArrayBuffer(file)
      })
    },

    async runAudit () {
      const targetYear = parseInt(this.auditTargetYear, 10)
      if (!targetYear || targetYear < 100) {
        this.notify('請確認作業年期！', { type: 'warning' })
        return
      }
      if (!this.auditFiles || this.auditFiles.length === 0) {
        this.notify('請選擇至少一個 Excel 檔案！', { type: 'warning' })
        return
      }

      this.auditProcessing = true
      const startRangeNum = parseInt(`${targetYear - 2}0902`, 10)
      const endRangeNum = parseInt(`${targetYear - 1}0901`, 10)
      this.auditLog('啟動桃園專用檢核引擎 (對齊 114 年標準單價表)...', true)
      this.auditMergedData = []

      try {
        const fileList = Array.isArray(this.auditFiles) ? this.auditFiles : [this.auditFiles]
        for (const file of fileList) {
          const data = await this.readAuditFileAsync(file)
          const filteredData = data.filter((row) => {
            const rawDate = String(row['移轉年月'] || '').trim()
            if (!rawDate) { return false }
            const dateNum = parseInt(rawDate, 10)
            return dateNum >= startRangeNum && dateNum <= endRangeNum
          })
          this.auditMergedData = this.auditMergedData.concat(filteredData)
          this.auditLog(`[${file.name}] 符合移轉區間共擷取 ${filteredData.length} 筆`)
        }

        if (this.auditMergedData.length === 0) {
          this.auditProcessing = false
          this.alert('無符合移轉區間之資料！請確認檔案或作業年期。')
          return
        }

        this.auditLog('智慧引擎檢核計算中 (對齊桃園市 114 年版標準單價表)...')
        this.auditErrorCount = 0
        const activeRules = this.activeAuditRules

        this.auditResults = this.auditMergedData.map((row) => {
          const issues = []
          const failedCols = []
          const getNum = (col) => {
            const v = row[col]
            if (!v) { return 0 }
            return parseFloat(String(v).replace(/,/g, '')) || 0
          }
          const getStr = col => (row[col] || '').toString().trim()

          const caseCategory = getNum('買賣實例類別')
          const buildingUsage = getStr('房屋用途')
          const isTownhouse = (caseCategory === 6 || buildingUsage.includes('透天'))

          // --- 項目 1：基礎欄位與數值防呆 ---
          if (activeRules.includes('basic')) {
            const reqs = ['鄉鎮市區', '年期', '登記收件字號', '義務人', '義務人地址', '權利人', '權利人地址', '移轉年月', '移轉原因', '資料來源', '買賣略圖', '建號母號', '建號子號', '建築物登記面積', '構造種類', '建物用途', '移轉樓層建物面積', '每年折舊率', '總折舊率', '調查人員', '臨街狀況-街道名稱', '宗地條件(形狀)', '交易案類別', '總樓層數樓上', '總樓層數樓下']
            if (!isTownhouse) {
              reqs.push('移轉地上層數', '移轉地下層數')
            }
            reqs.forEach((c) => {
              if (!getStr(c)) {
                issues.push(`缺漏：${c}`)
                failedCols.push(c)
              }
            })

            const pos = ['買賣實例總價', '(修正後)正常買賣總價格', '全棟房地可出售總價格', '建物單價', '(修正後)正常買賣單價', '土地正常買賣單價', '全棟建物重建價格', '全棟建物現值', '全棟建物現值_1', '全棟建物買賣正常利潤', '土地可出售(正常買賣)總價格', '臨街狀況-路寬', '基地面積']
            pos.forEach((c) => {
              if (getNum(c) <= 0) {
                issues.push(`數值異常：${c} 需大於 0`)
                failedCols.push(c)
              }
            })

            if (getNum('全棟建物折舊額') < 0) {
              issues.push('全棟建物折舊額不可小於 0')
              failedCols.push('全棟建物折舊額')
            }

            const m2 = getStr('區段號母號2')
            const m3 = getStr('區段號母號3')
            const val2 = getNum('跨地號區段地價2')
            const val3 = getNum('跨地號區段地價3')
            const rk = getStr('備註')
            if (!getStr('區段號母號1') || !getStr('區段號子號1')) {
              issues.push('區段號1不可為空')
              failedCols.push('區段號母號1', '區段號子號1')
            }
            if (getNum('跨地號區段地價1') <= 0) {
              issues.push('跨地地價1需>0')
              failedCols.push('跨地號區段地價1')
            }

            if (m2 && m2 !== '0') {
              if (val2 <= 0) { issues.push('有區段2，地價2需>0'); failedCols.push('跨地號區段地價2') }
              if (!rk) { issues.push('跨區段案件，備註不可空'); failedCols.push('備註') }
            } else if (val2 > 0) {
              issues.push('無區段2，地價2應為0')
              failedCols.push('跨地號區段地價2')
            }

            if (m3 && m3 !== '0') {
              if (val3 <= 0) { issues.push('有區段3，地價3需>0'); failedCols.push('跨地號區段地價3') }
              if (!rk) { issues.push('跨區段案件，備註不可空'); failedCols.push('備註') }
            } else if (val3 > 0) {
              issues.push('無區段3，地價3應為0')
              failedCols.push('跨地號區段地價3')
            }

            if ((m2 && m2 !== '0' && val2 > 0) || (m3 && m3 !== '0' && val3 > 0)) {
              if (rk) {
                const nRk = rk.replace(/\s+/g, '')
                const hB = nRk.includes('宗地平均公告現值=')
                const h1 = nRk.includes(`${getStr('區段號母號1')}${getStr('區段號子號1')}區段號:`) && nRk.includes(`=${getNum('跨地號區段地價1')}`)
                let h2 = true
                let h3 = true
                if (m2 && m2 !== '0' && val2 > 0) { h2 = nRk.includes(`${m2}${getStr('區段號子號2')}區段號:`) && nRk.includes(`=${val2}`) }
                if (m3 && m3 !== '0' && val3 > 0) { h3 = nRk.includes(`${m3}${getStr('區段號子號3')}區段號:`) && nRk.includes(`=${val3}`) }
                if (!hB || !h1 || !h2 || !h3) {
                  issues.push('備註格式不符，須符合「宗地平均公告現值=0000，區段號:(0000×區段現值÷0000)=跨地號地價」之規定')
                  failedCols.push('備註')
                }
              }
            }
          }

          // --- 項目 3：建物單價區間 (桃園 114 年度標準單價表) ---
          if (activeRules.includes('price')) {
            const type = getStr('構造種類')
            const floor = getNum('總樓層數樓上')
            const price = getNum('建物單價')
            let min = 0
            let max = 999999

            if (type.includes('鋼骨鋼筋混凝土') || type.includes('鋼骨混凝土')) {
              if (floor <= 5) { min = 23800; max = 48600 } else if (floor <= 10) { min = 27700; max = 53800 } else if (floor <= 15) { min = 31700; max = 59800 } else if (floor <= 20) { min = 35600; max = 65900 } else if (floor <= 30) { min = 40900; max = 74600 } else { min = 46200; max = 79000 }
            } else if (type.includes('鋼骨造')) {
              if (floor <= 5) { min = 26400; max = 51000 } else if (floor <= 10) { min = 29000; max = 56500 } else if (floor <= 15) { min = 33000; max = 62800 } else if (floor <= 20) { min = 37000; max = 69200 } else if (floor <= 30) { min = 43600; max = 78300 } else { min = 48800; max = 83000 }
            } else if (type.includes('鋼筋混凝土') || type.includes('預鑄')) {
              if (floor <= 5) { min = 18300; max = 39600 } else if (floor <= 10) { min = 23800; max = 44800 } else if (floor <= 15) { min = 27700; max = 50800 } else if (floor <= 20) { min = 31700; max = 56900 } else { min = 37000; max = 65600 }
            } else if (type.includes('加強磚造')) {
              min = 12000; max = 29000
            } else if (type.includes('重量鋼架') || type.includes('中量鋼架') || (type.includes('鋼架') && !type.includes('輕'))) {
              min = 14000; max = 25000
            } else if (type.includes('輕量鋼架') || type.includes('輕鋼架')) {
              min = 10600; max = 14500
            } else if (type.includes('木造')) {
              min = 6600; max = 24300
            } else if (type.includes('磚造') || type.includes('石造')) {
              min = 7900; max = 18700
            } else if (type.includes('竹造')) {
              min = 5300; max = 12500
            } else if (type.includes('土造') || type.includes('土磚混合')) {
              min = 5900; max = 14000
            }

            if (min > 0 && (price < (min - 1) || price > (max + 1))) {
              issues.push(`建物單價異常(實際:${price}, 桃園114標準:${min}~${max})`)
              failedCols.push('建物單價', '構造種類')
            }
          }

          // --- 項目 4：耐用年數與經歷防呆 ---
          if (activeRules.includes('durability')) {
            const am = getNum('經歷年數')
            const al = getNum('耐用年數')
            const type = getStr('構造種類')
            let ap = ''
            Object.keys(row).forEach((k) => {
              if (k.includes('修正理由') && (k.includes('AL') || k.includes('AO') || k.includes('_1'))) {
                ap = String(row[k]).trim()
              }
            })
            if (!ap) { ap = getStr('耐用年數修正理由') }

            if (am < 0) { issues.push('經歷年數不可為負數'); failedCols.push('經歷年數') }
            if (al === 0) { issues.push('耐用年數不可為0'); failedCols.push('耐用年數') }
            if (al > 0 && am >= al) {
              issues.push(`經歷年數(${am})必須嚴格小於耐用年數(${al})`)
              failedCols.push('經歷年數', '耐用年數')
            }

            let stdAl = 0
            if (type.includes('鋼筋混凝土') || type.includes('預鑄') || type.includes('鋼骨')) { stdAl = 60 } else if (type.includes('加強磚造')) { stdAl = 50 } else if (type.includes('鋼架')) { stdAl = 35 } else if (type.includes('磚造') || type.includes('石造')) { stdAl = 40 } else if (type.includes('木造')) { stdAl = 25 } else if (type.includes('土造')) { stdAl = 20 } else if (type.includes('竹造')) { stdAl = 10 }

            if (stdAl > 0 && al !== stdAl) {
              const validFormat = ap.includes('原耐用年數為') && ap.includes('調整經濟耐用年數為')
              if (!validFormat) {
                issues.push('耐用年數與法定不符，AP欄格式須為：原耐用年數為xx年，調整經濟耐用年數為xx年')
                failedCols.push('耐用年數修正理由')
              }
            }
          }

          // --- 項目 2：樓層用途與類別對應 ---
          if (activeRules.includes('floorCat')) {
            const fAbove = getNum('總樓層數樓上')
            const tFloor = parseInt((getStr('房屋資料(移轉層次)') || getStr('移轉層次')).replace(/\D/g, ''), 10) || 0
            if (!isTownhouse) {
              if (tFloor > 0) {
                if (fAbove < tFloor) { issues.push('總樓層不可小於移轉層次'); failedCols.push('總樓層數樓上', '房屋資料(移轉層次)') }
                if (getNum('移轉地上層數') > tFloor) { issues.push('移轉地上層數不可大於移轉層次'); failedCols.push('移轉地上層數', '房屋資料(移轉層次)') }
                if (getNum('移轉地下層數') > tFloor) { issues.push('移轉地下層數不可大於移轉層次'); failedCols.push('移轉地下層數', '房屋資料(移轉層次)') }
              }
              if (buildingUsage.includes('公寓') && fAbove > 5) { issues.push('公寓應<=5層'); failedCols.push('房屋用途', '總樓層數樓上') }
              if (buildingUsage.includes('華廈') && fAbove > 10) { issues.push('華廈應<=10層'); failedCols.push('房屋用途', '總樓層數樓上') }
              if (buildingUsage.includes('大樓') && fAbove < 11) { issues.push('大樓應>=11層'); failedCols.push('房屋用途', '總樓層數樓上') }
            }
            if (caseCategory === 5 && getNum('移轉範圍') !== 0) { issues.push('類別5移轉範圍應為0'); failedCols.push('買賣實例類別', '移轉範圍') }
            if (caseCategory === 6) {
              if (getNum('移轉範圍') !== 1) { issues.push('類別6移轉範圍應為1'); failedCols.push('買賣實例類別', '移轉範圍') }
              if (getStr('建築改良物門牌').includes('樓')) { issues.push('類別6門牌不應有樓'); failedCols.push('建築改良物門牌') }
            }
            ;['修正理由', '買賣實例修正情況', '買賣實例修正說明'].forEach((c) => {
              if (getStr(c) && getStr(c) !== '無') {
                issues.push(`${c}限填無/空`)
                failedCols.push(c)
              }
            })
          }

          // --- 項目 8：裝潢費與現值比對 ---
          if (activeRules.includes('deco') && !isTownhouse) {
            const deco = getNum('全棟建物之裝潢設備及庭園設施等費用')
            if (deco <= 0) {
              issues.push('裝潢費不可<=0')
              failedCols.push('全棟建物之裝潢設備及庭園設施等費用')
            } else if (deco > getNum('全棟建物現值')) {
              issues.push('裝潢費大於全棟現值')
              failedCols.push('全棟建物之裝潢設備及庭園設施等費用', '全棟建物現值')
            }
          }

          // --- 項目 6：建築工期與利潤率 ---
          if (activeRules.includes('profit')) {
            const pRate = getNum('利潤率')
            if (pRate <= 0) { issues.push('利潤率不可<=0'); failedCols.push('利潤率') }
            if (!getStr('利潤理由')) { issues.push('利潤理由不可空'); failedCols.push('利潤理由') }
            const fAbove = getNum('總樓層數樓上')
            const fBelow = getNum('總樓層數樓下')
            const cm = (fAbove > 5) ? (fAbove + 9) + (fBelow * 2) : 4 + (fAbove * 2) + (fBelow * 2)
            let min = 0
            let max = 0
            if (cm <= 12) { min = 8; max = 18 } else if (cm <= 24) { min = 8; max = 20 } else if (cm <= 36) { min = 11; max = 21 } else if (cm <= 48) { min = 13; max = 23 } else { min = 14; max = 24 }

            if (pRate > 0 && (pRate < (min - 1) || pRate > (max + 1))) {
              issues.push(`利潤率異常(實際:${pRate}%, 合理:${min}~${max}%)`)
              failedCols.push('利潤率')
            }
          }

          // --- 項目 7：勘查日期合理性 ---
          if (activeRules.includes('date')) {
            const ed = parseInt(getStr('勘查日期'), 10)
            const td = parseInt(getStr('移轉年月'), 10)
            const lim = parseInt(`${targetYear}0930`, 10)
            if (ed && td && ed < td) { issues.push('勘查早於移轉年月'); failedCols.push('勘查日期', '移轉年月') }
            if (ed && ed > lim) { issues.push('勘查不可晚於9/30'); failedCols.push('勘查日期') }
          }

          // --- 項目 3：門牌臨街與宗地條件 ---
          if (activeRules.includes('addressMatch')) {
            const rStreet = getStr('臨街狀況-街道名稱')
            const rRel = getStr('臨街狀況-臨街關係')
            const zS = getStr('宗地條件(形狀)')
            const zW = getNum('宗地條件(寬度)')
            const zD = getNum('宗地條件(深度)')
            const nAddr = this.normalizeAuditText(getStr('建築改良物門牌'))
            const nStreet = this.normalizeAuditText(rStreet)
            const match = nStreet.match(/^.*[段路街巷]/)
            if (getStr('建築改良物門牌') && rStreet && !nAddr.includes(match ? match[0] : nStreet)) {
              issues.push('門牌與臨街不符')
              failedCols.push('建築改良物門牌', '臨街狀況-街道名稱')
            }
            if (rStreet.includes('巷') && !rRel.includes('裡地')) {
              issues.push('有巷應為裡地')
              failedCols.push('臨街狀況-街道名稱', '臨街狀況-臨街關係')
            }
            if (!rStreet.includes('巷') && !rRel.includes('臨街地')) {
              issues.push('無巷應為臨街地')
              failedCols.push('臨街狀況-街道名稱', '臨街狀況-臨街關係')
            }
            if (zS.includes('不規則') && (zW !== 0 || zD !== 0)) {
              issues.push('形狀不規則，寬深應為0')
              failedCols.push('宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)')
            }
            if (zS.includes('方') && (zW <= 0 || zD <= 0)) {
              issues.push('形狀方形，寬深需>0')
              failedCols.push('宗地條件(形狀)', '宗地條件(寬度)', '宗地條件(深度)')
            }
          }

          if (issues.length > 0) {
            this.auditErrorCount++
            if (!failedCols.includes('買賣實例編號')) { failedCols.push('買賣實例編號') }
          }

          return {
            ...row,
            _status: issues.length === 0 ? 'OK' : 'FAIL',
            _issuesList: issues,
            _issues: issues.join(' | '),
            _failedCols: failedCols
          }
        })

        this.auditLog(`檢核完畢！共檢核 ${this.auditResults.length} 筆，異常 ${this.auditErrorCount} 筆`)
        this.notify(`檢核完成！共 ${this.auditResults.length} 筆，異常 ${this.auditErrorCount} 筆`, {
          type: this.auditErrorCount > 0 ? 'warning' : 'success'
        })
      } catch (err) {
        console.error(err)
        this.auditLog('❌ 檢核發生例外錯誤: ' + err.message)
        this.alert('檢核失敗：' + err.message)
      } finally {
        this.auditProcessing = false
      }
    },

    async exportAuditExcel () {
      if (this.auditResults.length === 0) { return }
      try {
        const ExcelJS = await this.getExcelJS()
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('檢核結果')
        const headers = Object.keys(this.auditMergedData[0])
        headers.push('系統檢核結果')
        const headerRow = worksheet.addRow(headers)
        headerRow.eachCell((c) => {
          c.font = { bold: true }
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }
        })

        this.auditResults.forEach((res) => {
          const rowData = headers.map(h => h === '系統檢核結果' ? (res._issues || '正常') : res[h])
          const row = worksheet.addRow(rowData)
          if (res._status === 'FAIL') {
            row.eachCell((cell, colNum) => {
              if (res._failedCols.includes(headers[colNum - 1])) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
                cell.font = { color: { argb: 'FF991B1B' }, bold: true }
              }
            })
          }
        })

        const buffer = await workbook.xlsx.writeBuffer()
        FileSaver.saveAs(new Blob([buffer]), `買賣實例檢核清冊_${Date.now()}.xlsx`)
        this.notify('異常清冊匯出完成！', { type: 'success' })
      } catch (err) {
        this.alert('匯出 Excel 失敗：' + err.message)
      }
    },

    // =========================================================================
    // 工具 3 邏輯: 查核案件挑檔
    // =========================================================================
    colToIdx (colStr) {
      let idx = 0
      for (let i = 0; i < colStr.length; i++) {
        idx = idx * 26 + (colStr.charCodeAt(i) - 64)
      }
      return idx - 1
    },

    readPickWorkbook (file) {
      return new Promise((resolve, reject) => {
        if (!file) { resolve(null); return }
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            resolve(XLSX.read(data, { type: 'array' }))
          } catch (err) { reject(new Error(`無法解析檔案「${file.name}」：${err.message}`)) }
        }
        reader.onerror = () => reject(new Error(`無法讀取檔案「${file.name}」`))
        reader.readAsArrayBuffer(file)
      })
    },

    async processCasePick () {
      if (!this.pickFile1) {
        this.notify('請至少上傳「步驟 1：本月買賣案件清冊」！', { type: 'warning' })
        return
      }

      this.pickProcessing = true
      this.pickResultSummary = null
      this.pickAgentList = []
      this.pickStatusText = '步驟 1/4：讀取檔案中...'
      this.pickProgressText = '比對中...'
      this.pickStatusVariant = 'info'

      let threshold3 = parseFloat(this.pickThreshold3)
      let threshold4 = parseFloat(this.pickThreshold4)
      if (isNaN(threshold3)) { threshold3 = 10 }
      if (isNaN(threshold4)) { threshold4 = 10 }

      try {
        const ExcelJS = await this.getExcelJS()
        const [wb1, wb2, wb3, wb4] = await Promise.all([
          this.readPickWorkbook(this.pickFile1),
          this.readPickWorkbook(this.pickFile2),
          this.readPickWorkbook(this.pickFile3),
          this.readPickWorkbook(this.pickFile4)
        ])

        // 檔案 1：格式判定
        let data1 = []
        let headerRowIndex = 0
        let agentColIdx = 0
        if (this.pickFile1Format === 'web') {
          data1 = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1, defval: '' })
          headerRowIndex = 14
          agentColIdx = this.colToIdx('Q')
        } else {
          if (!wb1.Sheets['買賣']) {
            throw new Error('檔案 1 中找不到名為「買賣」之工作表！請確認上傳了正確的區估系統檔，或切換為 WEB 版格式。')
          }
          data1 = XLSX.utils.sheet_to_json(wb1.Sheets['買賣'], { header: 1, defval: '' })
          headerRowIndex = 0
          agentColIdx = this.colToIdx('BD')
        }

        if (data1.length <= headerRowIndex) {
          throw new Error(`檔案 1 資料列數不足，找不到第 ${headerRowIndex + 1} 列標題列，請確認清冊格式設定。`)
        }

        const idxFile1A = this.colToIdx('A')
        const taxAnomalySet = new Set()
        const valueAnomalySet = new Set()

        // 檔案 2：房地合一稅異常（C 欄序號）
        this.pickStatusText = '步驟 2/4：建立異常清單...'
        if (wb2) {
          const data2 = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1, defval: '' })
          const idxC = this.colToIdx('C')
          for (let i = 1; i < data2.length; i++) {
            if (data2[i] && data2[i][idxC]) { taxAnomalySet.add(String(data2[i][idxC]).trim()) }
          }
        }

        // 檔案 3、4：大量估價異常
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
              if (idStr.length >= 2) { idStr = idStr.slice(0, -2) }
              valueAnomalySet.add(idStr)
            }
          }
        }
        processValuationData(wb3, threshold3)
        processValuationData(wb4, threshold4)

        // 產出比對資料
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

          if (!summaryStats[agent]) { summaryStats[agent] = { total: 0, taxAnomaly: 0, valAnomaly: 0 } }
          summaryStats[agent].total++
          if (isTax) { summaryStats[agent].taxAnomaly++ }
          if (isVal) { summaryStats[agent].valAnomaly++ }
        }

        // 產生 Excel
        this.pickStatusText = '步驟 4/4：產生 Excel 比對報表...'
        const outWb = new ExcelJS.Workbook()

        // 工作表 1：比對結果
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

        // 工作表 2：代理人統計
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
        FileSaver.saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '實價登錄查核案件比對完成.xlsx')

        this.pickResultSummary = {
          total: totalCount,
          any: anyCount,
          tax: taxCount,
          val: valCount
        }
        this.pickAgentList = sortedAgents.map(ag => ({
          agent: ag,
          total: summaryStats[ag].total,
          taxAnomaly: summaryStats[ag].taxAnomaly,
          valAnomaly: summaryStats[ag].valAnomaly
        }))

        const skipped = [!wb2 && '房地合一稅', !wb3 && '大量估價-房地', !wb4 && '大量估價-土地'].filter(Boolean)
        let msg = `✅ 比對與分析完成！檔案已自動下載。\n共 ${totalCount} 件，其中異常 ${anyCount} 件（房地合一稅 ${taxCount} 件、大量估價 ${valCount} 件）`
        if (skipped.length > 0) { msg += `\nℹ️ 未上傳未列入比對清冊：${skipped.join('、')}` }
        this.pickStatusText = msg
        this.pickStatusVariant = 'success'
        this.notify('挑檔比對完成並已啟動下載', { type: 'success' })
      } catch (err) {
        console.error(err)
        this.pickStatusText = '❌ 發生錯誤: ' + err.message
        this.pickStatusVariant = 'danger'
        this.alert('比對失敗：' + err.message)
      } finally {
        this.pickProcessing = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}
.border-dashed {
  border-style: dashed !important;
}
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f5f9;
  }
}
.s-80 {
  font-size: 0.8rem;
}
.s-85 {
  font-size: 0.85rem;
}
.s-90 {
  font-size: 0.9rem;
}
</style>
