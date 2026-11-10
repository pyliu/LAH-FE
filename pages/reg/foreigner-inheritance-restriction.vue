<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 外國人繼承管制清冊
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          ul
            li: .d-flex.align-items-center
              .mr-1 請使用
              lah-button(icon="edit", size="sm", no-icon-gutter)
              .ml-1 編輯按紐進行管制資料登錄/修改
            li 查詢系統內其他登記事項註記符合下列情況案件。
              ul
                li 「00」（一般註記事項）註記內含「 ... 移轉與 ... 」
                li 範例：本筆土地應於０００年０月０日前移轉與本國人，逾期辦理公開標售
            li 狀態說明
              ul
                li 🔴 - 已逾期，須盡速辦理
                  ul
                    li: .font-weight-bold 「GP」(列冊管理期滿)註記內不含「 ... 移請 ... 」
                    li: .font-weight-bold 範例：「．．．移請財政部國有財產署公開標售。」
                li 🟡 - 請進行通知作業
                li 🟢 - 正常，未到期或已辦畢
                li ⚪ - 已註銷
            li 通知接收功能僅限有安裝桃園即時通的使用者
            li ⭐PDF連結功能必須有該案登記收件字號並且於「#[b-link(to="/reg/foreigner") 外國人掃描資料]」頁面上傳建檔後始能正常開啟。
      .d-flex
        //- lah-button-xlsx.mr-1(
        //-   :jsons="xlsx17Data",
        //-   header="依土地法第17條第1項各款規定管制清冊",
        //-   variant="primary",
        //-   :no-icon-gutter="false"
        //- ) 依規定({{ xlsx17DataCount }})
        //- lah-button-xlsx.mr-1(
        //-   :jsons="xlsxNot17Data",
        //-   header="依土地法第17條第1項各款以外規定管制清冊",
        //-   :no-icon-gutter="false"
        //- ) 依規定各款以外({{ xlsxNot17DataCount }})
        lah-button-xlsx-foreigner-restriction.mr-1(
          :jsons="xlsx17Data",
          :no-icon-gutter="false",
          variant="outline-primary",
          header="土地法第17條第1項規定管制清冊",
          title="匯出依土地法第17條第1項規定管制清冊",
          is17
        ) 管制清冊({{ xlsx17DataCount }})
        lah-button-xlsx-foreigner-restriction.mr-1(
          :jsons="xlsxNot17Data",
          :no-icon-gutter="false",
          header="土地法第17條第1項各款以外規定管制清冊",
          title="匯出依土地法第17條第1項各款以外規定管制清冊"
        ) 新加坡管制清冊({{ xlsxNot17DataCount }})
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :disabled="isBusy"
          :busy="isBusy"
          :milliseconds="cachedMs"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )
  lah-transition: b-table(
    ref="restriction",
    v-if="committed",
    head-variant="dark",
    select-mode="single",
    selected-variant="success",
    :busy="isBusy",
    :items="filteredData",
    :fields="fields",
    :borderless="false",
    :outlined="false",
    @row-clicked="rowClicked",
    caption-top,
    hover,
    striped,
    bordered,
    small,
    no-border-collapse,
    selectable,
    responsive="md"
  )
    template(#cell(light)="row")
      .text-center {{ light(row.item) }}
    template(#cell(op)="row"): .text-center
      b-button-group(size="md")
        lah-button.border-0(
          icon="file-pdf",
          variant="outline-primary",
          title="查看PDF掃描檔",
          size="md",
          @click="openPdf(row.item)",
          :class="row.item.hasPDF ? [] : ['invisible']"
          no-icon-gutter,
          regular,
          v-b-tooltip.hover.righttop="pdfTooltip(row.item)"
        )
        lah-button.border-0(
          :icon="row.detailsShowing ? 'folder-open' : 'folder-closed'",
          :variant="row.detailsShowing ? 'primary' : 'outline-primary'",
          size="md",
          :title="row.detailsShowing ? '關閉詳細資料' : '顯示詳細資料'",
          @click="toggle(row)",
          no-icon-gutter
        )
        lah-button.border-0(
          icon="edit",
          title="編輯詳細管制資料",
          size="md",
          @click="popupEdit(row.item)",
          no-icon-gutter
        )
    template(#cell(deadline)="{ item, index, rowSelected }")
      .text-nowrap {{ deadline(item) }}
    template(#cell(BA48)="{ item }")
      .text-nowrap(:title="item.BA48") {{ item.BA48_CHT }}
    template(#cell(BA49)="{ item }")
      .text-nowrap {{ $utils.formatLandNumber(item.BA49) }}
    template(#cell(BB05)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.BB05) }}
    template(#cell(BB06)="{ item }")
      div(:title="item.BB06") {{ item.BB06_CHT }}
    template(#cell(BB07)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.BB07) }}
    //- template(#cell(BB09)="{ item }")
    //-   div(:title="item.BB09") {{ item.BB09_CHT }}
    template(#cell(BB15_1)="{ item }")
      div(:title="item.BB15_1") {{ item.BB15_1_CHT }} ({{ equityRatio(item) }})
    template(#cell(LBIR_2)="{ item }")
      .text-nowrap {{ $utils.addDateDivider(item.LBIR_2) }}
    template(#cell(LADR)="row")
      .truncate-mvw {{ row.item.LADR }}
    template(#cell(GG30_2)="row")
      .truncate-mvw {{ row.item.GG30_2 }}
    template(#cell(RESTRICTION_DATA.nation)="row")
      b-link(
        title="開啟編輯視窗",
        @click="popupEdit(row.item)"
      ) {{ row.item.RESTRICTION_DATA.nation }}

    template(#row-details="row")
      lah-transition(appear): lah-foreigner-restriction-detail(:orig-data="row.item")
</template>

<script>
import lahButton from '~/components/lah-button.vue'
import lahForeignerRestrictionEdit from '~/components/lah-foreigner-restriction-edit.vue'
export default {
  components: { lahButton },
  data: () => ({
    forceReload: false,
    committed: false,
    cachedMs: 24 * 60 * 60 * 1000,
    bakedData: [],
    fields: [
      {
        key: 'light',
        label: '狀態',
        sortable: true,
        thStyle: 'text-align:center;width:60px;'
      },
      {
        key: 'op',
        label: '操作',
        thStyle: 'text-align:center;width:140px;'
      },
      {
        key: 'deadline',
        label: '最後期限',
        sortable: true
      },
      {
        key: 'BA48',
        label: '地段',
        sortable: true
      },
      {
        key: 'BA49',
        label: '地號',
        sortable: true
      },
      // {
      //   key: 'BB01',
      //   label: '登記次序',
      //   sortable: true
      // },
      {
        key: 'BB05',
        label: '登記日期',
        sortable: true
      },
      // {
      //   key: 'BB06',
      //   label: '登記原因',
      //   sortable: true
      // },
      {
        key: 'RESTRICTION_DATA.use_partition',
        label: '使用分區',
        sortable: true
      },
      {
        key: 'BB07',
        label: '發生日期',
        sortable: true
      },
      {
        key: 'BB09',
        label: '統編',
        sortable: true
      },
      {
        key: 'BB09_CHT',
        label: '姓名',
        sortable: true
      },
      {
        key: 'RESTRICTION_DATA.nation',
        label: '國籍',
        sortable: true
      },
      {
        key: 'LBIR_2',
        label: '出生日期',
        sortable: true
      },
      // {
      //   key: 'LADR',
      //   label: '住址',
      //   sortable: true
      // },
      {
        key: 'BB15_1',
        label: '權利範圍',
        sortable: true
      },
      {
        key: 'BB16',
        label: '權狀字號',
        sortable: true
      }
      // {
      //   key: 'BB21',
      //   label: '申報地價',
      //   sortable: true
      // },
      // {
      //   key: 'GG30_2',
      //   label: '其他登記事項',
      //   sortable: false
      // }
    ],
    regex: /本筆土地應於[中華民國]*([０１２３４５６７８９]{2,3})年([０１２３４５６７８９]{1,2})月([０１２３４５６７８９]{1,2})日前移轉[於與]本國人/gm,
    doneRegex: /移請財政部國有財產署公開標售/gm
  }),
  fetch () {
    // restore cached data if found
    this.getCache(this.cacheKey).then((json) => {
      if (json === false || this.forceReload) {
        if (this.isBusy) {
          this.warning('讀取中 ... 請稍後')
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_inheritance_restriction',
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            // console.warn(this.bakedData)
            this.notify(data.message, {
              type: this.$utils.statusCheck(data.status) ? 'info' : 'warning',
              subtitle: '外人管制清冊查詢'
            })
            const remainS = data.cache_remaining_time // in seconds
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              if (this.$refs.countdown) {
                this.$refs.countdown.setCountdown(remainMs)
                this.$refs.countdown.startCountdown()
              }
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      } else {
        this.bakedData = json.baked
        this.committed = true
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
          this.notify(`查詢成功，找到 ${this.bakedData.length} 筆外國人管制案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
        })
      }
    })
  },
  head: {
    title: '外國人管制清冊-桃園市地政局'
  },
  fetchOnServer: false,
  computed: {
    dataReady () { return this.bakedData.length > 0 },
    cacheKey () { return 'foreigner-inheritance-restriction' },
    filteredData () {
      return this.bakedData
    },
    filterDataCount () {
      return this.filteredData.length
    },
    keyLabelMap () {
      const keyLabelMap = new Map()
      this.fields.forEach((field, idx, array) => {
        keyLabelMap.set(field.key, field.label || field.key)
      })
      return keyLabelMap
    },
    xlsxAllData () {
      const jsons = this.filteredData.map((data, idx, array) => {
        return this.exportCHTData(data, idx)
      })
      return jsons
    },
    xlsx17Data () {
      const jsons = this.filteredData.filter(element => !this.isControlled(element)).map((data, idx, array) => {
        return this.exportCHTData(data, idx)
      })
      return jsons
    },
    xlsx17DataCount () {
      return this.xlsx17Data?.length || 0
    },
    xlsxNot17Data () {
      const jsons = this.filteredData.filter(element => this.isControlled(element)).map((data, idx, array) => {
        return this.exportCHTData(data, idx)
      })
      return jsons
    },
    xlsxNot17DataCount () {
      return this.xlsxNot17Data?.length || 0
    }
  },
  watch: {
    bakedData (val) {
      // this.$utils.warn(val)
    }
  },
  created () { },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    rowClicked (item, index, event) {
      // console.warn(item, index, event)
      // console.log(this.$refs.restriction.$refs['item-rows'][index])
      // console.log(this.$refs.restriction)
      // row.item && this.toggle(row.item)
    },
    toggle (row) {
      // console.warn(row)
      row?.toggleDetails?.call()
      row?.detailsShowing ? row?.unselectRow?.call() : row?.selectRow?.call()
    },
    formatGG30_2 (str) {
      const arr = str?.split('\n')
      let tmp = `一般註記事項：${arr[0]}`
      if (arr[1]) {
        tmp += `<br/>列冊管理期滿：${arr[1]}`
      }
      return tmp
    },
    extractDueDate (str) {
      const matched = Array.from(str?.matchAll(this.regex))
      /** expect array result
       * 0: 本筆土地應於１１０年９月３日前移轉與本國人"
       * 1: "１１０"
       * 2: "９"
       * 3: "３"
       * groups: undefined
       * index: 0
       * input: "本筆土地應於１１０年９月３日前移轉與本國人，逾期辦理公開標售"
       */
      if (Array.isArray(matched[0])) {
        const year = 1911 + parseInt(this.$utils.convertDBytesNumber(matched[0][1]))
        const month = this.$utils.convertDBytesNumber(matched[0][2]) - 1
        const day = this.$utils.convertDBytesNumber(matched[0][3])
        return new Date(year, month, day)
      }
      return false
    },
    isDone (str) {
      const matched = Array.from(str?.matchAll(this.doneRegex))
      return matched.length > 0
    },
    deadline (item) {
      const d = this.extractDueDate(item.GG30_2)
      if (d) {
        return this.$utils.addDateDivider(this.$utils.twDateStr(d))
      }
      return '無期限'
    },
    light (item) {
      if (this.isLogout(item)) {
        return '⚪'
      } else if (!this.isDone(item.GG30_2)) {
        const dueDate = this.extractDueDate(item.GG30_2)
        if (dueDate) {
          const ts = dueDate.getTime()
          const now = this.$utils.nowTs()
          if (now > ts) {
            return '🔴'
          }
          const offset = ts - now
          if (offset < 6 * 30 * 24 * 60 * 60 * 1000) {
            return '🟡'
          }
        }
      }
      return '🟢'
    },
    popupEdit (item) {
      if (!item.RESTRICTION_DATA) {
        item.RESTRICTION_DATA = {
          ...{
            cert_no: '',
            nation: '',
            reg_date: item.RM33,
            reg_caseno: item.收件字號?.replaceAll(/\s+/g, '').replace('年第號', ''),
            transfer_date: '',
            transfer_caseno: '',
            transfer_local_date: '',
            transfer_local_principle: '',
            restore_local_date: '',
            use_partition: '',
            logout: '',
            control: '',
            note: ''
          }
        }
      }
      this.modal(this.$createElement(lahForeignerRestrictionEdit, {
        props: { origData: item },
        on: {
          update: (data) => {
            item.RESTRICTION_DATA = {
              ...data
            }
          },
          saved: (data) => {
            this.hideModal()
            this.reload()
          }
        }
      }), {
        title: `編輯 ${item.BB09} ${item.BB09_CHT} - ${item.BB16} 管制資料`,
        size: 'lg',
        noCloseOnBackdrop: true
      })
    },
    openPdf (item) {
      const url = `/assets/pdf/${item.BB03 || item.RM01}/${item.BB04_2 || item.RM03}_${item.BB09}_${item.BB09_CHT}.pdf`
      this.$utils.openNewWindow(url)
    },
    pdfTooltip (item) {
      return `將開啟 ${item.BB03} 年 ${item.BB04_2} 號 ${item.BB09} ${item.BB09_CHT} 已上傳的PDF掃描檔`
    },
    equityRatio (item) {
      if (this.$utils.empty(item.BB15_3) || this.$utils.empty(item.BB15_2)) {
        return ''
      }
      return `${item.BB15_3}/${item.BB15_2}`
    },
    isLogout (item) {
      const val = item.RESTRICTION_DATA?.logout
      return val === true || val === 'true'
    },
    isControlled (item) {
      const val = item.RESTRICTION_DATA?.control
      return val === true || val === 'true'
    },
    exportCHTData (data, idx) {
      const obj = {}
      obj['編號'] = `${idx + 1}`.padStart(3, '0')
      obj['直轄市、(縣)市'] = '桃園'
      obj['鄉鎮市區'] = data.AA46_CHT || ''
      obj['段小段'] = data.BA48_CHT || ''
      obj['地號'] = this.$utils.formatLandNumber(data.GG49) || ''
      obj['土地使用分區'] = data.RESTRICTION_DATA?.use_partition || data.AA11_CHT
      obj['面積(平方公尺)'] = data.AA10 || ''

      obj['權利範圍'] = ''
      if (!this.$utils.empty(data.BB15_1_CHT)) {
        obj['權利範圍'] += data.BB15_1_CHT
      }
      if (!this.$utils.empty(this.equityRatio(data))) {
        obj['權利範圍'] += ` ${this.equityRatio(data)}`
      }

      obj['所有權人'] = data.BB09_CHT || ''
      obj['國籍'] = data.RESTRICTION_DATA.nation || ''

      obj['繼承登記日期及收件字號'] = ''
      if (!this.$utils.empty(data.RESTRICTION_DATA.reg_date)) {
        obj['繼承登記日期及收件字號'] += this.$utils.addDateDivider(data.RESTRICTION_DATA.reg_date)
      }
      if (!this.$utils.empty(data.RESTRICTION_DATA.reg_caseno)) {
        obj['繼承登記日期及收件字號'] += `\r\n${data.RESTRICTION_DATA.reg_caseno}`
      }

      obj['移請國有財產署標售日期及文號'] = ''
      if (!this.$utils.empty(data.RESTRICTION_DATA.transfer_date)) {
        obj['移請國有財產署標售日期及文號'] += this.$utils.addDateDivider(data.RESTRICTION_DATA.transfer_date)
      }
      if (!this.$utils.empty(data.RESTRICTION_DATA.transfer_caseno)) {
        obj['移請國有財產署標售日期及文號'] += `\r\n${data.RESTRICTION_DATA.transfer_caseno}`
      }

      obj['移轉本國人之登記日期及原則'] = ''
      if (!this.$utils.empty(data.RESTRICTION_DATA.transfer_local_date)) {
        obj['移轉本國人之登記日期及原則'] += this.$utils.addDateDivider(data.RESTRICTION_DATA.transfer_local_date)
      }
      if (!this.$utils.empty(data.RESTRICTION_DATA.transfer_local_principle)) {
        obj['移轉本國人之登記日期及原則'] += `\r\n${data.RESTRICTION_DATA.transfer_local_principle}`
      }

      obj['回復或歸化本國籍日期'] = data.RESTRICTION_DATA.restore_local_date || ''
      obj['備註'] = data.RESTRICTION_DATA.note || ''
      return obj
    }
  }
}
</script>

<style lang="scss" scoped>
.truncate-mvw {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(15vw - 0px);
}
</style>
