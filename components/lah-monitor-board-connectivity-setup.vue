<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between.align-items-center
    span
      lah-fa-icon(icon="server", size="lg")
      span {{ entries.length }} 個監控系統
    b-button-group(size="sm")
      lah-button.mr-1(
        icon="plus",
        variant="outline-primary",
        no-icon-gutter,
        pill,
        title="新增監控標的",
        @click="add"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明",
        pill
      )
    lah-help-modal(ref="help", :modal-title="`${header} 設定說明`")
      ul
        li 管理監控系統項目
        li 點選 #[lah-fa-icon(icon="plus", variant="primary", no-icon-gutter)]新增監控標的
        li 點選列表修改監控標的項目
        li 點選 #[lah-fa-icon(icon="times", variant="danger", no-icon-gutterl)]移除監控標的

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
    :fields="fields",
    @row-selected="rowSelected"
  )
    template(#cell(ip)="{ item, rowSelected }")
      .d-flex.flex-nowrap
        template(v-if="rowSelected")
          span(aria-hidden="true") ✔
          span.sr-only Selected
        template(v-else="")
          span(aria-hidden="true")
          span.sr-only Not selected
        span {{ item.ip }}

    template(#cell(刪除)="{ item }")
      lah-button(
        icon="times",
        variant="outline-danger",
        no-icon-gutter,
        title="移除",
        size="sm",
        @click="remove(item)",
        pill
      )

    template(#cell(monitor)="{ item }")
      b-button-group(size="sm"): b-checkbox(
        switch,
        v-model="item.monitor",
        value="Y",
        unchecked-value="N"
        @change="handleMonitorSwitch(item)"
      )

    template(#cell(note)="{ item }")
      div(v-html="htmlNote(item)")

  b-modal(ref="replaceModal", hide-footer, scrollable, no-close-on-backdrop)
    template(#modal-title) 監控系統資料
    b-input-group.my-1(size="lg"): b-checkbox(
      switch,
      v-model="entry.monitor",
      value="Y",
      unchecked-value="N"
    ) 啟動
    b-input-group(prepend="系統ＩＰ"): b-input(
      v-model="entry.ip",
      :state="isIPv4",
      placeholder="... 220.1.3X.XX ..."
    )
    b-input-group.my-1(prepend="服務埠號"): b-input(
      v-model="entry.port",
      type="number",
      min="0",
      max="65535",
      :state="isValidPort",
    )
    b-input-group.my-1(prepend="系統名稱"): b-input(
      v-model="entry.name",
      :state="isValidName"
    )
    b-input-group.my-1(prepend="監控備註"): b-textarea(v-model="entry.note", rows="5")
    b-button-group.center: lah-button(
      icon="save",
      no-icon-gutter,
      :disabled="!dataReady",
      @click="save"
    ) 儲存
</template>

<script>
import DOMPurify from 'dompurify'
import { marked } from 'marked'
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
      { key: 'monitor', label: '啟用', sortable: true },
      { key: 'ip', label: '監控IP', sortable: true },
      { key: 'port', label: '監控埠號', sortable: true },
      { key: 'name', label: '系統名稱', sortable: true },
      { key: 'note', label: '系統備註', sortable: false },
      '刪除'
    ]
  }),
  fetch () {
    this.loadWatchTarget()
  },
  computed: {
    isIPv4 () { return this.$utils.isIPv4(this.entry.ip) },
    isValidPort () {
      if (this.$utils.empty(this.entry.port)) {
        return null
      }
      const val = parseInt(this.entry.port)
      return val >= 0 && val <= 65535
    },
    isValidName () {
      return !this.$utils.empty(this.entry.name)
    },
    dataReady () { return this.isIPv4 && this.isValidName && this.isValidPort !== false }
  },
  methods: {
    handleMonitorSwitch (item) {
      this.$axios.post(this.$consts.API.JSON.MONITOR, {
        type: 'replace_connectivity_target',
        ...item
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          // emit 'update' event, not close modal
          this.$emit('update', false)
        } else {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
      })
    },
    loadWatchTarget () {
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'monitor_targets',
          all: true
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
      this.entry = {
        ...{
          ip: '',
          port: '',
          name: '',
          monitor: 'Y',
          note: ''
        }
      }
      this.$refs.replaceModal?.show()
    },
    remove (entry) {
      this.confirm(`請確認要刪除 ${entry.name} - ${entry.ip}:${entry.port} 監控標的？`).then((YN) => {
        if (YN) {
          this.isBusy = false
          this.$axios.post(this.$consts.API.JSON.MONITOR, {
            type: 'remove_connectivity_target',
            ...entry
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              // emit 'update' event, colse modal
              this.$emit('update', true)
              this.success(data.message)
            } else {
              this.warning(data.message)
            }
          }).catch((err) => {
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    edit (entry) {
      if (!this.$utils.empty(entry)) {
        this.entry = { ...entry }
        this.$refs.replaceModal?.show()
      }
    },
    save () {
      this.isBusy = false
      this.$axios.post(this.$consts.API.JSON.MONITOR, {
        type: 'replace_connectivity_target',
        ...this.entry
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          // emit 'update' event, colse modal
          this.$emit('update', true)
          this.success(data.message)
        } else {
          this.warning(data.message)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    rowSelected (selectedArray) {
      this.edit(selectedArray[0])
    },
    htmlNote (entry) {
      if (this.$utils.empty(entry.note)) {
        return ''
      }
      return DOMPurify?.sanitize(marked.parse(entry.note.trimEnd().replaceAll("\r\n", "   \n")))
      // return entry.note.replaceAll('\r\n', '<br/>')
    }
  }
}
</script>

<style lang="scss" scoped>
.max-vh {
  max-height: calc(100vh - 270px);
}
</style>
