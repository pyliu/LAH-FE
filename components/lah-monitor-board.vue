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
  ul: li(v-for="(item, idx) in headLogs"): a(href="#" @click="popupLogContent(item)" title="顯示詳細記錄")
    .truncate {{ item.content }}
    .d-flex.justify-content-end.small
      lah-fa-icon.text-muted(icon="clock" regular) {{ displayDatetime(item.timestamp) }}
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
      { timestamp: +new Date() / 1000, content: 'TEST' },
      { timestamp: +new Date() / 1000 + 10, content: 'TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' },
      { timestamp: +new Date() / 1000 + 20, content: 'TEST3' },
      { timestamp: +new Date() / 1000 + 30, content: 'TEST4TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' }
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
    },
    today () {
      // e.g. 2021-12-27
      const now = new Date()
      return now.getFullYear() + '-' +
        ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
        ('0' + now.getDate()).slice(-2)
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.timestamp = this.$utils.now()
    // use this.site to determine which office
  },
  methods: {
    displayDatetime (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
      return fullDt.replace(this.today, '')
    },
    popupLogContent (item) {
      this.modal(item.content, {
        title: `${this.header} - ${this.displayDatetime(item.timestamp)}`,
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
