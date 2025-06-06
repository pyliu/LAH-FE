<template lang="pug">
b-card(border-variant="info")
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          :icon="dataReady ? 'square-check' : 'magnifying-glass-dollar'",
          :variant="dataReady ? 'success' : 'danger'",
          :action="dataReady ? 'breath' : 'swim'",
          size="lg"
        ) 搜尋規費單據
      b-button-group.ml-auto(size="sm")
        .d-flex
          .mr-1 依據：
          b-radio-group(
            v-model="searchType",
            :options="options"
          )
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="搜尋規費憑證說明"
        )
    lah-help-modal(ref="help", modal-title="搜尋規費憑證說明")
      h5 本項功能提供管理師查詢規費單據，以利進行調整資料作業。
      h6 規費資料集(EXPAA)相關欄位定義參考
      ul
        li AA01 - 收費日期
        li AA04 - 電腦給號
        li AA05 - 收據編號
        li AA08 - 收據狀態【1：正常，0：作廢】
        li AA09 - 列印註記【1：已印，0：未印】
        li.text-danger AA100 - 付款方式 (清單暫存7天，若近期有更動請手動更新)
        li AA104 - 作廢原因
        li AA106 - 悠遊卡繳費扣款結果
        li AA107 - 悠遊卡交易流水號
        li AA27 - 應收金額
        li AA28 - 實收金額
      h6 收費項目資料集(EXPAC)相關欄位定義參考
      ul
        li AC25 - 年分
        li AC04 - 電腦給號
        li AC16 - 收件年
        li AC17 - 收件字
        li AC18 - 收件號
        li.text-danger AC20 - 收費項目 (清單暫存7天，若近期有更動請手動更新)
        li AC29 - 應收金額
        li AC30 - 實收金額

  //- .center-container-wh-100
  .d-flex
    lah-transition: b-input-group.text-nowrap.mr-1.fixed-year-input(
      v-if="searchType === 'pc'",
      prepend="年度"
    )
      b-select.h-100(
        ref="year",
        v-model="searchYear",
        :options="searchYears",
        @change="searchMaxPcNumber"
      )
    b-input-group.text-nowrap(
      :prepend="searchLabel"
    )
      b-input.h-100(
        ref="keyword",
        v-model="searchVal",
        min="1",
        max="9999999",
        :type="searchType === 'pc' ? 'number' : 'text'",
        :state="searchValOK",
        :placeholder="searchPlaceholder",
        @change="clearSearchData",
        @keyup.enter="search"
      )
  //- lah-transition: div(v-if="dataReady")
  //-   b-row.my-1
  //-     b-col 結帳日期：{{ expaaData.AA01 }}
  //-     b-col 作業人員：{{ userNames[expaaData.AA39] }}
  //-   b-row
  //-     b-col 收費方式：{{ expaaData.AA100_CHT }}
  //-     b-col 實收金額：{{ $utils.addMoneyComma(expaaData.AA28) }}元
  lah-transition: div(v-if="dataReady")
    hr
    .d-flex.align-items-center.my-1
      lah-fa-icon(icon="angles-right", action="move-fade-ltr", variant="primary") 規費狀態
      lah-button.ml-1.border-0(
       icon="download",
        variant="outline-success",
        @click="$refs.formState?.reloadPaymentList()"
        no-icon-gutter,
        title="重新讀取「付款方式」清單",
        size="sm",
        v-b-tooltip
      )
    lah-mgmt-board-fee-form-state.mt-n1(
      ref="formState",
      embed
    )
    hr
    .d-flex.align-items-center.my-1
      lah-fa-icon(icon="angles-right", action="move-fade-ltr", variant="danger") 收費項目
      lah-button.ml-1.border-0(
       icon="download",
        variant="outline-success",
        @click="$refs.paymentItems?.prepareExpeList(true)"
        no-icon-gutter,
        title="重新讀取「收費項目」清單",
        size="sm",
        v-b-tooltip
      )
    lah-mgmt-board-fee-form-payment-items(
      ref="paymentItems",
      embed
    )

  template(#footer)
    .d-flex.justify-content-center.align-items.center
      lah-button(
        v-if="dataReady",
        icon="window-restore",
        variant="outline-success",
        @click="detail",
        pill
      ) 詳情
      lah-button.text-nowrap(
        v-else
        icon="search",
        action="swim",
        variant="outline-primary",
        :disabled="!searchValOK",
        @click="search"
        pill
      ) 查詢
      lah-button.ml-1(
        v-if="dataReady && stateButton",
        icon="floppy-disk",
        variant="outline-primary",
        @click="popupState",
        pill
      ) 狀態管理
      lah-button.ml-1(
        v-if="dataReady && paymentButton",
        icon="file-invoice-dollar",
        variant="outline-dark",
        @click="popupPayment",
        pill
      ) 付款項目
      lah-button.ml-1(
        icon="arrow-rotate-left",
        variant="outline-secondary",
        action="cycle-alt",
        @click="clearSearchData",
        pill
      ) 清除

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'
import lahMgmtBoardFeeFormPaymentItemsVue from './lah-mgmt-board-fee-form-payment-items.vue'
import lahMgmtBoardFeeFormStateVue from './lah-mgmt-board-fee-form-state.vue'

export default {
  components: { lahFeeDataDetailVue, lahMgmtBoardFeeFormStateVue, lahMgmtBoardFeeFormPaymentItemsVue },
  props: {
    stateButton: { type: Boolean, default: false },
    paymentButton: { type: Boolean, default: false }
  },
  data: () => ({
    searchYear: '113',
    searchYears: [],
    searchType: 'pc',
    options: [
      { text: '電腦給號', value: 'pc' },
      { text: '憑證序號', value: 'aa' }
    ],
    searchLabel: '電腦給號',
    searchPlaceholder: 'e.g. 0054321',
    searchVal: ''
  }),
  computed: {
    dataReady () {
      return !this.$utils.empty(this.expaaData)
    },
    expaaData () {
      return this.$store.getters['inf/expaaData']
    },
    bakedExpaaData () {
      return this.$store.getters['inf/bakedExpaaData']
    },
    searchValOK () {
      if (this.$utils.empty(this.searchVal)) {
        return null
      }
      if (this.searchType === 'pc') {
        return this.searchVal.length < 8
      }
      return this.searchVal.length < 11
    }
  },
  watch: {
    searchType (val) {
      this.clearSearchData()
      this.searchLabel = (val === 'pc') ? '電腦給號' : '憑證序號'
      this.searchPlaceholder = (val === 'pc') ? 'e.g. 0012345' : 'e.g. AA012345678'
      this.searchVal = ''
      this.$refs.keyword?.focus()
      if (val === 'pc') {
        this.searchMaxPcNumber()
      } else {
        this.searchMaxAaNumber()
      }
    }
  },
  created () {
    const now = new Date()
    this.searchYear = now.getFullYear() - 1911
    this.searchYears = [{ text: this.searchYear, value: this.searchYear }]
    this.clearSearchData()
    this.searchMaxPcNumber()
  },
  mounted () {
    this.prepareYears()
  },
  methods: {
    async prepareYears () {
      const years = await this.getCache('lah-case-input-group-year')
      if (years !== false) {
        this.searchYears = [...years]
      } else {
        this.searchYears = []
        // set year select options
        const len = this.year - 104
        for (let i = 0; i <= len; i++) {
          this.searchYears.push({ value: 104 + i, text: 104 + i })
        }
        this.setCache('lah-case-input-group-year', this.searchYears, 24 * 60 * 60 * 1000) // cache for a day
      }
      if (this.$utils.empty(this.searchYears)) {
        this.timeout(this.prepareYears, 400)
      }
    },
    searchMaxPcNumber () {
      this.clearSearchData()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOIEXP, {
        type: 'expaa_max_pc',
        year: this.searchYear
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.searchVal = data.raw
        } else {
          this.warning(data.message, {
            title: '搜尋最大電腦給號'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    searchMaxAaNumber () {
      this.clearSearchData()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOIEXP, {
        type: 'expaa_latest_aa',
        year: this.searchYear
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.searchVal = data.raw
        } else {
          this.warning(data.message, {
            title: '搜尋最新單據編號'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    search () {
      this.clearSearchData()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.MOIEXP, {
        type: `expaa_by_${this.searchType}`,
        year: this.searchYear,
        keyword: this.searchVal
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          if (Array.isArray(data.raw) && data.raw.length > 0) {
            this.$store.commit('inf/expaaData', data.raw[0])
            this.$store.commit('inf/bakedExpaaData', data.baked)
          } else {
            this.warning(`${this.searchYear} - ${this.searchVal}`, { title: '找不到規費資料' })
            this.$utils.warn('API returned', data.raw)
          }
        } else {
          this.alert(data.message, {
            title: '搜尋規費單據'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    clearSearchData () {
      this.$store.commit('inf/expaaData', undefined)
      this.$store.commit('inf/bakedExpaaData', undefined)
    },
    detail () {
      this.modal(this.$createElement(lahFeeDataDetailVue, {
        props: {
          expaaData: this.expaaData
        }
      }), {
        title: `規費詳情 ${this.expaaData.AA04} - ${this.expaaData.AA05}`,
        size: 'md'
      })
    },
    popupState () {
      this.modal(this.$createElement(lahMgmtBoardFeeFormStateVue), {
        title: `登記案件狀態管理 ${this.$utils.caseId(this.caseId)}`,
        size: 'md'
      })
    },
    popupPayment () {
      this.modal(this.$createElement(lahMgmtBoardFeeFormPaymentItemsVue), {
        title: `登記案件暫存檔管理 ${this.$utils.caseId(this.caseId)}`,
        size: 'md'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-year-input {
  width: 200px;
}
</style>
