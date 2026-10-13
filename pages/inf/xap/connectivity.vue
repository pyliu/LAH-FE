<template lang="pug">
.dark-container.h-100(v-cloak, :class="{ 'dark-mode': isDarkMode, 'header-compact': compactHeader }")
  //- 頂部標題與控制列 (符合 48px 高度規範)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100.header-row
        .d-flex.align-items-center.header-left-group
          .my-auto.d-flex.align-items-center.header-title-wrap
            lah-fa-icon.header-title-icon(
              icon="wave-square",
              :variant="headerLight",
              action="squeeze"
            )
              span.font-weight-bold.header-title-text 即時全國地所跨域主機監控
            b-badge.ml-2.s-90(
              :variant="isPatrolPaused ? 'warning' : (red.length > 0 ? 'danger' : 'success')",
              pill
            )
              template(v-if="isPatrolPaused") ⏸ 巡檢已暫停
              template(v-else-if="red.length > 0") 🔴 異常 {{ red.length }} 所
              template(v-else) 📡 主動巡檢中 ({{ processingIds.length }}/{{ maxConcurrent }})
          lah-button.ml-1(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            size="lg",
            no-border,
            no-icon-gutter,
            title="主動巡檢戰情室說明"
          )

        .d-flex.align-items-center.flex-nowrap.text-nowrap.header-right-group
          //- 巡檢引擎控制群組
          b-button-group.mr-2(size="lg")
            lah-button.hide-label-sm(
              :icon="isPatrolPaused ? 'play' : 'pause'",
              :variant="isPatrolPaused ? 'warning' : 'outline-success'",
              :title="isPatrolPaused ? '恢復背景主動佇列巡檢' : '暫停背景主動佇列巡檢'",
              @click="togglePatrol"
            )
              span.btn-label {{ isPatrolPaused ? '恢復巡檢' : '巡檢中' }}
            lah-button.hide-label-sm(
              icon="bolt",
              :variant="red.length + yellow.length > 0 ? 'danger' : 'outline-info'",
              :title="red.length + yellow.length > 0 ? '立即將異常與逾時站點插隊至佇列最前方優先重測' : '立即將桃園市 8 所插隊至佇列最前方優先重測'",
              @click="prioritizeUrgentSites"
            )
              span.btn-label {{ red.length + yellow.length > 0 ? `優先重測異常 (${red.length + yellow.length})` : '優先測本市' }}
            lah-button.hide-label-sm(
              icon="arrows-rotate",
              variant="outline-secondary",
              title="重置佇列並展開新一輪全國完整巡檢",
              @click="restartFullPatrol"
            )
              span.btn-label 全量重巡

          //- 三大檢視模式切換
          b-button-group.mr-2(size="lg")
            lah-button.hide-label-sm(
              icon="gauge-high",
              :variant="viewMode === 'telemetry' ? 'primary' : 'outline-primary'",
              title="遙測方塊視圖：即時顯示各所延遲 ms、成功率與最近 8 次探測軌跡",
              @click="viewMode = 'telemetry'"
            )
              span.btn-label 遙測方塊
            lah-button.hide-label-sm(
              icon="layer-group",
              :variant="viewMode === 'county' ? 'primary' : 'outline-primary'",
              title="縣市戰情視圖：依 22 縣市彙整區域平均延遲與連線健康度",
              @click="viewMode = 'county'"
            )
              span.btn-label 縣市戰情
            lah-button.hide-label-sm(
              icon="table",
              :variant="viewMode === 'table' ? 'primary' : 'outline-primary'",
              title="遙測數據表：管理者專用高密度數據明細，含平均/峰值延遲與失敗率排序",
              @click="viewMode = 'table'"
            )
              span.btn-label 遙測數據表

          //- 輔助工具群組
          b-button-group(size="lg")
            lah-button-xlsx.mr-1(
              :jsons="xlsxData",
              header="全國地所主動巡檢遙測報表",
              size="lg"
            )
            lah-button.mr-1(
              icon="columns",
              :variant="showRightDock ? 'secondary' : 'outline-secondary'",
              size="lg",
              no-icon-gutter,
              :title="showRightDock ? '隱藏右側戰情側欄（展開滿版）' : '顯示右側斷線時間軸與事件流側欄'",
              @click="showRightDock = !showRightDock"
            )
            lah-button(
              :icon="isDarkMode ? 'sun' : 'moon'",
              :variant="isDarkMode ? 'outline-warning' : 'outline-secondary'",
              size="lg",
              no-icon-gutter,
              :title="isDarkMode ? '切換為淺色模式' : '切換為深色戰情室模式'",
              @click="toggleTheme"
            )

  //- 說明 Modal
  lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="即時全國地所跨域主機監控 — 管理者戰情室指南", scrollable)
    h6.font-weight-bold.text-primary
      lah-fa-icon.mr-1(icon="satellite-dish")
      span 主動式佇列巡檢引擎（Active Patrol Engine）
    ul.mb-3
      li.mb-1 本頁為#[b 資訊管理人員專用]之主動式即時巡檢控制台，採用智慧佇列調度（預設併發數 #[code 1]，可於頂部指標卡動態調校為 #[code 1 / 2 / 4 / 6]），持續對全國各地所跨域 AP（#[code /Land&lt;ID&gt;/]）發送真實 HTTP 探測。
      li.mb-1 #[b 快取預熱啟動]：開啟頁面瞬間會先載入後端最新快取作為基準狀態，免去等待首輪巡檢的空白期；隨後由巡檢佇列逐一覆寫為即時實測數據。
      li.mb-1 #[b 智慧重試與頻率]：連線逾時或失敗時自動排入高優先重試（5 秒後重測）；正常站點依設定之巡檢節奏（快速 / 標準 / 溫和）自動循環巡檢。

    h6.font-weight-bold.text-success
      lah-fa-icon.mr-1(icon="chart-line")
      span 多點遙測指標與防跳動設計
    ul.mb-3
      li.mb-1 #[b 穩定戰情排序（不亂跳、不隱藏）]：修正舊版因每次更新時間戳記而導致方塊每秒劇烈跳動的問題！連線正常站點絕不隱藏，連線有問題之站點（斷線/逾時）永遠自動置頂於畫面最前，正常站點緊隨其後。
      li.mb-1 #[b 8 點探測軌跡條（Mini Sparkline）]：每個站點方塊底部會即時繪製最近 8 次探測之回應時間長條圖（綠：&lt;400ms、黃：400~1000ms、紅：異常或 &gt;1000ms）。
      li.mb-1 #[b 釘選重點監控（📌 Pin）]：點擊方塊或詳情視窗內的圖釘，可將特定問題地所「釘選置頂」並縮短其巡檢間隔。

    h6.font-weight-bold.text-info
      lah-fa-icon.mr-1(icon="columns")
      span 右側三合一戰情側欄
    ul.mb-0
      li.mb-1 #[b 🕒 斷線紀錄]：整合全所共用之伺服器離線歷史時間軸（#[code lah-office-down-timeline]）。
      li.mb-1 #[b 📡 巡檢事件流]：即時記錄本次開啟頁面期間捕獲的每一次「斷線警報 (UP→DOWN)」、「恢復連線 (DOWN→UP)」與「高延遲尖峰 (&gt;1200ms)」。
      li.mb-1 #[b 🔥 延遲排行]：即時統計全國回應最慢 Top 10 地所與 24h 斷線頻率排行，協助管理員快速定位網路瓶頸。

  //- 初次載入中提示
  .center.h-50(v-if="officesData.length === 0")
    lah-fa-icon(icon="spinner", action="spin", size="3x", variant="primary")
    .mt-2.font-weight-bold.text-primary 正在初始化全國站點與巡檢佇列...

  //- 主要內容區塊
  b-row.monitor-main-row.no-gutters(v-else)
    //- 左側：戰情主面板 (依側欄開關佔 9 或 12 欄)
    b-col.main-panel-col.px-3.pb-3(cols="12", :lg="showRightDock ? 9 : 12")
      //- =========================================================
      //- 1. 即時巡檢進度條與目前探測目標 (Live Patrol Status Strip)
      //- =========================================================
      .patrol-status-strip.px-3.py-1.mt-2.mb-2.rounded.border.d-flex.flex-wrap.justify-content-between.align-items-center
        .d-flex.align-items-center.flex-wrap.my-1
          b-badge.mr-2(
            :variant="isPatrolPaused ? 'warning' : 'primary'",
            pill
          ) 第 {{ patrolRound }} 輪巡檢 ({{ roundProgressPct }}%)
          span.small.font-weight-bold.mr-2(v-if="!isPatrolPaused && processingIds.length > 0")
            lah-fa-icon.mr-1(icon="satellite-dish", variant="info", action="breath")
            span 正在探測：
          template(v-if="!isPatrolPaused && processingIds.length > 0")
            b-badge.mr-1(
              v-for="pid in processingIds",
              :key="pid",
              variant="info",
              pill
            )
              lah-fa-icon.mr-1(icon="spinner", action="spin")
              span {{ pid }} {{ getShortOfficeNameById(pid) }}
          span.small.text-muted(v-else-if="isPatrolPaused") 佇列已暫停，可點擊個別地所手動探測
          span.small.text-muted(v-else) 等待下一批排程觸發...

        .d-flex.align-items-center.small.text-muted.my-1
          span.mr-3 待測佇列：#[strong {{ updateQueue.length }}] 所
          span.mr-3 累計探測：#[strong {{ totalProbesCount }}] 次
          span 全國均速：#[strong(:class="nationalAvgLatency > 600 ? 'text-warning-dark' : 'text-success'") {{ nationalAvgLatency }} ms]

      //- =========================================================
      //- 2. 管理者 6 大互動式遙測指標卡 (Admin Telemetry KPI Cards)
      //- =========================================================
      section.kpi-dashboard.mb-2
        .row.no-gutters.mx-n1
          //- (1) 全國即時連通率
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(
              :class="{ 'kpi-active kpi-primary': quickFilter === '' }",
              title="點擊顯示全部監控地所",
              @click="setQuickFilter('')"
            )
              .d-flex.justify-content-between.align-items-center
                .kpi-label.text-muted.small.font-weight-bold 全國即時連通率
                lah-fa-icon.text-primary.flex-shrink-0(icon="network-wired", size="lg")
              .kpi-value-row.mt-1
                span.h4.font-weight-bold.mb-0.text-nowrap(:class="red.length === 0 ? 'text-success' : 'text-danger'") {{ availabilityRate }}%
                span.small.text-muted.ml-1.text-nowrap ({{ green.length }}/{{ officesData.length }})
                span.small.ml-auto.badge.badge-light.text-nowrap 顯示 {{ filteredOffices.length }}

          //- (2) 異常與逾時重試 (連線有問題始終置頂排在最前，不隱藏正常站點)
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(
              :class="{ 'border-danger bg-danger-subtle': red.length > 0 }",
              title="連線有問題之地所自動置頂於畫面最前方；點擊可立即插隊優先重測",
              @click="handleUrgentKpiClick"
            )
              .d-flex.justify-content-between.align-items-center
                .kpi-label.small.font-weight-bold(:class="red.length > 0 ? 'text-danger' : 'text-muted'") 異常 / 逾時重試
                lah-fa-icon.flex-shrink-0(
                  :icon="red.length > 0 ? 'circle-xmark' : 'circle-check'",
                  :variant="red.length > 0 ? 'danger' : (yellow.length > 0 ? 'warning' : 'success')",
                  :action="red.length > 0 ? 'breath' : ''",
                  size="lg"
                )
              .kpi-value-row.mt-1
                span.h4.font-weight-bold.mb-0.text-nowrap(:class="red.length > 0 ? 'text-danger' : 'text-success'") {{ red.length }}
                span.small.text-muted.ml-1.text-nowrap 斷線
                span.small.ml-1.text-warning-dark.font-weight-bold.text-nowrap(v-if="yellow.length > 0") / {{ yellow.length }} 逾時
                b-badge.ml-auto.pointer.text-nowrap.flex-shrink-0(
                  v-if="red.length + yellow.length > 0",
                  variant="danger",
                  pill,
                  title="立即插隊重測所有異常與逾時站點",
                  @click.stop="prioritizeUrgentSites"
                ) ⚡ 優先測
                span.small.ml-auto.text-success.text-nowrap(v-else) 置頂中

          //- (3) 高延遲慢速站點 (>= 600ms)
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(
              :class="{ 'kpi-active kpi-warning': quickFilter === 'slow' }",
              title="點擊篩選回應延遲 >= 600ms 之慢速地所",
              @click="setQuickFilter('slow')"
            )
              .d-flex.justify-content-between.align-items-center
                .kpi-label.text-muted.small.font-weight-bold 慢速回應 (≥600ms)
                lah-fa-icon.flex-shrink-0(
                  icon="gauge-simple-high",
                  :variant="slowOfficeIds.length > 0 ? 'warning' : 'secondary'",
                  size="lg"
                )
              .kpi-value-row.mt-1
                span.h4.font-weight-bold.mb-0.text-nowrap(:class="slowOfficeIds.length > 0 ? 'text-warning-dark' : 'text-secondary'") {{ slowOfficeIds.length }}
                span.small.text-muted.ml-1.text-nowrap 所
                span.small.ml-auto.text-truncate.text-muted(
                  v-if="slowestSite",
                  style="max-width: 95px;",
                  :title="`目前最慢：${slowestSite.id} ${slowestSite.name} (${slowestSite.latency} ms)`"
                ) 最慢:{{ slowestSite.shortName }}({{ slowestSite.latency }}ms)
                span.small.ml-auto.text-muted.text-nowrap(v-else) 均速 {{ nationalAvgLatency }}ms

          //- (4) 狀態震盪 / 24h 瞬斷熱點
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(
              :class="{ 'kpi-active kpi-warning': quickFilter === 'flaky' }",
              title="點擊篩選本次巡檢發生過失敗或 24h 內曾斷線之不穩定地所",
              @click="setQuickFilter('flaky')"
            )
              .d-flex.justify-content-between.align-items-center
                .kpi-label.text-muted.small.font-weight-bold 震盪 / 24h 曾斷線
                lah-fa-icon.flex-shrink-0(
                  icon="bolt",
                  :variant="unstableOfficeIds.length > 0 ? 'warning' : 'secondary'",
                  size="lg"
                )
              .kpi-value-row.mt-1
                span.h4.font-weight-bold.mb-0.text-nowrap(:class="unstableOfficeIds.length > 0 ? 'text-warning-dark' : 'text-secondary'") {{ unstableOfficeIds.length }}
                span.small.text-muted.ml-1.text-nowrap 所
                span.small.ml-auto.text-muted.text-nowrap 事件流 {{ patrolEvents.length }} 筆

          //- (5) 桃園市 8 所專區
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(
              :class="{ 'kpi-active kpi-info': quickFilter === 'taoyuan', 'border-danger': taoyuanDownCount > 0 }",
              title="點擊僅顯示桃園市 8 所 (HA~HH) 即時遙測",
              @click="setQuickFilter('taoyuan')"
            )
              .d-flex.justify-content-between.align-items-center
                .kpi-label.small.font-weight-bold(:class="taoyuanDownCount > 0 ? 'text-danger' : 'text-info'") 桃園市 8 所遙測
                lah-fa-icon.flex-shrink-0(
                  icon="map-marker-alt",
                  :variant="taoyuanDownCount > 0 ? 'danger' : 'info'",
                  size="lg"
                )
              .kpi-value-row.mt-1
                span.h4.font-weight-bold.mb-0.text-nowrap(:class="taoyuanDownCount > 0 ? 'text-danger' : 'text-info'") {{ 8 - taoyuanDownCount }}/8
                span.small.text-muted.ml-1.text-nowrap ({{ taoyuanAvgLatency }}ms)
                b-badge.ml-auto.pointer.text-nowrap.flex-shrink-0(
                  variant="info",
                  pill,
                  title="將桃園市 8 所排入佇列最前端立即重測",
                  @click.stop="prioritizeTaoyuanSites"
                ) ⚡ 測本市

          //- (6) 巡檢佇列調校器 (Admin Queue Tuner)
          .col-6.col-md-4.col-xl-2.px-1.mb-2
            .kpi-card.p-2.rounded.shadow-sm(@click.stop)
              .d-flex.justify-content-between.align-items-center
                .kpi-label.text-muted.small.font-weight-bold 佇列併發與節奏
                lah-fa-icon.text-secondary.flex-shrink-0(icon="sliders", size="lg")
              .d-flex.align-items-center.justify-content-between.mt-1.flex-nowrap
                b-button-group(size="sm", title="調整同時發送 HTTP 探測之最大併發連線數")
                  b-button(
                    v-for="c in [1, 2, 4, 6]",
                    :key="c",
                    :variant="maxConcurrent === c ? 'primary' : 'outline-secondary'",
                    class="px-1 py-0",
                    :title="`${c} 路併發`",
                    @click="setMaxConcurrent(c)"
                  ) {{ c }}
                b-form-select.ml-1(
                  v-model="patrolPace",
                  :options="paceOptions",
                  size="sm",
                  style="min-width: 65px; max-width: 76px; height: 24px; padding: 0 2px; font-size: 0.72rem;",
                  title="調整正常站點完成探測後的下次輪巡間隔"
                )

      //- =========================================================
      //- 3. 智慧搜尋與複合篩選工具列 (Smart Filter Bar)
      //- =========================================================
      section.filter-toolbar.p-2.mb-2.rounded.shadow-sm.border
        .d-flex.flex-wrap.align-items-center.justify-content-between
          .d-flex.flex-wrap.align-items-center.flex-grow-1.mr-2
            //- 關鍵字搜尋
            b-input-group.mr-2.mb-1.mb-md-0(size="sm", style="width: 230px;")
              template(#prepend)
                b-input-group-text
                  lah-fa-icon(icon="search", variant="secondary")
              b-form-input(
                ref="searchInput",
                v-model.trim="keyword",
                placeholder="搜尋地所、代碼、縣市 (按 /)",
                @keydown.esc="keyword = ''"
              )
              template(#append, v-if="keyword")
                b-button(variant="outline-secondary", @click="keyword = ''")
                  lah-fa-icon(icon="times")

            //- 區域快篩
            b-button-group.mr-2.mb-1.mb-md-0(size="sm")
              b-button(
                v-for="reg in regionOptions",
                :key="reg.value",
                :variant="regionFilter === reg.value ? 'primary' : 'outline-secondary'",
                @click="regionFilter = reg.value"
              ) {{ reg.text }}

            //- 縣市下拉
            b-input-group.mr-2.mb-1.mb-md-0(size="sm", prepend="縣市", style="width: 185px;")
              b-form-select(v-model="countyFilter", :options="countySelectOptions")

            //- 排序方式
            b-input-group.mr-2.mb-1.mb-md-0(size="sm", prepend="排序", style="width: 215px;")
              b-form-select(v-model="sortMode", :options="sortModeOptions")

          .d-flex.align-items-center.flex-nowrap
            b-form-checkbox.mr-2(v-model="displayShortName", switch, size="sm")
              span.small.font-weight-bold 顯示別名
            b-badge.mr-2.d-none.d-sm-inline-block(
              :variant="red.length + yellow.length > 0 ? 'danger' : 'outline-success'",
              pill
            )
              | {{ red.length + yellow.length > 0 ? `⚠️ 有問題優先置頂 (${red.length + yellow.length}所)` : '全數連線正常 (108所)' }}
            b-button(
              v-if="hasActiveFilters",
              size="sm",
              variant="outline-danger",
              @click="resetAllFilters"
            )
              lah-fa-icon.mr-1(icon="times")
              span 重置

      //- =========================================================
      //- 視圖一：遙測方塊視圖 (NOC Telemetry Tile Grid)
      //- =========================================================
      transition-group.dashboard-grid(
        v-if="viewMode === 'telemetry'",
        name="list",
        tag="div"
      )
        .telemetry-tile(
          v-for="office in filteredOffices",
          :key="office.ID",
          :class="tileStatusClass(office.ID)",
          @click="openOfficeModal(office)"
        )
          //- 第一列：縣市標籤 + 代碼 + 釘選/插隊按鈕 + 即時延遲
          .d-flex.justify-content-between.align-items-center.w-100
            .d-flex.align-items-center
              span.county-tag(:class="office.ID.startsWith('H') ? 'county-tag-ty' : ''") {{ getCountyShortName(office.ID) }}
              span.site-id-code.ml-1 {{ office.ID }}
              b-badge.ml-1(
                v-if="isPinned(office.ID)",
                variant="primary",
                pill,
                title="已釘選為重點觀察站點"
              ) 📌
            .d-flex.align-items-center
              //- 最新延遲標籤
              span.latency-pill.mr-1(
                v-if="getOfficeTelemetry(office.ID).lastLatency > 0",
                :class="latencyColorClass(getOfficeTelemetry(office.ID).lastLatency, getOfficeState(office.ID).status)"
              ) {{ getOfficeTelemetry(office.ID).lastLatency }}ms
              //- 插隊即測按鈕
              b-button.tile-action-btn.p-0.mr-1(
                size="sm",
                variant="link",
                title="立即插隊探測此站點",
                :disabled="isSiteProbing(office.ID)",
                @click.stop="manualProbeSite(office.ID)"
              )
                lah-fa-icon(
                  :icon="isSiteProbing(office.ID) ? 'spinner' : 'bolt'",
                  :action="isSiteProbing(office.ID) ? 'spin' : ''",
                  :variant="getOfficeState(office.ID).status < 0 ? 'danger' : 'info'"
                )
              //- 釘選按鈕
              b-button.tile-action-btn.p-0(
                size="sm",
                variant="link",
                :title="isPinned(office.ID) ? '取消釘選' : '釘選置頂此站點'",
                @click.stop="togglePin(office.ID)"
              )
                lah-fa-icon(
                  icon="thumbtack",
                  :variant="isPinned(office.ID) ? 'primary' : 'secondary'"
                )

          //- 第二列：狀態燈號 + 地所名稱
          .d-flex.align-items-center.justify-content-center.my-1.w-100
            lah-fa-icon.mr-1(
              v-if="isSiteProbing(office.ID)",
              icon="spinner",
              variant="info",
              action="spin"
            )
            lah-fa-icon.mr-1(
              v-else-if="getOfficeState(office.ID).status > 0",
              icon="circle-check",
              variant="success"
            )
            lah-fa-icon.mr-1(
              v-else-if="getOfficeState(office.ID).status === 0",
              icon="triangle-exclamation",
              variant="warning",
              action="breath"
            )
            lah-fa-icon.mr-1(
              v-else-if="getOfficeState(office.ID).status === -1",
              icon="circle-xmark",
              variant="danger",
              action="breath"
            )
            lah-fa-icon.mr-1(
              v-else,
              icon="clock",
              variant="secondary"
            )
            span.office-name.font-weight-bold.text-truncate {{ formatOfficeName(office) }}

          //- 第三列：錯誤訊息 或 8點探測軌跡條 + 相對更新時間
          .w-100.mt-auto
            .error-msg.text-truncate(
              v-if="getOfficeState(office.ID).status <= 0 && getOfficeState(office.ID).status !== -2",
              :title="getOfficeState(office.ID).message"
            ) {{ getOfficeState(office.ID).message || '連線異常 / 逾時' }}

            .d-flex.justify-content-between.align-items-end.w-100(v-else)
              //- 最近 8 次探測迷你長條軌跡 (Sparkline)
              .probe-sparkline.d-flex.align-items-end(
                :title="`平均延遲: ${getOfficeTelemetry(office.ID).avgLatency || '--'}ms | 成功率: ${getOfficeTelemetry(office.ID).uptimeRate}% (${getOfficeTelemetry(office.ID).probeCount}次)`"
              )
                span.spark-bar(
                  v-for="(pt, pIdx) in getSparklinePoints(office.ID)",
                  :key="pIdx",
                  :class="pt.cls",
                  :style="{ height: pt.height }"
                )
              .updated-time.text-right
                span(v-if="getOfficeState(office.ID).timestamp > 0") {{ formatAgo(getOfficeState(office.ID).timestamp) }}
                span(v-else) 待巡檢

      //- =========================================================
      //- 視圖二：縣市戰情視圖 (County Matrix View)
      //- =========================================================
      div(v-else-if="viewMode === 'county'")
        .d-flex.justify-content-between.align-items-center.mb-2
          .small.text-muted
            lah-fa-icon.mr-1(icon="layer-group", variant="primary")
            span 依縣市歸納共 #[strong {{ countyGroups.length }}] 個轄區（智慧無縫瀑布流填補，異常縣市與桃園置頂）
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
            b-card.county-card.mb-3.shadow-sm(
              v-for="group in col",
              :key="group.countyCode",
              no-body,
              :class="{ 'border-danger': group.downCount > 0, 'border-info': group.countyCode === 'H' && group.downCount === 0 }"
            )
              b-card-header.county-card-header.py-2.px-3.pointer(
                :class="{ 'bg-danger-subtle': group.downCount > 0 }",
                @click="toggleCountyCollapse(group.countyCode)"
              )
                .d-flex.justify-content-between.align-items-center.flex-nowrap
                  .d-flex.align-items-center.text-truncate.mr-2
                    lah-fa-icon.mr-1(
                      :icon="isCountyCollapsed(group.countyCode) ? 'chevron-right' : 'chevron-down'",
                      variant="secondary"
                    )
                    b-badge.mr-1(:variant="group.countyCode === 'H' ? 'info' : 'secondary'") {{ group.regionName }}
                    h6.mb-0.font-weight-bold.text-truncate.mr-1 {{ group.countyName }} ({{ group.countyCode }})
                    b-badge(:variant="group.downCount > 0 ? 'danger' : 'success'", pill)
                      | {{ group.downCount > 0 ? `異常 ${group.downCount}` : `${group.offices.length}所正常` }}
                  .d-flex.align-items-center.flex-shrink-0(@click.stop)
                    span.small.font-weight-bold.text-muted.mr-2(v-if="group.avgLatency > 0") {{ group.avgLatency }}ms
                    b-button(
                      size="sm",
                      variant="outline-info",
                      class="py-0 px-2 s-80",
                      title="將此縣市所有地所排入佇列最前端優先探測",
                      @click="prioritizeCountySites(group.offices)"
                    )
                      lah-fa-icon.mr-1(icon="bolt")
                      span 巡檢

              b-collapse(:visible="!isCountyCollapsed(group.countyCode)")
                b-card-body.p-2
                  .county-sub-grid
                    .county-sub-cell(
                      v-for="office in group.offices",
                      :key="office.ID",
                      :class="tileStatusClass(office.ID)",
                      @click="openOfficeModal(office)"
                    )
                      .d-flex.justify-content-between.align-items-center
                        .d-flex.align-items-center.min-w-0
                          lah-fa-icon.mr-1(
                            v-if="isSiteProbing(office.ID)",
                            icon="spinner",
                            variant="info",
                            action="spin"
                          )
                          lah-fa-icon.mr-1(
                            v-else-if="getOfficeState(office.ID).status > 0",
                            icon="circle-check",
                            variant="success"
                          )
                          lah-fa-icon.mr-1(
                            v-else-if="getOfficeState(office.ID).status === 0",
                            icon="triangle-exclamation",
                            variant="warning",
                            action="breath"
                          )
                          lah-fa-icon.mr-1(
                            v-else,
                            icon="circle-xmark",
                            variant="danger",
                            action="breath"
                          )
                          span.font-weight-bold.text-truncate.s-90 {{ formatOfficeName(office) }}
                        span.site-id-code.s-80.ml-1 {{ office.ID }}
                      .d-flex.justify-content-between.align-items-center.mt-1
                        span.latency-pill.s-80(
                          v-if="getOfficeTelemetry(office.ID).lastLatency > 0",
                          :class="latencyColorClass(getOfficeTelemetry(office.ID).lastLatency, getOfficeState(office.ID).status)"
                        ) {{ getOfficeTelemetry(office.ID).lastLatency }}ms
                        span.text-muted.s-75(v-else) 待測
                        span.text-muted.s-75 {{ formatAgo(getOfficeState(office.ID).timestamp) }}

      //- =========================================================
      //- 視圖三：管理者遙測數據表 (Admin Telemetry Table View)
      //- =========================================================
      b-card.shadow-sm(v-else-if="viewMode === 'table'", no-body)
        b-card-header.py-2.px-3.d-flex.flex-wrap.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.mr-1(icon="table", variant="primary")
            span.font-weight-bold 主動巡檢即時遙測數據表
            b-badge.ml-2(variant="primary", pill) {{ filteredOffices.length }} 所
          .d-flex.align-items-center
            b-input-group.mr-2(size="sm", prepend="每頁", style="width: 115px;")
              b-form-select(v-model="tablePerPage", :options="[15, 30, 50, 120]")
            b-pagination.mb-0(
              v-model="tableCurrentPage",
              :total-rows="tableItems.length",
              :per-page="tablePerPage",
              size="sm",
              limit="5"
            )

        b-table.mb-0(
          :items="tableItems",
          :fields="tableFields",
          :current-page="tableCurrentPage",
          :per-page="tablePerPage",
          striped,
          hover,
          responsive,
          small,
          head-variant="dark",
          primary-key="ID",
          :tbody-tr-class="tableRowClass",
          @row-clicked="openOfficeModal"
        )
          template(#cell(ID)="{ item }")
            .d-flex.align-items-center
              b-badge(:variant="item.ID.startsWith('H') ? 'info' : 'secondary'") {{ item.ID }}
              span.ml-1(v-if="isPinned(item.ID)") 📌

          template(#cell(county)="{ item }")
            span {{ getCountyName(item.ID) }}

          template(#cell(NAME)="{ item }")
            span.font-weight-bold {{ item.NAME }}

          template(#cell(status)="{ item }")
            b-badge(v-if="isSiteProbing(item.ID)", variant="info", pill)
              lah-fa-icon.mr-1(icon="spinner", action="spin")
              span 探測中
            b-badge(v-else-if="item.status > 0", variant="success", pill) 🟢 正常
            b-badge(v-else-if="item.status === 0", variant="warning", pill) 🟡 逾時重試
            b-badge(v-else-if="item.status === -1", variant="danger", pill) 🔴 異常
            b-badge(v-else, variant="secondary", pill) ⚪ 待測

          template(#cell(lastLatency)="{ item }")
            span.latency-pill(
              v-if="item.lastLatency > 0",
              :class="latencyColorClass(item.lastLatency, item.status)"
            ) {{ item.lastLatency }} ms
            span.text-muted(v-else) --

          template(#cell(avgLatency)="{ item }")
            span(v-if="item.avgLatency > 0") {{ item.avgLatency }} ms
              small.text-muted.ml-1 (峰 {{ item.maxLatency }}ms)
            span.text-muted(v-else) --

          template(#cell(uptimeRate)="{ item }")
            span(
              v-if="item.probeCount > 0",
              :class="item.uptimeRate < 100 ? 'text-danger font-weight-bold' : 'text-success'"
            ) {{ item.uptimeRate }}% ({{ item.probeCount - item.failCount }}/{{ item.probeCount }})
            span.text-muted(v-else) 尚未實測

          template(#cell(sparkline)="{ item }")
            .probe-sparkline.d-inline-flex.align-items-end
              span.spark-bar(
                v-for="(pt, pIdx) in getSparklinePoints(item.ID)",
                :key="pIdx",
                :class="pt.cls",
                :style="{ height: pt.height }"
              )

          template(#cell(timestamp)="{ item }")
            span.small {{ item.timestamp > 0 ? formatAgo(item.timestamp) : '--' }}

          template(#cell(actions)="{ item }")
            .d-flex.justify-content-center(@click.stop)
              b-button.mr-1(
                size="sm",
                variant="outline-info",
                title="立即插隊探測",
                :disabled="isSiteProbing(item.ID)",
                @click="manualProbeSite(item.ID)"
              )
                lah-fa-icon(icon="bolt")
              b-button(
                size="sm",
                :variant="isPinned(item.ID) ? 'primary' : 'outline-secondary'",
                title="釘選置頂",
                @click="togglePin(item.ID)"
              )
                lah-fa-icon(icon="thumbtack")

    //- =========================================================
    //- 右側：三合一管理戰情側欄 (Right Admin Dock, 佔 1/4)
    //- =========================================================
    b-col.right-dock-col.p-0.bg-light.border-left(
      v-if="showRightDock",
      cols="12",
      lg="3"
    )
      .timeline-container.d-flex.flex-column.p-2
        //- 側欄頂部三頁籤切換
        b-button-group.mb-2.w-100(size="sm")
          b-button(
            :variant="rightTab === 'timeline' ? 'primary' : 'outline-secondary'",
            @click="rightTab = 'timeline'"
          )
            lah-fa-icon.mr-1(icon="link-slash")
            span 斷線紀錄
          b-button(
            :variant="rightTab === 'events' ? 'primary' : 'outline-secondary'",
            @click="rightTab = 'events'"
          )
            lah-fa-icon.mr-1(icon="satellite-dish")
            span 巡檢事件
            b-badge.ml-1(v-if="patrolEvents.length > 0", variant="danger", pill) {{ patrolEvents.length }}
          b-button(
            :variant="rightTab === 'leaderboard' ? 'primary' : 'outline-secondary'",
            @click="rightTab = 'leaderboard'"
          )
            lah-fa-icon.mr-1(icon="fire")
            span 延遲排行

        //- Tab 1: 伺服器斷線紀錄時間軸 (既有組件)
        .flex-grow-1.overflow-hidden(v-show="rightTab === 'timeline'")
          lah-office-down-timeline(hide-footer).h-100.overflow-auto

        //- Tab 2: 即時巡檢事件流 (Live Patrol Event Feed)
        b-card.flex-grow-1.d-flex.flex-column.overflow-hidden.shadow-sm(
          v-if="rightTab === 'events'",
          no-body
        )
          b-card-header.py-2.px-3.d-flex.justify-content-between.align-items-center
            span.font-weight-bold.small 📡 即時狀態異動與慢速告警流
            b-button(
              v-if="patrolEvents.length > 0",
              size="sm",
              variant="link",
              class="p-0 text-muted",
              @click="patrolEvents = []"
            ) 清空
          .flex-grow-1.overflow-auto.p-2
            .text-center.text-muted.py-5.small(v-if="patrolEvents.length === 0")
              lah-fa-icon.mb-2(icon="check-circle", variant="success", size="2x")
              div 本次巡檢期間尚無斷線或劇烈延遲事件
            b-list-group(v-else, flush)
              b-list-group-item.px-2.py-2.pointer(
                v-for="(ev, eIdx) in patrolEvents",
                :key="ev.id || eIdx",
                @click="openOfficeModalById(ev.siteId)"
              )
                .d-flex.justify-content-between.align-items-center
                  b-badge(:variant="ev.variant", pill) {{ ev.tag }}
                  small.text-muted.text-monospace {{ ev.time }}
                .font-weight-bold.small.mt-1 {{ ev.siteId }} {{ ev.siteName }}
                .small.text-muted.text-truncate {{ ev.detail }}

        //- Tab 3: 回應延遲 Top 10 與不穩定排行
        b-card.flex-grow-1.d-flex.flex-column.overflow-hidden.shadow-sm(
          v-if="rightTab === 'leaderboard'",
          no-body
        )
          b-card-header.py-2.px-3.font-weight-bold.small 🔥 即時回應最慢 Top 10 地所
          .flex-grow-1.overflow-auto.p-2
            .text-center.text-muted.py-4.small(v-if="topSlowestList.length === 0") 尚無延遲實測數據
            .mb-2.p-2.rounded.border.pointer(
              v-for="(item, sIdx) in topSlowestList",
              :key="item.ID",
              @click="openOfficeModalById(item.ID)"
            )
              .d-flex.justify-content-between.align-items-center.small
                span.font-weight-bold
                  b-badge.mr-1(:variant="sIdx < 3 ? 'warning' : 'secondary'") {{ sIdx + 1 }}
                  span {{ item.ID }} {{ item.NAME }}
                span.latency-pill(:class="latencyColorClass(item.lastLatency, item.status)") {{ item.lastLatency }} ms
              b-progress.mt-1(
                :value="Math.min(100, Math.round((item.lastLatency / 1500) * 100))",
                :variant="item.lastLatency >= 1000 ? 'danger' : (item.lastLatency >= 600 ? 'warning' : 'info')",
                height="5px"
              )

  //- =========================================================
  //- 管理者單所深度遙測診斷視窗 (Admin Deep Telemetry Modal)
  //- =========================================================
  b-modal(
    id="admin-office-modal",
    size="lg",
    centered,
    scrollable,
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center(v-if="selectedOffice")
        lah-fa-icon.mr-2(
          :icon="getOfficeState(selectedOffice.ID).status > 0 ? 'circle-check' : 'circle-xmark'",
          :variant="getOfficeState(selectedOffice.ID).status > 0 ? 'success' : 'danger'"
        )
        span.font-weight-bold {{ selectedOffice.ID }} {{ selectedOffice.NAME }} — 主動巡檢遙測診斷
        b-badge.ml-2(variant="secondary") {{ getCountyName(selectedOffice.ID) }}

    div(v-if="selectedOffice")
      //- 快速操作列
      .d-flex.justify-content-between.align-items-center.mb-3.pb-2.border-bottom
        .d-flex.align-items-center
          b-button.mr-2(
            size="sm",
            :variant="isPinned(selectedOffice.ID) ? 'primary' : 'outline-secondary'",
            @click="togglePin(selectedOffice.ID)"
          )
            lah-fa-icon.mr-1(icon="thumbtack")
            span {{ isPinned(selectedOffice.ID) ? '已釘選置頂' : '釘選為重點監控' }}
          b-button(
            size="sm",
            variant="outline-secondary",
            @click="copyAdminDiag(selectedOffice, $event)"
          )
            lah-fa-icon.mr-1(icon="copy")
            span 複製遙測報告

        b-button(
          size="sm",
          variant="info",
          :disabled="isSiteProbing(selectedOffice.ID)",
          @click="manualProbeSite(selectedOffice.ID, true)"
        )
          lah-fa-icon.mr-1(
            :icon="isSiteProbing(selectedOffice.ID) ? 'spinner' : 'bolt'",
            :action="isSiteProbing(selectedOffice.ID) ? 'spin' : ''"
          )
          span {{ isSiteProbing(selectedOffice.ID) ? '正在探測...' : '立即插隊強制探測' }}

      //- 遙測統計 4 格數據卡
      .row.no-gutters.mx-n1.mb-3
        .col-6.col-md-3.px-1.mb-2
          .p-2.rounded.border.text-center
            .small.text-muted 最新回應延遲
            .h5.font-weight-bold.mb-0.text-info {{ getOfficeTelemetry(selectedOffice.ID).lastLatency || '--' }} ms
        .col-6.col-md-3.px-1.mb-2
          .p-2.rounded.border.text-center
            .small.text-muted 平均 / 峰值延遲
            .h5.font-weight-bold.mb-0 {{ getOfficeTelemetry(selectedOffice.ID).avgLatency || '--' }} / {{ getOfficeTelemetry(selectedOffice.ID).maxLatency || '--' }} ms
        .col-6.col-md-3.px-1.mb-2
          .p-2.rounded.border.text-center
            .small.text-muted 本次巡檢成功率
            .h5.font-weight-bold.mb-0(:class="getOfficeTelemetry(selectedOffice.ID).uptimeRate < 100 ? 'text-danger' : 'text-success'")
              | {{ getOfficeTelemetry(selectedOffice.ID).uptimeRate }}% ({{ getOfficeTelemetry(selectedOffice.ID).probeCount }}次)
        .col-6.col-md-3.px-1.mb-2
          .p-2.rounded.border.text-center
            .small.text-muted 連續失敗 / 24h斷線
            .h5.font-weight-bold.mb-0(:class="getOfficeTelemetry(selectedOffice.ID).consecutiveFails > 0 ? 'text-danger' : ''")
              | {{ getOfficeTelemetry(selectedOffice.ID).consecutiveFails }} 次 / {{ getDown24hCount(selectedOffice.ID) }} 次

      //- 端點與最新 HTTP Header
      b-card.mb-3(no-body)
        b-card-header.py-1.px-3.small.font-weight-bold
          span 🌐 探測端點：http://{{ webapIp }}/Land{{ selectedOffice.ID }}/
        b-card-body.p-2.bg-dark.text-light.text-monospace.small
          div(v-if="getOfficeState(selectedOffice.ID).headers && getOfficeState(selectedOffice.ID).headers.length > 0")
            div(v-for="(hLine, hIdx) in getOfficeState(selectedOffice.ID).headers", :key="hIdx") {{ hLine }}
          div(v-else) {{ getOfficeState(selectedOffice.ID).message || '尚無 HTTP Header 紀錄' }}

      //- 本次開啟頁面期間之探測歷史紀錄
      h6.font-weight-bold.mb-2
        lah-fa-icon.mr-1(icon="wave-square", variant="primary")
        span 本次巡檢探測軌跡紀錄 (最近 {{ (getOfficeTelemetry(selectedOffice.ID).history || []).length }} 次)
      b-table.mb-0(
        :items="[...(getOfficeTelemetry(selectedOffice.ID).history || [])].reverse()",
        :fields="probeHistoryFields",
        small,
        striped,
        bordered,
        show-empty,
        empty-text="尚無即時探測紀錄"
      )
        template(#cell(status)="{ item }")
          b-badge(:variant="item.status > 0 ? 'success' : (item.status === 0 ? 'warning' : 'danger')")
            | {{ item.status > 0 ? 'UP 正常' : (item.status === 0 ? 'TIMEOUT 逾時' : 'DOWN 失敗') }}
        template(#cell(latency)="{ item }")
          span.font-weight-bold {{ item.latency }} ms
</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue'

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
  middleware: ['isInf'],
  data: () => ({
    displayShortName: true,
    viewMode: 'telemetry', // 'telemetry' | 'county' | 'table'
    quickFilter: '', // '' | 'slow' | 'flaky' | 'taoyuan'
    regionFilter: '',
    countyFilter: '',
    keyword: '',
    sortMode: 'stable', // 'stable' | 'latency_desc' | 'avg_latency_desc' | 'fail_desc' | 'recent_desc'
    collapsedCounties: {},
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1440,

    officesData: [],
    officeStateMap: {},
    telemetryMap: {},
    recentDownRecords: [],
    pinnedIds: [],
    red: [],
    green: [],
    yellow: [],
    officeCacheKey: 'connectivity_offices_list',

    // 巡檢佇列控制
    updateQueue: [],
    processingIds: [],
    scheduledTimers: {},
    maxConcurrent: 1,
    patrolPace: 'relaxed', // 'fast' | 'normal' | 'relaxed'
    isPatrolPaused: false,
    patrolRound: 1,
    roundVisitedMap: {},
    totalProbesCount: 0,
    patrolEvents: [],

    // 右側側欄與時鐘更新
    showRightDock: true,
    rightTab: 'timeline', // 'timeline' | 'events' | 'leaderboard'
    nowTick: Date.now(),
    tickTimer: null,
    isDestroyed: false,

    // 暗色模式
    isDarkMode: false,
    compactHeader: false,
    headerNeedWidth: 0,

    // 表格分頁
    tableCurrentPage: 1,
    tablePerPage: 30,
    tableFields: [
      { key: 'ID', label: '代碼', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle' },
      { key: 'county', label: '縣市', sortable: false, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'NAME', label: '地政事務所', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'status', label: '狀態', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'lastLatency', label: '最新延遲', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'avgLatency', label: '平均 / 峰值', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'uptimeRate', label: '巡檢成功率', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'sparkline', label: '近8次軌跡', sortable: false, thClass: 'text-nowrap', tdClass: 'align-middle' },
      { key: 'timestamp', label: '最後探測', sortable: true, thClass: 'text-nowrap', tdClass: 'align-middle text-nowrap' },
      { key: 'actions', label: '操作', sortable: false, thClass: 'text-nowrap text-center', tdClass: 'align-middle text-center' }
    ],

    // 單所深度診斷 Modal
    selectedOfficeId: '',
    probeHistoryFields: [
      { key: 'time', label: '探測時間', thClass: 'text-nowrap' },
      { key: 'status', label: '結果', thClass: 'text-nowrap' },
      { key: 'latency', label: '耗時', thClass: 'text-nowrap' },
      { key: 'message', label: 'HTTP 回應標頭 / 訊息' }
    ],

    // 選單設定
    paceOptions: [
      { text: '高速巡檢', value: 'fast' },
      { text: '標準巡檢', value: 'normal' },
      { text: '溫和巡檢', value: 'relaxed' }
    ],
    regionOptions: [
      { text: '全部', value: '' },
      { text: '北部', value: 'north' },
      { text: '中部', value: 'central' },
      { text: '南部', value: 'south' },
      { text: '東/離島', value: 'east' }
    ],
    sortModeOptions: [
      { text: '預設排序 (有問題置頂›釘選›桃園›代碼)', value: 'stable' },
      { text: '最新延遲 (慢到快，有問題置頂)', value: 'latency_desc' },
      { text: '平均延遲 (慢到快，有問題置頂)', value: 'avg_latency_desc' },
      { text: '失敗次數 (高到低，有問題置頂)', value: 'fail_desc' },
      { text: '最新探測完成置頂 (動態)', value: 'recent_desc' }
    ]
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  computed: {
    headerLight () {
      if (this.red.length > 0) { return 'danger' }
      if (this.yellow.length > 0 || this.isPatrolPaused) { return 'warning' }
      return 'success'
    },
    availabilityRate () {
      if (this.officesData.length === 0) { return '100.0' }
      const rate = (this.green.length / this.officesData.length) * 100
      return rate === 100 ? '100' : rate.toFixed(1)
    },
    roundCompletedCount () {
      return Object.keys(this.roundVisitedMap).length
    },
    roundProgressPct () {
      if (this.officesData.length === 0) { return 0 }
      return Math.min(100, Math.round((this.roundCompletedCount / this.officesData.length) * 100))
    },
    // 全國平均延遲與慢速站點
    nationalAvgLatency () {
      const vals = Object.values(this.telemetryMap)
        .map(t => t.lastLatency)
        .filter(v => v > 0)
      if (vals.length === 0) { return 0 }
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    },
    slowOfficeIds () {
      return Object.entries(this.telemetryMap)
        .filter(([, t]) => t.lastLatency >= 600)
        .map(([id]) => id)
    },
    slowestSite () {
      let top = null
      Object.entries(this.telemetryMap).forEach(([id, t]) => {
        if (t.lastLatency > 0 && (!top || t.lastLatency > top.latency)) {
          const found = this.officesData.find(o => o.ID === id)
          top = {
            id,
            name: found ? found.NAME : id,
            shortName: found ? found.NAME.replace(/(地政事務所|所)/g, '') : id,
            latency: t.lastLatency
          }
        }
      })
      return top
    },
    // 24h 斷線與本次巡檢失敗站點
    down24hMap () {
      const map = {}
      this.recentDownRecords.forEach((rec) => {
        if (!rec || !rec.id || ['CB', 'CC'].includes(rec.id)) { return }
        if (!map[rec.id]) { map[rec.id] = [] }
        map[rec.id].push(rec)
      })
      return map
    },
    unstableOfficeIds () {
      const set = new Set(Object.keys(this.down24hMap))
      Object.entries(this.telemetryMap).forEach(([id, t]) => {
        if (t.failCount > 0) { set.add(id) }
      })
      return [...set]
    },
    // 桃園市 8 所統計
    taoyuanDownCount () {
      return this.officesData
        .filter(o => o.ID.startsWith('H'))
        .filter(o => (this.officeStateMap[o.ID]?.status ?? 1) <= 0 && (this.officeStateMap[o.ID]?.status ?? 1) !== -2)
        .length
    },
    taoyuanAvgLatency () {
      const vals = this.officesData
        .filter(o => o.ID.startsWith('H'))
        .map(o => this.telemetryMap[o.ID]?.lastLatency || 0)
        .filter(v => v > 0)
      if (vals.length === 0) { return 0 }
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    },
    countySelectOptions () {
      const codes = [...new Set(this.officesData.map(o => (o.ID || '').charAt(0)).filter(Boolean))].sort((a, b) => {
        if (a === 'H') { return -1 }
        if (b === 'H') { return 1 }
        return (COUNTY_MAP[a]?.order || 99) - (COUNTY_MAP[b]?.order || 99)
      })
      return [
        { text: `全部縣市 (${this.officesData.length})`, value: '' },
        ...codes.map(c => ({
          text: `${COUNTY_MAP[c]?.name || c} (${c})`,
          value: c
        }))
      ]
    },
    hasActiveFilters () {
      return Boolean(this.keyword || this.quickFilter || this.regionFilter || this.countyFilter || this.sortMode !== 'stable')
    },
    // 過濾與排序後的地所列表 (連線正常絕不隱藏，連線有問題始終置頂排在最前)
    filteredOffices () {
      const kw = (this.keyword || '').toLowerCase()
      const list = this.officesData.filter((office) => {
        const id = office.ID
        const tel = this.telemetryMap[id] || {}

        if (this.quickFilter === 'slow' && (tel.lastLatency || 0) < 600) { return false }
        if (this.quickFilter === 'flaky' && !this.unstableOfficeIds.includes(id)) { return false }
        if (this.quickFilter === 'taoyuan' && !id.startsWith('H')) { return false }

        if (this.regionFilter) {
          const reg = COUNTY_MAP[id.charAt(0)]?.region || ''
          if (reg !== this.regionFilter) { return false }
        }
        if (this.countyFilter && id.charAt(0) !== this.countyFilter) {
          return false
        }
        if (kw) {
          const nameStr = (office.NAME || '').toLowerCase()
          const aliasStr = (office.ALIAS || '').toLowerCase()
          const countyStr = this.getCountyName(id).toLowerCase()
          const msgStr = (this.officeStateMap[id]?.message || '').toLowerCase()
          if (
            !id.toLowerCase().includes(kw) &&
            !nameStr.includes(kw) &&
            !aliasStr.includes(kw) &&
            !countyStr.includes(kw) &&
            !msgStr.includes(kw)
          ) {
            return false
          }
        }
        return true
      })

      return [...list].sort((a, b) => {
        const idA = a.ID
        const idB = b.ID
        const stA = this.officeStateMap[idA] || { status: -2, timestamp: 0 }
        const stB = this.officeStateMap[idB] || { status: -2, timestamp: 0 }
        const telA = this.telemetryMap[idA] || { lastLatency: 0, avgLatency: 0, failCount: 0 }
        const telB = this.telemetryMap[idB] || { lastLatency: 0, avgLatency: 0, failCount: 0 }

        const rankA = this.getProblemRank(idA)
        const rankB = this.getProblemRank(idB)

        // 1. 連線有問題的站點（Rank 0~3：紅燈斷線 -1 與黃燈逾時 0）永遠置頂排在最前面
        const isProblemA = rankA <= 3
        const isProblemB = rankB <= 3

        if (isProblemA || isProblemB) {
          if (rankA !== rankB) {
            return rankA - rankB
          }
          // 同樣為問題站點：桃園市優先，再依代碼固定順序
          const aTaoyuan = idA.startsWith('H')
          const bTaoyuan = idB.startsWith('H')
          if (aTaoyuan && !bTaoyuan) { return -1 }
          if (!aTaoyuan && bTaoyuan) { return 1 }
          return idA.localeCompare(idB)
        }

        // 2. 兩者皆為連線正常（Rank 4~6）時：若管理者切換自訂排序模式
        if (this.sortMode === 'latency_desc') {
          if (telB.lastLatency !== telA.lastLatency) { return telB.lastLatency - telA.lastLatency }
        } else if (this.sortMode === 'avg_latency_desc') {
          if (telB.avgLatency !== telA.avgLatency) { return telB.avgLatency - telA.avgLatency }
        } else if (this.sortMode === 'fail_desc') {
          const fA = telA.failCount + this.getDown24hCount(idA)
          const fB = telB.failCount + this.getDown24hCount(idB)
          if (fB !== fA) { return fB - fA }
        } else if (this.sortMode === 'recent_desc') {
          if (stB.timestamp !== stA.timestamp) { return stB.timestamp - stA.timestamp }
        }

        // 預設穩定排序：釘選正常 (Rank 4) -> 桃園本市正常 (Rank 5) -> 全國其他正常 (Rank 6)
        if (rankA !== rankB) {
          return rankA - rankB
        }

        // 全國其他正常站點：依縣市地理順序，同縣市依代碼順序
        const cCodeA = idA.charAt(0)
        const cCodeB = idB.charAt(0)
        const orderA = COUNTY_MAP[cCodeA]?.order || 99
        const orderB = COUNTY_MAP[cCodeB]?.order || 99
        if (orderA !== orderB) {
          return orderA - orderB
        }

        return idA.localeCompare(idB)
      })
    },
    // 縣市矩陣分組
    countyGroups () {
      const map = {}
      this.filteredOffices.forEach((office) => {
        const cCode = (office.ID || '').charAt(0) || 'Z'
        if (!map[cCode]) {
          const info = COUNTY_MAP[cCode] || { name: cCode, region: 'east', order: 99 }
          map[cCode] = {
            countyCode: cCode,
            countyName: info.name,
            regionName: REGION_NAME_MAP[info.region] || '其他區域',
            order: info.order,
            offices: [],
            downCount: 0,
            latencies: []
          }
        }
        map[cCode].offices.push(office)
        const st = this.officeStateMap[office.ID]?.status ?? 1
        if (st === -1 || st === 0) {
          map[cCode].downCount++
        }
        const lat = this.telemetryMap[office.ID]?.lastLatency || 0
        if (lat > 0) {
          map[cCode].latencies.push(lat)
        }
      })

      return Object.values(map).map(g => ({
        ...g,
        avgLatency: g.latencies.length > 0 ? Math.round(g.latencies.reduce((a, b) => a + b, 0) / g.latencies.length) : 0
      })).sort((a, b) => {
        if (a.downCount > 0 && b.downCount === 0) { return -1 }
        if (a.downCount === 0 && b.downCount > 0) { return 1 }
        if (a.countyCode === 'H' && b.countyCode !== 'H') { return -1 }
        if (a.countyCode !== 'H' && b.countyCode === 'H') { return 1 }
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
    // 表格資料
    tableItems () {
      return this.filteredOffices.map((o) => {
        const st = this.getOfficeState(o.ID)
        const tel = this.getOfficeTelemetry(o.ID)
        return {
          ...o,
          status: st.status,
          timestamp: st.timestamp,
          lastLatency: tel.lastLatency,
          avgLatency: tel.avgLatency,
          maxLatency: tel.maxLatency,
          probeCount: tel.probeCount,
          failCount: tel.failCount,
          uptimeRate: tel.uptimeRate
        }
      })
    },
    // 右側側欄：回應最慢 Top 10
    topSlowestList () {
      return this.officesData
        .map(o => ({
          ...o,
          status: this.getOfficeState(o.ID).status,
          lastLatency: this.getOfficeTelemetry(o.ID).lastLatency
        }))
        .filter(o => o.lastLatency > 0)
        .sort((a, b) => b.lastLatency - a.lastLatency)
        .slice(0, 10)
    },
    // 匯出 XLSX 資料
    xlsxData () {
      return this.tableItems.map(item => ({
        地所代碼: item.ID,
        所屬縣市: this.getCountyName(item.ID),
        地政事務所名稱: item.NAME,
        即時連線狀態: item.status > 0 ? 'UP (正常)' : (item.status === 0 ? 'TIMEOUT (逾時)' : 'DOWN (異常)'),
        最新延遲毫秒: item.lastLatency || '',
        平均延遲毫秒: item.avgLatency || '',
        峰值延遲毫秒: item.maxLatency || '',
        巡檢探測次數: item.probeCount,
        巡檢失敗次數: item.failCount,
        巡檢成功率: `${item.uptimeRate}%`,
        過去24h斷線次數: this.getDown24hCount(item.ID)
      }))
    },
    selectedOffice () {
      if (!this.selectedOfficeId) { return null }
      return this.officesData.find(o => o.ID === this.selectedOfficeId) || null
    }
  },
  watch: {
    quickFilter () {
      this.tableCurrentPage = 1
    },
    displayShortName (val) {
      this.setCache('/inf/xap/connectivity/displayShortName', val, 7 * 24 * 60 * 60 * 1000)
    },
    isDarkMode (flag) {
      this.setCache('connectivity-dark-mode', flag)
      this.updateBodyBg(flag)
    },
    // 篩選條件變更時重設表格頁碼為 1（遵守 AGENTS.md 規範）
    keyword () { this.tableCurrentPage = 1 },
    regionFilter () { this.tableCurrentPage = 1 },
    countyFilter () { this.tableCurrentPage = 1 },
    sortMode () { this.tableCurrentPage = 1 },
    tablePerPage () { this.tableCurrentPage = 1 }
  },
  created () {
    // 徹底清除舊版可能殘留之 displayDanger 快取，確保連線正常站點絕不被隱藏
    this.removeCache('/inf/xap/connectivity/displayDanger')
    this.setCache('/inf/xap/connectivity/displayDanger', false)

    this.getCache('/inf/xap/connectivity/displayShortName').then((flag) => {
      if (flag !== null && flag !== undefined) { this.displayShortName = Boolean(flag) }
    })
    this.getCache('connectivity-dark-mode').then((flag) => {
      if (flag !== null && flag !== undefined) {
        this.isDarkMode = Boolean(flag)
        this.updateBodyBg(this.isDarkMode)
      }
    })

    this.prepareOfficesData()
    this.loadRecentDownHistory()
  },
  mounted () {
    this.tickTimer = setInterval(() => {
      this.nowTick = Date.now()
    }, 3000)
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
    this.isDestroyed = true
    this.updateQueue = []
    this.processingIds = []
    clearInterval(this.tickTimer)
    clearTimeout(this.headerCompactTimer)
    if (this.headerRO) {
      this.headerRO.disconnect()
      this.headerRO = null
    }
    Object.values(this.scheduledTimers).forEach(t => clearTimeout(t))
    this.scheduledTimers = {}
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
    toggleCountyCollapse (code) {
      this.$set(this.collapsedCounties, code, !this.collapsedCounties[code])
    },
    isCountyCollapsed (code) {
      return Boolean(this.collapsedCounties[code])
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
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
    },
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121212' : ''
      }
    },
    handleGlobalKeydown (e) {
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
    setQuickFilter (val) {
      this.quickFilter = (this.quickFilter === val && val !== '') ? '' : val
    },
    handleUrgentKpiClick () {
      const urgentCount = this.red.length + this.yellow.length
      if (urgentCount > 0) {
        this.prioritizeUrgentSites()
      } else {
        this.success('目前全國各地所跨域主機連線皆正常！已依序呈現全部地所。', { title: '🟢 連線全數正常' })
      }
    },
    getProblemRank (siteId) {
      const st = this.officeStateMap[siteId]?.status ?? -2
      const isPin = this.pinnedIds.includes(siteId)
      // 連線異常斷線 (DOWN, 紅燈 -1)：最高優先排在最前
      if (st === -1) {
        return isPin ? 0 : 1
      }
      // 連線逾時重試 (TIMEOUT, 黃燈 0)：次高優先
      if (st === 0) {
        return isPin ? 2 : 3
      }
      // 連線正常 (UP, 綠燈 1) 或等待巡檢 (-2)：排在有問題站點之後，絕不隱藏
      if (isPin) {
        return 4
      }
      if (siteId.startsWith('H')) {
        return 5
      }
      return 6
    },
    resetAllFilters () {
      this.keyword = ''
      this.quickFilter = ''
      this.regionFilter = ''
      this.countyFilter = ''
      this.sortMode = 'stable'
      this.tableCurrentPage = 1
    },
    formatOfficeName (office) {
      if (!office || !office.NAME) { return '' }
      if (this.displayShortName) {
        return office.NAME.replace(/(地政事務所|所)/g, '')
      }
      return `${office.ID} ${office.NAME}`
    },
    getShortOfficeNameById (siteId) {
      const found = this.officesData.find(o => o.ID === siteId)
      return found ? found.NAME.replace(/(地政事務所|所)/g, '') : siteId
    },
    getCountyName (siteId) {
      const c = (siteId || '').charAt(0)
      return COUNTY_MAP[c]?.name || '其他縣市'
    },
    getCountyShortName (siteId) {
      const c = (siteId || '').charAt(0)
      return COUNTY_MAP[c]?.short || c
    },
    getDown24hCount (siteId) {
      return this.down24hMap[siteId] ? this.down24hMap[siteId].length : 0
    },
    getOfficeState (siteId) {
      return this.officeStateMap[siteId] || { status: -2, timestamp: 0, message: '等待巡檢...', headers: [] }
    },
    getOfficeTelemetry (siteId) {
      return this.telemetryMap[siteId] || {
        lastLatency: 0,
        avgLatency: 0,
        maxLatency: 0,
        probeCount: 0,
        failCount: 0,
        consecutiveFails: 0,
        uptimeRate: 100,
        history: []
      }
    },
    getSparklinePoints (siteId) {
      const hist = this.getOfficeTelemetry(siteId).history || []
      const padded = hist.slice(-8)
      while (padded.length < 8) {
        padded.unshift({ status: -2, latency: 0 })
      }
      return padded.map((pt) => {
        if (pt.status === -2) {
          return { cls: 'spark-empty', height: '4px' }
        }
        if (pt.status <= 0) {
          return { cls: 'spark-danger', height: '18px' }
        }
        const h = Math.max(5, Math.min(18, Math.round((pt.latency / 1000) * 18)))
        const cls = pt.latency >= 600 ? 'spark-warning' : 'spark-success'
        return { cls, height: `${h}px` }
      })
    },
    formatAgo (tsMs) {
      if (!tsMs || this.nowTick <= 0) { return '' }
      const diffSec = Math.max(0, Math.floor((this.nowTick - tsMs) / 1000))
      if (diffSec < 5) { return '剛剛' }
      if (diffSec < 60) { return `${diffSec}秒前` }
      const diffMin = Math.floor(diffSec / 60)
      if (diffMin < 60) { return `${diffMin}分前` }
      return this.$utils.formatTime(new Date(tsMs), 'HH:mm')
    },
    // ─── 初始化站點清單與快取預熱 ───
    prepareOfficesData () {
      this.getCache(this.officeCacheKey).then((json) => {
        if (!json || !Array.isArray(json.raw)) {
          this.$axios.post(this.$consts.API.JSON.SYSTEM, {
            type: 'all_offices'
          }).then(({ data }) => {
            this.handleOfficeData(data)
          }).catch((err) => {
            this.$utils.error(err)
          })
        } else {
          this.handleOfficeData(json)
        }
      })
    },
    handleOfficeData (data) {
      if (Array.isArray(data.raw)) {
        const list = data.raw.filter(item => !['CB', 'CC'].includes(item.ID))
        // 讓桃園市排在初始佇列最前面優先巡檢
        list.sort((a, b) => {
          const aTy = a.ID.startsWith('H')
          const bTy = b.ID.startsWith('H')
          if (aTy && !bTy) { return -1 }
          if (!aTy && bTy) { return 1 }
          return a.ID.localeCompare(b.ID)
        })
        this.officesData = list
        this.setCache(this.officeCacheKey, data, 24 * 60 * 60 * 1000)

        // 先以 stats_xap_stats_cached 預熱初始狀態，避免首輪等待空白
        this.prewarmFromCachedStats().finally(() => {
          this.initQueue()
        })
      } else {
        this.$utils.error('無法取得各地政事務所對應資料。')
      }
    },
    prewarmFromCachedStats () {
      return this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_cached'
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          data.raw.forEach((row) => {
            if (!row || !row.id || ['CB', 'CC'].includes(row.id)) { return }
            const isUp = row.state === 'UP'
            this.$set(this.officeStateMap, row.id, {
              status: isUp ? 1 : -1,
              timestamp: row.timestamp ? row.timestamp * 1000 : Date.now(),
              message: row.response || (isUp ? `${row.id}服務正常` : `${row.id}服務異常`),
              headers: row.response ? [row.response] : []
            })
          })
          this.recalculateBuckets()
        }
      }).catch(() => {
        // 忽略預熱失敗，直接進入佇列實測
      })
    },
    loadRecentDownHistory () {
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_down',
        opt: 'day'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
          this.recentDownRecords = data.raw
        }
      }).catch(() => {})
    },
    // ─── 主動式佇列巡檢引擎核心 (Active Patrol Queue Engine) ───
    initQueue () {
      this.updateQueue = this.officesData.map(o => o.ID)
      this.processQueue()
    },
    togglePatrol () {
      this.isPatrolPaused = !this.isPatrolPaused
      if (!this.isPatrolPaused) {
        this.processQueue()
      }
    },
    setMaxConcurrent (val) {
      this.maxConcurrent = val
      this.processQueue()
    },
    restartFullPatrol () {
      Object.values(this.scheduledTimers).forEach(t => clearTimeout(t))
      this.scheduledTimers = {}
      this.roundVisitedMap = {}
      this.patrolRound++
      this.updateQueue = this.officesData.map(o => o.ID)
      this.isPatrolPaused = false
      this.processQueue()
      this.info(`已重新啟動第 ${this.patrolRound} 輪全國完整巡檢`, { title: '🔄 全量重巡' })
    },
    prioritizeSiteIds (ids) {
      if (!Array.isArray(ids) || ids.length === 0) { return }
      ids.slice().reverse().forEach((id) => {
        if (this.scheduledTimers[id]) {
          clearTimeout(this.scheduledTimers[id])
          delete this.scheduledTimers[id]
        }
        const qIdx = this.updateQueue.indexOf(id)
        if (qIdx > -1) {
          this.updateQueue.splice(qIdx, 1)
        }
        if (!this.processingIds.includes(id)) {
          this.updateQueue.unshift(id)
        }
      })
      this.isPatrolPaused = false
      this.processQueue()
    },
    prioritizeUrgentSites () {
      const urgent = [...this.red, ...this.yellow]
      if (urgent.length > 0) {
        this.prioritizeSiteIds(urgent)
        this.info(`已將 ${urgent.length} 所異常/逾時站點排入佇列最前端優先探測`, { title: '⚡ 優先重測' })
      } else {
        this.prioritizeTaoyuanSites()
      }
    },
    prioritizeTaoyuanSites () {
      const tyIds = this.officesData.filter(o => o.ID.startsWith('H')).map(o => o.ID)
      this.prioritizeSiteIds(tyIds)
      this.info('已將桃園市 8 所排入佇列最前端立即重測', { title: '⚡ 優先測本市' })
    },
    prioritizeCountySites (offices) {
      const ids = (offices || []).map(o => o.ID)
      this.prioritizeSiteIds(ids)
    },
    manualProbeSite (siteId, showToast = false) {
      if (!siteId || this.isSiteProbing(siteId)) { return }
      if (this.scheduledTimers[siteId]) {
        clearTimeout(this.scheduledTimers[siteId])
        delete this.scheduledTimers[siteId]
      }
      const qIdx = this.updateQueue.indexOf(siteId)
      if (qIdx > -1) {
        this.updateQueue.splice(qIdx, 1)
      }
      this.executeProbe(siteId, showToast)
    },
    isSiteProbing (siteId) {
      return this.processingIds.includes(siteId)
    },
    processQueue () {
      if (this.isDestroyed || this.isPatrolPaused) { return }
      while (this.processingIds.length < this.maxConcurrent && this.updateQueue.length > 0) {
        const siteId = this.updateQueue.shift()
        if (siteId && !this.processingIds.includes(siteId)) {
          this.executeProbe(siteId, false)
        }
      }
    },
    executeProbe (siteId, showToast = false) {
      if (this.isDestroyed || this.processingIds.includes(siteId)) { return }
      this.processingIds.push(siteId)
      const startMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const prevStatus = this.officeStateMap[siteId]?.status

      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'check_site_http',
        site: siteId
      }, { timeout: 6000 }).then(({ data }) => {
        if (this.isDestroyed) { return }
        const latency = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startMs))
        const isUp = this.$utils.statusCheck(data.status) || data.status === 401
        const headers = Array.isArray(data.raw) ? data.raw : []
        const firstLine = (headers[0] || '').trim() || data.message || (isUp ? 'HTTP/1.1 401 Unauthorized' : '服務異常')
        const nextStatus = isUp ? 1 : -1

        this.recordProbeResult(siteId, {
          status: nextStatus,
          prevStatus,
          latency,
          message: firstLine,
          headers,
          showToast
        })
      }).catch((err) => {
        if (this.isDestroyed) { return }
        const latency = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startMs))
        const errStr = (err?.toString() || '').toLowerCase()
        const isTimeout = err?.code === 'ECONNABORTED' || errStr.includes('timeout')
        const prevFail = this.telemetryMap[siteId]?.consecutiveFails || 0
        // 首次逾時視為 0 (黃燈重試)，連續逾時 >= 2 次視為 -1 (紅燈斷線)
        const nextStatus = (isTimeout && prevFail < 1) ? 0 : -1
        const msg = isTimeout ? `連線逾時 (${latency}ms)` : (err?.message || '連線失敗')

        this.recordProbeResult(siteId, {
          status: nextStatus,
          prevStatus,
          latency,
          message: msg,
          headers: [msg],
          showToast
        })
      }).finally(() => {
        const idx = this.processingIds.indexOf(siteId)
        if (idx > -1) {
          this.processingIds.splice(idx, 1)
        }
        if (!this.isDestroyed) {
          this.scheduleNextProbe(siteId)
          this.processQueue()
        }
      })
    },
    recordProbeResult (siteId, { status, prevStatus, latency, message, headers, showToast }) {
      const now = Date.now()
      this.totalProbesCount++

      // 紀錄本輪巡檢進度
      this.$set(this.roundVisitedMap, siteId, true)
      if (Object.keys(this.roundVisitedMap).length >= this.officesData.length) {
        this.roundVisitedMap = {}
        this.patrolRound++
      }

      // 更新狀態 Map
      this.$set(this.officeStateMap, siteId, {
        status,
        timestamp: now,
        message,
        headers
      })

      // 更新遙測統計 Map
      const prevTel = this.getOfficeTelemetry(siteId)
      const nextHistory = [...(prevTel.history || []), {
        time: this.$utils.formatTime(new Date(now), 'HH:mm:ss'),
        status,
        latency,
        message
      }].slice(-12)

      const probeCount = (prevTel.probeCount || 0) + 1
      const failCount = (prevTel.failCount || 0) + (status <= 0 ? 1 : 0)
      const consecutiveFails = status <= 0 ? (prevTel.consecutiveFails || 0) + 1 : 0
      const validLatencies = nextHistory.filter(h => h.latency > 0).map(h => h.latency)
      const avgLatency = validLatencies.length > 0
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
        : latency
      const maxLatency = Math.max(prevTel.maxLatency || 0, latency)
      const uptimeRate = Math.round(((probeCount - failCount) / probeCount) * 100)

      this.$set(this.telemetryMap, siteId, {
        lastLatency: latency,
        avgLatency,
        maxLatency,
        probeCount,
        failCount,
        consecutiveFails,
        uptimeRate,
        history: nextHistory
      })

      this.recalculateBuckets()

      // 狀態異動事件流記錄 (UP -> DOWN, DOWN -> UP, 或高延遲 > 1200ms)
      const officeObj = this.officesData.find(o => o.ID === siteId)
      const siteName = officeObj ? officeObj.NAME : siteId
      const timeStr = this.$utils.formatTime(new Date(now), 'HH:mm:ss')

      if (status === -1 && prevStatus !== -1) {
        this.pushPatrolEvent({
          siteId,
          siteName,
          time: timeStr,
          variant: 'danger',
          tag: '🔴 斷線警報',
          detail: `${message} (${latency}ms)`
        })
      } else if (status > 0 && (prevStatus === -1 || prevStatus === 0)) {
        this.pushPatrolEvent({
          siteId,
          siteName,
          time: timeStr,
          variant: 'success',
          tag: '🟢 恢復連線',
          detail: `回應恢復正常 (${latency}ms)`
        })
      } else if (status === 0) {
        this.pushPatrolEvent({
          siteId,
          siteName,
          time: timeStr,
          variant: 'warning',
          tag: '🟡 逾時重試',
          detail: message
        })
      } else if (status > 0 && latency >= 1200) {
        this.pushPatrolEvent({
          siteId,
          siteName,
          time: timeStr,
          variant: 'warning',
          tag: '🐢 高延遲尖峰',
          detail: `回應耗時達 ${latency} ms`
        })
      }

      if (showToast) {
        if (status > 0) {
          this.success(`${siteId} ${siteName} 探測正常 (${latency} ms)`, { title: '⚡ 即時探測' })
        } else {
          this.warning(`${siteId} ${siteName} 探測異常：${message}`, { title: '⚡ 即時探測' })
        }
      }
    },
    pushPatrolEvent (ev) {
      this.patrolEvents.unshift({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        ...ev
      })
      if (this.patrolEvents.length > 60) {
        this.patrolEvents.length = 60
      }
    },
    scheduleNextProbe (siteId) {
      if (this.scheduledTimers[siteId]) {
        clearTimeout(this.scheduledTimers[siteId])
      }
      const st = this.officeStateMap[siteId]?.status ?? 1
      let delay = 8000
      if (st <= 0) {
        // 異常或逾時站點：4 ~ 6 秒快速重測
        delay = 4500
      } else if (this.pinnedIds.includes(siteId)) {
        // 釘選站點：5 秒重測
        delay = 5000
      } else if (this.patrolPace === 'fast') {
        delay = this.$utils.rand(2000) + 2000
      } else if (this.patrolPace === 'relaxed') {
        delay = this.$utils.rand(10000) + 15000
      } else {
        delay = this.$utils.rand(6000) + 5000
      }

      this.scheduledTimers[siteId] = setTimeout(() => {
        delete this.scheduledTimers[siteId]
        if (!this.isDestroyed && this.officesData.length > 0) {
          if (!this.updateQueue.includes(siteId) && !this.processingIds.includes(siteId)) {
            if (st <= 0 || this.pinnedIds.includes(siteId)) {
              this.updateQueue.unshift(siteId)
            } else {
              this.updateQueue.push(siteId)
            }
            this.processQueue()
          }
        }
      }, delay)
    },
    recalculateBuckets () {
      const r = []
      const g = []
      const y = []
      this.officesData.forEach((office) => {
        const st = this.officeStateMap[office.ID]?.status ?? -2
        if (st > 0) {
          g.push(office.ID)
        } else if (st === 0) {
          y.push(office.ID)
        } else if (st === -1) {
          r.push(office.ID)
        }
      })
      this.red = r
      this.green = g
      this.yellow = y
    },
    // ─── 釘選與單所 Modal ───
    isPinned (siteId) {
      return this.pinnedIds.includes(siteId)
    },
    togglePin (siteId) {
      const idx = this.pinnedIds.indexOf(siteId)
      if (idx > -1) {
        this.pinnedIds.splice(idx, 1)
      } else {
        this.pinnedIds.push(siteId)
        this.prioritizeSiteIds([siteId])
      }
    },
    openOfficeModal (office) {
      if (!office || !office.ID) { return }
      this.selectedOfficeId = office.ID
      this.$bvModal.show('admin-office-modal')
    },
    openOfficeModalById (siteId) {
      const found = this.officesData.find(o => o.ID === siteId)
      if (found) {
        this.openOfficeModal(found)
      }
    },
    copyAdminDiag (office, evt) {
      if (!office) { return }
      const st = this.getOfficeState(office.ID)
      const tel = this.getOfficeTelemetry(office.ID)
      const text = [
        '【全國地所主動巡檢遙測報告】',
        `站點：${office.ID} ${office.NAME} (${this.getCountyName(office.ID)})`,
        `狀態：${st.status > 0 ? 'UP 正常' : (st.status === 0 ? 'TIMEOUT 逾時' : 'DOWN 異常')}`,
        `最新延遲：${tel.lastLatency} ms (平均 ${tel.avgLatency} ms / 峰值 ${tel.maxLatency} ms)`,
        `巡檢成功率：${tel.uptimeRate}% (共探測 ${tel.probeCount} 次，失敗 ${tel.failCount} 次)`,
        `端點：http://${this.webapIp}/Land${office.ID}/`,
        `最新回應：${st.message || '無'}`
      ].join('\n')
      this.copyToClipboard(text, `已複製 ${office.ID} ${office.NAME} 遙測報告`, evt?.currentTarget)
    },
    // ─── 樣式輔助 ───
    tileStatusClass (siteId) {
      const st = this.officeStateMap[siteId]?.status ?? -2
      const classes = []
      if (st === -1) {
        classes.push('border-danger', 'bg-danger-light')
      } else if (st === 0) {
        classes.push('border-warning', 'bg-warning-light')
      } else if (this.isPinned(siteId)) {
        classes.push('border-primary', 'pinned-tile')
      } else if (siteId.startsWith('H')) {
        classes.push('border-info')
      } else {
        classes.push('border-light')
      }
      return classes
    },
    latencyColorClass (ms, status) {
      if (status <= 0) { return 'latency-danger' }
      if (ms >= 1000) { return 'latency-danger' }
      if (ms >= 600) { return 'latency-warning' }
      return 'latency-ok'
    },
    tableRowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      if (item.status === -1) { return 'table-danger pointer' }
      if (item.status === 0) { return 'table-warning pointer' }
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
// 2. 主佈局與巡檢狀態條
// =========================================================
.monitor-main-row {
  height: calc(100vh - 82px);
  overflow: hidden;
}

.main-panel-col {
  height: 100%;
  overflow-y: auto;
}

.right-dock-col {
  height: 100%;
  overflow: hidden;
}

.timeline-container {
  height: 100%;
}

.patrol-status-strip {
  background-color: #f8fafc;
}

// =========================================================
// 3. 頂部遙測 KPI 指標卡
// =========================================================
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
  &.kpi-danger  { border-color: #dc3545 !important; background-color: #fff5f5; }
  &.kpi-warning { border-color: #f59e0b !important; background-color: #fffbeb; }
  &.kpi-info    { border-color: #17a2b8 !important; background-color: #f0fcff; }

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

.filter-toolbar {
  background-color: #ffffff;
}

.alert-all-green {
  background-color: #f2fbf4;
  border: 1px solid #28a745;
}

// =========================================================
// 4. 遙測方塊視圖 (NOC Telemetry Tiles)
// =========================================================
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(195px, 1fr));
  gap: 0.65rem;
  align-content: start;
}

.telemetry-tile {
  background-color: #ffffff;
  border-width: 2px !important;
  border-style: solid;
  border-radius: 12px;
  min-height: 92px;
  padding: 0.45rem 0.6rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 14px rgba(0, 0, 0, 0.1);
    z-index: 10;

    .tile-action-btn {
      opacity: 1;
    }
  }
}

.pinned-tile {
  background-color: #f8fbff !important;
}

.county-tag {
  font-size: 0.7rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background-color: #f1f5f9;
  color: #475569;
  font-weight: 600;

  &.county-tag-ty {
    background-color: #e0f2fe;
    color: #0369a1;
  }
}

.site-id-code {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.76rem;
  font-weight: 700;
  color: #64748b;
}

.latency-pill {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.08rem 0.35rem;
  border-radius: 999px;

  &.latency-ok {
    background-color: #dcfce7;
    color: #15803d;
  }
  &.latency-warning {
    background-color: #fef3c7;
    color: #b45309;
  }
  &.latency-danger {
    background-color: #fee2e2;
    color: #b91c1c;
  }
}

.tile-action-btn {
  opacity: 0.35;
  line-height: 1;
  transition: opacity 0.15s ease, transform 0.15s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.15);
  }
}

.office-name {
  font-size: 1.05rem;
  color: #1e293b;
}

.error-msg {
  font-size: 0.78rem;
  color: #dc3545;
  font-weight: 600;
  line-height: 1.2;
}

.updated-time {
  font-size: 0.72rem;
  color: #6c757d;
  line-height: 1;
}

// 8點探測軌跡條 (Sparkline)
.probe-sparkline {
  height: 18px;
  gap: 2px;
}

.spark-bar {
  width: 4px;
  border-radius: 2px;
  display: inline-block;
  transition: height 0.2s ease;

  &.spark-empty   { background-color: #e2e8f0; }
  &.spark-success { background-color: #28a745; }
  &.spark-warning { background-color: #f59e0b; }
  &.spark-danger  { background-color: #dc3545; }
}

.bg-danger-light {
  background-color: #fff5f5 !important;
  animation: pulse-danger 2s infinite;
}

.bg-warning-light {
  background-color: #fffbeb !important;
}

@keyframes pulse-danger {
  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(220, 53, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}

// =========================================================
// 5. 縣市戰情視圖 (Masonry 智慧瀑布流 3 欄卡片)
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

.county-card {
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

.county-card-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.county-sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.county-sub-cell {
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border-width: 1.5px;
  border-style: solid;
  background-color: #ffffff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  }
}

.pointer {
  cursor: pointer;
}

.min-w-0 {
  min-width: 0;
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

// =========================================================
// 6. 深色戰情室模式 (Dark Mode Overrides)
// =========================================================
.dark-mode {
  .patrol-status-strip,
  .kpi-card,
  .filter-toolbar,
  .telemetry-tile,
  .county-card,
  .county-card-header,
  .county-sub-cell {
    background-color: #1e1e1e !important;
    border-color: #383838 !important;
    color: #e0e0e0 !important;
  }

  .office-name {
    color: #f8f9fa !important;
  }

  .county-tag {
    background-color: #2d3748;
    color: #e2e8f0;
  }

  .spark-bar.spark-empty {
    background-color: #3a3a3a;
  }

  .bg-danger-light {
    background-color: #3b181b !important;
    border-color: #dc3545 !important;
  }

  .bg-warning-light {
    background-color: #3a2e14 !important;
    border-color: #f59e0b !important;
  }
}
</style>
