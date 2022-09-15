<template lang="pug">
b-card
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="ban", size="lg", variant="danger") 無電腦給號規費收據作廢]
      b-button-group.ml-auto(size="sm")
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="無電腦給號規費收據作廢說明"
        )
    lah-help-modal(ref="help", modal-title="無電腦給號規費收據作廢說明")
      h5 本項功能提供管理師在無電腦給號的情形下作廢規費單據。
      ul
        li 電腦給號規則： #[b.text-danger 9] + #[b.text-primary year (3 digits)] + #[b.text-success serial (3 digits)]
        li 範例： #[b.text-danger 9]#[b.text-primary 111]#[b.text-success 001]、9111002 ... 以此類推
      h6 相關欄位定義供參考
      ul
        li AA09 - 列印註記【1：已印，0：未印】
        li AA100 - 付款方式
        li AA106 - 悠遊卡繳費扣款結果
        li AA107 - 悠遊卡交易流水號
        li AA28、AA39 - 規費資料集(EXPAA)中記載金額的兩個欄位
        li AC29、AC30 - 規費項目資料集(EXPAC)中記載收費項目之金額

  .d-flex.align-items-center
    b-input-group(size="sm" title="民國年月日")
      b-input-group-prepend(is-text="") 結帳日期
      b-form-input#dummy_obsolete_date(v-model="today" placeholder="1090225" size="sm" trim="" :state="isDateValid")
    b-input-group.ml-1(size="sm")
      b-input-group-prepend(is-text="") 作廢原因
      b-form-input#dummy_obsolete_reason(v-model="reason" placeholder="卡紙" :state="isReasonValid" size="sm" trim="")
  .d-flex.align-items-center.my-1
    b-input-group(size="sm" title="作業人員")
      b-input-group-prepend(is-text="") {{operatorName || '作業人員'}}
      b-form-input#dummy_operator(v-model="operator" placeholder="HAXXXX" size="sm" trim="" :state="isOperatorValid")
    b-input-group.ml-1(size="sm" title="AB開頭編號共10碼")
      b-input-group-prepend(is-text="") 收據號碼
      b-form-input#dummy_fee_number(v-model="AbNumber" placeholder="AAXXXXXXXX" :state="isNumberValid" size="sm" trim="")

  template(#footer)
    .d-flex.justify-content-between.align-items.center
      small ※ 下一筆電腦給號：{{ nextPcNumber }}
      lah-button.mx-auto(
        v-if="!isDisabled"
        icon="plus",
        size="sm",
        :variant="isDisabled ? 'outline-primary' : 'primary'",
        @click="add",
        pill
      ) 確定新增
      b-button.text-nowrap(
        variant="outline-info",
        size="sm",
        title="顯示全部資料",
        @click="showTable",
        pill
      ) {{ year }}年 #[b-badge(variant="secondary", pill) {{ count }}]

</template>

<script>
export default {
  data: () => ({
    tableData: [],
    tableFields: [
      {
        key: 'AA01',
        label: '日期',
        sortable: true
      },
      {
        key: 'AA04',
        label: '電腦給號',
        sortable: true
      },
      {
        key: 'AA05',
        label: '收據編號',
        sortable: true
      },
      {
        key: 'AA104',
        label: '作廢原因',
        sortable: true
      },
      {
        key: 'AA39',
        label: '作業人員',
        sortable: true
      }
    ],
    year: '111',
    nextPcNumber: 9111001, // 9 + year (3 digits) + serial (3 digits)
    today: '',
    operator: '', // 作業人員
    operatorName: '',
    AbNumber: '', // 收據編號
    reason: '' // 作廢原因
  }),
  computed: {
    count () {
      return this.tableData.length
    },
    isDateValid () {
      const regex = /[0-9]{7}/i
      return regex.test(this.today) && this.today.length === 7
    },
    isOperatorValid () {
      return this.userNames && Boolean(this.userNames[this.operator])
    },
    isReasonValid () {
      return !this.$utils.empty(this.reason)
    },
    isNumberValid () {
      return this.AbNumber.length === 10
    },
    isDisabled () {
      return !this.isOperatorValid || !this.isNumberValid || !this.isReasonValid || !this.isDateValid
    }
  },
  watch: {
    operator (val) {
      this.operatorName = this.userNames[val] || ''
    }
  },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
    this.today = this.year +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2)
    this.query()
  },
  methods: {
    showTable () {
      this.modal(this.$createElement('b-table', {
        props: {
          items: this.tableData,
          fields: this.tableFields,
          hover: true,
          striped: true,
          headVariant: 'dark'
        }
      }), {
        title: `目前系統中(${this.year}年度)的無電腦給號作廢資料`,
        size: 'lg'
      })
    },
    query () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'get_dummy_ob_fees'
      }).then((res) => {
        this.tableData = res.data.raw || []
        this.tableData.map((item) => {
          if (this.userNames[item.AA39]) {
            item.AA39 = `${item.AA39} ${this.userNames[item.AA39]}`
          }
        })
        this.nextPcNumber = this.tableData.length > 0 ? parseInt(this.tableData[0].AA04) + 1 : `9${this.year}001`
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    add (e) {
      const operator = this.operator.replace(/[^A-Za-z0-9]/g, '')
      const feeNumber = this.AbNumber.replace(/[^A-Za-z0-9]/g, '')
      const reason = this.reason.replace(/['"]/g, '')

      this.confirm('確定要新增一個新的假資料以供作廢之用？').then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'add_dummy_ob_fees',
            today: this.today,
            pc_number: this.nextPcNumber,
            fee_number: feeNumber,
            operator,
            reason
          }).then((res) => {
            this.success(res.data.message, { title: '新增假規費資料' })
            this.query()
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
hr {
  margin-top: .5rem;
  margin-bottom: .5rem;
}
</style>
