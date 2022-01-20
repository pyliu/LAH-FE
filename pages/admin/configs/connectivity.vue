<template lang="pug">
div
  lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
    .d-flex
      .my-auto 監控系統對應表管理
      lah-button(
        icon="info",
        action="bounce",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
      lah-help-modal(ref="help"): ol
        li 利用本頁面管理監控標的對應表
    .d-flex
  b-card.fixed-vh
    template(#header): .d-flex.justify-content-between
      h4 監控系統對應表
      lah-button(
        icon="plus",
        variant="outline-primary",
        title="新增靜態IP資料",
        no-icon-gutter,
        v-b-modal.replace-static-modal,
        pill
      )
    b-table.b-table-max-height(
      striped,
      hover,
      responsive,
      bordered,
      caption-top,
      no-border-collapse,
      small,
      selectable,
      sticky-header,
      head-variant="dark",
      select-mode="single",
      selected-variant="warning",
      :items="entries",
      :fields="fields"
    )
      template(#cell(timestamp)="{ item }"): .text-nowrap {{ $utils.tsToAdDateStr(item.timestamp, false) }}
      template(#cell(entry_type)="{ item }"): div {{ item.entry_type === 'SERVER' ? '伺服器' : '其他終端' }}
      template(#cell(操作)="{ item }")
        b-button-group
          lah-button.mr-1(
            icon="edit",
            variant="outline-primary",
            no-icon-gutter,
            title="編輯",
            @click="edit(item)",
            pill
          )
          lah-button(
            icon="times",
            variant="outline-danger",
            no-icon-gutter,
            title="移除",
            @click="remove(item)",
            pill
          )

  b-modal#replace-static-modal(hide-footer, scrollable, no-close-on-backdrop)
    template(#modal-title) 編輯監控系統資料
    b-input-group(prepend="系統ＩＰ"): b-input(
      v-model="entry.ip",
      :state="isIPv4",
      placeholder="... 220.1.3X.XX ..."
    )
    b-input-group.my-1(prepend="服務埠號"): b-select(
      v-model="entry.entry_type",
      :options="[ { value: 'SERVER', text: '伺服器' }, { value: 'OTHER_EP', text: '其他終端' }, ]",
      :state="staticTypeCheck"
    )
    b-input-group.my-1(prepend="系統名稱"): b-input(
      v-model="entry.entry_desc",
      :state="staticNameCheck"
    )
    b-input-group.my-1(prepend="監控備註"): b-input(v-model="entry.note")
    b-button-group.center: lah-button(
      icon="save",
      no-icon-gutter,
      :disabled="staticSaveDisabled",
      @click="replace"
    ) 儲存
</template>

<script>
export default {
  // middleware: ['isAdmin'],
  data: () => ({
    entry: {
      ip: '',
      port: '',
      name: '',
      monitor: 'N',
      note: ''
    },
    entries: [],
    fields: [
      '操作',
      { key: 'ip', label: '監控IP', sortable: true },
      { key: 'port', label: '監控埠號', sortable: true },
      { key: 'name', label: '系統名稱', sortable: true },
      { key: 'monitor', label: '啟用監控', sortable: true },
      { key: 'note', label: '系統備註', sortable: false }
    ]
  }),
  fetchOnServer: false,
  fetch () {
    this.$axios
      .post(this.$consts.API.JSON.MONITOR, {
        type: 'monitor_targets'
      })
      .then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.entries = [...Object.values(data.raw)]
        } else {
          this.warning(data.message, { title: '讀取監測目標' })
        }
      })
      .catch((err) => {
        this.$utils.error('讀取監測目標失敗', err)
        this.alert(err.toString(), { title: '讀取監測目標失敗' })
      })
      .finally(() => {
        this.$utils.warn(this.entries)
      })
  },
  head: {
    title: 'IP對應表管理'
  },
  computed: {
    isIPv4 () {
      return this.$utils.isIPv4(this.entry.ip)
    },
    staticTypeCheck () {
      return ['SERVER', 'OTHER_EP'].includes(this.entry.entry_type)
    },
    staticNameCheck () {
      return !this.$utils.empty(this.entry.entry_desc)
    },
    staticSaveDisabled () {
      return !this.isIPv4 || !this.staticTypeCheck || !this.staticNameCheck
    },
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
  watch: {},
  created () {},
  mounted () {
    setInterval(this.$fetch, 60 * 1000)
  },
  methods: {
    replace () {
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.IP, {
          type: 'add_static_ip_entry',
          ip: this.entry.ip,
          entry_type: this.entry.entry_type,
          entry_desc: this.entry.entry_desc,
          note: this.entry.note
        })
        .then(({ data }) => {
          if (data.status < 1) {
            this.alert(data.message)
          } else {
            this.notify(data.message, { type: 'success' })
            this.entry = {
              ...{
                ip: '',
                entry_type: '',
                entry_desc: '',
                note: ''
              }
            }
            this.$fetch()
            this.$bvModal.hide('replace-static-modal')
          }
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.isBusy = false
        })
    },
    edit (record) {
      this.entry = { ...record }
      this.$bvModal.show('replace-static-modal')
    },
    remove (record) {
      this.confirm(
        `確定要刪除 ${record.ip}, ${record.added_type}, ${record.entry_type} 資料?`
      ).then((YN) => {
        if (YN) {
          this.$axios
            .post(this.$consts.API.JSON.IP, {
              type: 'remove_ip_entry',
              ip: record.ip,
              added_type: record.added_type,
              entry_type: record.entry_type
            })
            .then(({ data }) => {
              if (this.$utils.statusCheck(data.status)) {
                this.notify(data.message, { type: 'success' })
                this.$fetch()
              } else {
                this.alert(data.message)
              }
            })
        }
      })
    },
    time (item) {
      const full = this.$utils.tsToAdDateStr(item.timestamp, true)
      const date = full.split(' ')[0]
      const time = full.split(' ')[1]
      const now = this.$utils.now()
      return now.startsWith(date) ? time : date
    }
  }
}
</script>

<style scoped lang="scss">
.fixed-vh {
  height: calc(100vh - 100px);
  overflow: hidden;
}
.b-table-max-height {
  max-height: calc(100vh - 205px);
}
</style>
