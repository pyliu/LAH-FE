<template lang="pug">
//- 使用 :class 綁定 dark-mode，配合 Scoped CSS 與 ::v-deep 達成布景切換
div.h-100(v-cloak, :class="{ 'dark-mode': isDarkMode }")
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto: lah-fa-icon(icon="wave-square", action="squeeze") 即時全國地所跨域主機監控
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
        .d-flex.align-items-center.justify-content-space-between
          b-checkbox.mr-1(v-model="displayShortName", size="lg") 顯示別名
          b-checkbox.mr-1(v-model="displayDanger", size="lg") 連線狀態錯誤

          //- 暗色主題切換按鈕
          lah-button(
            @click="toggleTheme",
            :icon="isDarkMode ? 'sun' : 'moon'",
            :variant="isDarkMode ? 'outline-warning' : 'outline-secondary'",
            size="lg",
            no-border,
            no-icon-gutter,
            :title="isDarkMode ? '切換為淺色模式' : '切換為深色模式'"
          )

  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        li 採用嚴格佇列機制 (Max: 2)，避免同時大量連線。
        li 正常連線之站點將隨機延遲 1-10 秒後再次進行檢查。
        li 右側欄位顯示最近 5 分鐘內的伺服器離線紀錄。
      hr
      div 🟢 連線正常
      div 🟡 等待/逾時
      div 🔴 連線失敗

  //- 讀取中提示 UI (全域)
  div.center.h-50(v-if="officesData.length === 0")
    lah-fa-icon(icon="spinner", action="spin", size="3x", variant="primary")
    .mt-2.font-weight-bold.text-primary 讀取站點資料中...

  //- 主要內容區塊：使用 Grid 分割左右
  b-row.h-100(v-else, no-gutters)
    //- 左側：監控儀表板 (佔 3/4)
    b-col.h-100.d-flex.flex-column(cols="12", lg="9")
      //- 狀態提示列
      lah-transition: h3.center.py-2.m-0(v-if="displayDanger && red.length === 0 && yellow.length === 0")
        lah-fa-icon.mr-1(icon="circle-check", variant="success")
        span 目前各地所皆可正常連線

      //- UI Grid: 站點狀態列表
      transition-group.dashboard-grid.p-3(
        name="list",
        tag="div"
      )
        div(
          v-for="data in sortedOffices",
          v-show="isOn(data)",
          :key="data.ID",
          style="position: relative"
        )
          //- 設定 period="0" (String) 停用元件內部自動更新，由父元件 Queue 控制
          lah-badge-site-status.h-100(
            :ref="data.ID",
            :watch-site="data.ID",
            :short="displayShortName",
            period="0",
            :fill="false",
            :display-update-time="true",
            :display-update-time-to-now="true",
            :tile="true",
            @updated="handleUpdated"
          )
          //- 當顯示別名時，右下角疊加顯示所代碼
          .site-id-overlay.small.font-weight-bold.text-secondary(v-if="displayShortName") {{ data.ID }}

    //- 右側：離線紀錄時間軸 (佔 1/4)
    //- 加入 bg-light 類別以便在暗色模式下覆寫背景
    b-col.p-0.bg-light(cols="12", lg="3")
      .timeline-container.p-2
        //- 將捲動邏輯交給組件本身處理
        lah-office-down-timeline(hide-footer).h-100.overflow-auto

</template>

<script>
import LahBadgeSiteStatus from '~/components/lah-badge-site-status.vue';
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue';

export default {
  components: { lahOfficeDownTimeline, LahBadgeSiteStatus },
  middleware: ['isInf'],
  data: () => ({
    displayDanger: false,
    displayShortName: true,
    officesData: [],
    /** * officeStateMap 儲存各站點狀態與時間戳記
     * key: site ID
     * value: { status: number, timestamp: number }
     */
    officeStateMap: {},
    sortedOffices: [],
    red: [],
    green: [],
    yellow: [],
    officeCacheKey: 'connectivity_offices_list',

    // 佇列機制相關
    updateQueue: [],
    processingIds: [],
    MAX_CONCURRENT: 2,

    // 暗色模式狀態
    isDarkMode: false
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  watch: {
    displayDanger (val) {
      this.setCache('/inf/xap/connectivity/displayDanger', val, 7 * 24 * 60 * 60 * 1000)
    },
    displayShortName (val) {
      this.setCache('/inf/xap/connectivity/displayShortName', val, 7 * 24 * 60 * 60 * 1000)
    },
    // 監聽暗色模式，透過 JS 修改 Body 背景色以消除白邊
    isDarkMode (flag) {
      this.setCache('connectivity-dark-mode', flag)
      this.updateBodyBg(flag)
    }
  },
  created () {
    this.getCache('/inf/xap/connectivity/displayDanger').then((flag) => {
      if (flag !== null && flag !== undefined) { this.displayDanger = flag }
    })
    this.getCache('/inf/xap/connectivity/displayShortName').then((flag) => {
      if (flag !== null && flag !== undefined) { this.displayShortName = flag }
    })

    // 防抖排序，避免畫面頻繁跳動
    this.filterByLight = this.$utils.debounce(this.processSorting, 500)

    this.prepareOfficesData()

    // 讀取暗色模式設定
    this.getCache('connectivity-dark-mode').then((flag) => {
      if (flag !== null && flag !== undefined) {
        this.isDarkMode = flag
        this.updateBodyBg(flag)
      }
    })
  },
  beforeDestroy () {
    // 離開頁面時清空 Queue
    this.updateQueue = []
    this.processingIds = []
    // 離開頁面時恢復 Body 背景色
    this.updateBodyBg(false)
  },
  methods: {
    toggleTheme () {
      this.isDarkMode = !this.isDarkMode
    },
    updateBodyBg (isDark) {
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = isDark ? '#121212' : ''
      }
    },
    isOn (data) {
      if (this.displayDanger) {
        return this.red.includes(data.ID) || this.yellow.includes(data.ID)
      }
      return true
    },

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
        this.officesData = data.raw.filter(item => !['CB', 'CC'].includes(item.ID))
        this.sortedOffices = [...this.officesData]
        this.setCache(this.officeCacheKey, data, 24 * 60 * 60 * 1000)

        this.$nextTick(() => {
          this.initQueue()
        })
      } else {
        this.$utils.error('無法取得各地政事務所對應資料。')
      }
    },

    // 初始化佇列：將所有站點 ID 加入
    initQueue () {
      this.officesData.forEach((office) => {
        this.updateQueue.push(office.ID)
      })
      this.processQueue()
    },

    // 佇列調度核心
    processQueue () {
      while (this.processingIds.length < this.MAX_CONCURRENT && this.updateQueue.length > 0) {
        const siteId = this.updateQueue.shift()
        this.triggerSiteCheck(siteId)
      }
    },

    // 呼叫組件執行檢查
    triggerSiteCheck (siteId) {
      if (this.processingIds.includes(siteId)) { return }

      const ref = this.$refs[siteId]
      const component = Array.isArray(ref) ? ref[0] : ref

      if (component && (typeof component.check === 'function' || typeof component.reload === 'function')) {
        this.processingIds.push(siteId)
        if (typeof component.check === 'function') {
          component.check()
        } else {
          component.reload()
        }
      } else {
        console.warn(`組件 ${siteId} 尚未準備就緒。`)
      }
    },

    handleUpdated (data) {
      const siteId = data.site || data.ID
      if (siteId) {
        // 更新 UI 狀態
        this.$set(this.officeStateMap, siteId, {
          status: data.status,
          timestamp: Date.now()
        })
        this.filterByLight()

        // 佇列邏輯：Loading/重試中 (status=0) 時不釋放名額
        if (data.status === 0) { return }

        const idx = this.processingIds.indexOf(siteId)
        if (idx > -1) {
          this.processingIds.splice(idx, 1)
        } else {
          return
        }

        // 決定下次檢查延遲：正常則隨機 1-10s，異常則固定 5s
        const delay = data.status > 0 ? this.$utils.rand(1000, 10000) : 5000

        setTimeout(() => {
          if (this.officesData.length > 0) {
            if (!this.updateQueue.includes(siteId) && !this.processingIds.includes(siteId)) {
              this.updateQueue.push(siteId)
              this.processQueue()
            }
          }
        }, delay)

        this.processQueue()
      }
    },

    processSorting () {
      this.red = []
      this.green = []
      this.yellow = []

      this.officesData.forEach((office) => {
        const state = this.officeStateMap[office.ID]
        const status = state ? state.status : -2
        if (status > 0) { this.green.push(office.ID) } else if (status === 0 || status === -2) { this.yellow.push(office.ID) } else { this.red.push(office.ID) }
      })

      const tempSorted = [...this.officesData]
      this.sortedOffices = tempSorted.sort((a, b) => {
        // 1. 桃園市優先
        const aTaoyuan = a.ID.startsWith('H')
        const bTaoyuan = b.ID.startsWith('H')
        if (aTaoyuan && !bTaoyuan) { return -1 }
        if (!aTaoyuan && bTaoyuan) { return 1 }

        // 2. 狀態權重排序
        const stateA = this.officeStateMap[a.ID] || { status: -2, timestamp: 0 }
        const stateB = this.officeStateMap[b.ID] || { status: -2, timestamp: 0 }
        const getWeight = (s) => {
          if (s === -1) { return 0 }
          if (s === 0 || s === -2) { return 1 }
          return 2
        }
        const wA = getWeight(stateA.status)
        const wB = getWeight(stateB.status)
        if (wA !== wB) { return wA - wB }

        // 3. 更新時間排序
        if (stateB.timestamp !== stateA.timestamp) { return stateB.timestamp - stateA.timestamp }

        // 4. 代碼排序
        return a.ID.localeCompare(b.ID)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  height: 100%;
  overflow-y: auto;
  align-content: start;
}

.site-id-overlay {
  position: absolute;
  bottom: 0.25rem;
  right: 0.4rem;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

.timeline-container {
  height: 91vh;
  position: sticky;
  top: 0;
}

.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.list-move {
  transition: transform 0.8s ease-in-out;
}

// 暗色模式覆寫 (Scoped)
.dark-mode {
  background-color: #121212;
  color: #e0e0e0;

  // 強制覆寫背景色
  ::v-deep .bg-light,
  ::v-deep .bg-white,
  ::v-deep .btn-light {
    background-color: #1e1e1e !important;
    color: #e0e0e0 !important;
    border-color: #333 !important;
  }

  ::v-deep {
    // 1. [修正] Dashboard Grid 內的按鈕 (地所方塊)
    // 必須明確覆蓋 .btn 樣式，避免被 bootstrap 的 btn-outline-light 影響
    .dashboard-grid .btn {
      background-color: #1e1e1e !important;
      border-color: #444 !important;
      color: #f8f9fa !important;

      &:hover {
        background-color: #333 !important;
      }

      // 確保方塊內的文字也變白
      div, span, small, strong {
        color: #f8f9fa !important;
      }
      .text-muted { color: #aaa !important; }
      .text-secondary { color: #ccc !important; }
    }

    // 2. 修正右側時間軸 (Timeline)
    .timeline-container {
      // 修正卡片與列表背景
      .card, .list-group-item {
        background-color: #1e1e1e !important;
        border-color: #333 !important;
        color: #e0e0e0 !important;
      }

      // 修正 "網站回應" 的邊框與文字 (原本是 border-dark，在暗色下看不到)
      .border-dark {
        border-color: #666 !important; // 淺灰邊框
        background-color: #252526 !important; // 深灰背景
        color: #f8f9fa !important; // 白色文字
      }

      // 修正描述文字
      .item-description {
        color: #f8f9fa !important;
      }

      // 修正連結顏色
      a { color: #66b0ff !important; }

      // 修正 .text-muted (預覽文字)
      .text-muted { color: #aaa !important; }
    }

    // 其他通用元件 (Modal, Overlay)
    .site-id-overlay { color: #ccc !important; }

    .btn-outline-secondary {
      color: #aaa;
      border-color: #555;
      &:hover { background-color: #444; color: #fff; }
    }

    .modal-content {
      background-color: #1e1e1e;
      border-color: #444;
      color: #e0e0e0;
      .modal-header, .modal-footer { border-color: #333; }
      .close { color: #fff; }
    }
  }
}
</style>
