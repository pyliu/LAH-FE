<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 實價登錄案件資料轉換
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
  .d-flex.mb-1
    .d-flex.flex-nowrap.mr-auto
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
      //- lah-button.mx-1(
      //-   icon="upload",
      //-   title="上傳",
      //-   :disabled="file === null",
      //-   no-icon-gutter
      //- )
      lah-button(
        v-if="file !== null"
        icon="trash",
        title="清除選擇",
        variant="outline-success",
        @click="file = null",
        no-icon-gutter
      )
    b-pagination.my-auto(
      v-if="showPagination"
      v-model="currentPage"
      class="my-auto mr-2"
      size="sm"
      :total-rows="paginationCount"
      :per-page="perPage"
      :title="`共 ${dataCount} 筆`"
      last-number
      first-number
    )
  lah-transition
    b-table.text-center.fixed-height-table(
      ref="jsonTable"
      caption-top
      selectable
      striped
      hover
      bordered
      small
      no-border-collapse
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :responsive="'lg'"
      :borderless="false"
      :outlined="false"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      :head-variant="'dark'"
      :busy="isBusy"
      :items="jsonData"
      :per-page="perPage"
      :current-page="currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...
      //- template(#cell(收件字號)="{ item }"): div: b-link(@click="popup(item)").
      //-   {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      //- template(#cell(memo)="{ item }"): lah-val-realprice-memo(:parent-data="item", @update="clearCache")
    //- h3(class="text-center"): lah-fa-icon(
    //-   icon="upload",
    //-   action="breath",
    //-   variant="primary"
    //- ) 請選擇JSON檔案並上傳

</template>

<script>
export default {
  fetchOnServer: false,
  asyncData (nuxt) {
    const today = new Date()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      startDateObj: firstDayofMonth,
      endDateObj: lastDayofMonth,
      startDate: `${firstDayofMonth.getFullYear() - 1911}${('0' + (firstDayofMonth.getMonth() + 1)).slice(-2)}${('0' + firstDayofMonth.getDate()).slice(-2)}`,
      endDate: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday
    }
  },
  data: () => ({
    committed: false,
    file: null,
    jsonData: [],
    jsonFields: [
      {
        key: '收件字號',
        sortable: true
      }
    ],
    currentPage: 1,
    perPage: 20,
    maxHeight: 600
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
    showPagination () {
      return !this.$utils.empty(this.jsonData) && this.jsonData?.length > this.perPage
    },
    paginationCount () {
      return this.jsonData?.length || 0
    },
    dataCount () {
      return this.jsonData?.length || 0
    },
    xlsxData () {
      return this.prepareFormattedJson()
    }
  },
  watch: {
    async file (val) {
      try {
        if (val) {
          this.jsonData = [...JSON.parse(await val.text())]
        } else {
          this.clear()
        }
      } catch (e) {
        this.$utils.error(e)
      }
    },
    jsonData (dontcare) {
      this.currentPage = 1
      console.warn(dontcare)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    show () {},
    clear () {
      this.file = null
      this.jsonData = []
    },
    clearCache () {
      this.removeCache(this.cacheKey)
    },
    loaded () {
      this.isBusy = false
      this.committed = true
    },
    prepareFormattedJson () {
      return this.file ? this.jsonData : []
    }
  }
}
</script>

<style lang="scss" scoped>
.fixed-width {
  max-width: 250px;
}
.fixed-height-table {
  max-height: calc(100% - 135px);
}
</style>
