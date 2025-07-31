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
      :spin="isBusy"
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
  b-list-group(flush): b-list-group-item.d-flex.align-items-center(v-for="(msg, idx) in messages" :key="`${idx}_msg`")
    lah-fa-icon.mr-1(
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
    done: false,
    isBusy: false // 確保 isBusy 有預設值，避免未定義錯誤
  }),

  computed: {
    downloadUrl () {
      // 增加一個時間戳記作為查詢參數，確保每次下載都不會從快取中獲取
      const timestamp = new Date().getTime()
      return `http://${this.apiHost}:${this.apiPort}/export/${this.site.toUpperCase()}.xlsx?_t=${timestamp}`
    }
  },

  watch: {
    // 監聽器可以在這裡定義，目前沒有
  },

  created () {
    // 元件建立時的生命週期鉤子，目前沒有邏輯
  },

  mounted () {
    // 元件掛載後顯示資料筆數訊息
    this.addMessage(`有 ${this.jsonArray.length} 筆資料。`)
  },

  methods: {
    /**
     * 添加處理訊息到訊息列表
     * @param {string} msg - 要添加的訊息
     */
    addMessage (msg) {
      this.messages.unshift(`${this.$utils.time()}: ${msg}`)
    },

    /**
     * 觸發 Excel 檔案產製和下載的流程
     */
    process () {
      this.isBusy = true // 設定為忙碌狀態
      this.done = false // 重置完成狀態

      this.addMessage(`準備 ${this.header} 資料轉換 ... `)

      // 發送 POST 請求到後端 API 產製 Excel 檔案
      this.$axios.post(this.$consts.API.FILE.XLSX, {
        type: 'file_sur_tracking_xlsx',
        site: this.site,
        jsons: this.jsonArray,
        header: this.header
      }, {
        responseType: 'blob' // 設定響應類型為 Blob，用於檔案下載
      })
        .then(({ data }) => {
          // 請求成功，處理下載
          this.addMessage('資料轉換完成 ✔')
          const title = '測量案件管制清單'
          // 使用 file-saver 庫保存檔案
          FileSaver.saveAs(data, `${this.site}_${title}_${this.$utils.today()}.xlsx`)
          this.done = true // 設定為完成狀態
        })
        .catch((err) => {
          // 請求失敗，報告錯誤
          this.$utils.error(err)
          this.addMessage(`資料轉換失敗 ❌: ${err.message || '未知錯誤'}`) // 增加錯誤訊息顯示
        })
        .finally(() => {
          // 無論成功或失敗，最後都解除忙碌狀態
          this.isBusy = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
/* 樣式可以在這裡定義 */
</style>
