<template lang="pug">
div.h-100(v-cloak)
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

  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        //- 更新說明文字：Max 修正為 2
        li 採用嚴格佇列機制 (Max: 2)，避免同時大量連線。
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
          //- 設定 period="0" 停用元件內部自動更新，改由父元件控制
          lah-badge-site-status.h-100(
            :ref="data.ID",
            :watch-site="data.ID",
            :short="displayShortName",
            :period="0",
            :fill="false",
            :display-update-time="true",
            :display-update-time-to-now="true",
            :tile="true",
            @updated="handleUpdated"
          )
          //- 需求: 顯示別名時，右下角疊加顯示所代碼
          .site-id-overlay.small.font-weight-bold.text-secondary(v-if="displayShortName") {{ data.ID }}

    //- 右側：離線紀錄時間軸 (佔 1/4)
    //- 需求 2: 固定在畫面中，高度固定 88vh，不受 scrollbar 影響 (容器不捲動)
    b-col.p-0(cols="12", lg="3")
      .timeline-container.p-2
        //- 將捲動邏輯交給組件本身：h-100 填滿容器，overflow-auto 啟用內部捲軸
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
    // 原本的 reloadMs 設為 0 或不使用，改由 Queue 控制
    officeCacheKey: 'connectivity_offices_list',

    // Queue 機制相關變數
    updateQueue: [],
    // 改用陣列明確記錄正在處理中的 ID，確保重試中的連線也佔用名額
    processingIds: [],
    // 需求修改: 最大並發數改為 2
    MAX_CONCURRENT: 2
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
    }
  },
  created () {
    this.getCache('/inf/xap/connectivity/displayDanger').then((flag) => {
      if (flag !== null && flag !== undefined) { this.displayDanger = flag }
    })
    this.getCache('/inf/xap/connectivity/displayShortName').then((flag) => {
      if (flag !== null && flag !== undefined) { this.displayShortName = flag }
    })

    // 防抖排序，避免畫面因個別元件更新而過度跳動
    this.filterByLight = this.$utils.debounce(this.processSorting, 500)

    this.prepareOfficesData()
  },
  beforeDestroy () {
    // 離開頁面時清空 Queue，避免記憶體洩漏或背景執行
    this.updateQueue = []
    this.processingIds = []
  },
  methods: {
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
        // 初始化列表順序
        this.sortedOffices = [...this.officesData]
        this.setCache(this.officeCacheKey, data, 24 * 60 * 60 * 1000)

        // 資料載入完成後，初始化 Queue 並開始執行
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

    // 佇列處理核心
    processQueue () {
      // 當還有額度 (processingIds.length < MAX_CONCURRENT) 且 Queue 還有東西時
      while (this.processingIds.length < this.MAX_CONCURRENT && this.updateQueue.length > 0) {
        const siteId = this.updateQueue.shift()
        this.triggerSiteCheck(siteId)
      }
    },

    // 觸發單一站點檢查
    triggerSiteCheck (siteId) {
      // 嚴格檢查：如果該站點已經在處理中 (佔用名額)，則跳過，避免重複觸發
      if (this.processingIds.includes(siteId)) {
        return
      }

      // 取得對應的元件 Ref
      const ref = this.$refs[siteId]
      const component = Array.isArray(ref) ? ref[0] : ref

      if (component && (typeof component.check === 'function' || typeof component.reload === 'function')) {
        // 佔用一個並發名額
        this.processingIds.push(siteId)

        if (typeof component.check === 'function') {
          component.check()
        } else {
          component.reload()
        }
      } else {
        // 元件尚未準備好，暫時忽略，不佔用名額
        console.warn(`Component for ${siteId} not ready.`)
      }
    },

    handleUpdated (data) {
      const siteId = data.site || data.ID
      if (siteId) {
        // 1. 更新狀態邏輯 (UI 顯示)
        this.$set(this.officeStateMap, siteId, {
          status: data.status,
          timestamp: Date.now()
        })
        this.filterByLight()

        // 2. Queue 邏輯處理
        // 關鍵修正：如果狀態是 0 (表示 Loading 或 重試中)，不應該釋放名額！
        // 只有在明確的 成功(>0) 或 失敗(<0且非0) 時才視為結束
        if (data.status === 0) {
          return
        }

        // 釋放名額：從 processingIds 中移除
        const idx = this.processingIds.indexOf(siteId)
        if (idx > -1) {
          this.processingIds.splice(idx, 1)
        } else {
          // 如果收到更新但該 ID 不在處理清單中 (可能是舊的 callback)，
          // 則不觸發後續排程，避免 Queue 邏輯混亂
          return
        }

        // 決定下次檢查的延遲時間
        let delay = 1000 // 預設 1秒

        // 如果狀態正常 (status > 0)，隨機延遲 1~10 秒
        if (data.status > 0) {
          delay = this.$utils.rand(1000, 10000)
        } else {
          // 異常狀態，固定 5 秒後重試
          delay = 5000
        }

        // 設定計時器將此站點放回 Queue
        setTimeout(() => {
          if (this.officesData.length > 0) {
            // 防呆：確保不會重複加入 Queue 或 Processing
            if (!this.updateQueue.includes(siteId) && !this.processingIds.includes(siteId)) {
              this.updateQueue.push(siteId)
              this.processQueue()
            }
          }
        }, delay)

        // 目前已經釋放了一個名額，立刻補上下一個
        this.processQueue()
      }
    },

    processSorting () {
      this.red = []
      this.green = []
      this.yellow = []

      // 更新計數統計
      this.officesData.forEach((office) => {
        const state = this.officeStateMap[office.ID]
        const status = state ? state.status : -2

        if (status > 0) { this.green.push(office.ID) } else if (status === 0 || status === -2) { this.yellow.push(office.ID) } else { this.red.push(office.ID) }
      })

      const tempSorted = [...this.officesData]

      this.sortedOffices = tempSorted.sort((a, b) => {
        // 1. [最優先] 桃園市優先 (ID 以 H 開頭)
        const aTaoyuan = a.ID.startsWith('H')
        const bTaoyuan = b.ID.startsWith('H')
        if (aTaoyuan && !bTaoyuan) { return -1 }
        if (!aTaoyuan && bTaoyuan) { return 1 }

        // 2. [次要] 權重排序 (目標順序：紅燈 0 > 黃燈 1 > 綠燈 2)
        const stateA = this.officeStateMap[a.ID] || { status: -2, timestamp: 0 }
        const stateB = this.officeStateMap[b.ID] || { status: -2, timestamp: 0 }

        const getWeight = (s) => {
          if (s === -1) { return 0 } // 紅燈 (Error)
          if (s === 0 || s === -2) { return 1 } // 黃燈 (Timeout/Loading)
          return 2 // 綠燈 (Success)
        }

        const wA = getWeight(stateA.status)
        const wB = getWeight(stateB.status)

        if (wA !== wB) { return wA - wB }

        // 3. 同燈號下：更新時間越新排在越前面 (Timestamp 越大越新)
        if (stateB.timestamp !== stateA.timestamp) {
          return stateB.timestamp - stateA.timestamp
        }

        // 4. 最後依 ID 代碼字母排序
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

// 需求: 所代碼浮水印
.site-id-overlay {
  position: absolute;
  bottom: 0.25rem;
  right: 0.4rem;
  opacity: 0.6;
  pointer-events: none;
  z-index: 1;
}

// 需求 2: 固定高度 (88vh) 且容器本身不顯示卷軸
.timeline-container {
  height: 91vh;
  // 移除 overflow-y: auto，確保容器本身不出卷軸
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
</style>
