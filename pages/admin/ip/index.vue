<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto IP對應表管理
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li 可於此頁面管理靜態IP對應表
          li 可查看使用者回報IP紀錄
      .d-flex

    b-card-group(deck)
      b-card
        b-table(striped hover :items="static")

      b-card
        b-table(striped hover :items="dynamic" size="sm")
          template(#cell(timestamp)="{ item }")
            div {{ $utils.tsAdDateStr(item.timestamp, true) }}
</template>

<script>
export default {
  middleware: ['isAdmin'],
  asyncData ({ store, redirect, error }) { return {} },
  data: () => ({
    entries: []
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
