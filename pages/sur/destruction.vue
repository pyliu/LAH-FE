<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto
          lah-fa-icon(icon="house-chimney-crack", append, variant="danger") 逕辦建物滅失控管 ({{ queryCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="$refs.help_modal.show()" title="說明")
        lah-help-modal(ref="help_modal")
          h5 新建控管資料說明
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
            li 輸入必要資訊【發文日期、字號、地段、建號 ... 等】
            li 建議輸入備註說明以供後續搜尋使用
            li 選取掃描的PDF檔案(必要)
            li 點擊上傳按鈕並等待完成
          hr
          h5 搜尋說明
          ol
            li 鍵入關鍵字
            li 點擊 #[lah-fa-icon(icon="search" variant="dark") 搜尋]
          hr
          h5 即時通說明
          ol
            li 案件到期7天前會每日發送一封訊息至測量課頻道
            li 已完成之案件請勾選「辦畢」，免除追蹤
      .d-flex.small
        lah-datepicker(
          v-model="dateRange",
          :begin="firstDayOf2024Nov"
        )
        //- b-input.h-100.mx-1(
        //-   v-model="keyword",
        //-   placeholder="關鍵字...",
        //-   @keyup.enter="$fetch"
        //- )
        lah-button.ml-1(
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
          title="新建逕辦建物滅失追蹤資料"
          :disabled="isBusy"
          @click="$refs.add.show()"
          no-icon-gutter
        )
        lah-button-xlsx(
          :jsons="xlsxData"
          header="逕辦建物滅失資料查詢"
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
          :href="downloadPDFUrl(item)",
          target="_blank",
          title="檢視電子檔",
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
    template(#cell(done)="{ item }")
      b-checkbox.mt-1(
        v-model="item.done",
        @change="switchDone(item)",
        :disabled="isBusy",
        switch
      ) 辦畢
    template(#cell(issue_date)="{ item }")
      .mx-auto {{ $utils.addDateDivider(item.issue_date) }}
    template(#cell(apply_date)="{ item }")
      .mx-auto {{ $utils.addDateDivider(item.apply_date) }}
    template(#cell(section_code)="{ item }")
      span {{ sectionMap.get(item.section_code) }}
    template(#cell(land_number)="{ item }")
      span {{ $utils.formatLandNumber(item.land_number) }}
    template(#cell(building_number)="{ item }")
      span {{ $utils.formatBuildNumber(item.building_number) }}
    template(#cell(note)="{ item }")
      .text-left(v-html="handleHighlightText(item.note)")
    template(#cell(address)="{ item }")
      .text-left(v-html="handleHighlightText(item.address)")
    template(#cell(occupancy_permit)="{ item }")
      .text-left(v-html="handleHighlightText(item.occupancy_permit)")
    template(#cell(construction_permit)="{ item }")
      .text-left(v-html="handleHighlightText(item.construction_permit)")

  b-modal(
    ref="add",
    hide-footer,
    no-close-on-backdrop,
    scrollable,
    size="lg"
  )
    template(#modal-title) 新增逕辦建物滅失追蹤資料
    lah-sur-destruction-tracking-case-ui(
      @close="$refs.add.hide()",
      @add="handleAdd"
    )

  b-modal(
    ref="edit",
    hide-footer,
    no-close-on-backdrop,
    scrollable,
    size="lg"
  )
    template(#modal-title) 修改逕辦建物滅失追蹤資料
    lah-sur-destruction-tracking-case-ui(
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
        label: '發文字號',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'issue_date',
        label: '發文日期',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'apply_date',
        label: '申請日期',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'section_code',
        label: '地段',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'land_number',
        label: '地號',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'building_number',
        label: '建號',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'address',
        label: '拆除地址',
        sortable: true,
        thStyle: { width: '300px' }
      },
      {
        key: 'occupancy_permit',
        label: '使用執照',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'construction_permit',
        label: '建築執照',
        sortable: true,
        thStyle: { width: '150px' }
      }
      // {
      //   key: 'done',
      //   label: '辦畢',
      //   sortable: false
      // },
      // {
      //   key: 'note',
      //   label: '備註',
      //   sortable: false,
      //   thStyle: { width: '300px' }
      // }
    ],
    sectionMap: new Map(),
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
      this.$axios.post(this.$consts.API.JSON.SUR, {
        type: 'destruction_tracking_list',
        keyword: this.keyword,
        // convert to PHP timestamp which is in seconds
        tw_start: this.dateRange.begin,
        tw_end: this.dateRange.end
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
    title: '逕辦建物滅失控管-桃園市地政局'
  },
  computed: {
    firstDayOf2024Nov () {
      return new Date(2024, 10, 1)
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
  created () {
    this.loadSectionMap()
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    loadSectionMap () {
      // prepare sections options
      this.$axios.post(this.$consts.API.JSON.MOIADM, {
        type: 'host_sections'
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          data.raw.forEach((element) => {
            this.sectionMap.set(element.code, element.name)
          })
          this.$utils.warn(`已準備 ${this.sectionMap.size} 筆段代碼對應表`)
        } else {
          this.warning(data.message)
        }
      }).catch((e) => {
        this.$utils.error(e)
      }).finally(() => {
      })
    },
    handleAdd (payload) {
      // add to array head
      this.rows.unshift({
        id: payload.id,
        updatetime: payload.updatetime,
        number: payload.number,
        issue_date: payload.issue_date,
        apply_date: payload.apply_date,
        section_code: payload.section_code,
        land_number: payload.land_number,
        building_number: payload.building_number,
        address: payload.address,
        occupancy_permit: payload.occupancy_permit,
        construction_permit: payload.construction_permit,
        note: payload.note,
        done: payload.done
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
      this.$utils.warn(payload)
      // update latest data to rows
      const found = this.rows.find((item, idx, array) => {
        return item.id === payload.id
      })
      if (found) {
        found.issue_date = payload.issue_date
        found.apply_date = payload.apply_date
        found.section_code = payload.section_code
        found.land_number = this.$utils.formatLandNumber(payload.land_number)
        found.building_number = this.$utils.formatBuildNumber(payload.building_number)
        found.address = payload.address
        found.occupancy_permit = payload.occupancy_permit
        found.construction_permit = payload.construction_permit
        found.done = payload.done
        found.note = payload.note
      }
    },
    remove (item) {
      this.confirm(`
        請確認是否要刪除本筆資料？<br/>
        字號：${item.number}<br/>
        發文日期：${this.$utils.addDateDivider(item.issue_date)}<br/>
      `).then((YN) => {
        if (YN) {
          // remove_foreigner_pdf
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.SUR, {
            type: 'remove_destruction_tracking',
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
    downloadPDFUrl (item) {
      return `http://${this.apiHost}:${this.apiPort}/get_sur_destruction_pdf.php?id=${item.id}`
    },
    handleHighlightText (text) {
      if (this.$utils.empty(text)) {
        return ''
      }
      if (!this.$utils.empty(this.keyword)) {
        text = this.$utils.highlight(
          text,
          this.keyword,
          'highlight-yellow'
        )
      }
      return text
    },
    handleNoteText (note) {
      const tmp = this.handleHighlightText(note)
      return tmp.replace(/(\n|\r\n)/g, '<br/>')
    },
    switchDone (item) {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.SUR, {
        type: 'switch_done_destruction_tracking',
        id: item?.id,
        done: item.done
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.success(data.message)
        } else {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.content-max-width {
  max-width: 300px;
}
</style>
