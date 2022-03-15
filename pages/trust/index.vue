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
            li 信託登記－土地註記塗銷
            li 信託登記－建物註記塗銷
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
        lah-button.mx-1(
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
      :items="rows"
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
        【{{ item.GG30_1 }}】{{ item.GG30_1_CHT }}{{ item.GG30_2 }}
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
    qryType: 'reg_reason',
    qryTypes: [
      { value: 'land', text: '土地註記塗銷' },
      { value: 'building', text: '建物註記塗銷' },
      { value: 'reg_reason', text: '登記收件查詢' }
    ],
    obliterateFields: [
      {
        key: 'RM123',
        label: '收件字號',
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
        key: 'GS_TYPE',
        label: '異動類別',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'RM33',
        label: '登記日期',
        sortable: true
      },
      {
        key: 'GG30_1',
        label: '代碼內容',
        sortable: true
      }
    ],
    maxHeight: 600
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
    queryCount () { return this.rows?.length || 0 },
    qryTypeText () {
      switch (this.qryType) {
        case 'land':
          return '土地註記塗銷'
        case 'building':
          return '建物註記塗銷'
        case 'reg_reason':
          return '登記收件查詢'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    caption () { return `找到 ${this.queryCount} 筆「${this.qryTypeText}」資料` },
    cacheKey () { return `reg_trust_case_${this.qryType}_${this.dateRange.begin}_${this.dateRange.end}` },
    validDateRange () { return this.dateRange.days > 0 }
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
      const jsons = this.rows.map((data, idx, array) => {
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
