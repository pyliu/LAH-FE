<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 謄本調閱紀錄檢索
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋
          ol
            li 可切換日期或是統編查詢
            li 日期區間查詢預設這個月
            li 點擊 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋

      .d-flex.align-items-center.h-100
        b-form-radio-group.text-nowrap.my-auto(
          v-model="searchType"
          :options="searchTypeOpts"
        )
        lah-datepicker.h-100(
          v-if="searchType === 'date'",
          v-model="dateRange",
          :begin="new Date()"
          @input="handleDateChanged"
        )
        b-input.h-100(
          v-show="searchType !== 'date'",
          ref="pid",
          v-model="pid",
          placeholder="... A123456789 ..."
          @keyup.enter="$fetch"
        )
        //- b-checkbox.ml-1.text-nowrap(v-model="hidePersonals", switch) 遮蔽個資
        lah-button.mx-1(
          icon="search"
          size="lg"
          title="搜尋"
          @click="reload"
          :disabled="isBusy"
          :busy="isBusy"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData",
          header="謄本調閱紀錄"
        )

  lah-pagination(
    v-if="showPagination",
    v-model="pagination",
    :total-rows="paginationCount",
    :caption="`${tableCaption} - ${rows.length}筆`"
  )
  b-table(
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
    bordered
  )
    template(#cell(收件日期)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item['收件日期']) }}
    template(#cell(收件時間)="{ item }")
      .text-nowrap {{ $utils.addTimeDivider(item['收件時間']) }}

</template>

<script>
export default {
  fetchOnServer: false,
  asyncData (nuxt) {
    const today = new Date()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday,
      dateRange: {
        begin: `${today.getFullYear() - 1911}${('0' + (today.getMonth() + 1)).slice(-2)}${('0' + today.getDate()).slice(-2)}`,
        end: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
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
    ],
    maxHeight: 600,
    maxHeightOffset: 160
  }),
  fetch () {
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
    this.$axios.post(this.$consts.API.JSON.MOICAS, axiosOpts).then(({ data }) => {
      this.rows = [...data.raw]
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
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
    paginationCount () {
      return this.rows?.length
    },
    xlsxData () {
      return this.rows
    }
  },
  watch: {
    searchType (val) {
      this.updatePagination(1, this.pagination.perPage)
      val !== 'date' && this.$refs.pid.focus()
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
  created () {},
  async mounted () {
    if (!this.$isServer && window) {
      this.maxHeight = parseInt(window.innerHeight - this.maxHeightOffset)
    }
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
