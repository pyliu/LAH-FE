<template lang="pug">
b-card(
  :no-body="embed",
  border-variant="info",
  :class="embed ? ['border-0'] : []"
)
  template(
    #header,
    v-if="!embed"
  )
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          icon="file-invoice-dollar",
          size="lg",
          :action="dataReady ? 'breath' : ''"
        )
          span(v-if="dataReady") {{ expaaDataPc }} - {{ expaaAaNumber }} 收費項目
          span(v-else) 規費收費項目管理
      b-button-group.ml-auto(size="sm")
        lah-button.text-nowrap(
          icon="window-restore",
          variant="outline-success",
          size="sm",
          :disabled="!dataReady"
          @click="detail"
          pill
        ) 詳情
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="規費單據付款項目說明"
        )
    lah-help-modal(ref="help", modal-title="規費單據付款項目說明")
      h5 本項功能提供管理師修改規費單據付款項目功能。
      h6 ⚠ 收費項目清單預設會暫存7天，若出納於#[strong.text-danger 近七天有異動]，請按下方按鈕更新之。
        lah-button(icon="rotate", @click="prepareExpeList(true)") 更新收費項目清單
      h6 相關欄位定義供參考
      ul
        li AC25 - 年分
        li AC04 - 電腦給號
        li AC16 - 收件年
        li AC17 - 收件字
        li AC18 - 收件號
        li AC20 - 收費項目
        li AC29 - 應收金額
        li AC30 - 實收金額

  lah-transition
    .m-0(v-if="dataReady")
      .center-container-wh-100(v-if="isBusy"): lah-fa-icon(icon="spinner", spin)
      .center-container-wh-100(v-else-if="!found"): lah-fa-icon(icon="exclamation-circle" variant="success" size="lg") 找不到規費收費項目資料！
      div(v-else)
        .my-1(v-for="(record, idx) in expacList", :key="`payment_list_item_${idx}`")
          .d-flex.align-items-center
            lah-fa-icon.mr-auto(:icon="`${idx+1}`")
              b-select.h-100(v-model="record.AC20" :options="expeList" size="sm")
                template(v-slot:first)
                  option(value disabled) -- 請選擇一個項目 --
              lah-button.mx-1(
                icon="edit",
                size="sm",
                title="修改",
                no-icon-gutter,
                @click="update(idx)"
              )
              lah-button(
                icon="up-right-from-square",
                size="sm",
                variant="outline-secondary"
                :title="`顯示 ${record.AC16}-${record.AC17}-${record.AC18} 案件詳情`",
                no-icon-gutter,
                @click="caseDetail(`${record.AC16}${record.AC17}${record.AC18}`)"
              )
            .text-nowrap.ml-1 金額 {{ $utils.addMoneyComma(record.AC30) }} 元
    h6.center(v-else-if="!embed"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋規費！

  //- template(#footer)
  //-   .d-flex.justify-content-center.align-items.center

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'

export default {
  components: { lahFeeDataDetailVue, lahRegCaseDetailVue },
  props: {
    embed: { type: Boolean, default: false }
  },
  data: () => ({
    expeList: [],
    expacList: []
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
    expaaDataYear () {
      return this.expaaData?.AA01?.substring(0, 3)
    },
    expaaDataPc () {
      return this.expaaData?.AA04
    },
    expaaAaNumber () {
      return this.expaaData?.AA05
    },
    queryOK () {
      return this.expaaDataYear && this.expaaDataPc
    },
    found () {
      return this.expacList?.length > 0
    }
  },
  watch: {
    expaaData (dontcare) {
      this.queryExpacData()
    }
  },
  created () {
    this.prepareExpeList()
    this.queryExpacData()
  },
  mounted () {},
  methods: {
    async prepareExpeList (forceRefresh = false) {
      const cachedList = forceRefresh ? false : await this.getCache('MOIEXP.EXPE')
      if (cachedList === false) {
        this.$utils.warn('開始重新讀取「收費項目」清單')
        // query MOIEXP.EXPE for the items
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.MOIEXP, {
          type: 'expe'
        }).then((res) => {
          if (this.$utils.statusCheck(res.data.status)) {
            if (res.data.data_count > 0) {
              this.expeList = []
              res.data.raw.forEach((element) => {
                this.expeList.push({
                  value: element.E20,
                  text: `${element.E20}：${element.E21}`
                })
              })
              // cache for 1 days
              this.setCache('MOIEXP.EXPE', this.expeList, 7 * 24 * 60 * 60 * 1000)
              this.info(`已更新 ${this.expeList.length} 筆收費項目資料`, { title: '更新「收費項目」清單' })
              this.$utils.warn('「收費項目」清單已更新')
            } else {
              this.warning('MOIEXP.EXPE沒有回傳資料，無法產生收費項目列表。')
            }
          } else {
            this.alert(res.data.message)
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.expeList = [...cachedList]
      }
    },
    queryExpacData () {
      this.expacList = []
      if (this.queryOK) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'expac',
          year: this.expaaDataYear,
          num: this.expaaDataPc
        }).then((res) => {
          if (this.$utils.statusCheck(res.data.status)) {
            this.expacList = [...res.data.raw]
          } else {
            // this.warning(
            // `找不到規費收費項目資料！【年度： ${this.expaaDataYear}, 電腦給號： ${this.expaaDataPc}】`,
            // { title: '查詢收費項目資料集' }
            // )
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    },
    update (idx) {
      const record = this.expacList[idx]
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'mod_expac',
        year: record.AC25,
        num: record.AC04,
        code: record.AC20,
        amount: record.AC30
      }).then((res) => {
        const found = this.expeList.find(element => element.value === record.AC20)
        if (this.$utils.statusCheck(res.data.status)) {
          this.success(`金額 ${record.AC30} 項目修正為「${found.text}」完成`, {
            title: '修改收費項目',
            subtitle: `${record.AC25}-${record.AC04}`
          })
        } else {
          this.alert(`金額 ${record.AC30} 項目修正為「${found.text}」失敗`, {
            title: '修改收費項目',
            subtitle: `${record.AC25}-${record.AC04}`
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
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
    caseDetail (id) {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: id
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.warning(`⚠ 無法找到 ${this.$utils.caseId(id)} 登記案件資料。`)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(id)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
