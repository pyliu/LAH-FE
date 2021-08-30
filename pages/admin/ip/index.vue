<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto IP對應表管理
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li 可於此頁面管理靜態IP對應表
          li 可查看使用者回報IP紀錄
            ul: li 電腦端需安裝 #[a(href="https://ppt.cc/fA2imx" target="_blank") #[b 信差即時通程式(外網下載)]] 並正常連線才能正常回報IP
      .d-flex

    b-card-group(deck)
      b-card
        template(#header)
          h4 靜態IP對應表
        b-table(
          striped
          hover
          responsive
          bordered
          caption-top
          no-border-collapse
          small
          selectable
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="static"
          :fields="staticFields"
        )
          template(#cell(timestamp)="{ item }"): div {{ $utils.tsToAdDateStr(item.timestamp, true) }}

      b-card
        template(#header)
          h4 使用者回報IP對應表
        b-table(
          striped
          hover
          responsive
          bordered
          caption-top
          no-border-collapse
          small
          selectable
          head-variant="dark"
          select-mode="single"
          selected-variant="warning"
          :items="dynamic"
          :fields="dynamicFields"
        )
          template(#cell(timestamp)="{ item }"): div {{ $utils.tsToAdDateStr(item.timestamp, true) }}
</template>

<script>
export default {
  middleware: ['isAdmin'],
  asyncData ({ store, redirect, error }) { return {} },
  data: () => ({
    entries: [],
    staticFields: [
      { key: 'ip', label: '設定位址', sortable: true },
      { key: 'entry_id', label: '設定代號', sortable: true },
      { key: 'entry_desc', label: '設定名稱', sortable: true },
      { key: 'timestamp', label: '更新時間', sortable: true }
    ],
    dynamicFields: [
      { key: 'ip', label: '連線位址', sortable: true },
      { key: 'entry_id', label: '登入帳號', sortable: true },
      { key: 'entry_desc', label: '登入名稱', sortable: true },
      { key: 'timestamp', label: '登入時間', sortable: true }
    ]
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios.post(this.$consts.API.JSON.IP, {
      type: 'ip_entries'
    }).then(({ data }) => {
      this.entries = [...data.raw]
    }).catch((err) => {
      this.alert(err)
    }).finally(() => {
    })
  },
  head: {
    title: 'IP對應表管理'
  },
  computed: {
    static () {
      return this.entries.filter((entry, idx, arr) => {
        return entry.added_type === 'STATIC'
      })
    },
    dynamic () {
      return this.entries.filter((entry, idx, arr) => {
        return entry.added_type === 'DYNAMIC'
      })
    }
  },
  watch: {
  },
  created () {
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style scoped lang="scss">
</style>
