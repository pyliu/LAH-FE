<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    lah-button.ml-auto(
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
  template(#footer): .d-flex.justify-content-end
    .text-muted.small {{ timestamp }}
</template>

<script>
export default {
  props: {
    header: { type: String, default: '未設定監控標的' }
  },
  data: () => ({
    modalId: 'tmp-id',
    light: 'danger',
    timestamp: ''
  }),
  created () {
    this.modalId = this.$utils.uuid()
    this.timestamp = this.$utils.now()
  }
}
</script>

<style lang="scss" scoped>
</style>
