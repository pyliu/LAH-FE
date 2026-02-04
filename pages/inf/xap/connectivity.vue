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
    lah-badge-site-status(
      v-for="data in sortedOffices",
      v-show="isOn(data)",
      :key="data.ID",
      :ref="data.ID",
      :watch-site="data.ID",
      :short="displayShortName",
      :period="reloadMs",
      :fill="false",
      :display-update-time="true",
      display-update-time-to-now,
      pill,
      block,
      class="modern-shadow h-100",
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
    officeStateMap: new Map(), // 用於儲存各站點回報的狀態
    sortedOffices: [],
    red: [],
    green: [],
    yellow: [],
    reloadMs: '60000', // 傳給元件的更新頻率 (字串或數字)

    // 定義快取鍵值
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
        // 過濾不需要的站點
        this.officesData = data.raw.filter(item => !['CB', 'CC'].includes(item.ID))
        // 初始化 sortedOffices
        this.sortedOffices = [...this.officesData]

        this.setCache(this.officeCacheKey, data, 24 * 60 * 60 * 1000)
      } else {
        this.$utils.error('無法取得各地政事務所對應資料。')
      }
    },

    // 接收子元件回報的狀態更新
    handleUpdated (data) {
      // 由於 lah-badge-site-status 內的 emit('updated', data) 回傳的是 API response
      // 我們需要知道是哪個 site。但因為我們在 v-for 中，無法直接得知是哪個子元件觸發 (除非改寫子元件)
      // 不過我們可以利用 Map 的特性，這裡我們假設 update 觸發時我們重新計算整體燈號
      // *修正*: 我們需要將狀態存入 Map 以供排序使用。
      // 由於 lah-badge-site-status 不一定會回傳 ID，我們在排序時主要依賴 status。
      // 為了簡單起見，我們這裡從 sortedOffices 中找到對應的物件更新其暫存狀態 (如果需要)
      // 但因為子元件自己維護狀態，父層主要負責「排序」。

      // 由於無法直接從 event data 獲取 ID (除非修改子元件)，
      // 我們這裡主要做的是「重新掃描所有子元件的狀態」來進行排序
      // 這需要訪問 $refs
      this.filterByLight()
    },

    processSorting () {
      this.red = []
      this.green = []
      this.yellow = []

      const statusMap = {}

      // 遍歷所有 ref 獲取當前狀態
      this.officesData.forEach((office) => {
        const ref = this.$refs[office.ID]
        // ref 可能是陣列 (因為 v-for)
        const component = Array.isArray(ref) ? ref[0] : ref

        if (component) {
          const status = component.status
          statusMap[office.ID] = status

          if (status > 0) { this.green.push(office.ID) } else if (status === 0 || status === -2) { this.yellow.push(office.ID) } else { this.red.push(office.ID) }
        } else {
          // 元件還沒掛載，預設黃燈
          statusMap[office.ID] = 0
          this.yellow.push(office.ID)
        }
      })

      // 複製並排序
      const tempSorted = [...this.officesData]

      this.sortedOffices = tempSorted.sort((a, b) => {
        const statusA = statusMap[a.ID]
        const statusB = statusMap[b.ID]

        // 權重計算: 紅( <0 ) -> 綠( >0 ) -> 黃( 0, -2 )
        const getWeight = (s) => {
          if (s === -1) { return 0 } // Red
          if (s > 0) { return 1 } // Green
          return 2 // Yellow (Loading/Waiting)
        }

        const wA = getWeight(statusA)
        const wB = getWeight(statusB)

        if (wA !== wB) { return wA - wB }

        // 其次：桃園市優先
        const aTaoyuan = a.ID.startsWith('H')
        const bTaoyuan = b.ID.startsWith('H')
        if (aTaoyuan && !bTaoyuan) { return -1 }
        if (!aTaoyuan && bTaoyuan) { return 1 }

        // 最後：ID 排序
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
  // 調整最小寬度以適應 badge
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); // 加大寬度至 240px
  gap: 1rem;
  height: calc(100vh - 85px);
  overflow-y: auto;
  align-content: start;
}

// 增加陰影讓 badge 在 grid 中更好看
.modern-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 5px; // 配合 badge 的圓角

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
    z-index: 1;
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
