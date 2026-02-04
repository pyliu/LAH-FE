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
      div 🟡 等待/檢查中
      div 🔴 連線失敗/逾時

  lah-transition: h3.center(v-if="displayDanger && red.length === 0 && yellow.length === 0")
    lah-fa-icon.mr-1(icon="circle-check", variant="success")
    span 目前各地所皆可正常連線

  //- 讀取中提示 UI
  div.center.h-50(v-if="officesData.length === 0")
    lah-fa-icon(icon="spinner", action="spin", size="3x", variant="primary")
    .mt-2.font-weight-bold.text-primary 讀取站點資料中...

  //- UI Grid: 使用 lah-badge-site-status 元件
  transition-group(name="list", tag="div").dashboard-grid.p-3(v-else)
    div(
      v-for="data in sortedOffices",
      v-show="isOn(data)",
      :key="data.ID",
      style="position: relative"
    )
      //- 釘選按鈕 (使用絕對定位在 Grid Cell 內)
      .pin-btn(
        @click="togglePin(data.ID)"
        :class="{ active: pinnedIds.includes(data.ID) }"
        title="釘選/取消釘選此面板"
      )
        lah-fa-icon(icon="thumbtack", :variant="pinnedIds.includes(data.ID) ? 'danger' : 'secondary'")

      lah-badge-site-status.h-100(
        :ref="data.ID",
        :watch-site="data.ID",
        :short="displayShortName",
        :period="reloadMs",
        :fill="false",
        :display-update-time="true",
        display-update-time-to-now,
        pill,
        tile,
        :pinned="pinnedIds.includes(data.ID)",
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
    officeStateMap: new Map(),
    sortedOffices: [],
    red: [],
    green: [],
    yellow: [],
    reloadMs: '60000',
    officeCacheKey: 'connectivity_offices_list',
    pinnedIds: [] // 新增釘選列表
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
    // 讀取釘選
    this.getCache('dashboard-pinned-connectivity').then((ids) => {
      this.pinnedIds = ids || []
    })

    // 防抖排序
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
    togglePin (id) {
      if (this.pinnedIds.includes(id)) {
        this.pinnedIds = this.pinnedIds.filter(item => item !== id)
      } else {
        this.pinnedIds.push(id)
      }
      this.setCache('dashboard-pinned-connectivity', this.pinnedIds)
      this.filterByLight() // 立即觸發排序
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
      } else {
        this.$utils.error('無法取得各地政事務所對應資料。')
      }
    },

    handleUpdated (data) {
      const siteId = data.site || data.ID
      if (siteId) {
        this.$set(this.officeStateMap, siteId, data.status)
        this.filterByLight()
      }
    },

    processSorting () {
      this.red = []
      this.green = []
      this.yellow = []

      this.officesData.forEach((office) => {
        const status = this.officeStateMap[office.ID] !== undefined ? this.officeStateMap[office.ID] : -2
        if (status > 0) { this.green.push(office.ID) } else if (status === 0 || status === -2) { this.yellow.push(office.ID) } else { this.red.push(office.ID) }
      })

      const tempSorted = [...this.officesData]

      this.sortedOffices = tempSorted.sort((a, b) => {
        const statusA = this.officeStateMap[a.ID] !== undefined ? this.officeStateMap[a.ID] : -2
        const statusB = this.officeStateMap[b.ID] !== undefined ? this.officeStateMap[b.ID] : -2

        // 權重計算: 紅( <0, !=-2 ) -> 綠( >0 ) -> 黃( 0, -2 )
        const getWeight = (s, id) => {
          if (s === -1) { return 0 } // Red
          if (s > 0) { return 1 } // Green
          if (this.pinnedIds.includes(id)) { return 1.5 } // Pinned but loading (Optional logic)
          return 2 // Yellow
        }

        // 釘選的項目在同燈號下優先
        const isPinnedA = this.pinnedIds.includes(a.ID)
        const isPinnedB = this.pinnedIds.includes(b.ID)

        const wA = getWeight(statusA, a.ID)
        const wB = getWeight(statusB, b.ID)

        if (wA !== wB) { return wA - wB }

        // 如果燈號相同，釘選的排前面
        if (isPinnedA && !isPinnedB) { return -1 }
        if (!isPinnedA && isPinnedB) { return 1 }

        const aTaoyuan = a.ID.startsWith('H')
        const bTaoyuan = b.ID.startsWith('H')
        if (aTaoyuan && !bTaoyuan) { return -1 }
        if (!aTaoyuan && bTaoyuan) { return 1 }

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
  // 加大至 240px 以確保完整顯示
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  height: calc(100vh - 85px);
  overflow-y: auto;
  align-content: start;
}

// 釘選按鈕樣式
.pin-btn {
  position: absolute;
  top: 5px;
  right: 15px; // 微調位置
  z-index: 1000;
  cursor: pointer;
  opacity: 0.2; // 預設微透
  transition: opacity 0.3s;
  font-size: 1.1rem;

  &:hover, &.active {
    opacity: 1;
  }
}

.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
