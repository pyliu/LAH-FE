<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto 🔴 紅燈儀錶板 ({{ red }})
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
        .d-flex.align-items-center
          b-link.mr-1(to="/inf/dashboard/yellow", title="檢視黃燈儀表板") 🟡 僅顯示黃燈 {{ yellow }}
          b-link.mr-1(to="/inf/dashboard/green", title="檢視綠燈儀表板") 🟢 僅顯示綠燈 {{ green }}
        .d-flex.align-items-center
          b-link.mr-1(to="/inf/dashboard", title="回儀表板首頁"): lah-fa-icon(icon="arrow-left-long") 回儀表板首頁

    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示紅燈狀態之儀錶板功能
        li 預設監控顯示一天內資料
  lah-transition: b-card-group.mb-4(deck)
      lah-monitor-board-xap(@light-update="lightUpdate")
      lah-monitor-board-apconn(@light-update="lightUpdate")
      lah-monitor-board-connectivity(@light-update="lightUpdate")
      //- lah-monitor-board-xap-trend(office="桃園所" watch-top-xap)
      //- lah-monitor-board-apconn(line, all)
  div(v-if="isHA")
    b-card-group.mb-4(deck)
      lah-monitor-board-dataguard.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-hacmp.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-dnp.card-body-fixed-height(@light-update="lightUpdate", footer)
    b-card-group.mb-4(deck)
      lah-monitor-board-L05.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-srmas.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-lxhweb-board(@light-update="lightUpdate", target-ip="L3HWEB")
    b-card-group.mb-4(deck)
      lah-monitor-board-dbbackup.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-vmclone.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-tape.card-body-fixed-height(@light-update="lightUpdate", footer)
    b-card-group.mb-4(deck)
      lah-monitor-board-apbackup.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-testdb.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-adsync.card-body-fixed-height(@light-update="lightUpdate", footer)
    b-card-group(deck)
      lah-monitor-board-ups.card-body-fixed-height(@light-update="lightUpdate", footer)
      b-card
      b-card
  div(v-else)
    b-card-group.mb-4(deck)
      lah-monitor-board-dataguard.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-hacmp.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-dnp.card-body-fixed-height(@light-update="lightUpdate", footer)
    b-card-group.mb-4(deck)
      lah-monitor-board-srmas.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-monitor-board-dbbackup.card-body-fixed-height(@light-update="lightUpdate", footer)
      lah-lxhweb-board(@light-update="lightUpdate", target-ip="L3HWEB")
  hr
</template>

<script>
export default {
  middleware: ['isInf'],
  data: () => ({
    red: 0,
    yellow: 0,
    green: 0
  }),
  head: {
    title: '智慧監控儀錶板-桃園市地政局'
  },
  computed: {
    isHA () {
      return this.site === 'HA'
    },
    lightMap () {
      return this.$store.getters['inf/monitorLightMap']
    }
  },
  watch: {
    lightUpdate (val) {
      console.warn(val)
    }
  },
  mounted () {
    console.warn(this.lightMap)
    this.refreshCounter()
  },
  methods: {
    refreshCounter () {
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
    },
    lightUpdate (payload) {
      // this.lightMap.set(payload.name, payload.new)
      // this.refreshCounter()
    }
  }
}
</script>

<style lang="scss">
.card-body-fixed-height {
  .card-body {
    height: calc((100vh - 450px) / 3);
    overflow: auto;
  }
}
</style>
