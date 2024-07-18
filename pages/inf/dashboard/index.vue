<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto {{ site }} 智慧監控儀表板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
          lah-button(
            icon="angles-right",
            variant="outline-primary",
            to="/inf/dashboard/carousel",
            regular,
            no-border,
            no-icon-gutter,
            title="輪播版本",
            size="lg"
          )

        //- lah-button(
        //-   :icon="topWarning ? 'bell' : 'bell-slash'",
        //-   :pressed="topWarning",
        //-   :variant="topWarning ? 'info' : 'light'",
        //-   :class="topWarning ? ['text-white', 'font-weight-bold'] : []",
        //-   @click="topWarning = !topWarning",
        //-   regular,
        //-   size="lg"
        //- ) {{ topWarning ? '已啟用警示優先顯示' : '已停用警示優先顯示' }}

        .d-flex.align-items-center
          .mr-1 🔴 {{ red }}
          .mr-1 🟡 {{ yellow }}
          .mr-1 🟢 {{ green }}
          b-button-group(size="lg")
            lah-button.mr-1(
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
        li 提供顯示各監控標的狀態之功能
        li 預設監控顯示一天內資料
        li 目前監控設定：{{ connectionText }}

  client-only: transition-group.d-flex.flex-wrap(name="list-reverse")
    //- attention boards
    .col-md-4.mb-3(
      v-for="(obj, idx) in attentionList",
      :key="`${obj.compName}-${idx}`"
    ): component.card-body-fixed-height-3(
      :id="`${obj.compName}-attention`",
      :is="obj.compName",
      :enable-attention="false",
      :ref="`${obj.compName}-attention`"
    )
    //- common boards
    .col-md-4.mb-3(
      key="lahMonitorBoardXap-fix",
      :class="isInAttention('lahMonitorBoardXap') ? ['invisible'] : []"
    ): lah-monitor-board-xap.card-body-fixed-height-3(
      ref="LahMonitorBoardXap",
      @light-update="lightUpdate"
    )
    .col-md-4.mb-3(key="lahMonitorBoardSrmas-fix"): lah-monitor-board-srmas.card-body-fixed-height-3(
      ref="LahMonitorBoardSrmas",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(key="lahMonitorBoardSms-fix"): lah-monitor-board-sms.card-body-fixed-height-3(
      ref="LahMonitorBoardSms",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardDataguard-fix"
    ): lah-monitor-board-dataguard.card-body-fixed-height-3(
      ref="LahMonitorBoardDataguard",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardHacmp-fix"
    ): lah-monitor-board-hacmp.card-body-fixed-height-3(
      ref="LahMonitorBoardHacmp",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardDnp-fix"
    ): lah-monitor-board-dnp.card-body-fixed-height-3(
      ref="LahMonitorBoardDnp",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardL05-fix"
    ): lah-monitor-board-L05.card-body-fixed-height-3(
      ref="LahMonitorBoardL05",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardSiteHx-fix"
    ): lah-monitor-board-site-hx.card-body-fixed-height-3(
      ref="LahMonitorBoardSiteHx",
      @light-update="lightUpdate"
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardSiteTw-fix"
    ): lah-monitor-board-site-tw.card-body-fixed-height-3(
      ref="LahMonitorBoardSiteTw",
      @light-update="lightUpdate"
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardDbbackup-fix"
    ): lah-monitor-board-dbbackup.card-body-fixed-height-3(
      ref="LahMonitorBoardDbbackup",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardConnectivity-fix"
    ): lah-monitor-board-connectivity.card-body-fixed-height-3(
      ref="LahMonitorBoardConnectivity",
      @light-update="lightUpdate"
    )
    .col-md-4.mb-3(
      key="lahMonitorBoardLxhweb-fix"
    ): lah-monitor-board-lxhweb.card-body-fixed-height-3(
      ref="LahMonitorBoardLxhweb",
      @light-update="lightUpdate",
      target-ip="L3HWEB",
      link
    )
    //- HA only boards
    .col-md-4.mb-3(
      v-if="isHA",
      v-show="!isInAttention('lahMonitorBoardVmclone')",
      key="lahMonitorBoardVmclone-fix"
    ): lah-monitor-board-vmclone.card-body-fixed-height-3(
      ref="LahMonitorBoardVmclone",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      v-if="isHA",
      key="lahMonitorBoardTape-fix"
    ): lah-monitor-board-tape.card-body-fixed-height-3(
      ref="LahMonitorBoardTape",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      v-if="isHA",
      key="lahMonitorBoardApbackup-fix"
    ): lah-monitor-board-apbackup.card-body-fixed-height-3(
      ref="LahMonitorBoardApbackup",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      v-if="isHA",
      key="lahMonitorBoardTestdb-fix"
    ): lah-monitor-board-testdb.card-body-fixed-height-3(
      ref="LahMonitorBoardTestdb",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      v-if="isHA",
      key="lahMonitorBoardAdsync-fix"
    ): lah-monitor-board-adsync.card-body-fixed-height-3(
      ref="LahMonitorBoardAdsync",
      @light-update="lightUpdate",
      footer
    )
    .col-md-4.mb-3(
      v-if="isHA",
      key="lahMonitorBoardApconn-fix"
    ): lah-monitor-board-apconn.card-body-fixed-height-3(
      ref="LahMonitorBoardApconn",
      @light-update="lightUpdate"
    )
    //- non-HA boards
</template>

<script>
export default {
  middleware: ['isInf'], // authority control
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    attentionList: [],
    attentionTimer: null,
    topWarning: true
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
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
    isHA () {
      return this.site === 'HA'
    }
  },
  watch: {},
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
      return this.$refs[`${name}-attention`]
    }
  }
}
</script>

<style lang="scss">
.highlight-group {
  border-bottom: 2px dashed gray;
  margin-bottom: 15px;
}
/* .card-top-fixed-height {
  height: calc((100vh - 150px) / 3);
  overflow: auto;
} */
</style>
