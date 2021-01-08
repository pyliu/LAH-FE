<template>
  <b-modal
    :id="modalId"
    :hide-footer="hideFooter"
    :centered="centered"
    :size="size"
    :scrollable="scrollable"
    :no-close-on-backdrop="noCloseOnBackdrop"
  >
    <template #modal-title>
      <div v-html="modalTitle"></div>
    </template>
    <slot></slot>
  </b-modal>
</template>

<script>
export default {
  props: {
    modalId: { type: String, required: true },
    modalTitle: { type: String, default: "頁面說明" },
    size: { type: String, default: "xl" },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: false }
  },
};
</script>

<style lang="scss" scoped>
</style>
