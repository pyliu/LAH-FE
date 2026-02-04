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
          lah-button(
            icon="link-slash",
            no-border,
            title="顯示離線紀錄",
            variant="outline-danger",
            size="lg",
            @click="showOfflineRecords"
          ) 顯示離線紀錄

  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        li 採用分散式元件檢查機制 (智慧佇列)。
      hr
      div 🟢 連線正常
      div 🟡 等待/逾時
      div 🔴 連線失敗

  lah-transition: h3.center(v-if="displayDanger && red.length === 0 && yellow.length === 0")
    lah-fa-icon.mr-1(icon="circle-check", variant="success")
    span 目前各地所皆可正常連線

  //- 讀取中提示 UI
  div.center.h-50(v-if="officesData.length === 0")
    lah-fa-icon(icon="spinner", action="spin", size="3x", variant="primary")
    .mt-2.font-weight-bold.text-primary 讀取站點資料中...

  //- UI Grid: 修正多重屬性括號問題，合併所有屬性到單一 () 中
  transition-group.dashboard-grid.p-3(
    v-else,
    name="list",
    tag="div"
  )
    div(
      v-for="data in sortedOffices",
      v-show="isOn(data)",
      :key="data.ID",
      style="position: relative"
    )
      lah-badge-site-status.h-100(
        :ref="data.ID",
        :watch-site="data.ID",
        :short="displayShortName",
        :period="reloadMs",
        :fill="false",
        :display-update-time="true",
        :display-update-time-to-now="true",
        :tile="true",
        @updated="handleUpdated"
      )

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
    reloadMs: '60000',
    officeCacheKey: 'connectivity_offices_list'
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
      } else {
        this.$utils.error('無法取得各地政事務所對應資料。')
      }
    },

    handleUpdated (data) {
      const siteId = data.site || data.ID
      if (siteId) {
        // 更新狀態與當前時間戳記
        this.$set(this.officeStateMap, siteId, {
          status: data.status,
          timestamp: Date.now()
        })
        // 觸發排序
        this.filterByLight()
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
    },

    showOfflineRecords () {
      this.modal(this.$createElement(lahOfficeDownTimeline, {
        props: {
          maxHeight: false,
          hideFooter: true
        }
      }), {
        title: '離線伺服器歷史資訊'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  height: calc(100vh - 85px);
  overflow-y: auto;
  align-content: start;
}

.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// 排序變動時的平滑移動動畫
.list-move {
  transition: transform 0.8s ease-in-out;
}
</style>
