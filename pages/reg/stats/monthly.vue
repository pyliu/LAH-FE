<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 登記案件統計資訊
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")

        lah-datepicker(
          v-model="dateRange",
          :begin="initBegin",
          :end="initEnd",
          size="lg",
          @input="handleDate"
        )
        lah-button.ml-1(
          icon="magnifying-glass",
          size="lg",
          title="重新搜尋",
          :disabled="globalQuery || isBusy",
          @click="globalQuery = true"
          no-icon-gutter
        )
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h5 {{ site }} 上個月(預設)的統計資料
      ul
        li 第一次登記- 登記原因代碼 02
        li HA81 - 桃資登
        li HA85 - 桃資速
        li HA87 - 桃資標
  b-card-group(deck)
    b-card.border-0(no-body)
      lah-stats-reg-first(
        ref="regFirst",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
      lah-stats-reg-first-sub.mt-3(
        ref="regFirstSub",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
    b-card.border-0(no-body)
      lah-stats-reg-rm02(
        ref="regRM02_1",
        :rm02="'HA81'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
      lah-stats-reg-rm02-sub.mt-3(
        ref="regRM02Sub_1",
        :rm02="'HA81'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
    b-card.border-0(no-body)
      lah-stats-reg-rm02(
        ref="regRM02_2",
        :rm02="'HA87'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
      lah-stats-reg-rm02-sub.mt-3(
        ref="regRM02Sub_2",
        :rm02="'HA87'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
    b-card.border-0(no-body)
      lah-stats-reg-rm02(
        ref="regRM02_3",
        :rm02="'HA85'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
      lah-stats-reg-rm02-sub.mt-3(
        ref="regRM02Sub_3",
        :rm02="'HA85'",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
</template>

<script>
export default {
  fetchOnServer: false,
  asyncData ({ isDev, route, store, env, params, query, req, res, redirect, error }) {
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0)
    }
  },
  data: () => ({
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    readyCount: 0,
    globalQuery: false,
    regFirstCount: NaN
  }),
  head: {
    title: '登記案件月統計資訊-桃園市地政局'
  },
  computed: {
    period () {
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    }
  },
  watch: {
    // dateRange (val) { console.warn(val) }
    globalQuery (flag) {
      this.readyCount = 0
      flag && this.$refs.regFirst?.query()
      flag && this.$refs.regFirstSub?.query()
      flag && this.$refs.regRM02_1?.query()
      flag && this.$refs.regRM02Sub_1?.query()
      flag && this.$refs.regRM02_2?.query()
      flag && this.$refs.regRM02Sub_2?.query()
      flag && this.$refs.regRM02_3?.query()
      flag && this.$refs.regRM02Sub_3?.query()
    }
  },
  created () {
    this.debounceReset = this.$utils.debounce(() => {
      this.readyCount = 0
      this.globalQuery = false
    }, 10000)
  },
  methods: {
    handleDate (e) {},
    handleReady (e) {
      this.readyCount++
      if (this.readyCount === 8) {
        this.globalQuery = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
