<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100.my-auto
        //- 左側：LIVE 標章 + 頁面標題 + 日期切換 (高度 48px)
        .d-flex.align-items-center.header-left-group
          .live-status-pill.d-flex.align-items-center.mr-2(title="即時監控連線中")
            span.live-dot
            span.live-text LIVE
          .header-title-box.mr-3
            .d-flex.align-items-center
              span.header-main-title.font-weight-bold.text-dark {{ formattedDay }} {{ caseText }}異動追蹤
              b-badge.ml-2.font-weight-bold(pill, :variant="easyCase ? 'primary' : 'secondary'") {{ easyCase ? '簡易' : '全案' }}
          //- 日期切換群組 (高度 48px)
          b-button-group.date-nav-group
            b-button.h-48px(
              variant="outline-secondary",
              title="前一日",
              @click="shiftDay(-1)"
            )
              lah-fa-icon(icon="chevron-left")
            b-input.h-48px.font-weight-bold.text-center(
              v-model="qday",
              @keyup.enter="$fetch()",
              title="輸入民國年月日（例：1130506），Enter 查詢",
              style="width: 105px;"
            )
            b-button.h-48px(
              variant="outline-secondary",
              title="次一日",
              :disabled="isToday",
              @click="shiftDay(1)"
            )
              lah-fa-icon(icon="chevron-right")
            b-button.h-48px(
              variant="outline-primary",
              title="回到今日",
              :disabled="isToday",
              @click="setToday"
            ) 今日

        //- 中間：輪播切換與播放控制 (高度 48px)
        .d-flex.align-items-center.header-center-group(v-if="queueChunks.length > 1")
          b-button-group
            lah-button.h-48px(
              icon="chevron-left",
              variant="outline-secondary",
              title="上一頁 (← 鍵)",
              @click="prevSlide"
            )
            lah-button.h-48px(
              v-for="(chunk, idx) in queueChunks",
              :key="`slide_button_${idx}`",
              v-if="idx < effectiveSlideCount",
              :pressed="idx === slideIdx",
              variant="outline-primary",
              @click="slideIdx = idx",
              :title="`第 ${idx + 1} 頁 (第 ${1 + idx * maxQueueSize} 至 ${Math.min((idx + 1) * maxQueueSize, filteredTrackingCase.length)} 件)`",
              style="min-width: 44px;"
            ) {{ idx + 1 }}
            lah-button.h-48px(
              icon="chevron-right",
              variant="outline-secondary",
              title="下一頁 (→ 鍵)",
              @click="nextSlide"
            )
            lah-button.h-48px(
              :icon="isAutoSliding ? 'pause' : 'play'",
              :variant="isAutoSliding ? 'outline-success' : 'outline-warning'",
              :title="isAutoSliding ? '暫停自動輪播 (空白鍵)' : '恢復自動輪播 (空白鍵)'",
              @click="toggleAutoSlide"
            )

        //- 右側操作按鈕區 (高度 48px)
        .d-flex.align-items-center.header-right-group
          //- 簡易 / 全部 案件切換按鈕
          lah-button.h-48px.mr-1(
            :icon="easyCase ? 'filter' : 'list-check'",
            :variant="easyCase ? 'primary' : 'outline-primary'",
            :title="easyCase ? '目前為「僅簡易案件」，點擊切換為「全部案件」' : '目前為「全部案件」，點擊切換為「僅簡易案件」'",
            @click="toggleEasyCase"
          ) {{ caseText }}

          //- 倒數自動重整
          lah-countdown-button.h-48px.mr-1(
            ref="countdown",
            icon="magnifying-glass",
            auto-start,
            title="重新讀取 (R 鍵)",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="reloadMs",
            :busy="buttonDisabled",
            @end="$fetch",
            @click="$fetch"
          )

          //- 詳細列表彈窗
          lah-button.h-48px.mr-1(
            icon="table-list",
            title="顯示詳細案件清單",
            variant="outline-secondary",
            @click="$refs.table.show()"
          )

          //- 全螢幕看板模式
          lah-button.h-48px.mr-1(
            :icon="isFullscreen ? 'compress' : 'expand'",
            :variant="isFullscreen ? 'info' : 'outline-info'",
            :title="isFullscreen ? '離開全螢幕模式 (F 鍵)' : '進入全螢幕電視牆模式 (F 鍵)'",
            @click="toggleFullscreen"
          )

          //- 設定與說明
          lah-button.h-48px(
            icon="gear",
            title="設定與說明",
            variant="outline-secondary",
            v-b-modal.help-modal
          )

  //- 主要內容儀表板
  .tracking-dashboard-body.p-2(:class="{ 'fullscreen-mode': isFullscreen }")
    //- 頂部 KPI 統計條與即時輪播進度
    .kpi-ribbon.mb-2.lah-shadow
      .d-flex.align-items-center.justify-content-between.flex-wrap.p-2
        //- 指標 1: 異動總數
        .kpi-chip(:class="{ active: statusFilter === 'all' }", @click="setStatusFilter('all')", title="點擊檢視全部異動")
          .kpi-icon-box.bg-primary-light
            lah-fa-icon(icon="list-check", variant="primary")
          .kpi-content
            .kpi-label 異動總數
            .kpi-value {{ count }} <span class="unit">件</span>
            .kpi-sub.text-muted 簡易 {{ easyCount }} · 一般 {{ normalCount }}

        //- 指標 2: 異動完成 / 結案
        .kpi-chip(:class="{ active: statusFilter === 'completed' }", @click="setStatusFilter('completed')", title="點擊篩選已完成案件")
          .kpi-icon-box.bg-success-light
            lah-fa-icon(icon="circle-check", variant="success")
          .kpi-content
            .kpi-label 異動完成 / 結案
            .kpi-value.text-success {{ completedCount }} <span class="unit">件</span>
            .kpi-sub
              b-badge(variant="success", pill) 達成率 {{ completedRate }}%

        //- 指標 3: 登校審查中
        .kpi-chip(:class="{ active: statusFilter === 'processing' }", @click="setStatusFilter('processing')", title="點擊篩選辦理中案件")
          .kpi-icon-box.bg-warning-light
            lah-fa-icon(icon="pen-to-square", variant="warning")
          .kpi-content
            .kpi-label 登校審查中
            .kpi-value.text-warning {{ processingCount }} <span class="unit">件</span>
            .kpi-sub.text-muted 審查 · 登錄 · 校對

        //- 指標 4: 待關注處置
        .kpi-chip(:class="{ active: statusFilter === 'alert', 'has-alert': alertCount > 0 }", @click="setStatusFilter('alert')", title="點擊篩選需關注案件")
          .kpi-icon-box.bg-danger-light
            lah-fa-icon(icon="triangle-exclamation", variant="danger")
          .kpi-content
            .kpi-label 待關注處置
            .kpi-value.text-danger {{ alertCount }} <span class="unit">件</span>
            .kpi-sub
              b-badge(v-if="alertCount > 0", variant="danger", pill) 補正 · 駁回 · 請示
              span.text-muted(v-else) 無異常案件

        //- 右側：當前進度與狀態標籤
        .kpi-status-summary.d-flex.align-items-center
          .slide-page-badge.mr-2
            lah-fa-icon(icon="tv", variant="info", size="sm").mr-1
            span.font-weight-bold 第 {{ queueChunks.length ? slideIdx + 1 : 0 }} / {{ queueChunks.length }} 頁
            span.text-muted.ml-1 (共 {{ filteredTrackingCase.length }} 件)
          b-button-group(size="sm")
            b-button(
              :variant="statusFilter === 'all' ? 'primary' : 'outline-secondary'",
              @click="setStatusFilter('all')"
            ) 全部
            b-button(
              :variant="statusFilter === 'completed' ? 'success' : 'outline-secondary'",
              @click="setStatusFilter('completed')"
            ) 已完成
            b-button(
              :variant="statusFilter === 'processing' ? 'warning' : 'outline-secondary'",
              @click="setStatusFilter('processing')"
            ) 辦理中
            b-button(
              :variant="statusFilter === 'alert' ? 'danger' : 'outline-secondary'",
              @click="setStatusFilter('alert')"
            ) 待關注

      //- 輪播倒數進度線
      .slide-progress-track(v-if="queueChunks.length > 1 && slideSecs > 0")
        .slide-progress-bar(
          :key="`progress_${slideIdx}_${isAutoSliding}`",
          :style="{ animationDuration: `${slideSecs}s`, animationPlayState: isAutoSliding ? 'running' : 'paused' }"
        )

    //- 查無資料空狀態
    .empty-state-card.lah-shadow.p-5.text-center.my-4(v-if="queueChunks.length === 0")
      lah-fa-icon(icon="clipboard-check", size="4x", variant="secondary").mb-3
      h3.text-muted.font-weight-bold {{ formattedDay }} 查無{{ caseText }}異動資料
      p.text-muted.mt-2 請確認所選日期是否有辦理異動案件，或點擊下方按鈕查詢今日
      b-button.mt-2(variant="primary", size="lg", @click="setToday")
        lah-fa-icon(icon="calendar-day").mr-1
        span 查詢今日案件

    //- 主要輪播畫面：一排四個卡片共三排
    b-carousel.tracking-carousel(
      v-else,
      ref="carousel",
      v-model="slideIdx",
      :interval="isAutoSliding ? slideSecs * 1000 : 0",
      no-hover-pause
    )
      b-carousel-slide(
        v-for="(chunk, idx) in queueChunks",
        :key="`slide_${idx}`",
        v-if="idx < effectiveSlideCount"
      ): template(#img)
        lah-reg-tracking-cards(
          :rows="chunk",
          :query-day="qday",
          :serial-start="1 + idx * maxQueueSize"
        )

  //- 詳細異動清單彈窗
  b-modal(
    ref="table",
    size="xl",
    hide-footer,
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="table-list", variant="primary").mr-2
        span.font-weight-bold {{ formattedDay }} 詳細異動案件清單 (共 {{ count }} 件)
    lah-reg-b-table(
      type="lg",
      :baked-data="baked",
      :case-reload="true",
      enable-keyword-filter
    )

  //- 設定與操作說明彈窗
  lah-help-modal(:modal-id="'help-modal'", size="lg")
    template(#title)
      .d-flex.align-items-center
        lah-fa-icon(icon="sliders", variant="primary").mr-2
        span 看板設定與操作說明
    .help-modal-body
      h6.font-weight-bold.text-primary
        lah-fa-icon(icon="gear").mr-1
        span 看板輪播與更新設定
      b-row.mb-3
        b-col(cols="12", md="6")
          .form-group
            label.font-weight-bold 輪播間隔秒數
            .d-flex.align-items-center
              b-spinbutton(v-model="slideSecs", min="0", max="120", step="5", inline)
              span.ml-2 秒切換（設為 0 停止自動切換）
        b-col(cols="12", md="6")
          .form-group
            label.font-weight-bold 最大輪播頁數
            .d-flex.align-items-center
              b-spinbutton(v-model="slideCount", min="1", max="10", inline)
              span.ml-2 頁（每頁 12 件，最多展示 {{ slideCount * maxQueueSize }} 件）
        b-col(cols="12", md="6")
          .form-group
            label.font-weight-bold 自動重新載入頻率
            b-form-select(v-model="reloadMs", :options="reloadOptions")
        b-col(cols="12", md="6")
          .form-group
            label.font-weight-bold 新案件提示音效
            b-checkbox(v-model="audioNotify", switch) 自動更新時播放提示音

      hr
      h6.font-weight-bold.text-primary
        lah-fa-icon(icon="keyboard").mr-1
        span 電視牆 / 遙控器鍵盤快捷鍵
      b-table-simple.table-sm.table-bordered.text-center.mb-3
        b-thead.thead-light
          b-tr
            b-th 按鍵
            b-th 功能說明
        b-tbody
          b-tr
            b-td: kbd ← / →
            b-td 上一頁 / 下一頁切換
          b-tr
            b-td: kbd 空白鍵 (Space)
            b-td 暫停 / 恢復自動輪播
          b-tr
            b-td: kbd F
            b-td 切換全螢幕電視牆模式
          b-tr
            b-td: kbd R
            b-td 立即重新整理資料

      hr
      h6.font-weight-bold.text-primary
        lah-fa-icon(icon="circle-info").mr-1
        span 案件狀態與四階段進度說明
      ul.mb-0
        li #[strong 4 階段進度條]：依序為 #[span.badge.badge-secondary 1. 收件] → #[span.badge.badge-primary 2. 審查] → #[span.badge.badge-warning 3. 登校] → #[span.badge.badge-success 4. 結案]。
        li #[strong 綠色燈號 (異動完成/結案/歸檔/公告)]：案件已順利結案完成。
        li #[strong 黃/橘色燈號 (登錄/校對)]：案件處於登簿校對作業中。
        li #[strong 紅色燈號 (補正/駁回/請示/展期/撤回)]：案件暫緩或待處置，卡片呈現紅色邊框與警示符號。
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    reloadMs: 60 * 1000,
    slideSecs: 15,
    slideIdx: 0,
    slideCount: 4,
    qday: '',
    qtime: '000000',
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    baked: [],
    fields: [
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '作業人員', sortable: true },
      { key: '異動時間', sortable: true }
    ],
    maxQueueSize: 12,
    buttonDisabled: false,
    isBusy: false,
    easyCase: true,
    reloadTimer: null,
    isAutoSliding: true,
    isFullscreen: false,
    statusFilter: 'all',
    audioNotify: false,
    reloadOptions: [
      { value: 30 * 1000, text: '每 30 秒' },
      { value: 60 * 1000, text: '每 1 分鐘 (預設)' },
      { value: 120 * 1000, text: '每 2 分鐘' },
      { value: 300 * 1000, text: '每 5 分鐘' },
      { value: 0, text: '關閉自動更新' }
    ]
  }),
  fetch () {
    if (this.buttonDisabled) {
      this.warning('查詢中，請稍後 ... ')
      return
    }
    this.buttonDisabled = true
    this.isBusy = true
    this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
    this.$axios.post(this.$consts.API.JSON.MOICAS, {
      type: 'crsms_update_by_date',
      qday: this.qday
    }).then(({ data }) => {
      const prevCount = this.baked.length
      this.baked = [...this.$utils.orderBy(data.baked, [(row) => {
        return this.latestUpdateTime(row)
      }], ['desc'])]
      if (this.audioNotify && prevCount > 0 && this.baked.length > prevCount) {
        this.playChime()
      }
    }).catch((err) => {
      console.warn(err)
    }).finally(() => {
      this.$refs.countdown?.setCountdown(this.reloadMs)
      this.reloadMs > 0 && this.$refs.countdown?.startCountdown()
      this.isBusy = false
      this.buttonDisabled = false
      this.slideIdx = 0
    })
  },
  head: {
    title: '登記異動案件追蹤-桃園市地政局'
  },
  computed: {
    caseText () {
      return this.easyCase ? '簡易案件' : '全部案件'
    },
    count () {
      return this.baked?.length || 0
    },
    formattedDay () {
      return this.$utils.addDateDivider(this.qday)
    },
    isToday () {
      const today = this.$utils.today('TW').replaceAll('-', '')
      return this.qday === today
    },
    easyCases () {
      return this.baked.filter(row => row.RM08 === '9')
    },
    normalCases () {
      return this.baked.filter(row => row.RM08 !== '9')
    },
    easyCount () {
      return this.easyCases.length
    },
    normalCount () {
      return this.normalCases.length
    },
    trackingCase () {
      if (this.easyCase) {
        return this.easyCases
      }
      return this.baked
    },
    completedCases () {
      return this.trackingCase.filter(r => ['結案', '異動完成', '歸檔', '公告'].some(s => (r['辦理情形'] || '').includes(s)))
    },
    completedCount () {
      return this.completedCases.length
    },
    completedRate () {
      return this.trackingCase.length ? Math.round((this.completedCount / this.trackingCase.length) * 100) : 0
    },
    processingCases () {
      return this.trackingCase.filter(r => ['登錄', '校對', '登簿', '初審', '複審', '准登'].some(s => (r['辦理情形'] || '').includes(s)))
    },
    processingCount () {
      return this.processingCases.length
    },
    alertCases () {
      return this.trackingCase.filter(r => ['撤回', '駁回', '請示', '展期', '補正'].some(s => (r['辦理情形'] || '').includes(s)))
    },
    alertCount () {
      return this.alertCases.length
    },
    filteredTrackingCase () {
      switch (this.statusFilter) {
        case 'completed': return this.completedCases
        case 'processing': return this.processingCases
        case 'alert': return this.alertCases
        default: return this.trackingCase
      }
    },
    queueChunks () {
      return this.$utils.chunk(this.filteredTrackingCase, this.maxQueueSize)
    },
    effectiveSlideCount () {
      return Math.min(this.queueChunks.length, this.slideCount || 4)
    }
  },
  watch: {
    slideSecs (val) {
      this.setCache('lah-reg-tracking-slide-secs', val)
    },
    slideCount (val) {
      this.setCache('lah-reg-tracking-slide-count', val)
    },
    reloadMs (val) {
      this.setCache('lah-reg-tracking-reload-ms', val)
      if (this.$refs.countdown) {
        this.$refs.countdown.setCountdown(val)
        val > 0 && this.$refs.countdown.startCountdown()
      }
    },
    easyCase (flag) {
      this.setCache('lah-reg-tracking-easy-case-flag', flag)
      this.slideIdx = 0
      if (this.pagination) {
        this.pagination.currentPage = 1
      }
    },
    statusFilter () {
      this.slideIdx = 0
      if (this.pagination) {
        this.pagination.currentPage = 1
      }
    },
    audioNotify (flag) {
      this.setCache('lah-reg-tracking-audio-notify', flag)
    },
    buttonDisabled (flag) {
      if (flag) {
        this.slideIdx = 0
      }
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
    this.slideSecs = parseInt(await this.getCache('lah-reg-tracking-slide-secs')) || 15
    this.slideCount = parseInt(await this.getCache('lah-reg-tracking-slide-count')) || 4
    this.reloadMs = parseInt(await this.getCache('lah-reg-tracking-reload-ms')) || (60 * 1000)
    const cachedEasyCase = await this.getCache('lah-reg-tracking-easy-case-flag')
    if (cachedEasyCase !== null && cachedEasyCase !== undefined) {
      this.easyCase = cachedEasyCase
    }
    this.audioNotify = await this.getCache('lah-reg-tracking-audio-notify') || false
  },
  mounted () {
    // reload page after 30 minutes to prevent Out of Memory issue
    this.reloadTimer = setInterval(() => { location.reload() }, 30 * 60 * 1000)

    // Keyboard navigation & Fullscreen listener
    window.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
  },
  beforeDestroy () {
    clearInterval(this.reloadTimer)
    window.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
  },
  methods: {
    latestUpdateTime (row) {
      const targetDate = this.$utils.empty(this.qday) ? this.$utils.today('TW').replaceAll('-', '') : this.qday
      let ok = false
      !ok && targetDate === row.RM105_1 && (ok = row.RM105_2)
      !ok && targetDate === row.RM107_1 && (ok = row.RM107_2)
      !ok && targetDate === row.RM106_1 && (ok = row.RM106_2)
      !ok && targetDate === row.RM93_1 && (ok = row.RM93_2)
      !ok && targetDate === row.RM86 && (ok = row.RM87)
      !ok && targetDate === row.RM53_1 && (ok = row.RM53_2)
      !ok && targetDate === row.RM48_1 && (ok = row.RM48_2)
      !ok && targetDate === row.RM83 && (ok = row.RM84)
      !ok && targetDate === row.RM80 && (ok = row.RM81)
      !ok && targetDate === row.RM58_1 && (ok = row.RM58_2)
      !ok && targetDate === row.RM56_1 && (ok = row.RM56_2)
      !ok && targetDate === row.RM54_1 && (ok = row.RM54_2)
      !ok && targetDate === row.RM46_1 && (ok = row.RM46_2)
      !ok && targetDate === row.RM62_1 && (ok = row.RM62_2)
      !ok && targetDate === row.RM44_1 && (ok = row.RM44_2)
      !ok && targetDate === row.RM07_1 && (ok = row.RM07_2)
      return ok || ''
    },
    checkWithCurrentTime (tmp, current) {
      if (tmp && tmp <= current) {
        return tmp
      }
      return false
    },
    handlePaginationInput (payload) {
      this.setCache('reg-today-table-perPage', payload.perPage)
    },
    shiftDay (delta) {
      const adDate = this.$utils.twToAdDateObj(this.qday)
      if (adDate) {
        adDate.setDate(adDate.getDate() + delta)
        this.qday = this.$utils.twDateStr(adDate).replaceAll('-', '')
        this.$fetch()
      }
    },
    setToday () {
      this.qday = this.$utils.today('TW').replaceAll('-', '')
      this.$fetch()
    },
    prevSlide () {
      if (this.$refs.carousel) {
        this.$refs.carousel.prev()
      } else {
        this.slideIdx = (this.slideIdx - 1 + this.queueChunks.length) % this.queueChunks.length
      }
    },
    nextSlide () {
      if (this.$refs.carousel) {
        this.$refs.carousel.next()
      } else {
        this.slideIdx = (this.slideIdx + 1) % this.queueChunks.length
      }
    },
    toggleAutoSlide () {
      this.isAutoSliding = !this.isAutoSliding
    },
    toggleEasyCase () {
      this.easyCase = !this.easyCase
    },
    setStatusFilter (filter) {
      this.statusFilter = filter
      this.slideIdx = 0
    },
    toggleFullscreen () {
      if (!document.fullscreenElement) {
        const el = document.documentElement
        if (el.requestFullscreen) {
          el.requestFullscreen().catch((err) => {
            console.warn('Fullscreen error:', err)
          })
        }
        this.isFullscreen = true
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        }
        this.isFullscreen = false
      }
    },
    handleFullscreenChange () {
      this.isFullscreen = !!document.fullscreenElement
    },
    handleKeyDown (e) {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : ''
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.target.isContentEditable) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.prevSlide()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.nextSlide()
      } else if (e.code === 'Space') {
        e.preventDefault()
        this.toggleAutoSlide()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        this.toggleFullscreen()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        this.$fetch()
      }
    },
    playChime () {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) {
          return
        }
        const ctx = new AudioContext()
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc1.type = 'sine'
        osc2.type = 'sine'
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc1.start(ctx.currentTime)
        osc1.stop(ctx.currentTime + 0.15)
        osc2.start(ctx.currentTime + 0.1)
        osc2.stop(ctx.currentTime + 0.6)
      } catch (e) {
        // Audio context may require interaction or be unsupported
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.h-48px {
  height: 48px !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.live-status-pill {
  height: 48px;
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.25);
  padding: 0 14px;
  border-radius: 24px;

  .live-dot {
    width: 10px;
    height: 10px;
    background: #28a745;
    border-radius: 50%;
    margin-right: 8px;
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
    animation: livePulse 2s infinite;
  }

  .live-text {
    font-weight: 800;
    font-size: 0.85rem;
    color: #28a745;
    letter-spacing: 1px;
  }
}

@keyframes livePulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(40, 167, 69, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

.header-main-title {
  font-size: 1.35rem;
  letter-spacing: 0.5px;
}

.date-nav-group {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.tracking-dashboard-body {
  &.fullscreen-mode {
    background: #f4f6f9;
    min-height: 100vh;
    padding: 1rem !important;
  }
}

.kpi-ribbon {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
}

.kpi-chip {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: #f8f9fa;
    border-color: #dee2e6;
  }

  &.active {
    background: #eef2ff;
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
  }

  &.has-alert {
    animation: alertBorderPulse 2s infinite;
  }
}

@keyframes alertBorderPulse {
  0% { border-color: transparent; }
  50% { border-color: #dc3545; }
  100% { border-color: transparent; }
}

.kpi-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 12px;

  &.bg-primary-light { background: #e0e7ff; }
  &.bg-success-light { background: #dcfce7; }
  &.bg-warning-light { background: #fef3c7; }
  &.bg-danger-light { background: #fee2e2; }
}

.kpi-content {
  .kpi-label {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 600;
  }
  .kpi-value {
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.1;

    .unit {
      font-size: 0.85rem;
      font-weight: 500;
      color: #6c757d;
    }
  }
  .kpi-sub {
    font-size: 0.75rem;
    margin-top: 2px;
  }
}

.slide-page-badge {
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
}

.slide-progress-track {
  width: 100%;
  height: 3px;
  background: #e2e8f0;
  overflow: hidden;
}

.slide-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  width: 0%;
  animation-name: slideProgress;
  animation-timing-function: linear;
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

@keyframes slideProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}

.empty-state-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.tracking-carousel {
  ::v-deep .carousel-item {
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }
}
</style>
