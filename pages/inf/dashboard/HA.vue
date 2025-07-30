<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto 桃園所監控儀表板
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
    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示各監控標的狀態之功能，以下三種方式讀取資料
          ul
            li 讀取電子郵件分析，如「SRMAS分析」、「資料庫 XXXX」、「XXX 備份」 ... 等類
            li 伺服器需安裝『智慧監控API』服務，如「建物圖籍同步異動」、「地籍異動即時通」
            li 使用本系統後端API，如「L3同步異動」、「跨縣市AP服務狀態」 ... 等類
        li 電子郵件監控方式預設是擷取一天內資料來分析，其他則是依照各別設定時間更新
        li 目前電子郵件監控設定：{{ connectionText }}

  //- transition-group.d-flex.flex-wrap.justify-content-evenly(name="list-reverse")
  lah-flex-item-group
    //- attention boards
    div(
      :class="colCss",
      v-for="(obj, idx) in attentionList",
      :key="`${obj.compName}-${idx}`"
    ): component.lah-shadow(
      :class="heightCss",
      :id="`${obj.compName}-attention`",
      :ref="`${obj.compName}-attention`",
      :is="obj.compName",
      :enable-attention="false",
      :footer="isFooterEnable(obj.compName)"
    )
    //- common boards
    div(
      :class="colCss",
      key="lahMonitorBoardXap-fix",
      v-show="!isInAttention('LahMonitorBoardXap')"
    ): lah-monitor-board-xap(
      :class="heightCss",
      ref="LahMonitorBoardXap",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardXapTrend-fix",
      v-show="!isInAttention('LahMonitorBoardXapTrend')"
    ): lah-monitor-board-xap-trend(
      watch-top-xap,
      :reload-time="15",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardPowerha-fix",
      v-show="!isInAttention('lahMonitorBoardPowerha')"
    ): lah-monitor-board-powerha(
      :class="heightCss",
      ref="lahMonitorBoardPowerha",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardDataguard-fix",
      v-show="!isInAttention('LahMonitorBoardDataguard')"
    ): lah-monitor-board-dataguard(
      :class="heightCss",
      ref="LahMonitorBoardDataguard",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardSrmas-fix",
      v-show="!isInAttention('LahMonitorBoardSrmas')"
    ): lah-monitor-board-srmas(
      :class="heightCss",
      ref="LahMonitorBoardSrmas",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardHacmp-fix",
      v-show="!isInAttention('LahMonitorBoardHacmp')"
    ): lah-monitor-board-hacmp(
      :class="heightCss",
      ref="LahMonitorBoardHacmp",
      @light-update="lightUpdate",
      footer
    )
    //- div(
    //-   :class="colCss",
    //-   key="lahMonitorBoardDnp-fix",
    //-   v-show="!isInAttention('LahMonitorBoardDnp')"
    //- ): lah-monitor-board-dnp(
    //-   :class="heightCss",
    //-   ref="LahMonitorBoardDnp",
    //-   @light-update="lightUpdate",
    //-   footer
    //- )
    div(
      :class="colCss",
      key="lahMonitorBoardSmsNotify-fix",
      v-show="!isInAttention('LahMonitorBoardSmsNotify')"
    ): lah-monitor-board-sms-notify(
      :class="heightCss",
      ref="LahMonitorBoardSmsNotify",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardSms-fix",
      v-show="!isInAttention('LahMonitorBoardSms')"
    ): lah-monitor-board-sms(
      :class="heightCss",
      ref="LahMonitorBoardSms",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardL05-fix",
      v-show="!isInAttention('LahMonitorBoardL05')"
    ): lah-monitor-board-L05(
      :class="heightCss",
      ref="LahMonitorBoardL05",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardApbackup-fix",
      v-show="!isInAttention('LahMonitorBoardApbackup')"
    ): lah-monitor-board-apbackup(
      :class="heightCss",
      ref="LahMonitorBoardApbackup",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardSiteHx-fix",
      v-show="!isInAttention('LahMonitorBoardSiteHx')"
    ): lah-monitor-board-site-hx(
      :class="heightCss",
      ref="LahMonitorBoardSiteHx",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardLxhweb-fix",
      v-show="!isInAttention('LahMonitorBoardLxhweb')"
    ): lah-monitor-board-lxhweb(
      :class="heightCss",
      ref="LahMonitorBoardLxhweb",
      @light-update="lightUpdate",
      target-ip="L3HWEB",
      link
    )
    div(
      :class="colCss",
      key="lahMonitorBoardSiteTw-fix",
      v-show="!isInAttention('LahMonitorBoardSiteTw')"
    ): lah-monitor-board-site-tw(
      :class="heightCss",
      ref="LahMonitorBoardSiteTw",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardDbbackup-fix",
      v-show="!isInAttention('LahMonitorBoardDbbackup')"
    ): lah-monitor-board-dbbackup(
      :class="heightCss",
      ref="LahMonitorBoardDbbackup",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardConnectivity-fix",
      v-show="!isInAttention('LahMonitorBoardConnectivity')"
    ): lah-monitor-board-connectivity(
      :class="heightCss",
      ref="LahMonitorBoardConnectivity",
      @light-update="lightUpdate"
    )
    //- HA only boards
    div(
      :class="colCss",
      key="lahMonitorBoardVmclone-fix"
      v-show="!isInAttention('lahMonitorBoardVmclone')",
    ): lah-monitor-board-vmclone(
      :class="heightCss",
      ref="LahMonitorBoardVmclone",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardTape-fix",
      v-show="!isInAttention('LahMonitorBoardTape')"
    ): lah-monitor-board-tape(
      :class="heightCss",
      ref="LahMonitorBoardTape",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardTestdb-fix",
      v-show="!isInAttention('LahMonitorBoardTestdb')"
    ): lah-monitor-board-testdb(
      :class="heightCss",
      ref="LahMonitorBoardTestdb",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardAdsync-fix",
      v-show="!isInAttention('LahMonitorBoardAdsync')"
    ): lah-monitor-board-adsync(
      :class="heightCss",
      ref="LahMonitorBoardAdsync",
      @light-update="lightUpdate",
      footer
    )
    div(
      :class="colCss",
      key="lahMonitorBoardApconn-fix",
      v-show="!isInAttention('LahMonitorBoardApconn')"
    ): lah-monitor-board-apconn(
      :class="heightCss",
      ref="LahMonitorBoardApconn",
      @light-update="lightUpdate"
    )
    div(
      :class="colCss",
      key="lahMonitorBoardUps-fix",
      v-show="!isInAttention('LahMonitorBoardUps')"
    ): lah-monitor-board-ups(
      :class="heightCss",
      ref="LahMonitorBoardUps",
      @light-update="lightUpdate",
      footer
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
     *   compName: "lahMonitorBoardSrmas"
     *   state: "danger"
     * }
     */
    attentionList: [],
    attentionTimer: null,
    topWarning: true,
    col2: false
  }),
  head: {
    title: '桃園所智慧監控儀表板-桃園市地政局'
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
      // console.warn(payload)
      // console.warn(this.lightMap.size)
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
    }
  }
}
</script>

<style lang="scss">
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
