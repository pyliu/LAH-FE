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
          b-checkbox.mr-1.mt-2(
            v-model="col2",
            switch,
            size="lg"
          ) 2欄顯示
          .mr-1 🔴 {{ red }}
          .mr-1 🟡 {{ yellow }}
          .mr-1 🟢 {{ green }}
          b-button-group(size="lg")
            lah-button.mx-1(
              @click="$refs.setupModal.show()",
              icon="cog",
              variant="outline-secondary",
              action="clock",
              no-border,
              no-icon-gutter,
              title="設定EMAIL伺服器"
            )
    lah-monitor-board-setup-modal(ref="setupModal")
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
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="database", variant="secondary")
        span.ml-2 資料來源
      p 本儀表板透過以下三種方式獲取監控數據：
      ol
        li #[strong 電子郵件分析]：讀取特定郵件伺服器的郵件，分析主旨與內容來判斷服務狀態（例如：SRMAS、資料庫備份等）。
        li #[strong 智慧監控API]：呼叫安裝於遠端伺服器上的客製化API，獲取服務的即時狀態（例如：建物圖籍同步、地籍異動即時通等）。
        li #[strong 系統後端API]：直接存取本系統後端的API，查詢內部服務狀態（例如：L3同步、跨縣市AP服務等）。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="columns", variant="secondary")
        span.ml-2 版面配置
      ul
        li 勾選頁首的 #[strong 2欄顯示] 開關，可以將儀表板在兩欄與三欄之間切換，以適應不同的螢幕尺寸與觀看習慣。
      hr
      h5.d-flex.align-items-center
        lah-fa-icon(icon="cog", variant="secondary")
        span.ml-2 設定
      ul
        li 點擊 #[lah-fa-icon(icon="cog")] 按鈕可以設定用於 #[strong 電子郵件分析] 的郵件伺服器連線資訊。

  //- 使用 transition-group 來實現排序動畫
  //- 關鍵：key 必須是穩定的 id，不能使用 index
  transition-group.d-flex.flex-wrap.align-content-start(
    tag="div",
    name="board-list"
  )
    div(
      v-for="board in sortedBoards"
      :key="board.id"
      :class="colCss"
    )
      component(
        :is="board.comp"
        :ref="toCamelCase(board.comp)"
        :id="toCamelCase(board.comp) + '-attention'"
        :class="[heightCss, board.extraClass]"
        v-bind="board.props"
        :footer="board.footer"
        @light-update="lightUpdate($event, board)"
      )

</template>

<script>
export default {
  // middleware: ['isInf'], // authority control
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
    ]
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
    // 動態排序列表：Danger(-2) > Warning(-1) > Normal(0)
    sortedBoards () {
      // 複製一份陣列以免修改到原始資料，避免此處的 sort 影響到原始 boards 順序
      const list = [...this.boards]
      return list.sort((a, b) => {
        return this.getWeight(a) - this.getWeight(b)
      })
    }
  },
  watch: {
    col2 (flag) {
      this.setCache('dashboard-col2', flag)
    }
  },
  created () {
    // 為每個 board 賦予唯一的 ID，這對於 transition-group 的排序動畫至關重要
    this.boards.forEach((board, index) => {
      // 建立一個基礎的唯一 ID，如果有 IP 則包含 IP 以利識別
      const suffix = board.props?.serverIp ? `-${board.props.serverIp}` : ''
      // 使用 non-reactive property 寫入 id，因為這個 id 永遠不會變
      board.id = `${board.comp}${suffix}-${index}`
      
      // 初始化 realName，方便 Vue 追蹤響應
      this.$set(board, 'realName', null)
    })

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
          // 注意：這裡將 key 轉為首字母小寫 (camelCase)
          tmp.push({
            compName: key.charAt(0).toLowerCase() + key.slice(1),
            state: value
          })
        }
      }
      // order by state
      this.attentionList = this.$utils.orderBy(tmp, 'state')
    }, 5000)

    // using animation to catch attention
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
    
    // 初始化時先執行一次
    this.refreshHighlightGroup()
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
  },
  methods: {
    lightUpdate (payload, board) {
      // 動態綁定：將組件發出的真實名稱記錄到 board 物件中
      if (board && payload && payload.name) {
        // 更新 board.realName，觸發 computed 重算
        if (board.realName !== payload.name) {
          this.$set(board, 'realName', payload.name)
        }
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
    // Helper to convert kebab-case to camelCase
    toCamelCase (str) {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    },
    // 統一將首字母轉小寫，確保與 attentionList 中的 compName 格式一致
    normalizeName (name) {
      if (!name) return ''
      return name.charAt(0).toLowerCase() + name.slice(1)
    },
    // 計算權重：紅燈 -2, 黃燈 -1, 正常 0 (保持原順序)
    getWeight (board) {
      // 1. 取得用於比對的名稱 (優先 realName，其次 compName)
      let searchName = board.realName || this.toCamelCase(board.comp)
      
      // 2. 備援預測 (如果需要)
      if (!board.realName && board.comp.includes('printer') && board.props?.serverIp) {
         // HX.vue 目前沒有 printer，但保留此邏輯以防未來擴充
      }

      // 3. 統一轉成首字母小寫
      const normalizedSearchName = this.normalizeName(searchName)

      // 4. 在 attentionList 中搜尋
      const item = this.attentionList.find(x => {
        if (x.compName === normalizedSearchName) return true
        if (board.props?.serverIp && x.compName.includes(board.props.serverIp)) return true
        return false
      })

      if (item) {
        if (item.state === 'danger') return -2
        if (item.state === 'warning') return -1
      }
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
</style>