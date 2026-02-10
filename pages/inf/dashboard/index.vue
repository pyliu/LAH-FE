<template lang="pug">
//- Mod: 使用 .dark-container 繼承全域暗色樣式
client-only: .dark-container(v-cloak, :class="{ 'dark-mode': isDarkMode }")
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

          lah-button.mr-1(
            @click="toggleTheme",
            :icon="isDarkMode ? 'sun' : 'moon'",
            :variant="isDarkMode ? 'outline-warning' : 'outline-secondary'",
            size="lg",
            no-border,
            no-icon-gutter,
            :title="isDarkMode ? '切換為淺色模式' : '切換為深色模式'"
          )

          lah-button.mr-1(
            @click="col2 = !col2",
            :icon="col2 ? 'th' : 'th-large'",
            size="lg",
            :variant="isDarkMode ? 'outline-light' : 'outline-dark'",
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

    //- Mod: 恢復完整說明內容
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
        li 頁面頂端會即時統計目前所有監控項目的燈號數量，#[strong 滑鼠移至數字上可查看詳細清單]：
          ul
            li 🔴 #[strong 紅燈]：表示監控項目發生嚴重錯誤或中斷。
            li 🟡 #[strong 黃燈]：表示監控項目出現警告或潛在問題。
            li 🟢 #[strong 綠燈]：表示監控項目運作正常。
            li ⚪ #[strong 白燈/灰燈]：表示監控項目正在初始化、載入中或狀態未知。
        li 當監控項目出現 #[strong 紅燈] 或 #[strong 黃燈] 時，其監控面板將會自動置頂，並透過動畫效果提醒管理人員注意。
        li 若燈號狀態相同，則依照 #[strong 更新時間] 排序，越近更新的會排在越前面。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="thumbtack", variant="secondary")
        span.ml-2 釘選功能
      p 您可以點擊每個面板右上角的 #[lah-fa-icon(icon="thumbtack", variant="danger")] 圖釘圖示來固定該面板。
      ul
        li 被釘選的面板在綠燈狀態下，會排在未釘選的面板前面。
        li 排序優先級：#[strong 紅燈 > 黃燈 > 已釘選 > 一般]。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="database", variant="secondary")
        span.ml-2 資料來源
      p 本儀表板透過以下三種方式獲取監控數據：
      ol
        li #[strong 電子郵件分析]：讀取特定郵件伺服器的郵件，分析主旨與內容來判斷服務狀態（例如：SRMAS、資料庫備份等）。
        li #[strong 智慧監控API]：呼叫安裝於遠端伺服器上的客製化API，獲取服務的即時狀態（例如：建物圖籍同步、地籍異動即時通等）。
        li #[strong 系統後端API]：直接存取本系統後端的API，查詢內部服務狀態（例如：L3同步、跨縣市AP服務等）。

  //- Mod: 核心動畫區塊
  transition-group.d-flex.flex-wrap.align-content-start(
    tag="div",
    name="board-list"
  )
    //- 保留 monitor-card-wrapper 用於解決 Grid 與 FLIP 衝突
    //- [Simp] 移除 style 綁定的隨機變數，回歸純淨 CSS
    div.monitor-card-wrapper(
      v-for="board in currentSortedBoards"
      :key="board.id"
      :class="colCss"
    )
      //- 釘選按鈕
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

// [Opt] 將靜態設定移出元件，減少 data() 負擔，提升可讀性
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

// HA 專屬面板列表 (用於 HX 模式過濾)
const HA_ONLY_BOARDS = ['lah-monitor-board-adsync', 'lah-monitor-board-vmclone', 'lah-monitor-board-testdb', 'lah-monitor-board-ups']

export default {
  components: { LahMonitorBoardPrinterSetupModal },
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    gray: 0,
    lastLightUpdate: 0,
    attentionList: [],
    attentionTimer: null,
    col2: false,
    isDarkMode: false,
    boards: [], // 將在 created 中初始化
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
    connectionText () {
      const monitor = this.systemConfigs?.monitor
      if (monitor?.ssl) {
        return `${monitor.account}@{${monitor.host}:993/imap/ssl/novalidate-cert}INBOX`
      }
      return `${monitor?.account}@{${monitor?.host}/novalidate-cert}INBOX`
    },
    monitorPrintersConfig () { return this.systemConfigs?.monitor_printers },
    redDetailList () { return this.getDetailList('danger') },
    yellowDetailList () { return this.getDetailList('warning') },
    greenDetailList () { return this.getDetailList('success') },
    grayDetailList () { return this.getDetailList('gray') }
  },
  watch: {
    col2 (flag) { this.setCache('dashboard-col2', flag) },
    isDarkMode (flag) {
      this.setCache('dashboard-dark-mode', flag)
      this.updateBodyBg(flag)
    },
    monitorPrintersConfig: {
      handler () { this.mergePrinterBoards() },
      immediate: true
    },
    '$route.query.mode' () { location.reload() }
  },
  created () {
    this.debouncedSort = this.$utils.debounce(this.sortBoards, 3000)

    // [Opt] 初始化並處理靜態看板
    // 1. 根據模式過濾
    // 2. 補全響應式屬性
    // 3. 預先計算 searchName (CamelCase) 避免排序時重複運算
    const filteredBoards = this.isHX
      ? DEFAULT_BOARDS.filter(board => !HA_ONLY_BOARDS.includes(board.comp))
      : DEFAULT_BOARDS

    this.boards = filteredBoards.map(board => ({
      ...board,
      realName: null,
      lastUpdate: 0,
      pinned: board.pinned === true,
      // Fallback ID 機制
      id: board.id || `${board.comp}-${this.$utils.rand(10000)}`,
      // 快取 CamelCase 名稱，提升 getWeight 效能
      searchName: this.toCamelCase(board.comp)
      // [Simp] 移除 animDuration，保持單純
    }))

    // 初始化顯示清單
    this.currentSortedBoards = [...this.boards]

    // 讀取設定
    Promise.all([
      this.getCache(this.pinnedCacheKey),
      this.getCache('dashboard-col2'),
      this.getCache('dashboard-dark-mode')
    ]).then(([pinnedIds, col2, darkMode]) => {
      // 處理釘選
      if (Array.isArray(pinnedIds)) {
        this.pinnedIds = pinnedIds
        this.boards.forEach((b) => {
          b.pinned = this.pinnedIds.includes(b.id)
        })
      } else {
        // 若無快取，則使用預設的釘選設定
        this.pinnedIds = this.boards.filter(b => b.pinned).map(b => b.id)
      }

      // 處理欄位與主題
      if (col2 !== null) { this.col2 = col2 }
      if (darkMode !== null) {
        this.isDarkMode = darkMode
        this.updateBodyBg(darkMode)
      }

      // 執行初次排序
      this.sortBoards()
    })
  },
  mounted () {
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
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
    this.updateBodyBg(false)
  },
  methods: {
    toggleTheme () { this.isDarkMode = !this.isDarkMode },
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121212' : ''
      }
    },
    getDetailList (type) {
      // this.lastLightUpdate // 建立依賴
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
      // 權重排序: Danger(-3) > Warning(-2) > Pinned(-1) > Normal(0)
      // 次要排序: 更新時間 (新 -> 舊)
      // 第三層排序: 原始 ID 順序 (確保穩定排序)
      this.currentSortedBoards = [...this.boards].sort((a, b) => {
        const weightDiff = this.getWeight(a) - this.getWeight(b)
        if (weightDiff !== 0) { return weightDiff }

        const timeDiff = (b.lastUpdate || 0) - (a.lastUpdate || 0)
        if (timeDiff !== 0) { return timeDiff }

        // 當權重和時間都相同時，使用 ID 保持穩定排序
        return a.id.localeCompare(b.id)
      })
    },
    togglePin (board) {
      board.pinned = !board.pinned // 直接操作物件
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

        // 保留非印表機的板子
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
            searchName: 'LahMonitorBoardPrinter' // 固定名稱
            // [Simp] 移除 animDuration
          }
        })

        this.boards = [...baseBoards, ...newPrinterBoards]
        this.sortBoards()
      } catch (e) {
        console.error('Failed to parse printer configs', e)
      }
    },
    lightUpdate (payload, board) {
      // 更新個別板子資訊
      if (board) {
        if (payload?.name && board.realName !== payload.name) {
          board.realName = payload.name
        }
        board.lastUpdate = new Date().getTime()
      }

      // 更新全域燈號統計
      this.lightMap.set(payload.name, payload.new)

      let r = 0; let y = 0; let g = 0
      for (const value of this.lightMap.values()) {
        if (value === 'danger') { r++ } else if (value === 'warning') { y++ } else if (value === 'success') { g++ }
      }

      this.red = r; this.yellow = y; this.green = g

      // 計算灰燈 (總數 - 已知狀態)
      const totalCards = this.currentSortedBoards.length
      const knownStatus = r + y + g
      this.gray = Math.max(0, totalCards - knownStatus)

      this.lastLightUpdate = new Date().getTime() // 觸發 computed 更新

      this.refreshHighlightGroup()
      this.debouncedSort()
    },
    refreshHighlightGroup () { /* placeholder for debouncing */ },
    isInAttention (name) {
      const clean = name[0]?.toUpperCase() + name?.slice(1)
      return this.lightMap.has(clean) && this.lightMap.get(clean) !== 'success'
    },
    isFooterEnable (name) {
      // [Opt] 簡化查詢邏輯
      const comp = this.$refs[name]
      // 處理 v-for refs 陣列情況
      const instance = Array.isArray(comp) ? comp[0] : comp
      return instance?.$options?.propsData?.footer || false
    },
    toCamelCase (str) {
      return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
    },
    getWeight (board) {
      // [Opt] 優先使用快取的 searchName
      const searchName = board.realName || board.searchName

      // 印表機 fallback 邏輯 (若有需要)
      if (!board.realName && board.comp.includes('printer') && board.props?.serverIp) { /* printer fallback */ }

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

// [Simp] 簡化版動畫樣式 - 穩定優先
// 容器項目設定
.monitor-card-wrapper {
  // 效能優化: 預告變動
  will-change: transform;

  // Edge/Chrome 優化: 減少渲染閃爍
  backface-visibility: hidden;

  // 移除複雜的 transition 定義，避免干擾 FLIP 計算
}

// 1. 移動中的項目 (FLIP 核心)
.board-list-move {
  // 使用固定的 0.6s 時間，確保穩定
  // 使用略為活潑的 cubic-bezier 曲線
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 50;
}

// 2. 進場 (Enter) 與 離場 (Leave)
.board-list-enter-active,
.board-list-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

// 離場時必須絕對定位，這是 Vue transition-group 的標準做法
.board-list-leave-active {
  position: absolute;
  z-index: 0;
}

// 3. 起始狀態
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
.pinned-highlight {
  border: 1.5px solid black !important;
  box-shadow: 0 0 0.1rem rgba(0, 123, 255, 0.5);
}
</style>
