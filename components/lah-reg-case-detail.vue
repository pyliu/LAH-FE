<template lang="pug">
div(v-if="!$utils.empty(bakedData)")
  //- <!-- header flow table -->
  lah-reg-case-flow(compact :parent-data="bakedData")
  //- <!-- detail info card -->
  b-card-group(deck)
    lah-reg-case-data(:parent-data="bakedData")
    lah-reg-case-status(:parent-data="bakedData")
h4.text-center.text-info.my-5(v-else)
  b-spinner(small type="grow")
    strong.ld-txt 查詢中...
</template>

<script>
import regCaseBase from '~/components/lah-reg-case-base.js';

export default {
  name: 'LahRegCaseDetail',
  mixins: [regCaseBase],
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    }
  },
  mounted () {
    this.trigger('ready', this.ready)
  }
}
</script>

<style lang="scss" scoped></style>
