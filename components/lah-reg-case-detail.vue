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
import regCaseBase from "~/assets/js/reg-case-mixin.js"

export default {
  name: 'lahRegCaseDetail',
  components: {
    lahRegCaseFlow: () => import('~/components/lah-reg-case-flow.vue'),
    lahRegCaseData: () => import('~/components/lah-reg-case-data.vue'),
    lahRegCaseStatus: () => import('~/components/lah-reg-case-status.vue')
  },
  mixins: [regCaseBase]
};
</script>

<style lang="scss" scoped></style>
