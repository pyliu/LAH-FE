<template lang="pug">
div
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto 請示(取消)案件
      lah-button(
        icon="info"
        action="bounce"
        variant="outline-success"
        no-border
        no-icon-gutter
        @click="showModalById('help-modal')"
        title="說明"
      )
      lah-help-modal(:modal-id="'help-modal'" size="lg")
        h5 請示管考與防範規避逾期說明
        ul
          li #[strong 稽核核心目的]：清查並防範審查人員在限辦即將到期時，利用「請示（RM80）」機制暫停/凍結辦理時限以規避逾期管考責任。
          li #[strong 納管範圍]：同時監控「目前請示中（未取消/未結案）」與「歷史已取消請示」案件，防止藉故長期掛單規避。
        hr
        h5 四大疑似規避逾期特徵判定標準
        .row
          .col-md-6.mb-2
            .p-2.border.rounded.border-danger.bg-light
              .text-danger.font-weight-bold: lah-fa-icon.mr-1(icon="stopwatch" variant="danger") 1. 壓線請示（臨期請示）
              .small 原限辦到期前 24 小時內（或當日）急掛請示，極可能因即將逾期緊急掛請示凍結時限。
          .col-md-6.mb-2
            .p-2.border.rounded.border-warning.bg-light
              .text-warning.font-weight-bold: lah-fa-icon.mr-1(icon="business-time" variant="warning") 2. 請示滯留過長
              .small 請示時間超過 7 天（未取消或遲未處理），可能藉請示名義無限期拖延案件。
          .col-md-6.mb-2
            .p-2.border.rounded.border-primary.bg-light
              .text-primary.font-weight-bold: lah-fa-icon.mr-1(icon="bolt" variant="primary") 3. 極速結案（掩護結案）
              .small 取消請示後 24 小時內即迅速結案，疑案情並無實質法令疑義，純為爭取行政作業時間。
          .col-md-6.mb-2
            .p-2.border.rounded.border-dark.bg-light
              .text-dark.font-weight-bold: lah-fa-icon.mr-1(icon="calendar-times" variant="dark") 4. 逾期相關違規
              .small 掛請示當下已逾期，或取消請示後最終結案仍超過法定限辦日期者。
        hr
        h5 狀態燈號說明：
        .d-flex.flex-wrap
          .mr-3.mb-1: lah-fa-icon(icon="circle" variant="danger") 已逾期案件（滯留逾期或結案仍逾期）
          .mr-3.mb-1: lah-fa-icon(icon="circle" variant="warning") 警戒案件（距到期24h內或滯留超時）
          .mr-3.mb-1: lah-fa-icon(icon="circle" variant="info") 進行中請示案件（尚未取消）
          .mr-3.mb-1: lah-fa-icon(icon="circle" variant="success") 合規正常結案案件

    .d-flex.text-nowrap
      lah-datepicker.mr-1(v-model="dateRange")
      lah-button(
        ref="search"
        icon="search"
        size="lg"
        title="搜尋"
        :disabled="isBusy || dateRange.days < 1"
        @click="$fetch"
        no-icon-gutter
      )
      lah-button.mx-1(
        icon="search-plus"
        size="lg"
        title="開啟進階篩選視窗"
        @click="$refs.searchPlus.show()"
        :disabled="!dataReady"
        no-icon-gutter
      ) 進階篩選
      lah-button-xlsx.mr-1(
        :jsons="xlsxData"
        header="請示(取消)案件"
      )
      lah-countdown-button(
        ref="countdown"
        icon="sync-alt"
        action="ld-cycle"
        size="lg"
        title="立即重新讀取"
        variant="outline-secondary"
        badge-variant="secondary"
        auto-start
        no-badge
        @end="reload"
        @click="reload"
        :milliseconds="cachedMs"
        :disabled="isBusy || dateRange.days < 1"
        :busy="isBusy"
      )

  //- 快速切換與承辦人分析按鈕列
  lah-transition(appear): .d-flex.align-items-center.justify-content-between.my-2(v-if="dataReady")
    .d-flex.align-items-center
      b-button-group.mr-2(size="sm")
        b-button(
          :variant="dateBy === 'receive_date' ? 'primary' : 'outline-secondary'"
          @click="changeDateBy('receive_date')"
          title="以收件日期(RM07_1)區間查詢"
        ) 依收件日
        b-button(
          :variant="dateBy === 'ask_date' ? 'primary' : 'outline-secondary'"
          @click="changeDateBy('ask_date')"
          title="以請示日期(RM80)區間查詢"
        ) 依請示日

      b-button(
        size="sm"
        :variant="showReviewerPanel ? 'info' : 'outline-info'"
        class="mr-2"
        @click="showReviewerPanel = !showReviewerPanel"
        title="展開/收合審查人員請示分析面板"
      )
        lah-fa-icon(icon="users-cog" class="mr-1")
        span 承辦人分析
        b-badge.ml-1(v-if="reviewerStats.length > 0" variant="light") {{ reviewerStats.length }}

    .d-flex.align-items-center
      b-form-checkbox(
        v-model="includePending"
        switch
        class="my-auto small mr-2"
        @change="reload"
      ) 納管進行中請示案件

  //- 頂部 6 大戰情 KPI 卡片
  lah-transition(appear): .row.no-gutters.my-2(v-if="dataReady")
    .col-6.col-md-2.p-1
      .card.h-100.border-danger.shadow-sm.kpi-card(
        :class="{ 'active-card-danger': statusFilter === 'SUSPICIOUS' }"
        @click="toggleStatusFilter('SUSPICIOUS')"
        style="cursor: pointer;"
        title="點擊快篩全部疑似規避案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-danger.mr-2(icon="exclamation-triangle" size="2x")
            div
              .text-muted.small.font-weight-bold 疑似規避總計
              .small.text-danger 符合任一特徵
          .h4.font-weight-bold.text-danger.mb-0 {{ kpiStats.suspicious }}

    .col-6.col-md-2.p-1
      .card.h-100.border-info.shadow-sm.kpi-card(
        :class="{ 'active-card-info': statusFilter === 'PENDING' }"
        @click="toggleStatusFilter('PENDING')"
        style="cursor: pointer;"
        title="點擊快篩目前尚未取消請示之案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-info.mr-2(icon="hourglass-half" size="2x")
            div
              .text-muted.small.font-weight-bold 目前請示中
              .small.text-info 尚未取消/進行中
          .h4.font-weight-bold.text-info.mb-0 {{ kpiStats.pending }}

    .col-6.col-md-2.p-1
      .card.h-100.border-danger.shadow-sm.kpi-card(
        :class="{ 'active-card-danger': statusFilter === 'RUSH' }"
        @click="toggleStatusFilter('RUSH')"
        style="cursor: pointer;"
        title="點擊快篩到期前24小時急掛請示案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-danger.mr-2(icon="stopwatch" size="2x")
            div
              .text-muted.small.font-weight-bold 壓線請示
              .small.text-danger 到期前 ≤ {{ thresholds.rushHours }}h
          .h4.font-weight-bold.text-danger.mb-0 {{ kpiStats.rush }}

    .col-6.col-md-2.p-1
      .card.h-100.border-warning.shadow-sm.kpi-card(
        :class="{ 'active-card-warning': statusFilter === 'STAGNANT' }"
        @click="toggleStatusFilter('STAGNANT')"
        style="cursor: pointer;"
        title="點擊快篩請示天數過長之案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-warning.mr-2(icon="business-time" size="2x")
            div
              .text-muted.small.font-weight-bold 請示滯留
              .small.text-warning 請示歷時 > {{ thresholds.stagnantDays }}天
          .h4.font-weight-bold.text-warning.mb-0 {{ kpiStats.stagnant }}

    .col-6.col-md-2.p-1
      .card.h-100.border-primary.shadow-sm.kpi-card(
        :class="{ 'active-card-primary': statusFilter === 'SPEEDY_CLOSE' }"
        @click="toggleStatusFilter('SPEEDY_CLOSE')"
        style="cursor: pointer;"
        title="點擊快篩取消請示後極速結案之案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-primary.mr-2(icon="bolt" size="2x")
            div
              .text-muted.small.font-weight-bold 極速結案
              .small.text-primary 取消後 ≤ {{ thresholds.speedyHours }}h
          .h4.font-weight-bold.text-primary.mb-0 {{ kpiStats.speedyClose }}

    .col-6.col-md-2.p-1
      .card.h-100.border-secondary.shadow-sm.kpi-card(
        :class="{ 'active-card-dark': statusFilter === 'OVERDUE' }"
        @click="toggleStatusFilter('OVERDUE')"
        style="cursor: pointer;"
        title="點擊快篩請示後仍逾期或逾期中掛請示案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-dark.mr-2(icon="calendar-times" size="2x")
            div
              .text-muted.small.font-weight-bold 請示仍逾期
              .small.text-dark 逾期掛/結案逾期
          .h4.font-weight-bold.text-dark.mb-0 {{ kpiStats.overdue }}

  //- 審查人員請示分析面板 (Reviewer Analytics Panel)
  b-collapse(v-model="showReviewerPanel" id="reviewer-stats-collapse")
    .card.border-info.shadow-sm.my-2
      .card-header.bg-light.p-2.d-flex.justify-content-between.align-items-center
        .d-flex.align-items-center
          lah-fa-icon.text-info.mr-2(icon="users-cog")
          strong.text-info 審查人員請示分析與異常排行
          span.text-muted.small.ml-2 （點選承辦人可一鍵過濾案件）
        .d-flex.align-items-center
          b-button(
            v-if="selectedReviewer"
            size="sm"
            variant="outline-secondary"
            class="py-0 px-2 mr-2"
            @click="selectedReviewer = ''"
          ) 清除人員過濾
          b-badge(variant="info") 共 {{ reviewerStats.length }} 位人員

      .card-body.p-2
        .d-flex.flex-wrap
          .p-1(
            v-for="rev in reviewerStats"
            :key="rev.name"
            style="min-width: 170px;"
          )
            .border.rounded.p-2.h-100.reviewer-card(
              :class="{ 'border-primary bg-primary text-white': selectedReviewer === rev.name, 'bg-light': selectedReviewer !== rev.name }"
              @click="toggleReviewer(rev.name)"
              style="cursor: pointer; transition: all 0.2s;"
            )
              .d-flex.justify-content-between.align-items-center
                strong.font-weight-bold {{ rev.name }}
                b-badge(
                  :variant="selectedReviewer === rev.name ? 'light' : (rev.suspicious > 0 ? 'danger' : 'success')"
                  pill
                ) {{ rev.suspicious > 0 ? `異常 ${rev.suspicious}` : '正常' }}
              .small.mt-1(
                :class="selectedReviewer === rev.name ? 'text-white' : 'text-muted'"
              )
                span 總請示: {{ rev.total }} 件
                span.ml-2 異常率: {{ rev.rate }}%

  //- 篩選條件指示條
  lah-transition: .d-flex.align-items-center.bg-light.px-3.py-2.rounded.my-2.border(
    v-if="statusFilter !== 'ALL' || selectedReviewer || advKeyword"
  )
    .d-flex.align-items-center.flex-wrap.w-100
      lah-fa-icon.mr-2(icon="filter" variant="primary")
      span.small.font-weight-bold 目前篩選：

      b-badge.mr-2.p-2(v-if="statusFilter !== 'ALL'" pill :variant="statusFilterBadgeVariant")
        | 戰情：{{ statusFilterText }}
        a.text-white.ml-1(href="#" @click.prevent="statusFilter = 'ALL'") &times;

      b-badge.mr-2.p-2(v-if="selectedReviewer" pill variant="info")
        | 承辦人：{{ selectedReviewer }}
        a.text-white.ml-1(href="#" @click.prevent="selectedReviewer = ''") &times;

      b-badge.mr-2.p-2(v-if="advKeyword" pill variant="secondary")
        | 關鍵字：{{ advKeyword }}
        a.text-white.ml-1(href="#" @click.prevent="advKeyword = ''") &times;

      span.text-muted.small.mr-auto （篩選後共 {{ filteredData.length }} 筆）

      b-button(
        size="sm"
        variant="link"
        class="text-danger p-0 ml-2"
        @click="resetAllFilters"
      ) 清除所有篩選

  //- 快篩介面靠到最右邊 (遵循 LAH-FE 規範)
  lah-transition(appear): .d-flex.align-items-center.justify-content-end.mb-1(v-if="dataReady")
    b-input(
      v-model="advKeyword"
      trim
      size="sm"
      class="col-2"
      placeholder="... 輸入關鍵字篩選案件 ..."
      title="可依收件字號、初審人員、登記原因或辦理情形快篩"
    )

  //- 表格分頁 (獨立一列，遵循 LAH-FE 規範)
  lah-transition: lah-pagination(
    v-model="pagination"
    :total-rows="filteredData.length"
    :caption="`找到 ${filteredData.length} 筆資料`"
  )

  //- 資料表格
  lah-transition(appear): .my-2
    b-table(
      id="ask-case-table"
      ref="table"
      responsive
      striped
      hover
      bordered
      head-variant="dark"
      class="text-center align-middle"
      :fields="fields"
      :items="filteredData"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
      :busy="isBusy"
    )
      template(#table-busy): span.ld-txt 讀取中...

      //- 狀態燈號
      template(#cell(請示燈號)="{ item }")
        lah-fa-icon(
          prefix="fas"
          icon="circle"
          :variant="item.請示燈號"
          :title="getLightTitle(item)"
        )

      //- 收件字號
      template(#cell(收件字號)="{ item }")
        .d-flex.align-items-center.justify-content-center
          b-link.font-weight-bold(
            @click.prevent="openTimeline(item)"
            title="點擊檢視請示時序軌跡與風險診斷"
          )
            span(v-html="highlight(item.收件字號)")
          b-link.ml-1.text-muted(
            @click.prevent="popupDetail(item)"
            title="查看完整登記案件詳情"
          )
            lah-fa-icon(icon="window-restore" regular variant="primary")

      //- 規避風險標籤
      template(#cell(規避風險標籤)="{ item }")
        .d-flex.flex-wrap.justify-content-center
          template(v-if="item._tags && item._tags.length > 0")
            b-badge.m-1.p-1(
              v-for="tag in item._tags"
              :key="tag"
              pill
              :variant="getTagVariant(tag)"
            ) {{ tag }}
          template(v-else)
            b-badge(variant="light" class="text-muted p-1") 正常無異常

      //- 請示狀態
      template(#cell(請示狀態)="{ item }")
        b-badge(
          :variant="item._pending ? 'info' : 'secondary'"
          pill
          class="p-1 px-2"
        )
          lah-fa-icon.mr-1(:icon="item._pending ? 'clock' : 'check'")
          | {{ item._pending ? '進行中' : '已取消' }}

      //- 初審人員
      template(#cell(初審人員)="{ item }")
        b-button(
          size="sm"
          variant="outline-primary"
          pill
          class="py-0 px-2"
          @click="toggleReviewer(item.初審人員)"
          :title="`點擊篩選 ${item.初審人員} 的所有案件`"
        )
          lah-avatar.mr-1(:id="item.RM45" :name="item.初審人員")
          span(v-html="highlight(item.初審人員)")

      //- 登記原因
      template(#cell(登記原因)="{ item }")
        span(v-html="highlight(item.登記原因)")

      //- 請示歷時天數
      template(#cell(請示歷時天數)="{ item }")
        span.font-weight-bold(
          :class="{ 'text-danger': item._stagnant, 'text-dark': !item._stagnant }"
        )
          | {{ item.請示歷時天數 }} 天
          span.small.text-danger.ml-1(v-if="item._stagnant") (滯留)

      //- 請示日期
      template(#cell(請示日期)="{ item }")
        .text-nowrap {{ item.請示日期 }}
        .small.text-muted(v-if="item.請示時間") {{ item.請示時間 }}

      //- 取消請示
      template(#cell(取消請示日期)="{ item }")
        template(v-if="item.取消請示日期")
          .text-nowrap {{ item.取消請示日期 }}
          .small.text-muted(v-if="item.取消請示時間") {{ item.取消請示時間 }}
        template(v-else)
          span.text-info.small 尚未取消

      //- 預定結案日期
      template(#cell(預定結案日期)="{ item }")
        span.text-nowrap {{ item.預定結案日期 }}

      //- 結案日期
      template(#cell(結案日期)="{ item }")
        span.text-nowrap(v-if="item.結案日期") {{ item.結案日期 }}
        span.text-muted.small(v-else) 未結案

      //- 辦理情形
      template(#cell(辦理情形)="{ item }")
        span(v-html="highlight(item.辦理情形)")

      //- 操作
      template(#cell(操作)="{ item }")
        b-button(
          size="sm"
          variant="outline-primary"
          class="py-0 px-2"
          @click="openTimeline(item)"
          title="開啟時序軌跡與規避診斷分析"
        )
          lah-fa-icon.mr-1(icon="chart-line")
          | 診斷

  lah-transition: .center.h3.my-5: lah-fa-icon(
    v-cloak
    v-if="filteredData.length === 0 && !isBusy"
    icon="exclamation-circle"
    variant="success"
  ) 無符合條件之案件資料

  //- 案件時序軌跡與風險診斷彈窗 (Timeline & Risk Audit Modal)
  b-modal(
    ref="timelineModal"
    size="lg"
    hide-footer
    centered
    scrollable
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon.mr-2(icon="history" variant="primary")
        span 請示時序軌跡與規避風險診斷
        b-badge.ml-2(v-if="clickedData" variant="info") {{ clickedData.收件字號 }}

    div(v-if="clickedData")
      //- 案件基本小卡
      .card.bg-light.mb-3
        .card-body.p-3
          .row
            .col-md-3
              .text-muted.small 收件字號
              .font-weight-bold {{ clickedData.收件字號 }}
            .col-md-3
              .text-muted.small 登記原因
              .font-weight-bold {{ clickedData.登記原因 }}
            .col-md-3
              .text-muted.small 初審人員
              .font-weight-bold {{ clickedData.初審人員 }}
            .col-md-3
              .text-muted.small 辦理情形
              .font-weight-bold {{ clickedData.辦理情形 }}

      //- 視覺化時序軌跡 (Timeline)
      h6.font-weight-bold.text-primary.mb-2
        lah-fa-icon.mr-1(icon="stream")
        | 案件處理時序節點還原
      .timeline-container.border.rounded.p-3.mb-3.bg-white
        .timeline-step(
          v-for="(step, idx) in timelineData"
          :key="idx"
          :class="`timeline-${step.variant}`"
        )
          .timeline-node
            lah-fa-icon(:icon="step.icon" :variant="step.variant")
          .timeline-content
            .d-flex.justify-content-between.align-items-center
              strong(:class="`text-${step.variant}`") {{ step.title }}
              span.badge.badge-light {{ step.time }}
            .small.text-muted.mt-1 {{ step.desc }}

      //- 四大特徵診斷分析卡
      h6.font-weight-bold.text-danger.mb-2
        lah-fa-icon.mr-1(icon="shield-alt")
        | 規避逾期風險評估報告
      .row
        .col-md-6.mb-2
          .p-2.border.rounded(:class="clickedData._rush ? 'border-danger bg-light' : 'border-success'")
            .d-flex.justify-content-between
              strong 1. 壓線請示檢驗
              b-badge(:variant="clickedData._rush ? 'danger' : 'success'")
                | {{ clickedData._rush ? '⚠️ 疑似壓線' : '✅ 正常時限' }}
            .small.text-muted.mt-1
              | 距原限辦到期：#[strong {{ clickedData.請示前剩餘時數 !== null ? clickedData.請示前剩餘時數 + ' 小時' : '無紀錄' }}]
              span.text-danger.ml-1(v-if="clickedData._rush") （≤ {{ thresholds.rushHours }}h，疑因到期緊急掛請示）

        .col-md-6.mb-2
          .p-2.border.rounded(:class="clickedData._stagnant ? 'border-warning bg-light' : 'border-success'")
            .d-flex.justify-content-between
              strong 2. 請示滯留檢驗
              b-badge(:variant="clickedData._stagnant ? 'warning' : 'success'")
                | {{ clickedData._stagnant ? '⌛ 請示滯留' : '✅ 合理天數' }}
            .small.text-muted.mt-1
              | 請示凍結歷時：#[strong {{ clickedData.請示歷時天數 }} 天]
              span.text-warning.ml-1(v-if="clickedData._stagnant") （> {{ thresholds.stagnantDays }}天，長期待決疑無實質進展）

        .col-md-6.mb-2
          .p-2.border.rounded(:class="clickedData._speedyClose ? 'border-primary bg-light' : 'border-success'")
            .d-flex.justify-content-between
              strong 3. 極速結案檢驗
              b-badge(:variant="clickedData._speedyClose ? 'primary' : 'success'")
                | {{ clickedData._speedyClose ? '⚡ 極速結案' : '✅ 正常作業' }}
            .small.text-muted.mt-1
              | 取消至結案間隔：#[strong {{ clickedData.取消至結案時數 !== null ? clickedData.取消至結案時數 + ' 小時' : '未結案' }}]
              span.text-primary.ml-1(v-if="clickedData._speedyClose") （≤ {{ thresholds.speedyHours }}h，疑無複雜疑義純為掩護）

        .col-md-6.mb-2
          .p-2.border.rounded(:class="clickedData._overdue ? 'border-dark bg-light' : 'border-success'")
            .d-flex.justify-content-between
              strong 4. 逾期狀態檢驗
              b-badge(:variant="clickedData._overdue ? 'dark' : 'success'")
                | {{ clickedData._overdue ? '🚨 逾期違規' : '✅ 未逾期' }}
            .small.text-muted.mt-1
              | 預定結案：{{ clickedData.預定結案日期 }} | 結案：{{ clickedData.結案日期 || '未結案' }}
              span.text-danger.ml-1(v-if="clickedData._overdue") （已超過法定期限）

      .d-flex.justify-content-end.mt-3
        b-button(
          variant="outline-secondary"
          class="mr-2"
          @click="popupDetail(clickedData)"
        )
          lah-fa-icon.mr-1(icon="window-restore")
          | 查看地籍詳細案件資訊
        b-button(variant="primary" @click="$refs.timelineModal.hide()") 關閉

  //- 門檻與進階篩選視窗 (Search Plus Modal)
  b-modal(
    ref="searchPlus"
    size="md"
    hide-footer
    centered
  )
    template(#modal-title)
      lah-fa-icon.mr-2(icon="search-plus" variant="primary")
      | 進階篩選

    div
      h6.font-weight-bold.text-danger 規避判定門檻自訂（即時試算）
      b-form-group(label="壓線請示門檻（距限辦到期剩餘時數）:")
        .d-flex.align-items-center
          b-form-input(
            type="range"
            v-model.number="thresholds.rushHours"
            min="4"
            max="72"
            step="2"
            class="mr-2"
          )
          span.font-weight-bold(style="min-width: 60px;") {{ thresholds.rushHours }} 小時

      b-form-group(label="請示滯留門檻（請示歷時天數）:")
        .d-flex.align-items-center
          b-form-input(
            type="range"
            v-model.number="thresholds.stagnantDays"
            min="3"
            max="30"
            step="1"
            class="mr-2"
          )
          span.font-weight-bold(style="min-width: 60px;") {{ thresholds.stagnantDays }} 天

      b-form-group(label="極速結案門檻（取消請示後結案時數）:")
        .d-flex.align-items-center
          b-form-input(
            type="range"
            v-model.number="thresholds.speedyHours"
            min="4"
            max="72"
            step="2"
            class="mr-2"
          )
          span.font-weight-bold(style="min-width: 60px;") {{ thresholds.speedyHours }} 小時

      hr
      h6.font-weight-bold.text-primary 案件篩選條件
      b-form-group(label="初審承辦人:")
        b-form-select(v-model="selectedReviewer")
          b-form-select-option(value="") -- 全部人員 --
          b-form-select-option(
            v-for="rev in reviewerStats"
            :key="rev.name"
            :value="rev.name"
          ) {{ rev.name }} ({{ rev.total }}件 / {{ rev.suspicious }}疑似)

      b-form-group(label="登記原因:")
        b-form-select(v-model="filterReason")
          b-form-select-option(value="") -- 全部原因 --
          b-form-select-option(
            v-for="r in reasonOptions"
            :key="r"
            :value="r"
          ) {{ r }}

      .d-flex.justify-content-between.mt-4
        b-button(variant="outline-secondary" @click="resetThresholds") 重設為預設門檻
        b-button(variant="primary" @click="$refs.searchPlus.hide()") 完成並套用

  //- 地籍詳細資料彈窗 (Case Detail Modal)
  b-modal(
    ref="caseDetailModal"
    size="xl"
    hide-footer
    centered
    scrollable
  )
    template(#modal-title)
      | 登記案件詳情 {{ clickedData ? $utils.caseId(clickedData.ID) : '' }}
    lah-reg-case-detail(
      v-if="clickedData"
      :parent-data="clickedData"
      :case-id="clickedData.ID"
    )
</template>

<script>
export default {
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 60 * 60 * 1000,
    forceReload: false,
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    // 查詢欄位維度：receive_date (RM07_1) 或 ask_date (RM80)
    dateBy: 'receive_date',
    // 是否納管進行中請示案件
    includePending: true,
    // 篩選與戰情狀態
    statusFilter: 'ALL',
    selectedReviewer: '',
    filterReason: '',
    advKeyword: '',
    showReviewerPanel: false,
    // 門檻自訂參數
    thresholds: {
      rushHours: 24,
      stagnantDays: 7,
      speedyHours: 24
    },
    // 點選檢視案件
    clickedData: null,
    // 表格分頁
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    fields: [
      { key: '請示燈號', label: '狀態', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '收件字號', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '規避風險標籤', label: '規避風險診斷', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '請示狀態', label: '請示進度', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '初審人員', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '登記原因', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '請示歷時天數', label: '請示歷時', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '請示日期', label: '請示時間', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '取消請示日期', label: '取消請示', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '預定結案日期', label: '預定結案', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '結案日期', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '辦理情形', sortable: true, thClass: 'text-center', tdClass: 'text-center align-middle' },
      { key: '操作', label: '檢視', thClass: 'text-center', tdClass: 'text-center align-middle' }
    ]
  }),
  fetchOnServer: false,
  fetch () {
    if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
      this.$utils.warn('dateRange is not ready ... postpone $fetch')
      this.timeout(this.$fetch, 250)
    } else {
      this.getCache(this.cacheKey).then((json) => {
        if (this.forceReload === true || json === false) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_cancel_ask_case',
            reload: this.forceReload,
            begin: this.dateRange.begin,
            end: this.dateRange.end,
            by: this.dateBy,
            include_pending: this.includePending
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              this.$refs.countdown.setCountdown(remainMs)
            } else {
              this.$refs.countdown.setCountdown(this.cachedMs)
            }
            this.$refs.countdown.startCountdown()
          })
            .catch((err) => {
              this.alert(err.message)
              this.$utils.error(err)
            })
            .finally(() => {
              this.isBusy = false
              this.forceReload = false
            })
        } else {
          this.bakedData = json.baked || []
          this.resetCountdown()
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.notify(`查詢成功，找到 ${this.bakedData.length} 筆請示案件資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
        }
      })
    }
  },
  head: {
    title: '請示(取消)案件稽核-桃園市地政局'
  },
  computed: {
    dataReady () { return this.queryCount > 0 },
    queryCount () { return this.bakedData?.length || 0 },
    cacheKey () {
      return `reg_cancel_ask_case_${this.dateRange.begin}_${this.dateRange.end}_${this.dateBy}_${this.includePending ? '1' : '0'}`
    },
    // 動態根據門檻重新試算特徵屬性
    processedData () {
      if (!this.bakedData || this.bakedData.length === 0) { return [] }
      return this.bakedData.map((item) => {
        const isPending = item.請示狀態 === '進行中' || (!item.RM83 && item.RM80)
        const durationDays = typeof item.請示歷時天數 === 'number' ? item.請示歷時天數 : parseFloat(item.請示歷時天數 || 0)
        const hoursBeforeDue = item.請示前剩餘時數 !== null && item.請示前剩餘時數 !== undefined ? parseFloat(item.請示前剩餘時數) : null
        const hoursCancelToClose = item.取消至結案時數 !== null && item.取消至結案時數 !== undefined ? parseFloat(item.取消至結案時數) : null

        // 判定各特徵
        const isRush = hoursBeforeDue !== null && hoursBeforeDue >= 0 && hoursBeforeDue <= this.thresholds.rushHours
        const isStagnant = durationDays > this.thresholds.stagnantDays
        const isSpeedyClose = hoursCancelToClose !== null && hoursCancelToClose <= this.thresholds.speedyHours
        const isOverdue = Boolean(item.是否請示逾期 || (hoursBeforeDue !== null && hoursBeforeDue < 0) || item.請示燈號 === 'danger')

        const tags = []
        if (isRush) { tags.push('壓線請示') }
        if (isStagnant) { tags.push('請示滯留') }
        if (isSpeedyClose) { tags.push('極速結案') }
        if (isOverdue) { tags.push('請示仍逾期') }

        const isSuspicious = tags.length > 0

        return {
          ...item,
          _pending: isPending,
          _rush: isRush,
          _stagnant: isStagnant,
          _speedyClose: isSpeedyClose,
          _overdue: isOverdue,
          _isSuspicious: isSuspicious,
          _tags: tags
        }
      })
    },
    // KPI 統計總計
    kpiStats () {
      const stats = {
        total: this.processedData.length,
        suspicious: 0,
        pending: 0,
        rush: 0,
        stagnant: 0,
        speedyClose: 0,
        overdue: 0
      }
      this.processedData.forEach((item) => {
        if (item._isSuspicious) { stats.suspicious++ }
        if (item._pending) { stats.pending++ }
        if (item._rush) { stats.rush++ }
        if (item._stagnant) { stats.stagnant++ }
        if (item._speedyClose) { stats.speedyClose++ }
        if (item._overdue) { stats.overdue++ }
      })
      return stats
    },
    // 審查人員統計分析排行
    reviewerStats () {
      const statsMap = {}
      this.processedData.forEach((item) => {
        const name = item.初審人員 || item.RM45 || '未知'
        if (!statsMap[name]) {
          statsMap[name] = {
            name,
            total: 0,
            suspicious: 0,
            pending: 0
          }
        }
        statsMap[name].total++
        if (item._isSuspicious) { statsMap[name].suspicious++ }
        if (item._pending) { statsMap[name].pending++ }
      })
      const list = Object.values(statsMap).map(r => ({
        ...r,
        rate: r.total > 0 ? Math.round((r.suspicious / r.total) * 100) : 0
      }))
      list.sort((a, b) => b.suspicious - a.suspicious || b.total - a.total)
      return list
    },
    reasonOptions () {
      const reasons = new Set()
      this.processedData.forEach((item) => {
        if (item.登記原因) { reasons.add(item.登記原因) }
      })
      return Array.from(reasons)
    },
    // 依篩選條件過濾後的資料
    filteredData () {
      let list = this.processedData

      // 1. 戰情卡片篩選
      if (this.statusFilter === 'SUSPICIOUS') {
        list = list.filter(item => item._isSuspicious)
      } else if (this.statusFilter === 'PENDING') {
        list = list.filter(item => item._pending)
      } else if (this.statusFilter === 'RUSH') {
        list = list.filter(item => item._rush)
      } else if (this.statusFilter === 'STAGNANT') {
        list = list.filter(item => item._stagnant)
      } else if (this.statusFilter === 'SPEEDY_CLOSE') {
        list = list.filter(item => item._speedyClose)
      } else if (this.statusFilter === 'OVERDUE') {
        list = list.filter(item => item._overdue)
      }

      // 2. 審查人員篩選
      if (this.selectedReviewer) {
        list = list.filter(item => item.初審人員 === this.selectedReviewer)
      }

      // 3. 登記原因篩選
      if (this.filterReason) {
        list = list.filter(item => item.登記原因 === this.filterReason)
      }

      // 4. 關鍵字快篩
      if (this.advKeyword && this.advKeyword.trim()) {
        const kw = this.advKeyword.trim().toLowerCase()
        list = list.filter((item) => {
          return (item.收件字號 && item.收件字號.toLowerCase().includes(kw)) ||
                 (item.初審人員 && item.初審人員.toLowerCase().includes(kw)) ||
                 (item.登記原因 && item.登記原因.toLowerCase().includes(kw)) ||
                 (item.辦理情形 && item.辦理情形.toLowerCase().includes(kw))
        })
      }

      return list
    },
    pagedData () {
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage
      const end = start + this.pagination.perPage
      return this.filteredData.slice(start, end)
    },
    statusFilterText () {
      switch (this.statusFilter) {
        case 'SUSPICIOUS': return '疑似規避案件'
        case 'PENDING': return '目前請示中'
        case 'RUSH': return '壓線請示'
        case 'STAGNANT': return '請示滯留'
        case 'SPEEDY_CLOSE': return '極速結案'
        case 'OVERDUE': return '請示仍逾期'
        default: return '全部案件'
      }
    },
    statusFilterBadgeVariant () {
      switch (this.statusFilter) {
        case 'SUSPICIOUS': return 'danger'
        case 'PENDING': return 'info'
        case 'RUSH': return 'danger'
        case 'STAGNANT': return 'warning'
        case 'SPEEDY_CLOSE': return 'primary'
        case 'OVERDUE': return 'dark'
        default: return 'secondary'
      }
    },
    // 視覺化時間軸資料
    timelineData () {
      if (!this.clickedData) { return [] }
      const d = this.clickedData
      return [
        {
          title: '收件受理',
          time: d.收件時間 || d.收件日期 || '—',
          desc: `案號：${d.收件字號}，原因：${d.登記原因}，初審人員：${d.初審人員}`,
          icon: 'inbox',
          variant: 'secondary'
        },
        {
          title: '原預定結案期限',
          time: d.預定結案日期 || '—',
          desc: '原定限辦管考期限時效',
          icon: 'calendar-check',
          variant: 'info'
        },
        {
          title: '提出請示 (RM80)',
          time: `${d.請示日期 || ''} ${d.請示時間 || ''}`.trim() || '—',
          desc: d.請示前剩餘時數 !== null
            ? `距原限辦剩餘 ${d.請示前剩餘時數} 小時 ${d._rush ? '（⚠️ 壓線請示）' : ''}`
            : '提出法令研議請示',
          icon: 'question-circle',
          variant: d._rush ? 'danger' : 'warning'
        },
        {
          title: d._pending ? '請示進行中' : '取消請示 (RM83)',
          time: d._pending ? '尚未取消' : `${d.取消請示日期 || ''} ${d.取消請示時間 || ''}`.trim(),
          desc: `請示凍結歷時 ${d.請示歷時天數} 天 ${d._stagnant ? '（⌛ 請示滯留）' : ''}`,
          icon: d._pending ? 'hourglass-half' : 'check-circle',
          variant: d._stagnant ? 'warning' : 'primary'
        },
        {
          title: d.結案與否 === 'Y' ? '案件結案 (RM58_1)' : '尚未結案',
          time: d.結案日期 || '未結案',
          desc: d.結案與否 === 'Y'
            ? (d.取消至結案時數 !== null ? `取消後 ${d.取消至結案時數} 小時即結案 ${d._speedyClose ? '（⚡ 極速結案）' : ''}` : '已辦畢結案')
            : '案件目前處理中',
          icon: d.結案與否 === 'Y' ? 'flag-checkered' : 'clock',
          variant: d._overdue ? 'danger' : (d.結案與否 === 'Y' ? 'success' : 'secondary')
        }
      ]
    },
    // 匯出 Excel 資料格式
    xlsxData () {
      return this.filteredData.map((item, idx) => ({
        序號: idx + 1,
        狀態燈號: item.請示燈號 === 'danger' ? '逾期' : (item.請示燈號 === 'warning' ? '警戒' : (item.請示燈號 === 'info' ? '進行中' : '正常')),
        收件字號: item.收件字號,
        收件日期: item.收件日期,
        登記原因: item.登記原因,
        辦理情形: item.辦理情形,
        初審人員: item.初審人員,
        請示狀態: item.請示狀態,
        '請示歷時(天)': item.請示歷時天數,
        '距限辦剩餘(小時)': item.請示前剩餘時數 !== null ? item.請示前剩餘時數 : '',
        '取消至結案(小時)': item.取消至結案時數 !== null ? item.取消至結案時數 : '',
        請示日期: item.請示日期,
        請示時間: item.請示時間,
        取消請示日期: item.取消請示日期,
        取消請示時間: item.取消請示時間,
        預定結案日期: item.預定結案日期,
        結案日期: item.結案日期,
        疑似規避: item._isSuspicious ? '是' : '否',
        規避風險標籤: (item._tags || []).join(', ')
      }))
    }
  },
  watch: {
    advKeyword () {
      this.pagination.currentPage = 1
    },
    statusFilter () {
      this.pagination.currentPage = 1
    },
    selectedReviewer () {
      this.pagination.currentPage = 1
    },
    filterReason () {
      this.pagination.currentPage = 1
    }
  },
  methods: {
    changeDateBy (by) {
      if (this.dateBy !== by) {
        this.dateBy = by
        this.reload()
      }
    },
    toggleStatusFilter (status) {
      this.statusFilter = this.statusFilter === status ? 'ALL' : status
      this.pagination.currentPage = 1
    },
    toggleReviewer (reviewer) {
      this.selectedReviewer = this.selectedReviewer === reviewer ? '' : reviewer
      this.pagination.currentPage = 1
    },
    resetAllFilters () {
      this.statusFilter = 'ALL'
      this.selectedReviewer = ''
      this.filterReason = ''
      this.advKeyword = ''
      this.pagination.currentPage = 1
    },
    resetThresholds () {
      this.thresholds = {
        rushHours: 24,
        stagnantDays: 7,
        speedyHours: 24
      }
    },
    openTimeline (item) {
      this.clickedData = item
      this.$refs.timelineModal.show()
    },
    popupDetail (item) {
      this.clickedData = item
      this.$refs.caseDetailModal.show()
    },
    getTagVariant (tag) {
      if (tag.includes('壓線')) { return 'danger' }
      if (tag.includes('滯留')) { return 'warning' }
      if (tag.includes('極速')) { return 'primary' }
      if (tag.includes('逾期')) { return 'dark' }
      return 'secondary'
    },
    getLightTitle (item) {
      if (item.請示燈號 === 'danger') { return '已逾期案件' }
      if (item.請示燈號 === 'warning') { return '警戒案件（距到期近或滯留過長）' }
      if (item.請示燈號 === 'info') { return '進行中請示案件' }
      return '正常合規案件'
    },
    highlight (text) {
      if (!text) { return '' }
      if (this.advKeyword && this.advKeyword.trim().length > 0) {
        return this.$utils.highlight(text, this.advKeyword.trim(), 'highlight-yellow')
      }
      return text
    },
    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then((remainMs) => {
          if (remainMs > 0) {
            this.$refs.countdown.setCountdown(remainMs)
            this.$refs.countdown.startCountdown()
          }
        })
      }
    },
    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.kpi-card {
  transition: all 0.25s ease-in-out;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12) !important;
  }
}

.active-card-danger {
  background-color: #f8d7da !important;
  border-width: 2px !important;
}

.active-card-warning {
  background-color: #fff3cd !important;
  border-width: 2px !important;
}

.active-card-info {
  background-color: #d1ecf1 !important;
  border-width: 2px !important;
}

.active-card-primary {
  background-color: #cce5ff !important;
  border-width: 2px !important;
}

.active-card-dark {
  background-color: #e2e3e5 !important;
  border-width: 2px !important;
}

.reviewer-card {
  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
}

// 時序軌跡 Timeline 樣式
.timeline-container {
  display: flex;
  flex-direction: column;
  position: relative;
  padding-left: 20px;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    bottom: 15px;
    left: 28px;
    width: 2px;
    background: #dee2e6;
  }
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  position: relative;
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-node {
  width: 20px;
  height: 20px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  margin-right: 15px;
}

.timeline-content {
  flex-grow: 1;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
</style>
