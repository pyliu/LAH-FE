<template lang="pug">
div
  lah-header
    .d-flex.w-100
      .d-flex.mr-auto.align-items-center
        .my-auto.mr-1 登記案件
        b-badge.mr-1(pill, :variant="switchButtonVariant") 
          span.ld-txt(v-if="filtering") 處理中...
          span(v-else) {{ storeCaseCount }} 件
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
          li 切換為#[nuxt-link(to="/expire/sur") 測量案件]
          li #[a(:href="`${this.legacyUrl}/overdue_reg_cases.html`" target="_blank" rel="noreferrer noopener") 切換成舊版本模式]

      lah-button(
        icon="search-plus",
        size="lg",
        title="開啟進階搜尋視窗",
        @click="$refs.searchPlus.show()",
        :disabled="!dataReady"
      ) 進階搜尋
      lah-button-xlsx.mx-1(
        :jsons="currentList"
        :header="queryTitle"
      )
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
  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="info",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
  )
  lah-transition(appear): lah-expiry-b-table(:busy="!committed || filtering", only-popup-detail)
  lah-transition.center.h3(v-if="queryCount === 0 && committed") 無資料👍

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex
      //- b-input-group(prepend="年")
      //-   b-select(
      //-     v-model="advOpts.caseYear",
      //-     :options="advOpts.caseYearOpts",
      //-     title="收件年"
      //-   )
      b-input-group.mr-1(prepend="　收件字")
        //- b-input.mx-1(v-model="advOpts.caseYear", placeholder="... 收件年 ...", trim)
        b-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字"
        )
      b-input-group(prepend="　收件號")
        //- b-input.mr-1(v-model="advOpts.caseWord", placeholder="... 收件字 ...", trim)
        b-input(v-model="advOpts.caseNum", trim)

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因"
      )
      b-input-group(prepend="辦理情形"): b-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形"
      )

    .center.d-flex
      b-input-group.mr-1(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group(prepend="作業人員"): b-select(
        v-model="advOpts.caseOperator",
        :options="advOpts.caseOperatorOpts",
        title="作業人員"
      )

    //- .center.d-flex.my-1
    //-   b-input-group.mr-1(prepend="收件所別"): b-select(
    //-     v-model="advOpts.caseReceiveOffice",
    //-     :options="advOpts.caseReceiveOfficeOpts",
    //-     title="收件所別"
    //-   )
    //-   b-input-group

    .center.d-flex.my-1
      lah-button.mr-1(
        v-if="false",
        icon="check-circle",
        @click="filter",
        variant="outline-primary"
      ) 確定
      lah-button(
        icon="recycle",
        @click="reset",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ storeCaseCount }} 筆
      lah-fa-icon.ml-1(v-if="filtering", icon="sync-alt", action="spin", variant="danger",title="篩選中 ... ")
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  // middleware: [ 'expireAuth' ],
  mixins: [expiryBase],
  data: () => ({
    filtering: false,
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
      caseOperatorOpts: [],
      caseReceiveOffice: '',
      caseReceiveOfficeOpts: []
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
      if (!this.$utils.empty(this.advOpts.caseReceiveOffice)) {
        tags.push(`收件所別：${this.advOpts.caseReceiveOffice}`)
      }
      return tags
    },
    storeCaseCount () {
      return this.$store.getters['expiry/list_count']
    },
    currentList () {
      return this.$store.getters['expiry/list'] || []
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
          caseOperatorOpts: [],
          caseReceiveOffice: '',
          caseReceiveOfficeOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.items.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.items.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.items.map(item => item.初審人員))].sort()
        this.advOpts.caseOperatorOpts = [...new Set(val.items.map(item => item.作業人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.raw.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.raw.map(item => item.RM02))].sort()
        this.advOpts.caseReceiveOfficeOpts = [...new Set(val.raw.map(item => item.RM02))].sort()

        this.advOpts.caseReasonOpts.unshift('')
        this.advOpts.caseStateOpts.unshift('')
        this.advOpts.casePreliminatorOpts.unshift('')
        this.advOpts.caseOperatorOpts.unshift('')
        this.advOpts.caseYearOpts.unshift('')
        this.advOpts.caseReceiveOfficeOpts.unshift('')

        this.$store.commit('expiry/list', this.queriedJson.items || [])
        this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})

        // set default to own case option
        this.advOpts.caseWordOpts.unshift('本所關注案件')
        this.advOpts.caseWordOpts.unshift('')
        this.advOpts.caseWord = '本所關注案件'
      }
    },
    advTags (dontcare) {
      this.filtering = true
      this.filterDebounced()
    }
  },
  created () {
    this.filterDebounced = this.$utils.debounce(this.filter, 1000)
  },
  methods: {
    filterDebounced () { /** placeholder for debounced filter method */ },
    filter () {
      if (this.dataReady) {
        let pipelineItems = this.queriedJson.items
        const checkNum = !this.$utils.empty(this.advOpts.caseNum)
        if (checkNum) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseNum) !== null
          })
        }
        const checkWord = !this.$utils.empty(this.advOpts.caseWord)
        if (checkWord) {
          if (this.advOpts.caseWord === '本所關注案件') {
            const alphabet = this.site[1]
            const number = alphabet.charCodeAt(0) - 64
            pipelineItems = pipelineItems.filter((item) => {
              const extractedWord = item.收件字號.match(/\(.+\)/gm)[0].replace(/[()]/gm, '')
              if (extractedWord.startsWith(this.site) && !extractedWord.endsWith('1')) {
                return true
              } else if (extractedWord.endsWith(`${alphabet}1`)) {
                return true
              } else if (extractedWord.startsWith(`H${number}`)) {
                return true
              }
              return false
            })
          } else {
            pipelineItems = pipelineItems.filter((item) => {
              return item.收件字號.match(this.advOpts.caseWord) !== null
            })
          }
        }
        const checkYear = !this.$utils.empty(this.advOpts.caseYear)
        if (checkYear) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(`${this.advOpts.caseYear}年`) !== null
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
        // this.$refs.searchPlus.hide()
        // this.notify(`篩選完成，找到 ${this.storeCaseCount} 筆案件。`)
      } else {
        this.warning('無資料無法篩選!')
      }
      this.filtering = false
    },
    reset () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseYear: '',
          caseWord: '本所關注案件',
          caseNum: '',
          caseReason: '',
          caseState: '',
          casePreliminator: '',
          caseOperator: '',
          caseReceiveOffice: ''
        }
      }
      this.$store.commit('expiry/list', this.queriedJson.items || [])
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
