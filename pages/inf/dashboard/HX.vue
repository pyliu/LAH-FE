<template lang="pug">
div.monitor-dashboard(v-cloak)
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

  //- transition-group.d-flex.flex-wrap.justify-content-evenly(name="list-reverse")
  lah-flex-item-group
    //- common boards
    //- 使用 CSS order 屬性進行排序：紅燈(-2) > 黃燈(-1) > 綠燈(0)
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardXap') }",
      key="lahMonitorBoardXap-fix"
    ): lah-monitor-board-xap(
      :class="heightCss",
      ref="LahMonitorBoardXap",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardXapTrend') }",
      key="lahMonitorBoardXapTrend-fix"
    ): lah-monitor-board-xap-trend(
      watch-top-xap,
      :reload-time="15",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('lahMonitorBoardPowerha') }",
      key="lahMonitorBoardPowerha-fix"
    ): lah-monitor-board-powerha(
      :class="heightCss",
      ref="lahMonitorBoardPowerha",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardDataguard') }",
      key="lahMonitorBoardDataguard-fix"
    ): lah-monitor-board-dataguard(
      :class="heightCss",
      ref="LahMonitorBoardDataguard",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardSrmas') }",
      key="lahMonitorBoardSrmas-fix"
    ): lah-monitor-board-srmas.card-body-fixed-height-3.fix-img(
      ref="LahMonitorBoardSrmas",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardHacmp') }",
      key="lahMonitorBoardHacmp-fix"
    ): lah-monitor-board-hacmp(
      :class="heightCss",
      ref="LahMonitorBoardHacmp",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardSmsNotify') }",
      key="lahMonitorBoardSmsNotify-fix"
    ): lah-monitor-board-sms-notify(
      :class="heightCss",
      ref="LahMonitorBoardSmsNotify",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardSms') }",
      key="lahMonitorBoardSms-fix"
    ): lah-monitor-board-sms(
      :class="heightCss",
      ref="LahMonitorBoardSms",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardL05') }",
      key="lahMonitorBoardL05-fix"
    ): lah-monitor-board-L05(
      :class="heightCss",
      ref="LahMonitorBoardL05",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardApbackup') }",
      key="lahMonitorBoardApbackup-fix"
    ): lah-monitor-board-apbackup(
      :class="heightCss",
      ref="LahMonitorBoardApbackup",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardXcaseSync') }",
      key="lahMonitorBoardXcaseSync-fix"
    ): lah-monitor-board-xcase-sync(
      :class="heightCss",
      ref="LahMonitorBoardXcaseSync",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardSiteHx') }",
      key="lahMonitorBoardSiteHx-fix"
    ): lah-monitor-board-site-hx(
      :class="heightCss",
      ref="LahMonitorBoardSiteHx",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardLxhweb') }",
      key="lahMonitorBoardLxhweb-fix"
    ): lah-monitor-board-lxhweb(
      :class="heightCss",
      ref="LahMonitorBoardLxhweb",
      @light-update="lightUpdate",
      target-ip="L3HWEB",
      link,
      display-update-time
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardSiteTw') }",
      key="lahMonitorBoardSiteTw-fix"
    ): lah-monitor-board-site-tw(
      :class="heightCss",
      ref="LahMonitorBoardSiteTw",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardDbbackup') }",
      key="lahMonitorBoardDbbackup-fix"
    ): lah-monitor-board-dbbackup(
      :class="heightCss",
      ref="LahMonitorBoardDbbackup",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      :style="{ order: getOrder('LahMonitorBoardConnectivity') }",
      key="lahMonitorBoardConnectivity-fix"
    ): lah-monitor-board-connectivity(
      :class="heightCss",
      ref="LahMonitorBoardConnectivity",
      @light-update="lightUpdate"
    )
</template>

<script>
export default {
  // middleware: ['isInf'], // authority control
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    attentionList: [],
    attentionTimer: null,
    topWarning: true,
    col2: false
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
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
    }
  },
  watch: {
    col2 (flag) {
      this.setCache('dashboard-col2', flag)
    }
  },
  created () {
    this.getCache('dashboard-col2').then((flag)=> {
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
  },
  beforeDestroy () {
    clearInterval(this.attentionTimer)
  },
  methods: {
    lightUpdate (payload) {
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
    /**
     * Determines the visual order of the component based on its status.
     * Flexbox order: smaller number comes first.
     * Danger (Red): -2
     * Warning (Yellow): -1
     * Normal (Green/Success): 0
     */
    getOrder (name) {
      if (!name) return 0
      // normalized camelCase name to match what is stored in attentionList
      const camel = name.charAt(0).toLowerCase() + name.slice(1)
      const item = this.attentionList.find(x => x.compName === camel)
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
</style>