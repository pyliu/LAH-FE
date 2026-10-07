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
            li 選取掃描的PDF檔案 (必要)
            li 點擊確認按鈕並等待上傳完成
          hr
          h5 搜尋與管理說明
          ol
            li 鍵入關鍵字（支援收件字號、統編、申請人、備註）
            li 可使用快速時間下拉選單（近1年、本年度、近半年等）切換查詢區間
            li 可點選頂部「案件狀態」膠囊（全部、有效中、即將到期、已逾期）快速篩選
            li 支援「表格清單」與「卡片看板」雙模式切換
            li 點選 PDF 圖示可就地於視窗內直接預覽檢閱

      .d-flex.small
        lah-datepicker(
          :key="datePickerKey",
          v-model="dateRange",
          :begin="queryBeginDate",
          :end="queryEndDate"
        )
        b-dropdown.mx-1(size="sm" variant="outline-secondary" :text="presetLabel" right)
          b-dropdown-item(@click="setPreset('pastYear')") 近 1 年
          b-dropdown-item(@click="setPreset('thisYear')") 本年度
          b-dropdown-item(@click="setPreset('pastSixMonths')") 近半年
          b-dropdown-item(@click="setPreset('all')") 全期間 (自2024起)
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

  //- 狀態篩選膠囊與檢視模式切換列
  .d-flex.justify-content-between.align-items-center.my-2.flex-wrap
    .d-flex.align-items-center.flex-wrap
      .mr-2.small.text-muted.my-1: strong 案件狀態：
      b-button-group.my-1(size="sm")
        b-button(
          :variant="currentStatusFilter === 'all' ? 'dark' : 'outline-dark'"
          @click="currentStatusFilter = 'all'"
          title="顯示全部案件"
        )
          lah-fa-icon(icon="list-check")
          span.ml-1 全部
          b-badge.ml-1(variant="light") {{ rows.length }}
        b-button(
          :variant="currentStatusFilter === 'valid' ? 'success' : 'outline-success'"
          @click="currentStatusFilter = 'valid'"
          title="顯示有效案件"
        )
          lah-fa-icon(icon="circle-check")
          span.ml-1 有效中
          b-badge.ml-1(variant="light") {{ validCount }}
        b-button(
          :variant="currentStatusFilter === 'expiring' ? 'warning' : 'outline-warning'"
          @click="currentStatusFilter = 'expiring'"
          title="顯示 30 天內即將到期案件"
        )
          lah-fa-icon(icon="clock")
          span.ml-1 30天內到期
          b-badge.ml-1(:variant="expiringCount > 0 ? 'danger' : 'light'") {{ expiringCount }}
        b-button(
          :variant="currentStatusFilter === 'overdue' ? 'danger' : 'outline-danger'"
          @click="currentStatusFilter = 'overdue'"
          title="顯示已逾期案件"
        )
          lah-fa-icon(icon="circle-exclamation")
          span.ml-1 已逾期
          b-badge.ml-1(:variant="overdueCount > 0 ? 'dark' : 'light'") {{ overdueCount }}

    .d-flex.align-items-center.my-1
      .mr-2.small.text-muted 檢視模式：
      b-button-group(size="sm")
        b-button(
          :variant="viewMode === 'table' ? 'primary' : 'outline-secondary'"
          @click="viewMode = 'table'"
          title="表格清單檢視"
        )
          lah-fa-icon(icon="table-list")
          span.ml-1 表格
        b-button(
          :variant="viewMode === 'card' ? 'primary' : 'outline-secondary'"
          @click="viewMode = 'card'"
          title="卡片看板檢視"
        )
          lah-fa-icon(icon="grip")
          span.ml-1 卡片

  //- 到期警示提醒橫幅
  b-alert.py-2.px-3.my-2.d-flex.justify-content-between.align-items-center(
    v-if="expiringCount > 0 || overdueCount > 0"
    show
    variant="warning"
    dismissible
  )
    .d-flex.align-items-center
      lah-fa-icon(icon="triangle-exclamation" size="lg" variant="danger")
      .ml-2.small
        strong 到期警示提醒：
        span(v-if="overdueCount > 0") 目前共有 #[b.text-danger {{ overdueCount }}] 筆案件已逾期；
        span(v-if="expiringCount > 0") 有 #[b.text-warning {{ expiringCount }}] 筆案件將於 30 天內截止！請妥善追蹤辦理或歸檔。
    b-button-group(size="sm")
      b-button(
        v-if="overdueCount > 0"
        variant="outline-danger"
        size="sm"
        @click="currentStatusFilter = 'overdue'"
      ) 僅看逾期
      b-button(
        v-if="expiringCount > 0"
        variant="outline-dark"
        size="sm"
        @click="currentStatusFilter = 'expiring'"
      ) 僅看到期

  lah-pagination(
    v-if="queryCount > pagination.perPage"
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  //- 模式 1：精緻表格檢視
  b-table.text-center(
    v-if="viewMode === 'table'"
    ref="table"
    select-mode="single"
    selected-variant="success"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="displayedRows"
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
    template(#cell(status)="{ item }")
      b-badge(
        :variant="getStatusVariant(item)"
        class="px-2 py-1"
      ) {{ getStatusText(item) }}
    template(v-slot:cell(操作)="{ item }")
      b-button-group.mx-auto
        lah-button(
          title="就地預覽 PDF",
          icon="file-pdf",
          variant="outline-primary",
          no-icon-gutter,
          @click="openPdfModal(item)"
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
    template(#cell(pid)="{ item }")
      .text-center(v-html="handleFidText(item.pid)")
    template(#cell(pname)="{ item }")
      .text-center(v-html="handleFnameText(item.pname)")
    template(#cell(number)="{ item }")
      .text-left(v-html="handleNumberText(item.number)")

  //- 模式 2：卡片看板檢視
  .row.mt-2(v-else-if="viewMode === 'card'")
    .col-12.col-md-6.col-xl-4.mb-3(
      v-for="item in paginatedCards"
      :key="item.id"
    )
      b-card.h-100.shadow-sm.card-item(
        :border-variant="getItemStatus(item) === 'overdue' ? 'danger' : (getItemStatus(item) === 'expiring' ? 'warning' : 'light')"
        no-body
      )
        b-card-header.d-flex.justify-content-between.align-items-center.py-2.bg-light
          .d-flex.align-items-center
            b-badge(variant="dark" class="px-2 py-1") # {{ item.id }}
            span.font-weight-bold.ml-2.text-primary(v-html="handleNumberText(item.number)")
          b-badge(
            :variant="getStatusVariant(item)"
            class="px-2 py-1"
          ) {{ getStatusText(item) }}

        b-card-body.p-3
          .d-flex.justify-content-between.align-items-center.mb-2
            div
              .text-muted.small 申請人
              .font-weight-bold.h6.mb-0(v-html="handleFnameText(item.pname)")
            .text-right
              .text-muted.small 統一編號 / 身分證號
              .font-mono(v-html="handleFidText(item.pid)")
          hr.my-2
          .small.mb-2
            .d-flex.justify-content-between.text-muted
              span 收件：{{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
              span 截止：{{ $utils.toADDate(item.endtime * 1000, 'yyyy-LL-dd') }}
          .p-2.bg-light.rounded.small.text-muted.note-box
            strong 備註：
            span(v-if="item.note" v-html="handleNoteText(item.note)")
            span.text-muted(v-else) （無額外備註）

        b-card-footer.p-2.bg-white.d-flex.justify-content-between.align-items-center
          lah-button(
            icon="file-pdf",
            variant="outline-primary",
            size="sm",
            @click="openPdfModal(item)"
          ) 預覽 PDF
          b-button-group(size="sm")
            lah-button(
              regular,
              icon="pen-to-square",
              variant="outline-secondary",
              title="編輯",
              @click="popupEdit(item)"
            ) 編輯
            lah-button(
              icon="trash-can",
              variant="outline-danger",
              title="刪除",
              @click="remove(item)"
            ) 刪除

  //- 新增資料彈窗
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

  //- 修改資料彈窗
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

  //- 站內 PDF 預覽彈窗 (Iframe Embed)
  b-modal(
    ref="pdf_modal",
    size="xl",
    hide-footer,
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="file-pdf" variant="danger" size="lg")
        span.ml-2 檔案應用預約申請 PDF 檢視
        b-badge.ml-2(v-if="previewingItem" variant="dark") {{ previewingItem.number }}
        span.ml-2.small.text-muted(v-if="previewingItem") (申請人：{{ previewingItem.pname }})

    .d-flex.justify-content-between.align-items-center.mb-2.p-2.bg-light.rounded
      .small.text-muted
        span 案號：{{ previewingItem?.number }} ｜
        span 申請人：{{ previewingItem?.pname }} ｜
        span 預約截止日：{{ previewingItem ? $utils.toADDate(previewingItem.endtime * 1000, 'yyyy-LL-dd') : '' }}
      b-button-group(size="sm")
        b-button(
          variant="outline-primary"
          :href="previewingItem ? downloadPDFUrl(previewingItem.number) : '#'"
          target="_blank"
        )
          lah-fa-icon(icon="arrow-up-right-from-square")
          span.ml-1 新分頁開啟
        b-button(
          variant="outline-success"
          :href="previewingItem ? downloadPDFUrl(previewingItem.number) : '#'"
          :download="`${previewingItem?.number || 'file'}.pdf`"
        )
          lah-fa-icon(icon="download")
          span.ml-1 下載檔案
        b-button(
          variant="secondary"
          @click="$refs.pdf_modal.hide()"
        ) 關閉

    .w-100(style="height: 72vh; background-color: #525659;")
      iframe(
        v-if="previewingItem"
        :src="downloadPDFUrl(previewingItem.number)"
        style="width: 100%; height: 100%; border: none;"
      )
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'

export default {
  fetchOnServer: false,
  mixins: [dynamicHeight],
  data: () => ({
    keyword: '',
    editRecord: null,
    previewingItem: null,
    rows: [],
    viewMode: 'table', // 'table' or 'card'
    currentStatusFilter: 'all', // 'all', 'valid', 'expiring', 'overdue'
    dateFilterPreset: 'pastYear',
    datePickerKey: 0,
    queryBeginDate: (() => {
      const d = new Date()
      d.setFullYear(d.getFullYear() - 1)
      return d
    })(),
    queryEndDate: new Date(),
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
        key: 'status',
        label: '狀態 / 期限',
        sortable: false,
        thStyle: { width: '135px' }
      },
      {
        key: '操作',
        thStyle: { width: '100px' }
      },
      {
        key: 'number',
        label: '收件字號',
        sortable: true,
        thStyle: { width: '140px' }
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
        thStyle: { width: '130px' }
      },
      {
        key: 'createtime',
        label: '收件日期',
        sortable: true,
        thStyle: { width: '110px' }
      },
      {
        key: 'endtime',
        label: '預約截止日期',
        sortable: true,
        thStyle: { width: '110px' }
      },
      {
        key: 'note',
        label: '備註',
        sortable: false,
        thStyle: { minWidth: '200px' }
      }
    ]
  }),
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
        start_ts: +this.$utils.twToAdDateObj(this.dateRange.begin) / 1000,
        end_ts: +this.$utils.twToAdDateObj(this.dateRange.end) / 1000
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) {
          this.rows = [...data.raw]
        }
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
    presetLabel () {
      switch (this.dateFilterPreset) {
        case 'pastYear': return '近 1 年'
        case 'thisYear': return '本年度'
        case 'pastSixMonths': return '近半年'
        case 'all': return '全期間'
        default: return '時間範圍'
      }
    },
    dataReady () {
      return this.rows.length > 0
    },
    validCount () {
      return this.rows.filter(r => this.getItemStatus(r) === 'valid').length
    },
    expiringCount () {
      return this.rows.filter(r => this.getItemStatus(r) === 'expiring').length
    },
    overdueCount () {
      return this.rows.filter(r => this.getItemStatus(r) === 'overdue').length
    },
    displayedRows () {
      if (this.currentStatusFilter === 'all') {
        return this.rows
      }
      return this.rows.filter(row => this.getItemStatus(row) === this.currentStatusFilter)
    },
    paginatedCards () {
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage
      return this.displayedRows.slice(start, start + this.pagination.perPage)
    },
    queryCount () {
      return this.displayedRows.length
    },
    foundText () {
      const filterName = {
        all: '',
        valid: '【有效中】',
        expiring: '【即將到期】',
        overdue: '【已逾期】'
      }[this.currentStatusFilter] || ''

      const message = `${this.dateRange.begin} ~ ${this.dateRange.end} 找到 ${this.queryCount} 筆「檔案應用預約」資料 ${filterName}`
      return this.$utils.empty(this.keyword) ? message : `${message}【關鍵字：${this.keyword}】`
    },
    daysPeriod () {
      return this.dateRange.days || 0
    },
    isWrongDaysPeriod () {
      return this.daysPeriod < 1
    },
    xlsxData () {
      return this.displayedRows.map((data, idx) => ({
        序號: data.id || (idx + 1),
        狀態: this.getStatusText(data),
        剩餘天數: this.getRemainingDays(data),
        收件字號: data.number,
        統編: data.pid,
        申請人: data.pname,
        收件日期: this.$utils.toADDate(data.createtime * 1000, 'yyyy-LL-dd'),
        預約截止日期: this.$utils.toADDate(data.endtime * 1000, 'yyyy-LL-dd'),
        備註: data.note || ''
      }))
    }
  },
  watch: {
    currentStatusFilter () {
      this.pagination.currentPage = 1
    },
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期')
      }
    }
  },
  methods: {
    setPreset (preset) {
      this.dateFilterPreset = preset
      const now = new Date()
      let begin = new Date()
      let end = new Date()
      if (preset === 'pastYear') {
        begin.setFullYear(begin.getFullYear() - 1)
      } else if (preset === 'thisYear') {
        begin = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
      } else if (preset === 'pastSixMonths') {
        begin.setMonth(begin.getMonth() - 6)
      } else if (preset === 'all') {
        begin = new Date(2024, 1, 1)
      }
      this.queryBeginDate = begin
      this.queryEndDate = end
      this.datePickerKey++
      this.timeout(this.$fetch, 200)
    },
    getRemainingDays (item) {
      if (!item || !item.endtime) {
        return 0
      }
      const now = Math.floor(Date.now() / 1000)
      const diffSec = item.endtime - now
      return Math.ceil(diffSec / 86400)
    },
    getItemStatus (item) {
      const days = this.getRemainingDays(item)
      if (days < 0) {
        return 'overdue'
      }
      if (days <= 30) {
        return 'expiring'
      }
      return 'valid'
    },
    getStatusVariant (item) {
      const status = this.getItemStatus(item)
      if (status === 'overdue') {
        return 'danger'
      }
      if (status === 'expiring') {
        return 'warning'
      }
      return 'success'
    },
    getStatusText (item) {
      const status = this.getItemStatus(item)
      const days = this.getRemainingDays(item)
      if (status === 'overdue') {
        return `已逾期 (${Math.abs(days)} 天)`
      }
      if (status === 'expiring') {
        return `即將到期 (剩 ${days} 天)`
      }
      return `有效中 (剩 ${days} 天)`
    },
    openPdfModal (item) {
      this.previewingItem = item
      this.$refs.pdf_modal?.show()
    },
    handleAdd (payload) {
      this.rows.unshift({
        id: payload.id,
        createtime: payload.createtime,
        pid: payload.pid,
        pname: payload.pname,
        endtime: payload.endtime,
        note: payload.note,
        number: payload.number
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
      const found = this.rows.find(item => item.id === payload.id)
      if (found) {
        found.pid = payload.pid
        found.pname = payload.pname
        found.note = payload.note
        found.endtime = payload.endtime
      }
    },
    remove (item) {
      this.confirm(`
        請確認是否要刪除本筆預約申請資料？<br/>
        案號：${item.number}<br/>
        統編：${item.pid}<br/>
        姓名：${item.pname}
      `).then((YN) => {
        if (YN) {
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
      this.pagination.currentPage = 1
    },
    downloadPDFUrl (number) {
      return `http://${this.apiHost}:${this.apiPort}/get_adm_reserve_pdf.php?number=${number}`
    },
    handleNumberText (cid) {
      if (this.$utils.empty(cid)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        cid = this.$utils.highlight(cid, this.keyword, 'highlight-yellow')
      }
      return cid
    },
    handleFidText (fid) {
      if (this.$utils.empty(fid)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        fid = this.$utils.highlight(fid, this.keyword, 'highlight-yellow')
      }
      return fid
    },
    handleFnameText (fname) {
      if (this.$utils.empty(fname)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        fname = this.$utils.highlight(fname, this.keyword, 'highlight-yellow')
      }
      return fname
    },
    handleNoteText (note) {
      if (this.$utils.empty(note)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        note = this.$utils.highlight(note, this.keyword, 'highlight-yellow')
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
.card-item {
  transition: transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
  }
}
.note-box {
  min-height: 48px;
  max-height: 80px;
  overflow-y: auto;
  word-break: break-all;
}
.font-mono {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
