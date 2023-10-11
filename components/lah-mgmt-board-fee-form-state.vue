<template lang="pug">
b-card(
  border-variant="info",
  :no-body="embed",
  :class="embed ? ['border-0'] : []"
)
  template(
    #header,
    v-if="!embed"
  )
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          v-if="dataReady",
          icon="hard-drive",
          size="lg",
          action="breath",
          regular
        ) {{ expaaData.AA04 }} - {{ expaaData.AA05 }} 狀態管理
        lah-fa-icon(
          v-else,
          icon="hard-drive",
          size="lg"
        ) 規費單據狀態管理
      b-button-group.ml-auto(size="sm")
        lah-button.text-nowrap(
          v-if="dataReady",
          icon="window-restore",
          variant="outline-success",
          size="sm",
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
          title="規費單據狀態管理說明"
        )
    lah-help-modal(ref="help", modal-title="規費單據狀態管理說明")
      h5 本項功能提供管理師修改規費單據狀態功能。
      //- ul
      //-   li 電腦給號規則： #[b.text-danger 9] + #[b.text-primary year (3 digits)] + #[b.text-success serial (3 digits)]
      //-   li 範例： #[b.text-danger 9]#[b.text-primary 111]#[b.text-success 001]、9111002 ... 以此類推
      h6 相關欄位定義供參考
      ul
        li AA01 - 收費日期
        li AA04 - 電腦給號
        li AA08 - 作廢狀態
        li AA05 - 收據編號
        li AA09 - 列印註記【1：已印，0：未印】
        li AA08 - 收據狀態【1：正常，0：作廢】
        li AA100 - 付款方式
        li AA104 - 作廢原因

  lah-transition
    div(v-if="dataReady"): lah-fee-state-mgmt(:expaa-data="expaaData", :brief="embed")
    h6.center(v-else-if="!embed"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋規費！

  //- template(#footer)
  //-   .d-flex.justify-content-center.align-items.center

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'

export default {
  components: { lahFeeDataDetailVue },
  props: {
    embed: { type: Boolean, default: false }
  },
  data: () => ({
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
    }
  },
  watch: {
  },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
    this.today = this.year +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2)
    // this.query()
  },
  methods: {
    detail () {
      this.modal(this.$createElement(lahFeeDataDetailVue, {
        props: {
          expaaData: this.expaaData
        }
      }), {
        title: `規費詳情 ${this.expaaData.AA04} - ${this.expaaData.AA05}`,
        size: 'md'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
