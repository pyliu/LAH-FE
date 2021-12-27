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
  ul: li(v-for="(item, idx) in headLogs"): a(href="#" @click="popupLogContent(item)")
    lah-fa-icon(icon="clock" regular) {{ $utils.tsToAdDateStr(item.timestamp / 1000.0, true) }}
    .truncate {{ item.content }}
  template(#footer): .d-flex.justify-content-between.small.text-muted
    span {{ site }}
    span {{ timestamp }}
</template>

<script>
export default {
  props: {
    header: { type: String, default: '未設定監控標的' }
  },
  data: () => ({
    modalId: 'tmp-id',
    light: 'danger',
    timestamp: '',
    logs: [
      { timestamp: +new Date(), content: 'TEST' },
      { timestamp: +new Date() + 10, content: 'TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' },
      { timestamp: +new Date() + 20, content: 'TEST3' },
      { timestamp: +new Date() + 30, content: 'TEST4TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' }
    ],
    targets: {
      dbMain: '',
      dbBackup: '',
      dbSub: ''
    }
  }),
  computed: {
    headLogs () {
      return this.logs.filter((item, idx, arr) => idx < 3)
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.timestamp = this.$utils.now()
    // use this.site to determine which office
  },
  methods: {
    popupLogContent (item) {
      this.modal(item.content, {
        title: `${this.header}`,
        subtitle: `${this.$utils.tsToAdDateStr(item.timestamp / 1000.0)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.truncate {
  width: calc((100vw - 350px) / 3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
