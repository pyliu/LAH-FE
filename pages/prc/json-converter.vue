<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄JSON資料解析
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟操作
          ol
            li 上傳地政司端下載的JSON檔案後自動顯示處理後的表格資料
            li 利用 #[lah-fa-icon(icon="file-excel" regular variant="success" no-gutter)] 將顯示資料匯出為EXCEL檔案

      .d-flex
        lah-button-xlsx.ml-1(
          :jsons="xlsxData",
          header="實價登錄JSON檔案轉換"
        )
  .d-flex.flex-nowrap.mr-auto.mb-2
    b-file.fixed-width.mr-1(
      v-model="file",
      accept="application/json",
      placeholder="請選擇JSON檔案",
      browse-text="瀏覽"
    )
      template(slot="file-name" slot-scope="{ names }")
        b-badge(variant="dark") {{ names[0] }}
        b-badge(v-if="names.length > 1" variant="dark" class="ml-1").
          + {{ names.length - 1 }} 更多檔案
    lah-button(
        v-if="file !== null"
        icon="trash",
        title="清除選擇",
        variant="outline-success",
        @click="file = null",
        no-icon-gutter
      )
  lah-val-realprice-json-list(
    v-if="Array.isArray(jsons) && jsons.length > 0",
    :jsons="jsons"
  )
  lah-val-realprice-json-data(
    v-if="jsonData",
    :json-data="jsonData"
  )
</template>

<script>
export default {
  data: () => ({
    file: null,
    jsons: [],
    jsonData: null
  }),
  fetch () {},
  head: {
    title: '實價登錄案件資料轉換-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}`)
    },
    cacheKey () {
      return `realprice_json_convert_${this.md5Hash}`
    },
    xlsxData () {
      return this.prepareFormattedJson()
    }
  },
  watch: {
    async file (val) {
      try {
        if (val) {
          const text = await val.text()
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            this.jsonData = null
            this.jsons = [...parsed]
          } else {
            this.jsonData = { ...parsed }
            this.jsons = []
          }
        } else {
          this.clear()
        }
      } catch (e) {
        this.alert(e.message)
        this.$utils.error(e)
      }
    },
    jsonData (val) {
      console.warn(val)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    show () {},
    clear () {
      this.file = null
      this.jsonData = null
      this.jsons = []
    },
    clearCache () {
      this.removeCache(this.cacheKey)
    },
    loaded () {
      this.isBusy = false
    },
    prepareFormattedJson () {
      return []
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  max-width: 25vw;
}
</style>
