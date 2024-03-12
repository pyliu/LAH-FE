<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div 地政系統簡訊記錄綜合查詢
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
    lah-help-modal(:modal-id="'help-modal'")
      .h5 請參照下列資訊輸入關鍵字查詢
      ul
        li 今天日期(預設)，範例「1130312」
        li 電子郵件
        li 手機號碼
        li 日期區間，範例「1130101 ~ 1130229」
  //- below is the customize area
  lah-adm-smslog-table(:inKeyword="$utils.today('TW')")
</template>

<script>
export default {
  data: () => ({}),
  head: {
    title: '地政系統簡訊記錄綜合查詢-桃園市地政局'
  },
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
</style>
