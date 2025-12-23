<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 年度統計資訊
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")

        lah-datepicker(
          v-model="dateRange",
          :begin="initBegin",
          :end="initEnd",
          size="lg",
          @input="handleDate"
        )
    lah-help-modal(:modal-id="'help-modal'" size="md")
      lah-fa-icon.h6(icon="info") {{ siteName }}去年(預設，仍可選擇想要的區間)的統計資料，請依需求點選個別儀表板查詢。

  lah-flex-item-group
    .col-md-4(key="reg-initial"): lah-stats-reg-initial-review(
      ref="regInitial",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-final"): lah-stats-reg-final-review(
      ref="regFinal",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-chief"): lah-stats-reg-chief-review(
      ref="regChief",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-hundred-years-owner"): lah-stats-reg-owner-by-year(
      ref="regHundredYearsOwner",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="adm-notification"): lah-stats-adm-notification(
      ref="admNotification",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
</template>

<script>
export default {
  fetchOnServer: false,
  async asyncData ({ isDev, route, store, env, params, query, req, res, redirect, error, $content }) {
    const siteCodeMap = await $content('statsSiteCode').fetch()
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear() - 1, 0, 1),
      initEnd: new Date(today.getFullYear() - 1, 11, 31),
      siteCodeMap
    }
  },
  data: () => ({
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    readyCount: 0,
    regFirstCount: NaN
  }),
  head: {
    title: '年度統計資訊-桃園市地政局'
  },
  computed: {
    period () {
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    },
    codes () {
      return this.siteCodeMap[this.site]
    },
    boardCount () {
      return Object.values(this.$refs).length
    }
  },
  watch: {
    // dateRange (val) { console.warn(val) }
  },
  created () {
    this.debounceReset = this.$utils.debounce(() => {
      this.readyCount = 0
    }, 10000)
  },
  mounted () {},
  methods: {
    handleDate (e) {},
    handleReady (e) {
      this.readyCount++
    }
  }
}
</script>

<style lang="scss" scoped>
.col-md-4 {
  margin-bottom: 1.25rem;
  > .card {
    height: 100%;
  }
}
</style>
