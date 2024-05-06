<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ formattedDay }} 案件追蹤 (共{{ count }}件)
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex
          b-input(v-model="qday")
          lah-countdown-button.ml-1(
            ref="countdown",
            icon="magnifying-glass",
            auto-start,
            title="搜尋",
            variant="outline-primary",
            badge-variant="secondary",
            :milliseconds="reloadMs",
            @end="$fetch",
            @click="$fetch"
          )
    lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
  //- below is the customize area
  lah-transition: lah-pagination(
    v-if="count > pagination.perPage"
    v-model="pagination",
    :total-rows="count"
    :caption="`找到 ${count} 筆資料`",,
    @input="handlePaginationInput"
  )
  lah-reg-b-table(
    :baked-data="baked",
    :per-page="pagination.perPage",
    :current-page="pagination.currentPage",
    :busy="isBusy",
    :small="false",
    type="lg",
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
    baked: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    }
  }),
  fetch () {
    if (!this.isBusy) {
      this.isBusy = true
      this.$utils.empty(this.qday) && (this.qday = this.$utils.today('TW').replaceAll('-', ''))
      this.baked = []
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_cases_by_day',
        qday: this.qday
      }).then(({ data }) => {
        console.warn(data)
        data.data_count > 0 && (this.baked = [...data.baked])
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
  },
  watch: {
    baked (arr) {
      // console.warn(arr)
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
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
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-today-table-perPage', payload.perPage)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
