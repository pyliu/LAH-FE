<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          .my-auto {{ formattedDay }} {{ caseText }}異動追蹤
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        b-button-group(
          v-if="queueChunks.length > 1",
          v-b-popover.hover.bottom="`第${ slideIdx + 1 }頁，第 ${ 1 + slideIdx * 12 } 至 ${ (slideIdx + 1) * 12 } 件`"
        )
          lah-button.border-0(
            v-for="(chunk,idx) in queueChunks",
            :key="`slide_button_${idx}`",
            :pressed="idx === slideIdx",
            @click="slideIdx = idx",
            v-if="idx < slideCount",
            size="lg"
          ) {{ idx + 1 }}
        .d-flex.align-items-center
          //- b-checkbox(v-model="easyCase", switch) 簡易案件
          //- .mx-1
          b-input.my-auto.mr-1(v-model="qday", @keyup.enter="$fetch()", style="width: 100px; height: 50px;")
          b-button-group(size="lg")
            lah-countdown-button(
              ref="countdown",
              icon="magnifying-glass",
              auto-start,
              title="讀取",
              variant="outline-primary",
              badge-variant="secondary",
              :milliseconds="reloadMs",
              :busy="buttonDisabled",
              @end="$fetch",
              @click="$fetch"
            )
            lah-button.mx-1(
              icon="arrow-up-right-from-square",
              title="顯示所有異動案件",
              variant="outline-secondary",
              @click="$refs.table.show()"
            )
            lah-button(
              v-if="queueChunks.length > 1",
              icon="tv",
              action="move-fade-rtl",
              title="切換版面",
              variant="outline-info",
              @click="$refs.carousel.next()"
            )
    lah-help-modal(:modal-id="'help-modal'")
      h5 顯示最新 {{ maxQueueSize * slideCount }} 件{{ caseText }}異動資料
      ul
        li 每頁 {{ maxQueueSize }} 件
        li: .d-flex.align-items-center.my-auto
          .mr-1 輪播間隔
          b-spinbutton(
            v-model="slideSecs",
            min="0",
            title="設定為0會停止自動切換面板",
            inline
          )
          .ml-1 秒切換
        li
          b-checkbox(v-model="easyCase", switch) 僅顯示簡易案件
  //- display cards
  .center.h1.mt-5(v-if="queueChunks.length === 0") ⚠ 無{{ caseText }}異動資料
  b-carousel(
    v-else
    ref="carousel",
    v-model="slideIdx",
    :interval="slideSecs * 1000",
    no-hover-pause
  )
    b-carousel-slide(
      v-for="(chunk,idx) in queueChunks",
      :key="`slide_${idx}`",
      v-if="idx < slideCount"
    ): template(#img)
      lah-reg-tracking-cards(:rows="chunk", :query-day="qday", :serial-start="1 + idx * 12")
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
    slideSecs: 15,
    slideIdx: 0,
    slideCount: 4,
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
    // queueChunks: [],
    maxQueueSize: 12,
    buttonDisabled: false,
    easyCase: true,
    reloadTimer: null
  }),
  fetch () {
    if (this.buttonDisabled) {
      this.warning('查詢中，請稍後 ... ')
      return
    }
    this.buttonDisabled = true
    this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
    this.$axios.post(this.$consts.API.JSON.MOICAS, {
      type: 'crsms_update_by_date',
      // type: 'crsmslog',
      qday: this.qday
      // qtime: this.qtime
    }).then(({ data }) => {
      // use 'crsmslog' type query needs to do uniq by RM01+RM02+RM03
      // this.baked = [...this.$utils.uniqBy(data.baked, row => `${row.RM01}${row.RM02}${row.RM03}`)]
      this.baked = [...this.$utils.orderBy(data.baked, [(row) => {
        return this.latestUpdateTime(row)
      }], ['desc'])]
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
    caseText () {
      return this.easyCase ? '簡易案件' : '案件'
    },
    count () {
      return this.baked?.length || 0
    },
    formattedDay () {
      return this.$utils.addDateDivider(this.qday)
    },
    trackingCase () {
      if (this.easyCase) {
        return this.baked.filter((row) => {
          /**
           * RM08 - 收件類別
           * 1 一般案件
           * 2 專辦案件
           * 3 急速件
           * 9 簡易案件
           * Q 逕為案件
           * R 囑託案件
           * X 跨縣市收辦案件
           */
          return row.RM08 === '9'
        })
      }
      return this.baked
    },
    queueChunks () {
      return this.$utils.chunk(this.trackingCase, this.maxQueueSize)
    }
  },
  watch: {
    baked (arr) {
      // console.warn(arr)
    },
    qtime (n, o) {
      // console.warn(`qtime changed from ${o} to ${n}`)
    },
    queueChunks (arr) {
      // console.warn(arr)
    },
    slideSecs (val) {
      this.setCache('lah-reg-tracking-slide-secs', val)
    },
    easyCase (flag) {
      this.setCache('lah-reg-tracking-easy-case-flag', flag)
    },
    buttonDisabled (flag) {
      if (flag) {
        // set idx to 0
        this.slideIdx = 0
        // stop sliding
        this.slideSecs = 0
      } else {
        // start sliding
        this.slideSecs = 15
      }
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
    this.slideSecs = parseInt(await this.getCache('lah-reg-tracking-slide-secs')) || 15
    this.easyCase = await this.getCache('lah-reg-tracking-easy-case-flag') || true
  },
  mounted () {
    // reload page after 30 minutes to prevent Out of Memory issue
    this.reloadTimer = setInterval(() => { location.reload() }, 30 * 60 * 1000)
  },
  beforeDestroy () {
    clearInterval(this.reloadTimer)
  },
  methods: {
    latestUpdateTime (row) {
      const targetDate = this.$utils.empty(this.qday) ? this.$utils.today('TW').replaceAll('-', '') : this.qday
      let ok = false
      // 異動時間
      !ok && targetDate === row.RM105_1 && (ok = row.RM105_2)
      // 秘書
      !ok && targetDate === row.RM107_1 && (ok = row.RM107_2)
      // 課長
      !ok && targetDate === row.RM106_1 && (ok = row.RM106_2)
      // 撤回
      !ok && targetDate === row.RM93_1 && (ok = row.RM93_2)
      // 歸檔
      // !ok && targetDate === row.RM91_1 && (ok = row.RM91_2)
      // 展期
      !ok && targetDate === row.RM86 && (ok = row.RM87)
      // 補正
      !ok && targetDate === row.RM53_1 && (ok = row.RM53_2)
      // 駁回
      !ok && targetDate === row.RM48_1 && (ok = row.RM48_2)
      // 取消請示
      !ok && targetDate === row.RM83 && (ok = row.RM84)
      // 請示
      !ok && targetDate === row.RM80 && (ok = row.RM81)
      // 結案
      !ok && targetDate === row.RM58_1 && (ok = row.RM58_2)
      // 校對
      !ok && targetDate === row.RM56_1 && (ok = row.RM56_2)
      // 登錄
      !ok && targetDate === row.RM54_1 && (ok = row.RM54_2)
      // 複審
      !ok && targetDate === row.RM46_1 && (ok = row.RM46_2)
      // 准登
      !ok && targetDate === row.RM62_1 && (ok = row.RM62_2)
      // 初審
      !ok && targetDate === row.RM44_1 && (ok = row.RM44_2)
      // 收件
      // !ok && targetDate === row.RM07_1 && (ok = row.RM07_2)
      return ok
    },
    checkWithCurrentTime (tmp, current) {
      if (tmp && tmp <= current) {
        return tmp
      }
      return false
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-today-table-perPage', payload.perPage)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
