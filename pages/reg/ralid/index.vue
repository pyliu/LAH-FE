<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          div 地政系統土地標示部綜合查詢
          lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
    lah-help-modal(:modal-id="'help-modal'")
      .h5 請參照下列資訊輸入查詢
      ul
        li 段代碼，範例「0001」
        li 關鍵字，範例「龍安」
  //- below is the customize area
  lah-reg-ralid-table
</template>

<script>
export default {
  data: () => ({}),
  head: {
    title: '地政系統土地標示部綜合查詢-桃園市地政局'
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
