<template lang="pug">
  b-modal(
    :id="modalId"
    :hide-footer="hideFooter"
    :centered="centered"
    :size="size"
    :scrollable="scrollable"
    :no-close-on-backdrop="noCloseOnBackdrop"
  )
    template(#modal-title): div(v-html="modalTitle")
    slot
    hr
    p.h6.my-2.align-middle.
      滑鼠點擊
      #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      開啟案件詳情視窗

    p.h6.my-2.align-middle.
      滑鼠點擊
      #[lah-fa-icon(icon="sync" variant="secondary")]
      立即讀取最新資料

    p.h6.my-2.align-middle.
      滑鼠點擊
      #[lah-fa-icon(icon="bars" variant="dark")]
      顯示側邊攔選單

    p.h6.my-2.align-middle.
      滑鼠點擊
      #[lah-fa-icon(icon="question" variant="success")]
      查看頁面說明

    p.h6.my-2.align-middle.
      滑鼠點擊
      #[lah-fa-icon(icon="home" variant="dark")]
      回首頁
</template>

<script>
export default {
  props: {
    modalId: { type: String, required: true },
    modalTitle: { type: String, default: '頁面說明' },
    size: { type: String, default: 'md' },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
</style>
