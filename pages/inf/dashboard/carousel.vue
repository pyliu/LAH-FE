<template lang="pug">
div(v-cloak)
  lah-header: lah-transition(appear): .d-flex.justify-content-between.align-items-center.w-100
    .d-flex
      .my-auto {{ site }} 智慧監控輪播
      lah-button(
        v-b-modal.help-modal,
        icon="info",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        title="說明"
      )
      lah-button(
        icon="angles-left",
        variant="outline-secondary",
        :to="isDevOffice ? '/inf/dashboard/HA' : '/inf/dashboard/HX'",
        regular,
        no-border,
        no-icon-gutter,
        size="lg",
        title="正常版本"
      )
    .d-flex.align-items-center
      lah-countdown-button(
        ref="countdown",
        icon="tv",
        action="slide-rtl",
        auto-start,
        title="立即切換版面",
        variant="outline-primary",
        badge-variant="secondary",
        :milliseconds="carouselInterval",
        @end="next()",
        @click="next()"
      ) 切換版面
      .mx-1 每
      b-spinbutton(
        v-model="secs",
        min="0",
        max="180",
        title="設定為0會停止自動切換面板",
        inline
      )
      .mx-1 秒自動切換
    .d-flex.align-items-center
      .mr-1 🔴 {{ red }}
      .mr-1 🟡 {{ yellow }}
      .mr-1 🟢 {{ green }}
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
  lah-monitor-board-setup-modal(ref="setupModal")
  lah-help-modal(:modal-id="'help-modal'", size="md")
    ul
      li 提供顯示各監控標的狀態之功能
      li 預設監控顯示一天內資料
      li 目前監控設定：{{ connectionText }}
  lah-transition: b-carousel.mb-4(
    ref="xap",
    v-if="displayXAP",
    :interval="0"
  )
    b-carousel-slide: template(#img): b-card-group(deck)
      lah-monitor-board-xap.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-sms.card-body-fixed-height-3(@light-update="lightUpdate", footer)
      //- lah-monitor-board-apconn(bar, all, @light-update="lightUpdate")
      lah-monitor-board-connectivity.card-body-fixed-height-3(@light-update="lightUpdate")
    b-carousel-slide: template(#img): b-card-group(deck)
      //- lah-monitor-board-xap
      lah-monitor-board-lxhweb.card-body-fixed-height-3(target-ip="L3HWEB", @light-update="lightUpdate")
      lah-monitor-board-site-hx.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-site-tw.card-body-fixed-height-3(@light-update="lightUpdate")

  //- b-carousel(
  //-   v-if="isDevOffice",
  //-   ref="boards",
  //-   :interval="0"
  //- )
  //-   b-carousel-slide: template(#img)
  //-     b-card-group.mb-4.card-body-fixed-height-3(deck)
  //-       lah-monitor-board-dataguard(@light-update="lightUpdate")
  //-       lah-monitor-board-hacmp(@light-update="lightUpdate")
  //-       lah-monitor-board-dnp(@light-update="lightUpdate")
  //-     b-card-group.mb-4.card-body-fixed-height-3(deck)
  //-       lah-monitor-board-L05(@light-update="lightUpdate")
  //-       lah-monitor-board-srmas(@light-update="lightUpdate")
  //-       lah-monitor-board-dbbackup(@light-update="lightUpdate")
  //-   b-carousel-slide: template(#img)
  //-     b-card-group.mb-4.card-body-fixed-height-3(deck)
  //-       lah-monitor-board-vmclone(@light-update="lightUpdate")
  //-       lah-monitor-board-tape(@light-update="lightUpdate")
  //-       lah-monitor-board-apbackup(@light-update="lightUpdate")
  //-     b-card-group.card-body-fixed-height-3(deck)
  //-       lah-monitor-board-xap-trend(office="桃園所", @light-update="lightUpdate", watch-top-xap)
  //-       lah-monitor-board-apconn(@light-update="lightUpdate")
  //-       lah-monitor-board-testdb(@light-update="lightUpdate")
        //- lah-monitor-board-adsync(@light-update="lightUpdate")
        //- lah-monitor-board-ups(@light-update="lightUpdate")

  lah-transition(v-if="isDevOffice"): div(v-show="haSwitch")
    b-card-group.mb-4(deck)
      lah-monitor-board-dataguard.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-hacmp.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-dnp.card-body-fixed-height-3(@light-update="lightUpdate")
    b-card-group.mb-4(deck)
      lah-monitor-board-L05.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-srmas.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-dbbackup.card-body-fixed-height-3(@light-update="lightUpdate")
  lah-transition(v-if="isDevOffice"): div(v-show="!haSwitch")
    b-card-group.mb-4(deck)
      lah-monitor-board-vmclone.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-tape.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-apbackup.card-body-fixed-height-3(@light-update="lightUpdate")
    b-card-group.card-body-fixed-height-3(deck)
      lah-monitor-board-xap-trend.card-body-fixed-height-3(office="桃園所", @light-update="lightUpdate", watch-top-xap)
      lah-monitor-board-apconn.card-body-fixed-height-3(@light-update="lightUpdate")
      lah-monitor-board-testdb.card-body-fixed-height-3(@light-update="lightUpdate")

  div(v-if="!isDevOffice")
      b-card-group.mb-4(deck)
        lah-monitor-board-dataguard.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-hacmp.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-dnp.card-body-fixed-height-3(@light-update="lightUpdate")
      b-card-group.mb-4(deck)
        lah-monitor-board-L05.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-srmas.card-body-fixed-height-3(@light-update="lightUpdate")
        lah-monitor-board-dbbackup.card-body-fixed-height-3(@light-update="lightUpdate")
</template>

<script>
export default {
  // middleware: ['isInf'],
  data: () => ({
    displayXAP: false,
    lightMap: new Map(),
    red: 0,
    yellow: 0,
    green: 0,
    secs: 30,
    haSwitch: true
  }),
  head: {
    title: '智慧監控儀表板輪播-桃園市地政局'
  },
  computed: {
    connectionText () {
      // bureau ssl mail server needs this
      if (this.systemConfigs?.monitor?.ssl) {
        return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}:993/imap/ssl/novalidate-cert}INBOX`
      }
      return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}/novalidate-cert}INBOX`
    },
    carouselInterval () {
      return this.secs * 1000
    }
  },
  watch: {
    secs (val) {
      const int = parseInt(val)
      this.setCache('monitorBoardsCarouselSecs', int && int > 0 ? int : 30)
      this.resetTimer()
    }
  },
  async created () {
    this.secs = await this.getCache('monitorBoardsCarouselSecs') || 30
  },
  mounted () {
    this.$nextTick(() => { this.displayXAP = true })
  },
  beforeDestroy () {
    this.$refs.countdown?.pauseCountdown()
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
    },
    prev () {
      this.$refs.xap?.prev()
      this.$refs.boards?.prev()
      this.haSwitch = !this.haSwitch
      this.resetTimer()
    },
    next () {
      this.$refs.xap?.next()
      this.$refs.boards?.next()
      this.haSwitch = !this.haSwitch
      this.resetTimer()
    },
    resetTimer () {
      this.$refs.countdown?.setCountdown(this.carouselInterval)
      this.carouselInterval > 0 && this.$refs.countdown?.startCountdown()
    }
  }
}
</script>

<style lang="scss">
.card-body-fixed-height-3 {
  .card-body {
    height: calc((100vh - 400px) / 3);
    overflow: auto;
  }
}
</style>
