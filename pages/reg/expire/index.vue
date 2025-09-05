<template lang="pug">
div
  lah-header(ref="lahHeader")
    .d-flex.w-100
      .d-flex.mr-auto.align-items-center
        .my-auto.mr-1 登記案件
        b-badge.mr-1(pill, :variant="switchButtonVariant")
          span.ld-txt(v-if="filtering || isBusy") 處理中...
          span(v-else) {{ storeCaseCount }} 件
        b-form-radio-group.my-auto(
          v-model="isOverdueMode",
          :options="[{text: '即將逾期', value: false}, {text: '逾期', value: true}]",
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
        lah-help-modal(ref="help" size="lg" modal-title="登記逾期案件說明")
          h5.d-flex.align-items-center
            lah-fa-icon(icon="lightbulb" regular, variant="secondary")
            span.ml-2 功能說明
          ul
            li 本頁面顯示 #[strong 近15日內] 的「即將逾期」或「已逾期」登記案件。
            li #[strong 即將逾期]：案件的預定結案時間剩餘 #[strong 4小時] 以內。
            li #[strong 已逾期]：案件已超過預定結案時間。
            li 點擊 #[lah-fa-icon(icon="exclamation-circle")] #[strong 即將逾期] / #[lah-fa-icon(icon="exclamation-triangle")] #[strong 逾期] 按鈕可切換兩種模式。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="filter", variant="secondary")
            span.ml-2 進階篩選
          ul
            li 點擊 #[strong 進階篩選] 按鈕可針對目前已載入的資料進行二次過濾。
            li 所有下拉選單皆支援按住 #[kbd Ctrl] 鍵進行 #[strong 多重選取]。
            li 「收件號」欄位支援區間搜尋，例如輸入 #[strong 100-900] 可篩選出該範圍內的案件。
            li 已設定的篩選條件會以 #[b-tag(variant="primary" pill) 標籤] 的形式顯示在主畫面上，點擊標籤上的 "x" 即可快速移除該條件。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="cogs", variant="secondary")
            span.ml-2 其他功能
          ul
            li #[strong EXCEL匯出]：點擊 #[lah-fa-icon(icon="file-excel" regular variant="success")] 按鈕，可以將目前表格中 #[strong (已篩選)] 的資料匯出成 XLSX 檔。
            li #[strong 切換案件類型]：點擊 #[lah-button(icon="ruler-combined" size="sm" variant="outline-primary" no-icon-gutter)] 可切換至測量案件逾期頁面。
            li #[strong 舊版頁面]：若有需要，可點擊 #[lah-button(icon="history" size="sm" variant="outline-secondary" no-icon-gutter)] 前往舊版系統頁面。

      a.small.text-muted.mr-2.align-self-center(
        href="#",
        @click.prevent="reset",
        title="重新設定為預設篩選選項",
        style="font-size: 0.85rem;"
      ) 重設
      lah-button(
        icon="search-plus",
        size="lg",
        title="開啟進階篩選視窗",
        @click="$refs.searchPlus.show()",
        :disabled="!dataReady"
      ) 進階篩選
      lah-button-xlsx.mx-1(
        :jsons="xlsxList"
        :header="queryTitle"
      )
      lah-button.mr-1(
        icon="chart-column",
        size="lg",
        title="開啟統計圖表",
        :href="`${legacyUrl}/overdue_reg_cases.html?chart=1`",
        no-icon-gutter,
        link
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
  lah-transition(ref="tagsContainer", class="p-0 py-2")
    b-tags.border-0.mt-n4(
      v-if="advTags.length > 0",
      :value="advTags",
      @input="handleTagsChange",
      add-button-variant="white"
      add-button-text="",
      size="lg",
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

  lah-transition(appear): lah-expiry-b-table.dynamic-table-height(
    :busy="!committed || filtering",
    only-popup-detail,
    sticky-header
  )
  lah-transition.center.h3(v-if="queryCount === 0 && committed") 無資料👍

  b-modal(
    ref="searchPlus",
    hide-footer,
    size="lg"
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
        b-input(
          v-model="advOpts.caseNum",
          trim,
          placeholder="... 可輸入部分或區間 (如 100-900) ..."
        )

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

    .center.d-flex
      b-input-group.mr-1(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="作業人員"): b-form-select(
        v-model="advOpts.caseOperator",
        :options="advOpts.caseOperatorOpts",
        title="作業人員",
        multiple,
        :select-size="4"
      )

    lah-transition(class="my-3 p-0")
      b-tags.border-0(
        v-if="advTags.length > 0",
        :value="advTags",
        @input="handleTagsChange",
        add-button-variant="white"
        add-button-text="",
        size="lg",
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

    hr
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="reset",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ storeCaseCount }} 筆
      lah-fa-icon.ml-1(v-if="filtering", icon="sync-alt", action="spin", variant="danger",title="篩選中 ... ")
</template>

<script>
import expiryBase from '~/pages/reg/expire/expiry-base.js'
export default {
  // middleware: [ 'expireAuth' ],
  mixins: [expiryBase],
  data: () => ({
    filtering: false,
    tagColorMap: {
      年: 'secondary',
      字: 'primary',
      號: 'info',
      登記原因: 'success',
      辦理情形: 'warning',
      初審人員: 'danger',
      作業人員: 'dark'
    },
    advOpts: {
      caseYear: '',
      caseWord: [],
      caseNum: '',
      caseReason: [],
      caseReasonOpts: [],
      caseState: [],
      caseStateOpts: [],
      casePreliminator: [],
      casePreliminatorOpts: [],
      caseOperator: [],
      caseOperatorOpts: [],
      caseReceiveOffice: [],
      caseReceiveOfficeOpts: []
    }
  }),
  head: {
    title: '登記(即將/已)逾期案件-桃園市地政局'
  },
  computed: {
    icon () { return this.isOverdueMode ? 'exclamation-triangle' : 'exclamation-circle' },
    dataReady () { return this.queriedJson && this.queriedJson.items?.length > 0 },
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
      generateTags('作業人員', this.advOpts.caseOperator)
      generateTags('收件所別', this.advOpts.caseReceiveOffice)
      return tags
    },
    storeCaseCount () {
      return this.$store.getters['expiry/list_count']
    },
    currentList () {
      return this.$store.getters['expiry/list'] || []
    },
    xlsxList () {
      const modified = []
      this.currentList.forEach((element) => {
        let tmp = {
          ...element,
          // only keep name
          初審人員: element.初審人員.split(' ')[0]
        }
        if (this.isOverdueMode) {
          tmp = {
            ...tmp,
            // bureau wants to add this field
            逾期未辦結原因: ''
          }
        }
        modified.push(tmp)
      })
      return modified
    }
  },
  watch: {
    queriedJson (val) {
      // reset advOpts to default state but keep opts arrays for new values
      this.advOpts = {
        caseYear: '',
        caseWord: [],
        caseNum: '',
        caseReason: [],
        caseReasonOpts: [],
        caseState: [],
        caseStateOpts: [],
        casePreliminator: [],
        casePreliminatorOpts: [],
        caseOperator: [],
        caseOperatorOpts: [],
        caseReceiveOffice: [],
        caseReceiveOfficeOpts: []
      }

      if (val && val.items) {
        // dynamically generate options for select dropdowns
        this.advOpts.caseReasonOpts = [...new Set(val.items.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.items.map(item => item.辦理情形))].sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.items.map(item => item.初審人員))].sort().filter(item => item?.includes(this.site))
        this.advOpts.caseOperatorOpts = [...new Set(val.items.map(item => item.作業人員))].sort()
        this.advOpts.caseYearOpts = [...new Set(val.raw.map(item => item.RM01))].sort()
        this.advOpts.caseWordOpts = [...new Set(val.raw.map(item => item.RM02))].sort()
        this.advOpts.caseReceiveOfficeOpts = [...new Set(val.raw.map(item => item.RM02))].sort()

        this.$store.commit('expiry/list', this.queriedJson.items || [])
        this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})

        // Set default selections after options are populated
        this.setDefaultCaseWords()
      }
    },
    advOpts: {
      handler () {
        this.filtering = true
        this.filterDebounced()
      },
      deep: true
    }
  },
  created () {
    this.filterDebounced = this.$utils.debounce(this.filter, 400)
  },
  methods: {
    filterDebounced () { /** placeholder for debounced filter method */ },
    getTagVariant (tag) {
      const [prefix] = tag.split('：')
      return this.tagColorMap[prefix.trim()] || 'secondary'
    },
    handleTagsChange (tags) {
      // This event is fired when the v-model changes (e.g., a tag is removed).
      // We need to find which tag was removed.
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
      // Based on the prefix, update the corresponding advOpts property
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
        case '作業人員':
          this.advOpts.caseOperator = this.advOpts.caseOperator.filter(v => v !== trimmedValue)
          break
        case '收件所別':
          this.advOpts.caseReceiveOffice = this.advOpts.caseReceiveOffice.filter(v => v !== trimmedValue)
          break
      }
    },
    setDefaultCaseWords () {
      if (!this.dataReady) {
        this.advOpts.caseWord = []
        return
      }
      const defaultCaseWords = new Set()
      const allItems = this.queriedJson?.items || []

      allItems.forEach((item) => {
        const localCaseMatch = item.收件字號.match(/\((.+)\)/)
        if (localCaseMatch && localCaseMatch[1]) {
          const extractedWord = localCaseMatch[1]
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
    filter () {
      if (this.dataReady) {
        let pipelineItems = [...this.queriedJson?.items] || []

        // Filter by case word
        const checkWord = this.advOpts.caseWord.length > 0
        if (checkWord) {
          pipelineItems = pipelineItems.filter((item) => {
            const localCaseMatch = item.收件字號.match(/\((.+)\)/)
            if (localCaseMatch && localCaseMatch[1]) {
              const extractedWord = localCaseMatch[1]
              return this.advOpts.caseWord.includes(extractedWord)
            }
            return false
          })
        }

        // Filter by case number
        const checkNum = !this.$utils.empty(this.advOpts.caseNum)
        if (checkNum) {
          const query = this.advOpts.caseNum.trim()
          const rangeMatch = query.match(/^(\d+)\s*[-~]\s*(\d+)$/)

          if (rangeMatch) {
            const startNum = parseInt(rangeMatch[1], 10)
            const endNum = parseInt(rangeMatch[2], 10)
            this.$utils.warn(startNum, endNum)
            if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
              pipelineItems = pipelineItems.filter((item) => {
                const regex1 = /第\s*(\d+)\s*號/
                const match1 = item.收件字號.match(regex1)
                const RM03 = match1 ? match1[1] : null
                if (RM03) {
                  return !isNaN(RM03) && RM03 >= startNum && RM03 <= endNum
                }
                return false
              })
            }
          } else {
            pipelineItems = pipelineItems.filter(item => item.RM03?.includes(query))
          }
        }

        // Filter by case year
        const checkYear = !this.$utils.empty(this.advOpts.caseYear)
        if (checkYear) {
          pipelineItems = pipelineItems.filter(item => item.收件字號.startsWith(`${this.advOpts.caseYear}年`))
        }

        // Filter by case reason
        const checkReason = this.advOpts.caseReason.length > 0
        if (checkReason) {
          pipelineItems = pipelineItems.filter(item => this.advOpts.caseReason.includes(item.登記原因))
        }

        // Filter by case state
        const checkState = this.advOpts.caseState.length > 0
        if (checkState) {
          pipelineItems = pipelineItems.filter(item => this.advOpts.caseState.includes(item.辦理情形))
        }

        // Filter by preliminator
        const checkPreliminator = this.advOpts.casePreliminator.length > 0
        if (checkPreliminator) {
          pipelineItems = pipelineItems.filter(item => this.advOpts.casePreliminator.includes(item.初審人員))
        }

        // Filter by operator
        const checkOperator = this.advOpts.caseOperator.length > 0
        if (checkOperator) {
          pipelineItems = pipelineItems.filter(item => this.advOpts.caseOperator.includes(item.作業人員))
        }

        this.$store.commit('expiry/list', pipelineItems)
      } else {
        this.$utils.warn('無資料無法篩選!')
      }
      this.filtering = false
    },
    reset () {
      this.advOpts = {
        ...this.advOpts,
        caseYear: '',
        caseWord: [],
        caseNum: '',
        caseReason: [],
        caseState: [],
        casePreliminator: [],
        caseOperator: [],
        caseReceiveOffice: []
      }
      // re-apply the default selections
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
.dynamic-table-height::v-deep .b-table-sticky-header {
  /* 100vh is the full viewport height.
     Subtracting a fixed value for the header, tags, and padding.
     This value might need fine-tuning.
   */
  max-height: calc(100vh - 165px) !important;
}
</style>
