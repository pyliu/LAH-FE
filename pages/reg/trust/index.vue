<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 信託案件檢索
        lah-button(
          icon="info"
          action="bounce"
          variant="outline-success"
          no-border
          no-icon-gutter
          @click="showModalById('help-modal')"
          title="說明"
        )
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋
          ol
            li 選擇查詢區間
            li 選擇查詢類別
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
          hr
          h5 支援以下三種查詢類別
          ol
            li 信託註記查詢-土地
            li 信託註記查詢-建物
            li 登記收件原因為 CU, CW, CV, CX, CY 之案件
          hr
          lah-fa-icon(icon="caret-square-right" regular variant="primary"): b-link(to="/reg/trust/HF") 切換為八德版本
      .d-flex.small
        b-link.my-auto.mr-1.s-85.text-nowrap(
          v-if="advTags.length > 0"
          @click="resetAdvOpts"
          title="清除所有篩選條件"
        ) 重設
        lah-button.mr-1(
          v-if="showAdvSearch",
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="disableAdvSearch",
          no-icon-gutter
        ) 進階篩選
        lah-datepicker.mr-1(v-model="dateRange")

        b-input-group.text-nowrap.mr-1: b-form-select.h-100(
          ref="type"
          v-model="qryType"
          :options="qryTypes"
          :disabled="!validDateRange"
          @change="$fetch"
        ): template(v-slot:first): b-form-select-option(:value="null" disabled) -- 請選擇案件類型 --
        lah-button(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          :disabled="isBusy || $utils.empty(qryType) || !validDateRange"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button-xlsx.mx-1(
          :jsons="xlsxData"
          header="信託案件"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          variant="outline-secondary"
          badge-variant="secondary"
          title="強制重新搜尋"
          no-badge
          :milliseconds="0"
          :disabled="isBusy || $utils.empty(qryType) || !validDateRange"
          :busy="isBusy"
          @end="reload"
          @click="reload"
        )

  lah-transition
    .d-flex.mt-n3(v-if="advTags.length > 0")
      .mr-auto.tags-container(
        ref="tagsContainer"
        :class="{ 'tags-collapsed': !tagsExpanded }"
      )
        b-tag.mr-1.my-1(
          v-for="(tag, index) in advTags"
          :key="`${tag.key}-${tag.value}-${index}`"
          :variant="tag.variant"
          @remove="removeAdvTag(tag)"
          pill
          removable
        ) {{ tag.text }}
      lah-button(
        v-if="showTagsToggle"
        :icon="tagsExpanded ? 'angle-double-up' : 'angle-double-down'"
        variant="link"
        size="sm"
        @click="tagsExpanded = !tagsExpanded"
        :title="tagsExpanded ? '收合篩選條件' : '顯示所有篩選條件'"
        no-icon-gutter
      )

  lah-pagination(
    v-if="!(qryType === 'reg_reason' && committed)"
    v-model="pagination"
    :total-rows="queryCount"
    :caption="caption"
  )

  lah-transition(appear)
    lah-reg-b-table(
      v-if="qryType === 'reg_reason' && committed"
      ref="regTbl"
      type="md"
      :baked-data="rows"
      no-caption
    )
    b-table(
      v-else-if="committed"
      id="trust-table"
      ref="table"
      no-caption
      caption-top
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="filteredRows"
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
      :fields="obliterateFields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...
      template(v-slot:cell(序號)="data") {{ data.index + 1 }}
      template(#cell(GG48)="{ item }"): .text-nowrap {{ item.GG48 }}:{{ item.GG48_CHT }}
      template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
      template(#cell(GG49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
      template(#cell(RM123)="{ item }"): .text-nowrap: b-link(@click="popup(item)").
        {{ item.RM123 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      template(#cell(GG30_1)="{ item }"): div.
        【{{ item.GG30_1 }}】{{ item.GG30_1_CHT }} {{ item.GG30_2 }}
      template(#cell(GS_TYPE)="{ item }"): div.
         {{ item.GS_TYPE }}:{{ GS_TYPEText(item.GS_TYPE) }}
    h3.text-center(v-else): lah-fa-icon(action="breath" variant="primary") 請點選查詢按鈕

  b-modal(
    :id="modalId"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedId) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:case-id="clickedId" @ready="modalLoading = !$event.detail")

  b-modal(
    ref="searchPlus",
    title="進階篩選",
    size="md",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="收件號"): b-input(
        v-model="advOpts.caseNum",
        placeholder="... 部分或區間如 100 - 900 ...",
        trim
      )
      b-input-group(prepend="登記日期"): b-select(
        v-model="advOpts.date",
        :options="advOpts.dateOpts",
        title="登記日期"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="異動類別"): b-select(
        v-model="advOpts.class",
        :options="advOpts.classOpts",
        title="異動類別"
      )
      b-input-group(prepend="登記原因"): b-select(
        v-model="advOpts.reason",
        :options="advOpts.reasonOpts",
        title="登記原因"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="地/建號"): b-select(
        v-model="advOpts.number",
        :options="advOpts.numberOpts",
        title="地或建號"
      )
      b-input-group(prepend="段小段"): b-select(
        v-model="advOpts.section",
        :options="advOpts.sectionOpts",
        title="段小段代碼及名稱"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="權利人統編"): b-select(
        v-model="advOpts.id",
        :options="advOpts.idOpts",
        title="權利人統編"
      )
      b-input-group(prepend="權利人名稱"): b-select(
        v-model="advOpts.name",
        :options="advOpts.nameOpts",
        title="權利人名稱"
      )
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filteredRows.length }} 筆
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'

export default {
  mixins: [dynamicHeight],
  data: () => ({
    modalId: 'this should be an uuid',
    modalLoading: true,
    clickedId: undefined,
    rows: [],
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    qryType: 'land',
    qryTypes: [
      { value: 'land', text: '信託註記查詢-土地' },
      { value: 'building', text: '信託註記查詢-建物' },
      { value: 'reg_reason', text: '登記收件查詢' }
    ],
    obliterateFields: [
      { key: 'RM33', label: '登記日期', sortable: true },
      { key: 'GS_TYPE', label: '異動類別', sortable: true },
      { key: 'GG48', label: '段名稱', sortable: true },
      { key: 'GG49', label: '地/建號', sortable: true },
      { key: 'GG01', label: '登記次序', sortable: true },
      { key: 'BB09', label: '統編', sortable: true },
      { key: 'LNAM', label: '姓名', sortable: true },
      { key: 'RM123', label: '收件字號', sortable: true },
      { key: 'RM09', label: '登記原因', sortable: true },
      { key: 'GG30_1', label: '代碼內容', sortable: true }
    ],
    advOpts: {
      id: '',
      idOpts: [],
      name: '',
      nameOpts: [],
      date: '',
      dateOpts: [],
      class: '',
      classOpts: [],
      reason: '',
      reasonOpts: [],
      number: '',
      numberOpts: [],
      section: '',
      sectionOpts: [],
      caseNum: ''
    },
    tagsExpanded: false,
    showTagsToggle: false
  }),
  fetch () {
    if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
      this.$utils.warn('dateRange is not ready ... postpone $fetch')
      this.timeout(this.$fetch, 250)
    } else if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else if (this.validDateRange) {
      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload === true || json === false) {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'trust_query',
            query: this.qryType,
            start: this.dateRange.begin,
            end: this.dateRange.end,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            if (remainS && remainS > 0) {
              this.setCache(this.cacheKey, data, remainS * 1000)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        } else {
          this.rows = json.raw
          this.committed = true
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.notify(`查詢成功，找到 ${this.rows.length} 筆資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
        }
      })
    }
  },
  head: {
    title: '信託案件檢索-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    dataReady () {
      return this.queryCount > 0
    },
    queryCount () {
      if (this.qryType === 'reg_reason') {
        return this.rows?.length || 0
      }
      return this.filteredRows.length || 0
    },
    qryTypeText () {
      switch (this.qryType) {
        case 'land':
          return '土地其他登記事項信託註記查詢'
        case 'building':
          return '建物其他登記事項信託註記查詢'
        case 'reg_reason':
          return '登記收件(信託)資料查詢'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    caption () {
      return `找到 ${this.queryCount} 筆「${this.qryTypeText}」資料`
    },
    cacheKey () {
      return `reg_trust_case_${this.qryType}_${this.dateRange.begin}_${this.dateRange.end}`
    },
    validDateRange () {
      return this.dateRange.days > 0
    },
    showAdvSearch () {
      return this.qryType !== 'reg_reason'
    },
    disableAdvSearch () {
      return this.rows.length === 0 || !this.committed
    },
    advTags () {
      const tags = []
      const tagConfig = {
        caseNum: { label: '收件號', variant: 'primary' },
        date: { label: '登記日期', variant: 'secondary' },
        class: { label: '異動類別', variant: 'success' },
        reason: { label: '登記原因', variant: 'info' },
        number: { label: '地/建號', variant: 'dark' },
        section: { label: '段小段', variant: 'warning' },
        id: { label: '權利人統編', variant: 'danger' },
        name: { label: '權利人名稱', variant: 'light' }
      }

      for (const key in tagConfig) {
        const value = this.advOpts[key]
        if (!this.$utils.empty(value)) {
          const { label, variant } = tagConfig[key]
          tags.push({
            key,
            value,
            text: `${label}：${value}`,
            variant
          })
        }
      }
      return tags
    },
    filteredRows () {
      if (this.advTags.length === 0) {
        return this.rows
      }
      let pipelineItems = [...this.rows]

      // Filter by case number
      if (!this.$utils.empty(this.advOpts.caseNum)) {
        const query = this.advOpts.caseNum.trim()
        const rangeMatch = query.match(/^(\d+)\s*[-~]\s*(\d+)$/)
        pipelineItems = pipelineItems.filter((item) => {
          const caseIdParts = item.RM123?.split('-') || []
          const numPart = caseIdParts.length > 0 ? caseIdParts[caseIdParts.length - 1] : ''

          if (rangeMatch) {
            const startNum = parseInt(rangeMatch[1], 10)
            const endNum = parseInt(rangeMatch[2], 10)
            const itemNum = parseInt(numPart, 10)
            if (!isNaN(startNum) && !isNaN(endNum) && !isNaN(itemNum)) {
              return itemNum >= startNum && itemNum <= endNum
            }
            return false
          }
          return numPart.includes(query)
        })
      }
      // Filter by ID
      if (!this.$utils.empty(this.advOpts.id)) {
        pipelineItems = pipelineItems.filter(item => item.BB09.match(this.advOpts.id) !== null)
      }
      // Filter by name
      if (!this.$utils.empty(this.advOpts.name)) {
        pipelineItems = pipelineItems.filter(item => item.LNAM.match === this.advOpts.name)
      }
      // Filter by date
      if (!this.$utils.empty(this.advOpts.date)) {
        pipelineItems = pipelineItems.filter(item => item.RM33.match(this.advOpts.date) !== null)
      }
      // Filter by class
      if (!this.$utils.empty(this.advOpts.class)) {
        pipelineItems = pipelineItems.filter(item => item.GS_TYPE.match(this.advOpts.class) !== null)
      }
      // Filter by reason
      if (!this.$utils.empty(this.advOpts.reason)) {
        pipelineItems = pipelineItems.filter(item => item.RM09.match(this.advOpts.reason) !== null)
      }
      // Filter by land/building number
      if (!this.$utils.empty(this.advOpts.number)) {
        pipelineItems = pipelineItems.filter(item => item.GG49.match(this.advOpts.number) !== null)
      }
      // Filter by section
      if (!this.$utils.empty(this.advOpts.section)) {
        pipelineItems = pipelineItems.filter(item => item.GG48.match(this.advOpts.section) !== null)
      }
      return pipelineItems
    },
    xlsxData () {
      const fieldKeys = this.qryType === 'reg_reason'
        ? [
            '收件字號',
            '登記原因',
            '辦理情形',
            '初審人員',
            '作業人員',
            '收件時間',
            '限辦時間'
          ]
        : this.obliterateFields.map(field => field.key)
      const data = this.qryType === 'reg_reason' ? this.rows : this.filteredRows
      const jsons = data.map((item) => {
        const obj = {}
        for (const [key, value] of Object.entries(item)) {
          if (fieldKeys?.includes(key)) {
            if (this.qryType === 'reg_reason') {
              obj[key] = value
            } else {
              const found = this.obliterateFields.find(element => element.key === key)
              const label = found ? found.label : key
              obj[label] = value
            }
          }
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    rows (val) {
      this.refreshAdvOptsSelect(val)
    },
    advTags () {
      this.tagsExpanded = false
      this.$nextTick(() => {
        const container = this.$refs.tagsContainer
        if (container) {
          this.showTagsToggle = container.scrollHeight > 39 // Approx 2.4rem
        } else {
          this.showTagsToggle = false
        }
      })
    }
  },
  created () {
    this.modalId = this.$utils?.uuid()
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
      this.clickedId = `${data.RM123.replaceAll('-', '')}`
      this.showModalById(this.modalId)
    },
    landBuildNumber (item) {
      const val = item.GG49
      if (this.qryType === 'land') {
        const mainNumber = val.substring(0, 4).replace(/^[\s0]+/g, '')
        const subNumber = val.substring(4).replace(/^[\s0]+/g, '')
        return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      const mainNumber = val.substring(0, 5).replace(/^[\s0]+/g, '')
      const subNumber = val.substring(5).replace(/^[\s0]+/g, '')
      return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        id: '',
        name: '',
        date: '',
        class: '',
        reason: '',
        number: '',
        section: '',
        caseNum: ''
      }
    },
    removeAdvTag (tagToRemove) {
      const { key } = tagToRemove
      if (this.advOpts[key] !== undefined) {
        this.advOpts[key] = ''
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        id: '',
        idOpts: [],
        name: '',
        nameOpts: [],
        date: '',
        dateOpts: [],
        class: '',
        classOpts: [],
        reason: '',
        reasonOpts: [],
        number: '',
        numberOpts: [],
        section: '',
        sectionOpts: [],
        caseNum: ''
      }
      if (val) {
        this.advOpts.idOpts = ['', ...new Set(val.map(item => item.BB09))].sort()
        this.advOpts.nameOpts = ['', ...new Set(val.map(item => item.LNAM))].sort()
        this.advOpts.dateOpts = ['', ...new Set(val.map(item => item.RM33))].sort()
        this.advOpts.classOpts = [
          '',
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return {
                value: item.GS_TYPE,
                text: `${item.GS_TYPE}：${this.GS_TYPEText(item.GS_TYPE)}`
              }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.reasonOpts = [
          '',
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.RM09, text: `${item.RM09}：${item.RM09_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.numberOpts = ['', ...new Set(val.map(item => item.GG49))].sort()
        this.advOpts.sectionOpts = [
          '',
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.GG48, text: `${item.GG48}：${item.GG48_CHT}` }
            }), 'value'),
            'value'
          )
        ]
      }
    },
    GS_TYPEText (type) {
      switch (type) {
        case 'A':
          return '新增'
        case 'D':
          return '刪除'
        case 'M':
          return '更新前'
        case 'N':
          return '更新後'
        default:
          return type
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-container {
  transition: max-height 0.25s ease-in-out;
  font-size: 1.25rem;
}
.tags-container.tags-collapsed {
  max-height: 2.4rem; /* Approx one line of tags with margin */
  overflow: hidden;
}
</style>
