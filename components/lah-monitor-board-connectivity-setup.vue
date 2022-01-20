<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    span
      lah-fa-icon(icon="server")
      span {{ entries.length }} 個監控系統
    b-button-group(size="sm")
      lah-button(
        icon="plus",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        title="新增監控標的"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 設定說明`")
      ul
        li 管理監控系統項目

  b-table.max-vh(
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

  b-modal(ref="edit", hide-footer, scrollable, no-close-on-backdrop)
    template(#modal-title) 監控系統資料
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
  name: 'LahMonitorBoardConnectivitySetup',
  emit: ['update'],
  data: () => ({
    header: '系統連線狀態標的設定',
    updatedTime: '',
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
  fetch () {
    this.loadWatchTarget()
  },
  mounted () {
    this.timeout(() => this.$emit('update'), 3000)
  },
  methods: {
    loadWatchTarget () {
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'monitor_targets',
          raw: true
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.entries = [...data.raw]
          } else {
            this.warning(data.message, { title: '讀取監測目標' })
          }
        })
        .catch((err) => {
          this.$utils.error('讀取監測目標失敗', err)
          this.alert(err.toString(), { title: '讀取監測目標失敗' })
        })
        .finally(() => {
          this.updatedTime = this.$utils.now().split(' ')[1]
        })
    },
    add () {
    },
    remove (entry) {
    },
    edit (entry) {
    }
  }
}
</script>

<style lang="scss" scoped>
.max-vh {
  max-height: calc(100vh - 270px);
}
</style>
