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
    ) {{ isBusy ? '產製中...勿關閉視窗' : '開始產製' }}
    .my-1(v-else)
      h6 ✅ 產製完成，請查看下載視窗(Ctrl + J)另存新檔後開啟。
      .d-flex.justify-content-end.align-items-center.small.text-muted
        span 若無自動下載請按
        b-link.mx-1(:href="downloadUrl", target="_blank") 這裡
        span 手動下載
      //- lah-button.my-1(
      //-   :href="downloadUrl",
      //-   icon="download",
      //-   title="下載目前產製的EXCEL檔案",
      //-   size="lg",
      //-   variant="success",
      //-   link
      //- ) 手動下載

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
  name: 'LahXlsxSurTrackingDownload',
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
      return `http://${this.apiHost}:${this.apiPort}/export/${this.site.toUpperCase()}.xlsx`
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
        type: 'file_sur_tracking_xlsx',
        site: this.site,
        jsons: this.jsonArray,
        header: this.header
      }, {
        responseType: 'blob'
      }).then(({ data }) => {
        this.addMessage('資料轉換完成 ✔')
        const title = '測量案件管制清單'
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
