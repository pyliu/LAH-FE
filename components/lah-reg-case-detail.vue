<template>
  <div v-if="ready">
    <!-- header flow table -->
    <lah-reg-case-flow compact></lah-reg-case-flow>
    <!-- detail info card -->
    <b-card-group deck>
      <lah-reg-case-data></lah-reg-case-data>
      <lah-reg-case-status></lah-reg-case-status>
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
  mixins: [regCaseBase],
  props: {
    tabsAtEnd: { type: Boolean, default: false },
  },
  computed: {
    ready() {
      return !this.$utils.empty(this.bakedData);
    },
  },
};
</script>

<style lang="scss" scoped></style>
