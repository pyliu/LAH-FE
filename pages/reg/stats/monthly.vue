<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex.mr-auto.align-items-center
          div 登記每月案件統計資訊
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
      h5 {{ siteName }}上個月(預設)的統計資料
      ul
        li 第一次登記- 登記原因代碼 02
        li(v-for="(item, idx) in codes", :key="`li_${idx}`")
          span {{ item.code }}
          span -
          span {{ item.name }}

  lah-flex-item-group
    .col-md-4(key="smsCount"): lah-stats-sms-count(
      ref="smsCount",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="certCount"): lah-stats-reg-cert-count(
      ref="certCount",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="regFirst"): b-card.border-0.w-100(no-body)
      lah-stats-reg-first(
        ref="regFirst",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
      lah-stats-reg-first-sub.mt-2(
        ref="regFirstSub",
        :begin="dateRange.begin",
        :end="dateRange.end"
        @ready="handleReady"
      )
    .col-md-4(
      v-for="(item, idx) in codes",
      :key="`code_${idx}`",
    ): b-card.border-0.w-100(no-body)
      lah-stats-reg-rm02(
        :ref="`regRM02_${idx}`",
        :rm02="item.code",
        :rm02-name="item.name",
        :begin="dateRange.begin",
        :end="dateRange.end",
        @ready="handleReady"
      )
      lah-stats-reg-rm02-sub.mt-2(
        :ref="`regRM02Sub_${idx}`",
        :rm02="item.code",
        :rm02-name="item.name",
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
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0),
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
    globalQuery: false,
    regFirstCount: NaN
  }),
  head: {
    title: '登記案件月統計資訊-桃園市地政局'
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
    globalQuery (flag) {
      if (flag) {
        this.readyCount = 0
        Object.values(this.$refs).forEach((ref) => {
          if (Array.isArray(ref)) {
            ref[0].query()
          } else {
            ref.query()
          }
        })
      }
    }
  },
  created () {
    this.debounceReset = this.$utils.debounce(() => {
      this.readyCount = 0
      this.globalQuery = false
    }, 10000)
  },
  mounted () {},
  methods: {
    handleDate (e) {},
    handleReady (e) {
      this.readyCount++
      if (this.readyCount === this.boardCount) {
        this.globalQuery = false
      }
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
