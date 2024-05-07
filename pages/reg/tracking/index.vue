<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ formattedDay }} 案件追蹤 (第{{ slideIdx + 1 }}頁)
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex
          b-input(v-model="qday")
          lah-countdown-button.ml-1(
            ref="countdown",
            icon="arrows-rotate",
            auto-start,
            title="搜尋",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="reloadMs",
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
      h3 - 輪播間隔{{ slideMs / 1000 }}秒
  //- display cards
  b-carousel(
    ref="carousel",
    v-model="slideIdx",
    :interval="slideMs",
    indicators
  )
    b-carousel-slide: template(#img)
      lah-reg-tracking-cards(:rows="queue")
    b-carousel-slide(v-if="queue2.length !== 0"): template(#img)
      lah-reg-tracking-cards(:rows="queue2")
    b-carousel-slide(v-if="queue3.length !== 0"): template(#img)
      lah-reg-tracking-cards(:rows="queue3")
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
    template(#modal-title) 詳細異動清單
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
      :current-page="pagination.currentPage"
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
    slideMs: 10 * 1000,
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
    queue: [],
    queue2: [],
    queue3: [],
    maxQueueSize: 12
  }),
  fetch () {
    this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
    this.$axios.post(this.$consts.API.JSON.MOICAS, {
      type: 'crsmslog',
      qday: this.qday,
      qtime: '000000'
      // qtime: this.qtime
    }).then(({ data }) => {
      this.baked = [...data.baked]
      this.rebuildQueue()
    }).catch((err) => {
      console.warn(err)
    }).finally(() => {
      this.$refs.countdown?.setCountdown(this.reloadMs)
      this.reloadMs > 0 && this.$refs.countdown?.startCountdown()
      this.isBusy = false
    })
  },
  head: {
    title: '登記案件追蹤-桃園市地政局'
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
      // console.warn(arr)
    },
    qtime (n, o) {
      console.warn(`qtime changed from ${o} to ${n}`)
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
    this.rebuildQueue = this.$utils.debounce(() => {
      // console.warn('queue before: ', this.queue)
      const tmp = []
      let y = 0
      for (let i = 0; i < this.baked.length && tmp.length < this.maxQueueSize; i++) {
        // dedup
        if (tmp.includes(this.baked[i].RM03)) {
          continue
        }
        if (this.queue.length >= this.maxQueueSize) {
          // remove head
          this.queue.shift()
        }
        tmp.push(this.baked[i].RM03)
        // remember the minimum time for next querying
        // if (this.baked[i].RM03 < this.qtime) {
        //   this.qtime = this.baked[i].RM105_2
        // }
        // add to queue tail
        this.queue.push(this.baked[i])
        y++
      }
      let z = 0
      for (; y < this.baked.length && tmp.length < this.maxQueueSize * 2; y++) {
        // dedup
        if (tmp.includes(this.baked[y].RM03)) {
          continue
        }
        if (this.queue2.length >= this.maxQueueSize) {
          // remove head
          this.queue2.shift()
        }
        tmp.push(this.baked[y].RM03)
        // remember the minimum time for next querying
        // if (this.baked[i].RM03 < this.qtime) {
        //   this.qtime = this.baked[i].RM105_2
        // }
        // add to queue tail
        this.queue2.push(this.baked[y])
        z++
      }
      for (; z < this.baked.length && tmp.length < this.maxQueueSize * 3; z++) {
        // dedup
        if (tmp.includes(this.baked[z].RM03)) {
          continue
        }
        if (this.queue3.length >= this.maxQueueSize) {
          // remove head
          this.queue3.shift()
        }
        tmp.push(this.baked[z].RM03)
        // remember the minimum time for next querying
        // if (this.baked[i].RM03 < this.qtime) {
        //   this.qtime = this.baked[i].RM105_2
        // }
        // add to queue tail
        this.queue3.push(this.baked[z])
      }
    }, 400)
  },
  mounted () {},
  beforeDestroy () {},
  methods: {
    rebuildQueue () { /** placeholder */ },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-today-table-perPage', payload.perPage)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
