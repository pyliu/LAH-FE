<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄案件控管 ({{ filterDataCount }})
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋及操作
          ol
            li 選擇日期區間(預設為目前月份)後按 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋
            li 地價人員須自行輸入申報日期及備註，輸入後請按 #[lah-fa-icon(icon="edit" variant="primary" no-gutter)] 儲存
            li 可利用 #[lah-fa-icon(icon="search-plus" variant="primary" no-gutter)] 篩選想顯示的資料
            li 可利用 #[lah-fa-icon(icon="file-excel" regular variant="success" no-gutter)] 將顯示資料匯出為EXCEL檔案

      .d-flex
        b-datepicker(
          v-model="startDateObj"
          placeholder="開始日期"
          boundary="viewport"
          size="sm"
          :date-format-options="{ weekday: 'narrow' }"
          :max="yesterday"
          value-as-date
          hide-header
          dropleft
        )
        .my-auto ～
        b-datepicker.mr-1(
          v-model="endDateObj"
          placeholder="截止日期"
          boundary="viewport"
          size="sm"
          :date-format-options="{ weekday: 'narrow' }"
          :min="startDateObj"
          hide-header
          dark
          value-as-date
        )
        lah-button.mx-1(
          icon="search"
          size="lg"
          title="搜尋"
          @click="$fetch"
          :disabled="isBusy"
          :busy="isBusy"
          no-icon-gutter
        )
        lah-button(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!committed",
          no-icon-gutter
        )
        lah-button-xlsx.mx-1(
          :jsons="xlsxData",
          header="實價登錄檢核案件"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          variant="outline-secondary"
          badge-variant="secondary"
          title="強制重新搜尋"
          :milliseconds="0"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
        )

  .d-flex.justify-content-between
    b-tags.border-0(
      v-model="advTags",
      placeholder="",
      tag-variant="info",
      tag-pills,
      no-outer-focus,
      no-add-on-enter,
      no-tag-remove,
      add-button-variant="white"
      add-button-text="",
      size="lg"
    )
    b-input-group.fixed-per-page(prepend="每頁顯示筆數"): b-input(
      v-model="perPage",
      type="number",
      min="5",
      max="100"
    )
  .d-flex.justify-content-end.mb-1
    b-pagination(
      v-if="showPagination"
      v-model="currentPage"
      class="my-auto mr-2"
      size="sm"
      :total-rows="paginationCount"
      :per-page="perPage"
      :title="`共 ${filterDataCount} 件`"
      last-number
      first-number
    )
  lah-transition
    div(v-if="committed")
      //- lah-reg-b-table(
      //-   :busy="isBusy"
      //-   :baked-data="filterRegBakedData"
      //-   :fields="regFields"
      //-   :per-page="perPage"
      //-   :current-page="currentPage"
      //-   :caption-append="captionRange"
      //-   :max-height-offset="160"
      //-   no-caption
      //- )
      b-table.text-center(
        v-if="committed"
        id="val-realprice-table"
        ref="realpriceTable"
        caption-top
        selectable
        select-mode="single"
        selected-variant="success"
        :sticky-header="`${maxHeight}px`"
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
        :busy="isBusy"
        :items="filterRegBakedData"
        :fields="regFields"
        :per-page="perPage"
        :current-page="currentPage"
      )
        template(#table-busy): span.ld-txt 讀取中...
        template(#cell(收件字號)="{ item }"): div: b-link(@click="popup(item)").
          {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
        template(#cell(SR_DATE)="{ item }")
          .text-nowrap {{ addDateDivider(item.SR_DATE) }}
        template(#cell(SR_TIME)="{ item }")
          span {{ addTimeDivider(item.SR_TIME) }}
        template(#cell(RM54_1)="{ item }")
          .text-nowrap {{ addDateDivider(item.RM54_1) }}
        template(#cell(RM58_1)="{ item }")
          .text-nowrap {{ addDateDivider(item.RM58_1) }}
        template(#cell(RM12)="{ item }")
          .text-nowrap {{ $utils.formatLandNumber(item.RM12) }}
        template(#cell(RM15)="{ item }")
          .text-nowrap {{ $utils.formatBuildNumber(item.RM15) }}
        template(#cell(收件日期)="{ item }")
          .text-nowrap {{ item.收件日期 }}
        template(#cell(作業人員)="{ item }")
          b-button(pill variant="outline-primary" @click="popupUser(item)" size="sm" v-b-tooltip.right="item.RM30_1") {{ item.作業人員 }}
        template(#cell(memo)="{ item }"): lah-val-realprice-memo(:parent-data="item", @update="clearCache")
    h3(v-else class="text-center"): lah-fa-icon(icon="search" action="breath" variant="primary") 請點擊查詢按鈕

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="申報序號"): b-select(
        v-model="advOpts.caseNo",
        :options="advOpts.caseNoOpts",
        title="申報書序號"
      )
      b-input-group(prepend="　段小段"): b-select(
        v-model="advOpts.sectId",
        :options="advOpts.sectIdOpts",
        title="段小段"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　　地號"): b-select(
        v-model="advOpts.landNum",
        :options="advOpts.landNumOpts",
        title="地號"
      )
      b-input-group(prepend="　　建號"): b-select(
        v-model="advOpts.buildingNum",
        :options="advOpts.buildingNumOpts",
        title="建號"
      )
    hr
    .center.d-flex
      b-input-group.mr-1(prepend="登記註記"): b-select(
        v-model="advOpts.regNote",
        :options="advOpts.regNoteOpts",
        title="登記處理註記"
      )
      b-input-group(prepend="地價註記"): b-select(
        v-model="advOpts.valNote",
        :options="advOpts.valNoteOpts",
        title="地價處理註記"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="申報日期"): b-select(
        v-model="advOpts.declareDay",
        :options="advOpts.declareDayOpts",
        title="申報日期"
      )
      b-input-group(prepend="申報註記"): b-select(
        v-model="advOpts.declareNote",
        :options="advOpts.declareNoteOpts",
        title="申報註記"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登錄日期"): b-select(
        v-model="advOpts.srDate",
        :options="advOpts.srDateOpts",
        title="地價登錄日期"
      )
      b-input-group(prepend="登錄時間"): b-select(
        v-model="advOpts.srTime",
        :options="advOpts.srTimeOpts",
        title="地價登錄時間"
      )
    hr
    .center.d-flex
      b-input-group.mr-1(prepend="　收件字"): b-select(
        v-model="advOpts.rm02",
        :options="advOpts.rm02Opts",
        title="收件字"
      )
      b-input-group(prepend="　收件號")
        //- b-input.mr-1(v-model="advOpts.caseWord", placeholder="... 收件字 ...", trim)
        b-input(v-model="advOpts.rm03", placeholder="... 收件號 ...", trim)
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="收件日期"): b-select(
        v-model="advOpts.rm07Date",
        :options="advOpts.rm07DateOpts",
        title="收件日期"
      )
      b-input-group(prepend="登記日期"): b-select(
        v-model="advOpts.rm54",
        :options="advOpts.rm54Opts",
        title="登記登錄日期"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="結案日期"): b-select(
        v-model="advOpts.rm58",
        :options="advOpts.rm58Opts",
        title="結案日期"
      )
      b-input-group(prepend="作業人員"): b-select(
        v-model="advOpts.operator",
        :options="advOpts.operatorOpts",
        title="作業人員"
      )
    hr
    .center.d-flex
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆

  b-modal(
    ref="caseDetail",
    :title="`案件詳情 - ${choosedItem ? choosedItem.RM123 : '未指定'}`",
    size="xl",
    hide-footer
  )
    lah-reg-case-detail(:parent-data="choosedItem")
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
export default {
  components: { lahUserCard },
  fetchOnServer: false,
  asyncData (nuxt) {
    const today = new Date()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      startDateObj: firstDayofMonth,
      endDateObj: lastDayofMonth,
      startDate: `${firstDayofMonth.getFullYear() - 1911}${('0' + (firstDayofMonth.getMonth() + 1)).slice(-2)}${('0' + firstDayofMonth.getDate()).slice(-2)}`,
      endDate: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday
    }
  },
  data: () => ({
    forceReload: false,
    committed: false,
    regBakedData: [],
    regFields: [
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '作業人員',
        sortable: true
      },
      {
        key: 'RM11',
        label: '段代碼',
        sortable: true
      },
      {
        key: '段小段',
        label: '段名',
        sortable: true
      },
      {
        key: 'RM12',
        label: '地號',
        sortable: true
      },
      {
        key: 'RM15',
        label: '建號',
        sortable: true
      },
      {
        key: 'P1MP_CASENO',
        label: '申報書序號',
        sortable: true
      },
      {
        key: 'memo',
        label: '申報註記',
        sortable: false
      },
      {
        key: '登記處理註記',
        label: '登記註記',
        sortable: true
      },
      {
        key: 'RM54_1',
        label: '登記登錄日期',
        sortable: true
      },
      {
        key: '地價處理註記',
        label: '地價註記',
        sortable: true
      },
      {
        key: 'SR_DATE',
        label: '地價登錄日期',
        sortable: true
      },
      {
        key: 'SR_TIME',
        label: '地價登錄時間',
        sortable: true
      },
      {
        key: 'RM58_1',
        label: '登記結案日期',
        sortable: true
      }
      // {
      //   key: 'P1MP_INSDATE',
      //   label: '輸入日期',
      //   sortable: true
      // },
      // {
      //   key: 'P1MP_INSTIME',
      //   label: '輸入時間',
      //   sortable: true
      // },
      // {
      //   key: 'P1MP_INSUSER',
      //   label: '輸入人員',
      //   sortable: true
      // }
    ],
    currentPage: 1,
    perPage: 20,
    advOpts: {
      sectId: '',
      sectIdOpts: [],
      landNum: '',
      landNumOpts: [],
      caseNo: '',
      caseNoOpts: [],
      buildingNum: '',
      buildingNumOpts: [],
      declareDay: '',
      declareDayOpts: [],
      declareNote: '',
      declareNoteOpts: [
        { value: '', text: '' },
        { value: true, text: '有' },
        { value: false, text: '無' }
      ],
      regNote: '',
      regNoteOpts: [],
      valNote: '',
      valNoteOpts: [],
      rm07Date: '',
      rm07DateOpts: [],
      rm02: '',
      rm02Opts: [],
      rm03: '',
      rm54: '',
      rm54Opts: [],
      rm58: '',
      rm58Opts: [],
      srDate: '',
      srDateOpts: [],
      srTime: '',
      srTimeOpts: [],
      operator: '',
      operatorOpts: []
    },
    maxHeight: 600,
    choosedItem: null
  }),
  fetch () {
    // reset cached data
    this.reset()
    // restore cached data if found
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (this.isBusy) {
          this.notify('讀取中 ... 請稍後再試', { type: 'warning' })
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'val_realprice_map',
            start_date: this.startDate,
            end_date: this.endDate,
            reload: this.forceReload
          }).then(({ data }) => {
            this.regBakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
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
            this.loaded()
          })
        }
      } else {
        this.regBakedData = json.baked
        this.loaded()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.regBakedData.length} 筆實價登錄控管案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
        })
      }
    })
  },
  head: {
    title: '實價登錄案件控管-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}`)
    },
    cacheKey () {
      return `realprice_mgmt_${this.md5Hash}`
    },
    captionRange () {
      return `【${this.startDate.substring(0, 3)}-${this.startDate.substring(3, 5)}-${this.startDate.substring(5)} ~ ${this.endDate.substring(0, 3)}-${this.endDate.substring(3, 5)}-${this.endDate.substring(5)}】`
    },
    showPagination () {
      return !this.$utils.empty(this.filterRegBakedData) && this.filterRegBakedData.length > this.perPage
    },
    paginationCount () {
      return this.filterRegBakedData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.sectId)) {
        tags.push(`段小段：${this.advOpts.sectId}`)
      }
      if (!this.$utils.empty(this.advOpts.landNum)) {
        tags.push(`地號：${this.advOpts.landNum}`)
      }
      if (!this.$utils.empty(this.advOpts.buildingNum)) {
        tags.push(`建號：${this.advOpts.buildingNum}`)
      }
      if (!this.$utils.empty(this.advOpts.caseNo)) {
        tags.push(`申報書序號：${this.advOpts.caseNo}`)
      }
      if (this.advOpts.declareDay !== '') {
        let text = this.advOpts.declareDay
        if (text === true) {
          text = '有設定'
        } else if (text === false) {
          text = '無設定'
        }
        tags.push(`申報日期：${text}`)
      }
      if (this.advOpts.declareNote !== '') {
        tags.push(`申報備註：${this.advOpts.declareNote ? '有' : '無'}`)
      }
      if (!this.$utils.empty(this.advOpts.regNote)) {
        tags.push(`登記處理註記：${this.advOpts.regNote}`)
      }
      if (!this.$utils.empty(this.advOpts.valNote)) {
        tags.push(`地價處理註記：${this.advOpts.valNote}`)
      }
      if (!this.$utils.empty(this.advOpts.rm07Date)) {
        tags.push(`收件日期：${this.advOpts.rm07Date}`)
      }
      if (!this.$utils.empty(this.advOpts.rm02)) {
        tags.push(`收件字：${this.advOpts.rm02}`)
      }
      if (!this.$utils.empty(this.advOpts.rm03)) {
        tags.push(`收件號：${this.advOpts.rm03}`)
      }
      if (!this.$utils.empty(this.advOpts.rm54)) {
        tags.push(`登記登錄時間：${this.addDateDivider(this.advOpts.rm54)}`)
      }
      if (!this.$utils.empty(this.advOpts.rm58)) {
        tags.push(`登記結案時間：${this.addDateDivider(this.advOpts.rm58)}`)
      }
      if (!this.$utils.empty(this.advOpts.srDate)) {
        tags.push(`地價登錄日期：${this.addDateDivider(this.advOpts.srDate)}`)
      }
      if (!this.$utils.empty(this.advOpts.srTime)) {
        tags.push(`地價登錄時間：${this.advOpts.srTime}`)
      }
      if (!this.$utils.empty(this.advOpts.operator)) {
        tags.push(`作業人員：${this.advOpts.operator}`)
      }
      return tags
    },
    filterRegBakedData () {
      return this.filterBakedData(this.regBakedData)
    },
    filterDataCount () {
      return this.filterRegBakedData.length
    },
    xlsxData () {
      return this.prepareRegJsons()
    }
  },
  watch: {
    startDateObj (val) {
      this.startDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
    },
    endDateObj (val) {
      this.endDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
    },
    regBakedData (val) {
      this.refreshAdvOptsSelect(val)
    },
    filterRegBakedData (dontcare) {
      this.currentPage = 1
    },
    perPage (val) {
      val > 5 && this.setCache('realprice-perpage', val)
    }
  },
  async mounted () {
    this.maxHeight = parseInt(window.innerHeight - 185)
    this.perPage = await this.getCache('realprice-perpage') || 20
  },
  methods: {
    addDateDivider (str) {
      if (this.$utils.empty(str)) {
        return ''
      }
      const Y = str.substring(0, 3)
      const M = str.substring(3, 5)
      const D = str.substring(5, 7)
      return `${Y}-${M}-${D}`
    },
    addTimeDivider (str) {
      if (this.$utils.empty(str)) {
        return ''
      }
      const Y = str.substring(0, 2)
      const M = str.substring(2, 4)
      const D = str.substring(4, 6)
      return `${Y}:${M}:${D}`
    },
    popup (item) {
      this.choosedItem = item
      this.$refs.caseDetail.show()
    },
    popupUser (item) {
      const name = item.作業人員
      const id = item.RM30_1
      this.modal(this.$createElement(lahUserCard, { props: { name, id } }), {
        title: `${id} ${name} 資訊`
      })
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.regBakedData = []
      this.currentPage = 1
    },
    clearCache () {
      this.removeCache(this.cacheKey)
    },
    loaded () {
      this.isBusy = false
      this.forceReload = false
      this.committed = true
    },
    prepareRegJsons () {
      const fieldKeys = this.regFields.map((field, idx, array) => field.key)
      return this.filterRegBakedData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            switch (key) {
              case 'RM11':
                obj['段小段'] = value
                break
              case 'RM12':
                obj['地號'] = value
                break
              case 'RM15':
                obj['建號'] = value
                break
              case 'RM54_1':
                obj['登記登錄日期'] = value
                break
              case 'RM58_1':
                obj['結案日期'] = value
                break
              case 'SR_DATE':
                obj['地價登錄日期'] = value
                break
              case 'SR_TIME':
                obj['地價登錄時間'] = value
                break
              case 'P1MP_CASENO':
                obj['申報書序號'] = value
                break
              default:
                obj[key] = value
            }
          } else if (key === 'P1MP_DECLARE_DATE') {
            obj['申報日期'] = value
          } else if (key === 'P1MP_DECLARE_NOTE') {
            obj['申報備註'] = value
          }
        }
        return obj
      })
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          sectId: '',
          landNum: '',
          buildingNum: '',
          caseNo: '',
          declareDay: '',
          declareNote: '',
          regNote: '',
          valNote: '',
          rm07Date: '',
          rm02: '',
          rm03: '',
          rm54: '',
          rm58: '',
          srDate: '',
          srTime: '',
          operator: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...this.advOpts,
        ...{
          sectId: '',
          sectIdOpts: [],
          landNum: '',
          landNumOpts: [],
          buildingNum: '',
          buildingNumOpts: [],
          caseNo: '',
          caseNoOpts: [],
          regNote: '',
          regNoteOpts: [],
          valNote: '',
          valNoteOpts: [],
          rm07Date: '',
          rm07DateOpts: [],
          rm02: '',
          rm02Opts: [],
          rm03: '',
          rm54: '',
          rm54Opts: [],
          rm58: '',
          rm58Opts: [],
          srDate: '',
          srDateOpts: [],
          srTime: '',
          srTimeOpts: [],
          declareDay: '',
          declareDayOpts: [],
          operator: '',
          operatorOpts: []
        }
      }
      if (val) {
        const tmp = [...new Map(val.map((item) => {
          return [
            // 段代碼
            item.RM11,
            {
              value: item.RM11,
              text: `${item.RM11} - ${item.RM11_CHT}`
            }
          ]
        }))].sort()
        this.advOpts.sectIdOpts = [...tmp.map(arr => arr[1])]
        this.advOpts.landNumOpts = this.$utils.sortBy(
          this.$utils.uniqWith(
            this.$utils.filter([...val.map(item => ({
              value: item.RM12,
              text: this.$utils.formatLandNumber(item.RM12)
            }))], val => val !== null && !this.$utils.empty(val.value)),
            this.$utils.equal
          ),
          'value'
        )
        this.advOpts.buildingNumOpts = this.$utils.sortBy(
          this.$utils.uniqWith(
            this.$utils.filter([...val.map(item => ({
              value: item.RM15,
              text: this.$utils.formatBuildNumber(item.RM15)
            }))], val => val !== null && !this.$utils.empty(val.value)),
            this.$utils.equal
          ),
          'value'
        )
        this.advOpts.caseNoOpts = [...new Set(val.map(item => item.P1MP_CASENO))].sort().filter(val => val !== null)
        this.advOpts.regNoteOpts = [...new Set(val.map(item => item.登記處理註記))].sort().filter(val => !this.$utils.empty(val))
        this.advOpts.valNoteOpts = [...new Set(val.map(item => item.地價處理註記))].sort().filter(val => !this.$utils.empty(val))
        this.advOpts.rm07DateOpts = [...new Set(val.map(item => item.收件日期))].sort().filter(val => val !== null)
        this.advOpts.rm02Opts = [...new Set(val.map(item => item.RM02))].sort().filter(val => val !== null)
        this.advOpts.srDateOpts = [...new Set(val.map(item => item.SR_DATE))].sort().filter(val => val !== null)
        this.advOpts.srTimeOpts = [...new Set(val.map(item => `${item.SR_TIME?.substring(0, 2)}點`))].sort().filter(val => val !== null && val !== 'undefined點')
        this.advOpts.declareDayOpts = [...new Set(val.map(item => item.P1MP_DECLARE_DATE))].sort().filter(val => !this.$utils.empty(val))
        this.advOpts.rm54Opts = [...new Set(val.map(item => item.RM54_1))].sort().filter(val => val !== null)
        this.advOpts.rm58Opts = [...new Set(val.map(item => item.RM58_1))].sort().filter(val => val !== null)
        this.advOpts.operatorOpts = [...new Set(val.map(item => item.作業人員))].sort().filter(val => val !== null)

        this.advOpts.sectIdOpts.unshift('')
        this.advOpts.landNumOpts.unshift('無地號')
        this.advOpts.landNumOpts.unshift('')
        this.advOpts.buildingNumOpts.unshift('無建號')
        this.advOpts.buildingNumOpts.unshift('')
        this.advOpts.caseNoOpts.unshift('未輸入')
        this.advOpts.caseNoOpts.unshift('')
        this.advOpts.regNoteOpts.unshift('未更新')
        this.advOpts.regNoteOpts.unshift('')
        this.advOpts.valNoteOpts.unshift('未更新')
        this.advOpts.valNoteOpts.unshift('')
        this.advOpts.rm07DateOpts.unshift('')
        this.advOpts.rm02Opts.unshift('')
        this.advOpts.srDateOpts.unshift('')
        this.advOpts.srTimeOpts.unshift('')
        this.advOpts.declareDayOpts.unshift({ value: false, text: '無設定' })
        this.advOpts.declareDayOpts.unshift({ value: true, text: '有設定' })
        this.advOpts.declareDayOpts.unshift('')
        this.advOpts.rm54Opts.unshift('')
        this.advOpts.rm58Opts.unshift('')
        this.advOpts.operatorOpts.unshift('')
      }
    },
    filterBakedData (source) {
      if (this.advTags.length > 0) {
        let pipelineItems = source
        const checkId = !this.$utils.empty(this.advOpts.sectId)
        if (checkId) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM11.match(this.advOpts.sectId) !== null
          })
        }
        const checkLandNum = !this.$utils.empty(this.advOpts.landNum)
        if (checkLandNum) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.landNum === '無地號') {
              return this.$utils.empty(item.RM12)
            }
            return item.RM12 === this.advOpts.landNum
          })
        }
        const checkBuildingNum = !this.$utils.empty(this.advOpts.buildingNum)
        if (checkBuildingNum) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.buildingNum === '無建號') {
              return this.$utils.empty(item.RM15)
            }
            return item.RM15 === this.advOpts.buildingNum
          })
        }
        const checkCaseNo = !this.$utils.empty(this.advOpts.caseNo)
        if (checkCaseNo) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.caseNo === '未輸入') {
              return this.$utils.empty(item.P1MP_CASENO)
            }
            return item.P1MP_CASENO === this.advOpts.caseNo
          })
        }
        const checkDeclareDay = this.advOpts.declareDay !== ''
        if (checkDeclareDay) {
          pipelineItems = pipelineItems.filter((item) => {
            const declareDate = item.P1MP_DECLARE_DATE
            if (this.advOpts.declareDay === true) {
              return !this.$utils.empty(declareDate)
            } else if (this.advOpts.declareDay === false) {
              return this.$utils.empty(declareDate)
            }
            return declareDate === this.advOpts.declareDay
          })
        }
        const checkDeclareNote = this.advOpts.declareNote !== ''
        if (checkDeclareNote) {
          pipelineItems = pipelineItems.filter((item) => {
            const hasDate = !this.$utils.empty(item.P1MP_DECLARE_DATE)
            const hasNote = !this.$utils.empty(item.P1MP_DECLARE_NOTE)
            // true - 有 ; false - 無
            if (this.advOpts.declareNote) {
              return hasNote && hasDate
            } else {
              return !hasNote
            }
          })
        }
        const checkRegNote = !this.$utils.empty(this.advOpts.regNote)
        if (checkRegNote) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.regNote === '未更新') {
              return this.$utils.empty(item.登記處理註記)
            }
            return item.登記處理註記 === this.advOpts.regNote
          })
        }
        const checkValNote = !this.$utils.empty(this.advOpts.valNote)
        if (checkValNote) {
          pipelineItems = pipelineItems.filter((item) => {
            if (this.advOpts.valNote === '未更新') {
              return this.$utils.empty(item.地價處理註記)
            }
            return item.地價處理註記 === this.advOpts.valNote
          })
        }
        const checkRm07Date = !this.$utils.empty(this.advOpts.rm07Date)
        if (checkRm07Date) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.收件日期 === this.advOpts.rm07Date
          })
        }
        const checkRm02 = !this.$utils.empty(this.advOpts.rm02)
        if (checkRm02) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM02 === this.advOpts.rm02
          })
        }
        const checkRm03 = !this.$utils.empty(this.advOpts.rm03)
        if (checkRm03) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM03.match(this.advOpts.rm03) !== null
          })
        }
        const checkRm54 = !this.$utils.empty(this.advOpts.rm54)
        if (checkRm54) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM54_1 === this.advOpts.rm54
          })
        }
        const checkRm58 = !this.$utils.empty(this.advOpts.rm58)
        if (checkRm58) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.RM58_1 === this.advOpts.rm58
          })
        }
        const checkSrDate = !this.$utils.empty(this.advOpts.srDate)
        if (checkSrDate) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.SR_DATE === this.advOpts.srDate.replaceAll('-', '')
          })
        }
        const checkSrTime = !this.$utils.empty(this.advOpts.srTime)
        if (checkSrTime) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.SR_TIME?.startsWith(this.advOpts.srTime?.substring(0, 2))
          })
        }
        const checkOperator = !this.$utils.empty(this.advOpts.operator)
        if (checkOperator) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.作業人員 === this.advOpts.operator
          })
        }
        return pipelineItems
      }
      return source
    }
  }
}
</script>

<style lang="scss" scoped>
.move-table-up {
  margin-top: -25px;
}
.fixed-height-table {
  max-height: calc(100% - 135px);
}
.tags-input {
  width: 100vw;
}
.fixed-per-page {
  max-width: 190px;
  height: 100%;
}
</style>
