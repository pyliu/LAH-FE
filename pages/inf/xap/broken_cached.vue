<template lang="pug">
.dark-container.h-100(v-cloak, :class="{ 'dark-mode': isDarkMode, 'header-compact': compactHeader }")
  //- 頂部標題與控制列 (符合 48px 高度規範)
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.w-100.header-row
      .d-flex.align-items-center.header-left-group
        .my-auto.d-flex.align-items-center.header-title-wrap
          lah-fa-icon.header-title-icon(
            icon="heart-pulse",
            :variant="red.length > 0 ? 'danger' : 'success'",
            action="breath"
          )
            span.font-weight-bold.header-title-text 全國地所跨域主機監控
          b-badge.ml-2.s-90(
            v-if="officesData.length > 0",
            :variant="red.length > 0 ? 'danger' : 'success'",
            pill
          ) {{ red.length > 0 ? `異常 ${red.length}` : '全數正常' }}
        lah-button.ml-1(
          v-b-modal.help-modal,
          icon="info",
          variant="outline-success",
          size="lg",
          no-border,
          no-icon-gutter,
          title="監控說明與診斷指南"
        )

      .d-flex.align-items-center.flex-nowrap.text-nowrap.header-right-group
        //- 三大檢視模式切換
        b-button-group.mr-2(size="lg")
          lah-button.hide-label-sm(
            icon="th-large",
            :variant="viewMode === 'tile' ? 'primary' : 'outline-primary'",
            title="戰情方塊視圖：直覺卡片呈現各地所即時燈號與實測延遲",
            @click="viewMode = 'tile'"
          )
            span.btn-label 戰情方塊
          lah-button.hide-label-sm(
            icon="layer-group",
            :variant="viewMode === 'county' ? 'primary' : 'outline-primary'",
            title="縣市矩陣視圖：依北中南東與 22 縣市分組檢視區域連線健康度",
            @click="viewMode = 'county'"
          )
            span.btn-label 縣市矩陣
          lah-button.hide-label-sm(
            icon="table",
            :variant="viewMode === 'table' ? 'primary' : 'outline-primary'",
            title="診斷清單視圖：高密度表格結合 24h 斷線熱點統計與排序",
            @click="viewMode = 'table'"
          )
            span.btn-label 診斷清單

        //- 戰情工具與操作群組
        b-button-group(size="lg")
          lah-button.mr-1.hide-label-sm(
            icon="bolt",
            :variant="red.length > 0 ? 'danger' : 'outline-info'",
            size="lg",
            :busy="isBatchProbing",
            :disabled="isBatchProbing || officesData.length === 0",
            :title="red.length > 0 ? `立即針對目前 ${red.length} 所異常地所發送即時 HTTP 實測` : '立即針對桃園市 8 所發送即時 HTTP 實測'",
            @click="red.length > 0 ? batchProbeDownOffices() : batchProbeTaoyuan()"
          )
            span.btn-label {{ red.length > 0 ? `實測異常 (${red.length})` : '實測本市' }}

          lah-button.mr-1.hide-label-sm(
            icon="link-slash",
            variant="outline-danger",
            size="lg",
            title="檢視全國離線伺服器歷史紀錄時間軸",
            :badge-text="recentDownRecords.length > 0 ? String(recentDownRecords.length) : ''",
            badge-variant="danger",
            @click="showOfflineRecords"
          )
            span.btn-label 離線紀錄

          lah-button-xlsx.mr-1(
            :jsons="xlsxData",
            header="全國地所跨域主機連線狀態清單",
            size="lg"
          )

          lah-button.mr-1(
            to="/inf/xap/xbroken_display",
            icon="tv",
            variant="outline-primary",
            size="lg",
            no-icon-gutter,
            title="開啟民眾端跨縣市公播看板"
          )

          lah-button.mr-1(
            :icon="isDarkMode ? 'sun' : 'moon'",
            :variant="isDarkMode ? 'outline-warning' : 'outline-secondary'",
            size="lg",
            no-icon-gutter,
            :title="isDarkMode ? '切換為淺色模式' : '切換為深色戰情室模式'",
            @click="toggleTheme"
          )

          lah-countdown-button(
            ref="countdown",
            icon="sync-alt",
            action="ld-cycle",
            size="lg",
            title="立即重新讀取快取資料（預設每 5 分鐘自動同步）",
            variant="outline-secondary",
            badge-variant="secondary",
            auto-start,
            :milliseconds="reloadMs",
            :disabled="isBusy",
            :busy="isBusy",
            @end="load(false)",
            @click="load(true)"
          )

  //- 說明視窗
  lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="全國地所跨域主機監控 — 戰情診斷指南", scrollable)
    h6.font-weight-bold.text-primary
      lah-fa-icon.mr-1(icon="compass")
      span 三大戰情檢視模式
    ul.mb-3
      li.mb-1 #[b 🔲 戰情方塊]：卡片式呈現全國各地所連線狀態、所屬縣市、24 小時內斷線次數警示與即時實測延遲（#[code ms]）；游標移至方塊右上角可一鍵 #[b ⚡ 實測] 該所最新狀態。
      li.mb-1 #[b 🗺️ 縣市矩陣]：依 #[b 北部、中部、南部、東部及離島] 四大區域與 22 縣市分組摺疊，異常縣市自動置頂高亮，並支援點擊縣市標題右側 #[b ⚡ 實測全縣市] 一次檢測該縣市所有地所。
      li.mb-1 #[b 📋 診斷清單]：高密度資料表，整合 #[b 24h 斷線次數排行]、#[b HTTP 回應標頭]、#[b 實測耗時] 與 #[b XLSX 報表匯出]，適合資訊與研考人員盤點連線品質。

    h6.font-weight-bold.text-success
      lah-fa-icon.mr-1(icon="bolt")
      span 突破快取時間差：單所與批次「即時 HTTP 實測」
    ul.mb-3
      li.mb-1 後端排程預設每 5～15 分鐘更新一次全國快取（#[code stats_xap_stats_cached]）。當櫃台或審查同仁遇到特定地所顯示紅燈、或想確認某地所「現在這一秒」是否已恢復連線時，無需苦等排程更新！
      li.mb-1 點擊任一地所方塊右上角的 #[b ⚡ 實測]、頂部工具列的 #[b ⚡ 實測異常 / 實測本市]，或於地所診斷視窗內點擊實測，系統會立即向該所跨域 AP（#[code /Land&lt;代碼&gt;/]）發送即時探測並回報真實回應時間（#[code ms]）。

    h6.font-weight-bold.text-info
      lah-fa-icon.mr-1(icon="chart-pie")
      span 頂部互動式診斷指標與快捷鍵
    ul.mb-3
      li.mb-1 點擊頂部 6 張指標卡可快速過濾：#[b 全國總覽]、#[b 服務正常 (UP)]、#[b 連線異常 (DOWN)]、#[b 桃園市 8 所 (HA~HH)]、#[b 24h 曾斷線熱點]。
      li.mb-1 鍵盤快捷鍵：於頁面任意處按 #[code /] 鍵可立即聚焦搜尋框（支援搜尋地所名稱、代碼、縣市或 HTTP 狀態碼），按 #[code Esc] 鍵一鍵清空搜尋。

    hr
    .d-flex.flex-wrap.justify-content-around.small.font-weight-bold
      span 🟢 綠燈（UP）：跨域 AP 回應正常（HTTP 401 認證就緒）
      span 🟡 黃燈（PROBING）：即時連線檢測中或快取逾時
      span 🔴 紅燈（DOWN）：主機無回應、502 Proxy Error 或連線異常

  //- 主內容區 (可捲動容器)
  .monitor-body.px-3.pb-3
    //- =========================================================
    //- 1. 頂部互動式戰情指標卡 (Interactive KPI Cards)
    //- =========================================================
    section.kpi-dashboard.pt-2.mb-2
      .row.no-gutters.mx-n1
        //- (1) 全國連線可用率
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'kpi-active kpi-primary': quickFilter === '' }",
            title="點擊顯示全國所有地政事務所",
            @click="setQuickFilter('')"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.text-muted.small.font-weight-bold 全國跨域可用率
              lah-fa-icon.text-primary.flex-shrink-0(icon="globe-asia", size="lg")
            .kpi-value-row.mt-1
              span.h4.font-weight-bold.mb-0.text-nowrap(:class="availabilityTextClass") {{ availabilityRate }}%
              span.small.text-muted.ml-1.text-nowrap ({{ officesData.length }} 所)
              span.small.ml-auto.badge.badge-light.text-nowrap 顯示 {{ filteredOffices.length }} 所

        //- (2) 服務正常 (UP)
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'kpi-active kpi-success': quickFilter === 'up' }",
            title="點擊僅顯示連線正常 (UP) 之地所",
            @click="setQuickFilter('up')"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.text-muted.small.font-weight-bold 服務正常 (UP)
              lah-fa-icon.text-success.flex-shrink-0(icon="circle-check", size="lg")
            .kpi-value-row.mt-1
              span.h4.font-weight-bold.mb-0.text-success.text-nowrap {{ green.length }}
              span.small.text-muted.ml-1.text-nowrap 所
              span.small.ml-auto.text-muted.text-nowrap {{ healthyCountyCount }}/{{ totalCountyCount }} 縣市全正常

        //- (3) 連線異常 (DOWN)
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'kpi-active kpi-danger': quickFilter === 'down', 'border-danger bg-danger-subtle': red.length > 0 }",
            title="點擊僅顯示目前連線異常 (DOWN) 之地所",
            @click="setQuickFilter('down')"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.small.font-weight-bold(:class="red.length > 0 ? 'text-danger' : 'text-muted'") 目前連線異常
              lah-fa-icon.flex-shrink-0(
                :icon="red.length > 0 ? 'circle-xmark' : 'shield-alt'",
                :variant="red.length > 0 ? 'danger' : 'success'",
                :action="red.length > 0 ? 'breath' : ''",
                size="lg"
              )
            .kpi-value-row.mt-1
              span.h4.font-weight-bold.mb-0.text-nowrap(:class="red.length > 0 ? 'text-danger' : 'text-success'") {{ red.length }}
              span.small.text-muted.ml-1.text-nowrap 所
              b-badge.ml-auto.pointer.text-nowrap.flex-shrink-0(
                v-if="red.length > 0",
                variant="danger",
                pill,
                title="立即發送即時 HTTP 請求重測所有異常地所",
                @click.stop="batchProbeDownOffices"
              ) ⚡ 實測異常
              span.small.ml-auto.text-success.font-weight-bold.text-nowrap(v-else) 全國順暢

        //- (4) 桃園市所屬地所 (HA ~ HH)
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'kpi-active kpi-info': quickFilter === 'taoyuan', 'border-danger': taoyuanDownCount > 0 }",
            title="點擊篩選桃園市所屬 8 所 (HA~HH)",
            @click="setQuickFilter('taoyuan')"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.small.font-weight-bold(:class="taoyuanDownCount > 0 ? 'text-danger' : 'text-info'") 桃園市所屬地所
              lah-fa-icon.flex-shrink-0(
                icon="map-marker-alt",
                :variant="taoyuanDownCount > 0 ? 'danger' : 'info'",
                size="lg"
              )
            .kpi-value-row.mt-1
              span.h4.font-weight-bold.mb-0.text-nowrap(:class="taoyuanDownCount > 0 ? 'text-danger' : 'text-info'") {{ taoyuanUpCount }}/{{ taoyuanOffices.length }}
              span.small.text-muted.ml-1.text-nowrap 正常
              b-badge.ml-auto.pointer.text-nowrap.flex-shrink-0(
                variant="info",
                pill,
                title="立即實測桃園市 8 所最新連線延遲",
                @click.stop="batchProbeTaoyuan"
              ) ⚡ 實測本市

        //- (5) 24h 斷線熱點雷達
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'kpi-active kpi-warning': quickFilter === 'flaky' }",
            title="點擊篩選過去 24 小時內曾發生斷線紀錄之不穩定地所",
            @click="setQuickFilter('flaky')"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.text-muted.small.font-weight-bold 24h 曾斷線地所
              lah-fa-icon.flex-shrink-0(
                icon="bolt",
                :variant="flakyOfficeIds.length > 0 ? 'warning' : 'secondary'",
                size="lg"
              )
            .kpi-value-row.mt-1
              span.h4.font-weight-bold.mb-0.text-nowrap(:class="flakyOfficeIds.length > 0 ? 'text-warning-dark' : 'text-secondary'") {{ flakyOfficeIds.length }}
              span.small.text-muted.ml-1.text-nowrap 所
              span.small.ml-auto.text-truncate.text-warning-dark.font-weight-bold(
                v-if="topFlakyOffice",
                style="max-width: 95px;",
                :title="`24h 最常斷線：${topFlakyOffice.id} ${topFlakyOffice.name} (${topFlakyOffice.count} 次)`"
              ) Top: {{ formatShortName(topFlakyOffice.name) }}({{ topFlakyOffice.count }})
              span.small.ml-auto.text-muted.text-nowrap(v-else) 24h 零斷線

        //- (6) 快取鮮度與強制同步
        .col-6.col-md-4.col-xl-2.px-1.mb-2
          .kpi-card.p-2.rounded.shadow-sm(
            :class="{ 'border-warning': isCacheStale }",
            title="點擊強制要求後端排程重新刷新快取",
            @click="forceBackendRefresh"
          )
            .d-flex.justify-content-between.align-items-center
              .kpi-label.text-muted.small.font-weight-bold 快取檢測時間
              lah-fa-icon.flex-shrink-0(
                icon="clock",
                :variant="isCacheStale ? 'warning' : 'secondary'",
                size="lg"
              )
            .kpi-value-row.mt-1
              span.h5.font-weight-bold.mb-0.text-monospace.text-nowrap {{ latestSnapshotTimeStr || '--:--:--' }}
              span.small.ml-auto.text-nowrap(:class="isCacheStale ? 'text-warning-dark font-weight-bold' : 'text-muted'")
                template(v-if="liveProbedCount > 0") ⚡ 已實測 {{ liveProbedCount }} 所
                template(v-else) {{ latestSnapshotRelative || '讀取中' }}

    //- =========================================================
    //- 2. 智慧搜尋與複合篩選工具列 (Smart Filter Bar)
    //- =========================================================
    section.filter-toolbar.p-2.mb-3.rounded.shadow-sm.border
      .d-flex.flex-wrap.align-items-center.justify-content-between
        //- 左側：關鍵字搜尋 + 區域快篩 + 縣市下拉 + 排序
        .d-flex.flex-wrap.align-items-center.flex-grow-1.mr-2
          //- 關鍵字搜尋框
          b-input-group.mr-2.mb-1.mb-md-0(size="sm", style="width: 250px;")
            template(#prepend)
              b-input-group-text
                lah-fa-icon(icon="search", variant="secondary")
            b-form-input(
              ref="searchInput",
              v-model.trim="keyword",
              placeholder="搜尋地所、代碼、縣市或回應 (按 /)",
              @keydown.esc="clearKeyword"
            )
            template(#append, v-if="keyword")
              b-button(variant="outline-secondary", title="清空關鍵字 (Esc)", @click="clearKeyword")
                lah-fa-icon(icon="times")

          //- 四大區域快篩按鈕群組
          b-button-group.mr-2.mb-1.mb-md-0(size="sm")
            b-button(
              v-for="reg in regionOptions",
              :key="reg.value",
              :variant="regionFilter === reg.value ? 'primary' : 'outline-secondary'",
              @click="regionFilter = reg.value"
            ) {{ reg.text }}

          //- 縣市下拉選單
          b-input-group.mr-2.mb-1.mb-md-0(size="sm", prepend="縣市", style="width: 195px;")
            b-form-select(v-model="countyFilter", :options="countySelectOptions")

          //- 排序方式下拉選單
          b-input-group.mr-2.mb-1.mb-md-0(size="sm", prepend="排序", style="width: 215px;")
            b-form-select(v-model="sortBy", :options="sortOptions")

        //- 右側：顯示切換與清除篩選
        .d-flex.align-items-center.flex-nowrap
          b-form-checkbox.mr-3(
            v-model="displayShortName",
            switch,
            size="sm"
          )
            span.small.font-weight-bold 顯示別名
          b-form-checkbox.mr-2(
            v-model="displayDanger",
            switch,
            size="sm"
          )
            span.small.font-weight-bold(:class="displayDanger ? 'text-danger' : ''") 僅列異常
          b-button(
            v-if="hasActiveFilters",
            size="sm",
            variant="outline-danger",
            title="重置所有篩選與搜尋條件",
            @click="resetAllFilters"
          )
            lah-fa-icon.mr-1(icon="filter-circle-xmark")
            span 清除篩選

    //- =========================================================
    //- 3. 全國正常 / 空結果提示橫幅
    //- =========================================================
    lah-transition
      .alert-all-green.p-4.mb-3.rounded.text-center.shadow-sm(
        v-if="officesData.length > 0 && filteredOffices.length === 0 && quickFilter === 'down' && red.length === 0 && !keyword && !countyFilter && !regionFilter"
      )
        lah-fa-icon.mr-2(icon="circle-check", variant="success", size="2x")
        span.h4.font-weight-bold.text-success.align-middle 目前全國 {{ officesData.length }} 所地政事務所皆可正常連線提供服務！
        .mt-2.small.text-muted
          span 如需檢視所有正常地所，請點選上方「全國跨域可用率」或關閉「僅列異常」開關。
          b-button.ml-2(size="sm", variant="outline-success", @click="setQuickFilter('')") 顯示全部 {{ officesData.length }} 所

      .p-5.mb-3.rounded.text-center.border.bg-white(
        v-else-if="officesData.length > 0 && filteredOffices.length === 0"
      )
        lah-fa-icon.mb-2(icon="search", variant="secondary", size="2x")
        .h5.font-weight-bold.text-muted 找不到符合目前篩選條件的地政事務所
        .small.text-muted.mb-3 請嘗試調整關鍵字、區域或狀態篩選條件。
        b-button(size="sm", variant="outline-primary", @click="resetAllFilters") 重置所有篩選條件

    //- 初次載入中提示
    .text-center.py-5(v-if="isBusy && officesData.length === 0")
      lah-fa-icon(icon="spinner", variant="primary", size="3x", action="spin")
      .h5.mt-3.font-weight-bold.text-primary 正在載入全國各地政事務所跨域連線狀態...

    //- =========================================================
    //- 視圖一：戰情方塊視圖 (Grid Tile View)
    //- =========================================================
    transition-group.dashboard-grid(
      v-if="viewMode === 'tile' && filteredOffices.length > 0",
      name="list",
      tag="div"
    )
      .modern-tile(
        v-for="data in filteredOffices",
        :key="data.id",
        :class="tileBorderCss(data)",
        @click="show(data)"
      )
        //- 頂部微資訊列：縣市標籤 + 24h斷線次數 + 代碼 + 懸浮實測鈕
        .tile-top-bar.d-flex.justify-content-between.align-items-center.w-100.mb-1
          .d-flex.align-items-center
            span.county-pill(:class="data.id.startsWith('H') ? 'county-taoyuan' : ''") {{ getCountyShortName(data.id) }}
            b-badge.ml-1.flaky-badge(
              v-if="getDown24hCount(data.id) > 0",
              variant="warning",
              pill,
              :title="`過去 24 小時內曾斷線 ${getDown24hCount(data.id)} 次`"
            ) ⚡{{ getDown24hCount(data.id) }}
          .d-flex.align-items-center
            span.site-code-text.mr-1 {{ data.id }}
            b-button.tile-probe-btn.p-0(
              size="sm",
              variant="link",
              :title="`立即對 ${data.id} ${data.name} 發送即時 HTTP 實測`",
              :disabled="isProbing(data.id)",
              @click.stop="probeSingleOffice(data)"
            )
              lah-fa-icon(
                :icon="isProbing(data.id) ? 'spinner' : 'bolt'",
                :action="isProbing(data.id) ? 'spin' : ''",
                :variant="data.state !== 'UP' ? 'danger' : 'info'"
              )

        //- 中央主體：狀態燈號 + 地所名稱
        .d-flex.align-items-center.justify-content-center.my-1.w-100
          lah-fa-icon.mr-1(
            v-if="isProbing(data.id)",
            icon="spinner",
            variant="warning",
            action="spin"
          )
          lah-fa-icon.mr-1(
            v-else-if="data.state === 'UP'",
            icon="circle-check",
            variant="success"
          )
          lah-fa-icon.mr-1(
            v-else-if="data.state === 'DOWN'",
            icon="circle-xmark",
            variant="danger",
            action="breath"
          )
          lah-fa-icon.mr-1(
            v-else,
            icon="triangle-exclamation",
            variant="warning"
          )
          span.office-title.font-weight-bold.text-nowrap {{ formatName(data.name) }}

        //- 底部狀態列：錯誤訊息 或 即時實測延遲 / 更新時間
        .w-100.mt-auto
          .error-msg.text-truncate(
            v-if="data.state !== 'UP'",
            :title="data.response || '無回應 / 連線異常'"
          ) {{ data.response || '無回應 / 連線異常' }}
          .live-probe-tag(
            v-else-if="liveProbeMap[data.id]"
          )
            span.text-info.font-weight-bold ⚡ 實測 {{ liveProbeMap[data.id].latency }}ms
            span.text-muted.ml-1 ({{ liveProbeMap[data.id].time }})
          .tile-time-hint(v-else)
            span {{ formatShortTime(data.timestamp) }}

    //- =========================================================
    //- 視圖二：縣市矩陣視圖 (County / Region Matrix View)
    //- =========================================================
    div(v-else-if="viewMode === 'county' && filteredOffices.length > 0")
      .d-flex.justify-content-between.align-items-center.mb-2
        .small.text-muted
          lah-fa-icon.mr-1(icon="layer-group", variant="primary")
          span 依縣市歸納共 #[strong {{ countyGroups.length }}] 個縣市轄區（異常縣市與桃園市自動置頂）
        b-button-group(size="sm")
          b-button(variant="outline-secondary", @click="toggleAllCounties(true)")
            lah-fa-icon.mr-1(icon="expand-arrows-alt")
            span 全展開
          b-button(variant="outline-secondary", @click="toggleAllCounties(false)")
            lah-fa-icon.mr-1(icon="compress-arrows-alt")
            span 全收合

      .county-masonry-row
        transition-group.county-masonry-col(
          v-for="(col, colIdx) in countyMatrixColumns",
          :key="colIdx",
          name="county-flip",
          tag="div"
        )
          b-card.county-group-card.mb-3.shadow-sm(
            v-for="group in col",
            :key="group.countyCode",
            no-body,
            :class="{ 'border-danger': group.downCount > 0, 'border-info': group.countyCode === 'H' && group.downCount === 0 }"
          )
            b-card-header.county-header.py-2.px-3.pointer(
              :class="{ 'bg-danger-subtle': group.downCount > 0 }",
              @click="toggleCountyCollapse(group.countyCode)"
            )
              .d-flex.justify-content-between.align-items-center.flex-nowrap
                .d-flex.align-items-center.text-truncate.mr-1
                  lah-fa-icon.mr-1(
                    :icon="isCountyCollapsed(group.countyCode) ? 'chevron-right' : 'chevron-down'",
                    variant="secondary"
                  )
                  b-badge.mr-1(
                    :variant="group.countyCode === 'H' ? 'info' : 'secondary'"
                  ) {{ group.regionName }}
                  h6.mb-0.font-weight-bold.text-truncate.mr-1 {{ group.countyName }} ({{ group.countyCode }})
                  b-badge(
                    :variant="group.downCount > 0 ? 'danger' : 'success'",
                    pill
                  ) {{ group.downCount > 0 ? `異常 ${group.downCount}` : `${group.offices.length}所正常` }}
                  b-badge.ml-1.d-none.d-xl-inline-block(
                    v-if="group.flakyTotal > 0",
                    variant="warning",
                    pill
                  ) 24h:{{ group.flakyTotal }}

                .d-flex.align-items-center.flex-shrink-0(@click.stop)
                  b-button(
                    size="sm",
                    :variant="group.downCount > 0 ? 'danger' : 'outline-info'",
                    class="py-0 px-2 s-80",
                    :disabled="isBatchProbing",
                    :title="`立即針對 ${group.countyName} 所屬 ${group.offices.length} 所發送即時 HTTP 實測`",
                    @click="probeCountyOffices(group)"
                  )
                    lah-fa-icon.mr-1(icon="bolt")
                    span 實測

            b-collapse(:visible="!isCountyCollapsed(group.countyCode)")
              b-card-body.p-2
                .county-office-grid
                  .county-office-cell(
                    v-for="office in group.offices",
                    :key="office.id",
                    :class="cellStatusClass(office)",
                    @click="show(office)"
                  )
                    .d-flex.justify-content-between.align-items-center
                      .d-flex.align-items-center.min-w-0
                        lah-fa-icon.mr-1(
                          v-if="isProbing(office.id)",
                          icon="spinner",
                          variant="warning",
                          action="spin"
                        )
                        lah-fa-icon.mr-1(
                          v-else-if="office.state === 'UP'",
                          icon="circle-check",
                          variant="success"
                        )
                        lah-fa-icon.mr-1(
                          v-else,
                          icon="circle-xmark",
                          variant="danger",
                          action="breath"
                        )
                        span.font-weight-bold.text-truncate.s-90 {{ formatName(office.name) }}
                      .d-flex.align-items-center.ml-1
                        span.site-code-text.s-80.mr-1 {{ office.id }}
                        b-button.p-0.tile-probe-btn(
                          size="sm",
                          variant="link",
                          title="立即實測此所",
                          :disabled="isProbing(office.id)",
                          @click.stop="probeSingleOffice(office)"
                        )
                          lah-fa-icon(icon="bolt", :variant="office.state !== 'UP' ? 'danger' : 'info'")

                    .d-flex.justify-content-between.align-items-center.mt-1
                      span.text-danger.text-truncate.s-75(
                        v-if="office.state !== 'UP'",
                        :title="office.response"
                      ) {{ office.response || '連線異常' }}
                      span.text-info.font-weight-bold.s-75(
                        v-else-if="liveProbeMap[office.id]"
                      ) ⚡ {{ liveProbeMap[office.id].latency }}ms
                      span.text-muted.s-75(v-else) {{ formatShortTime(office.timestamp) }}

                      b-badge.s-70(
                        v-if="getDown24hCount(office.id) > 0",
                        variant="warning",
                        pill,
                        :title="`24h 內曾斷線 ${getDown24hCount(office.id)} 次`"
                      ) 24h:{{ getDown24hCount(office.id) }}

    //- =========================================================
    //- 視圖三：高密度診斷清單視圖 (Diagnostic Table View)
    //- =========================================================
    b-card.shadow-sm(
      v-else-if="viewMode === 'table' && filteredOffices.length > 0",
      no-body
    )
      b-card-header.py-2.px-3.d-flex.flex-wrap.justify-content-between.align-items-center
        .d-flex.align-items-center
          lah-fa-icon.mr-1(icon="list-check", variant="primary")
          span.font-weight-bold 全國地所跨域連線診斷明細
          b-badge.ml-2(variant="primary", pill) 共 {{ filteredOffices.length }} 筆
        .d-flex.align-items-center.flex-wrap
          b-button.mr-2(
            size="sm",
            variant="outline-info",
            :disabled="isBatchProbing || filteredOffices.length === 0",
            title="針對目前表格本頁顯示之地所執行即時 HTTP 實測",
            @click="probeCurrentPageOffices"
          )
            lah-fa-icon.mr-1(icon="bolt", :action="isBatchProbing ? 'spin' : ''")
            span 實測本頁地所
          b-input-group.mr-2(size="sm", prepend="每頁", style="width: 115px;")
            b-form-select(v-model="tablePerPage", :options="[15, 30, 50, 120]")
          b-pagination.mb-0(
            v-model="tableCurrentPage",
            :total-rows="filteredOffices.length",
            :per-page="tablePerPage",
            size="sm",
            limit="5"
          )

      b-table.mb-0(
        ref="diagTable",
        :items="filteredOffices",
        :fields="tableFields",
        :current-page="tableCurrentPage",
        :per-page="tablePerPage",
        striped,
        hover,
        responsive,
        small,
        head-variant="dark",
        primary-key="id",
        :tbody-tr-class="tableRowClass",
        @row-clicked="show"
      )
        template(#cell(id)="{ item }")
          b-badge(:variant="item.id.startsWith('H') ? 'info' : 'secondary'") {{ item.id }}

        template(#cell(county)="{ item }")
          span.font-weight-bold {{ getCountyName(item.id) }}
          small.text-muted.ml-1 ({{ getRegionName(item.id) }})

        template(#cell(name)="{ item }")
          .d-flex.align-items-center
            span.font-weight-bold {{ item.name }}
            b-badge.ml-2(v-if="item.id.startsWith('H')", variant="outline-info", pill) 本市

        template(#cell(state)="{ item }")
          .d-flex.align-items-center
            b-badge.s-95.px-2.py-1(
              :variant="item.state === 'UP' ? 'success' : 'danger'",
              pill
            )
              lah-fa-icon.mr-1(:icon="item.state === 'UP' ? 'circle-check' : 'circle-xmark'")
              span {{ item.state === 'UP' ? '正常 (UP)' : '異常 (DOWN)' }}
            b-badge.ml-1(
              v-if="liveProbeMap[item.id]",
              variant="info",
              pill,
              :title="`已於 ${liveProbeMap[item.id].time} 完成即時實測`"
            ) ⚡ 實測

        template(#cell(response)="{ item }")
          .d-flex.align-items-center
            span(
              :class="item.state === 'UP' ? 'text-muted' : 'text-danger font-weight-bold'"
            ) {{ item.response || '無回應' }}
            b-badge.ml-2(
              v-if="liveProbeMap[item.id] && liveProbeMap[item.id].latency >= 0",
              :variant="liveProbeMap[item.id].latency > 1000 ? 'warning' : 'light'",
              pill
            ) {{ liveProbeMap[item.id].latency }} ms

        template(#cell(down24h)="{ item }")
          b-badge.s-95(
            v-if="getDown24hCount(item.id) > 0",
            :variant="getDown24hCount(item.id) >= 3 ? 'danger' : 'warning'",
            pill
          ) {{ getDown24hCount(item.id) }} 次
          span.text-muted.small(v-else) 0 次

        template(#cell(timestamp)="{ item }")
          span.text-monospace {{ formatFullTime(item.timestamp) }}
          small.text-muted.ml-1 ({{ formatRelativeTime(item.timestamp) }})

        template(#cell(actions)="{ item }")
          .d-flex.justify-content-center(@click.stop)
            b-button.mr-1(
              size="sm",
              :variant="item.state !== 'UP' ? 'danger' : 'outline-info'",
              :disabled="isProbing(item.id)",
              title="立即對此所發送即時 HTTP 實測",
              @click="probeSingleOffice(item)"
            )
              lah-fa-icon(
                :icon="isProbing(item.id) ? 'spinner' : 'bolt'",
                :action="isProbing(item.id) ? 'spin' : ''"
              )
              span.ml-1 實測
            b-button(
              size="sm",
              variant="outline-secondary",
              title="檢視此所詳細診斷資訊與近期斷線紀錄",
              @click="show(item)"
            )
              lah-fa-icon(icon="magnifying-glass")

  //- =========================================================
  //- 單一地所深度診斷彈出視窗 (Deep-Dive Office Diagnostic Modal)
  //- =========================================================
  b-modal(
    id="office-detail-modal",
    ref="officeDetailModal",
    size="lg",
    centered,
    scrollable,
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center(v-if="selectedOffice")
        lah-fa-icon.mr-2(
          :icon="selectedOffice.state === 'UP' ? 'circle-check' : 'circle-xmark'",
          :variant="selectedOffice.state === 'UP' ? 'success' : 'danger'"
        )
        span.font-weight-bold {{ selectedOffice.id }} {{ selectedOffice.name }} — 跨域連線診斷
        b-badge.ml-2(:variant="selectedOffice.id.startsWith('H') ? 'info' : 'secondary'") {{ getCountyName(selectedOffice.id) }}

    div(v-if="selectedOffice")
      //- 頂部快速切換上一所 / 下一所導航列
      .d-flex.justify-content-between.align-items-center.mb-3.pb-2.border-bottom
        b-button(
          size="sm",
          variant="outline-secondary",
          :disabled="!prevOffice",
          @click="prevOffice && show(prevOffice)"
        )
          lah-fa-icon.mr-1(icon="chevron-left")
          span {{ prevOffice ? `${prevOffice.id} ${formatName(prevOffice.name)}` : '第一所' }}

        span.small.text-muted
          | 目前檢視：第 {{ selectedOfficeIndex + 1 }} / {{ filteredOffices.length }} 所

        b-button(
          size="sm",
          variant="outline-secondary",
          :disabled="!nextOffice",
          @click="nextOffice && show(nextOffice)"
        )
          span {{ nextOffice ? `${nextOffice.id} ${formatName(nextOffice.name)}` : '最後一所' }}
          lah-fa-icon.ml-1(icon="chevron-right")

      //- 診斷摘要卡片
      b-card.mb-3.bg-light(no-body)
        b-card-body.p-3
          .row
            .col-md-6.mb-2
              .small.text-muted 地所代碼與名稱
              .h5.font-weight-bold.mb-0
                b-badge.mr-2(:variant="selectedOffice.id.startsWith('H') ? 'info' : 'dark'") {{ selectedOffice.id }}
                span {{ selectedOffice.name }}
            .col-md-6.mb-2
              .small.text-muted 目前連線狀態
              .h5.font-weight-bold.mb-0
                b-badge.px-2.py-1(:variant="selectedOffice.state === 'UP' ? 'success' : 'danger'")
                  | {{ selectedOffice.state === 'UP' ? '🟢 UP (服務正常)' : '🔴 DOWN (連線異常)' }}
                b-badge.ml-2(
                  v-if="liveProbeMap[selectedOffice.id]",
                  variant="info"
                ) ⚡ 實測 {{ liveProbeMap[selectedOffice.id].latency }} ms
            .col-md-6.mb-2
              .small.text-muted 所屬區域與縣市
              .font-weight-bold {{ getRegionName(selectedOffice.id) }} · {{ getCountyName(selectedOffice.id) }}
            .col-md-6.mb-2
              .small.text-muted 最後更新時間
              .font-weight-bold
                span {{ formatFullTime(selectedOffice.timestamp) }}
                small.text-muted.ml-1 ({{ formatRelativeTime(selectedOffice.timestamp) }})
            .col-12.mt-1
              .small.text-muted 跨域 AP 檢測端點與 HTTP 回應標頭
              .d-flex.align-items-center.justify-content-between.p-2.mt-1.rounded.border.bg-white
                .text-monospace.small.text-break
                  div
                    strong 端點：
                    span.text-primary http://{{ webapIp }}/Land{{ selectedOffice.id }}/
                  div.mt-1
                    strong 回應：
                    span(:class="selectedOffice.state === 'UP' ? 'text-success font-weight-bold' : 'text-danger font-weight-bold'")
                      | {{ selectedOffice.response || '無回應 (Empty / Timeout)' }}
                b-button.ml-2.text-nowrap(
                  size="sm",
                  variant="outline-secondary",
                  title="複製診斷資訊至剪貼簿",
                  @click="copyOfficeDiag(selectedOffice, $event)"
                )
                  lah-fa-icon.mr-1(icon="copy")
                  span 複製

      //- 即時 HTTP 實測操作區
      .d-flex.justify-content-between.align-items-center.p-3.mb-3.rounded.border.border-info.bg-info-subtle
        div
          .font-weight-bold.text-info
            lah-fa-icon.mr-1(icon="bolt")
            span 即時跨域連線實測（Live HTTP Probe）
          .small.text-muted 直接向跨域 AP 發送即時 HTTP Header 探測，確認該所目前這一秒是否可正常連線。
        b-button(
          variant="info",
          :disabled="isProbing(selectedOffice.id)",
          @click="probeSingleOffice(selectedOffice, true)"
        )
          lah-fa-icon.mr-1(
            :icon="isProbing(selectedOffice.id) ? 'spinner' : 'bolt'",
            :action="isProbing(selectedOffice.id) ? 'spin' : ''"
          )
          span {{ isProbing(selectedOffice.id) ? '實測連線中...' : '立即實測連線' }}

      //- 若有實測完整 Headers 則展示
      b-card.mb-3(
        v-if="liveProbeMap[selectedOffice.id] && liveProbeMap[selectedOffice.id].headers && liveProbeMap[selectedOffice.id].headers.length > 0",
        no-body
      )
        b-card-header.py-1.px-3.small.font-weight-bold.d-flex.justify-content-between
          span ⚡ 最新實測 HTTP Headers 明細（耗時 {{ liveProbeMap[selectedOffice.id].latency }} ms）
          span.text-muted 實測時間：{{ liveProbeMap[selectedOffice.id].time }}
        b-card-body.p-2.bg-dark.text-light.text-monospace.small
          div(v-for="(hdr, hIdx) in liveProbeMap[selectedOffice.id].headers", :key="hIdx") {{ hdr }}

      //- 該地所過去 24 小時內斷線歷史紀錄
      .d-flex.justify-content-between.align-items-center.mb-2
        h6.font-weight-bold.mb-0
          lah-fa-icon.mr-1(icon="history", variant="danger")
          span 該所最近 24 小時斷線異常紀錄 ({{ selectedOfficeDownHistory.length }} 筆)
        b-button(
          size="sm",
          variant="outline-danger",
          @click="showOfflineRecords"
        )
          lah-fa-icon.mr-1(icon="link-slash")
          span 全國完整斷線時間軸

      .p-3.rounded.border.text-center.text-success.bg-success-subtle(
        v-if="selectedOfficeDownHistory.length === 0"
      )
        lah-fa-icon.mr-1(icon="circle-check", variant="success")
        span.font-weight-bold 過去 24 小時內無任何斷線異常紀錄，服務連線穩定！

      b-list-group.max-h-240.overflow-auto(v-else)
        b-list-group-item.py-2.px-3.d-flex.justify-content-between.align-items-center(
          v-for="(rec, rIdx) in selectedOfficeDownHistory",
          :key="`${rec.timestamp}-${rIdx}`"
        )
          div
            .font-weight-bold.text-danger.small {{ rec.response || '無回應 / 連線逾時' }}
            .small.text-muted 發生時間：{{ formatFullTime(rec.timestamp) }}
          b-badge(variant="outline-secondary", pill) {{ formatRelativeTime(rec.timestamp) }}
</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue'

// 全國縣市代碼與區域對照表
const COUNTY_MAP = {
  A: { name: '臺北市', short: '臺北', region: 'north', order: 1 },
  F: { name: '新北市', short: '新北', region: 'north', order: 2 },
  C: { name: '基隆市', short: '基隆', region: 'north', order: 3 },
  H: { name: '桃園市', short: '桃園', region: 'north', order: 4 },
  J: { name: '新竹縣', short: '竹縣', region: 'north', order: 5 },
  O: { name: '新竹市', short: '竹市', region: 'north', order: 6 },
  G: { name: '宜蘭縣', short: '宜蘭', region: 'north', order: 7 },
  K: { name: '苗栗縣', short: '苗栗', region: 'central', order: 8 },
  B: { name: '臺中市', short: '臺中', region: 'central', order: 9 },
  N: { name: '彰化縣', short: '彰化', region: 'central', order: 10 },
  M: { name: '南投縣', short: '南投', region: 'central', order: 11 },
  P: { name: '雲林縣', short: '雲林', region: 'central', order: 12 },
  Q: { name: '嘉義縣', short: '嘉縣', region: 'south', order: 13 },
  I: { name: '嘉義市', short: '嘉市', region: 'south', order: 14 },
  D: { name: '臺南市', short: '臺南', region: 'south', order: 15 },
  E: { name: '高雄市', short: '高雄', region: 'south', order: 16 },
  T: { name: '屏東縣', short: '屏東', region: 'south', order: 17 },
  U: { name: '花蓮縣', short: '花蓮', region: 'east', order: 18 },
  V: { name: '臺東縣', short: '臺東', region: 'east', order: 19 },
  W: { name: '金門縣', short: '金門', region: 'east', order: 20 },
  X: { name: '澎湖縣', short: '澎湖', region: 'east', order: 21 },
  Z: { name: '連江縣', short: '連江', region: 'east', order: 22 }
}

const REGION_NAME_MAP = {
  north: '北部地區',
  central: '中部地區',
  south: '南部地區',
  east: '東部及離島'
}

export default {
  components: { lahOfficeDownTimeline },
  data: () => ({
    displayDanger: false,
    displayShortName: true,
    viewMode: 'tile', // 'tile' | 'county' | 'table'
    quickFilter: '', // '' | 'up' | 'down' | 'taoyuan' | 'flaky'
    regionFilter: '',
    countyFilter: '',
    keyword: '',
    sortBy: 'default',
    officesData: [],
    recentDownRecords: [],
    red: [],
    green: [],
    yellow: [],
    reloadMs: 5 * 60 * 1000,
    timer: null,
    isBusy: false,
    isDarkMode: false,
    compactHeader: false,
    headerNeedWidth: 0,

    // 即時 HTTP 實測狀態
    probingIds: [],
    liveProbeMap: {},
    isBatchProbing: false,

    // 縣市矩陣收合狀態
    collapsedCounties: {},
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1440,

    // 診斷清單表格分頁
    tableCurrentPage: 1,
    tablePerPage: 30,
    tableFields: [
      { key: 'id', label: '代碼', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle' },
      { key: 'county', label: '縣市 / 區域', sortable: false, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'name', label: '地政事務所名稱', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'state', label: '目前狀態', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'response', label: 'HTTP 回應 / 延遲', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle' },
      { key: 'down24h', label: '24h 斷線', sortable: true, thClass: 'text-nowrap text-center', tdClass: 'align-middle text-center' },
      { key: 'timestamp', label: '最後檢測時間', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'actions', label: '操作', sortable: false, thClass: 'text-nowrap text-center', tdClass: 'align-middle text-center' }
    ],

    // 區域與排序選項
    regionOptions: [
      { text: '全部區域', value: '' },
      { text: '北部', value: 'north' },
      { text: '中部', value: 'central' },
      { text: '南部', value: 'south' },
      { text: '東部及離島', value: 'east' }
    ],
    sortOptions: [
      { text: '預設 (異常›桃園›代碼)', value: 'default' },
      { text: '24h 斷線次數 (高→低)', value: 'flaky_desc' },
      { text: '地所代碼 (A→Z)', value: 'id_asc' },
      { text: '縣市轄區排序', value: 'county_asc' },
      { text: '實測延遲 (慢→快)', value: 'latency_desc' }
    ],

    // 單所深度診斷視窗目標
    selectedOfficeId: ''
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  computed: {
    // 24 小時內各所斷線次數統計 Map
    down24hMap () {
      const map = {}
      this.recentDownRecords.forEach((rec) => {
        if (!rec || !rec.id || ['CB', 'CC'].includes(rec.id)) { return }
        if (!map[rec.id]) {
          map[rec.id] = []
        }
        map[rec.id].push(rec)
      })
      return map
    },
    flakyOfficeIds () {
      return Object.keys(this.down24hMap)
    },
    topFlakyOffice () {
      let top = null
      Object.entries(this.down24hMap).forEach(([id, list]) => {
        if (!top || list.length > top.count) {
          const found = this.officesData.find(o => o.id === id)
          top = {
            id,
            name: found ? found.name : (list[0]?.name || id),
            count: list.length
          }
        }
      })
      return top
    },
    // 全國可用率
    availabilityRate () {
      if (this.officesData.length === 0) { return '100.0' }
      const rate = (this.green.length / this.officesData.length) * 100
      return rate === 100 ? '100' : rate.toFixed(1)
    },
    availabilityTextClass () {
      if (this.red.length === 0) { return 'text-success' }
      const rate = (this.green.length / (this.officesData.length || 1)) * 100
      return rate >= 95 ? 'text-warning-dark' : 'text-danger'
    },
    // 桃園市地所統計
    taoyuanOffices () {
      return this.officesData.filter(o => o.id && o.id.startsWith('H'))
    },
    taoyuanUpCount () {
      return this.taoyuanOffices.filter(o => o.state === 'UP').length
    },
    taoyuanDownCount () {
      return this.taoyuanOffices.filter(o => o.state !== 'UP').length
    },
    // 縣市健康統計
    totalCountyCount () {
      const set = new Set(this.officesData.map(o => (o.id || '').charAt(0)).filter(Boolean))
      return set.size
    },
    healthyCountyCount () {
      const allCounties = new Set(this.officesData.map(o => (o.id || '').charAt(0)).filter(Boolean))
      const downCounties = new Set(this.officesData.filter(o => o.state !== 'UP').map(o => (o.id || '').charAt(0)))
      let healthy = 0
      allCounties.forEach((c) => {
        if (!downCounties.has(c)) { healthy++ }
      })
      return healthy
    },
    // 快取時間指標
    latestSnapshotTs () {
      if (this.officesData.length === 0) { return 0 }
      return Math.max(...this.officesData.map(o => Number(o.timestamp) || 0))
    },
    latestSnapshotTimeStr () {
      if (!this.latestSnapshotTs) { return '' }
      return this.$utils.formatTime(new Date(this.latestSnapshotTs * 1000))
    },
    latestSnapshotRelative () {
      if (!this.latestSnapshotTs) { return '' }
      return this.$utils.formatDistanceToNow(this.latestSnapshotTs * 1000)
    },
    isCacheStale () {
      if (!this.latestSnapshotTs) { return false }
      const diffSec = (Date.now() / 1000) - this.latestSnapshotTs
      return diffSec > 15 * 60
    },
    liveProbedCount () {
      return Object.keys(this.liveProbeMap).length
    },
    // 縣市下拉選單項目
    countySelectOptions () {
      const map = {}
      this.officesData.forEach((o) => {
        const code = (o.id || '').charAt(0)
        if (!code) { return }
        if (!map[code]) {
          map[code] = { total: 0, down: 0 }
        }
        map[code].total++
        if (o.state !== 'UP') { map[code].down++ }
      })
      const codes = Object.keys(map).sort((a, b) => {
        if (a === 'H') { return -1 }
        if (b === 'H') { return 1 }
        const orderA = COUNTY_MAP[a]?.order || 99
        const orderB = COUNTY_MAP[b]?.order || 99
        return orderA - orderB
      })
      const opts = [{ text: `全部縣市 (${this.officesData.length})`, value: '' }]
      codes.forEach((c) => {
        const info = COUNTY_MAP[c] || { name: `${c}區` }
        const st = map[c]
        const prefix = st.down > 0 ? '🔴 ' : '🟢 '
        const suffix = st.down > 0 ? `(${st.down}/${st.total} 異常)` : `(${st.total} 所)`
        opts.push({
          text: `${prefix}${info.name} ${suffix}`,
          value: c
        })
      })
      return opts
    },
    hasActiveFilters () {
      return Boolean(this.keyword || this.quickFilter || this.regionFilter || this.countyFilter || this.sortBy !== 'default')
    },
    // 複合條件過濾與排序後的地所列表
    filteredOffices () {
      const kw = (this.keyword || '').toLowerCase()
      const filtered = this.officesData.filter((item) => {
        // 1. 快篩指標條件
        if (this.quickFilter === 'up' && item.state !== 'UP') { return false }
        if (this.quickFilter === 'down' && item.state === 'UP') { return false }
        if (this.quickFilter === 'taoyuan' && !(item.id || '').startsWith('H')) { return false }
        if (this.quickFilter === 'flaky' && !this.down24hMap[item.id]) { return false }

        // 2. 區域篩選
        if (this.regionFilter) {
          const cCode = (item.id || '').charAt(0)
          const reg = COUNTY_MAP[cCode]?.region || ''
          if (reg !== this.regionFilter) { return false }
        }

        // 3. 縣市篩選
        if (this.countyFilter) {
          if ((item.id || '').charAt(0) !== this.countyFilter) { return false }
        }

        // 4. 關鍵字搜尋 (名稱、代碼、縣市、回應狀態)
        if (kw) {
          const idStr = (item.id || '').toLowerCase()
          const nameStr = (item.name || '').toLowerCase()
          const countyStr = this.getCountyName(item.id).toLowerCase()
          const respStr = (item.response || '').toLowerCase()
          if (
            !idStr.includes(kw) &&
            !nameStr.includes(kw) &&
            !countyStr.includes(kw) &&
            !respStr.includes(kw)
          ) {
            return false
          }
        }

        return true
      })

      // 豐富化供表格排序使用之衍生欄位
      const enriched = filtered.map(item => ({
        ...item,
        down24h: this.getDown24hCount(item.id)
      }))

      // 依選擇排序
      return enriched.sort((a, b) => {
        if (this.sortBy === 'flaky_desc') {
          if (b.down24h !== a.down24h) { return b.down24h - a.down24h }
        } else if (this.sortBy === 'id_asc') {
          return (a.id || '').localeCompare(b.id || '')
        } else if (this.sortBy === 'county_asc') {
          const orderA = COUNTY_MAP[(a.id || '').charAt(0)]?.order || 99
          const orderB = COUNTY_MAP[(b.id || '').charAt(0)]?.order || 99
          if (orderA !== orderB) { return orderA - orderB }
          return (a.id || '').localeCompare(b.id || '')
        } else if (this.sortBy === 'latency_desc') {
          const latA = this.liveProbeMap[a.id]?.latency ?? -1
          const latB = this.liveProbeMap[b.id]?.latency ?? -1
          if (latB !== latA) { return latB - latA }
        }

        // 預設排序：異常優先 -> 桃園優先 -> 代碼排序
        const aBad = a.state !== 'UP'
        const bBad = b.state !== 'UP'
        if (aBad && !bBad) { return -1 }
        if (!aBad && bBad) { return 1 }

        const aTaoyuan = (a.id || '').startsWith('H')
        const bTaoyuan = (b.id || '').startsWith('H')
        if (aTaoyuan && !bTaoyuan) { return -1 }
        if (!aTaoyuan && bTaoyuan) { return 1 }

        return (a.id || '').localeCompare(b.id || '')
      })
    },
    // 縣市矩陣分組結構
    countyGroups () {
      const groupMap = {}
      this.filteredOffices.forEach((office) => {
        const cCode = (office.id || '').charAt(0) || 'Z'
        if (!groupMap[cCode]) {
          const cInfo = COUNTY_MAP[cCode] || { name: `${cCode} 轄區`, short: cCode, region: 'east', order: 99 }
          groupMap[cCode] = {
            countyCode: cCode,
            countyName: cInfo.name,
            regionName: REGION_NAME_MAP[cInfo.region] || '其他區域',
            order: cInfo.order,
            offices: [],
            downCount: 0,
            flakyTotal: 0
          }
        }
        groupMap[cCode].offices.push(office)
        if (office.state !== 'UP') {
          groupMap[cCode].downCount++
        }
        groupMap[cCode].flakyTotal += this.getDown24hCount(office.id)
      })

      return Object.values(groupMap).sort((a, b) => {
        // 1. 有異常的縣市置頂
        if (a.downCount > 0 && b.downCount === 0) { return -1 }
        if (a.downCount === 0 && b.downCount > 0) { return 1 }
        if (a.downCount !== b.downCount) { return b.downCount - a.downCount }
        // 2. 桃園市置頂
        if (a.countyCode === 'H' && b.countyCode !== 'H') { return -1 }
        if (a.countyCode !== 'H' && b.countyCode === 'H') { return 1 }
        // 3. 地理位置順序
        return a.order - b.order
      })
    },
    columnCount () {
      if (this.windowWidth < 768) { return 1 }
      if (this.windowWidth < 1200) { return 2 }
      return 3
    },
    // 依序由左至右分派欄位 (Round-Robin Left-to-Right 瀑布流)
    countyMatrixColumns () {
      const cols = Array.from({ length: this.columnCount }, () => [])
      this.countyGroups.forEach((group, index) => {
        if (!group) { return }
        const colIdx = index % this.columnCount
        cols[colIdx].push(group)
      })
      return cols
    },
    // XLSX 匯出資料
    xlsxData () {
      return this.filteredOffices.map(o => ({
        地所代碼: o.id,
        所屬區域: this.getRegionName(o.id),
        所屬縣市: this.getCountyName(o.id),
        地政事務所名稱: o.name,
        目前連線狀態: o.state,
        HTTP回應訊息: o.response || '',
        過去24小時斷線次數: this.getDown24hCount(o.id),
        實測延遲毫秒: this.liveProbeMap[o.id]?.latency ?? '',
        最後檢測時間: this.formatFullTime(o.timestamp)
      }))
    },
    // 單所診斷視窗資料
    selectedOffice () {
      if (!this.selectedOfficeId) { return null }
      return this.officesData.find(o => o.id === this.selectedOfficeId) || null
    },
    selectedOfficeIndex () {
      if (!this.selectedOfficeId) { return -1 }
      return this.filteredOffices.findIndex(o => o.id === this.selectedOfficeId)
    },
    prevOffice () {
      if (this.selectedOfficeIndex > 0) {
        return this.filteredOffices[this.selectedOfficeIndex - 1]
      }
      return null
    },
    nextOffice () {
      if (this.selectedOfficeIndex >= 0 && this.selectedOfficeIndex < this.filteredOffices.length - 1) {
        return this.filteredOffices[this.selectedOfficeIndex + 1]
      }
      return null
    },
    selectedOfficeDownHistory () {
      if (!this.selectedOfficeId) { return [] }
      return this.down24hMap[this.selectedOfficeId] || []
    }
  },
  watch: {
    officesData: {
      deep: true,
      handler (val) {
        this.syncLightBuckets(val)
      }
    },
    displayDanger (val) {
      if (val && this.quickFilter !== 'down') {
        this.quickFilter = 'down'
      } else if (!val && this.quickFilter === 'down') {
        this.quickFilter = ''
      }
      this.tableCurrentPage = 1
      this.setCache('/inf/xap/broken_cached/displayDanger', val, 7 * 24 * 60 * 60 * 1000)
    },
    quickFilter (val) {
      this.displayDanger = (val === 'down')
      this.tableCurrentPage = 1
    },
    displayShortName (val) {
      this.setCache('/inf/xap/broken_cached/displayShortName', val, 7 * 24 * 60 * 60 * 1000)
    },
    viewMode (val) {
      this.setCache('/inf/xap/broken_cached/viewMode', val, 7 * 24 * 60 * 60 * 1000)
    },
    isDarkMode (flag) {
      this.setCache('/inf/xap/broken_cached/darkMode', flag, 30 * 24 * 60 * 60 * 1000)
      this.updateBodyBg(flag)
    },
    // 篩選條件變更時，重設表格頁碼為 1（遵守 AGENTS.md 規範）
    keyword () { this.tableCurrentPage = 1 },
    regionFilter () { this.tableCurrentPage = 1 },
    countyFilter () { this.tableCurrentPage = 1 },
    sortBy () { this.tableCurrentPage = 1 },
    tablePerPage () { this.tableCurrentPage = 1 }
  },
  created () {
    this.load(false)
    this.loadRecentDownHistory()
  },
  mounted () {
    this.restorePreferences()
    this.timer = setInterval(() => {
      this.load(false)
      this.loadRecentDownHistory()
    }, this.reloadMs)
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleGlobalKeydown)
      this.handleResize = () => {
        this.windowWidth = window.innerWidth
      }
      window.addEventListener('resize', this.handleResize)
    }
    this.$nextTick(this.setupHeaderCompact)
  },
  beforeDestroy () {
    clearInterval(this.timer)
    clearTimeout(this.headerCompactTimer)
    if (this.headerRO) {
      this.headerRO.disconnect()
      this.headerRO = null
    }
    this.updateBodyBg(false)
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleGlobalKeydown)
      if (this.handleResize) {
        window.removeEventListener('resize', this.handleResize)
      }
    }
  },
  methods: {
    // 依 header 實際可用寬度（非 viewport）決定是否隱藏按鈕文字，維持單行
    setupHeaderCompact () {
      if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') { return }
      const row = this.$el.querySelector('.header-row')
      if (!row) {
        this.headerCompactTimer = setTimeout(this.setupHeaderCompact, 300)
        return
      }
      this.headerRO = new ResizeObserver(this.checkHeaderCompact)
      this.headerRO.observe(row)
      const right = row.querySelector('.header-right-group')
      if (right) { this.headerRO.observe(right) }
      this.checkHeaderCompact()
    },
    checkHeaderCompact () {
      const row = this.$el.querySelector('.header-row')
      const left = row && row.querySelector('.header-left-group')
      const right = row && row.querySelector('.header-right-group')
      const title = row && row.querySelector('.header-title-text')
      if (!left || !right || !title) { return }
      if (!this.compactHeader) {
        const titleClipped = title.scrollWidth > title.clientWidth + 1
        const overflow = row.scrollWidth > row.clientWidth + 1
        if (titleClipped || overflow) {
          this.headerNeedWidth = left.offsetWidth - title.clientWidth + title.scrollWidth + right.offsetWidth + 16
          this.compactHeader = true
        }
      } else if (row.clientWidth >= this.headerNeedWidth) {
        this.compactHeader = false
      }
    },
    async restorePreferences () {
      const shortFlag = await this.getCache('/inf/xap/broken_cached/displayShortName')
      if (shortFlag !== null && shortFlag !== undefined && shortFlag !== false) {
        this.displayShortName = Boolean(shortFlag)
      }
      const dangerFlag = await this.getCache('/inf/xap/broken_cached/displayDanger')
      if (dangerFlag === true) {
        this.displayDanger = true
        this.quickFilter = 'down'
      }
      const savedView = await this.getCache('/inf/xap/broken_cached/viewMode')
      if (['tile', 'county', 'table'].includes(savedView)) {
        this.viewMode = savedView
      }
      const darkFlag = await this.getCache('/inf/xap/broken_cached/darkMode')
      if (typeof darkFlag === 'boolean') {
        this.isDarkMode = darkFlag
        this.updateBodyBg(darkFlag)
      }
    },
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
    },
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121212' : ''
      }
    },
    handleGlobalKeydown (e) {
      // 忽略在 input/textarea 內的按鍵
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : ''
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) { return }
      if (e.key === '/') {
        e.preventDefault()
        const inputEl = this.$refs.searchInput && (this.$refs.searchInput.$el || this.$refs.searchInput)
        if (inputEl && typeof inputEl.focus === 'function') {
          inputEl.focus()
        }
      }
    },
    syncLightBuckets (list) {
      this.red.length = 0
      this.yellow.length = 0
      this.green.length = 0
      if (!Array.isArray(list)) { return }
      list.forEach((value) => {
        const site = value.id
        if (value.state === 'UP') {
          this.green.push(site)
        } else if (value.state === 'DOWN') {
          this.red.push(site)
        } else {
          this.yellow.push(site)
        }
      })
    },
    isOn (data) {
      if (this.displayDanger) {
        return this.red.includes(data.id)
      }
      return true
    },
    setQuickFilter (filterVal) {
      this.quickFilter = (this.quickFilter === filterVal && filterVal !== '') ? '' : filterVal
    },
    clearKeyword () {
      this.keyword = ''
    },
    resetAllFilters () {
      this.keyword = ''
      this.quickFilter = ''
      this.displayDanger = false
      this.regionFilter = ''
      this.countyFilter = ''
      this.sortBy = 'default'
      this.tableCurrentPage = 1
    },
    formatName (name) {
      if (!name) { return '' }
      if (this.displayShortName) {
        return name.replace('地政事務所', '')
      }
      return name
    },
    formatShortName (name) {
      if (!name) { return '' }
      return name.replace(/(地政事務所|地政所)/g, '')
    },
    getCountyInfo (siteId) {
      const code = (siteId || '').charAt(0)
      return COUNTY_MAP[code] || { name: '其他縣市', short: code, region: 'east', order: 99 }
    },
    getCountyName (siteId) {
      return this.getCountyInfo(siteId).name
    },
    getCountyShortName (siteId) {
      return this.getCountyInfo(siteId).short
    },
    getRegionName (siteId) {
      const reg = this.getCountyInfo(siteId).region
      return REGION_NAME_MAP[reg] || '其他區域'
    },
    getDown24hCount (siteId) {
      return this.down24hMap[siteId] ? this.down24hMap[siteId].length : 0
    },
    formatFullTime (phpTs) {
      if (!phpTs) { return '未知' }
      return this.$utils.formatTime(new Date(Number(phpTs) * 1000), 'yyyy-MM-dd HH:mm:ss')
    },
    formatShortTime (phpTs) {
      if (!phpTs) { return '' }
      return this.$utils.formatTime(new Date(Number(phpTs) * 1000), 'HH:mm:ss')
    },
    formatRelativeTime (phpTs) {
      if (!phpTs) { return '' }
      return this.$utils.formatDistanceToNow(Number(phpTs) * 1000)
    },
    // 讀取快取狀態清單
    load (manualClick = false) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_cached'
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          const rawData = data.raw.filter(item => !['CB', 'CC'].includes(item.id))
          this.officesData = rawData
          this.syncLightBuckets(rawData)
          if (manualClick) {
            this.loadRecentDownHistory()
          }
        } else {
          this.$utils.error('無法取得各地政事務所狀態快取資料。', data)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        if (this.$refs.countdown) {
          this.$refs.countdown.resetCountdown()
          this.$refs.countdown.startCountdown()
        }
      })
    },
    // 強制觸發後端重刷快取
    forceBackendRefresh () {
      if (this.isBusy) { return }
      this.isBusy = true
      this.info('正在請求後端同步最新全國跨域主機狀態...', { title: '同步快取' })
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats',
        force: 'true'
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          const rawData = data.raw.filter(item => !['CB', 'CC'].includes(item.id))
          this.officesData = rawData
          this.syncLightBuckets(rawData)
          this.success(`已成功同步全國 ${rawData.length} 所狀態資料`, { title: '同步完成' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        if (this.$refs.countdown) {
          this.$refs.countdown.resetCountdown()
          this.$refs.countdown.startCountdown()
        }
      })
    },
    // 讀取過去 24 小時內斷線歷史紀錄（供熱點雷達與單所診斷使用）
    loadRecentDownHistory () {
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_down',
        opt: 'day'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
          this.recentDownRecords = data.raw
        }
      }).catch((err) => {
        this.$utils.warn('讀取 24h 斷線紀錄失敗', err)
      })
    },
    // ─── 即時 HTTP 實測功能 (Live HTTP Probe) ───
    isProbing (siteId) {
      return this.probingIds.includes(siteId)
    },
    probeSingleOffice (office, notifyResult = true) {
      if (!office || !office.id || this.isProbing(office.id)) {
        return Promise.resolve(false)
      }
      const siteId = office.id
      this.probingIds.push(siteId)
      const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now()

      return this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'check_site_http',
        site: siteId
      }, { timeout: 8000 }).then(({ data }) => {
        const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const latency = Math.max(1, Math.round(endMs - startMs))
        const isUp = this.$utils.statusCheck(data.status) || data.status === 401
        const headers = Array.isArray(data.raw) ? data.raw : []
        const firstHeader = (headers[0] || '').trim() || (isUp ? 'HTTP/1.1 401 Unauthorized' : (data.message || '無回應'))
        const nowSec = Math.floor(Date.now() / 1000)

        // 更新該所於 officesData 中的狀態
        const target = this.officesData.find(o => o.id === siteId)
        if (target) {
          target.state = isUp ? 'UP' : 'DOWN'
          target.response = firstHeader
          target.timestamp = nowSec
        }
        this.syncLightBuckets(this.officesData)

        this.$set(this.liveProbeMap, siteId, {
          latency,
          isUp,
          response: firstHeader,
          headers,
          time: this.$utils.formatTime(new Date(), 'HH:mm:ss')
        })

        if (notifyResult) {
          if (isUp) {
            this.success(`${siteId} ${office.name} 實測連線正常 (${latency} ms)`, { title: '⚡ 即時實測結果' })
          } else {
            this.warning(`${siteId} ${office.name} 實測連線異常：${firstHeader}`, { title: '⚡ 即時實測結果' })
          }
        }
        return isUp
      }).catch((err) => {
        const endMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const latency = Math.max(1, Math.round(endMs - startMs))
        const errMsg = err?.code === 'ECONNABORTED' ? '連線逾時 (Timeout)' : (err?.message || '連線失敗')
        const target = this.officesData.find(o => o.id === siteId)
        if (target) {
          target.state = 'DOWN'
          target.response = errMsg
          target.timestamp = Math.floor(Date.now() / 1000)
        }
        this.syncLightBuckets(this.officesData)
        this.$set(this.liveProbeMap, siteId, {
          latency,
          isUp: false,
          response: errMsg,
          headers: [errMsg],
          time: this.$utils.formatTime(new Date(), 'HH:mm:ss')
        })
        if (notifyResult) {
          this.warning(`${siteId} ${office.name} 實測失敗：${errMsg}`, { title: '⚡ 即時實測結果' })
        }
        return false
      }).finally(() => {
        const idx = this.probingIds.indexOf(siteId)
        if (idx > -1) {
          this.probingIds.splice(idx, 1)
        }
      })
    },
    async runBatchProbe (officeList, label = '批次實測') {
      if (!Array.isArray(officeList) || officeList.length === 0 || this.isBatchProbing) { return }
      this.isBatchProbing = true
      const queue = [...officeList]
      const concurrency = 3
      let upCount = 0
      let downCount = 0

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift()
          if (!item) { break }
          const ok = await this.probeSingleOffice(item, false)
          if (ok) { upCount++ } else { downCount++ }
        }
      }

      const workers = []
      for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
        workers.push(worker())
      }
      await Promise.all(workers)
      this.isBatchProbing = false

      if (downCount === 0) {
        this.success(`${label}完成：共檢測 ${upCount} 所，全數正常連線！`, { title: '⚡ 批次實測完成' })
      } else {
        this.warning(`${label}完成：正常 ${upCount} 所、異常 ${downCount} 所`, { title: '⚡ 批次實測完成' })
      }
    },
    batchProbeDownOffices () {
      const downList = this.officesData.filter(o => o.state !== 'UP')
      if (downList.length === 0) {
        this.info('目前無異常地所，將為您實測桃園市 8 所連線狀態')
        this.batchProbeTaoyuan()
        return
      }
      this.runBatchProbe(downList, `異常地所實測 (${downList.length} 所)`)
    },
    batchProbeTaoyuan () {
      const tyList = this.officesData.filter(o => (o.id || '').startsWith('H'))
      this.runBatchProbe(tyList, '桃園市 8 所實測')
    },
    probeCountyOffices (group) {
      if (!group || !Array.isArray(group.offices)) { return }
      this.runBatchProbe(group.offices, `${group.countyName}地所實測`)
    },
    probeCurrentPageOffices () {
      const start = (this.tableCurrentPage - 1) * this.tablePerPage
      const pageItems = this.filteredOffices.slice(start, start + this.tablePerPage)
      this.runBatchProbe(pageItems, `本頁地所實測 (${pageItems.length} 所)`)
    },
    // 縣市矩陣收合控制
    isCountyCollapsed (countyCode) {
      return Boolean(this.collapsedCounties[countyCode])
    },
    toggleCountyCollapse (countyCode) {
      this.$set(this.collapsedCounties, countyCode, !this.collapsedCounties[countyCode])
    },
    toggleAllCounties (expand) {
      const next = {}
      if (!expand) {
        this.countyGroups.forEach((g) => {
          next[g.countyCode] = true
        })
      }
      this.collapsedCounties = next
    },
    // 開啟單所診斷視窗
    show (office) {
      if (!office || !office.id) { return }
      this.selectedOfficeId = office.id
      this.$bvModal.show('office-detail-modal')
    },
    copyOfficeDiag (office, evt) {
      if (!office) { return }
      const text = [
        '【全國地所跨域主機診斷】',
        `代碼：${office.id}`,
        `名稱：${office.name} (${this.getCountyName(office.id)})`,
        `狀態：${office.state}`,
        `回應：${office.response || '無回應'}`,
        `端點：http://${this.webapIp}/Land${office.id}/`,
        `時間：${this.formatFullTime(office.timestamp)}`
      ].join('\n')
      this.copyToClipboard(text, `已複製 ${office.id} ${office.name} 診斷資訊`, evt?.currentTarget)
    },
    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false,
          hideFooter: true
        }
      }), {
        title: '離線伺服器歷史資訊',
        size: 'lg'
      })
    },
    // 樣式輔助
    tileBorderCss (data) {
      const css = []
      if (data.state !== 'UP') {
        css.push('border-danger', 'shadow', 'bg-danger-light')
      } else if (data.id.startsWith('H')) {
        css.push('border-info')
      } else if (this.getDown24hCount(data.id) > 0) {
        css.push('border-warning')
      } else {
        css.push('border-light')
      }
      return css
    },
    cellStatusClass (office) {
      if (office.state !== 'UP') { return 'cell-down' }
      if (office.id.startsWith('H')) { return 'cell-taoyuan' }
      return 'cell-up'
    },
    tableRowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      if (item.state !== 'UP') { return 'table-danger pointer' }
      return 'pointer'
    }
  }
}
</script>

<style lang="scss" scoped>
// =========================================================
// 1. lah-header 48px 高度規範
// =========================================================
.header-row {
  flex-wrap: nowrap;
}
.header-right-group {
  flex: 0 0 auto;
  margin-left: auto;
}
@media (max-width: 1799.98px) {
  .header-right-group ::v-deep .hide-label-sm {
    .btn-label {
      display: none;
    }
    .svg-inline--fa.mr-1 {
      margin-right: 0 !important;
    }
  }
}
.header-left-group {
  flex: 0 1 auto;
  min-width: 0;
  .header-title-wrap,
  .header-title-icon {
    min-width: 0;
  }
  .header-title-text {
    display: block;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.header-right-group {
  ::v-deep .btn-group > .btn,
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

// =========================================================
// 2. 主捲動區與 KPI 指標卡
// =========================================================
.monitor-body {
  height: calc(100vh - 82px);
  overflow-y: auto;
}

.kpi-card {
  height: 100%;
  min-height: 74px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }

  &.kpi-active {
    border-width: 2px;
  }
  &.kpi-primary { border-color: #007bff !important; background-color: #f0f7ff; }
  &.kpi-success { border-color: #28a745 !important; background-color: #f2fbf4; }
  &.kpi-danger  { border-color: #dc3545 !important; background-color: #fff5f5; }
  &.kpi-info    { border-color: #17a2b8 !important; background-color: #f0fcff; }
  &.kpi-warning { border-color: #f59e0b !important; background-color: #fffbeb; }

  .kpi-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .kpi-value-row {
    display: flex;
    align-items: baseline;
    flex-wrap: nowrap;
    white-space: nowrap;
    min-width: 0;
    overflow: hidden;
  }
}

.text-warning-dark {
  color: #b45309 !important;
}

.bg-danger-subtle {
  background-color: #fff5f5 !important;
}

.bg-info-subtle {
  background-color: #f0fcff !important;
}

.bg-success-subtle {
  background-color: #f2fbf4 !important;
}

.filter-toolbar {
  background-color: #ffffff;
}

.alert-all-green {
  background-color: #f2fbf4;
  border: 2px solid #28a745;
}

// =========================================================
// 3. 戰情方塊視圖 (Grid Tile View)
// =========================================================
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.85rem;
  align-content: start;
}

.modern-tile {
  width: 100% !important;
  min-height: 98px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  font-size: 1.1rem;
  background-color: #ffffff;
  border-width: 2px !important;
  border-style: solid;
  border-radius: 12px !important;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform;
  cursor: pointer;
  padding: 0.5rem 0.65rem;
  text-align: center;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    z-index: 10;

    .tile-probe-btn {
      opacity: 1;
    }
  }
}

.tile-top-bar {
  font-size: 0.75rem;
  line-height: 1;
}

.county-pill {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background-color: #f1f5f9;
  color: #475569;
  font-weight: 600;

  &.county-taoyuan {
    background-color: #e0f2fe;
    color: #0369a1;
  }
}

.site-code-text {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  color: #64748b;
  font-size: 0.78rem;
}

.tile-probe-btn {
  opacity: 0.45;
  transition: opacity 0.15s ease, transform 0.15s ease;
  line-height: 1;

  &:hover {
    opacity: 1;
    transform: scale(1.2);
  }
}

.office-title {
  font-size: 1.15rem;
  color: #1e293b;
}

.error-msg {
  font-size: 0.8rem;
  color: #dc3545;
  font-weight: 600;
  line-height: 1.25;
  width: 100%;
}

.live-probe-tag {
  font-size: 0.76rem;
  line-height: 1.2;
}

.tile-time-hint {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.2;
}

.flaky-badge {
  font-size: 0.68rem;
  padding: 0.15em 0.4em;
}

.bg-danger-light {
  background-color: #fff5f5 !important;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}

// =========================================================
// 4. 縣市矩陣視圖 (Masonry 智慧瀑布流 3 欄卡片)
// =========================================================
.county-masonry-row {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  width: 100%;
}

.county-masonry-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.county-group-card {
  border-radius: 12px;
  border-width: 2px !important;
  border-style: solid;
  border-color: #e2e8f0;
  background-color: #ffffff;
  overflow: hidden;
  will-change: transform;
  transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08) !important;
  }

  &.border-danger {
    border-color: #dc3545 !important;
  }

  &.border-info {
    border-color: #0ea5e9 !important;
  }
}

.county-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.15s ease;
  &:hover {
    background-color: #f1f5f9;
  }
}

.county-office-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.county-office-cell {
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background-color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  }

  &.cell-down {
    border: 2px solid #dc3545;
    background-color: #fff5f5;
  }

  &.cell-taoyuan {
    border-color: #7dd3fc;
    background-color: #f8fdff;
  }
}

// =========================================================
// 5. 輔助與深色模式適配 (Dark Mode Overrides)
// =========================================================
.pointer {
  cursor: pointer;
}

.min-w-0 {
  min-width: 0;
}

.max-h-240 {
  max-height: 240px;
}

.list-enter-active, .list-leave-active,
.county-flip-enter-active, .county-flip-leave-active {
  transition: all 0.35s ease;
}
.list-enter, .list-leave-to,
.county-flip-enter, .county-flip-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
.list-move,
.county-flip-move {
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
  will-change: transform;
  z-index: 5;
}

.fade-view-enter-active, .fade-view-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-view-enter {
  opacity: 0;
  transform: translateY(6px);
}
.fade-view-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.dark-mode {
  .kpi-card,
  .filter-toolbar,
  .modern-tile,
  .county-group-card,
  .county-office-cell {
    background-color: #1e1e1e !important;
    border-color: #383838 !important;
    color: #e0e0e0 !important;
  }

  .kpi-card.kpi-active {
    border-color: #66b0ff !important;
  }

  .office-title {
    color: #f8f9fa !important;
  }

  .county-pill {
    background-color: #2d3748;
    color: #e2e8f0;
  }

  .county-header {
    background-color: #252526 !important;
    color: #f8f9fa !important;
  }

  .bg-danger-light,
  .county-office-cell.cell-down {
    background-color: #3b181b !important;
    border-color: #dc3545 !important;
  }
}
</style>
