<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 檔案應用預約申請控管 ({{ queryCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 新建預約資料說明
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
            li 輸入必要資訊【收件字號、申請人、統編、收件日期、截止日期】
            li 建議輸入備註說明以供後續搜尋使用
            li 選取掃描的PDF檔案(必要)
            li 點擊上傳按鈕並等待完成
          hr
          h5 搜尋說明
          ol
            li 鍵入關鍵字
            li 點擊 #[lah-fa-icon(icon="search" variant="dark") 搜尋]

      .d-flex.small
        lah-datepicker(
          v-model="dateRange",
          :begin="firstDayOf2024Feb"
        )
        b-input.h-100.mx-1(
          v-model="keyword",
          placeholder="關鍵字...",
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
          header="檔案應用預約申請資料查詢"
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
          :href="downloadPDFUrl(item.number)",
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
          variant="outline-danger",
          @click="remove(item)"
        )
    template(#cell(createtime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(endtime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.endtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(note)="{ item }")
      .text-left(v-html="handleNoteText(item.note)")
    template(#cell(fid)="{ item }")
      .text-center(v-html="handleFidText(item.fid)")
    template(#cell(fname)="{ item }")
      .text-center(v-html="handleFnameText(item.fname)")
    template(#cell(number)="{ item }")
      .text-left(v-html="handleNumberText(item.number)")

  b-modal(
    ref="add",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 新增檔案應用預約資料
    lah-adm-reserve-file-case-ui(
      @close="$refs.add.hide()",
      @add="handleAdd"
    )

  b-modal(
    ref="edit",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 修改檔案應用預約資料
    lah-adm-reserve-file-case-ui(
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
        key: 'id',
        label: '序號',
        thStyle: { width: '50px' }
      },
      {
        key: '操作',
        thStyle: { width: '90px' }
      },
      {
        key: 'number',
        label: '收件字號',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'pid',
        label: '統編',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'pname',
        label: '申請人',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'createtime',
        label: '收件日期',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'endtime',
        label: '預約截止日期',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'note',
        label: '備註',
        sortable: false,
        thStyle: { width: '300px' }
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
      this.$axios.post(this.$consts.API.JSON.ADM, {
        type: 'reserve_pdf_list',
        keyword: this.keyword,
        // convert to PHP timestamp which is in seconds
        start_ts: +this.$utils.twToAdDateObj(this.dateRange.begin) / 1000,
        end_ts: +this.$utils.twToAdDateObj(this.dateRange.end) / 1000
      }).then(({ data }) => {
        // console.warn(data.raw)
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
    title: '檔案應用預約申請控管-桃園市地政局'
  },
  computed: {
    firstDayOf2024Feb () {
      return new Date(2024, 1, 1)
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
      this.rows.unshift({
        id: payload.id,
        createtime: payload.createtime,
        pid: payload.pid,
        pname: payload.pname,
        endtime: payload.endtime,
        note: payload.note,
        number: payload.number
      })
      // this.$fetch()
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
      // update latest data to rows
      const found = this.rows.find((item, idx, array) => {
        return item.id === payload.id
      })
      if (found) {
        found.pid = payload.pid
        found.pname = payload.pname
        found.note = payload.note
        found.endtime = payload.endtime
      }
    },
    remove (item) {
      this.confirm(`
        請確認是否要刪除本筆資料？<br/>
        案號：${item.number}<br/>
        統編：${item.pid}<br/>
        姓名：${item.pname}
      `).then((YN) => {
        if (YN) {
          // remove_foreigner_pdf
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.ADM, {
            type: 'remove_reserve_pdf',
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
    downloadPDFUrl (number) {
      return `http://${this.apiHost}:${this.apiPort}/get_adm_reserve_pdf.php?number=${number}`
    },
    handleNumberText (cid) {
      if (this.$utils.empty(cid)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        cid = this.$utils.highlight(
          cid,
          this.keyword,
          'highlight-yellow'
        )
      }
      return cid
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
