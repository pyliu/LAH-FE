<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 補正期滿案件查詢
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 資料庫搜尋說明
          ul
            li 搜尋補正、補正初核案件的資料
            li 補正期限為送達日後15個日曆天
            li 設定「通知送達日期」後將自動計算「調整到期日期」及「可駁回日期」
            li 以顏色變化表示到期與否
          hr
          h5 請參照下列步驟搜尋
          ol
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            li 點擊 #[lah-fa-icon(icon="sync" variant="muted") 重新搜尋]

      .d-flex.small
        a.small.text-muted.mr-2.align-self-center(
          href="#",
          @click.prevent="resetAdvSearch",
          title="重新設定為預設篩選選項",
          style="font-size: 0.85rem;"
        ) 重設
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階篩選
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

  lah-transition: b-tags.border-0.mt-n4.p-0.py-2(
    v-if="advTags.length > 0",
    :value="advTags",
    @input="handleTagsChange",
    add-button-variant="white",
    add-button-text="",
    tag-pills,
    no-outer-focus,
    no-add-on-enter
  )
    template(#default="{ tags, removeTag }")
      b-tag(
        v-for="tag in tags",
        :key="tag",
        :variant="getTagVariant(tag)",
        :title="tag",
        @remove="removeTag(tag)"
      ) {{ tag }}

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
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
      :items="filterRows"
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
      template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
      template(#cell(lah-reg-case-fix-date)="{ item }")
        lah-reg-case-fix-date(
          :case-id="`${item.RM01}${item.RM02}${item.RM03}`",
          :parent-data="item"
        )
      template(#cell(辦理情形)="{ item }"): .text-nowrap {{ item.RM30 }}:{{ item.辦理情形 }}
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
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center
        span 進階篩選
        small.text-muted.ml-2 按住 Ctrl 鍵進行選擇/取消
    .center.d-flex
      b-input-group.mr-1(prepend="　收件字")
        b-form-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字",
          multiple,
          :select-size="4"
        )
      b-input-group.input-group-height-hack(prepend="　收件號")
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號 ...", trim)
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-form-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="辦理情形"): b-form-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="通知補正"): b-form-select(
        v-model="advOpts.caseFixDate",
        :options="advOpts.caseFixDateOpts",
        title="通知補正日期",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )
    hr
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ queryCount }} 筆
</template>

<script>
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
        key: '收件字號',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '通知補正日期',
        label: '通知補正',
        sortable: true
      },
      {
        key: 'lah-reg-case-fix-date',
        label: '送達通知設定',
        sortable: false,
        thStyle: { width: '300px' }
      }
    ],
    tagColorMap: {
      年: 'secondary',
      字: 'primary',
      號: 'info',
      登記原因: 'success',
      辦理情形: 'warning',
      初審人員: 'danger',
      通知補正: 'dark'
    },
    advOpts: {
      caseYear: '',
      caseYearOpts: [],
      caseWord: [],
      caseWordOpts: [],
      caseNum: '',
      caseReason: [],
      caseReasonOpts: [],
      caseState: [],
      caseStateOpts: [],
      casePreliminator: [],
      casePreliminatorOpts: [],
      caseFixDate: [],
      caseFixDateOpts: [],
      caseFixDeadline: [],
      caseFixDeadlineOpts: []
    }
  }),
  fetchOnServer: false,
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中 ... 請稍後')
    } else {
      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_fix_case',
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
    title: '補正期滿案件查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows?.length > 0 },
    queryCount () { return this.filterRows?.length || 0 },
    cacheKey () { return 'query_reg_fix_case' },
    foundText () { return `找到 ${this.queryCount} 筆「補正」、「補正初核」案件資料` },
    filterRows () {
      if (this.advTags.length === 0) {
        return this.rows
      }
      let pipelineItems = [...this.rows]
      const checkNum = !this.$utils.empty(this.advOpts.caseNum)
      if (checkNum) {
        pipelineItems = pipelineItems.filter(item => item.收件字號.includes(this.advOpts.caseNum))
      }
      const checkWord = this.advOpts.caseWord.length > 0
      if (checkWord) {
        pipelineItems = pipelineItems.filter((item) => {
          return this.advOpts.caseWord.includes(item.RM02)
        })
      }
      const checkYear = !this.$utils.empty(this.advOpts.caseYear)
      if (checkYear) {
        pipelineItems = pipelineItems.filter(item => item.收件字號.startsWith(`${this.advOpts.caseYear}年`))
      }
      const checkReason = this.advOpts.caseReason.length > 0
      if (checkReason) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseReason.includes(item.登記原因))
      }
      const checkState = this.advOpts.caseState.length > 0
      if (checkState) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseState.includes(item.辦理情形))
      }
      const checkPreliminator = this.advOpts.casePreliminator.length > 0
      if (checkPreliminator) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.casePreliminator.includes(item.初審人員))
      }
      const checkFixDate = this.advOpts.caseFixDate.length > 0
      if (checkFixDate) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseFixDate.includes(item.通知補正日期))
      }
      const checkFixDeadline = this.advOpts.caseFixDeadline.length > 0
      if (checkFixDeadline) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseFixDeadline.includes(item.補正期滿日期))
      }
      return pipelineItems
    },
    advTags () {
      const tags = []
      const generateTags = (prefix, values) => {
        if (Array.isArray(values) && values.length > 0) {
          values.forEach(val => tags.push(`${prefix}：${val}`))
        } else if (!Array.isArray(values) && !this.$utils.empty(values)) {
          tags.push(`${prefix}：${values}`)
        }
      }
      generateTags('年', this.advOpts.caseYear)
      generateTags('字', this.advOpts.caseWord)
      generateTags('號', this.advOpts.caseNum)
      generateTags('登記原因', this.advOpts.caseReason)
      generateTags('辦理情形', this.advOpts.caseState)
      generateTags('初審人員', this.advOpts.casePreliminator)
      generateTags('通知補正', this.advOpts.caseFixDate)
      generateTags('補正期滿', this.advOpts.caseFixDeadline)
      return tags
    }
  },
  watch: {
    rows (val) {
      this.advOpts = {
        ...{
          caseYear: '',
          caseYearOpts: [],
          caseWord: [],
          caseWordOpts: [],
          caseNum: '',
          caseReason: [],
          caseReasonOpts: [],
          caseState: [],
          caseStateOpts: [],
          casePreliminator: [],
          casePreliminatorOpts: [],
          caseFixDate: [],
          caseFixDateOpts: [],
          caseFixDeadline: [],
          caseFixDeadlineOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseYearOpts = [...new Set(val.map(item => item.RM01))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseFixDateOpts = [...new Set(val.map(item => item.通知補正日期))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseFixDeadlineOpts = [...new Set(val.map(item => item.補正期滿日期))].filter(item => !this.$utils.empty(item)).sort()
        this.setDefaultCaseWords()
      }
    }
  },
  created () {
    this.maxHeightOffset = 175
  },
  methods: {
    getTagVariant (tag) {
      const [prefix] = tag.split('：')
      return this.tagColorMap[prefix.trim()] || 'secondary'
    },
    handleTagsChange (tags) {
      if (tags.length < this.advTags.length) {
        const removedTag = this.advTags.find(t => !tags.includes(t))
        if (removedTag) {
          this.removeAdvTag(removedTag)
        }
      }
    },
    removeAdvTag (tag) {
      const [prefix, value] = tag.split('：')
      const trimmedValue = value?.trim()
      if (!prefix || !trimmedValue) {
        return
      }
      switch (prefix.trim()) {
        case '年':
          this.advOpts.caseYear = ''
          break
        case '字':
          this.advOpts.caseWord = this.advOpts.caseWord.filter(v => v !== trimmedValue)
          break
        case '號':
          this.advOpts.caseNum = ''
          break
        case '登記原因':
          this.advOpts.caseReason = this.advOpts.caseReason.filter(v => v !== trimmedValue)
          break
        case '辦理情形':
          this.advOpts.caseState = this.advOpts.caseState.filter(v => v !== trimmedValue)
          break
        case '初審人員':
          this.advOpts.casePreliminator = this.advOpts.casePreliminator.filter(v => v !== trimmedValue)
          break
        case '通知補正':
          this.advOpts.caseFixDate = this.advOpts.caseFixDate.filter(v => v !== trimmedValue)
          break
        case '補正期滿':
          this.advOpts.caseFixDeadline = this.advOpts.caseFixDeadline.filter(v => v !== trimmedValue)
          break
      }
    },
    setDefaultCaseWords () {
      if (!this.dataReady) {
        this.advOpts.caseWord = []
        return
      }
      const defaultCaseWords = new Set()
      const allItems = this.rows || []
      allItems.forEach((item) => {
        const extractedWord = item.RM02
        if (extractedWord) {
          const alphabet = this.site[1]
          const number = alphabet.charCodeAt(0) - 64
          const localCaseRegex = new RegExp(`${this.site}[0-9]{1,2}`, 'gim')
          if (localCaseRegex.test(extractedWord) || extractedWord.endsWith(`${alphabet}1`) || extractedWord.startsWith(`H${number}`)) {
            defaultCaseWords.add(extractedWord)
          }
        }
      })
      this.advOpts.caseWord = [...defaultCaseWords]
    },
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
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        caseYear: '',
        caseWord: [],
        caseNum: '',
        caseReason: [],
        caseState: [],
        casePreliminator: [],
        caseFixDate: [],
        caseFixDeadline: []
      }
      this.setDefaultCaseWords()
    }
  }
}
</script>

<style lang="scss" scoped>
.input-group-height-hack {
  align-self: stretch;
}
.input-group-height-hack::v-deep .form-control {
  height: 100%;
}
::v-deep .b-form-tag {
  font-size: 85%;
}
</style>
