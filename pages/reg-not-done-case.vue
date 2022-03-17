<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 登記案件辦畢通知查詢
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 資料庫搜尋說明
          ul
            li 搜尋「本所」未結案案件的資料
            li 「初審」、「複審」及「課長」選項全部勾選後即表示該案件辦畢時需通知申請人
          hr
          h5 請參照下列步驟搜尋
          ol
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            li 點擊 #[lah-fa-icon(icon="sync" variant="muted") 重新搜尋]

      .d-flex.small
        lah-button.mr-1(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          :disabled="isBusy"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階搜尋
        lah-countdown-button(
          ref="countdown"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="primary",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
  )

  lah-pagination(
    v-model="pagination"
    :total-rows="filterDataCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center.align-middle(
      v-if="committed"
      id="land-ref-table"
      ref="table"
      caption-top
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="filteredData"
      :responsive="'lg'"
      :striped="true"
      :hover="true"
      :bordered="true"
      :borderless="false"
      :outlined="false"
      :small="true"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      :no-border-collapse="true"
      :head-variant="'dark'"
      :fields="fields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...
      template(v-slot:cell(#)="{ item, index, rowSelected }")
        template(v-if="rowSelected")
          span(aria-hidden="true") &check;
          span.sr-only 勾選
        template(v-else)
          span(aria-hidden="true") &nbsp;
          span.sr-only 無勾選
        span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
      template(#cell(收件字號)="{ item }"): .align-middle: b-link(@click="popup(item)").
        {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      template(v-slot:cell(燈號)="{ item }")
        lah-fa-icon(
          prefix="fas"
          icon="circle"
          :variant="item.燈號"
          :title="lightDesc(item.燈號)"
          v-b-tooltip.hover.left
        )
      template(#cell(預定結案日期)="{ item }"): .text-nowrap {{ item.預定結案日期.split(' ')[0] }}
      template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
      template(#cell(辦理情形)="{ item }"): .text-nowrap {{ item.RM30 }}:{{ item.辦理情形 }}
      template(#cell(lah-reg-case-auth-checks)="{ item }"): lah-reg-case-auth-checks(:case-id="`${item.RM01}${item.RM02}${item.RM03}`" :parent-data="item")

  b-modal(
    :id="modalId"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedData.ID) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(@ready="modalLoading = !$event.detail" :parent-data="clickedData")
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
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號 ...", trim)

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

    .center.d-flex.my-1
      b-input-group(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
export default {
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalId: 'this should be an uuid',
    modalLoading: true,
    clickedData: undefined,
    rows: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    fields: [
      '#',
      {
        key: '燈號',
        sortable: true
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '預定結案日期',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '複審人員',
        sortable: true
      },
      {
        key: 'lah-reg-case-auth-checks',
        label: '辦畢通知審核設定',
        sortable: false
      }
    ],
    maxHeight: 600,
    advOpts: {
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
      casePreliminatorOpts: []
    }
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      /**
       * Can not use FE cache for this page since I manipulate the bakedData at API side
       */
      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_not_done_case',
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
        const remain_s = data.cache_remaining_time
        const remain_ms = remain_s * 1000
        if (remain_ms && remain_ms > 0) {
          this.setCache(this.cacheKey, data, remain_ms)
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remain_ms)
            this.$refs.countdown.startCountdown()
          }
        }
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.forceReload = false
        this.committed = true
      })
    }
  },
  head: {
    title: '登記案件辦畢通知查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    filterDataCount () { return this.filteredData.length },
    cacheKey () { return 'query_reg_not_done_case' },
    foundText () { return `找到 ${this.filterDataCount} 筆本所「未結案」案件資料` },
    filteredData () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.rows
        if (!this.$utils.empty(this.advOpts.caseNum)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseNum) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseWord)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(this.advOpts.caseWord) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseYear)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件字號.match(`${this.advOpts.caseYear}年`) !== null
          })
        }
        if (!this.$utils.empty(this.advOpts.caseReason)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.登記原因 === this.advOpts.caseReason
          })
        }
        if (!this.$utils.empty(this.advOpts.caseState)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.辦理情形 === this.advOpts.caseState
          })
        }
        if (!this.$utils.empty(this.advOpts.casePreliminator)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.初審人員 === this.advOpts.casePreliminator
          })
        }
        return pipelineItems
      }
      return this.rows
    },
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
      return tags
    }
  },
  fetchOnServer: false,
  watch: {
    rows (val) {
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
          casePreliminatorOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].sort()

        this.advOpts.caseReasonOpts.unshift('')
        this.advOpts.caseStateOpts.unshift('')
        this.advOpts.casePreliminatorOpts.unshift('')
        this.advOpts.caseYearOpts.unshift('')
        this.advOpts.caseWordOpts.unshift('')
      }
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
      this.clickedData = data
      this.showModalById(this.modalId)
    },
    lightDesc (light) {
      if (light === 'danger') {
        return '已逾期'
      } else if (light === 'warning') {
        return '今日到期'
      }
      return '正常'
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseYear: '',
          caseWord: '',
          caseNum: '',
          caseReason: '',
          caseState: '',
          casePreliminator: '',
          caseFixDate: '',
          caseFixDeadline: ''
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
