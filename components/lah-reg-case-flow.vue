<template>
  <b-card :no-body="compact" :title="`案件流程 ${ID}`" class="border-0">
    <lah-transition>
      <lah-reg-b-table
        v-if="ready"
        :bakedData="[bakedData]"
        type="flow"
        :mute="true"
      />
    </lah-transition>
  </b-card>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js";
import lahTransition from './lah-transition.vue';
export default {
  components: { lahTransition },
  mixins: [regCaseBase],
  props: {
      compact: { type: Boolean, default: false }
  }
};
</script>

<style lang="scss" scoped>
</style>
