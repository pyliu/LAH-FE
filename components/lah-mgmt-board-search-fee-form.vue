<template lang="pug">
b-card(border-variant="info")
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="1", size="lg") 搜尋規費單據]
      b-button-group.ml-auto(size="sm")
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="搜尋規費單據說明"
        )
    lah-help-modal(ref="help", modal-title="搜尋規費單據說明")
      h5 本項功能提供管理師查詢規費單據，以利進行調整資料作業。
      //- ul
      //-   li 電腦給號規則： #[b.text-danger 9] + #[b.text-primary year (3 digits)] + #[b.text-success serial (3 digits)]
      //-   li 範例： #[b.text-danger 9]#[b.text-primary 111]#[b.text-success 001]、9111002 ... 以此類推
      h6 規費資料集(EXPAA)相關欄位定義參考
      ul
        li AA01 - 收費日期
        li AA04 - 電腦給號
        li AA05 - 收據編號
        li AA09 - 列印註記【1：已印，0：未印】
        li AA100 - 付款方式
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
        li AC20 - 收費項目
        li AC29 - 應收金額
        li AC30 - 實收金額

  //- .center-container-wh-100
  .d-flex.mb-2
    lah-fa-icon.mr-2(icon="magnifying-glass-arrow-right", size="lg", append, action="breath") 搜尋選項
    b-radio-group(
      v-model="searchType",
      :options="options"
    )
  .d-flex
    lah-transition: b-input-group.text-nowrap.mr-1.fixed-year-input(
      v-if="searchType === 'pc'",
      prepend="年度"
    )
      b-select.h-100(
        ref="year",
        v-model="searchYear",
        :options="searchYears"
      )
    b-input-group.text-nowrap(
      :prepend="searchLabel"
    )
      b-input.h-100(
        ref="keyword",
        v-model="searchVal",
        :state="searchValOK",
        :placeholder="searchPlaceholder"
      )
  //- .d-flex.align-items-center
  //-   b-input-group(size="sm" title="民國年月日")
  //-     b-input-group-prepend(is-text="") 結帳日期
  //-     b-form-input#dummy_obsolete_date(v-model="today" placeholder="1090225" size="sm" trim="" :state="isDateValid")
  //-   b-input-group.ml-1(size="sm")
  //-     b-input-group-prepend(is-text="") 作廢原因
  //-     b-form-input#dummy_obsolete_reason(v-model="reason" placeholder="卡紙" :state="isReasonValid" size="sm" trim="")
  //- .d-flex.align-items-center.my-1
  //-   b-input-group(size="sm" title="作業人員")
  //-     b-input-group-prepend(is-text="") {{operatorName || '作業人員'}}
  //-     b-form-input#dummy_operator(v-model="operator" placeholder="HAXXXX" size="sm" trim="" :state="isOperatorValid")
  //-   b-input-group.ml-1(size="sm" title="AB開頭編號共10碼")
  //-     b-input-group-prepend(is-text="") 收據號碼
  //-     b-form-input#dummy_fee_number(v-model="AbNumber" placeholder="AAXXXXXXXX" :state="isNumberValid" size="sm" trim="")

  template(#footer)
    .d-flex.justify-content-center.align-items.center
      lah-button.text-nowrap(
        icon="search",
        action="swim",
        variant="outline-primary",
        size="sm",
        :disabled="!searchValOK"
        pill
      ) 搜尋

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'

export default {
  components: { lahFeeDataDetailVue },
  data: () => ({
    searchYear: '111',
    searchYears: [],
    searchType: 'pc',
    options: [
      { text: '電腦給號', value: 'pc' },
      { text: '規費單號', value: 'aa' }
    ],
    searchLabel: '電腦給號',
    searchPlaceholder: '最多7位數字',
    searchVal: ''
  }),
  computed: {
    dataReady () {
      return !this.$utils.empty(this.expaaData)
    },
    expaaData () {
      return this.$store.getters['inf/expaaData']
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
      this.searchLabel = (val === 'pc') ? '電腦給號' : '規費單號'
      this.searchPlaceholder = (val === 'pc') ? 'e.g. 0012345' : 'e.g. AA012345678'
      this.$refs.keyword?.focus()
    }
  },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
    this.prepareYears()
  },
  methods: {
    prepareYears () {
      this.getCache('lah-case-input-group-year').then((years) => {
        if (years !== false) {
          this.searchYears = [...years]
        } else {
          // set year select options
          const len = this.year - 103
          for (let i = 0; i <= len; i++) {
            this.searchYears.push({ value: 103 + i, text: 103 + i })
          }
          this.setCache('lah-case-input-group-year', this.searchYears, 24 * 60 * 60 * 1000) // cache for a day
        }
      }).finally(() => {
        if (this.$utils.empty(this.searchYears)) {
          this.timeout(() => this.prepareYears(), 1000)
        }
      })
    },
    search () {
      this.clearSearchData()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_case',
        id: this.caseId
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.$store.commit('inf/expaaData', data.baked)
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
    },
    detail () {
      this.modal(this.$createElement(lahFeeDataDetailVue, {
        props: {
          expaaData: this.expaaData
        }
      }), {
        title: `規費單據詳情 ${this.expaaData.AA04} - ${this.expaaData.AA05}`,
        size: 'lg'
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
