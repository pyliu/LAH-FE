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
import shuffle from 'lodash/shuffle'
export default {
  middleware: ['isInf'], // authority control
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    filterList: [],
    testSwitch: false
  }),
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  },
  computed: {
    showHighlight () {
      return (this.yellow + this.red) > 0
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
    },
    filterListShuffled () {
      return shuffle(this.filterList)
    }
  },
  watch: {},
  mounted () {
    this.refreshHighlightGroup = this.$utils.debounce(() => {
      const targetEl = this.$refs.highlight || this.$('#highlight')
      targetEl.innerHTML = ''
      // to add warning/danger card to highlight group
      for (const [key, value] of this.lightMap) {
        if (['warning', 'danger'].includes(value)) {
          // console.warn(this.$refs[key].$el.outerHTML)
          // const vnode = this.$createElement(this.$refs[key].$el);
          // console.warn(vnode)
          const htmlString = this.$refs[key].$el.outerHTML
          const parser = new DOMParser()
          const doc = parser.parseFromString(htmlString, 'text/html')
          const div = doc.querySelector('div')
          const canvas = doc.querySelector('canvas')
          if (canvas) {
            console.warn(canvas)
            canvas.outerHTML = `
              <div class="text-center my-3">
                <h2>狀態圖形請看下面</h2>
              </div>
            `
          }
          // this.$refs.container.appendChild(paragraph);
          // Accessing the raw DOM element
          targetEl.appendChild(div)
        }
      }
    }, 2000)
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
// .card-body-fixed-height-3 {
//   .card-body {
//     height: calc((100vh - 450px) / 3);
//     overflow: auto;
//   }
// }
.no-dashboard {
  height: calc(100vh - 110px);
}
.highlight-group {
  padding: 10px;
  border: 2px dashed red;
  margin-bottom: 15px;
  .card {
    max-height: calc((100vh - 80) / 3);
    overflow: auto;
  }
}
</style>
