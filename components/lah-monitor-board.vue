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
    )
      slot(name="help")
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示超過一天未更新
      div 🔴 表示狀態錯誤
  slot
  ul: li(v-for="(item, idx) in headLogs"): a(href="#" @click="popupLogContent(item)" title="顯示詳細記錄")
    .d-flex.justify-content-between
      .truncate-half {{ item.title }}
      lah-fa-icon(icon="clock" regular) {{ displayDatetime(item.timestamp) }}
    .truncate.text-muted.small {{ item.content }}
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
    logs: [
      { timestamp: +new Date() / 1000, title: '220.1.xx.xx DB is online', content: 'TEST' },
      { timestamp: +new Date() / 1000 + 10, title: '220.1.xx.xx DB is offline', content: 'TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' },
      { timestamp: +new Date() / 1000 + 20, title: '220.1.xx.xx DB is online but the status is not good.', content: 'TEST3' },
      { timestamp: +new Date() / 1000 + 30, title: '220.1.xx.xx DB has no response', content: 'TEST4TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2TEST2' }
    ]
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
    },
    queryType () {
      switch (this.header) {
        case '主資料庫':
          return 'dbMain'
      }
      return 'unknown'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    // use this.site to determine which office
  },
  methods: {
    displayDatetime (ts) {
      const fullDt = this.$utils.tsToAdDateStr(ts, true)
      return fullDt.replace(this.today, '')
    },
    popupLogContent (item) {
      this.modal(item.content, {
        title: `${this.header} - ${item.title}`,
        size: 'xl'
      })
    },
    reload () {

    }
  }
}
</script>

<style lang="scss" scoped>
@mixin truncateBase() {
  width: calc((100vw - 350px) / 3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.truncate {
  @include truncateBase();
}
.truncate-half {
  @include truncateBase();
  width: calc((100vw - 350px) / 6);
}
</style>
