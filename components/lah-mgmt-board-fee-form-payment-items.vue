<template lang="pug">
b-card(border-variant="info")
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="3", size="lg") 規費單據付款項目管理]
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
      //- ul
      //-   li 電腦給號規則： #[b.text-danger 9] + #[b.text-primary year (3 digits)] + #[b.text-success serial (3 digits)]
      //-   li 範例： #[b.text-danger 9]#[b.text-primary 111]#[b.text-success 001]、9111002 ... 以此類推
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

  .center-container-wh-100(v-if="dataReady")
    lah-fa-icon(icon="spinner", spin)
    lah-fa-icon(v-if="notFound" icon="exclamation-circle" variant="success" size="lg") 無付款資料項目。
  h5.center(v-else): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋規費！

  //- template(#footer)
  //-   .d-flex.justify-content-center.align-items.center

</template>

<script>
import lahFeeDataDetailVue from './lah-fee-data-detail.vue'

export default {
  components: { lahFeeDataDetailVue },
  data: () => ({
  }),
  computed: {
    dataReady () {
      return !this.$utils.empty(this.expaaData)
    },
    expaaData () {
      return this.$store.getters['inf/expaaData']
    },
    notFound () {
      return true
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
