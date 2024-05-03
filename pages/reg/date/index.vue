<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div {{ formattedDay }} 案件追蹤 (共{{ count }}件)
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
          b-input(v-model="qday", @input="debouncedReload")
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
    no-caption
  )
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    reloadTimer: null,
    reloadMs: 60 * 1000,
    qday: '',
    baked: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    }
  }),
  fetch () {
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

    })
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
      console.warn(arr)
    }
  },
  async created () {
    this.debouncedReload = this.$utils.debounce(() => {
      this.$fetch()
    }, 500)
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-today-table-perPage') || 20)
  },
  mounted () {
    this.reloadTimer = setInterval(() => {
      this.$fetch()
    }, this.reloadMs)
  },
  beforeDestroy () {
    clearInterval(this.reloadTimer)
  },
  methods: {
    debouncedReload () { /** placeholder */ },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-today-table-perPage', payload.perPage)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
