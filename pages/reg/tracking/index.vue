<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ formattedDay }} 異動案件追蹤 (第{{ slideIdx + 1 }}頁，第 {{ 1 + slideIdx * 12 }} 至 {{ (slideIdx + 1) * 12 }} 件)
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex
          b-input(v-model="qday", @keyup.enter="$fetch()", style="width: 100px")
          lah-countdown-button.ml-1(
            ref="countdown",
            icon="arrows-rotate",
            action="cycle",
            auto-start,
            title="讀取",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="reloadMs",
            :busy="buttonDisabled",
            @end="$fetch",
            @click="$fetch"
          )
          lah-button.ml-1(
            icon="arrow-up-right-from-square",
            auto-start,
            title="搜尋",
            variant="outline-secondary",
            @click="$refs.table.show()"
          )
    lah-help-modal(:modal-id="'help-modal'")
      h2 顯示最新36件案件異動資料
      h3 - 每頁12件
      h3: .d-flex.align-items-center.my-auto
        .mr-1 - 輪播間隔
        b-spinbutton(
          v-model="slideSecs",
          min="0",
          title="設定為0會停止自動切換面板",
          inline
        )
        .ml-1 秒切換
  //- display cards
  .center.h1.mt-5(v-if="queueChunks.length === 0") ⚠ 尚無異動案件資料
  b-carousel(
    v-else
    ref="carousel",
    v-model="slideIdx",
    :interval="slideSecs * 1000",
    indicators
  )
    b-carousel-slide: template(#img)
      lah-reg-tracking-cards(:rows="queueChunks[0]")
    b-carousel-slide(v-if="queueChunks.length > 1"): template(#img)
      lah-reg-tracking-cards(:rows="queueChunks[1]", :serial-start="13")
    b-carousel-slide(v-if="queueChunks.length > 2"): template(#img)
      lah-reg-tracking-cards(:rows="queueChunks[2]", :serial-start="25")
  //- b-card-group.mt-4(deck)
  //-   b-card(v-for="(row, idx) in secondDeck", :key="`second_deck_${idx}`")
  //-     .h1 {{ row.RM03 }}
  //-     .h1 {{ row['辦理情形'] }}
  //-     .h1 {{ $utils.addTimeDivider(row.RM105_2) }}
  //- below is the customize area
  b-modal(
    ref="table",
    size="xl",
    hide-footer,
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title) 詳細異動案件清單
    lah-transition: lah-pagination(
      v-if="count > pagination.perPage"
      v-model="pagination",
      :total-rows="count"
      :caption="`找到 ${count} 筆資料`",
      @input="handlePaginationInput"
    )
    lah-reg-b-table(
      type="lg",
      :baked-data="baked",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :case-reload="true"
    )
    //- b-table(
    //-   :items="baked",
    //-   :fields="fields",
    //-   :per-page="pagination.perPage",
    //-   :current-page="pagination.currentPage",
    //-   :busy="isBusy",
    //-   :small="false",
    //-   no-caption
    //- )
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    reloadMs: 60 * 1000,
    slideSecs: 10,
    slideIdx: 0,
    qday: '',
    qtime: '000000',
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    baked: [],
    fields: [
      { key: '收件字號', sortable: true },
      { key: '登記原因', sortable: true },
      { key: '辦理情形', sortable: true },
      { key: '初審人員', sortable: true },
      { key: '作業人員', sortable: true },
      { key: '異動時間', sortable: true }
    ],
    queueChunks: [],
    maxQueueSize: 12,
    buttonDisabled: false
  }),
  fetch () {
    if (this.buttonDisabled) {
      this.warning('查詢中，請稍後 ... ')
      return
    }
    this.buttonDisabled = true
    this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
    this.$axios.post(this.$consts.API.JSON.MOICAS, {
      // type: 'crsms_update_by_date',
      type: 'crsmslog',
      qday: this.qday
      // qtime: this.qtime
    }).then(({ data }) => {
      // use 'crsmslog' type query needs to do uniq by RM01+RM02+RM03
      this.baked = [...this.$utils.uniqBy(data.baked, row => `${row.RM01}${row.RM02}${row.RM03}`)]
      // this.baked = [...data.baked]
    }).catch((err) => {
      console.warn(err)
    }).finally(() => {
      this.$refs.countdown?.setCountdown(this.reloadMs)
      this.reloadMs > 0 && this.$refs.countdown?.startCountdown()
      this.isBusy = false
      this.buttonDisabled = false
      this.slideIdx = 0
    })
  },
  head: {
    title: '登記異動案件追蹤-桃園市地政局'
  },
  computed: {
    count () {
      return this.baked?.length || 0
    },
    formattedDay () {
      return this.$utils.addDateDivider(this.qday)
    }
  },
  watch: {
    baked (arr) {
      // for display cards
      this.queueChunks = this.$utils.chunk(arr, this.maxQueueSize)
    },
    qtime (n, o) {
      // console.warn(`qtime changed from ${o} to ${n}`)
    },
    queueChunks (arr) {
      // console.warn(arr)
    },
    slideSecs (val) {
      this.setCache('lah-reg-tracking-slide-secs', val)
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
    this.slideSecs = parseInt(await this.getCache('lah-reg-tracking-slide-secs')) || 10
  },
  mounted () {},
  beforeDestroy () {},
  methods: {
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-today-table-perPage', payload.perPage)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
