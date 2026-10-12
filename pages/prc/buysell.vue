<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex.align-items-center
        .my-auto.font-weight-bold.h3.mb-0 地價買賣實例作業工具
        lah-button(
          icon="info",
          action="bounce",
          variant="outline-success",
          size="lg",
          no-border,
          no-icon-gutter,
          @click="showModalById('buysell-help-modal')",
          title="操作說明"
        )
        lah-button.ml-2(
          icon="sync-alt",
          variant="outline-primary",
          size="sm",
          @click="reloadIframe",
          title="重新載入小工具"
        ) 重新整理
        lah-button.ml-2(
          icon="external-link-alt",
          variant="outline-secondary",
          size="sm",
          @click="openFullscreen",
          title="在新分頁開啟全螢幕視窗"
        ) 全螢幕開啟
        lah-help-modal(:modal-id="'buysell-help-modal'", size="lg")
          h5.font-weight-bold.text-primary.mb-3 地價買賣實例作業工具操作指引
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 1. 買賣實例對應區段表
            b-card-body.s-90
              ol.mb-0
                li #[strong 買賣實例清冊（必填）]：需包含 A 欄（實例號/序號）、E 欄（區段號，可多個以逗號或分號分隔）、G 欄（年月/日期）、K 欄（單價）。
                li #[strong 評議總表（必填）]：需包含 A 欄（區段號）、L 欄（擬評/現值）。
                li #[strong 物價指數（選填）]：需包含 A 欄（年月/日期）、B 欄（指數）。若未上傳，指數預設為 1。
                li 點擊「開始處理並下載」，系統將自動產生並下載排版完成的 #[code 買例整理結果.xlsx]。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 2. 買賣實例檢核（v2.5）
            b-card-body.s-90
              ol.mb-0
                li 支援 30 條結構化檢核規則（含全新 Z01 區段號對應轄區、基礎欄位、樓層用途、門牌臨街、建物單價、耐用折舊、工期利潤、勘查日期、裝潢現值、漏號/重號等）。
                li 三頁籤架構：提供「檢核作業」、「檢核項目與參數」與全新「區段號對照表」。
                li 內建 1,065 筆區段號對照表（115.10.12 彙總版），支援下載範例檔、自訂對照表 Excel 匯入與還原預設。
                li 全面改依「所屬轄區」與「轄管人員」分類統計與快速篩選，支援跨轄區案件自動比對。
                li 支援人工判定（待確認、有問題、無問題）與人工備註，狀態自動保存於本機，並提供註記備份與還原。
                li 匯出保留原始 Excel 格式及異常明細、轄區統計、編號檢核之多工作表檢核清冊。
          b-card.mb-3(no-body)
            b-card-header.bg-light.font-weight-bold 3. 查核案件挑檔
            b-card-body.s-90
              ol.mb-0
                li #[strong 步驟 1 本月買賣案件清冊（必填）]：可切換選擇「WEB 版」或「區估系統版」。
                li #[strong 步驟 2～4（選填）]：房地合一稅異常清冊（C 欄序號）、大量估價異常-房地與土地（可微調差異 % 門檻）。
                li 比對後在畫面呈現異常摘要與申報代理人案件統計，並自動下載標註紅底之 #[code 實價登錄查核案件比對完成.xlsx]。
          b-card(no-body)
            b-card-header.bg-light.font-weight-bold 4. 實價登錄10日檢核
            b-card-body.s-90
              ol.mb-0
                li 專為每十日一期的買賣、預售、租賃申報明細提供全面智慧檢核（內建 42 條專業防呆規則）。
                li 支援拖曳多個檔案或多工作表自動辨識（買賣、預售、租賃、略過）。
                li 支援人工審查判定（ok/warn/bad）與備註記錄、本機暫存與備份匯入。
                li 支援基準日、面積容許誤差、公設比上下限、格局上限、人名模糊比對等參數微調，並可一鍵匯出全案件檢核清冊 Excel。

  lah-transition(appear)
    .buysell-container
      iframe.buysell-iframe(
        ref="iframe",
        :src="iframeSrc",
        frameborder="0",
        allow="clipboard-read; clipboard-write"
      )
</template>

<script>
export default {
  name: 'PrcBuySell',
  data: () => ({
    iframeSrc: '/prc/buysell.html'
  }),
  head () {
    return {
      title: '買賣實例作業工具 - 桃園市地政地價小幫手'
    }
  },
  methods: {
    reloadIframe () {
      if (this.$refs.iframe) {
        this.$refs.iframe.src = '/prc/buysell.html?t=' + Date.now()
        this.timeout(() => {
          this.notify({
            title: '地價作業小工具',
            message: '已重新載入小工具畫面',
            type: 'info'
          })
        }, 300)
      }
    },
    openFullscreen () {
      if (typeof window !== 'undefined') {
        window.open('/prc/buysell.html', '_blank')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.buysell-container {
  width: 100%;
  height: calc(100vh - 120px);
  min-height: 600px;
  background-color: #EEF2F1;
  position: relative;
  overflow: hidden;

  .buysell-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    background-color: #ffffff;
  }
}
</style>
