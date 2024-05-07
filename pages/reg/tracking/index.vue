<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ formattedDay }} 案件追蹤
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
      h1 這是說明視窗
  //- display cards
  .text-center: lah-reg-tracking-cards(:rows="queue")
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
    b-table(
      :items="baked",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :busy="isBusy",
      :small="false",
      no-caption
    )
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    reloadMs: 60 * 1000,
    pageTimer: null,
    pageCount: 1,
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
    maxQueueSize: 12
  }),
  fetch () {
    if (!this.isBusy) {
      this.isBusy = true
      this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
      // this.baked = []
      console.warn(this.$utils.now())
      // this.queue = []
      this.$axios.post(this.$consts.API.JSON.MOICAS, {
        type: 'crsmslog',
        qday: this.qday,
        qtime: this.qtime
      }).then(({ data }) => {
        if (data.baked.length > 0) {
          // store the latest update time
          this.qtime = data.baked[0].RM105_2
          if (this.baked.length === 0) {
            this.baked = [...data.baked]
          } else {
            // push data to head of array
            data.baked.reverse().forEach((row) => {
              this.baked.unshift(row)
            })
          }
        } else {
          console.warn('No new update.')
        }
        this.rebuildQueue()
      }).catch((err) => {
        console.warn(err)
      }).finally(() => {
        this.$refs.countdown?.setCountdown(this.reloadMs)
        this.reloadMs > 0 && this.$refs.countdown?.startCountdown()
        this.isBusy = false
      })
    }
  },
  head: {
    title: '今日案件追蹤-桃園市地政局'
  },
  computed: {
    count () {
      return this.baked?.length || 0
    },
    formattedDay () {
      return this.$utils.addDateDivider(this.qday)
    }
    // firstDeck () {
    //   if (this.queue.length < 5) {
    //     return this.queue
    //   }
    //   return this.queue.slice(0, 4)
    // },
    // secondDeck () {
    //   if (this.queue.length < 5) {
    //     return []
    //   }
    //   return this.queue.slice(4, 8)
    // }
  },
  watch: {
    baked (arr) {
      console.warn(arr)
    },
    qtime (n, o) {
      console.warn(`qtime changed from ${o} to ${n}`)
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
    this.rebuildQueue = this.$utils.debounce(() => {
      console.warn('queue before: ', this.queue)
      const tmp = []
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
        // add to queue tail
        this.queue.push(this.baked[i])
      }
    }, 400)
  },
  mounted () {
    // this.pageTimer = setInterval(() => {
    //   const perPage = this.pagination.perPage
    //   const pages = this.count / perPage
    //   this.pagination = {
    //     ...{
    //       currentPage: (++this.pageCount % pages) + 1,
    //       perPage
    //     }
    //   }
    // }, 5000)
  },
  beforeDestroy () {
    clearInterval(this.pageTimer)
  },
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
