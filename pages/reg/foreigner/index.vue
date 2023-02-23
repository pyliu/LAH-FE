<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人資料查詢及建置
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 建檔說明
          ol
            li 點選上傳按鈕開啟介面
            li 選取掃描的PDF檔案
            li 輸入備註說明以供後續搜尋使用
            li 點擊上傳按鈕並等待完成
          hr
          h5 搜尋說明
          ol
            li 選擇查詢區間(預設為本月份)
            li 鍵入關鍵字(非必要)
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]

      .d-flex.small
        lah-datepicker(v-model="dateRange")
        b-input.h-100.mx-1(
          v-model="keyword",
          placeholder="關鍵字...(非必要)"
        )
        lah-button(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          action="swim"
          variant="outline-dark"
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button.mx-1(
          ref="plus"
          icon="file-circle-plus"
          size="lg"
          title="新建資料"
          :disabled="isBusy"
          @click="$refs.add.show()"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData"
          header="外國人資料查詢"
        )

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition: b-table.text-center(
    v-if="committed"
    ref="table"
    select-mode="single"
    selected-variant="success"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="rows"
    :responsive="'lg'"
    :head-variant="'dark'"
    :fields="fields"
    :per-page="pagination.perPage"
    :current-page="pagination.currentPage"
    :borderless="false"
    :outlined="false"
    :dark="false"
    :fixed="false"
    :foot-clone="false"
    caption-top
    selectable
    striped
    hover
    bordered
    small
    no-border-collapse
    @row-selected="rowSelected"
  )
    template(#table-busy): span.ld-txt 讀取中...
    template(v-slot:cell(操作)="{ item, index, rowSelected }")
      //- template(v-if="rowSelected")
      //-   span.mr-1(aria-hidden="true") &check;
      //-   span.sr-only 勾選
      //- template(v-else)
      //-   span(aria-hidden="true") &nbsp;
      //-   span.sr-only 無勾選
      b-button-group.mx-auto(style="min-width: 120px")
        lah-button(
          :href="downloadPDFUrl(item.id)",
          target="_blank",
          title="開啟新視窗下載",
          icon="file-pdf",
          no-icon-gutter
        )
        lah-button.mx-1(
          regular,
          no-icon-gutter,
          title="編輯",
          icon="pen-to-square",
          @click="popupEdit(item)"
        )
        lah-button(
          no-icon-gutter,
          title="刪除",
          icon="trash-can",
          variant="danger"
        )
    template(#cell(createtime)="{ item }")
      .mx-auto(style="width: 100px") {{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(modifytime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.modifytime * 1000) }}
    template(#cell(note)="{ item }")
      .text-left(style="min-width: 300px; max-width: 500px;") {{ item.note }}

  b-modal(
    ref="add",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 新增外國人資料
    lah-reg-foreigner-case-ui(
      @close="$refs.add.hide()",
      @add="handleAdd"
    )

  b-modal(
    ref="edit",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 修改外國人資料
    lah-reg-foreigner-case-ui(
      :orig-data="editRecord"
      @close="$refs.edit.hide()",
      @edit="handleEdit"
    )
</template>

<script>
export default {
  fetchOnServer: false,
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    keyword: '',
    editRecord: null,
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
    committed: false,
    fields: [
      '操作',
      {
        key: 'year',
        label: '年度',
        sortable: true
      },
      {
        key: 'number',
        label: '案號',
        sortable: true
      },
      {
        key: 'createtime',
        label: '建立日期',
        sortable: true
      },
      {
        key: 'fid',
        label: '統編',
        sortable: true
      },
      {
        key: 'fname',
        label: '姓名',
        sortable: true
      },
      {
        key: 'note',
        label: '備註',
        sortable: false
      },
      {
        key: 'modifytime',
        label: '修改時間',
        sortable: true
      }
    ],
    maxHeight: 600
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
        return
      }
      this.reset()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'foreigner_pdf_list',
        keyword: this.keyword,
        // PHP timestamp
        start_ts: +this.$utils.twToAdDateObj(this.dateRange.begin) / 1000,
        // PHP timestamp
        end_ts: +this.$utils.twToAdDateObj(this.dateRange.end) / 1000
      }).then(({ data }) => {
        this.rows = [...data.raw]
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
      }).catch((err) => {
        this.alert(err.message)
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        this.committed = true
      })
    }
  },
  head: {
    title: '外國人資料查詢及建置-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.rows.length },
    cacheKey () { return `query_land_ref_change_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () {
      const message = `${this.dateRange.begin} ~ ${this.dateRange.end} 找到 ${this.queryCount} 筆「外國人」資料`
      return this.$utils.empty(this.keyword) ? message : `${message}【關鍵字：${this.keyword}】`
    },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    xlsxData () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.rows.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            obj[this.getLabel(key)] = value
          }
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期')
      }
    },
    rows (val) {
      // console.warn(val)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    handleAdd (payload) {
      // add to array head
      this.rows.unshift({
        id: payload.id,
        createtime: +new Date() / 1000,
        fid: payload.fid,
        fname: payload.fname,
        modifytime: +new Date() / 1000,
        note: payload.note,
        number: payload.number,
        year: payload.year
      })
    },
    rowSelected (items) {
      if (Array.isArray(items) && items.length > 0) {
        this.popupEdit(items[0])
      }
    },
    popupEdit (record) {
      this.editRecord = record
      this.$refs.edit?.show()
    },
    handleEdit (payload) {
      // const found = this.rows.find((row) => {
      //   return row.id === payload.id
      // })
      // if (found) {
      //   found.year = payload.year
      //   found.number = payload.number
      //   found.fid = payload.fid
      //   found.fname = payload.fname
      //   found.note = payload.note
      //   found.modifytime = payload.modifytime
      // }
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
    },
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    downloadPDFUrl (id) {
      return `http://${this.apiHost}:${this.apiPort}/get_reg_foreigner_pdf.php?id=${id}`
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
