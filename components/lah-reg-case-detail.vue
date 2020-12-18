<template>
  <div v-if="ready">
    <!-- header flow table -->
    <lah-reg-case-flow compact :parent-data="bakedData"></lah-reg-case-flow>
    <!-- detail info card -->
    <b-card-group deck>
      <lah-reg-case-data :parent-data="bakedData"></lah-reg-case-data>
      <lah-reg-case-status :parent-data="bakedData"></lah-reg-case-status>
    </b-card-group>
  </div>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-base.js"

export default {
  name: 'lah-reg-case-detail',
  mixins: [regCaseBase],
  watch: {
    ready (flag) {
      this.trigger('ready', flag)
    }
  },
  created () {
    this.trigger('ready', this.ready)
  }
};
</script>

<style lang="scss" scoped></style>
