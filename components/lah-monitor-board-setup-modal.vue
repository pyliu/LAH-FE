<template lang="pug">
b-modal(
  ref="setupModal"
  :hide-footer="hideFooter"
  :centered="centered"
  :size="size"
  :scrollable="scrollable"
  :no-close-on-backdrop="noCloseOnBackdrop"
)
  template(#modal-title): div(v-html="modalTitle")
  slot
</template>

<script>
export default {
  props: {
    modalTitle: { type: String, default: '智慧監控儀表板設定' },
    size: { type: String, default: 'md' },
    scrollable: { type: Boolean, default: false },
    centered: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: true },
    noCloseOnBackdrop: { type: Boolean, default: false }
  },
  methods: {
    show () {
      this.$refs.setupModal?.show()
    },
    hide () {
      this.$refs.setupModal?.hide()
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
