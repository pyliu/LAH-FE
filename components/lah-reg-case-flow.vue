<template>
  <b-card :no-body="noBody" :title="`案件流程 ${ID}`" class="border-0">
    <lah-reg-b-table
      :bakedData="[bakedData]"
      type="flow"
      :mute="true"
    ></lah-reg-b-table>
  </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js";
export default {
  mixins: [regCaseBase],
  props: {
      noBody: { type: Boolean, default: false }
  },
  computed: {
    ID () { return `${this.year}-${this.code}-${this.number}` }
  }
};
</script>

<style lang="scss" scoped>
</style>
