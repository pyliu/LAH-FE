<template lang="pug">
//- Mod: 使用 themeMode 控制樣式，加入 auto-theme 支援 CSS 變數漸變
client-only: .dark-container(
  v-cloak,
  :class="{ 'dark-mode': isForceDark, 'auto-theme': themeMode === 'auto' }",
  :style="dynamicThemeStyles"
)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          //- Mod: 使用動態標題
          .my-auto {{ pageTitle }}
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
          //- ✨ 新增：即時時鐘顯示 (僅在寬螢幕顯示，避免手機版太擠)
          .m-2.d-none.d-lg-flex.align-items-center.font-weight-bold.s-100(
            style="opacity: 0.9; letter-spacing: 0.5px; transition: color 1s ease",
            title="目前系統時間"
          )
            span {{ currentTime }}

        .d-flex.align-items-center
          //- Mod: 燈號提示區塊
          .mr-1(
            :title="red > 0 ? `異常項目清單:\n` + redDetailList : '目前無異常項目'",
            style="cursor: help"
          ) 🔴 {{ red }}
          .mr-1(
            :title="yellow > 0 ? `警告項目清單:\n` + yellowDetailList : '目前無警告項目'",
            style="cursor: help"
          ) 🟡 {{ yellow }}
          .mr-1(
            :title="green > 0 ? `正常項目清單:\n` + greenDetailList : '目前無正常項目'",
            style="cursor: help"
          ) 🟢 {{ green }}
          .mr-1(
            v-if="gray > 0",
            :title="`載入中或未知狀態清單:\n` + grayDetailList",
            style="cursor: help"
          ) ⚪ {{ gray }}

          //- Mod: 將切換按鈕升級為三態 (淺色 -> 深色 -> 自動漸層)
          lah-button.mr-1(
            @click="toggleTheme",
            :icon="themeIcon",
            :variant="themeVariant",
            size="lg",
            no-border,
            no-icon-gutter,
            :title="themeTitle"
          )

          lah-button.mr-1(
            @click="col2 = !col2",
            :icon="col2 ? 'th' : 'th-large'",
            size="lg",
            :variant="isForceDark ? 'outline-light' : 'outline-dark'",
            no-border,
            no-icon-gutter,
            :title="col2 ? '切換為標準三欄檢視' : '切換為放大兩欄檢視'"
          )

          b-button-group(size="lg")
            lah-button.mr-1(
              @click="$refs.printerSetupModal.show()",
              icon="print",
              variant="outline-primary",
              no-border,
              no-icon-gutter,
              title="設定列印伺服器"
            )
            lah-button(
              @click="$refs.setupModal.show()",
              icon="cog",
              variant="outline-secondary",
              action="clock",
              no-border,
              no-icon-gutter,
              title="設定EMAIL伺服器"
            )
    lah-monitor-board-setup-modal(ref="setupModal")
    lah-monitor-board-printer-setup-modal(ref="printerSetupModal")

    lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="智慧監控儀表板說明")
      h5.d-flex.align-items-center
        lah-fa-icon(icon="lightbulb" regular, variant="secondary")
        span.ml-2 功能總覽
      p 本儀表板旨在提供一個集中式的監控畫面，即時顯示各項系統服務與硬體設備的健康狀態。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="traffic-light", variant="secondary")
        span.ml-2 燈號與狀態
      ul
        li 頁面頂端會即時統計目前所有監控項目的燈號數量，#[strong 滑鼠移至數字上可查看詳細清單]。
        li 當監控項目出現 #[strong 紅燈] 或 #[strong 黃燈] 時，其監控面板將會自動置頂。
        li 若燈號狀態相同，則依照 #[strong 面板預設順序] 進行排列，確保畫面穩定。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="palette", variant="secondary")
        span.ml-2 主題切換 (新增漸層模式)
      p 點擊右上角的主題按鈕，可在三種模式間循環切換：
      ul
        li ☀️ #[strong 淺色模式]：固定最亮色系。
        li 🌙 #[strong 深色模式]：固定最暗色系。
        li 🕒 #[strong 自動漸層]：早上 8 點前為淺色，8 點至下午 5 點間會隨時間「每分鐘慢慢變暗」，下午 5 點後進入深色。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="thumbtack", variant="secondary")
        span.ml-2 釘選功能
      p 您可以點擊每個面板右上角的圖釘圖示來固定該面板。排序優先級：#[strong 紅燈 > 黃燈 > 已釘選 > 一般]。

  transition-group.d-flex.flex-wrap.align-content-start(
    tag="div",
    name="board-list"
  )
    div.monitor-card-wrapper(
      v-for="board in currentSortedBoards"
      :key="board.id"
      :class="colCss"
    )
      .pin-btn(
        @click="togglePin(board)"
        :class="{ active: board.pinned }"
        title="釘選/取消釘選此面板"
      )
        lah-fa-icon(icon="thumbtack", :variant="board.pinned ? 'danger' : 'secondary'")

      component(
        :is="board.comp"
        :ref="board.searchName"
        :id="board.searchName + '-attention'"
        :class="[heightCss, board.extraClass, board.pinned ? 'pinned-highlight' : '']"
        v-bind="board.props"
        :footer="board.footer"
        @light-update="lightUpdate($event, board)"
      )
</template>

<script>
import LahMonitorBoardPrinterSetupModal from '~/components/lah-monitor-board-printer-setup-modal.vue';

const DEFAULT_BOARDS = [
  { id: 'xap', comp: 'lah-monitor-board-xap', header: 'XAP 服務', footer: false, pinned: true },
  { id: 'powerha', comp: 'lah-monitor-board-powerha', header: 'PowerHA 狀態', footer: true, pinned: true },
  { id: 'dataguard', comp: 'lah-monitor-board-dataguard', header: 'DataGuard 同步', footer: true, pinned: true },
  { id: 'xap-trend', comp: 'lah-monitor-board-xap-trend', header: 'XAP 案件趨勢', footer: false, props: { watchTopXap: true, reloadTime: 15 } },
  { id: 'srmas', comp: 'lah-monitor-board-srmas', header: 'SRMAS 系統', footer: true, extraClass: 'fix-img' },
  { id: 'hacmp', comp: 'lah-monitor-board-hacmp', header: 'HACMP 狀態', footer: true },
  { id: 'sms-notify', comp: 'lah-monitor-board-sms-notify', header: '地籍異動即時通', footer: true },
  { id: 'sms', comp: 'lah-monitor-board-sms', header: '綜合簡訊監控', footer: true },
  { id: 'l05', comp: 'lah-monitor-board-L05', header: 'L05 系統', footer: true },
  { id: 'apbackup', comp: 'lah-monitor-board-apbackup', header: 'AP 主機備份', footer: true },
  { id: 'xcase-sync', comp: 'lah-monitor-board-xcase-sync', header: '跨縣市案件同步', footer: false },
  { id: 'site-hx', comp: 'lah-monitor-board-site-hx', header: '市內8所狀態', footer: false },
  { id: 'lxhweb', comp: 'lah-monitor-board-lxhweb', header: 'L3HWEB 主機', footer: false, props: { targetIp: 'L3HWEB', link: true, displayUpdateTime: true } },
  { id: 'site-tw', comp: 'lah-monitor-board-site-tw', header: '跨域伺服器狀態', footer: false },
  { id: 'dbbackup', comp: 'lah-monitor-board-dbbackup', header: '資料庫備份', footer: true },
  { id: 'connectivity', comp: 'lah-monitor-board-connectivity', header: '外部連線狀態', footer: false },
  { id: 'vmclone', comp: 'lah-monitor-board-vmclone', header: 'VM Clone 狀態', footer: true },
  { id: 'tape', comp: 'lah-monitor-board-tape', header: '磁帶備份', footer: true },
  { id: 'testdb', comp: 'lah-monitor-board-testdb', header: '測試資料庫', footer: false },
  { id: 'adsync', comp: 'lah-monitor-board-adsync', header: 'AD 帳號同步', footer: true },
  { id: 'apconn', comp: 'lah-monitor-board-apconn', header: 'AP 連線數', footer: false },
  { id: 'ups', comp: 'lah-monitor-board-ups', header: 'UPS 不斷電系統', footer: true }
]

const HA_ONLY_BOARDS = ['lah-monitor-board-adsync', 'lah-monitor-board-vmclone', 'lah-monitor-board-testdb', 'lah-monitor-board-ups']

export default {
  components: { LahMonitorBoardPrinterSetupModal },
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    gray: 0,
    redDetailList: '',
    yellowDetailList: '',
    greenDetailList: '',
    grayDetailList: '',
    attentionList: [],
    attentionTimer: null,
    col2: false,

    // ✨ 時鐘相關
    currentTime: '',
    clockTimer: null,

    // ✨ 主題相關狀態
    themeMode: 'light', // 'light', 'dark', 'auto'
    themeRatio: 0, // 0 到 1 的漸變進度
    autoThemeTimer: null,

    boards: [],
    pinnedIds: [],
    currentSortedBoards: [],
    debouncedSort: null
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
    isHX () { return this.$route.query.mode === 'HX' },
    pageTitle () {
      const site = this.$store.getters['user/siteName']
      return site ? `${site}監控儀表板` : (this.isHX ? '本所監控儀表板' : '桃園所監控儀表板')
    },
    pinnedCacheKey () { return this.isHX ? 'dashboard-pinned-hx' : 'dashboard-pinned-ha' },
    colCss () { return this.col2 ? ['col-md-6'] : ['col-md-4'] },
    heightCss () { return this.col2 ? ['card-body-fixed-height-2'] : ['card-body-fixed-height-3'] },
    dangerList () { return this.attentionList.filter(item => item.state === 'danger') },
    warningList () { return this.attentionList.filter(item => item.state === 'warning') },
    lightMap () { return this.$store.getters['inf/monitorLightMap'] },
    monitorPrintersConfig () { return this.systemConfigs?.monitor_printers },

    // ✨ 主題介面 Computed
    isForceDark () { return this.themeMode === 'dark' || (this.themeMode === 'auto' && this.themeRatio >= 1) },
    themeIcon () {
      if (this.themeMode === 'auto') { return 'clock' }
      return this.themeMode === 'dark' ? 'moon' : 'sun'
    },
    themeVariant () {
      if (this.themeMode === 'auto') { return 'outline-info' }
      return this.themeMode === 'dark' ? 'outline-warning' : 'outline-secondary'
    },
    themeTitle () {
      if (this.themeMode === 'auto') { return '目前為: 自動漸層模式 (點擊切換為淺色)' }
      return this.themeMode === 'dark' ? '目前為: 深色模式 (點擊切換為自動漸層)' : '目前為: 淺色模式 (點擊切換為深色)'
    },

    // ✨ 動態計算 CSS Variables (用於漸層覆蓋)
    dynamicThemeStyles () {
      if (this.themeMode !== 'auto') { return {} }

      let ratio = this.themeRatio
      if (ratio < 0) { ratio = 0 }
      if (ratio > 1) { ratio = 1 }

      let bg, cardBg, text, textMuted, border, canvasFilter

      // ✨ 根據現代 UI 設計原則重構漸層演算法
      // 避免文字與背景同時變灰導致的「低對比死亡交叉」
      if (ratio <= 0.8) {
        // 【第一階段】08:00 ~ 15:12 (佔 80% 時間)
        // 動作：維持淺色主題，背景僅微微變暗變得柔和，字體保持深黑
        const localRatio = ratio / 0.8
        bg = this.interpolateColor('#f4f6f9', '#e0e4e8', localRatio)
        cardBg = this.interpolateColor('#ffffff', '#f1f3f6', localRatio)
        text = '#212529' // 強制深字，不漸層
        textMuted = '#6c757d'
        border = this.interpolateColor('#dee2e6', '#ced4da', localRatio)
        canvasFilter = 'none'
      } else if (ratio <= 0.9) {
        // 【第二階段】15:12 ~ 16:06 (黃昏過渡期)
        // 動作：背景快速降為深灰藍色，文字在切換中點「瞬間反白」，避開泥濘的灰色
        const localRatio = (ratio - 0.8) / 0.1
        bg = this.interpolateColor('#e0e4e8', '#2c3640', localRatio)
        cardBg = this.interpolateColor('#f1f3f6', '#343e48', localRatio)
        border = this.interpolateColor('#ced4da', '#495057', localRatio)

        // 【關鍵】中位數交叉時強制反轉文字，確保對比度永遠大於 4.5:1
        if (localRatio < 0.4) {
          text = '#212529'
          textMuted = '#495057'
          canvasFilter = 'none'
        } else {
          text = '#f8f9fa'
          textMuted = '#adb5bd'
          canvasFilter = 'invert(0.85) hue-rotate(180deg)'
        }
      } else {
        // 【第三階段】16:06 ~ 17:00 (入夜深化期)
        // 動作：從黃昏深灰藍色緩慢過渡到純暗黑模式
        const localRatio = (ratio - 0.9) / 0.1
        bg = this.interpolateColor('#2c3640', '#121212', localRatio)
        cardBg = this.interpolateColor('#343e48', '#1e1e1e', localRatio)
        text = this.interpolateColor('#f8f9fa', '#e0e0e0', localRatio)
        textMuted = this.interpolateColor('#adb5bd', '#a0aab5', localRatio)
        border = this.interpolateColor('#495057', '#343a40', localRatio)
        canvasFilter = 'invert(0.85) hue-rotate(180deg)'
      }

      return {
        '--dyn-bg': bg,
        '--dyn-card-bg': cardBg,
        '--dyn-text': text,
        '--dyn-text-muted': textMuted,
        '--dyn-border': border,
        '--dyn-canvas-filter': canvasFilter
      }
    }
  },
  watch: {
    col2 (flag) { this.setCache('dashboard-col2', flag) },
    themeMode (mode) {
      this.setCache('dashboard-theme-mode', mode)
      // ✨ 效能優化：根據模式動態啟動/關閉漸層計時器
      if (mode === 'auto') {
        this.startAutoThemeTimer()
      } else {
        this.stopAutoThemeTimer()
      }
      this.applyThemeState()
    },
    themeRatio () {
      this.applyThemeState()
    },
    monitorPrintersConfig: {
      handler () { this.mergePrinterBoards() },
      immediate: true
    },
    '$route.query.mode' () { location.reload() }
  },
  created () {
    this.debouncedSort = this.$utils.debounce(this.sortBoards, 3000)

    const filteredBoards = this.isHX
      ? DEFAULT_BOARDS.filter(board => !HA_ONLY_BOARDS.includes(board.comp))
      : DEFAULT_BOARDS

    this.boards = filteredBoards.map(board => ({
      ...board,
      realName: null,
      lastUpdate: 0,
      pinned: board.pinned === true,
      id: board.id || `${board.comp}-${this.$utils.rand(10000)}`,
      searchName: this.toCamelCase(board.comp)
    }))

    this.mergePrinterBoards()
    this.currentSortedBoards = [...this.boards]

    Promise.all([
      this.getCache(this.pinnedCacheKey),
      this.getCache('dashboard-col2'),
      this.getCache('dashboard-theme-mode'),
      this.getCache('dashboard-dark-mode')
    ]).then(([pinnedIds, col2, themeMode, oldDarkMode]) => {
      if (Array.isArray(pinnedIds)) {
        this.pinnedIds = pinnedIds
        this.boards.forEach(b => b.pinned = this.pinnedIds.includes(b.id))
      } else {
        this.pinnedIds = this.boards.filter(b => b.pinned).map(b => b.id)
      }

      if (col2 !== null) { this.col2 = col2 }

      if (themeMode) {
        this.themeMode = themeMode
      } else if (oldDarkMode !== null) {
        this.themeMode = oldDarkMode ? 'dark' : 'light'
      }

      // ✨ 效能優化：初始化時，若為 auto 模式才啟動計時器
      if (this.themeMode === 'auto') {
        this.startAutoThemeTimer()
      } else {
        this.updateThemeProgress()
      }

      this.applyThemeState()
      this.sortBoards()
    })
  },
  mounted () {
    // 啟動時鐘
    this.updateClock()
    this.clockTimer = setInterval(this.updateClock, 1000)

    this.refreshHighlightGroup = this.$utils.debounce(() => {
      const tmp = []
      for (const [key, value] of this.lightMap) {
        if (['warning', 'danger'].includes(value)) {
          tmp.push({
            compName: key.charAt(0).toLowerCase() + key.slice(1),
            state: value
          })
        }
      }
      this.attentionList = this.$utils.orderBy(tmp, 'state')
    }, 5000)

    this.attentionTimer = setInterval(() => {
      this.dangerList.forEach((card) => {
        this.timeout(() => this.attention(`#${card.compName}-attention`, { speed: '1s' }), this.$utils.rand(15) * 1000)
      })
      this.warningList.forEach((card) => {
        this.timeout(() => this.attention(`#${card.compName}-attention`, { name: 'headShake' }), this.$utils.rand(15) * 1000)
      })
    }, 30 * 1000)

    this.refreshHighlightGroup()

    this.redDetailList = this.getDetailList('danger')
    this.yellowDetailList = this.getDetailList('warning')
    this.greenDetailList = this.getDetailList('success')
    this.grayDetailList = this.getDetailList('gray')
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
    clearInterval(this.clockTimer) // ✨ 清除時鐘計時器
    this.stopAutoThemeTimer() // ✨ 清除漸層計時器
    if (typeof document !== 'undefined') { document.body.style.backgroundColor = '' }
  },
  methods: {
    toggleTheme () {
      if (this.themeMode === 'light') { this.themeMode = 'dark' } else if (this.themeMode === 'dark') { this.themeMode = 'auto' } else { this.themeMode = 'light' }
    },

    // ✨ 新增：更新即時時間
    updateClock () {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const date = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const day = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]

      this.currentTime = `${year}-${month}-${date} (${day}) ${hours}:${minutes}:${seconds}`
    },

    // ✨ 新增：啟動漸層計時器
    startAutoThemeTimer () {
      if (!this.autoThemeTimer) {
        this.updateThemeProgress()
        this.autoThemeTimer = setInterval(this.updateThemeProgress, 60 * 1000)
      }
    },

    // ✨ 新增：停止漸層計時器
    stopAutoThemeTimer () {
      if (this.autoThemeTimer) {
        clearInterval(this.autoThemeTimer)
        this.autoThemeTimer = null
      }
    },

    updateThemeProgress () {
      if (this.themeMode !== 'auto') { return }
      const now = new Date()

      // 計算包含小數的小時
      const time = now.getHours() + (now.getMinutes() / 60)

      let ratio = 0

      if (time <= 8) {
        ratio = 0
      } else if (time >= 17) {
        ratio = 1
      } else {
        ratio = (time - 8) / 9
      }

      this.themeRatio = ratio
    },

    applyThemeState () {
      if (typeof document === 'undefined') { return }

      if (this.themeMode === 'dark') {
        document.body.style.backgroundColor = '#121212'
      } else if (this.themeMode === 'light') {
        document.body.style.backgroundColor = '#f4f6f9'
      } else if (this.themeMode === 'auto') {
        document.body.style.backgroundColor = this.dynamicThemeStyles['--dyn-bg'] || ''
      }
    },

    interpolateColor (hex1, hex2, ratio) {
      const parseHex = h => parseInt(h.replace('#', ''), 16)
      const r1 = (parseHex(hex1) >> 16) & 255
      const g1 = (parseHex(hex1) >> 8) & 255
      const b1 = parseHex(hex1) & 255

      const r2 = (parseHex(hex2) >> 16) & 255
      const g2 = (parseHex(hex2) >> 8) & 255
      const b2 = parseHex(hex2) & 255

      const r = Math.round(r1 + (r2 - r1) * ratio)
      const g = Math.round(g1 + (g2 - g1) * ratio)
      const b = Math.round(b1 + (b2 - b1) * ratio)

      return `rgb(${r}, ${g}, ${b})`
    },

    getDetailList (type) {
      const list = this.boards.filter((board) => {
        const name = board.realName || board.searchName
        const status = this.lightMap.get(name)
        if (type === 'gray') { return !['success', 'warning', 'danger'].includes(status) }
        return status === type
      })

      if (list.length === 0) { return '' }

      return list.map((board) => {
        if (board.header) { return ` - ${board.header}` }
        if (board.realName) { return ` - ${board.realName}` }

        let simpleName = board.comp.replace('lah-monitor-board-', '')
        if (board.props && (board.props.targetIp || board.props.serverIp)) {
          simpleName += ` (${board.props.targetIp || board.props.serverIp})`
        }
        return ` - ${simpleName.charAt(0).toUpperCase() + simpleName.slice(1)}`
      }).join('\n')
    },

    sortBoards () {
      this.currentSortedBoards = [...this.boards].sort((a, b) => {
        const weightDiff = this.getWeight(a) - this.getWeight(b)
        if (weightDiff !== 0) { return weightDiff }

        const timeDiff = (b.lastUpdate || 0) - (a.lastUpdate || 0)
        if (timeDiff !== 0) { return timeDiff }

        const indexA = DEFAULT_BOARDS.findIndex(board => board.id === a.id)
        const indexB = DEFAULT_BOARDS.findIndex(board => board.id === b.id)

        if (indexA === -1 && indexB === -1) {
          return a.id.localeCompare(b.id)
        }
        if (indexA === -1) { return 1 }
        if (indexB === -1) { return -1 }

        return indexA - indexB
      })
    },

    togglePin (board) {
      board.pinned = !board.pinned
      if (board.pinned) {
        if (!this.pinnedIds.includes(board.id)) { this.pinnedIds.push(board.id) }
      } else {
        this.pinnedIds = this.pinnedIds.filter(id => id !== board.id)
      }
      this.setCache(this.pinnedCacheKey, this.pinnedIds)
      this.sortBoards()
    },

    mergePrinterBoards () {
      try {
        const configStr = this.systemConfigs?.monitor_printers
        const printers = configStr ? JSON.parse(configStr) : []

        const baseBoards = this.boards.filter(b => b.comp !== 'lah-monitor-board-printer')

        const newPrinterBoards = printers.map((p) => {
          const id = `printer-${p.ip}-${p.port}`
          const isPinned = this.pinnedIds.includes(id)

          return {
            id,
            comp: 'lah-monitor-board-printer',
            header: `列印伺服器 ${p.ip}`,
            footer: true,
            props: { size: 'xs', serverIp: p.ip, serverPort: String(p.port), apiKey: p.key },
            realName: null,
            lastUpdate: 0,
            pinned: isPinned,
            searchName: 'LahMonitorBoardPrinter'
          }
        })

        this.boards = [...baseBoards, ...newPrinterBoards]
        this.sortBoards()
      } catch (e) {
        console.error('Failed to parse printer configs', e)
      }
    },

    lightUpdate (payload, board) {
      if (board) {
        if (payload?.name && board.realName !== payload.name) {
          board.realName = payload.name
        }
        board.lastUpdate = new Date().getTime()
      }

      this.lightMap.set(payload.name, payload.new)

      let r = 0; let y = 0; let g = 0
      for (const value of this.lightMap.values()) {
        if (value === 'danger') { r++ } else if (value === 'warning') { y++ } else if (value === 'success') { g++ }
      }

      this.red = r; this.yellow = y; this.green = g

      const totalCards = this.currentSortedBoards.length
      const knownStatus = r + y + g
      this.gray = Math.max(0, totalCards - knownStatus)

      this.redDetailList = this.getDetailList('danger')
      this.yellowDetailList = this.getDetailList('warning')
      this.greenDetailList = this.getDetailList('success')
      this.grayDetailList = this.getDetailList('gray')

      this.refreshHighlightGroup()
      this.debouncedSort()
    },
    refreshHighlightGroup () { },
    isInAttention (name) {
      const clean = name[0]?.toUpperCase() + name?.slice(1)
      return this.lightMap.has(clean) && this.lightMap.get(clean) !== 'success'
    },
    isFooterEnable (name) {
      const comp = this.$refs[name]
      const instance = Array.isArray(comp) ? comp[0] : comp
      return instance?.$options?.propsData?.footer || false
    },
    toCamelCase (str) {
      return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
    },
    getWeight (board) {
      const searchName = board.realName || board.searchName
      const status = this.lightMap.get(searchName)
      if (status === 'danger') { return -3 }
      if (status === 'warning') { return -2 }
      if (board.pinned) { return -1 }
      return 0
    }
  }
}
</script>

<style lang="scss">
.col-md-4 > .card {
  height: calc((100vh - 150px) / 3);
  overflow: auto;
  margin-bottom: 1rem;
}
.col-md-6 > .card {
  height: calc((100vh - 150px) / 2);
  overflow: auto;
  margin-bottom: 1rem;
}
.fix-img {
  img {
    height: calc(100vh / 3 - 200px);
  }
}

// 容器項目設定
.monitor-card-wrapper {
  will-change: transform;
  backface-visibility: hidden;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.board-list-move {
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 50;
}

.board-list-enter-active,
.board-list-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.board-list-leave-active {
  position: absolute;
  z-index: 0;
}

.board-list-enter, .board-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.pin-btn {
  position: absolute;
  top: 5px;
  right: 20px;
  z-index: 1000;
  cursor: pointer;
  opacity: 0.1;
  transition: opacity 0.3s;
  font-size: 1.1rem;

  &:hover, &.active {
    opacity: 1;
  }
}

// 這是原本寫死黑框的基礎樣式
.pinned-highlight {
  border: 1.5px solid black !important;
  box-shadow: 0 0 0.1rem rgba(0, 123, 255, 0.5);
}

// ✨ 自動漸層樣式 (依賴行內綁定的 CSS 變數)
.auto-theme {
  transition: background-color 1s ease, color 1s ease;

  // 限制只覆寫「最外層」的監控卡片，避免破壞內部子卡片狀態色
  .monitor-card-wrapper > .card {
    background-color: var(--dyn-card-bg) !important;
    border-color: var(--dyn-border);
    transition: background-color 1s ease, border-color 1s ease;

    > .card-header, > .card-footer {
      border-bottom-color: var(--dyn-border);
      border-top-color: var(--dyn-border);
    }

    // 處理內層元件，讓其背景透明化以融入外層
    .card:not([class*="bg-"]),
    .list-group-item {
      background-color: transparent !important;
      border-color: var(--dyn-border);
    }
  }

  // ✨ 新增：覆寫原本的純黑框，讓置頂面板在下午變暗時能顯示為高對比的白色 / 淺灰邊框
  .pinned-highlight {
    border-color: var(--dyn-text) !important;
  }

  // 修改一般文字
  &, .card-body, .card-header, .card-footer {
    color: var(--dyn-text);
    transition: color 1s ease;
  }

  // 強制覆蓋子元件常寫死的深色文字
  .text-dark,
  .office-name,
  .area-name,
  a:not(.btn),
  .list-group-item,
  table, .table, th, td {
    color: var(--dyn-text) !important;
  }

  // 超連結與可點擊項目的 hover 狀態
  a:not(.btn):hover,
  .list-group-item-action:hover {
    color: var(--dyn-text-muted) !important;
  }

  // 處理次要文字 (如時間、輔助說明、次要狀態標籤)
  .text-muted, .text-secondary, small, .small, .local-max {
    color: var(--dyn-text-muted) !important;
  }

  // 讓內部小卡或網格邊框套用次要文字色，避免與底色融合
  .office, .office-name {
    border-color: var(--dyn-text-muted) !important;
  }

  // 處理 outline 按鈕能見度
  .btn-outline-secondary,
  .btn-outline-dark {
    color: var(--dyn-text) !important;
    border-color: var(--dyn-text) !important;

    // ✨ 擴充修正：加入 :focus 與 .active 狀態，並強制所有子元素變色
    &:hover, &:focus, &.active {
      color: var(--dyn-card-bg) !important;
      background-color: var(--dyn-text) !important;

      // ✨ 關鍵防呆：強制覆蓋按鈕內部可能存在的 span, .office-name, .text-dark
      // 確保 Hover 時裡面的字體一定會跟著背景反白，解決黑底黑字問題
      *, .office-name, .text-dark, .area-name {
        color: var(--dyn-card-bg) !important;
      }
    }
  }

  // 自動漸層模式下的圖表 (Chart.js Canvas) 動態濾鏡
  canvas {
    transition: filter 0.8s ease;
    filter: var(--dyn-canvas-filter, none);
  }

  // ✨ 新增修正：保護側邊欄 (Sidebar) 不受漸層主題覆蓋
  // 利用 CSS Specificity (權重) 進行完美的階層覆蓋，徹底解決白底白字問題
  .b-sidebar {
    // 1. Sidebar 大範圍設定 (第一層覆蓋：讓側邊欄內所有基礎文字與連結變成白字)
    color: rgba(255, 255, 255, 0.85) !important;

    .text-dark,
    .office-name,
    .area-name,
    a:not(.btn),
    .list-group-item,
    table, .table, th, td {
      color: rgba(255, 255, 255, 0.85) !important;
      background-color: transparent !important;
    }

    a:not(.btn):hover,
    .list-group-item-action:hover {
      color: #ffffff !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
    }

    .text-muted, .text-secondary, small, .small, .local-max {
      color: #adb5bd !important; // 恢復 Bootstrap 預設淺灰
    }

    // 2. Sidebar 內的白底卡片 (第二層覆蓋：利用多一個 .card 的更高權重，強制內部變回黑字)
    .card, .bg-white, .dropdown-menu, .popover, .toast {
      background-color: #ffffff !important;
      color: #212529 !important;

      // 這裡的權重會自動大於上面的第一層設定
      .text-dark,
      .office-name,
      .area-name,
      a:not(.btn),
      .list-group-item,
      table, .table, th, td {
        color: #212529 !important;
        background-color: transparent !important;
      }

      a:not(.btn):hover,
      .list-group-item-action:hover {
        color: #0056b3 !important; // 恢復 Bootstrap 預設的深藍色 hover
        background-color: rgba(0, 0, 0, 0.05) !important;
      }

      .text-muted, .text-secondary, small, .small, .local-max {
        color: #6c757d !important;
      }

      // 確保卡片的 header / footer 也有正確的底色與邊框
      .card-header, .card-footer {
        background-color: rgba(0, 0, 0, 0.03) !important;
        border-color: rgba(0, 0, 0, 0.125) !important;
        color: #212529 !important;
      }
    }
  }
}

// 在純「深色模式」下，也確保 Canvas 圖表字體反相
.dark-mode {
  canvas {
    filter: invert(0.85) hue-rotate(180deg);
  }
}
</style>
