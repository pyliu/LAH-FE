<template lang="pug">
.dark-container(v-cloak, :class="[`header-lv-${headerLevel}`, { 'dark-mode': isDarkMode }]")
  //- 頂部標題與控制列 (符合 48px 操作高度規範)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100.header-row
        //- 左側：標題、健康度評分、焦點地所徽章、說明按鈕
        .d-flex.align-items-center.header-left-group
          .my-auto.d-flex.align-items-center.header-title-wrap
            lah-fa-icon.header-title-icon(
              icon="server",
              :variant="overallLight",
              action="breath"
            )
              span.font-weight-bold.header-title-text
                span.title-full {{ site }} 跨域主機戰情室
                span.title-short 跨域戰情室
            //- 綜合健康指數徽章
            b-badge.ml-2.s-90.shadow-sm.pointer.flex-shrink-0(
              :variant="overallLight",
              pill,
              :title="`跨域整體健康評分：${healthScore} 分 · ${healthScoreText}\n點擊查看健康度計算依據`",
              @click="$bvModal.show('health-modal')"
            )
              lah-fa-icon.mr-1(icon="shield-heart")
              span {{ healthScore }}
              span.badge-extra  分 · {{ healthScoreText }}

            //- 焦點地所徽章 (可點擊一鍵解除)
            b-badge.ml-2.s-90.shadow-sm.pointer.flex-shrink-0(
              v-if="focusedOffice",
              variant="primary",
              pill,
              :title="`聚焦：${focusedOffice}（點擊清除聚焦模式，返回全轄監控）`",
              @click="clearFocus"
            )
              lah-fa-icon.mr-1(icon="bullseye")
              span.badge-extra 聚焦：{{ focusedOffice }}
              lah-fa-icon.ml-1(icon="times")

          lah-button.ml-1(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            size="lg",
            no-border,
            no-icon-gutter,
            title="戰情室操作指南"
          )

        //- 右側：跨域生態系導覽與戰情控制列 (48px 高度)
        .d-flex.align-items-center.flex-nowrap.text-nowrap.header-right-group
          //- 跨域生態系快速切換
          b-button-group.mr-2(size="lg")
            lah-button.hide-label-sm(
              to="/inf/xap/connectivity",
              icon="satellite-dish",
              variant="outline-primary",
              size="lg",
              title="前往即時全國地所跨域主機監控（主動探測巡檢）"
            )
              span.btn-label 全國遙測
            lah-button.hide-label-sm(
              to="/inf/xap/broken_cached",
              icon="heart-pulse",
              variant="outline-danger",
              size="lg",
              title="前往全國地所跨域主機離線紀錄與狀態快取"
            )
              span.btn-label 全國快取
            lah-button.hide-label-sm(
              to="/inf/xap/xbroken_display",
              icon="tv",
              variant="outline-info",
              size="lg",
              title="前往民眾端跨縣市公播大廳看板"
            )
              span.btn-label 民眾看板

          //- 戰情控制按鈕群
          b-button-group(size="lg")
            lah-button.mr-1(
              icon="sync-alt",
              :action="isRefreshing ? 'ld-cycle' : ''",
              :busy="isRefreshing",
              variant="outline-secondary",
              size="lg",
              no-icon-gutter,
              title="一鍵全域同頻重新整理",
              @click="reloadAll"
            )
            lah-button.mr-1(
              :icon="isMuted ? 'volume-xmark' : 'volume-high'",
              :variant="isMuted ? 'outline-secondary' : 'outline-warning'",
              size="lg",
              no-icon-gutter,
              :title="isMuted ? '開啟異常蜂鳴警報音效' : '已開啟警報音效，點擊靜音'",
              @click="toggleMute"
            )
            lah-button.mr-1(
              :icon="isFullscreen ? 'compress' : 'expand'",
              variant="outline-secondary",
              size="lg",
              no-icon-gutter,
              :title="isFullscreen ? '結束全螢幕電視牆' : '全螢幕電視牆模式 (F11)'",
              @click="toggleFullscreen"
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
  lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="跨域主機戰情室說明")
    h6.font-weight-bold.text-primary
      lah-fa-icon.mr-1(icon="bullseye")
      span 全域地所穿透聯動（Interactive Drilldown）
    ul.mb-3
      li.mb-1 點擊左上方「跨域 AP 各所連線狀態」長條圖的任一地所（例如#[b 中壢所]），整頁將立即進入該所聚焦模式。
      li.mb-1 聚焦後，左下方「AP 連線趨勢圖」自動繪製該所歷史曲線，右下方「AP 連線狀態」自動切換對應至該所 AP 主機 IP。
      li.mb-1 欲取消聚焦返回全轄監控，只需點擊頂部 #[b 🎯 聚焦：XX所 ✕] 徽章即可。

    h6.font-weight-bold.text-success
      lah-fa-icon.mr-1(icon="shield-heart")
      span 跨域整體健康評分 (Health Score)
    ul.mb-3
      li.mb-1 依據 JBOSS CPU (30%)、DB 連線池水位 (30%)、AP 跨域總連線 (20%) 與內網伺服器連通率 (20%) 即時綜合計算 0~100 分。
      li.mb-1 評分低於 75 分或有主機 DOWN 時將發出視覺告警；若開啟警報音效（右上角 🔊），系統將播放科技感蜂鳴音提醒管理員。

    h6.font-weight-bold.text-info
      lah-fa-icon.mr-1(icon="tv")
      span 電視牆大屏與環境相容性
    ul.mb-0
      li.mb-1 已優化自適應響應式圖表，拉伸視窗不再導致整頁重新整理。
      li.mb-1 支援全螢幕電視牆無干擾輪播模式與深色高對比主題。

  //- 健康評分詳情 Modal
  b-modal#health-modal(title="跨域伺服器即時健康評分詳情", hide-footer, size="md")
    .text-center.my-2
      .display-4.font-weight-bold(:class="healthScoreColorClass") {{ healthScore }}
      .h5.mt-1(:class="healthScoreColorClass") {{ healthScoreText }}
    hr
    ul.list-group.list-group-flush.small
      li.list-group-item.d-flex.justify-content-between.align-items-center
        span 💻 JBOSS CPU 負載 ({{ xapStats.jbossCpuUtilization }}%)
        b-badge(:variant="xapStats.jbossCpuUtilization > 75 ? 'danger' : 'success'") 扣 {{ cpuDeduction }} 分
      li.list-group-item.d-flex.justify-content-between.align-items-center
        span 🗄️ DB 連線池水位 ({{ dbPercent }}%)
        b-badge(:variant="dbDeduction > 0 ? 'warning' : 'success'") 扣 {{ dbDeduction }} 分
      li.list-group-item.d-flex.justify-content-between.align-items-center
        span 🌐 AP 跨域連線池水位 ({{ apPercent }}%)
        b-badge(:variant="apDeduction > 0 ? 'warning' : 'success'") 扣 {{ apDeduction }} 分
      li.list-group-item.d-flex.justify-content-between.align-items-center
        span 📡 內網主機連通狀態 ({{ connStats.upCount }}/{{ connStats.total }})
        b-badge(:variant="connStats.downCount > 0 ? 'danger' : 'success'") 扣 {{ connDeduction }} 分

  //- =========================================================
  //- 戰情抬頭儀表板 (HUD: 5大指標晶片 + 警報跑馬燈)
  //- =========================================================
  section.hud-dashboard.my-2
    .row.no-gutters.mx-n1
      //- (1) JBOSS CPU 使用率
      .col-6.col-md-4.col-xl.px-1.mb-2
        .hud-card.p-2.rounded.shadow-sm.border(:class="cpuBorderClass")
          .d-flex.justify-content-between.align-items-center
            span.hud-label.small.font-weight-bold.text-muted JBOSS CPU
            lah-fa-icon(icon="microchip", :variant="cpuStyleVariant", size="lg")
          .hud-value-row.mt-1.d-flex.align-items-baseline
            span.h4.font-weight-bold.mb-0(:class="cpuTextClass") {{ xapStats.jbossCpuUtilization }}%
            span.small.text-muted.ml-auto {{ cpuStatusText }}

      //- (2) 資料庫連線池 (JNDI local)
      .col-6.col-md-4.col-xl.px-1.mb-2
        .hud-card.p-2.rounded.shadow-sm.border(:class="dbBorderClass")
          .d-flex.justify-content-between.align-items-center
            span.hud-label.small.font-weight-bold.text-muted DB 連線池 (Local)
            lah-fa-icon(icon="database", :variant="dbStyleVariant", size="lg")
          .hud-value-row.mt-1.d-flex.align-items-baseline
            span.h4.font-weight-bold.mb-0(:class="dbTextClass") {{ dbPercent }}%
            span.small.text-muted.ml-auto {{ xapStats.dbTotal }} / {{ xapStats.apJndiLocalThreshold }}

      //- (3) AP 跨域加總連線 (JNDI xaLocal)
      .col-6.col-md-4.col-xl.px-1.mb-2
        .hud-card.p-2.rounded.shadow-sm.border(:class="apBorderClass")
          .d-flex.justify-content-between.align-items-center
            span.hud-label.small.font-weight-bold.text-muted AP 跨域連線 (XA)
            lah-fa-icon(icon="server", :variant="apStyleVariant", size="lg")
          .hud-value-row.mt-1.d-flex.align-items-baseline
            span.h4.font-weight-bold.mb-0(:class="apTextClass") {{ apPercent }}%
            span.small.text-muted.ml-auto {{ xapStats.apTotal }} / {{ xapStats.apJndiXaLocalThreshold }}

      //- (4) 負載最高地所 (可點擊一鍵聚焦)
      .col-6.col-md-4.col-xl.px-1.mb-2
        .hud-card.p-2.rounded.shadow-sm.border.pointer(
          :class="{ 'border-primary bg-primary-subtle': focusedOffice === xapStats.topOffice.x }",
          :title="`點擊一鍵聚焦至連線冠軍：${xapStats.topOffice.x}`",
          @click="xapStats.topOffice.x && handleSelectOffice(xapStats.topOffice.x)"
        )
          .d-flex.justify-content-between.align-items-center
            span.hud-label.small.font-weight-bold.text-muted 負載冠軍地所
            lah-fa-icon(icon="trophy", variant="warning", size="lg")
          .hud-value-row.mt-1.d-flex.align-items-baseline
            span.h5.font-weight-bold.mb-0.text-truncate.text-primary {{ xapStats.topOffice.x || '統計中' }}
            span.small.text-muted.ml-auto(v-if="xapStats.topOffice.y > 0") {{ xapStats.topOffice.y }} 連線

      //- (5) 系統監控連通率
      .col-6.col-md-4.col-xl.px-1.mb-2
        .hud-card.p-2.rounded.shadow-sm.border(
          :class="connStats.downCount > 0 ? 'border-danger' : 'border-success'"
        )
          .d-flex.justify-content-between.align-items-center
            span.hud-label.small.font-weight-bold.text-muted 系統主機連通率
            lah-fa-icon(
              :icon="connStats.downCount > 0 ? 'circle-exclamation' : 'circle-check'",
              :variant="connStats.downCount > 0 ? 'danger' : 'success'",
              size="lg"
            )
          .hud-value-row.mt-1.d-flex.align-items-baseline
            span.h4.font-weight-bold.mb-0(:class="connStats.downCount > 0 ? 'text-danger' : 'text-success'") {{ connAvailability }}%
            span.small.text-muted.ml-auto {{ connStats.upCount }} / {{ connStats.total }} UP

    //- 智慧狀態跑馬燈與告警條 (Alert Banner)
    .hud-ticker.px-3.py-1.rounded.border.d-flex.align-items-center.justify-content-between(
      :class="alerts.length > 0 ? 'bg-danger-subtle border-danger text-danger' : 'bg-light border-light text-muted'"
    )
      .d-flex.align-items-center.overflow-hidden
        lah-fa-icon.mr-2.flex-shrink-0(
          :icon="alerts.length > 0 ? 'triangle-exclamation' : 'circle-check'",
          :variant="alerts.length > 0 ? 'danger' : 'success'",
          :action="alerts.length > 0 ? 'tremble' : ''"
        )
        .ticker-text.text-truncate.small.font-weight-bold
          template(v-if="alerts.length > 0")
            span.mr-3(v-for="(alert, idx) in alerts", :key="idx") ⚠️ {{ alert }}
          template(v-else)
            span 🟢 全轄跨域 JBoss 主機、DB 連線池與監控標的運作平穩，無異常告警。
      .ticker-time.small.text-muted.flex-shrink-0.ml-2
        lah-fa-icon.mr-1(icon="clock", regular)
        span 更新：{{ lastUpdateTime || '即時' }}

  //- =========================================================
  //- 四象限卡片佈局 (Four Quadrants - 依時序分階掛載與穩定排版)
  //- =========================================================
  .quadrant-grid.row.no-gutters.mx-n2
    //- 左上：跨域AP各所連線狀態 (支援點選穿透聯動)
    .col-12.col-lg-6.px-2.mb-2.quadrant-col(key="1", :class="{ 'is-focused': focusedOffice }", :data-focus="focusedOffice")
      lah-monitor-board-xap.quadrant-board(
        v-if="renderStage >= 1",
        ref="boardXap",
        disable-popup,
        :focus-office="focusedOffice",
        @select-office="handleSelectOffice",
        @stats-update="handleXapStatsUpdate",
        @light-update="handleLightUpdate"
      )
      b-card.quadrant-placeholder.d-flex.align-items-center.justify-content-center(v-else)
        lah-fa-icon(icon="spinner", action="spin", size="2x", variant="primary")
        .small.text-muted.mt-2 初始化各所連線監控...

    //- 右上：系統連線狀態監控 (本所專用)
    .col-12.col-lg-6.px-2.mb-2.quadrant-col(key="2")
      lah-monitor-board-connectivity.quadrant-board(
        v-if="renderStage >= 2",
        ref="boardConn",
        @stats-update="handleConnStatsUpdate",
        @light-update="handleLightUpdate"
      )
      b-card.quadrant-placeholder.d-flex.align-items-center.justify-content-center(v-else)
        lah-fa-icon(icon="spinner", action="spin", size="2x", variant="info")
        .small.text-muted.mt-2 初始化系統連線狀態...

    //- 左下：跨域AP連線趨勢圖 (動態綁定 office / 穿透)
    .col-12.col-lg-6.px-2.mb-1.mb-lg-0.quadrant-col(key="3", :class="{ 'is-focused': focusedOffice }", :data-focus="focusedOffice")
      lah-monitor-board-xap-trend.quadrant-board(
        v-if="renderStage >= 3",
        ref="boardTrend",
        :office="currentTrendOffice",
        :watch-top-xap="!focusedOffice",
        :reload-time="15",
        @light-update="handleLightUpdate"
      )
      b-card.quadrant-placeholder.d-flex.align-items-center.justify-content-center(v-else)
        lah-fa-icon(icon="spinner", action="spin", size="2x", variant="success")
        .small.text-muted.mt-2 初始化歷史連線趨勢...

    //- 右下：AP使用者/系統連線明細 (本所專用)
    .col-12.col-lg-6.px-2.mb-1.mb-lg-0.quadrant-col(key="4")
      lah-monitor-board-apconn.quadrant-board(
        v-if="renderStage >= 4",
        ref="boardApconn",
        @light-update="handleLightUpdate"
      )
      b-card.quadrant-placeholder.d-flex.align-items-center.justify-content-center(v-else)
        lah-fa-icon(icon="spinner", action="spin", size="2x", variant="warning")
        .small.text-muted.mt-2 初始化 AP 連線明細...
</template>

<script>
export default {
  middleware: ['isInf'],
  data: () => ({
    renderStage: 0,
    headerLevel: 0,
    isDarkMode: false,
    isFullscreen: false,
    isMuted: false,
    isRefreshing: false,
    focusedOffice: '',
    xapStats: {
      dbTotal: 0,
      jbossCpuUtilization: 0,
      apTotal: 0,
      apJndiLocalThreshold: 3000,
      apJndiXaLocalThreshold: 1250,
      topOffice: { x: '', y: 0 },
      light: 'success'
    },
    connStats: {
      total: 0,
      upCount: 0,
      downCount: 0,
      light: 'success',
      worstItem: null
    },
    lastUpdateTime: '',
    lastAlarmTime: 0
  }),
  head: {
    title: '跨域伺服器監控-桃園市地政局'
  },
  computed: {
    currentTrendOffice () {
      return this.focusedOffice || this.xapStats.topOffice.x || '桃園所'
    },
    dbPercent () {
      const threshold = this.xapStats.apJndiLocalThreshold || 3000
      return ((this.xapStats.dbTotal / threshold) * 100).toFixed(1)
    },
    apPercent () {
      const threshold = this.xapStats.apJndiXaLocalThreshold || 1250
      return ((this.xapStats.apTotal / threshold) * 100).toFixed(1)
    },
    connAvailability () {
      if (!this.connStats.total) {
        return '100'
      }
      return ((this.connStats.upCount / this.connStats.total) * 100).toFixed(0)
    },
    cpuDeduction () {
      const cpu = this.xapStats.jbossCpuUtilization
      if (cpu > 90) { return 30 }
      if (cpu > 75) { return 20 }
      if (cpu > 50) { return 10 }
      return 0
    },
    dbDeduction () {
      const pct = parseFloat(this.dbPercent)
      if (pct > 90) { return 30 }
      if (pct > 75) { return 15 }
      return 0
    },
    apDeduction () {
      const pct = parseFloat(this.apPercent)
      if (pct > 90) { return 20 }
      if (pct > 75) { return 10 }
      return 0
    },
    connDeduction () {
      if (this.connStats.downCount > 0) {
        return Math.min(20, this.connStats.downCount * 10)
      }
      return 0
    },
    healthScore () {
      const score = 100 - this.cpuDeduction - this.dbDeduction - this.apDeduction - this.connDeduction
      return Math.max(0, score)
    },
    healthScoreText () {
      if (this.healthScore >= 90) { return '優良' }
      if (this.healthScore >= 75) { return '正常' }
      if (this.healthScore >= 60) { return '警戒' }
      return '危急'
    },
    healthScoreColorClass () {
      if (this.healthScore >= 90) { return 'text-success' }
      if (this.healthScore >= 75) { return 'text-info' }
      if (this.healthScore >= 60) { return 'text-warning-dark font-weight-bold' }
      return 'text-danger font-weight-bold'
    },
    overallLight () {
      if (this.healthScore >= 75) { return 'success' }
      if (this.healthScore >= 60) { return 'warning' }
      return 'danger'
    },
    cpuStatusText () {
      const cpu = this.xapStats.jbossCpuUtilization
      if (cpu > 90) { return '極重度' }
      if (cpu > 75) { return '重度' }
      if (cpu > 50) { return '中度' }
      return '正常'
    },
    cpuStyleVariant () {
      const cpu = this.xapStats.jbossCpuUtilization
      if (cpu > 75) { return 'danger' }
      if (cpu > 50) { return 'warning' }
      return 'success'
    },
    cpuTextClass () {
      const cpu = this.xapStats.jbossCpuUtilization
      if (cpu > 75) { return 'text-danger' }
      if (cpu > 50) { return 'text-warning' }
      return 'text-success'
    },
    cpuBorderClass () {
      const cpu = this.xapStats.jbossCpuUtilization
      if (cpu > 75) { return 'border-danger bg-danger-subtle' }
      if (cpu > 50) { return 'border-warning' }
      return 'border-light'
    },
    dbStyleVariant () {
      const pct = parseFloat(this.dbPercent)
      if (pct > 85) { return 'danger' }
      if (pct > 70) { return 'warning' }
      return 'primary'
    },
    dbTextClass () {
      const pct = parseFloat(this.dbPercent)
      if (pct > 85) { return 'text-danger' }
      if (pct > 70) { return 'text-warning' }
      return 'text-primary'
    },
    dbBorderClass () {
      const pct = parseFloat(this.dbPercent)
      if (pct > 85) { return 'border-danger bg-danger-subtle' }
      if (pct > 70) { return 'border-warning' }
      return 'border-light'
    },
    apStyleVariant () {
      const pct = parseFloat(this.apPercent)
      if (pct > 85) { return 'danger' }
      if (pct > 70) { return 'warning' }
      return 'success'
    },
    apTextClass () {
      const pct = parseFloat(this.apPercent)
      if (pct > 85) { return 'text-danger' }
      if (pct > 70) { return 'text-warning' }
      return 'text-success'
    },
    apBorderClass () {
      const pct = parseFloat(this.apPercent)
      if (pct > 85) { return 'border-danger bg-danger-subtle' }
      if (pct > 70) { return 'border-warning' }
      return 'border-light'
    },
    alerts () {
      const list = []
      if (this.xapStats.jbossCpuUtilization > 75) {
        list.push(`JBOSS CPU 負載過高 (${this.xapStats.jbossCpuUtilization}%)`)
      }
      if (parseFloat(this.dbPercent) > 85) {
        list.push(`資料庫連線池水位達警戒線 (${this.dbPercent}%)`)
      }
      if (parseFloat(this.apPercent) > 85) {
        list.push(`AP 跨域連線池水位達警戒線 (${this.apPercent}%)`)
      }
      if (this.connStats.downCount > 0) {
        list.push(`偵測到 ${this.connStats.downCount} 台系統主機連線中斷`)
      }
      return list
    }
  },
  watch: {
    isDarkMode (flag) {
      this.updateBodyBg(flag)
    },
    focusedOffice () { this.$nextTick(this.checkHeaderCompact) },
    healthScore () { this.$nextTick(this.checkHeaderCompact) }
  },
  async created () {
    this.isDarkMode = (await this.getCache('inf-xap-dark-mode')) || false
    this.isMuted = (await this.getCache('inf-xap-muted')) || false
    this.updateBodyBg(this.isDarkMode)
  },
  mounted () {
    this.updateBodyBg(this.isDarkMode)
    this.refresh()
    // 依序分階段掛載四塊看板，徹底消除並發繪圖時序競爭與 DOM 尺寸未就緒時的計算崩潰
    this.renderStage = 1
    this.timeout(() => { this.renderStage = 2 }, 150)
    this.timeout(() => { this.renderStage = 3 }, 300)
    this.timeout(() => { this.renderStage = 4 }, 450)
    this.$nextTick(this.setupHeaderCompact)
  },
  beforeDestroy () {
    this.updateBodyBg(false)
    clearTimeout(this.headerCompactTimer)
    if (this.headerResizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.headerResizeHandler)
    }
  },
  methods: {
    handleSelectOffice (officeName) {
      if (this.focusedOffice === officeName) {
        this.focusedOffice = ''
        this.info('已解除聚焦，返回全轄監控', { title: '🎯 聚焦模式' })
      } else {
        this.focusedOffice = officeName
        this.info(`已聚焦「${officeName}」：左側長條圖高亮與趨勢圖同步切換（右側維持本所監控）`, { title: '🎯 聚焦模式' })
      }
    },
    // 依 Header 實際寬度逐級精簡：1 導覽按鈕只留圖示 → 2 標題縮短 → 3 徽章只留數值/圖示
    async checkHeaderCompact () {
      if (this.headerChecking) { return }
      this.headerChecking = true
      try {
        const row = this.$el && this.$el.querySelector && this.$el.querySelector('.header-row')
        if (!row) { return }
        const title = row.querySelector('.header-title-text')
        for (let level = 0; level <= 3; level++) {
          this.headerLevel = level
          await this.$nextTick()
          const clipped = title && title.scrollWidth > title.clientWidth + 1
          if (row.scrollWidth <= row.clientWidth + 1 && !clipped) { break }
        }
      } finally {
        this.headerChecking = false
      }
    },
    setupHeaderCompact () {
      if (typeof window === 'undefined') { return }
      const row = this.$el && this.$el.querySelector && this.$el.querySelector('.header-row')
      if (!row) {
        this.headerCompactTimer = setTimeout(this.setupHeaderCompact, 300)
        return
      }
      this.headerResizeHandler = () => this.checkHeaderCompact()
      window.addEventListener('resize', this.headerResizeHandler)
      this.checkHeaderCompact()
    },
    clearFocus () {
      this.focusedOffice = ''
    },
    handleXapStatsUpdate (stats) {
      this.xapStats = { ...this.xapStats, ...stats }
      if (stats.updatedTime) {
        this.lastUpdateTime = stats.updatedTime
      }
      this.checkAlarm()
    },
    handleConnStatsUpdate (stats) {
      this.connStats = { ...this.connStats, ...stats }
      if (stats.updatedTime) {
        this.lastUpdateTime = stats.updatedTime
      }
      this.checkAlarm()
    },
    handleLightUpdate (payload) {
      // placeholder for board light updates
    },
    async reloadAll () {
      this.isRefreshing = true
      try {
        await Promise.all([
          this.$refs.boardXap?.reload?.(),
          this.$refs.boardConn?.reload?.(true),
          this.$refs.boardTrend?.reload?.(),
          this.$refs.boardApconn?.reload?.()
        ])
      } finally {
        this.timeout(() => {
          this.isRefreshing = false
        }, 600)
      }
    },
    async toggleTheme () {
      this.isDarkMode = !this.isDarkMode
      this.updateBodyBg(this.isDarkMode)
      await this.setCache('inf-xap-dark-mode', this.isDarkMode)
    },
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121820' : ''
      }
    },
    async toggleMute () {
      this.isMuted = !this.isMuted
      await this.setCache('inf-xap-muted', this.isMuted)
    },
    toggleFullscreen () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
        this.isFullscreen = true
      } else {
        document.exitFullscreen().catch(() => {})
        this.isFullscreen = false
      }
    },
    checkAlarm () {
      const now = Date.now()
      // Alarm cooldown: at least 30 seconds between beeps
      if (!this.isMuted && this.healthScore < 75 && now - this.lastAlarmTime > 30000) {
        this.lastAlarmTime = now
        this.playBeep(660, 250)
      }
    },
    playBeep (frequency = 660, duration = 250) {
      if (this.isMuted) {
        return
      }
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext
        if (!AudioContextClass) {
          return
        }
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(frequency, ctx.currentTime)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration / 1000)
      } catch (err) {
        // ignore audio policy errors
      }
    },
    refresh (minSec = '00:00') {
      // refresh the page at tomorrow 08:00
      const now = new Date()
      const today =
        now.getFullYear() +
        '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + now.getDate()).slice(-2)
      const tomorrow8am = new Date(`${today} 08:${minSec}`)
      tomorrow8am.setDate(new Date().getDate() + 1)
      const milliseconds = tomorrow8am - now
      this.timeout(() => window.location.reload(), milliseconds).then((handler) => {
        this.$utils.log(
          `${Number.parseFloat(
            milliseconds / 1000 / 60 / 60
          ).toFixed(2)} hrs 後更新頁面 (${tomorrow8am})`
        )
      })
    }
  }
}
</script>

<style lang="scss">
.dark-container {
  /* Ignored desktop font size settings */
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-size: 16px;
  transition: background-color 0.3s ease, color 0.3s ease;
  margin-left: -15px;
  margin-right: -15px;
  padding-left: 15px;
  padding-right: 15px;
  min-height: 100vh;
  box-sizing: border-box;

  &.dark-mode {
    background-color: #121820;
    color: #e6edf3;

    .lah-header.is-scrolled {
      background-color: #121820 !important;
      border-bottom: 1px solid #303e50 !important;
    }

    .card {
      background-color: #1c2430;
      border-color: #303e50;
      color: #e6edf3;

      .card-header,
      .card-footer {
        background-color: rgba(255, 255, 255, 0.04);
        border-color: #303e50;
        color: #e6edf3;
      }
    }

    .hud-card {
      background-color: #1c2430;
      border-color: #303e50 !important;
      color: #e6edf3;

      .hud-label {
        color: #8b949e !important;
      }
    }

    .hud-ticker {
      background-color: #161f2c !important;
      border-color: #303e50 !important;
      color: #8b949e !important;

      &.bg-danger-subtle {
        background-color: rgba(220, 53, 69, 0.15) !important;
        border-color: rgba(220, 53, 69, 0.4) !important;
        color: #ff7b72 !important;
      }
    }

    .modal-content {
      background-color: #1c2430;
      color: #e6edf3;
      border-color: #303e50;
    }

    .list-group-item {
      background-color: #1c2430;
      color: #e6edf3;
      border-color: #303e50;
    }

    .quadrant-placeholder {
      background-color: #1c2430 !important;
      border-color: #303e50 !important;
      color: #8b949e !important;
    }
  }
}

/* Header 48px 操作高度規範 */
.header-row {
  min-height: 48px;

  .btn-group {
    height: 48px;
    align-items: stretch;

    .btn {
      height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.pointer {
  cursor: pointer;
}

.hud-card {
  background-color: #ffffff;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }
}

.bg-danger-subtle {
  background-color: #fff2f2;
}

.bg-primary-subtle {
  background-color: #f0f7ff;
}

.text-warning-dark {
  color: #b08800;
}

/* 四象限圖表自適應高度與時序容器約束 */
.quadrant-grid {
  margin-bottom: 0.75rem;

  .quadrant-col {
    display: flex;
    flex-direction: column;
  }

  .quadrant-board,
  .quadrant-placeholder {
    height: calc((100vh - 245px) / 2) !important;
    min-height: 275px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    position: relative !important;

    > .card-header {
      flex: 0 0 auto !important;
      min-height: 48px !important;
      max-height: 48px !important;
      padding: 0 1rem !important;
      display: flex !important;
      align-items: center !important;
      overflow: hidden !important;
    }

    > .card-footer {
      flex: 0 0 auto !important;
      min-height: 38px !important;
      max-height: 40px !important;
      padding: 0 0.85rem !important;
      display: flex !important;
      align-items: center !important;
      overflow: hidden !important;

      // 關鍵：讓 footer 內部容器 100% 寬度展開，更新時間貼齊右下角
      > * {
        width: 100% !important;
        flex: 1 1 100% !important;
      }

      .d-flex {
        width: 100% !important;
      }
    }

    // 中間的圖表容器必須撐滿剩餘空間，確保其內部 canvas 有絕對穩定的幾何邊界
    .lah-chart,
    .chart-container {
      flex: 1 1 auto !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      position: relative !important;
      overflow: hidden !important;
    }

    canvas {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    }
  }

  .quadrant-placeholder {
    border: 2px dashed rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.02);
  }

  // 聚焦模式：看板外框高亮並於右上角標示聚焦地所
  .quadrant-col {
    position: relative;

    &.is-focused {
      .quadrant-board {
        border: 2px solid #007bff !important;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.15);
      }

      &::after {
        content: '🎯 聚焦：' attr(data-focus);
        position: absolute;
        top: -9px;
        right: 1.5rem;
        z-index: 5;
        padding: 0 0.6rem;
        font-size: 0.75rem;
        font-weight: bold;
        line-height: 18px;
        color: #fff;
        background-color: #007bff;
        border-radius: 9px;
        pointer-events: none;
      }
    }
  }
}

/* Header 單行精簡：依 headerLevel 逐級隱藏文字，標題絕不換行 */
.dark-container {
  .header-row {
    flex-wrap: nowrap;
    // Header 內 row 與左側選單鈕、右側首頁鈕同列：只佔剩餘寬度，內容過長才能被偵測並截斷
    flex: 1 1 0;
    min-width: 0;
    // body 有 min-width，另以 viewport 寬度限制（扣除兩顆 3.4rem 按鈕與左右間距）
    max-width: calc(100vw - 150px);
  }

  .header-left-group {
    flex: 0 1 auto;
    min-width: 0;
  }

  .header-title-wrap {
    flex: 0 1 auto;
    min-width: 0;
    white-space: nowrap;
  }

  .header-title-icon {
    min-width: 0;
  }

  // 標題最後手段：過長以 ... 截斷
  .header-title-text {
    display: block;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .header-right-group {
    flex: 0 0 auto;
    margin-left: auto;
  }

  .title-short {
    display: none;
  }

  &.header-lv-1,
  &.header-lv-2,
  &.header-lv-3 {
    .header-right-group .btn-label {
      display: none;
    }
  }

  &.header-lv-2,
  &.header-lv-3 {
    .title-full {
      display: none;
    }

    .title-short {
      display: inline;
    }
  }

  &.header-lv-3 .badge-extra {
    display: none;
  }
}
</style>
