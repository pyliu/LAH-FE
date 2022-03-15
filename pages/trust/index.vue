<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 信託案件檢索
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
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
          //- lah-fa-icon(icon="lightbulb" regular variant="warning") 點擊「收件年字號」開啟案件詳情視窗
          lah-fa-icon(icon="caret-square-right" regular variant="primary"): b-link(to="/trust/HF") 切換為八德版本
      .d-flex.small
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
        lah-button.ml-1(
          v-if="showAdvSearch",
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="disableAdvSearch",
          no-icon-gutter
        )
        lah-button.ml-1(
          icon="file-excel",
          size="lg",
          title="匯出EXCEL",
          variant="outline-success",
          action="move-fade-ltr",
          regular,
          no-icon-gutter,
          :disabled="!dataReady",
          @click="xlsx"
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
    :total-rows="queryCount"
    :caption="caption"
  )

  lah-transition(appear)
    lah-reg-b-table(
      v-if="qryType === 'reg_reason' && committed"
      ref="regTbl"
      type="md"
      :baked-data="rows"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
      :max-height-offset="145"
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
    h3.text-center(
      v-else
    ): lah-fa-icon(action="breath" variant="primary") 請點選查詢按鈕
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
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="日期"): b-select(
        v-model="advOpts.date",
        :options="advOpts.dateOpts",
        title="登記日期"
      )
      b-input-group(prepend="類別"): b-select(
        v-model="advOpts.class",
        :options="advOpts.classOpts",
        title="異動類別"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="原因"): b-select(
        v-model="advOpts.reason",
        :options="advOpts.reasonOpts",
        title="登記原因"
      )
      b-input-group(prepend="地號"): b-select(
        v-model="advOpts.number",
        :options="advOpts.numberOpts",
        title="地或建號"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="統編"): b-select(
        v-model="advOpts.id",
        :options="advOpts.idOpts",
        title="統編"
      )
      b-input-group(prepend="名稱"): b-select(
        v-model="advOpts.name",
        :options="advOpts.nameOpts",
        title="名稱"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="段小段代碼"): b-select(
        v-model="advOpts.section",
        :options="advOpts.sectionOpts",
        title="段小段代碼"
      )
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
</template>

<script>
export default {
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
      {
        key: 'RM33',
        label: '登記日期',
        sortable: true
      },
      {
        key: 'GS_TYPE',
        label: '異動類別',
        sortable: true
      },
      {
        key: 'GG48',
        label: '段名稱',
        sortable: true
      },
      {
        key: 'GG49',
        label: '地/建號',
        sortable: true
      },
      {
        key: 'GG01',
        label: '登記次序',
        sortable: true
      },
      {
        key: 'BB09',
        label: '統編',
        sortable: true
      },
      {
        key: 'LNAM',
        label: '姓名',
        sortable: true
      },
      {
        key: 'RM123',
        label: '收件字號',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'GG30_1',
        label: '代碼內容',
        sortable: true
      }
    ],
    maxHeight: 600,
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
      sectionOpts: []
    }
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
    dataReady () { return this.queryCount > 0 },
    queryCount () {
      if (this.qryType === 'reg_reason') {
        return this.rows?.length || 0
      } else {
        return this.filteredRows.length || 0
      }
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
    caption () { return `找到 ${this.queryCount} 筆「${this.qryTypeText}」資料` },
    cacheKey () { return `reg_trust_case_${this.qryType}_${this.dateRange.begin}_${this.dateRange.end}` },
    validDateRange () { return this.dateRange.days > 0 },
    showAdvSearch () { return this.qryType !== 'reg_reason' },
    disableAdvSearch () { return this.rows.length === 0 || !this.committed },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.id)) {
        tags.push(`統編：${this.advOpts.id}`)
      }
      if (!this.$utils.empty(this.advOpts.name)) {
        tags.push(`名稱：${this.advOpts.name}`)
      }
      if (!this.$utils.empty(this.advOpts.date)) {
        tags.push(`登記日期：${this.advOpts.date}`)
      }
      if (!this.$utils.empty(this.advOpts.class)) {
        tags.push(`異動類別：${this.advOpts.class}`)
      }
      if (!this.$utils.empty(this.advOpts.reason)) {
        tags.push(`登記原因：${this.advOpts.reason}`)
      }
      if (!this.$utils.empty(this.advOpts.number)) {
        tags.push(`地/建號：${this.advOpts.number}`)
      }
      if (!this.$utils.empty(this.advOpts.section)) {
        tags.push(`段代碼：${this.advOpts.section}`)
      }
      return tags
    },
    filteredRows () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.rows
        const checkId = !this.$utils.empty(this.advOpts.id)
        if (checkId) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.BB09.match(this.advOpts.id) !== null
          })
        }
        const checkName = !this.$utils.empty(this.advOpts.name)
        if (checkName) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.LNAM.match(this.advOpts.name) !== null
          })
        }
        const checkDate = !this.$utils.empty(this.advOpts.date)
        if (checkDate) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM33.match(this.advOpts.date) !== null
          })
        }
        const checkClass = !this.$utils.empty(this.advOpts.class)
        if (checkClass) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GS_TYPE.match(this.advOpts.class) !== null
          })
        }
        const checkReason = !this.$utils.empty(this.advOpts.reason)
        if (checkReason) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM09.match(this.advOpts.reason) !== null
          })
        }
        const checkNumber = !this.$utils.empty(this.advOpts.number)
        if (checkNumber) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GG49.match(this.advOpts.number) !== null
          })
        }
        const checkSection = !this.$utils.empty(this.advOpts.section)
        if (checkSection) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.GG48.match(this.advOpts.section) !== null
          })
        }
        return pipelineItems
      }
      return this.rows
    }
  },
  watch: {
    rows (val) {
      this.refreshAdvOptsSelect(val)
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
    xlsx () {
      const fieldKeys = this.qryType === 'reg_reason'
        ? this.$refs.regTbl.tblFields.map((field, idx, array) => field.key)
        : this.obliterateFields.map((field, idx, array) => field.key)
      const data = this.qryType === 'reg_reason' ? this.rows : this.filteredRows
      const jsons = data.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
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
      this.downloadXlsx('信託案件', jsons)
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          id: '',
          name: '',
          date: '',
          class: '',
          reason: '',
          number: '',
          section: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...{
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
          sectionOpts: []
        }
      }
      if (val) {
        this.advOpts.idOpts = [...new Set(val.map(item => item.BB09))].sort()
        this.advOpts.nameOpts = [...new Set(val.map(item => item.LNAM))].sort()
        this.advOpts.dateOpts = [...new Set(val.map(item => item.RM33))].sort()
        this.advOpts.classOpts = [...new Set(val.map(item => item.GS_TYPE))].sort()
        this.advOpts.reasonOpts = [...new Set(val.map(item => item.RM09))].sort()
        this.advOpts.numberOpts = [...new Set(val.map(item => item.GG49))].sort()
        this.advOpts.sectionOpts = [...new Set(val.map(item => item.GG48))].sort()
        this.advOpts.idOpts.unshift('')
        this.advOpts.nameOpts.unshift('')
        this.advOpts.dateOpts.unshift('')
        this.advOpts.classOpts.unshift('')
        this.advOpts.reasonOpts.unshift('')
        this.advOpts.numberOpts.unshift('')
        this.advOpts.sectionOpts.unshift('')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
