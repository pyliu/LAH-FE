<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 住址隱匿收件管理 ({{ queryCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 功能說明
          ol
            li: .d-flex.align-items-center
              span 點選新增按鈕
              lah-button.mx-1(
                icon="plus",
                variant="outline-primary",
                no-icon-gutter,
                @click="showAdd"
              )
              span 開啟新增介面
            li 輸入必要資訊【申請人、收件類型、收件案號】
            li 可輸入備註說明以供後續搜尋使用【搜尋欄位：申請人、收件案號、備註】
            li 點擊儲存按鈕完成新增
          hr
          h5 搜尋說明
          ol
            li 選擇查詢區間(預設為本年度)
            li 鍵入關鍵字(非必要，搜尋申請人/收件案號/備註)
            li 點擊 #[lah-fa-icon(icon="search" variant="dark") 搜尋]
          hr
          h5 收件類型說明
          ul
            li
              b-badge.mr-1(variant="secondary") 0
              span 臨櫃：直接到櫃申請，不需要案號
            li
              b-badge.mr-1(variant="danger") 1
              span 隨案：隨案申請，需要輸入案件號（如 115-HA81-012350）

      .d-flex.small
        lah-datepicker(
          v-model="dateRange"
        )
        b-input.h-100.mx-1(
          v-model="keyword",
          placeholder="關鍵字...(申請人/案號/備註)",
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
          icon="plus"
          size="lg"
          title="新增住址隱匿案件"
          :disabled="isBusy"
          @click="showAdd"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData"
          header="住址隱匿收件管理"
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
    @row-contextmenu="onRowContextMenu"
  )
    template(#table-busy): span.ld-txt 讀取中...
    template(#cell(serial_no)="{ item }")
      .text-center {{ item.serial_no }}
    template(#cell(receiving_type)="{ item }")
      b-badge(:variant="receivingTypeVariant(item.receiving_type)") {{ receivingTypeLabel(item.receiving_type) }}
    template(#cell(receiving_caseno)="{ item }")
      .text-left
        b-link(v-if="item.receiving_caseno" href="#" @click.prevent="showDetail(item.receiving_caseno)")
          span(v-html="highlightText(item.receiving_caseno)")
        span.text-muted(v-else) (無)
    template(#cell(applicant)="{ item }")
      .text-center(v-html="highlightText(item.applicant)")
    template(#cell(note)="{ item }")
      .text-left(v-html="handleNoteText(item.note)")
    template(#cell(createtime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(modifytime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.modifytime * 1000) }}

  //- 右鍵選單
  transition(name="ctx-fade")
    .ctx-menu(
      v-if="contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    )
      .ctx-menu-item(@click="ctxEdit")
        lah-fa-icon.mr-2(icon="pen-to-square")
        span 編輯
      .ctx-menu-divider
      .ctx-menu-item.text-danger(@click="ctxDelete")
        lah-fa-icon.mr-2(icon="trash-can" variant="danger")
        span 刪除
  //- 案件詳情 Modal
  b-modal(
    ref="detail_modal",
    hide-footer,
    no-close-on-backdrop,
    size="xl",
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ clickedCaseno }}
    h4.text-center.text-info.my-5(v-if="detailLoading")
      b-spinner.mr-2(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(
      v-show="!detailLoading",
      :case-id="clickedCaseno",
      @ready="detailLoading = !$event.detail"
    )
  b-modal(
    ref="add_modal",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 新增住址隱匿案件
    .p-2
      b-form(@submit.prevent="submitAdd")
        b-form-group(label="收件類型" label-cols="3")
          b-select(
            v-model="form.receiving_type",
            :options="receivingTypeOptions",
            @change="onAddTypeChange"
          )
        b-form-group(label="收件案號" label-cols="3" v-if="form.receiving_type === 1")
          .d-flex
            b-input.flex-grow-1(
              v-model="form.receiving_caseno",
              placeholder="如：115-HA81-012350",
              :state="addCasenoState",
              @blur="onAddCasenoBlur"
            )
            lah-button.ml-1(
              icon="magnifying-glass",
              variant="outline-info",
              no-icon-gutter,
              title="查詢案件人員",
              :disabled="caseApplicantsBusy || addCasenoState !== true",
              @click="fetchCaseApplicants('add')"
            )
          b-form-invalid-feedback(:state="addCasenoState") {{ casenoErrorMsg(form.receiving_caseno) }}
          //- 查詢結果選單
          b-list-group.mt-1(v-if="caseApplicants.length > 0")
            b-list-group-item.py-1.px-2(
              v-for="(p, i) in caseApplicants"
              :key="i"
              button
              @click="selectApplicant('add', p)"
            )
              .d-flex.align-items-center
                b-badge.mr-2(:variant="p.role === '代理人' ? 'warning' : 'info'" pill) {{ p.role }}
                span {{ p.name }}
                small.ml-1.text-muted(v-if="p.id_no") {{ p.id_no }}
        b-form-group(label="申請人 *" label-cols="3")
          b-input(
            v-model="form.applicant",
            placeholder="請輸入申請人姓名",
            :state="form.applicant.length > 0 ? true : null",
            required
          )
        b-form-group(label="備註" label-cols="3")
          b-textarea(
            v-model="form.note",
            placeholder="備註說明...",
            rows="3"
          )
        .d-flex.justify-content-end.mt-3
          lah-button.mr-2(
            variant="outline-secondary",
            icon="xmark",
            @click="$refs.add_modal.hide()"
          ) 取消
          lah-button(
            type="submit",
            icon="floppy-disk",
            variant="primary",
            :disabled="isBusy || !form.applicant || addCasenoState === false"
          ) 儲存

  //- 編輯 Modal
  b-modal(
    ref="edit_modal",
    hide-footer,
    no-close-on-backdrop,
    scrollable
  )
    template(#modal-title) 修改住址隱匿案件
    .p-2(v-if="editRecord")
      b-form(@submit.prevent="submitEdit")
        b-form-group(label="收件類型" label-cols="3")
          b-select(
            v-model="editForm.receiving_type",
            :options="receivingTypeOptions",
            @change="onEditTypeChange"
          )
        b-form-group(label="收件案號" label-cols="3" v-if="editForm.receiving_type === 1")
          .d-flex
            b-input.flex-grow-1(
              v-model="editForm.receiving_caseno",
              placeholder="如：115-HA81-012350",
              :state="editCasenoState",
              @blur="onEditCasenoBlur"
            )
            lah-button.ml-1(
              icon="magnifying-glass",
              variant="outline-info",
              no-icon-gutter,
              title="查詢案件人員",
              :disabled="caseApplicantsBusy || editCasenoState !== true",
              @click="fetchCaseApplicants('edit')"
            )
          b-form-invalid-feedback(:state="editCasenoState") {{ casenoErrorMsg(editForm.receiving_caseno) }}
          //- 查詢結果選單
          b-list-group.mt-1(v-if="caseApplicants.length > 0")
            b-list-group-item.py-1.px-2(
              v-for="(p, i) in caseApplicants"
              :key="i"
              button
              @click="selectApplicant('edit', p)"
            )
              .d-flex.align-items-center
                b-badge.mr-2(:variant="p.role === '代理人' ? 'warning' : 'info'" pill) {{ p.role }}
                span {{ p.name }}
                small.ml-1.text-muted(v-if="p.id_no") {{ p.id_no }}
        b-form-group(label="申請人 *" label-cols="3")
          b-input(
            v-model="editForm.applicant",
            placeholder="請輸入申請人姓名",
            :state="editForm.applicant.length > 0 ? true : null",
            required
          )
        b-form-group(label="備註" label-cols="3")
          b-textarea(
            v-model="editForm.note",
            placeholder="備註說明...",
            rows="3"
          )
        .d-flex.justify-content-end.mt-3
          lah-button.mr-2(
            variant="outline-secondary",
            icon="xmark",
            @click="$refs.edit_modal.hide()"
          ) 取消
          lah-button(
            type="submit",
            icon="floppy-disk",
            variant="warning",
            :disabled="isBusy || !editForm.applicant || editCasenoState === false"
          ) 更新
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'
import lahRegCaseDetail from '~/components/lah-reg-case-detail.vue'

export default {
  components: { lahRegCaseDetail },
  fetchOnServer: false,
  mixins: [dynamicHeight],
  data: () => ({
    keyword: '',
    editRecord: null,
    clickedCaseno: '',
    detailLoading: false,
    rows: [],
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      item: null
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    form: {
      applicant: '',
      receiving_type: 0,
      receiving_caseno: '',
      note: ''
    },
    editForm: {
      applicant: '',
      receiving_type: 0,
      receiving_caseno: '',
      note: ''
    },
    caseApplicants: [],
    caseApplicantsBusy: false,
    receivingTypeMap: {
      0: '臨櫃',
      1: '隨案'
    },
    fields: [
      {
        key: 'serial_no',
        label: '編號',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'applicant',
        label: '申請人',
        sortable: true,
        thStyle: { width: '130px' }
      },
      {
        key: 'receiving_type',
        label: '收件類型',
        sortable: true,
        thStyle: { width: '90px' }
      },
      {
        key: 'receiving_caseno',
        label: '案件號',
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
        key: 'modifytime',
        label: '修改時間',
        sortable: true,
        thStyle: { width: '185px' }
      },
      {
        key: 'note',
        label: '備註',
        sortable: false,
        thStyle: { width: '270px' }
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
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'address_undisclosed_list',
        keyword: this.keyword,
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
    title: '住址隱匿收件管理-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.rows.length },
    foundText () {
      const message = `${this.dateRange.begin} ~ ${this.dateRange.end} 找到 ${this.queryCount} 筆「住址隱匿」資料`
      return this.$utils.empty(this.keyword) ? message : `${message}【關鍵字：${this.keyword}】`
    },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    receivingTypeOptions () {
      return Object.entries(this.receivingTypeMap).map(([val, text]) => ({
        value: parseInt(val),
        text
      }))
    },
    xlsxData () {
      const fieldKeys = this.fields.map(field => field.key)
      return this.rows.map((data) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            const label = this.getLabel(key)
            if (key === 'createtime') {
              obj[label] = this.$utils.toADDate(value * 1000, 'yyyy-LL-dd')
            } else if (key === 'modifytime') {
              obj[label] = this.$utils.toADDate(value * 1000)
            } else if (key === 'receiving_type') {
              obj[label] = this.receivingTypeLabel(value)
            } else {
              obj[label] = value
            }
          }
        }
        return obj
      })
    },
    addCasenoState () {
      if (!this.form.receiving_caseno || this.form.receiving_type !== 1) { return null }
      return this.isCasenoValid(this.form.receiving_caseno)
    },
    editCasenoState () {
      if (!this.editForm.receiving_caseno || this.editForm.receiving_type !== 1) { return null }
      return this.isCasenoValid(this.editForm.receiving_caseno)
    }
  },
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期')
      }
    },
    editRecord (record) {
      if (record) {
        this.editForm.applicant = record.applicant || ''
        this.editForm.receiving_type = parseInt(record.receiving_type) || 0
        // 臨櫃類型時自動清空案件號
        this.editForm.receiving_caseno = this.editForm.receiving_type === 1 ? (record.receiving_caseno || '') : ''
        this.editForm.note = record.note || ''
      }
    }
  },
  mounted () {
    document.addEventListener('click', this.hideContextMenu)
    document.addEventListener('keydown', this.onKeyDown)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.hideContextMenu)
    document.removeEventListener('keydown', this.onKeyDown)
  },
  methods: {
    showDetail (caseno) {
      this.clickedCaseno = caseno
      this.detailLoading = true
      this.$refs.detail_modal.show()
    },
    showAdd () {
      this.form.applicant = ''
      this.form.receiving_type = 0
      this.form.receiving_caseno = ''
      this.form.note = ''
      this.caseApplicants = []
      this.$refs.add_modal.show()
    },
    onAddTypeChange (val) {
      if (val !== 1) {
        this.form.receiving_caseno = ''
        this.caseApplicants = []
      }
    },
    onEditTypeChange (val) {
      if (val !== 1) { this.editForm.receiving_caseno = '' }
    },
    fetchCaseApplicants (formKey) {
      const caseno = formKey === 'add' ? this.form.receiving_caseno : this.editForm.receiving_caseno
      if (!caseno) { return }
      this.caseApplicants = []
      this.caseApplicantsBusy = true
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'get_case_applicants',
        caseno
      }).then(({ data }) => {
        if (Array.isArray(data.applicants) && data.applicants.length > 0) {
          this.caseApplicants = data.applicants
        } else {
          this.notify('查無代理人或權利人資料', { type: 'warning' })
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.caseApplicantsBusy = false
      })
    },
    selectApplicant (formKey, person) {
      const target = formKey === 'add' ? this.form : this.editForm
      target.applicant = person.name
      this.caseApplicants = []
    },
    isCasenoValid (caseno) {
      if (!caseno) { return null }
      const raw = caseno.replace(/-/g, '')
      if (raw.length !== 13) { return false }
      const yearPart = raw.substring(0, 3)
      if (!/^\d{3}$/.test(yearPart)) { return false }
      const year = parseInt(yearPart)
      const currentRocYear = new Date().getFullYear() - 1911
      if (year > currentRocYear) { return false }
      const midPart = raw.substring(3, 7)
      if (!/^[a-zA-Z0-9]{4}$/.test(midPart)) { return false }
      const seqPart = raw.substring(7)
      if (!/^\d{6}$/.test(seqPart)) { return false }
      return true
    },
    casenoErrorMsg (caseno) {
      if (!caseno) { return '' }
      const raw = caseno.replace(/-/g, '')
      if (raw.length !== 13) { return `格式應為 XXX-XXXX-XXXXXX（目前去除「-」後共 ${raw.length}/13 碼）` }
      const yearPart = raw.substring(0, 3)
      if (!/^\d{3}$/.test(yearPart)) { return '前3碼應為民國年度數字' }
      const year = parseInt(yearPart)
      const currentRocYear = new Date().getFullYear() - 1911
      if (year > currentRocYear) { return `民國年度不可超過 ${currentRocYear} 年` }
      const midPart = raw.substring(3, 7)
      if (!/^[a-zA-Z0-9]{4}$/.test(midPart)) { return '中間4碼應為英數字組合（如 HA81）' }
      const seqPart = raw.substring(7)
      if (!/^\d{6}$/.test(seqPart)) { return '後6碼應為純數字' }
      return ''
    },
    formatCaseno (caseno) {
      if (!caseno) { return '' }
      // 移除所有 - 並轉大寫
      const raw = caseno.replace(/-/g, '').toUpperCase()
      // 取前3碼作為年度
      const yearRaw = raw.substring(0, 3).replace(/\D/g, '')
      if (!yearRaw) { return caseno }
      const currentRocYear = new Date().getFullYear() - 1911
      const yearNum = Math.min(parseInt(yearRaw) || 0, currentRocYear)
      const yearStr = String(yearNum).padStart(3, '0')
      // 中間4碼英數
      const midStr = raw.substring(3, 7)
      if (midStr.length < 4) { return `${yearStr}-${midStr}` }
      // 後面取數字部分，補0至6碼
      const seqRaw = raw.substring(7).replace(/\D/g, '')
      const seqStr = seqRaw.padStart(6, '0').slice(-6)
      return `${yearStr}-${midStr}-${seqStr}`
    },
    onAddCasenoBlur () {
      if (this.form.receiving_caseno) {
        this.form.receiving_caseno = this.formatCaseno(this.form.receiving_caseno)
      }
    },
    onEditCasenoBlur () {
      if (this.editForm.receiving_caseno) {
        this.editForm.receiving_caseno = this.formatCaseno(this.editForm.receiving_caseno)
      }
    },
    onRowContextMenu (item, index, event) {
      event.preventDefault()
      this.contextMenu.item = item
      // 避免選單超出視窗右側
      const menuW = 160
      const x = event.clientX + menuW > window.innerWidth ? event.clientX - menuW : event.clientX
      this.contextMenu.x = x
      this.contextMenu.y = event.clientY
      this.contextMenu.show = true
    },
    hideContextMenu () {
      this.contextMenu.show = false
    },
    onKeyDown (e) {
      if (e.key === 'Escape') { this.hideContextMenu() }
    },
    ctxEdit () {
      this.hideContextMenu()
      if (this.contextMenu.item) { this.popupEdit(this.contextMenu.item) }
    },
    ctxDelete () {
      this.hideContextMenu()
      if (this.contextMenu.item) { this.remove(this.contextMenu.item) }
    },
    submitAdd () {
      this.isBusy = true
      let success = false
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'add_address_undisclosed',
        data: {
          applicant: this.form.applicant,
          receiving_type: this.form.receiving_type,
          receiving_caseno: this.form.receiving_caseno,
          note: this.form.note
        }
      }).then(({ data }) => {
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
        if (this.$utils.statusCheck(data.status)) {
          this.$refs.add_modal.hide()
          success = true
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
        if (success) { this.$fetch() }
      })
    },
    rowSelected (items) {
      if (Array.isArray(items) && items.length > 0) {
        this.popupEdit(items[0])
      }
    },
    popupEdit (record) {
      this.editRecord = record
      this.caseApplicants = []
      this.$refs.edit_modal?.show()
    },
    submitEdit () {
      if (!this.editRecord) { return }
      this.isBusy = true
      let success = false
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'edit_address_undisclosed',
        id: this.editRecord.id,
        data: {
          applicant: this.editForm.applicant,
          receiving_type: this.editForm.receiving_type,
          receiving_caseno: this.editForm.receiving_caseno,
          note: this.editForm.note
        }
      }).then(({ data }) => {
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
        if (this.$utils.statusCheck(data.status)) {
          this.$refs.edit_modal.hide()
          success = true
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
        if (success) { this.$fetch() }
      })
    },
    remove (item) {
      this.confirm(`
        請確認是否要刪除本筆資料？<br/>
        申請人：${item.applicant}<br/>
        收件類型：${this.receivingTypeLabel(item.receiving_type)}<br/>
        收件案號：${item.receiving_caseno || '(無)'}
      `).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'remove_address_undisclosed',
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
      const found = this.fields.find(item => this.$utils.equal(item.key, key))
      if (found && found.label) {
        return found.label
      }
      return key
    },
    receivingTypeLabel (val) {
      return this.receivingTypeMap[val] || `類型${val}`
    },
    receivingTypeVariant (val) {
      const map = {
        0: 'secondary',
        1: 'danger'
      }
      return map[val] || 'light'
    },
    highlightText (text) {
      if (this.$utils.empty(text)) { return '' }
      if (!this.$utils.empty(this.keyword)) {
        return this.$utils.highlight(text, this.keyword, 'highlight-yellow')
      }
      return text
    },
    handleNoteText (note) {
      if (this.$utils.empty(note)) { return '' }
      if (!this.$utils.empty(this.keyword)) {
        note = this.$utils.highlight(note, this.keyword, 'highlight-yellow')
      }
      return note.replace(/(\n|\r\n)/g, '<br/>')
    }
  }
}
</script>

<style lang="scss" scoped>
.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  overflow: hidden;

  .ctx-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: background 0.15s;

    &:hover {
      background: #f0f0f0;
    }
  }

  .ctx-menu-divider {
    height: 1px;
    background: #dee2e6;
    margin: 2px 0;
  }
}

.ctx-fade-enter-active,
.ctx-fade-leave-active {
  transition: opacity 0.1s;
}
.ctx-fade-enter,
.ctx-fade-leave-to {
  opacity: 0;
}
</style>