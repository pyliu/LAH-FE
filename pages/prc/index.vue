<template lang="pug">
//- 外層維持 overflow-hidden
div.h-100.d-flex.flex-column.bg-light.overflow-hidden
  //- 移除標題文字，保留 Header 元件
  lah-header

  //- 內容區域佔滿剩餘空間
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      //- 維持 main-container 限制高度與置中
      b-container.main-container.h-100.d-flex.flex-column.justify-content-center(fluid)

        //- 上方 Slogan 區域
        .text-center.mb-3.anim-appear-1s
          //- 修改: 使用地價專用 Logo，設定 vh 高度與隱藏類別
          lah-logo-val.mb-2.slogan-img(style="max-height: 30vh;")
          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 地政地價小幫手
          p.text-muted.h4.mt-1 實價登錄與地價作業輔助系統

        //- 下方連結區域
        b-row.justify-content-center.px-3
          //- 1. 實價登錄案件控管
          b-col(cols="auto").mb-3
            nuxt-link(to="/prc/realprice").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-success-light.mb-3
                    lah-fa-icon(icon="receipt", variant="success", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 實價登錄案件控管
                  .text-muted.small 案件登錄、審查與進度追蹤

          //- 2. 實價登錄 JSON 解析
          b-col(cols="auto").mb-3
            nuxt-link(to="/prc/json-converter").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="file-import", variant="primary", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 實價登錄 JSON 解析
                  .text-muted.small 申報檔 JSON 格式轉換與檢核

</template>

<script>
export default {
  head: {
    title: '桃園市地政地價小幫手'
  }
}
</script>

<style lang="scss" scoped>
.main-container {
  max-height: 85vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f1f1f1;
  }
}

.modern-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 20px !important;
  background-color: #fff;

  width: 19rem;
  max-width: 90vw;

  height: auto;
  min-height: 320px;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;

    .icon-box {
      transform: scale(1.1) rotate(3deg);
    }
  }
}

.icon-box {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease;
  margin-bottom: 1rem;
}

/* 淺色背景色系 */
.bg-primary-light { background-color: rgba(0, 123, 255, 0.1); }
.bg-success-light { background-color: rgba(40, 167, 69, 0.1); }
.bg-info-light    { background-color: rgba(23, 162, 184, 0.1); }
.bg-warning-light { background-color: rgba(255, 193, 7, 0.15); }
.bg-danger-light  { background-color: rgba(220, 53, 69, 0.1); }

a:hover {
  text-decoration: none;
}

// 響應式隱藏 Slogan 圖片
// 當視窗高度小於 800px 或寬度小於 768px (手機版換行時) 隱藏圖片
@media (max-width: 768px), (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
