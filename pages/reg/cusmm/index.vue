<template lang="pug">
div: client-only
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 謄本調閱紀錄檢索
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          .d-flex.justify-content-end.h5
            b-checkbox(v-model="hidePersonals", switch) XLSX匯出遮蔽個資
          h5 請參照下列步驟搜尋
          ol
            li 可切換日期或是統編查詢
            li 日期區間查詢預設今天
            li 點擊 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋

      .d-flex.align-items-center.h-100
        b-form-radio-group.text-nowrap.my-auto(
          v-model="searchType"
          :options="searchTypeOpts"
        )
        lah-datepicker.h-100(
          v-if="searchType === 'date'",
          v-model="dateRange",
          :begin="new Date()",
          :end="new Date()",
          @input="handleDateChanged"
        )
        b-input.h-100(
          v-else,
          ref="pid",
          v-model="pid",
          placeholder="... A123456789 ...",
          @keyup.enter="$fetch",
          autofocus
        )
        //- b-checkbox.ml-1.text-nowrap(v-model="hidePersonals", switch) 遮蔽個資
        lah-button.mx-1(
          icon="search"
          size="lg"
          title="搜尋"
          @click="reload"
          :disabled="isBusy || !queryOK"
          :busy="isBusy"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData",
          :header="`謄本調閱紀錄(${hidePersonals ? '遮蔽個資' : '★不遮蔽個資★'})`"
        )

  lah-pagination(
    v-if="showPagination",
    v-model="pagination",
    :total-rows="dataCount",
    :caption="`${tableCaption} - ${dataCount}筆`"
  )
  lah-transition
    b-table(
      v-if="dataCount > 0",
      :busy="isBusy"
      :items="rows"
      :fields="fields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
      :caption-append="tableCaption",
      :head-variant="'dark'",
      :sticky-header="`${maxHeight}px`",
      small,
      hover,
      striped,
      bordered,
      selectable,
      select-mode="single",
      selected-variant="warning"
    )
      template(#cell(收件日期)="{ item }")
        .text-nowrap {{ $utils.addDateDivider(item['收件日期']) }}
      template(#cell(收件時間)="{ item }")
        .text-nowrap {{ $utils.addTimeDivider(item['收件時間']) }}
      //- template(#cell(申請人統編)="{ item }")
      //-   .text-nowrap {{ hidePersonalInfo(item['申請人統編']) }}
      //- template(#cell(申請人姓名)="{ item }")
      //-   .text-nowrap {{ hidePersonalInfo(item['申請人姓名']) }}
      //- template(#cell(代理人統編)="{ item }")
      //-   .text-nowrap {{ hidePersonalInfo(item['代理人統編']) }}
      //- template(#cell(代理人姓名)="{ item }")
        .text-nowrap {{ hidePersonalInfo(item['代理人姓名']) }}
    .center.h2.mt-3(v-else-if="isBusy"): .ld-txt 讀取中 ...
    .center.h2.mt-3(v-else) ⚠ 無資料，請重新查詢 ⚠

</template>

<script>
import dynamicHeight from '~/plugins/dynamic-height-mixin'
export default {
  fetchOnServer: false,
  mixins: [dynamicHeight],
  asyncData (nuxt) {
    const today = new Date()
    // const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    // const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    // const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      dateRange: {
        begin: `${today.getFullYear() - 1911}${('0' + (today.getMonth() + 1)).slice(-2)}${('0' + today.getDate()).slice(-2)}`,
        end: `${today.getFullYear() - 1911}${('0' + (today.getMonth() + 1)).slice(-2)}${('0' + today.getDate()).slice(-2)}`,
        days: 0
      }
    }
  },
  data: () => ({
    hidePersonals: true,
    pid: '',
    rows: [],
    fields: [
      { key: '收件年', sortable: true },
      { key: '收件字', sortable: true },
      { key: '收件號', sortable: true },
      { key: '申請方式', sortable: true },
      { key: '申請類別', sortable: true },
      { key: '申請人統編', sortable: true },
      { key: '申請人姓名', sortable: true },
      { key: '代理人統編', sortable: true },
      { key: '代理人姓名', sortable: true },
      { key: '收件日期', sortable: true },
      { key: '收件時間', sortable: true },
      { key: '申請類別', sortable: true },
      { key: '段代碼', sortable: true },
      { key: '段小段', label: '段名', sortable: true },
      { key: '鄉鎮市區代碼', label: '區代碼', sortable: true },
      { key: '鄉鎮市區', label: '區名', sortable: true },
      { key: '地建別', sortable: true },
      { key: '鄉鎮市區', sortable: true },
      // { key: '電子資料登記謄本張數', sortable: true },
      { key: '登記簿謄本張數', sortable: true },
      { key: '地價謄本張數', sortable: true },
      { key: '地籍圖謄本張數', sortable: true },
      { key: '建物平面圖謄本張數', sortable: true }
    ],
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    searchType: 'date',
    searchTypeOpts: [
      { text: '日期', value: 'date' },
      { text: '統編', value: 'id' }
    ]
  }),
  fetch () {
    if (this.isBusy || !this.queryOK) {
      !this.queryOK && this.warning('輸入關鍵字長度不符合規格(大於4個字元)')
      return
    }
    this.isBusy = true
    let axiosOpts = {
      type: 'cusmm_by_pid',
      pid: this.pid?.toUpperCase()
    }
    if (this.searchType === 'date') {
      axiosOpts = {
        type: 'cusmm_by_date',
        begin: this.dateRange.begin,
        end: this.dateRange.end
      }
    }
    this.rows = []
    this.$axios.post(this.$consts.API.JSON.MOICAS, axiosOpts).then(({ data }) => {
      this.rows = [...data.raw]
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
      this.updatePagination(1, this.pagination.perPage)
    })
  },
  head: {
    title: '謄本調閱紀錄檢索-桃園市地政局'
  },
  computed: {
    tableCaption () {
      if (this.searchType === 'date') {
        return `${this.$utils.addDateDivider(this.dateRange.begin.toString())} ~ ${this.$utils.addDateDivider(this.dateRange.end.toString())}`
      }
      return this.pid
    },
    showPagination () {
      return this.rows?.length > this.pagination.perPage
    },
    dataCount () {
      return this.rows?.length
    },
    xlsxData () {
      return this.rows.map((row) => {
        const copiedArray = JSON.parse(JSON.stringify(row))
        copiedArray['申請人統編'] = this.hidePersonalInfo(row['申請人統編'])
        copiedArray['代理人統編'] = this.hidePersonalInfo(row['代理人統編'])
        copiedArray['申請人姓名'] = this.hidePersonalInfo(row['申請人姓名'])
        copiedArray['代理人姓名'] = this.hidePersonalInfo(row['代理人姓名'])
        return copiedArray
      })
    },
    queryOK () {
      if (this.searchType !== 'date' && this.$utils.length(this.pid) < 4) {
        return false
      }
      return true
    }
  },
  watch: {
    searchType (val) {
      this.rows = []
    },
    hidePersonals (flag) {},
    rows (dontcare) {
      this.updatePagination(1, this.pagination.perPage)
      // console.warn(dontcare)
    },
    pagination (val) {
      this.setCache('cusmm-pagination', val)
    }
  },
  created () {
    this.maxHeightOffset = 160
  },
  async mounted () {
    const cached = await this.getCache('cusmm-pagination')
    this.updatePagination(1, cached?.perPage || 20)
  },
  methods: {
    handleDateChanged (data) {},
    reload () {
      this.$fetch()
    },
    updatePagination (current, pageCount) {
      this.pagination = {
        ...{
          currentPage: current,
          perPage: pageCount
        }
      }
    },
    hidePersonalInfo (text) {
      if (this.hidePersonals && text) {
        // pid, uses a regular expression to specifically match the pattern of a string starting with a capital letter (A-Z).
        if (/^\p{Lu}/u.test(text) && text.length === 10) {
          return text.slice(0, 4) + 'XXX' + text.slice(7)
        }
        // human name
        if (text.length <= 4) {
          return text[0] + 'Ｏ' + text[text.length - 1]
        }
      }
      return text
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
