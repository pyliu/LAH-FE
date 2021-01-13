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
    <hr/>
    <p class="h6 my-2 align-middle">滑鼠點擊 <lah-fa-icon icon="share-square" variant="primary"/>開啟案件詳情視窗</p>
    <p class="h6 my-2 align-middle">滑鼠點擊 <lah-fa-icon icon="sync" variant="secondary"/>立即讀取最新資料</p>
    <p class="h6 my-2 align-middle">滑鼠點擊 <lah-fa-icon icon="bars" variant="dark"/>顯示側邊攔選單</p>
    <p class="h6 my-2 align-middle">滑鼠點擊 <lah-fa-icon icon="home" variant="success"/>回首頁</p>
  </b-modal>
</template>

<script>
export default {
  props: {
    modalId: { type: String, required: true },
    modalTitle: { type: String, default: "頁面說明" },
    size: { type: String, default: "md" },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: false }
  },
};
</script>

<style lang="scss" scoped>
</style>
