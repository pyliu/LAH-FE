<template lang="pug">
b-card(
  :class="noBorder ? ['border-0'] : []"
  no-body
)
  .d-flex.justify-content-center: lah-button.my-1(
    icon="gear",
    action="cycle",
    title="點我產製EXCEL檔案",
    size="lg",
    @click="process"
  ) 開始產製
  lah-fa-icon(icon="list-alt", variant="secondary") 處理紀錄
  b-list-group(flush): b-list-group-item(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    lah-fa-icon(
      v-if="idx === 0"
      icon="angle-double-right",
      variant="danger",
      action="move-fade-ltr"
    )
    span.ml-1 {{ msg }}
</template>

<script>
export default {
  name: 'LahXlsxForeignerRestrictionDownload',
  props: {
    header: { type: String, default: '' },
    filename: { type: String, default: '' },
    jsonArray: { type: Array, default: () => [] },
    type: { type: String, default: '' },
    params: { type: Object, default: () => ({}) },
    noBorder: { type: Boolean, default: true }
  },
  data: () => ({
    messages: [],
    done: false
  }),
  computed: {
    downloadUrl () {
      return `http://${this.apiHost}:${this.apiPort}${this.$consts.API.FILE.XLSX}?type=file_inheritance_restriction_xlsx&site=${this.site}&is17`
    }
  },
  watch: { },
  created () { },
  mounted () {
    this.addMessage(`有 ${this.jsonArray.length} 筆資料。`)
    this.addMessage(`download url ${this.downloadUrl}`)
    console.warn(this.jsonArray)
  },
  methods: {
    addMessage (msg) {
      this.messages.unshift(`${this.$utils.time()}: ${msg}`)
    },
    process () {
      this.addMessage(`準備 ${this.header} 資料轉換 ... `)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
