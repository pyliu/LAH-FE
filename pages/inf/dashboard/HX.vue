<template lang="pug">
client-only: .monitor-dashboard(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto {{ siteName }}監控儀表板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )

        .d-flex.align-items-center
          //- Mod: 加入 title 提示，增加 UX
          .mr-1(title="異常項目數量") 🔴 {{ red }}
          .mr-1(title="警告項目數量") 🟡 {{ yellow }}
          .mr-1(title="正常項目數量") 🟢 {{ green }}
          //- Mod: 新增灰/白燈，用於顯示載入中或未知的項目，補足數字差額
          .mr-1(v-if="gray > 0", title="載入中或未知狀態數量") ⚪ {{ gray }}

          //- Mod: 優化 UI，將 Checkbox 改為圖示按鈕切換，節省空間並符合操作直覺
          //- 3欄模式(預設)顯示 th-large (放大) 圖示；2欄模式顯示 th (標準) 圖示
          lah-button.mr-1(
            @click="col2 = !col2",
            :icon="col2 ? 'th' : 'th-large'",
            size="lg",
            variant="outline-dark",
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
        li 頁面頂端會即時統計目前所有監控項目的燈號數量：
          ul
            li 🔴 #[strong 紅燈]：表示監控項目發生嚴重錯誤或中斷。
            li 🟡 #[strong 黃燈]：表示監控項目出現警告或潛在問題。
            li 🟢 #[strong 綠燈]：表示監控項目運作正常。
            //- Mod: 更新文件說明
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

  //- 使用 transition-group 來實現排序動畫
  //- 渲染 currentSortedBoards 而非 computed 屬性，以實現防抖效果
  transition-group.d-flex.flex-wrap.align-content-start(
    tag="div",
    name="board-list"
  )
    div(
      v-for="board in currentSortedBoards"
      :key="board.id"
      :class="colCss"
      style="position: relative"
    )
      //- 釘選按鈕 (絕對定位)
      .pin-btn(
        @click="togglePin(board)"
        :class="{ active: board.pinned }"
        title="釘選/取消釘選此面板"
      )
        lah-fa-icon(icon="thumbtack", :variant="board.pinned ? 'danger' : 'secondary'")

      component(
        :is="board.comp"
        :ref="toCamelCase(board.comp)"
        :id="toCamelCase(board.comp) + '-attention'"
        :class="[heightCss, board.extraClass, board.pinned ? 'pinned-highlight' : '']"
        v-bind="board.props"
        :footer="board.footer"
        @light-update="lightUpdate($event, board)"
      )

</template>

<script>
import LahMonitorBoardPrinterSetupModal from '~/components/lah-monitor-board-printer-setup-modal.vue';

export default {
  // middleware: ['isInf'], // authority control
  components: { LahMonitorBoardPrinterSetupModal },
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    // Mod: 新增 gray 用於統計未知狀態
    gray: 0,
    /** element in attentionList
     * e.g. {
     * compName: "lahMonitorBoardSrmas"
     * state: "danger"
     * }
     */
    attentionList: [],
    attentionTimer: null,
    topWarning: true,
    col2: false,
    // 定義所有面板的配置
    boards: [
      { comp: 'lah-monitor-board-xap', footer: false, pinned: true },
      { comp: 'lah-monitor-board-xap-trend', footer: false, props: { watchTopXap: true, reloadTime: 15 } },
      { comp: 'lah-monitor-board-powerha', footer: true, pinned: true },
      { comp: 'lah-monitor-board-dataguard', footer: true, pinned: true },
      { comp: 'lah-monitor-board-srmas', footer: true, extraClass: 'fix-img' },
      { comp: 'lah-monitor-board-hacmp', footer: true },
      { comp: 'lah-monitor-board-sms-notify', footer: true },
      { comp: 'lah-monitor-board-sms', footer: true },
      { comp: 'lah-monitor-board-L05', footer: true },
      { comp: 'lah-monitor-board-apbackup', footer: true },
      { comp: 'lah-monitor-board-xcase-sync', footer: false },
      { comp: 'lah-monitor-board-site-hx', footer: false },
      { comp: 'lah-monitor-board-lxhweb', footer: false, props: { targetIp: 'L3HWEB', link: true, displayUpdateTime: true } },
      { comp: 'lah-monitor-board-site-tw', footer: false },
      { comp: 'lah-monitor-board-dbbackup', footer: true },
      { comp: 'lah-monitor-board-connectivity', footer: false }
    ],
    // 儲存已釘選的 ID 列表
    pinnedIds: [],
    // 實際渲染在畫面上的列表 (經過去抖動處理)
    currentSortedBoards: [],
    // 用於存放防抖函數
    debouncedSort: null
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
    siteName () {
      return this.$store.getters['user/siteName'] || '本所'
    },
    colCss () {
      return this.col2 ? ['col-md-6'] : ['col-md-4']
    },
    heightCss () {
      return this.col2 ? ['card-body-fixed-height-2'] : ['card-body-fixed-height-3']
    },
    dangerList () {
      return this.attentionList.filter((item) => {
        return item.state === 'danger'
      })
    },
    warningList () {
      return this.attentionList.filter((item) => {
        return item.state === 'warning'
      })
    },
    highlightCount () {
      return this.attentionList.length
    },
    lightMap () {
      return this.$store.getters['inf/monitorLightMap']
    },
    connectionText () {
      // bureau ssl mail server needs this
      if (this.systemConfigs?.monitor?.ssl) {
        return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}:993/imap/ssl/novalidate-cert}INBOX`
      }
      return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}/novalidate-cert}INBOX`
    },
    // 用於監聽設定變更
    monitorPrintersConfig () {
      return this.systemConfigs?.monitor_printers
    }
  },
  watch: {
    col2 (flag) {
      this.setCache('dashboard-col2', flag)
    },
    // 當設定變更時，重新載入印表機面板
    monitorPrintersConfig: {
      handler () {
        this.mergePrinterBoards()
      },
      immediate: true
    }
  },
  created () {
    // 初始化防抖排序函數，延遲 3000ms 執行，避免畫面頻繁跳動
    this.debouncedSort = this.$utils.debounce(this.sortBoards, 3000)

    // 為靜態 boards 賦予 ID 並初始化狀態
    this.boards.forEach((board, index) => {
      if (!board.id) {
        const suffix = board.props?.serverIp ? `-${board.props.serverIp}` : ''
        board.id = `${board.comp}${suffix}-${index}`
        this.$set(board, 'realName', null)
        this.$set(board, 'lastUpdate', 0)
        // 優先使用 data 中的 pinned 設定，若無則預設為 false
        this.$set(board, 'pinned', board.pinned === true)
      }
    })

    // 讀取釘選紀錄 (使用 dashboard-pinned-hx 以區隔 HA)
    this.getCache('dashboard-pinned-hx').then((ids) => {
      if (Array.isArray(ids)) {
        // Case 1: 有快取紀錄 (以使用者紀錄為準)
        this.pinnedIds = ids
        this.boards.forEach((b) => {
          this.$set(b, 'pinned', this.pinnedIds.includes(b.id))
        })
      } else {
        // Case 2: 無快取紀錄 (首次載入，以程式碼預設值為準)
        this.pinnedIds = this.boards
          .filter(b => b.pinned)
          .map(b => b.id)
      }
      // 執行一次排序初始化
      this.sortBoards()
    })

    // 初始化 currentSortedBoards
    this.currentSortedBoards = [...this.boards]

    this.getCache('dashboard-col2').then((flag) => {
      this.col2 = flag
    })
  },
  mounted () {
    this.refreshHighlightGroup = this.$utils.debounce(() => {
      // to add warning/danger card to highlight group
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
        this.timeout(
          // 'slower', 'slow', '', 'fast', 'faster' (3s, 2s, 1s, 800ms, 500ms)
          () => this.attention(`#${card.compName}-attention`, { speed: '1s' }),
          this.$utils.rand(15) * 1000
        )
      })
      this.warningList.forEach((card) => {
        this.timeout(
          // 'slower', 'slow', '', 'fast', 'faster' (3s, 2s, 1s, 800ms, 500ms)
          () => this.attention(`#${card.compName}-attention`, { name: 'headShake' }),
          this.$utils.rand(15) * 1000
        )
      })
    }, 30 * 1000)

    this.refreshHighlightGroup()
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
  },
  methods: {
    // 執行排序並更新顯示列表 (核心邏輯)
    sortBoards () {
      const list = [...this.boards]
      this.currentSortedBoards = list.sort((a, b) => {
        // 第一順位：狀態權重 (-3 < -2 < -1 < 0)
        const weightDiff = this.getWeight(a) - this.getWeight(b)
        if (weightDiff !== 0) {
          return weightDiff
        }
        // 第二順位：更新時間 (越新越大 -> 越大排越前)
        const timeA = a.lastUpdate || 0
        const timeB = b.lastUpdate || 0
        return timeB - timeA
      })
    },
    togglePin (board) {
      this.$set(board, 'pinned', !board.pinned)

      // 更新 Cache
      if (board.pinned) {
        if (!this.pinnedIds.includes(board.id)) {
          this.pinnedIds.push(board.id)
        }
      } else {
        this.pinnedIds = this.pinnedIds.filter(id => id !== board.id)
      }
      this.setCache('dashboard-pinned-hx', this.pinnedIds)

      // 釘選操作屬於使用者主動行為，應立即重排，不需要防抖
      this.sortBoards()
    },
    // 根據系統設定動態合併印表機面板
    mergePrinterBoards () {
      try {
        const configStr = this.systemConfigs?.monitor_printers
        const printers = configStr ? JSON.parse(configStr) : []

        // 1. 移除現有的印表機面板 (避免重複)
        const baseBoards = this.boards.filter(b => b.comp !== 'lah-monitor-board-printer')

        // 2. 根據設定建立新的印表機面板
        const newPrinterBoards = printers.map((p, idx) => {
          const board = {
            comp: 'lah-monitor-board-printer',
            footer: true,
            props: {
              size: 'xs',
              serverIp: p.ip,
              // 強制轉型為字串，解決 Vue Prop Type 檢查錯誤
              serverPort: String(p.port),
              apiKey: p.key
            }
          }
          // 產生穩定 ID：printer-{IP}-{Port}
          board.id = `printer-${p.ip}-${p.port}`
          this.$set(board, 'realName', null)
          this.$set(board, 'lastUpdate', 0)

          // 檢查是否已釘選
          const isPinned = this.pinnedIds.includes(board.id)
          this.$set(board, 'pinned', isPinned)

          return board
        })

        // 3. 更新 this.boards 並立即重排
        this.boards = [...baseBoards, ...newPrinterBoards]
        this.sortBoards()
      } catch (e) {
        console.error('Failed to parse printer configs', e)
      }
    },
    lightUpdate (payload, board) {
      // 動態綁定：將組件發出的真實名稱記錄到 board 物件中
      if (board) {
        if (payload && payload.name) {
          // 更新 board.realName，觸發 computed 重算
          if (board.realName !== payload.name) {
            this.$set(board, 'realName', payload.name)
          }
        }
        // 更新最後更新時間
        this.$set(board, 'lastUpdate', new Date().getTime())
      }

      this.lightMap.set(payload.name, payload.new)

      // Mod: 優化統計邏輯，解決數字對不起來的問題
      let r = 0; let y = 0; let g = 0

      // 使用 for...of 遍歷一次，替代原本的三次 reduce，提升效能
      for (const value of this.lightMap.values()) {
        if (value === 'danger') r++
        else if (value === 'warning') y++
        else if (value === 'success') g++
      }

      this.red = r
      this.yellow = y
      this.green = g

      // Mod: 計算「灰色/未知」狀態的數量
      // 公式：目前畫面上的總卡片數 - (紅 + 黃 + 綠)
      // 這樣可以確保加總 (紅+黃+綠+灰) 永遠等於儀表板上的卡片總數
      const totalCards = this.currentSortedBoards.length
      const calculatedGray = totalCards - r - y - g
      this.gray = calculatedGray > 0 ? calculatedGray : 0

      this.refreshHighlightGroup()

      // 這裡改為呼叫防抖版本的排序，避免畫面頻繁跳動
      this.debouncedSort()
    },
    refreshHighlightGroup () { /* placeholder for debouncing */ },
    isInAttention (name) {
      const clean = name[0]?.toUpperCase() + name?.slice(1)
      return this.lightMap.has(clean) &&
             this.lightMap.get(clean) !== 'success'
    },
    isFooterEnable (name) {
      if (name) {
        const opts = this.$refs[`${name[0]?.toUpperCase() + name?.slice(1)}`]?.$options
        const footer = opts?.propsData?.footer
        return footer
      }
      return false
    },
    toCamelCase (str) {
      return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
    },
    normalizeName (name) {
      if (!name) return ''
      return name.charAt(0).toLowerCase() + name.slice(1)
    },
    // 計算權重
    // Danger: -3
    // Warning: -2
    // Pinned: -1
    // Normal: 0
    getWeight (board) {
      const searchName = board.realName || this.toCamelCase(board.comp)
      if (!board.realName && board.comp.includes('printer') && board.props?.serverIp) {
        // printer fallback logic
      }

      // 直接從 lightMap 獲取最新狀態
      const status = this.lightMap.get(searchName)

      if (status === 'danger') return -3
      if (status === 'warning') return -2

      // 若無異常，檢查是否被釘選
      if (board.pinned) { return -1 }

      return 0
    }
  }
}
</script>

<style lang="scss">
.monitor-dashboard {
  /* Ignored desktop font size settings */
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
  /* Force a base font size to avoid system scaling issues that break fixed-height layouts */
  font-size: 16px;
}
.highlight-group {
  border-bottom: 2px dashed gray;
  margin-bottom: 15px;
}
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
/* 列表排序動畫 - 必須配合 transition-group 使用 */
.board-list-move {
  transition: transform 1s;
}

/* 釘選按鈕樣式 */
.pin-btn {
  position: absolute;
  top: 5px; /* 原本是 10px，往上移動 5px */
  right: 20px; /* 原本是 25px，往右移動 5px */
  z-index: 1000;
  cursor: pointer;
  opacity: 0.1;
  transition: opacity 0.3s;
  font-size: 1.1rem;

  &:hover, &.active {
    opacity: 1;
  }
}

/* 釘選高亮樣式 (強制覆蓋) */
.pinned-highlight {
  border: 1.5px solid black !important; /* Bootstrap Primary Color */
  box-shadow: 0 0 0.1rem rgba(0, 123, 255, 0.5); /* 增加一點陰影讓它更明顯 */
}
</style>