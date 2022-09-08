<template lang="pug">
b-card
  template(#header)
    h6.mb-0 登記案件快速修正
  b-card-body
    lah-reg-case-input-group(v-model="caseId")
  template(#footer)
    .d-flex.justify-content-between
      a(href="#") 收件資料
      a(href="#") 辦理情形
</template>

<script>
export default {
  data: () => ({
    caseId: ''
  }),
  watch: {
    caseId (val) {
      this.$utils.warn(val)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
