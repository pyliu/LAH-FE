<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 375租約異動
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            h5 資料庫搜尋說明
            ul
              li 搜尋土標部異動檔之「其他登記事項代碼」(GG30_1)標註為「A6」(有３７５租約)的資料
              li 請勿搜尋#[strong.text-danger 過大區間]，可能造成讀取時間過長而失敗
            hr
            h5 請參照下列步驟搜尋
            ol
              li 選擇查詢區間
              li 選擇查詢類別
              li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            hr
            h5 支援以下兩種查詢類別
            ol
              li 土地標示部
              li 土地所有權部

        .d-flex.small
          lah-datepicker.mr-1(v-model="dateRange")
          
          b-input-group.text-nowrap.mr-1: b-form-select.h-100(
            ref="type"
            v-model="qryType"
            :options="qryTypes"
            :disabled="isWrongDaysPeriod"
            @change="$fetch"
          ): template(v-slot:first): b-form-select-option(:value="null" disabled) -- 請選擇查詢類型 --
          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy || $utils.empty(qryType) || isWrongDaysPeriod"
            @click="$fetch"
            no-icon-gutter
          )
          lah-countdown-button(
            ref="countdown"
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            :milliseconds="cachedMs"
            :disabled="isBusy || isWrongDaysPeriod"
            :busy="isBusy"
            @end="reload"
            @click="reload"
            auto-start
            end-attention
            no-badge
          )
    
    lah-pagination(
      v-model="pagination"
      :total-rows="queryCount"
      :caption="foundText"
    )

    lah-transition(appear)
      b-table.text-center(
        id="a375-table"
        ref="table"
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
        template(#cell(收件字號)="{ item }"): div: b-link(@click="popup(item)").
          {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
        template(#cell(RM56_1)="{ item: { RM56_1 } }"): .text-nowrap {{ humanTWDate(RM56_1) }}
        template(#cell(GG48)="{ item }"): .text-nowrap {{ item.GG48 }}:{{ item.GG48_CHT }}
        template(#cell(GG49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
        template(#cell(BA48)="{ item }"): .text-nowrap {{ item.BA48 }}:{{ item.BA48_CHT }}
        template(#cell(BA49)="{ item }"): .text-nowrap {{ landBuildNumber(item) }}
        template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.RM09_CHT }}
        template(#cell(GS_TYPE)="{ item }"): .text-nowrap {{ item.GS_TYPE }}:{{ item.GS_TYPE_CHT }}
        template(#cell(BS_TYPE)="{ item }"): .text-nowrap {{ item.BS_TYPE }}:{{ item.BS_TYPE_CHT }}
        template(#cell(BB15_1)="{ item }"): .text-nowrap {{ BB15_1Text(item) }}
        template(#cell(BB09_NAME)="{ item }"): .text-nowrap {{ $utils.rareWordReplace(item.BB09_NAME) }}
        template(#cell(BB09_ADDR)="{ item }"): div {{ $utils.rareWordReplace(item.BB09_ADDR) }}
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
  head: {
    title: '375租約異動查詢-桃園市地政局'
  },
  fetchOnServer: false,
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
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
      perPage: 25,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    qryType: 'land',
    qryTypes: [
      { value: 'land', text: '土地標示部' },
      { value: 'owner', text: '土地所有權部' }
    ],
    landFields: [
      '#',
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "RM09",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "RM56_1",
        label: '校對日期',
        sortable: true,
      },
      {
        key: "GS_TYPE",
        label: '異動別',
        sortable: true,
      },
      {
        key: "GG48",
        label: '段別',
        sortable: true,
      },
      {
        key: "GG49",
        label: '地號',
        sortable: true,
      }
    ],
    ownerFields:[
      '#',
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "RM09",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "RM56_1",
        label: '校對日期',
        sortable: true,
      },
      {
        key: "BA48",
        label: '段別',
        sortable: true,
      },
      {
        key: "BA49",
        label: '地號',
        sortable: true,
      },
      {
        key: "BB01",
        label: '登序',
        sortable: true,
      },
      {
        key: "BS_TYPE",
        label: '異動別',
        sortable: true,
      },
      {
        key: "BB09",
        label: '統編',
        sortable: true,
      },
      {
        key: "BB09_NAME",
        label: '權利人',
        sortable: true,
      },
      {
        key: "BB09_ADDR",
        label: '住址',
        sortable: true,
      },
      {
        key: "BB15_1",
        label: '權利類別',
        sortable: true,
      },
      {
        key: "BB15_2",
        label: '分母',
        sortable: true,
      },
      {
        key: "BB15_3",
        label: '分子',
        sortable: true,
      }
    ],
    maxHeight: 600,
    warnDays: 180
  }),
  // only worked at page level component
  async asyncData (nuxt) {},
  computed: {
    fields () { return this.qryType === 'land' ? this.landFields : this.ownerFields },
    axiosType () { return this.qryType === 'land' ? '375_land_change' : '375_owner_change' },
    queryCount () { return this.rows.length },
    qryTypeText () {
      switch (this.qryType) {
        case 'land':
          return '土地標示部'
        case 'owner':
          return '土地所有權部'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    cacheKey () { return `query_375_${this.qryType}_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () { return `找到 ${this.queryCount} 筆「${this.qryTypeText}」資料` },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 }
  },
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert(`開始日期應小於或等於結束日期`, { pos: 'tr' })
      } else if (val > this.warnDays) {
        this.notify(`搜尋區間過大將造成伺服器回應緩慢(目前:${val}天)`, { title: '警告', type: 'warning', pos: 'tr' })
      }
    }
  },
  async fetch () {
    if(this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.daysPeriod > this.warnDays) {
        const ans = await this.confirm(`搜尋區間大於${this.warnDays}天(過大區間，可能造成讀取時間過長而失敗)，請確認要執行？`);
        if (!ans) {
          return
        }
      } else if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
        return 
      }

      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload !== true && json) {
          this.rows = json.raw
          this.committed = true
          this.notify(`查詢成功，找到 ${this.rows.length} 筆375租約異動資料。`, { subtitle: `${this.qryType}(快取)` })
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: this.axiosType,
            query: this.qryType,
            start: this.dateRange.begin,
            end: this.dateRange.end,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remain_s = data.cache_remaining_time
            const remain_ms = remain_s * 1000
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, data, remain_ms)
            }
          }).catch(err => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      })
    }
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
      this.clickedId = data['ID']
      this.showModalById(this.modalId)
    },
    landBuildNumber (item) {
      const val = item.GG49 || item.BA49
      const mainNumber = val.substring(0, 4).replace(/^[\s0]+/g, '')
      const subNumber = val.substring(4).replace(/^[\s0]+/g, '')
      return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
    },
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    BB15_1Text (item) {
      if (item.BB15_1 === 'A') {
        return 'A: 全部'
      } else if (item.BB15_1 === 'B') {
        return 'B: 共同共有'
      } else if (item.BB15_1 === 'Z') {
        return 'Z: 見其他登記事項'
      }
      return item.BB15_1
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  }
}
</script>

<style lang="scss" scoped>
</style>
