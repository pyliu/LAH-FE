<template>
  <lah-transition>
    <b-card v-if="ready" :no-body="compact" :title="`案件流程 ${ID}`" class="border-0">
        <lah-reg-btable
          :bakedData="[bakedData]"
          type="flow"
          :mute="true"
        />
    </b-card>
  </lah-transition>
</template>

<script>
import regCaseBase from "~/assets/js/reg-case-mixin.js"

export default {
  components: {
    lahTransition: () => import('~/components/lah-transition.vue'),
    lahRegBtable: () => import('~/components/lah-reg-btable.vue')
  },
  mixins: [regCaseBase],
  props: {
      compact: { type: Boolean, default: false }
  }
};
</script>

<style lang="scss" scoped>
</style>
