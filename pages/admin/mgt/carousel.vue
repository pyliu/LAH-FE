<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex
          .my-auto {{ site }} 智慧監控走馬燈
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )
          lah-button(
            icon="circle-left",
            variant="outline-primary",
            to="/admin/mgt/",
            regular,
            no-border,
            no-icon-gutter,
            title="正常版本"
          )
        .d-flex.align-items-center
          lah-button.mr-5(
            @click="prev()",
            icon="arrow-left-long",
            variant="primary",
            size="lg",
            action="move-fade-rtl",
            no-border,
            no-icon-gutter,
            title="上一頁"
          )
          lah-button(
            @click="next()",
            icon="arrow-right-long",
            variant="primary",
            size="lg",
            action="move-fade-ltr",
            no-border,
            no-icon-gutter,
            title="下一頁"
          )
        .d-flex.align-items-center
          .mr-1 每
          b-spinbutton(
            v-model="secs",
            min="5",
            max="60",
            inline
          )
          .mx-1 秒自動切換
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
  lah-transition
    b-carousel.mb-4(
      ref="xap",
      v-if="displayXAP",
      :interval="carouselInterval"
    )
      b-carousel-slide: template(#img): b-card-group.card-body-fixed-height(deck)
        lah-monitor-board-xap
        lah-monitor-board-xap-trend(office="桃園所", watch-top-xap)
        lah-monitor-board-apconn
      b-carousel-slide: template(#img): b-card-group.card-body-fixed-height(deck)
        //- lah-monitor-board-xap
        lah-monitor-board-apconn(bar, all)
        lah-monitor-board-connectivity
        lah-lxhweb-board(target-ip="L3HWEB")
  b-carousel(
    ref="boards",
    :interval="carouselInterval"
  )
    b-carousel-slide: template(#img)
      b-card-group.mb-4.card-body-fixed-height(deck)
        lah-monitor-board-dataguard(@light-update="lightUpdate")
        lah-monitor-board-hacmp(@light-update="lightUpdate")
        lah-monitor-board-dnp(@light-update="lightUpdate")
      b-card-group.mb-4.card-body-fixed-height(deck)
        lah-monitor-board-srmas(@light-update="lightUpdate")
        lah-monitor-board-dbbackup(@light-update="lightUpdate")
        lah-monitor-board-vmclone(@light-update="lightUpdate")
    b-carousel-slide: template(#img)
      b-card-group.mb-4.card-body-fixed-height(deck)
        lah-monitor-board-tape(@light-update="lightUpdate")
        lah-monitor-board-apbackup(@light-update="lightUpdate")
        lah-monitor-board-testdb(@light-update="lightUpdate")
      b-card-group.card-body-fixed-height(deck)
        lah-monitor-board-adsync(@light-update="lightUpdate")
        lah-monitor-board-ups(@light-update="lightUpdate")
        b-card
</template>

<script>
export default {
  middleware: ['isAdmin'],
  data: () => ({
    displayXAP: false,
    lightMap: new Map(),
    red: 0,
    yellow: 0,
    green: 0,
    secs: 10
  }),
  head: {
    title: '智慧監控走馬燈-桃園市地政局'
  },
  computed: {
    connectionText () {
      return `${this.systemConfigs?.monitor?.account}@{${this.systemConfigs?.monitor?.host}/novalidate-cert}INBOX`
    },
    carouselInterval () {
      return this.secs * 1000
    }
  },
  watch: {
    secs (val) {
      const int = parseInt(val)
      this.setCache('monitorBoardsCarouselSecs', int && int > 0 ? int : 10)
    }
  },
  async created () {
    this.secs = await this.getCache('monitorBoardsCarouselSecs') || 10
  },
  mounted () {
    this.$nextTick(() => { this.displayXAP = true })
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
    },
    next () {
      this.$refs.xap?.next()
      this.$refs.boards?.next()
    }
  }
}
</script>

<style lang="scss">
.card-body-fixed-height {
  .card-body {
    height: calc((100vh - 400px) / 3);
    overflow: auto;
  }
}
</style>
