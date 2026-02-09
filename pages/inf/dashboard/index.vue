<template lang="pug">
//- Mod: 保持使用 component 層級的 class 控制，避免影響全域版面
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
          //- Mod: 全面升級燈號提示，加入清單顯示功能
          //- 紅燈
          .mr-1(
            :title="red > 0 ? `異常項目清單:\n` + redDetailList : '目前無異常項目'",
            style="cursor: help"
          ) 🔴 {{ red }}
          
          //- 黃燈
          .mr-1(
            :title="yellow > 0 ? `警告項目清單:\n` + yellowDetailList : '目前無警告項目'",
            style="cursor: help"
          ) 🟡 {{ yellow }}
          
          //- 綠燈
          .mr-1(
            :title="green > 0 ? `正常項目清單:\n` + greenDetailList : '目前無正常項目'",
            style="cursor: help"
          ) 🟢 {{ green }}
          
          //- 白燈/灰燈
          .mr-1(
            v-if="gray > 0",
            :title="`載入中或未知狀態清單:\n` + grayDetailList",
            style="cursor: help"
          ) ⚪ {{ gray }}

          //- Mod: 新增暗色主題切換按鈕
          lah-button.mr-1(
            @click="toggleTheme",
            :icon="isDarkMode ? 'sun' : 'moon'",
            :variant="isDarkMode ? 'outline-warning' : 'outline-secondary'",
            size="lg",
            no-border,
            no-icon-gutter,
            :title="isDarkMode ? '切換為淺色模式' : '切換為深色模式'"
          )
          
          //- 檢視切換按鈕
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

  //- Mod: 加入 appear 屬性，並在 JS 中延遲排序以觸發動畫
  transition-group.d-flex.flex-wrap.align-content-start(
    tag="div",
    name="board-list",
    appear
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
    gray: 0,
    // [Mod] 新增響應式標記，用於強制更新 Computed 清單
    lastLightUpdate: 0,
    attentionList: [],
    attentionTimer: null,
    topWarning: true,
    col2: false,
    // [Mod] 新增暗色模式狀態
    isDarkMode: false,
    // [Mod] 為每個面板加入 header 屬性，定義中文顯示名稱
    // 這是完整的列表 (HA 模式)
    boards: [
      { comp: 'lah-monitor-board-xap', header: 'XAP 服務', footer: false, pinned: true },
      { comp: 'lah-monitor-board-xap-trend', header: 'XAP 案件趨勢', footer: false, props: { watchTopXap: true, reloadTime: 15 } },
      { comp: 'lah-monitor-board-powerha', header: 'PowerHA 狀態', footer: true, pinned: true },
      { comp: 'lah-monitor-board-dataguard', header: 'DataGuard 同步', footer: true, pinned: true },
      { comp: 'lah-monitor-board-srmas', header: 'SRMAS 系統', footer: true, extraClass: 'fix-img' },
      { comp: 'lah-monitor-board-hacmp', header: 'HACMP 狀態', footer: true },
      { comp: 'lah-monitor-board-sms-notify', header: '地籍異動即時通', footer: true },
      { comp: 'lah-monitor-board-sms', header: '綜合簡訊監控', footer: true },
      { comp: 'lah-monitor-board-L05', header: 'L05 系統', footer: true },
      { comp: 'lah-monitor-board-apbackup', header: 'AP 主機備份', footer: true },
      { comp: 'lah-monitor-board-xcase-sync', header: '跨縣市案件同步', footer: false },
      { comp: 'lah-monitor-board-site-hx', header: '市內8所狀態', footer: false },
      { comp: 'lah-monitor-board-lxhweb', header: 'L3HWEB 主機', footer: false, props: { targetIp: 'L3HWEB', link: true, displayUpdateTime: true } },
      { comp: 'lah-monitor-board-site-tw', header: '跨域伺服器狀態', footer: false },
      { comp: 'lah-monitor-board-dbbackup', header: '資料庫備份', footer: true },
      { comp: 'lah-monitor-board-connectivity', header: '外部連線狀態', footer: false },
      { comp: 'lah-monitor-board-vmclone', header: 'VM Clone 狀態', footer: true },
      { comp: 'lah-monitor-board-tape', header: '磁帶備份', footer: true },
      { comp: 'lah-monitor-board-testdb', header: '測試資料庫', footer: false },
      { comp: 'lah-monitor-board-adsync', header: 'AD 帳號同步', footer: true },
      { comp: 'lah-monitor-board-apconn', header: 'AP 連線數', footer: false },
      { comp: 'lah-monitor-board-ups', header: 'UPS 不斷電系統', footer: true }
    ],
    pinnedIds: [],
    currentSortedBoards: [],
    debouncedSort: null
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
    // [Mod] 判斷是否為 HX 模式 (透過網址參數 ?mode=HX)
    isHX () {
      return this.$route.query.mode === 'HX'
    },
    // [Mod] 動態標題
    pageTitle () {
      if (this.isHX) {
        const name = this.$store.getters['user/siteName'] || '本所'
        return `${name}監控儀表板`
      }
      return '桃園所監控儀表板'
    },
    // [Mod] 根據模式使用不同的釘選快取 Key
    pinnedCacheKey () {
      return this.isHX ? 'dashboard-pinned-hx' : 'dashboard-pinned-ha'
    },
    colCss () {
      return this.col2 ? ['col-md-6'] : ['col-md-4']
    },
    heightCss () {
      return this.col2 ? ['card-body-fixed-height-2'] : ['card-body-fixed-height-3']
    },
    dangerList () {
      return this.attentionList.filter(item => item.state === 'danger')
    },
    warningList () {
      return this.attentionList.filter(item => item.state === 'warning')
    },
    highlightCount () {
      return this.attentionList.length
    },
    lightMap () {
      return this.$store.getters['inf/monitorLightMap']
    },
    connectionText () {
      if (this.systemConfigs?.monitor?.ssl) {
        return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}:993/imap/ssl/novalidate-cert}INBOX`
      }
      return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}/novalidate-cert}INBOX`
    },
    monitorPrintersConfig () {
      return this.systemConfigs?.monitor_printers
    },
    redDetailList () { return this.getDetailList('danger') },
    yellowDetailList () { return this.getDetailList('warning') },
    greenDetailList () { return this.getDetailList('success') },
    grayDetailList () { return this.getDetailList('gray') }
  },
  watch: {
    col2 (flag) {
      this.setCache('dashboard-col2', flag)
    },
    // [Mod] 監聽暗色模式並更新 Body Class
    isDarkMode (flag) {
      this.setCache('dashboard-dark-mode', flag)
      this.updateBodyBg(flag)
    },
    monitorPrintersConfig: {
      handler () {
        this.mergePrinterBoards()
      },
      immediate: true
    },
    // [Mod] 監聽路由變化，若切換模式則重整頁面 (通常不需要，但以防萬一)
    '$route.query.mode' (val) {
      location.reload()
    }
  },
  created () {
    this.debouncedSort = this.$utils.debounce(this.sortBoards, 3000)

    // [Mod] 如果是 HX 模式，過濾掉 HA 專屬的面板
    if (this.isHX) {
      const haOnlyBoards = [
        'lah-monitor-board-adsync',
        'lah-monitor-board-vmclone',
        'lah-monitor-board-testdb',
        'lah-monitor-board-ups'
      ]
      this.boards = this.boards.filter(board => !haOnlyBoards.includes(board.comp))
    }

    this.boards.forEach((board, index) => {
      if (!board.id) {
        const suffix = board.props?.serverIp ? `-${board.props.serverIp}` : ''
        board.id = `${board.comp}${suffix}-${index}`
        this.$set(board, 'realName', null)
        this.$set(board, 'lastUpdate', 0)
        this.$set(board, 'pinned', board.pinned === true)
      }
    })

    // [Mod] 使用動態的 cache key 讀取釘選設定
    this.getCache(this.pinnedCacheKey).then((ids) => {
      if (Array.isArray(ids)) {
        this.pinnedIds = ids
        this.boards.forEach((b) => {
          this.$set(b, 'pinned', this.pinnedIds.includes(b.id))
        })
      } else {
        this.pinnedIds = this.boards.filter(b => b.pinned).map(b => b.id)
      }
      
      // Mod: 移除這裡的立即排序，改到 mounted 延遲執行，讓使用者能看到「排序動畫」
      // this.sortBoards()
    })

    this.currentSortedBoards = [...this.boards]

    this.getCache('dashboard-col2').then((flag) => {
      this.col2 = flag
    })
    
    // [Mod] 讀取暗色模式設定
    this.getCache('dashboard-dark-mode').then((flag) => {
      if (flag !== null && flag !== undefined) {
        this.isDarkMode = flag
        this.updateBodyBg(flag)
      }
    })
  },
  mounted () {
    // Mod: 頁面載入完成後延遲一秒進行初次排序
    // 這樣使用者會先看到預設排序，然後看到卡片移動到新位置的動畫
    setTimeout(() => {
      this.sortBoards()
    }, 1000)

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
        this.timeout(
          () => this.attention(`#${card.compName}-attention`, { speed: '1s' }),
          this.$utils.rand(15) * 1000
        )
      })
      this.warningList.forEach((card) => {
        this.timeout(
          () => this.attention(`#${card.compName}-attention`, { name: 'headShake' }),
          this.$utils.rand(15) * 1000
        )
      })
    }, 30 * 1000)

    this.refreshHighlightGroup()
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
    // [Mod] 離開頁面時恢復 Body 樣式
    this.updateBodyBg(false)
  },
  methods: {
    // [Mod] 切換主題
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
    },
    // [Mod] 控制 Body 背景色
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121212' : ''
      }
    },
    // [Mod] 優先使用設定檔中的 Header，並加入響應式觸發
    getDetailList (type) {
      // 讀取響應式變數以建立依賴關係，確保 Computed 會重新計算
      this.lastLightUpdate

      const list = this.boards.filter(board => {
        // 取得組件對應的查詢名稱 (用於查狀態)
        const name = board.realName || this.toCamelCase(board.comp)
        const status = this.lightMap.get(name)
        
        // 灰燈邏輯：非成功、警告、危險
        if (type === 'gray') {
          return !['success', 'warning', 'danger'].includes(status)
        }
        // 其他顏色邏輯：直接比對狀態
        return status === type
      })

      if (list.length === 0) return ''

      return list.map(board => {
        // 1. 優先使用設定檔中的中文 Header
        if (board.header) return ` - ${board.header}`

        // 2. 其次使用組件回報的真實名稱
        if (board.realName) return ` - ${board.realName}`
        
        // 3. 最後使用組件名稱 fallback
        let simpleName = board.comp.replace('lah-monitor-board-', '')
        if (board.props && (board.props.targetIp || board.props.serverIp)) {
          simpleName += ` (${board.props.targetIp || board.props.serverIp})`
        }
        return ` - ${simpleName.charAt(0).toUpperCase() + simpleName.slice(1)}`
      }).join('\n')
    },
    sortBoards () {
      const list = [...this.boards]
      this.currentSortedBoards = list.sort((a, b) => {
        const weightDiff = this.getWeight(a) - this.getWeight(b)
        if (weightDiff !== 0) {
          return weightDiff
        }
        const timeA = a.lastUpdate || 0
        const timeB = b.lastUpdate || 0
        return timeB - timeA
      })
    },
    togglePin (board) {
      this.$set(board, 'pinned', !board.pinned)
      if (board.pinned) {
        if (!this.pinnedIds.includes(board.id)) {
          this.pinnedIds.push(board.id)
        }
      } else {
        this.pinnedIds = this.pinnedIds.filter(id => id !== board.id)
      }
      // [Mod] 使用動態 key 儲存設定
      this.setCache(this.pinnedCacheKey, this.pinnedIds)
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
            // [Mod] 為印表機自動產生 Header (修正為 "列印伺服器")
            header: `列印伺服器 ${p.ip}`,
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
          const isPinned = this.pinnedIds.includes(board.id)
          this.$set(board, 'pinned', isPinned)
          return board
        })
        this.boards = [...baseBoards, ...newPrinterBoards]
        this.sortBoards()
      } catch (e) {
        console.error('Failed to parse printer configs', e)
      }
    },
    lightUpdate (payload, board) {
      if (board) {
        if (payload && payload.name) {
          if (board.realName !== payload.name) {
            this.$set(board, 'realName', payload.name)
          }
        }
        this.$set(board, 'lastUpdate', new Date().getTime())
      }

      this.lightMap.set(payload.name, payload.new)

      let r = 0; let y = 0; let g = 0
      for (const value of this.lightMap.values()) {
        if (value === 'danger') r++
        else if (value === 'warning') y++
        else if (value === 'success') g++
      }

      this.red = r
      this.yellow = y
      this.green = g
      
      const totalCards = this.currentSortedBoards.length
      const calculatedGray = totalCards - r - y - g
      this.gray = calculatedGray > 0 ? calculatedGray : 0

      // [Mod] 更新標記，觸發 computed 重新計算 Tooltip 清單
      this.lastLightUpdate = new Date().getTime()

      this.refreshHighlightGroup()
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
    getWeight (board) {
      const searchName = board.realName || this.toCamelCase(board.comp)
      if (!board.realName && board.comp.includes('printer') && board.props?.serverIp) {
        // printer fallback logic
      }
      const status = this.lightMap.get(searchName)
      if (status === 'danger') return -3
      if (status === 'warning') return -2
      if (board.pinned) { return -1 }
      return 0
    }
  }
}
</script>

<style lang="scss">
.dark-container {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
  font-size: 16px;
  // [Mod] Dark Mode styles moved to main.scss
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

/* Mod: 修復排序動畫樣式 */
/* 讓移動更滑順，並加入 cubic-bezier 讓動態更有質感 */
.board-list-move {
  transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.5, 1);
  /* 避免移動時被其他元素遮擋 */
  z-index: 1;
}

/* 確保元素在進入/離開時也有過渡，這有助於 Flexbox 佈局的重新計算 */
.board-list-enter-active,
.board-list-leave-active {
  transition: all 0.8s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* 簡單的淡入淡出位移效果 */
.board-list-enter,
.board-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 絕對定位的離開狀態通常用於過濾列表，但在排序中加上這個可以防止佈局塌陷 */
/* 注意：在 Grid 系統中使用 absolute 可能會導致寬度跑版，若無刪減需求可不加 */
/* .board-list-leave-active { position: absolute; } */

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