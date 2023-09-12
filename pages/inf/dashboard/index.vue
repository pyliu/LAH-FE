<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto(v-if="filtering === false") {{ site }} 智慧監控儀錶板
          .d-flex.align-items-center(v-else)
            lah-fa-icon.mr-1.ml-2(icon="circle", :variant="filtering", v-if="filtering === 'success'") 綠燈狀態儀錶板
            lah-fa-icon.mr-1.ml-2(icon="circle", :variant="filtering", v-if="filtering === 'warning'") 黃燈狀態儀錶板
            lah-fa-icon.mr-1.ml-2(icon="circle", :variant="filtering", v-if="filtering === 'danger'") 紅燈狀態儀錶板
            span(v-if="filtering === 'warning&danger'") 🔴+🟡 異常狀態儀錶板
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
        .d-flex.align-items-center: b-button-group(size="lg")
          lah-button.mr-1(
            v-if="filtering !== false",
            icon="arrow-rotate-left",
            action="cycle-alt",
            no-border,
            title="顯示所有儀表板",
            @click="filtering = false"
          ) 預設
          lah-button.mr-1(
            v-if="filtering !== 'warning&danger'",
            no-border,
            title="顯示異常儀表板",
            @click="filtering = 'warning&danger'"
          ) 🔴+🟡 {{ red + yellow }}
          lah-button.mr-1(
            v-if="filtering !== 'danger'",
            no-border,
            no-icon-gutter,
            title="檢視紅燈儀表板",
            @click="filtering = 'danger'"
          ) 🔴 {{ red }}
          lah-button.mr-1(
            v-if="filtering !== 'warning'",
            no-border,
            no-icon-gutter,
            title="檢視黃燈儀表板",
            @click="filtering = 'warning'"
          ) 🟡 {{ yellow }}
          lah-button.mr-1(
            v-if="filtering !== 'success'",
            no-border,
            no-icon-gutter,
            title="檢視綠燈儀表板",
            @click="filtering = 'success'"
          ) 🟢 {{ green }}
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
  lah-transition: b-card-group(v-if="filtering !== false", columns)
    transition-group(name="list", mode="out-in"): component(
      v-for="(name, idx) in filterList",
      :key="`${name}-${idx}`",
      :is="name"
    )
  h2.no-dashboard.center(v-if="filterList.length === 0 && filtering !== false") ⚠ 無資料
  lah-transition: div(v-show="filtering === false")
    client-only: b-card-group.mb-4(deck)
      lah-monitor-board-xap.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-site-hx.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-site-tw.card-body-fixed-height-3(@light-update="lightUpdate")
      //- lah-monitor-board-xap-trend(office="桃園所" watch-top-xap)
      //- lah-monitor-board-apconn(line, all)
    div(v-if="isHA")
      b-card-group.mb-4(deck)
        lah-monitor-board-dataguard.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-hacmp.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-dnp.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-L05.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-srmas.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-lxhweb(@light-update="lightUpdate", target-ip="L3HWEB", link)
      b-card-group.mb-4(deck)
        lah-monitor-board-dbbackup.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-vmclone.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-tape.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-apbackup.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-testdb.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-adsync.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-connectivity.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-apconn.card-body-fixed-height-3(@light-update="lightUpdate")
        b-card.card-body-fixed-height-3
      //- b-card-group(deck)
      //-   lah-monitor-board-ups.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      //-   b-card
      //-   b-card
    div(v-else)
      b-card-group.mb-4(deck)
        lah-monitor-board-dataguard.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-hacmp.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-dnp.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      b-card-group.mb-4(deck)
        lah-monitor-board-srmas.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-dbbackup.card-body-fixed-height-3(@light-update="lightUpdate", footer)
        lah-monitor-board-lxhweb.card-body-fixed-height-3(@light-update="lightUpdate", target-ip="L3HWEB", link)
      b-card-group.mb-4(deck)
        lah-monitor-board-apconn.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-connectivity.card-body-fixed-height-3(@light-update="lightUpdate")
        b-card.card-body-fixed-height-3
  hr
</template>

<script>
export default {
  middleware: ['isInf'],
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0,
    filtering: false,
    filterList: []
  }),
  head: {
    title: '智慧監控儀錶板-桃園市地政局'
  },
  computed: {
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
    filtering (val) {
      // after filtering flag changed, the list needs to be refreshed.
      this.filterList.length = 0
      this.refreshFilterList()
    }
  },
  mounted () {
    this.refreshFilterList = this.$utils.debounce(() => {
      this.filterList.length = 0
      const tmp = [...this.lightMap]
      tmp.forEach((item) => {
        const key = item[0]
        const value = item[1]
        if (this.filtering === 'warning&danger' && ['warning', 'danger'].includes(value)) {
          this.filterList.push(key)
        } else if (value === this.filtering) {
          this.filterList.push(key)
        }
      })
    }, 200)
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
      // refresh filter list after light changed
      this.refreshFilterList()
    },
    refreshFilterList () { /* placeholder for debouncing */ }
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
</style>
