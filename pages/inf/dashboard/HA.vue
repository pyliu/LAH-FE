<template lang="pug">
client-only: .monitor-dashboard(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto 桃園所監控儀表板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )

        .d-flex.align-items-center
          b-checkbox.mr-1.mt-2(
            v-model="col2",
            switch,
            size="lg"
          ) 2欄顯示
          .mr-1 🔴 {{ red }}
          .mr-1 🟡 {{ yellow }}
          .mr-1 🟢 {{ green }}
          b-button-group(size="lg")
            lah-button.mr-1(
              @click="$refs.printerSetupModal.show()",
              icon="print",
              variant="outline-secondary",
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
  //- 渲染 currentSortedBoards 而非 computed 屬性
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
      { comp: 'lah-monitor-board-xap', footer: false },
      { comp: 'lah-monitor-board-xap-trend', footer: false, props: { watchTopXap: true, reloadTime: 15 } },
      { comp: 'lah-monitor-board-powerha', footer: true },
      { comp: 'lah-monitor-board-dataguard', footer: true },
      { comp: 'lah-monitor-board-srmas', footer: true },
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
      { comp: 'lah-monitor-board-connectivity', footer: false },
      // Other HA boards
      { comp: 'lah-monitor-board-vmclone', footer: true },
      { comp: 'lah-monitor-board-tape', footer: true },
      { comp: 'lah-monitor-board-testdb', footer: true },
      { comp: 'lah-monitor-board-adsync', footer: true },
      { comp: 'lah-monitor-board-apconn', footer: false },
      { comp: 'lah-monitor-board-ups', footer: true }
    ],
    // 儲存已釘選的 ID 列表
    pinnedIds: [],
    // 實際渲染在畫面上的列表 (經過去抖動處理)
    currentSortedBoards: [],
    // 用於存放防抖函數
    debouncedSort: null
  }),
  head: {
    title: '桃園所智慧監控儀表板-桃園市地政局'
  },
  computed: {
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

    // 讀取釘選紀錄
    this.getCache('dashboard-pinned-ha').then((ids) => {
      this.pinnedIds = ids || []
      // 同步到 boards
      this.boards.forEach(b => {
        if (this.pinnedIds.includes(b.id)) {
          this.$set(b, 'pinned', true)
        }
      })
      // 讀取完釘選後，執行一次排序初始化
      this.sortBoards()
    })

    // 為靜態 boards 賦予 ID
    this.boards.forEach((board, index) => {
      if (!board.id) {
        const suffix = board.props?.serverIp ? `-${board.props.serverIp}` : ''
        board.id = `${board.comp}${suffix}-${index}`
        this.$set(board, 'realName', null)
        this.$set(board, 'lastUpdate', 0)
        this.$set(board, 'pinned', false) // 預設不釘選
      }
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
      this.setCache('dashboard-pinned-ha', this.pinnedIds)
      
      // 釘選操作屬於使用者主動行為，應立即重排，不需要防抖
      this.sortBoards()
    },
    mergePrinterBoards () {
      try {
        const configStr = this.systemConfigs?.monitor_printers
        const printers = configStr ? JSON.parse(configStr) : []

        const baseBoards = this.boards.filter(b => b.comp !== 'lah-monitor-board-printer')

        const newPrinterBoards = printers.map((p, idx) => {
          const board = {
            comp: 'lah-monitor-board-printer',
            footer: true,
            props: {
              size: 'xs',
              serverIp: p.ip,
              serverPort: String(p.port),
              apiKey: p.key
            }
          }
          board.id = `printer-${p.ip}-${p.port}`
          this.$set(board, 'realName', null)
          this.$set(board, 'lastUpdate', 0)
          
          // 檢查是否已釘選
          const isPinned = this.pinnedIds.includes(board.id)
          this.$set(board, 'pinned', isPinned)
          
          return board
        })

        this.boards = [...baseBoards, ...newPrinterBoards]
        // 面板增減後，立即執行一次排序
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
      const tmp = [...this.lightMap]
      this.green = tmp.reduce((acc, item) => {
        return item[1] === 'success' ? acc + 1 : acc
      }, 0)
      this.yellow = tmp.reduce((acc, item) => {
        return item[1] === 'warning' ? acc + 1 : acc
      }, 0)
      this.red = tmp.reduce((acc, item) => {
        return item[1] === 'danger' ? acc + 1 : acc
      }, 0)
      
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
      let searchName = board.realName || this.toCamelCase(board.comp)
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
/* 列表排序動畫 */
.board-list-move {
  transition: transform 1s;
}

/* 釘選按鈕樣式 */
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

/* 釘選高亮樣式 (強制覆蓋) */
.pinned-highlight {
  border: 1.5px solid black !important; /* Bootstrap Primary Color */
  box-shadow: 0 0 0.1rem rgba(0, 123, 255, 0.5); /* 增加一點陰影讓它更明顯 */
}
</style>