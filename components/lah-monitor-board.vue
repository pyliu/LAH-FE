<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    b {{ header }}
    lah-button(
      icon="question",
      action="breath",
      variant="outline-success",
      no-border,
      no-icon-gutter,
      @click="showModalById(modalId)",
      title="說明"
    )
    lah-help-modal(
      :modal-id="modalId",
      :modal-title="`${header} 說明`"
    ): slot(name="help")
  slot
</template>

<script>
export default {
  props: {
    header: { type: String, default: '未設定監控標的' }
  },
  data: () => ({
    modalId: 'tmp-id'
  }),
  created () {
    this.modalId = this.$utils.uuid()
  }
}
</script>

<style lang="scss" scoped>
</style>
