<template>
  <b-modal :id="modalId" hide-footer centered :size="size" scrollable>
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
    modalTitle: { type: String, default: '頁面說明' },
    size: { type: String, default: 'xl' }
  }
};
</script>

<style lang="scss" scoped>
</style>
