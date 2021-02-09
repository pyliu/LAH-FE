<template lang="pug">
  div(v-cloak)
    lah-header
      lah-transition(appear)
        .d-flex.justify-content-between.w-100.my-auto
          .d-flex
            div 標題區域
            lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
          div 右側選單區域
      lah-help-modal(:modal-id="'help-modal'" size="xl"): lah-button(icon="exclamation-circle" variant="danger")
    b-container.center(fluid v-cloak)
      | some contents goes here ...
</template>

<script>
export default {
  head: {
    title: '樣板頁面-桃園市地政局'
  },
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
</style>
