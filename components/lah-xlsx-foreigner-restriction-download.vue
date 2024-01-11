<template lang="pug">
b-card(
  :class="noBorder ? ['border-0'] : []"
  no-body
)
  .d-flex.justify-content-center: lah-transition
    lah-button.my-1(
      v-if="!done",
      icon="gear",
      action="cycle",
      title="點我產製EXCEL檔案",
      size="lg",
      @click="process"
    ) 開始產製
    lah-button.my-1(
      v-else
      :href="downloadUrl",
      icon="download",
      title="下載目前產製的EXCEL檔案",
      size="lg",
      variant="success",
      link
    ) 手動下載

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
import FileSaver from 'file-saver'
export default {
  name: 'LahXlsxForeignerRestrictionDownload',
  props: {
    header: { type: String, default: '' },
    filename: { type: String, default: '' },
    jsonArray: { type: Array, default: () => [] },
    is17: { type: Boolean, default: false },
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
      return `http://${this.apiHost}:${this.apiPort}/export/${this.site}.xlsx`
    }
  },
  watch: { },
  created () { },
  mounted () {
    this.addMessage(`有 ${this.jsonArray.length} 筆資料。`)
  },
  methods: {
    addMessage (msg) {
      this.messages.unshift(`${this.$utils.time()}: ${msg}`)
    },
    process () {
      this.isBusy = true
      this.done = false
      this.addMessage(`準備 ${this.header} 資料轉換 ... `)
      // set content response type to blob
      this.$axios.post(this.$consts.API.FILE.XLSX, {
        type: 'file_inheritance_restriction_xlsx',
        site: this.site,
        is17: this.is17,
        jsons: this.jsonArray
      }, {
        responseType: 'blob'
      }).then(({ data }) => {
        this.addMessage('資料轉換完成 ✔')
        const title = this.is17 ? '依土地法規定管制清冊' : '依土地法規定17條第1項各款以外管制清冊'
        FileSaver.saveAs(data, `${this.site}_${title}_${this.$utils.today()}.xlsx`)
        this.done = true
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
