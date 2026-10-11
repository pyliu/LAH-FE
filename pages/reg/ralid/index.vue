<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center
        .d-flex.align-items-center
          div 地政系統土地標示部綜合查詢
          lah-button(icon="question" variant="outline-success" size="lg" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        .d-flex.align-items-center.header-right-group
          .mr-3.small.d-none.d-md-flex.align-items-center
            a.mr-2(
              :href="`${legacyUrl}/assets/files/桃園市土地基本資料庫電子資料收費標準.pdf`",
              target="_blank",
              rel="noreferrer noopener",
              title="下載收費標準 PDF"
            )
              lah-fa-icon(icon="file-pdf", regular) 收費標準
            a(
              :href="`${legacyUrl}/assets/files/%E5%9C%9F%E5%9C%B0%E5%9F%BA%E6%9C%AC%E8%B3%87%E6%96%99%E5%BA%AB%E9%9B%BB%E5%AD%90%E8%B3%87%E6%96%99%E6%B5%81%E9%80%9A%E7%94%B3%E8%AB%8B%E8%A1%A8.doc`",
              target="_blank",
              rel="noreferrer noopener",
              title="下載申請書表 DOC"
            )
              lah-fa-icon(icon="file-word", regular) 申請書
          b-input-group(size="lg", style="width: 18rem")
            b-form-input(
              v-model="keyword",
              placeholder="搜尋段代碼、段名稱或行政區...",
              trim
            )
            template(#append, v-if="keyword")
              lah-button(
                icon="xmark",
                size="lg",
                variant="outline-secondary",
                title="清除關鍵字",
                @click="keyword = ''"
              )
    lah-help-modal(:modal-id="'help-modal'", size="lg")
      h5 土地標示部（RALID）各段小段筆數與面積綜合查詢
      ul
        li 即時統整地政系統土地標示部（#[code MOICAD.RALID]）與段小段代碼檔（#[code MOIADM.RKEYN]）之土地筆數、總面積與所屬行政區。
        li 資料預設於瀏覽器快取 24 小時以加速載入；若地政系統剛完成分割、合併或重測異動，可點擊工具列「#[strong 重新讀取]」強制向資料庫撈取最新統計。
      h6.mt-3 搜尋、篩選與排序
      ol
        li #[strong 關鍵字搜尋]：於右上角輸入段代碼（如 #[code 0001]）、段名稱（如 #[code 龍安]）、區代碼或區名稱，表格會即時過濾並以黃底高亮標示符合文字。
        li #[strong 行政區篩選]：可由左上方下拉選單快速切換特定行政區。
        li #[strong 欄位排序]：點擊表頭「段代碼」、「面積」或「土地標示部筆數」可切換由大到小或由小到大排序。
        li #[strong 占全轄區比例]：顯示該段小段之面積與筆數占全所轄區總面積、總筆數之百分比，快速辨識大段別。
      h6.mt-3 多段別勾選試算（電子資料流通計費輔助）
      ol
        li #[strong 點擊列或勾選框]：點擊任一資料列或左側勾選框即可將該段小段加入「已選取試算」，表頭勾選框可全選目前篩選結果。
        li #[strong 跨關鍵字保留選取]：支援先搜尋 A 段勾選後，再改搜 B 段繼續勾選，已選取的段別不會因更換關鍵字而遺失。
        li #[strong 即時合計與移除]：摘要列會即時計算「目前篩選」與「已選取段別」的段數、總筆數與總面積（平方公尺、坪、公頃）；點擊綠色段別標籤或「清空已選」可移除選取，亦可開啟「僅看已選」單獨檢視。
        li #[strong 匯出 CSV]：若有勾選段別，點擊「匯出已選 CSV」會僅匯出所選段別；若未勾選則匯出目前篩選結果（UTF-8 BOM 格式，可直接以 Excel 開啟）。
      h6.mt-3 面積單位換算與相關表單
      ul
        li #[code 1 平方公尺 (㎡) = 0.3025 坪]
        li #[code 1 公頃 (ha) = 10,000 平方公尺 (㎡) = 3,025 坪]
        li 相關表單下載：
          a.mx-1(
            :href="`${legacyUrl}/assets/files/桃園市土地基本資料庫電子資料收費標準.pdf`",
            target="_blank",
            rel="noreferrer noopener"
          ) 桃園市土地基本資料庫電子資料收費標準 (PDF)
          | 、
          a.ml-1(
            :href="`${legacyUrl}/assets/files/%E5%9C%9F%E5%9C%B0%E5%9F%BA%E6%9C%AC%E8%B3%87%E6%96%99%E5%BA%AB%E9%9B%BB%E5%AD%90%E8%B3%87%E6%96%99%E6%B5%81%E9%80%9A%E7%94%B3%E8%AB%8B%E8%A1%A8.doc`",
            target="_blank",
            rel="noreferrer noopener"
          ) 土地基本資料庫電子資料流通申請表 (DOC)
  //- below is the customize area
  lah-reg-ralid-table(:keyword.sync="keyword")
</template>

<script>
export default {
  data: () => ({
    keyword: ''
  }),
  head: {
    title: '地政系統土地標示部綜合查詢-桃園市地政局'
  },
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.header-right-group {
  display: flex;
  align-items: center;

  ::v-deep .btn:not(.dropdown-item),
  ::v-deep .form-control {
    height: 48px;
    box-sizing: border-box;
  }

  ::v-deep .btn:not(.dropdown-item) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.5;
  }
}
</style>
