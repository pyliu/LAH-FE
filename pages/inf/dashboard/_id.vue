<template lang="pug">
  //- 使用 client-only (或 no-ssr) 徹底解決 FontAwesome 與 Canvas 造成的 SSR Hydration 問題
  client-only
    div.dashboard-container
      //- 確保頭部不被壓縮
      lah-header.flex-shrink-0
        lah-transition(appear slide)
          //- 將原本的靜態標題改為 b-dropdown 下拉選單
          div.text-center.w-100.my-2
            b-dropdown(
              variant="link"
              toggle-class="text-dark text-decoration-none shadow-none p-0"
              menu-class="shadow custom-dropdown-menu"
              no-caret
            )
              //- 自訂按鈕內容：圖示改為動態綁定 board.icon，若無則預設顯示 briefcase
              template(#button-content)
                span.h3.mb-0.d-inline-block.font-weight-bold
                  lah-fa-icon(:icon="board ? (board.icon || 'briefcase') : 'briefcase'" variant="secondary").mr-2
                  | {{ board ? board.header : '請選擇儀表板' }}
                  lah-fa-icon(icon="caret-down" variant="secondary").ml-2

              //- 儀表板清單 (設定最大高度與滾動條，避免項目過多撐破畫面)
              div(style="max-height: 65vh; overflow-y: auto;")
                b-dropdown-item(
                  v-for="item in availableBoards"
                  :key="item.id"
                  @click="switchBoard(item.id)"
                  :active="routeId === item.id || routeId === item.comp"
                )
                  //- 展開清單也顯示各自的動態圖示，並在選中時變成綠色與顯示打勾
                  div.d-flex.align-items-center.justify-content-between.w-100
                    div.d-flex.align-items-center
                      lah-fa-icon(
                        :icon="item.icon || 'briefcase'"
                        :variant="routeId === item.id || routeId === item.comp ? 'success' : 'secondary'"
                      ).mr-2
                      span(:class="routeId === item.id || routeId === item.comp ? 'text-success font-weight-bold' : ''") {{ item.header }}
                    lah-fa-icon(
                      v-if="routeId === item.id || routeId === item.comp"
                      icon="check"
                      variant="success"
                    ).ml-3

      //- 成功配對到組件時渲染：在外層包覆我們可完全控管的 div.board-wrapper
      div.board-wrapper(v-if="board")
        component(
          ref="board"
          :is="board.comp"
          :id="board.id + '-attention'"
          :class="[board.extraClass, board.pinned ? 'pinned-highlight' : '']"
          v-bind="board.props || {}"
          :footer="board.footer"
          @light-update="lightUpdate($event, board)"
        )

      //- 網址輸入錯誤提示
      b-alert(
        v-else
        show
        variant="warning"
        class="text-center mt-4 mx-3 flex-shrink-0"
      )
        lah-fa-icon(icon="exclamation-triangle")
        |  找不到指定的儀表板組件：{{ routeId }}

      //- 載入中動畫 (做為 client-only 的 placeholder)
      template(slot="placeholder")
        div.dashboard-container.d-flex.justify-content-center.align-items-center
          b-spinner(variant="secondary" label="儀表板載入中...")
</template>

<script>
import { find } from 'lodash';

export default {
  name: 'DynamicDashboardViewer',
  components: {},
  head () {
    return {
      title: this.board ? `${this.board.header}-桃園市地政局` : '儀表板-桃園市地政局'
    }
  },
  computed: {
    routeId () {
      return this.$route.params.id || ''
    },
    board () {
      if (!this.routeId) { return null }
      return find(this.$consts.DEFAULT_DASHBOARDS, item => item.id === this.routeId || item.comp === this.routeId) || null
    },
    // 將常數提供給 template 進行迴圈渲染
    availableBoards () {
      if (this.isDevOffice) {
        return this.$consts.DEFAULT_DASHBOARDS
      }
      return this.$consts.DEFAULT_DASHBOARDS.filter(board => !board.devOnly)
    }
  },
  mounted () {
    this.$nextTick(() => {
      // 連續觸發 Resize Event
      setTimeout(() => { window.dispatchEvent(new Event('resize')) }, 300)
      setTimeout(() => { window.dispatchEvent(new Event('resize')) }, 1000)
    })
  },
  methods: {
    trim (val) {
      return val.replace(/[^a-zA-Z0-9-]/g, '')
    },
    lightUpdate (evt, boardConfig) {
      this.$emit('light-update', evt, boardConfig)
    },
    // 透過 Nuxt 路由進行動態切換
    switchBoard (id) {
      if (this.routeId !== id && this.routeId !== `lah-monitor-board-${id}`) {
        // 使用 this.$route.name 確保無論在哪層路由都能正確跳轉 params
        this.$router.push({ name: this.$route.name, params: { id } })
      }
    }
  }
}
</script>

<style scoped>
/* 1. 扣除 Nuxt 頂部導覽列(約70px)，防止 100vh 導致的整頁滾動 */
.dashboard-container {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0.5rem;
}

/* 2. 最外層自訂的 Wrapper，保證 CSS 一定會掛載成功 */
.board-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 0 1rem 1rem 1rem;
}

/* 3. 強制壓制組件內部的 Card，不讓它撐破外層 */
.board-wrapper ::v-deep .card {
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  margin-bottom: 0 !important;
}

/* 4. 將滾動條限制在 Card Body 內部 */
.board-wrapper ::v-deep .card-body {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* 5. 強制壓制 Chart 容器，並讓 Resize Event 接管 Canvas 重新繪製 */
.board-wrapper ::v-deep .chart-container {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100% !important;
  width: 100% !important;
  position: relative;
}

/* 6. 表格字體放大 (針對 Bootstrap 預設的 table 與內部 div 進行絕對覆蓋) */
.board-wrapper ::v-deep table.table th,
.board-wrapper ::v-deep table.table td,
.board-wrapper ::v-deep table.table td div {
  font-size: 1.5rem !important;
  line-height: 1.5 !important;
}

/* 7. 表頭放大 (涵蓋內部可能使用的各級標題標籤，破解 Bootstrap 預設大小) */
.board-wrapper ::v-deep .card-header,
.board-wrapper ::v-deep .card-header h1,
.board-wrapper ::v-deep .card-header h2,
.board-wrapper ::v-deep .card-header h3,
.board-wrapper ::v-deep .card-header h4,
.board-wrapper ::v-deep .card-header h5,
.board-wrapper ::v-deep .card-header h6,
.board-wrapper ::v-deep .card-header .h6 {
  font-size: 1.6rem !important;
  font-weight: bold;
  margin-bottom: 0 !important; /* 確保標題不會產生多餘的下邊距導致 Header 變形 */
}

/* 8. 徽章放大 */
.board-wrapper ::v-deep .badge {
  font-size: 1.25rem !important;
  padding: 0.5em 0.75em;
}

/* 9. 破解表格內建的 max-height (針對 PowerHA 截圖中的 s-80 等限制) */
.board-wrapper ::v-deep .b-table-sticky-header,
.board-wrapper ::v-deep .table-responsive {
  max-height: none !important;
  height: 100% !important;
  flex: 1;
}

/* 10. Footer 底部狀態列放大 (更新時間、按鈕、Icon) */
.board-wrapper ::v-deep .card-footer,
.board-wrapper ::v-deep .card-footer .small,
.board-wrapper ::v-deep .card-footer .btn-sm,
.board-wrapper ::v-deep .card-footer span {
  font-size: 1.3rem !important; /* 強制放大底部文字 */
}

.board-wrapper ::v-deep .card-footer svg {
  width: 1.2em !important;
  height: 1.2em !important;
  margin-right: 0.25rem; /* 稍微增加 icon 和文字的間距 */
}

/* 11. 放大 Card Body 內部的非表格文字 (如 DataGuard 的狀態說明) */
.board-wrapper ::v-deep .card-body {
  font-size: 1.5rem !important;
}

.board-wrapper ::v-deep .card-body .small,
.board-wrapper ::v-deep .card-body small,
.board-wrapper ::v-deep .card-body .text-muted,
.board-wrapper ::v-deep .card-body h6,
.board-wrapper ::v-deep .card-body .h6,
.board-wrapper ::v-deep .card-body .lah-wrapper {
  font-size: 1.35rem !important; /* 將原本被縮小的文字或 h6 標題拉大，確保清晰度 */
  line-height: 1.5 !important;
}

/* 確保 DataGuard 等元件中的內部小圖示(SVG)也跟著文字等比放大 */
.board-wrapper ::v-deep .card-body svg {
  width: 1.2em;
  height: 1.2em;
}

/* 12. 放大表單元件 (如 Select 下拉選單、Input)，並解除寫死的高度限制 */
.board-wrapper ::v-deep .custom-select,
.board-wrapper ::v-deep .form-control {
  font-size: 1.3rem !important; /* 強制放大下拉選單的字體 */
  height: auto !important; /* 關鍵：解除 .custom-select-sm 寫死的絕對高度，讓它隨字體撐開 */
  padding-top: 0.375rem !important; /* 確保上下留白適中，不會看起來太擠 */
  padding-bottom: 0.375rem !important;
}

/* 13. 設定自訂下拉選單的文字大小與間距 */
::v-deep .custom-dropdown-menu .dropdown-item {
  font-size: 1.3rem;
  padding: 0.5rem 1.5rem;
}

/* 修正 active 狀態的底色，避免預設深藍底色導致綠色圖示與文字對比度不足看不清 */
::v-deep .custom-dropdown-menu .dropdown-item.active,
::v-deep .custom-dropdown-menu .dropdown-item:active {
  background-color: #e8f5e9 !important; /* 改為柔和的淺綠底色 */
  color: #212529 !important; /* 確保未覆蓋到的基礎文字保持深灰色 */
}

::v-deep .custom-dropdown-menu .dropdown-item.active:hover {
  background-color: #c8e6c9 !important; /* Hover 時稍微加深背景色 */
}

/* 14. 放大特定組件內自訂類別的文字 (如跨所案件同步的 .local-max, .area-name) */
.board-wrapper ::v-deep .local-max {
  font-size: 1.35rem !important; /* 覆蓋寫死的 0.85rem，保持次要文字的層級 */
  line-height: 1.5 !important;
}

.board-wrapper ::v-deep .area-name {
  font-size: 1.6rem !important; /* 放大地名標題，使其與內文有區別 */
  font-weight: bold;
}

/* 15. 放大各所狀態方塊內的站台名稱與更新時間 (.office-name, .updated-time, .time-passed) */
.board-wrapper ::v-deep .office-name {
  font-size: 1.8rem !important; /* 站台名稱作為主視覺，給予較大的字體 */
  font-weight: bold;
}

/* 將 .time-passed 與 .updated-time 合併處理 */
.board-wrapper ::v-deep .updated-time,
.board-wrapper ::v-deep .time-passed {
  font-size: 1.35rem !important; /* 更新時間對齊其他次要文字的大小 */
  margin-top: 0.2rem; /* 稍微拉開與站台名稱的垂直間距 */
}

.pinned-highlight {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
