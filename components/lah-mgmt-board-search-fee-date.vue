<template lang="pug">
b-card(border-variant="info")
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          :icon="dataReady ? 'calendar-check' : 'calendar-days'",
          :variant="dataReady ? 'success' : 'info'",
          :action="dataReady ? 'breath' : 'swim'",
          size="lg"
        ) 規費日期查詢
      b-badge.ml-2(
        v-if="dataReady",
        variant="primary",
        pill
      ) {{ countAll }} 筆 / ${{ $utils.addMoneyComma(moneyAll) }} 元
      b-button-group.ml-auto(size="sm")
        lah-button(
          v-if="dataReady",
          icon="window-restore",
          variant="outline-primary",
          no-border,
          no-icon-gutter,
          @click="openResultModal",
          title="開啟查詢結果視窗"
        )
        lah-button(
          v-if="dataReady",
          icon="chart-column",
          variant="outline-info",
          no-border,
          no-icon-gutter,
          @click="openChartModal",
          title="檢視規費統計圖表"
        )
        lah-button(
          v-if="dataReady",
          icon="arrow-rotate-left",
          variant="outline-secondary",
          no-border,
          no-icon-gutter,
          action="cycle-alt",
          @click="query",
          title="重新整理當日資料"
        )
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="規費日期查詢說明"
        )

    lah-help-modal(ref="help", modal-title="規費日期查詢說明", size="lg")
      h5 本項功能提供管理師依據結帳日期查詢規費資料與統計分析。
      h6 功能特色
      ul
        li 支援依結帳日期（民國年月日，如：1110915）查詢當日所有規費收據。
        li 查詢結果將以彈跳視窗（Modal）呈現完整收費分析，避免佔用儀表板版面。
        li 分類統整：全部、現金、悠遊卡、行動支付、信用卡及其他等類別數量與實收金額。
        li 支援「按鈕標籤」與「資料表格」兩種檢視模式，可依電腦給號、收據編號、經辦快速過濾。
        li 點選單據按鈕可開啟詳情彈出視窗檢視規費詳細資訊。
        li 提供「統計圖表」功能，視覺化呈現支付方式筆數與金額分佈。
      h6 單據標籤顏色說明
      ul
        li #[b.text-primary outline-primary]：正常已印
        li #[b.text-danger danger]：正常未印
        li #[b.text-secondary secondary]：已作廢 (AA08=0 或已填寫作廢日期)
      h6 規費資料集(EXPAA)相關欄位定義參考
      ul
        li AA01 - 開單日期
        li AA04 - 電腦給號
        li AA05 - 憑證序號（收據編號）
        li AA08 - 單據狀況【1：正常，0：作廢】
        li AA09 - 列印註記【1：已印，0：未印】
        li AA100 - 繳費方式代碼
        li AA100_CHT - 繳費方式中文
        li AA28 - 實收金額
        li AA39 - 承辦員代碼
        li AA104 - 作廢原因
        li AA106 - 悠遊卡扣款結果
        li AA107 - 悠遊卡交易序號

  //- 查詢條件輸入區
  .d-flex.align-items-center.flex-nowrap
    b-input-group.mr-1.date-input-group(size="sm")
      b-input-group-prepend(is-text) 結帳日期
      b-form-input.date-text-input(
        ref="dateInput",
        v-model="queryDate",
        placeholder="民國年月日",
        maxlength="7",
        size="sm",
        trim,
        :state="isDateValid",
        @keyup.enter="query"
      )
      b-input-group-append
        client-only
          b-datepicker(
            v-model="dateObj",
            value-as-date,
            button-only,
            button-variant="outline-secondary",
            size="sm",
            :max="today",
            title="點擊月曆選取日期",
            boundary="viewport"
          )
    b-button-group.mr-1.quick-btn-group(size="sm")
      b-button(
        variant="outline-secondary",
        @click="setToday",
        title="設為今日"
      ) 今日
      b-button(
        variant="outline-secondary",
        @click="setYesterday",
        title="設為昨日"
      ) 昨日
    lah-button.action-btn(
      icon="search",
      action="swim",
      variant="outline-primary",
      size="sm",
      :disabled="!isDateValid",
      :busy="isBusy",
      @click="query",
      pill
    ) 查詢

  //- 查詢成功後於卡片內顯示快捷檢視入口
  lah-transition
    .d-flex.align-items-center.flex-wrap.mt-2.pt-2.border-top(v-if="dataReady")
      lah-button(
        icon="window-restore",
        variant="outline-success",
        size="sm",
        @click="openResultModal",
        pill
      ) 檢視結果 ({{ countAll }} 筆 / ${{ $utils.addMoneyComma(moneyAll) }})
      lah-button.ml-2(
        icon="chart-column",
        variant="outline-info",
        size="sm",
        @click="openChartModal",
        pill
      ) 統計圖表

  //- 1. 搜尋結果彈跳視窗 (依使用者要求以 b-modal 呈現)
  b-modal(
    ref="resultModal",
    :title="resultModalTitle",
    size="xl",
    hide-footer,
    scrollable
  )
    div(v-if="dataReady")
      //- 頂端摘要
      .d-flex.justify-content-between.align-items-center.flex-wrap.p-2.mb-3.bg-light.rounded.border
        .d-flex.align-items-center.flex-wrap
          lah-fa-icon(icon="calendar-check", variant="primary", size="lg")
          span.font-weight-bold.ml-2 結帳日期：{{ queryDate }}
          span.mx-2 ｜
          span 總收據數：#[b.text-primary {{ countAll }}] 筆
          span.mx-2 ｜
          span 實收總額：#[b.text-success ${{ $utils.addMoneyComma(moneyAll) }}] 元
        .d-flex.align-items-center.mt-1.mt-md-0
          lah-button(
            icon="chart-column",
            variant="outline-info",
            size="sm",
            @click="openChartModal",
            pill
          ) 統計圖表

      //- 類別統計按鈕列 (對照 legacy expaa-category-dashboard)
      b-row.text-center.mb-3(no-gutters)
        b-col.p-1(
          v-for="cat in categories",
          :key="cat.key",
          cols="6",
          sm="4",
          md="2"
        )
          b-button.w-100.category-btn(
            :variant="selectedCategory === cat.key ? cat.variant : `outline-${cat.variant}`",
            size="sm",
            @click="selectedCategory = cat.key",
            v-b-tooltip.hover="`${cat.label}實收金額：${$utils.addMoneyComma(cat.money)} 元`"
          )
            .font-weight-bold {{ cat.label }}
            .d-flex.justify-content-center.align-items-center.mt-1
              b-badge(:variant="selectedCategory === cat.key ? 'light' : cat.variant", pill) {{ cat.count }} 筆
            small.d-block.mt-1.text-truncate ${{ $utils.addMoneyComma(cat.money) }}

      //- 清單控制工具列
      .d-flex.justify-content-between.align-items-center.mb-2.p-2.bg-light.rounded.border
        .d-flex.align-items-center
          lah-fa-icon(icon="list-ul", variant="primary")
          span.font-weight-bold.ml-1 【{{ currentCategoryLabel }}】
          span.text-muted.small 共 {{ currentList.length }} 筆 (實收 ${{ $utils.addMoneyComma(currentCategoryMoney) }} 元)
        .d-flex.align-items-center
          b-input-group(size="sm", style="width: 200px;")
            b-form-input(
              v-model="filterKeyword",
              placeholder="🔍 過濾給號/收據/經辦",
              trim
            )
            template(#append)
              b-button(
                v-if="filterKeyword",
                variant="outline-secondary",
                size="sm",
                @click="filterKeyword = ''"
              )
                lah-fa-icon(icon="xmark")
          b-button-group.ml-2(size="sm")
            b-button(
              :variant="viewMode === 'badges' ? 'primary' : 'outline-primary'",
              @click="viewMode = 'badges'",
              title="按鈕標籤檢視"
            )
              lah-fa-icon(icon="grip")
              span.ml-1.d-none.d-md-inline 標籤
            b-button(
              :variant="viewMode === 'table' ? 'primary' : 'outline-primary'",
              @click="viewMode = 'table'",
              title="表格清單檢視"
            )
              lah-fa-icon(icon="table")
              span.ml-1.d-none.d-md-inline 表格

      //- 1. 按鈕標籤清單檢視
      .receipt-badges-container.p-3.border.rounded.bg-white.mb-3(v-if="viewMode === 'badges'")
        .d-flex.flex-wrap(v-if="currentList.length > 0")
          b-button.mr-2.mb-2.receipt-btn(
            v-for="(item, idx) in currentList",
            :key="`receipt_${item.AA04}_${idx}`",
            :variant="receiptVariant(item)",
            size="sm",
            pill,
            v-b-tooltip.hover="receiptTooltip(item)",
            @click="popupDetail(item)"
          )
            lah-fa-icon(
              :icon="item.AA08 === '0' ? 'ban' : (item.AA09 === '1' ? 'print' : 'clock')",
              size="sm"
            )
            span.ml-1 {{ item.AA04 }}
            span.ml-1.font-weight-normal (${{ $utils.addMoneyComma(item.AA28) }})
        .text-center.text-muted.py-4(v-else)
          lah-fa-icon(icon="circle-exclamation", variant="secondary") 無符合條件的單據資料

      //- 2. 表格清單檢視
      .mb-3(v-else)
        b-table(
          :items="currentList",
          :fields="tableFields",
          :per-page="perPage",
          :current-page="currentPage",
          small,
          striped,
          hover,
          responsive,
          bordered,
          head-variant="light",
          empty-text="查無單據資料",
          show-empty
        )
          template(#cell(AA04)="{ item }")
            b-link.font-weight-bold(
              @click="popupDetail(item)",
              title="點擊檢視單據詳情"
            ) {{ item.AA04 }}
          template(#cell(AA28)="{ value }")
            span.font-weight-bold.text-info ${{ $utils.addMoneyComma(value) }}
          template(#cell(AA09)="{ value }")
            b-badge(:variant="value === '1' ? 'success' : 'danger'", pill) {{ value === '1' ? '已印' : '未印' }}
          template(#cell(AA08)="{ value, item }")
            b-badge(:variant="value === '1' && $utils.empty(item.AA02) ? 'success' : 'secondary'", pill) {{ value === '1' && $utils.empty(item.AA02) ? '正常' : '作廢' }}
          template(#cell(AA39)="{ value }")
            b-link.font-weight-bold(
              v-if="!$utils.empty(value)",
              @click="popupUserCard(value)",
              title="點擊開啟使用者卡片",
              v-b-tooltip.hover="`點擊檢視 ${userNames[value] || value} 卡片`"
            )
              lah-fa-icon(icon="user", size="sm")
              span.ml-1 {{ userNames[value] || value }}
            span.text-muted(v-else) -
          template(#cell(actions)="{ item }")
            lah-button(
              icon="window-restore",
              variant="outline-primary",
              size="sm",
              @click="popupDetail(item)",
              title="檢視詳情",
              no-icon-gutter
            )

        .d-flex.justify-content-between.align-items-center.mt-2(v-if="currentList.length > perPage")
          b-pagination.my-auto(
            v-model="currentPage",
            :total-rows="currentList.length",
            :per-page="perPage",
            size="sm",
            first-number,
            last-number
          )
          small.text-muted 顯示第 {{ (currentPage - 1) * perPage + 1 }} - {{ Math.min(currentPage * perPage, currentList.length) }} 筆，共 {{ currentList.length }} 筆

      //- 視窗底部
      .d-flex.justify-content-between.align-items-center.pt-2.border-top
        small.text-muted
          lah-fa-icon.mr-1(icon="circle-info", variant="info")
          | 點選單據按鈕可開啟詳情彈跳視窗檢視完整規費資料。
        b-button(
          variant="secondary",
          size="sm",
          @click="$refs.resultModal.hide()"
        ) 關閉

  //- 2. 統計圖表彈出視窗
  b-modal(
    ref="chartModal",
    :title="`${queryDate} 規費統計圖表`",
    size="lg",
    hide-footer,
    centered
  )
    .p-2
      .d-flex.justify-content-between.align-items-center.mb-3
        h6.mb-0.font-weight-bold
          lah-fa-icon(icon="chart-bar", variant="primary") 各項支付方式數量與金額分佈
        small.text-muted 結帳日期：{{ queryDate }}
      client-only
        lah-chart(
          ref="feeChart",
          type="bar"
        )

  template(#footer)
    .d-flex.justify-content-between.align-items-center.flex-wrap
      small.text-muted(v-if="dataReady")
        | 結帳日期：#[b {{ queryDate }}] ｜ 全日單據：#[b {{ countAll }}] 筆 ｜ 實收總額：#[b.text-primary ${{ $utils.addMoneyComma(moneyAll) }}] 元
      small.text-muted(v-else)
        | 請選取結帳日期後點選「查詢」讀取規費資料。
      lah-button.ml-auto(
        v-if="dataReady",
        icon="arrow-rotate-left",
        variant="outline-secondary",
        size="sm",
        action="cycle-alt",
        @click="clearData",
        pill
      ) 清除資料

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'
import lahChart from './lah-chart.vue'
import lahUserCard from './lah-user-card.vue'

export default {
  name: 'LahMgmtBoardSearchFeeDate',
  components: {
    lahFeeDataDetailVue,
    lahChart,
    lahUserCard
  },
  data: () => ({
    dateObj: null,
    queryDate: '',
    rawList: [],
    selectedCategory: 'all',
    filterKeyword: '',
    viewMode: 'badges', // 'badges' | 'table'
    currentPage: 1,
    perPage: 15,
    today: new Date(),
    colsMapping: {
      AA01: '開單日期',
      AA04: '電腦給號',
      AA05: '憑證序號',
      AA06: '是否兌現',
      AA07: '是否為補繳',
      AA08: '單據狀況',
      AA09: '列印註記',
      AA10: '申請人統一編號',
      AA11: '申請人姓名',
      AA12: '申請事由',
      AA13: '繳款人統一編號',
      AA14: '繳款人姓名',
      AA02: '作廢日期',
      AA24: '結帳日期',
      AA25: '結帳年',
      AA27: '應收總金額',
      AA28: '實收總金額',
      AA39: '承辦員代碼',
      AA95: '謄本工作站代碼',
      AA96: '申請種類代碼',
      AA88: '修改註記',
      AA89: '修改人員代碼',
      AA09F: '列印後修改註記',
      AA100: '繳費方式代碼',
      AA100_CHT: '付款方式',
      AA101: '銷帳編號',
      AA102: '原換發日期',
      AA103: '登記裁罰通知書',
      AA104: '作廢原因',
      AA105: '規費案件所屬資料管轄所',
      AA106: '悠遊卡繳費扣款結果',
      AA107: '悠遊卡交易流水號',
      AA108: '規費案件所屬資料管轄縣市'
    },
    tableFields: [
      { key: 'AA04', label: '電腦給號', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'AA05', label: '收據編號', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'AA28', label: '實收金額', sortable: true, thClass: 'text-center', tdClass: 'text-right' },
      { key: 'AA100_CHT', label: '付款方式', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'AA09', label: '列印', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'AA08', label: '狀況', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'AA39', label: '作業人員', sortable: true, thClass: 'text-center', tdClass: 'text-center' },
      { key: 'actions', label: '操作', sortable: false, thClass: 'text-center', tdClass: 'text-center' }
    ]
  }),
  computed: {
    isDateValid () {
      return /^[0-9]{7}$/.test(this.queryDate)
    },
    dataReady () {
      return Array.isArray(this.rawList) && this.rawList.length > 0
    },
    resultModalTitle () {
      if (!this.dataReady) {
        return '規費統計結果'
      }
      return `規費統計結果 【結帳日期：${this.queryDate}，共 ${this.countAll} 筆，實收總額 $${this.$utils.addMoneyComma(this.moneyAll)} 元】`
    },
    cashList () {
      return this.rawList.filter(item => item.AA100_CHT === '現金')
    },
    ezcardList () {
      return this.rawList.filter(item => item.AA100_CHT === '悠遊卡')
    },
    mobileList () {
      return this.rawList.filter(item => ['APPLE PAY', '安卓 PAY', '三星 PAY', '行動支付'].includes(item.AA100_CHT))
    },
    creditList () {
      return this.rawList.filter(item => item.AA100_CHT === '信用卡')
    },
    otherList () {
      return this.rawList.filter(item => !['APPLE PAY', '安卓 PAY', '三星 PAY', '行動支付', '現金', '悠遊卡', '信用卡'].includes(item.AA100_CHT))
    },
    countAll () {
      return this.rawList.length
    },
    countCash () {
      return this.cashList.length
    },
    countEzcard () {
      return this.ezcardList.length
    },
    countMobile () {
      return this.mobileList.length
    },
    countCredit () {
      return this.creditList.length
    },
    countOther () {
      return this.otherList.length
    },
    moneyAll () {
      return this.sumMoney(this.rawList)
    },
    moneyCash () {
      return this.sumMoney(this.cashList)
    },
    moneyEzcard () {
      return this.sumMoney(this.ezcardList)
    },
    moneyMobile () {
      return this.sumMoney(this.mobileList)
    },
    moneyCredit () {
      return this.sumMoney(this.creditList)
    },
    moneyOther () {
      return this.sumMoney(this.otherList)
    },
    categories () {
      return [
        { key: 'all', label: '全部', variant: 'info', count: this.countAll, money: this.moneyAll },
        { key: 'cash', label: '現金', variant: 'success', count: this.countCash, money: this.moneyCash },
        { key: 'ezcard', label: '悠遊卡', variant: 'primary', count: this.countEzcard, money: this.moneyEzcard },
        { key: 'mobile', label: '行動支付', variant: 'danger', count: this.countMobile, money: this.moneyMobile },
        { key: 'credit', label: '信用卡', variant: 'warning', count: this.countCredit, money: this.moneyCredit },
        { key: 'other', label: '其他', variant: 'secondary', count: this.countOther, money: this.moneyOther }
      ]
    },
    currentCategoryLabel () {
      const found = this.categories.find(c => c.key === this.selectedCategory)
      return found ? found.label : '全部'
    },
    currentCategoryMoney () {
      const found = this.categories.find(c => c.key === this.selectedCategory)
      return found ? found.money : 0
    },
    currentList () {
      let list = this.rawList
      if (this.selectedCategory === 'cash') {
        list = this.cashList
      } else if (this.selectedCategory === 'ezcard') {
        list = this.ezcardList
      } else if (this.selectedCategory === 'mobile') {
        list = this.mobileList
      } else if (this.selectedCategory === 'credit') {
        list = this.creditList
      } else if (this.selectedCategory === 'other') {
        list = this.otherList
      }

      if (this.$utils.empty(this.filterKeyword)) {
        return list
      }
      const kw = this.filterKeyword.trim().toLowerCase()
      return list.filter((item) => {
        const pcMatch = item.AA04 && item.AA04.includes(kw)
        const aaMatch = item.AA05 && item.AA05.toLowerCase().includes(kw)
        const opCodeMatch = item.AA39 && item.AA39.toLowerCase().includes(kw)
        const opNameMatch = this.userNames?.[item.AA39] && this.userNames[item.AA39].includes(kw)
        const methodMatch = item.AA100_CHT && item.AA100_CHT.toLowerCase().includes(kw)
        return pcMatch || aaMatch || opCodeMatch || opNameMatch || methodMatch
      })
    }
  },
  watch: {
    dateObj (val) {
      if (val instanceof Date && !isNaN(val.getTime())) {
        this.queryDate = this.$utils.twDateStr(val)
      }
    },
    queryDate (val) {
      if (this.isDateValid) {
        const d = this.$utils.twToAdDateObj(val)
        if (d && (!this.dateObj || d.getTime() !== this.dateObj.getTime())) {
          this.dateObj = d
        }
      }
    },
    selectedCategory () {
      this.currentPage = 1
    },
    filterKeyword () {
      this.currentPage = 1
    }
  },
  created () {
    const now = new Date()
    this.dateObj = now
    this.queryDate = this.$utils.twDateStr(now)
  },
  methods: {
    dateDisabled (ymd, date) {
      const weekday = date.getDay()
      // Sunday is disabled
      return weekday === 0
    },
    setToday () {
      const now = new Date()
      this.dateObj = now
      this.queryDate = this.$utils.twDateStr(now)
      this.query()
    },
    setYesterday () {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      this.dateObj = d
      this.queryDate = this.$utils.twDateStr(d)
      this.query()
    },
    sumMoney (collection) {
      if (!Array.isArray(collection)) { return 0 }
      return collection.reduce((acc, curr) => {
        const isObsolete = !this.$utils.empty(curr.AA02) || curr.AA08 === '0'
        return acc + (isObsolete ? 0 : (parseInt(curr.AA28, 10) || 0))
      }, 0)
    },
    query () {
      if (!this.isDateValid) {
        this.warning('請輸入正確民國日期格式 (7碼，例如: 1110915)', {
          title: '日期格式錯誤'
        })
        return
      }
      this.isBusy = true
      this.rawList = []
      this.selectedCategory = 'all'
      this.filterKeyword = ''
      this.currentPage = 1

      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'expaa',
        qday: this.queryDate,
        list_mode: true
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          if (Array.isArray(data.raw) && data.raw.length > 0) {
            this.rawList = data.raw
            this.openResultModal()
            this.notify({
              title: `${this.queryDate} 規費查詢成功`,
              message: `共載入 ${data.raw.length} 筆單據資料，實收 $${this.$utils.addMoneyComma(this.moneyAll)} 元`,
              type: 'success'
            })
          } else {
            this.warning(`${this.queryDate} 查無資料`, {
              title: '查詢規費統計'
            })
          }
        } else {
          this.warning(data.message || `${this.queryDate} 查無資料`, {
            title: '查詢規費統計'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    clearData () {
      this.rawList = []
      this.selectedCategory = 'all'
      this.filterKeyword = ''
      this.currentPage = 1
      this.$refs.resultModal?.hide()
    },
    openResultModal () {
      this.$nextTick(() => {
        this.$refs.resultModal?.show()
      })
    },
    receiptVariant (item) {
      if (item.AA08 === '0' || !this.$utils.empty(item.AA02)) {
        return 'secondary'
      }
      return item.AA09 === '1' ? 'outline-primary' : 'danger'
    },
    receiptTooltip (item) {
      const opName = this.userNames?.[item.AA39] || item.AA39 || ''
      const statusStr = item.AA08 === '0' || !this.$utils.empty(item.AA02) ? '作廢' : (item.AA09 === '1' ? '正常已印' : '正常未印')
      return `電腦給號：${item.AA04} | 序號：${item.AA05}\n金額：${this.$utils.addMoneyComma(item.AA28)} 元 | 付款：${item.AA100_CHT || '未知'}\n狀態：${statusStr} | 作業人員：${opName}`
    },
    bakeExpaaData (rawItem) {
      const baked = {}
      for (const [k, v] of Object.entries(rawItem)) {
        if (v !== null && v !== undefined && v !== '') {
          const label = this.colsMapping[k] || k
          if (k === 'AA39' || k === 'AA89') {
            const uName = this.userNames?.[v]
            baked[label] = uName ? `${uName} (${v})` : v
          } else if (k === 'AA08') {
            baked[label] = v === '1' ? '正常 (1)' : '作廢 (0)'
          } else if (k === 'AA09') {
            baked[label] = v === '1' ? '已印 (1)' : '未印 (0)'
          } else {
            baked[label] = v
          }
        }
      }
      return baked
    },
    popupDetail (item) {
      const baked = this.bakeExpaaData(item)
      this.$store.commit('inf/expaaData', item)
      this.$store.commit('inf/bakedExpaaData', baked)
      this.modal(this.$createElement(lahFeeDataDetailVue, {
        props: {
          expaaData: item,
          bakedExpaaData: baked
        }
      }), {
        title: `規費資料詳情 【${item.AA04} - ${item.AA05}】`,
        size: 'lg'
      })
    },
    popupUserCard (operatorCode) {
      if (this.$utils.empty(operatorCode) || operatorCode === 'XXXXXXXX') {
        return
      }
      const uName = this.userNames?.[operatorCode] || ''
      this.modal(this.$createElement(lahUserCard, {
        props: {
          id: operatorCode,
          name: uName
        }
      }), {
        title: `${uName || operatorCode} 使用者資訊${uName ? ` (${operatorCode})` : ''}`,
        size: 'md'
      })
    },
    openChartModal () {
      this.$refs.chartModal?.show()
      this.$nextTick(() => {
        this.renderChart()
      })
    },
    renderChart () {
      if (!this.$refs.feeChart) { return }
      this.$refs.feeChart.reset()
      const labels = ['現金', '悠遊卡', '信用卡', '行動支付', '其他']
      const counts = [this.countCash, this.countEzcard, this.countCredit, this.countMobile, this.countOther]
      const moneys = [this.moneyCash, this.moneyEzcard, this.moneyCredit, this.moneyMobile, this.moneyOther]

      labels.forEach((lbl, idx) => {
        this.$refs.feeChart.addData({ x: lbl, y: counts[idx] }, '單據數量 (筆)', 'bar', 0)
        this.$refs.feeChart.addData({ x: lbl, y: moneys[idx] }, '實收金額 (元)', 'line', 1)
      })

      this.timeout(() => {
        this.$refs.feeChart?.build()
      }, 200)
    }
  }
}
</script>

<style lang="scss" scoped>
.date-input-group {
  width: auto !important;
  flex: 0 0 auto !important;
  align-items: stretch;

  &::v-deep > .input-group-prepend > .input-group-text {
    height: 33px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 0;
    padding-bottom: 0;
  }

  .date-text-input {
    height: 33px !important;
    width: 125px !important;
    max-width: 130px !important;
    flex: 0 0 auto !important;
    padding-left: 0.6rem;
    padding-right: 1.8rem;
    letter-spacing: 0.5px;
  }

  &::v-deep > .input-group-append > .b-form-datepicker > button.btn {
    height: 33px !important;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

.quick-btn-group {
  flex: 0 0 auto !important;

  .btn {
    height: 33px !important;
    line-height: 1.5;
  }
}

.action-btn {
  flex: 0 0 auto !important;
  height: 33px !important;
  line-height: 1.5;
  white-space: nowrap !important;
}

.category-btn {
  padding: 0.35rem 0.25rem;
  border-width: 2px;
  transition: all 0.2s ease-in-out;
}

.receipt-badges-container {
  max-height: 380px;
  overflow-y: auto;
}

.receipt-btn {
  font-family: monospace;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}
</style>
