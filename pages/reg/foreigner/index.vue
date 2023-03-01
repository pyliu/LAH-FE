<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人資料查詢及建置 ({{ queryCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 建檔說明
          ol
            li: .d-flex.align-items-center
              span 點選上傳按鈕
              lah-button.mx-1(
                icon="file-circle-plus",
                variant="outline-primary",
                no-icon-gutter,
                @click="$refs.add.show()"
              )
              span 開啟介面
            li 輸入必要資訊【年度、案號、統編、姓名】
            li 建議輸入備註說明以供後續搜尋使用【搜尋欄位：統編、姓名以及備註】
            li 選取掃描的PDF檔案(必要)
            li 點擊上傳按鈕並等待完成
          hr
          h5 搜尋說明
          ol
            li 選擇查詢區間(預設為本年度)
            li 鍵入關鍵字(非必要)
            li 點擊 #[lah-fa-icon(icon="search" variant="dark") 搜尋]

      .d-flex.small
        lah-datepicker(
          v-model="dateRange",
          :begin="firstDayOfYear"
        )
        b-input.h-100.mx-1(
          v-model="keyword",
          placeholder="關鍵字...(非必要)",
          @keyup.enter="$fetch"
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
    v-if="queryCount > pagination.perPage"
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  b-table.text-center(
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
      b-button-group.mx-auto
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
          variant="danger",
          @click="remove(item)"
        )
    template(#cell(createtime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(modifytime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.modifytime * 1000) }}
    template(#cell(note)="{ item }")
      .text-left(v-html="handleNoteText(item.note)")
    template(#cell(fid)="{ item }")
      .text-center(v-html="handleFidText(item.fid)")
    template(#cell(fname)="{ item }")
      .text-center(v-html="handleFnameText(item.fname)")

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
    fields: [
      {
        key: '操作',
        thStyle: { width: '120px' }
      },
      {
        key: 'year',
        label: '年度',
        sortable: true,
        thStyle: { width: '80px' }
      },
      {
        key: 'number',
        label: '案號',
        sortable: true,
        thStyle: { width: '90px' }
      },
      {
        key: 'createtime',
        label: '建立日期',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'fid',
        label: '統編',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'fname',
        label: '姓名',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'note',
        label: '備註',
        sortable: false
      },
      {
        key: 'modifytime',
        label: '修改時間',
        sortable: true,
        thStyle: { width: '200px' }
      }
    ],
    maxHeight: 600
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中 ... 請稍後')
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
        // convert to PHP timestamp which is in seconds
        start_ts: +this.$utils.twToAdDateObj(this.dateRange.begin) / 1000,
        end_ts: +this.$utils.twToAdDateObj(this.dateRange.end) / 1000
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) { this.rows = [...data.raw] }
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
      })
    }
  },
  head: {
    title: '外國人資料查詢及建置-桃園市地政局'
  },
  computed: {
    firstDayOfYear () {
      return new Date(new Date().getFullYear(), 0, 1)
    },
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
            if (key === 'createtime') {
              obj[this.getLabel(key)] = this.$utils.toADDate(value * 1000, 'yyyy-LL-dd')
            } else if (key === 'modifytime') {
              obj[this.getLabel(key)] = this.$utils.toADDate(value * 1000)
            } else {
              obj[this.getLabel(key)] = value
            }
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
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
    // searching begin date set to Jan 1
    // this.timeout(() => {
    //   const now = new Date()
    //   this.dateRange = {
    //     ...this.dateRange,
    //     ...{
    //       begin: `${now.getFullYear() - 1911}0101`
    //     }
    //   }
    // }, 400)
  },
  methods: {
    handleAdd (payload) {
      // add to array head
      // this.rows.unshift({
      //   id: payload.id,
      //   createtime: +new Date() / 1000,
      //   fid: payload.fid,
      //   fname: payload.fname,
      //   modifytime: +new Date() / 1000,
      //   note: payload.note,
      //   number: payload.number,
      //   year: payload.year
      // })
      this.$fetch()
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
      this.$fetch()
    },
    remove (item) {
      this.confirm(`
        請確認是否要刪除本筆資料？<br/>
        年度：${item.year}<br/>
        案號：${item.number}<br/>
        統編：${item.fid}<br/>
        姓名：${item.fname}
      `).then((YN) => {
        if (YN) {
          // remove_foreigner_pdf
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'remove_foreigner_pdf',
            id: item.id
          }).then(({ data }) => {
            this.rows = this.rows.filter(row => row.id !== item.id)
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
          }).catch((err) => {
            this.alert(err.message)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    reset () {
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
    },
    handleFidText (fid) {
      if (this.$utils.empty(fid)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        fid = this.$utils.highlight(
          fid,
          this.keyword,
          'highlight-yellow'
        )
      }
      return fid
    },
    handleFnameText (fname) {
      if (this.$utils.empty(fname)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        fname = this.$utils.highlight(
          fname,
          this.keyword,
          'highlight-yellow'
        )
      }
      return fname
    },
    handleNoteText (note) {
      if (this.$utils.empty(note)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        note = this.$utils.highlight(
          note,
          this.keyword,
          'highlight-yellow'
        )
      }
      return note.replace(/(\n|\r\n)/g, '<br/>')
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
