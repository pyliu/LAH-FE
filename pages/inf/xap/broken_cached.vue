<template lang="pug">
div.h-100(v-cloak)
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto: lah-fa-icon(icon="heart-pulse", action="breath") 全國地所跨域主機監控
      lah-button(
        v-b-modal.help-modal,
        icon="info",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        title="說明"
      )
    .d-flex.align-items-center
      b-checkbox.mr-1(v-model="displayShortName", size="lg") 顯示別名
      b-checkbox(v-model="displayDanger", size="lg") 連線狀態錯誤
      lah-button(
        icon="link-slash",
        no-border,
        title="顯示離線紀錄",
        variant="outline-danger",
        size="lg",
        @click="showOfflineRecords"
      ) 顯示離線紀錄
      lah-button.mr-1(
        to="/inf/xap/xbroken_display",
        icon="tv",
        size="lg",
        title="民眾端顯示頁面"
      )
      lah-countdown-button(
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
            auto-start
            no-badge
            @end="load"
            @click="load"
            :milliseconds="reloadMs"
            :disabled="isBusy"
            :busy="isBusy"
          )

  lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示全國各所跨域主機服務狀態。
        li 每5分鐘左右重新更新一次
      hr
      div 🟢 表示一切正常
      div 🟡 表示狀態更新中
      div 🔴 表示狀態錯誤

  lah-transition: h3.center(v-if="displayDanger && red.length === 0")
    lah-fa-icon.mr-1(icon="circle-check", variant="success")
    span 目前各地所皆可正常連線

  //- 改用 div 自定義內容，取代 lah-badge-site-status 以獲得更好的佈局控制
  transition-group(name="list", tag="div").dashboard-grid.p-3
    div.modern-tile(
      v-for="(data, idx) in officesData",
      v-if="isOn(data)",
      :key="`${data.id}-${idx}`",
      @click="show(data)",
      :class="borderCss(data)"
    )
      //- 內容容器：垂直排列
      .d-flex.flex-column.align-items-center.w-100
        //- 第一行：圖示 + 名稱
        .d-flex.align-items-center.justify-content-center.mb-1
          lah-fa-icon.mr-1(
            v-if="data.state === 'UP'",
            icon="circle-check",
            variant="success"
          )
          lah-fa-icon.mr-1(
            v-else-if="data.state === 'DOWN'",
            icon="circle-xmark",
            variant="danger",
            action="breath"
          )
          lah-fa-icon.mr-1(
            v-else,
            icon="triangle-exclamation",
            variant="warning"
          )
          span.font-weight-bold.text-nowrap {{ formatName(data.name) }}

        //- 第二行：錯誤訊息 (僅在非 UP 狀態顯示，並強制換行)
        .error-msg(v-if="data.state !== 'UP'") {{ data.response }}

</template>

<script>
import lahOfficeDownTimeline from '~/components/lah-office-down-timeline.vue';
export default {
  components: { lahOfficeDownTimeline },
  data: () => ({
    displayDanger: false,
    displayShortName: true,
    officesData: [],
    red: [],
    green: [],
    yellow: [],
    reloadMs: 5 * 60 * 1000,
    timer: null
  }),
  head: {
    title: '全國地所跨域主機監控-桃園市地政局'
  },
  computed: {},
  watch: {
    officesData (val) {
      this.red.length = 0
      this.yellow.length = 0
      this.green.length = 0
      /**
       * id: "XX"
       * name: "XX地政事務所"
       * response: "HTTP/1.1 401 Unauthorized"
       * serial: 1xxxx
       * state: "UP"
       * timestamp: 1694416638
       */
      val.forEach((value, idx, arr) => {
        const site = value.id
        if (value.state === 'UP') {
          this.green.push(site)
        } else if (value.state === 'DOWN') {
          this.red.push(site)
        } else {
          this.yellow.push(site)
        }
      })
    }
  },
  created () { this.load() },
  mounted () {
    this.timer = setInterval(this.load.bind(this), this.reloadMs)
  },
  beforeDestroy () {
    clearInterval(this.timer)
  },
  methods: {
    isOn (data) {
      if (this.displayDanger) {
        return this.red.includes(data.id)
      }
      return true
    },
    formatName (name) {
      if (this.displayShortName) {
        return name.replace('地政事務所', '')
      }
      return name
    },
    show (office) {
      /**
       * id: "EA"
         name: "XX地政事務所"
         response: "HTTP/1.1 502 Proxy Error"
         serial: 14550
         state: "DOWN"
        timestamp: 1694392448
       */
      this.modal(`
        代碼: ${office.id}<br/>
        名稱: ${office.name}<br/>
        回應：${office.response}<br/>
        更新：${this.$utils.formatTime(new Date(office.timestamp * 1000))}
      `, {
        title: `${office.name} 資訊`,
        html: true
      })
    },
    load () {
      this.isBusy = true
      this.officesData = []
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_xap_stats_cached'
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          // 先過濾排除不顯示的所，再進行排序
          const rawData = data.raw.filter(item => !['CB', 'CC'].includes(item.id))

          this.officesData = rawData.sort((a, b) => {
            // 1. 有問題的 (非 UP) 排前面
            const aBad = a.state !== 'UP'
            const bBad = b.state !== 'UP'
            if (aBad && !bBad) { return -1 }
            if (!aBad && bBad) { return 1 }

            // 2. 桃園市 (H開頭) 排前面
            const aTaoyuan = a.id.startsWith('H')
            const bTaoyuan = b.id.startsWith('H')
            if (aTaoyuan && !bTaoyuan) { return -1 }
            if (!aTaoyuan && bTaoyuan) { return 1 }

            // 3. 其餘依 ID 代碼排序
            return a.id.localeCompare(b.id)
          })
        } else {
          this.$utils.error('無法取得各地政事務所狀態快取資料。', data)
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
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
    },
    borderCss (data) {
      const css = []
      if (data.state !== 'UP') {
        css.push('border-danger')
        css.push('shadow')
        css.push('bg-danger-light') // 自訂背景色以突顯
      } else if (data.id.startsWith('H')) {
        css.push('border-info')
      } else {
        css.push('border-light')
      }
      return css
    }
  }
}
</script>

<style lang="scss" scoped>
/* 讓 Dashboard Grid 填滿剩餘高度 */
.dashboard-grid {
  display: grid;
  /* 自動填滿寬度，每個項目最小 180px，最大佔滿剩餘空間 (1fr) */
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  /* 計算高度：總高度 - Header 高度 (約 70-80px) */
  height: calc(100vh - 85px);
  overflow-y: auto;
  align-content: start; /* 內容較少時靠上對齊 */
}

/* 現代化卡片樣式 */
.modern-tile {
  /* 強制填滿 Grid Cell */
  width: 100% !important;
  height: 100% !important;
  min-height: 80px; /* 確保有一定高度 */

  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; /* 垂直排列 */

  font-size: 1.15rem;

  background-color: white;
  border-width: 2px !important;
  border-style: solid;
  border-radius: 12px !important;

  /* 陰影效果 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;

  /* 文字處理，防止溢出 */
  padding: 0.5rem;
  text-align: center;
}

/* Hover 浮動效果 */
.modern-tile:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* 錯誤訊息樣式 */
.error-msg {
  font-size: 0.85rem;
  color: #dc3545; /* Bootstrap danger color */
  word-break: break-word; /* 強制長單字換行 */
  overflow-wrap: break-word; /* 支援現代瀏覽器換行 */
  line-height: 1.2;
  margin-top: 4px;
  width: 100%; /* 確保使用全寬以利換行 */
}

/* 錯誤狀態的額外樣式 */
.bg-danger-light {
  background-color: #fff5f5 !important;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
}

/* Vue 列表過渡動畫 */
.list-enter-active, .list-leave-active {
  transition: all 0.5s;
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
