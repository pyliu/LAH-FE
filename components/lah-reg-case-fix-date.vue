<template lang="pug">
  div(v-if="ready")
    span {{ parentData.收件字號 }}
    //- <!-- header flow table -->
    //- lah-reg-case-flow(compact :parent-data="bakedData")
    //- <!-- detail info card -->
    //- b-card-group(deck)
    //-   lah-reg-case-data(:parent-data="bakedData")
    //-   lah-reg-case-status(:parent-data="bakedData")
</template>

<script>
import regCaseBase from '~/components/lah-reg-case-base.js'

export default {
  /* from lah-reg-case-base.js
  props: {
    parentData: { type: Object, default: undefined },
    // the id format should be '109HB04001234'
    caseId: { type: String, default: '' }
  },
  */
  name: 'lah-reg-case-fix-date',
  mixins: [regCaseBase],
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    }
  },
  mounted () {
    this.trigger('ready', this.ready)
  }
};
</script>

<style lang="scss" scoped></style>
