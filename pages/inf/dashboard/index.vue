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

  lah-transition: b-card-group.highlight-group(
    v-if="showHighlight",
    id="highlight",
    ref="highlight",
    columns
  )
    transition-group(name="list", mode="out-in"): component.card-body-fixed-height-3(
      v-for="(obj, idx) in attentionList",
      :key="`${obj.compName}-${idx}`",
      :is="obj.compName"
    )

  div
    client-only: b-card-group.mb-4(deck)
      lah-monitor-board-xap.card-body-fixed-height-3(ref="LahMonitorBoardXap", @light-update="lightUpdate")
      lah-monitor-board-srmas.card-body-fixed-height-3(ref="LahMonitorBoardSrmas", @light-update="lightUpdate", footer)
      lah-monitor-board-sms.card-body-fixed-height-3(ref="LahMonitorBoardSms", @light-update="lightUpdate", footer)
      //- lah-monitor-board-xap-trend(office="桃園所" watch-top-xap)
      //- lah-monitor-board-apconn(line, all)
    div(v-if="isHA")
      b-card-group.mb-4(deck)
        lah-monitor-board-dataguard.card-body-fixed-height-3(ref="LahMonitorBoardDataguard", @light-update="lightUpdate", footer)
        lah-monitor-board-hacmp.card-body-fixed-height-3(ref="LahMonitorBoardHacmp", @light-update="lightUpdate", footer)
        lah-monitor-board-dnp.card-body-fixed-height-3(ref="LahMonitorBoardDnp", @light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-L05.card-body-fixed-height-3(ref="LahMonitorBoardL05", @light-update="lightUpdate", footer)
        lah-monitor-board-site-hx.card-body-fixed-height-3(ref="LahMonitorBoardSiteHx", @light-update="lightUpdate")
        lah-monitor-board-site-tw.card-body-fixed-height-3(ref="LahMonitorBoardSiteTw", @light-update="lightUpdate")
      b-card-group.mb-4(deck)
        lah-monitor-board-dbbackup.card-body-fixed-height-3(ref="LahMonitorBoardDbbackup", @light-update="lightUpdate", footer)
        lah-monitor-board-vmclone.card-body-fixed-height-3(ref="LahMonitorBoardVmclone", @light-update="lightUpdate", footer)
        lah-monitor-board-tape.card-body-fixed-height-3(ref="LahMonitorBoardTape", @light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-apbackup.card-body-fixed-height-3(ref="LahMonitorBoardApbackup", @light-update="lightUpdate", footer)
        lah-monitor-board-testdb.card-body-fixed-height-3(ref="LahMonitorBoardTestdb", @light-update="lightUpdate", footer)
        lah-monitor-board-adsync.card-body-fixed-height-3(ref="LahMonitorBoardAdsync", @light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-connectivity.card-body-fixed-height-3(ref="LahMonitorBoardConnectivity", @light-update="lightUpdate")
        lah-monitor-board-apconn.card-body-fixed-height-3(ref="LahMonitorBoardApconn", @light-update="lightUpdate")
        lah-monitor-board-lxhweb(ref="LahMonitorBoardLxhweb", @light-update="lightUpdate", target-ip="L3HWEB", link)
      //- b-card-group(deck)
      //-   lah-monitor-board-ups.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      //-   b-card
      //-   b-card
    div(v-else)
      b-card-group.mb-4(deck)
        lah-monitor-board-dataguard.card-body-fixed-height-3(ref="LahMonitorBoardDataguard", @light-update="lightUpdate", footer)
        lah-monitor-board-hacmp.card-body-fixed-height-3(ref="LahMonitorBoardHacmp", @light-update="lightUpdate", footer)
        lah-monitor-board-dnp.card-body-fixed-height-3(ref="LahMonitorBoardDnp", @light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-L05.card-body-fixed-height-3(ref="LahMonitorBoardL05", @light-update="lightUpdate", footer)
        lah-monitor-board-dbbackup.card-body-fixed-height-3(ref="LahMonitorBoardDbbackup", @light-update="lightUpdate", footer)
        lah-monitor-board-site-tw.card-body-fixed-height-3(ref="LahMonitorBoardSiteTw", @light-update="lightUpdate")
        //- lah-monitor-board-site-hx.card-body-fixed-height-3(@light-update="lightUpdate")
        //- lah-monitor-board-srmas.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-lxhweb.card-body-fixed-height-3(ref="LahMonitorBoardLxhweb", @light-update="lightUpdate", target-ip="L3HWEB", link)
        lah-monitor-board-apconn.card-body-fixed-height-3(ref="LahMonitorBoardApconn", @light-update="lightUpdate")
        lah-monitor-board-connectivity.card-body-fixed-height-3(ref="LahMonitorBoardConnectivity", @light-update="lightUpdate")
        //- b-card.card-body-fixed-height-3
  hr
</template>

<script>
export default {
  middleware: ['isInf'], // authority control
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    attentionList: [],
    testSwitch: false
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
    showHighlight () {
      // return (this.yellow + this.red) > 0
      return this.attentionList.length > 0
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
  watch: {
    attentionList (val) {
      console.warn(val)
    }
  },
  mounted () {
    this.refreshHighlightGroup = this.$utils.debounce(() => {
      // to add warning/danger card to highlight group
      this.attentionList = []
      for (const [key, value] of this.lightMap) {
        if (['warning', 'danger'].includes(value)) {
          this.attentionList.push({
            compName: key.charAt(0).toLowerCase() + key.slice(1),
            state: value
          })
        }
      }
    }, 3000)
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
    refreshHighlightGroup () { /* placeholder for debouncing */ }
  }
}
</script>

<style lang="scss">
.highlight-group {
  padding: 10px 10px 0 10px;
  border: 2px dashed red;
  margin-bottom: 15px;
  .card {
    max-height: calc((100vh - 80) / 3);
    overflow: auto;
  }
}
</style>
