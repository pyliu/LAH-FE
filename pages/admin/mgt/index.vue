<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex
          .my-auto {{ site }} 智慧監控儀錶板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
        .d-flex.align-items.center
          b-checkbox.small.mr-1(v-model="displayXAP", title="顯示跨所AP狀態", switch)
            lah-fa-icon(:icon="displayXAP ? 'chart-line' : 'chart-bar'", :variant="displayXAP ? 'secondary' : 'primary'") 跨縣市AP
          lah-button.mr-1(
            @click="$refs.setupModal.show()",
            icon="cog",
            variant="outline-secondary",
            size="lg",
            action="clock",
            no-border,
            no-icon-gutter,
            title="設定"
          )
          .mr-1 🔴 {{ red }}
          .mr-1 🟡 {{ yellow }}
          .mr-1 🟢 {{ green }}
    lah-monitor-board-setup-modal(ref="setupModal")
    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示各監控標的狀態之功能
        li 預設監控顯示一天內資料
        li 目前監控設定：{{ connectionText }}
  lah-transition: b-card-group.mb-4(deck, v-if="displayXAP")
      lah-monitor-board-xap
      lah-monitor-board-apconn
      lah-monitor-board-connectivity
      //- lah-monitor-board-xap-trend(office="桃園所" watch-top-xap)
      //- lah-monitor-board-apconn(line, all)
  b-card-group.mb-4(deck)
    lah-monitor-board-dataguard.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-hacmp.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-dnp.card-body-fixed-height(@light-update="lightUpdate", footer)
  b-card-group.mb-4(deck)
    lah-monitor-board-srmas.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-dbbackup.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-vmclone.card-body-fixed-height(@light-update="lightUpdate", footer)
  b-card-group.mb-4(deck)
    lah-monitor-board-tape.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-apbackup.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-testdb.card-body-fixed-height(@light-update="lightUpdate", footer)
  b-card-group(deck)
    lah-monitor-board-adsync.card-body-fixed-height(@light-update="lightUpdate", footer)
    lah-monitor-board-ups.card-body-fixed-height(@light-update="lightUpdate", footer)
    b-card
  hr
</template>

<script>
export default {
  middleware: ['isAdmin'],
  data: () => ({
    displayXAP: false,
    lightMap: new Map(),
    red: 0,
    yellow: 0,
    green: 0
  }),
  head: {
    title: '智慧監控儀錶板-桃園市地政局'
  },
  computed: {
    connectionText () {
      return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}/novalidate-cert}INBOX`
    }
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
