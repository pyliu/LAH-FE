<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 辦畢通知控管
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 資料庫搜尋說明
          ul
            li 搜尋近#[strong.text-primary 3個月]內「已結案未歸檔」登記案件的資料。(區間過大造成查詢失敗，需於伺服器#[strong.text-danger 增加 PHP memory_limit ]設定)
            li 預設皆需要辦畢通知申請人，輸入「公文文號」即代表完成。
          hr
          h5 請參照下列步驟搜尋
          ol
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            li 點擊 #[lah-fa-icon(icon="sync" variant="muted") 重新搜尋]

      .d-flex.small
        //- lah-button.mr-1(
        //-   ref="search"
        //-   icon="search"
        //-   size="lg"
        //-   title="搜尋"
        //-   :disabled="isBusy"
        //-   @click="$fetch"
        //-   no-icon-gutter
        //- )
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
    tag-variant="info",
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

  lah-transition: b-table.text-center.align-middle(
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
      .text-left: lah-fa-icon(
        prefix="fas"
        icon="circle"
        :variant="item.燈號"
        v-b-tooltip.hover.left
      ) {{ lightDesc(item.燈號) }}
    template(#cell(預定結案日期)="{ item }"): .text-nowrap {{ item.預定結案日期.split(' ')[0] }}
    template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
    template(#cell(辦理情形)="{ item }"): .text-nowrap {{ item.RM30 }}:{{ item.辦理情形 }}
    template(#cell(customize)="{ item }"): lah-reg-case-notify(:case-id="`${item.ID}`" :parent-data="item")

  b-modal(
    ref="caseDetail"
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
      b-input-group.mr-1(prepend="初審人員"): b-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員"
      )
      b-input-group(prepend="逾期狀態"): b-select(
        v-model="advOpts.caseLight",
        :options="advOpts.caseLightOpts",
        title="逾期狀態"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="代理統編"): b-select(
        v-model="advOpts.proxyId",
        :options="advOpts.proxyIdOpts",
        title="代理人統編"
      )
      b-input-group(prepend="代理姓名"): b-select(
        v-model="advOpts.proxyName",
        :options="advOpts.proxyNameOpts",
        title="代理人姓名"
      )

    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
import _ from 'lodash'
import dynamicHeight from '~/mixins/dynamic-height-mixin'
export default {
  mixins: [dynamicHeight],
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
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
        label: '逾期燈號',
        sortable: true
      },
      {
        key: 'customize',
        label: '辦畢通知',
        sortable: false
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
        key: '代理人姓名',
        sortable: true
      },
      {
        key: '代理人住址',
        sortable: true
      },
      {
        key: '代理人電話',
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
      }
    ],
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
      casePreliminatorOpts: [],
      caseLight: '',
      caseLightOpts: [
        { text: '', value: '' },
        { text: '🟢 正常', value: 'success' },
        { text: '🟡 快到期', value: 'warning' },
        { text: '🔴 已逾期', value: 'danger' }
      ],
      proxyName: '',
      proxyNameOpts: [],
      proxyId: '',
      proxyIdOpts: []
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
        const remainS = data.cache_remaining_time
        const remainMs = remainS * 1000
        if (remainMs && remainMs > 0) {
          this.setCache(this.cacheKey, data, remainMs)
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remainMs)
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
    title: '辦畢通知控管-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    filterDataCount () { return this.filteredData.length },
    cacheKey () { return 'query_reg_not_done_case' },
    foundText () { return `找到 ${this.filterDataCount} 筆「已結案未歸檔」案件資料` },
    filteredData () {
      if (this.advTags.length === 0) {
        return this.rows
      }

      // REFACTORED: Use a configuration array for cleaner, more maintainable filtering logic.
      const filters = [
        { key: 'caseNum', condition: (item, val) => item.收件字號.includes(val) },
        { key: 'caseWord', condition: (item, val) => item.收件字號.includes(val) },
        { key: 'caseYear', condition: (item, val) => item.收件字號.includes(`${val}年`) },
        { key: 'caseReason', condition: (item, val) => item.登記原因 === val },
        { key: 'caseState', condition: (item, val) => item.辦理情形 === val },
        { key: 'casePreliminator', condition: (item, val) => item.初審人員 === val },
        { key: 'caseLight', condition: (item, val) => item.燈號 === val },
        { key: 'proxyName', condition: (item, val) => item.代理人姓名 === val },
        { key: 'proxyId', condition: (item, val) => item.代理人統編 === val }
      ]

      // Start with a shallow copy of the original data array
      let pipelineItems = [...this.rows]

      // Sequentially apply each active filter
      for (const filter of filters) {
        const value = this.advOpts[filter.key]
        if (!this.$utils.empty(value)) {
          pipelineItems = pipelineItems.filter(item => filter.condition(item, value))
        }
      }

      return pipelineItems
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
      if (!this.$utils.empty(this.advOpts.caseLight)) {
        tags.push(`逾期燈號狀態：${this.advOpts.caseLight}`)
      }
      if (!this.$utils.empty(this.advOpts.proxyName)) {
        tags.push(`代理人姓名：${this.advOpts.proxyName}`)
      }
      if (!this.$utils.empty(this.advOpts.proxyId)) {
        tags.push(`代理人統編：${this.advOpts.proxyId}`)
      }
      return tags
    }
  },
  fetchOnServer: false,
  watch: {
    rows (val) {
      // REFACTORED: Use lodash for cleaner and more robust option generation.
      // Reset advOpts before populating new options
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
          caseLight: '',
          caseLightOpts: this.advOpts.caseLightOpts, // Keep static options
          proxyName: '',
          proxyNameOpts: [],
          proxyId: '',
          proxyIdOpts: []
        }
      }
      if (!_.isEmpty(val)) {
        // A helper function to generate sorted, unique options for dropdowns
        const genOptions = (key, useCompact = false) => {
          let opts = _.map(val, key)
          if (useCompact) {
            opts = _.compact(opts)
          }
          opts = _.uniq(opts)
          opts = _.sortBy(opts)
          // Prepend an empty value for the 'all' selection
          return ['', ...opts]
        }
        this.advOpts.caseReasonOpts = genOptions('登記原因')
        this.advOpts.caseStateOpts = genOptions('辦理情形')
        this.advOpts.casePreliminatorOpts = genOptions('初審人員', true)
        this.advOpts.caseYearOpts = genOptions('RM01')
        this.advOpts.caseWordOpts = genOptions('RM02')
        this.advOpts.proxyNameOpts = genOptions('代理人姓名', true)
        this.advOpts.proxyIdOpts = genOptions('代理人統編', true)
      }
    }
  },
  created () {
    this.maxHeightOffset = 145
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
      this.$refs.caseDetail.show()
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
          caseLight: '',
          proxyName: '',
          proxyId: ''
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
