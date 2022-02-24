<template lang="pug">
div
  lah-header
    .d-flex.w-100
      .d-flex.mr-auto.align-items-center
        b-badge.mr-1(pill, :variant="switchButtonVariant") {{ storeCaseCount }} 件
        b-form-radio-group.my-auto(
          v-model="isOverdueMode",
          :options="[{text: '逾期', value: true}, {text: '即將逾期', value: false}]",
          size="lg"
        )
        lah-button(
          icon="info",
          action="bounce",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="說明"
        )
        lah-help-modal(ref="help"): .h6.text-nowrap: ul
          li
            .d-flex
              .my-auto 請使用
              lah-button.mx-2(
                :icon="icon"
                :badgeText="queryCount.toString()"
                :variant="switchButtonVariant"
                :disabled="isBusy"
                :busy="isBusy"
                @click="isOverdueMode = !isOverdueMode"
                title="按我切換模式"
              )
                strong {{ queryTitle }}
              .my-auto 切換顯示模式
          li 預定結案時間剩餘4小時內將判定為即將逾期案件
          li #[a(:href="`${this.legacyUrl}/overdue_reg_cases.html`" target="_blank" rel="noreferrer noopener") 切換成舊版本模式]
      lah-button.mr-1(
        icon="search-plus",
        size="lg",
        title="開啟進階搜尋視窗",
        @click="$refs.searchPlus.show()",
        :disabled="!dataReady"
      ) 進階搜尋
      lah-countdown-button(
        ref="countdown"
        icon="sync-alt"
        action="ld-cycle"
        size="lg"
        auto-start
        title="立即重新讀取"
        variant="outline-secondary"
        badge-variant="secondary"
        :milliseconds="900000"
        :disabled="isBusy"
        :busy="isBusy"
        @end="$fetch"
        @click="reload"
      )
  lah-transition: b-tags.border-0.mt-n3.mb-1(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="primary",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    disabled
  )
  lah-transition(appear): lah-expiry-b-table(:busy="!committed")
  lah-transition.center.h3
    lah-fa-icon(
      v-cloak
      v-if="queryCount === 0 && committed"
      icon="exclamation-circle"
      prefix="fas"
    ) 無資料

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer,
    no-close-on-backdrop
  )
    .center.d-flex
      b-input-group(prepend="年")
        b-select(
          v-model="advOpts.caseYear",
          :options="advOpts.caseYearOpts",
          title="收件年"
        )
      b-input-group.mx-1(prepend="字")
        //- b-input.mx-1(v-model="advOpts.caseYear", placeholder="... 收件年 ...", trim)
        b-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字"
        )
      b-input-group(prepend="號")
        //- b-input.mr-1(v-model="advOpts.caseWord", placeholder="... 收件字 ...", trim)
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號 ...", trim)

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="原因"): b-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因"
      )
      b-input-group(prepend="狀態"): b-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形"
      )

    .center.d-flex
      b-input-group.mr-1(prepend="初審"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group(prepend="作業"): b-select(
        v-model="advOpts.caseOperator",
        :options="advOpts.caseOperatorOpts",
        title="作業人員"
      )

    .center.d-flex.my-1
      lah-button.mr-1(
        icon="check-circle",
        @click="filter",
        variant="outline-primary"
      ) 確定
      lah-button(
        icon="recycle",
        @click="reset",
        variant="outline-secondary"
      ) 重設
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  // middleware: [ 'expireAuth' ],
  mixins: [expiryBase],
  data: () => ({
    advOpts: {
      caseYear: '',
      caseWord: '',
      caseNum: '',
      caseReason: '',
      caseReasonOpts: [],
      caseState: '',
      caseStateOpts: [],
      casePreliminator: '',
      casePreliminatorOpts: [],
      caseOperator: '',
      caseOperatorOpts: []
    }
  }),
  head: {
    title: '登記逾期案件-桃園市地政局'
  },
  computed: {
    icon () { return this.isOverdueMode ? 'exclamation-triangle' : 'exclamation-circle' },
    dataReady () { return this.queriedJson && this.queriedJson.items?.length > 0 },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.caseYear)) {
        tags.push(`年：${this.advOpts.caseYear}`)
      }
      if (!this.$utils.empty(this.advOpts.caseWord)) {
        tags.push(`字：${this.advOpts.caseWord}`)
      }
      if (!this.$utils.empty(this.advOpts.caseNum)) {
        tags.push(`號：${this.advOpts.caseNum}`)
      }
      if (!this.$utils.empty(this.advOpts.caseReason)) {
        tags.push(`登記原因：${this.advOpts.caseReason}`)
      }
      if (!this.$utils.empty(this.advOpts.caseState)) {
        tags.push(`辦理情形：${this.advOpts.caseState}`)
      }
      if (!this.$utils.empty(this.advOpts.casePreliminator)) {
        tags.push(`初審人員：${this.advOpts.casePreliminator}`)
      }
      if (!this.$utils.empty(this.advOpts.caseOperator)) {
        tags.push(`作業人員：${this.advOpts.caseOperator}`)
      }
      return tags
    },
    storeCaseCount () {
      return this.$store.getters['expiry/list_count']
    }
  },
  watch: {
    queriedJson (val) {
      this.advOpts = {
        ...{
          caseYear: '',
          caseYearOpts: [],
          caseWord: '',
          caseWordOpts: [],
          caseNum: '',
          caseReason: '',
          caseReasonOpts: [],
          caseState: '',
          caseStateOpts: [],
          casePreliminator: '',
          casePreliminatorOpts: [],
          caseOperator: '',
          caseOperatorOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.items.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.items.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.items.map(item => item.初審人員))].sort()
        this.advOpts.caseOperatorOpts = [...new Set(val.items.map(item => item.作業人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.raw.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.raw.map(item => item.RM02))].sort()
        this.$store.commit('expiry/list', this.queriedJson.items || [])
        this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
      }
    }
  },
  created () {

  },
  methods: {
    filter () {
      if (this.dataReady) {
        let pipelineItems = this.queriedJson.items
        const checkYear = !this.$utils.empty(this.advOpts.caseYear)
        if (checkYear) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(`${this.advOpts.caseYear}年`) !== null
          })
        }
        const checkWord = !this.$utils.empty(this.advOpts.caseWord)
        if (checkWord) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseWord) !== null
          })
        }
        const checkNum = !this.$utils.empty(this.advOpts.caseNum)
        if (checkNum) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseNum) !== null
          })
        }
        const checkReason = !this.$utils.empty(this.advOpts.caseReason)
        if (checkReason) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.登記原因 === this.advOpts.caseReason
          })
        }
        const checkState = !this.$utils.empty(this.advOpts.caseState)
        if (checkState) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.辦理情形 === this.advOpts.caseState
          })
        }
        const checkPreliminator = !this.$utils.empty(this.advOpts.casePreliminator)
        if (checkPreliminator) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.初審人員 === this.advOpts.casePreliminator
          })
        }
        const checkOperator = !this.$utils.empty(this.advOpts.caseOperator)
        if (checkOperator) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.作業人員 === this.advOpts.caseOperator
          })
        }
        this.$store.commit('expiry/list', pipelineItems)
        // this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
        this.$refs.searchPlus.hide()
        // this.notify(`篩選完成，找到 ${this.storeCaseCount} 筆案件。`)
      } else {
        this.warning('無資料無法篩選!')
      }
    },
    reset () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseYear: '',
          caseWord: '',
          caseNum: '',
          caseReason: '',
          caseState: '',
          casePreliminator: '',
          caseOperator: ''
        }
      }
      this.$store.commit('expiry/list', this.queriedJson.items || [])
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
