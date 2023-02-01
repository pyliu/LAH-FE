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
          lah-button(
            icon="circle-right",
            variant="outline-primary",
            to="/inf/dashboard/carousel",
            regular,
            no-border,
            no-icon-gutter,
            title="走馬燈版本"
          )
        .d-flex.align-items-center: b-button-group(size="lg")
          //- b-checkbox.small.mr-1(v-model="displayXAP", title="顯示跨所AP狀態", switch)
          //-   lah-fa-icon(:icon="displayXAP ? 'desktop' : 'server'", :variant="displayXAP ? 'primary' : 'dark'") 跨域AP
          lah-button.mr-1(
            v-if="filtering !== false",
            icon="arrow-rotate-left",
            action="cycle-alt",
            no-border,
            title="顯示所有儀表板",
            @click="filterByLight"
          ) 回復
          lah-button.mr-1(
            v-if="filtering !== 'dander'",
            no-border,
            no-icon-gutter,
            title="檢視紅燈儀表板",
            @click="filterByLight('danger')"
          ) 🔴 {{ red }}
          lah-button.mr-1(
            v-if="filtering !== 'warning'",
            no-border,
            no-icon-gutter,
            title="檢視黃燈儀表板",
            @click="filterByLight('warning')"
          ) 🟡 {{ yellow }}
          lah-button.mr-1(
            v-if="filtering !== 'success'",
            no-border,
            no-icon-gutter,
            title="檢視綠燈儀表板",
            @click="filterByLight('success')"
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
  lah-transition: b-card-group(v-if="filtering", columns)
    component(
      v-for="name in filteredComponents",
      :key="name",
      :is="name"
    )
  div(v-show="!filtering")
    client-only: b-card-group.mb-4(deck)
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
    displayXAP: false,
    red: 0,
    yellow: 0,
    green: 0,
    filtering: false
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
    },
    filteredComponents () {
      if (this.filtering === false) {
        return []
      }
      const filtered = []
      this.lightMap.forEach((value, key) => {
         if (value === this.filtering) {
           filtered.push(key)
         }
      })
      return filtered
    }
  },
  watch: {
    displayXAP (flag) {
      this.setCache('lah-display-XAP-flag', flag)
    }
  },
  async mounted () {
    // this.displayXAP = await this.getCache('lah-display-XAP-flag') || false
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
      // this.$utils.warn(this.lightMap)
    },
    filterByLight (state = false) {
      this.filtering = state
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
