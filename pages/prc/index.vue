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
          //- SVG Banner: 地價與實價登錄主題
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 450 160"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 30vh; width: 100%; max-width: 600px;"
          )
            defs
              //- 金幣漸層
              linearGradient#coin-grad(x1="0%" y1="0%" x2="100%" y2="100%")
                stop(offset="0%" stop-color="#ffecb3")
                stop(offset="50%" stop-color="#ffca28")
                stop(offset="100%" stop-color="#ffa000")
              //- 房屋漸層
              linearGradient#house-grad(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#42a5f5")
                stop(offset="100%" stop-color="#1976d2")
              //- 濾鏡效果
              filter#shadow(x="-20%" y="-20%" width="140%" height="140%")
                feGaussianBlur(in="SourceAlpha" stdDeviation="2")
                feOffset(dx="1" dy="2" result="offsetblur")
                feComponentTransfer
                  feFuncA(type="linear" slope="0.3")
                feMerge
                  feMergeNode(in="offsetblur")
                  feMergeNode(in="SourceGraphic")

            //- 背景裝飾：趨勢線圖
            g(opacity="0.2")
              path(
                d="M20,130 L80,110 L140,125 L200,90 L260,100 L320,60 L380,70 L430,40"
                fill="none" stroke="#2196f3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
              )
                //- 畫線動畫
                animate(attributeName="stroke-dasharray" from="0,1000" to="1000,0" dur="2s" fill="freeze")
              //- 節點圓圈
              circle(cx="80" cy="110" r="3" fill="#1976d2")
              circle(cx="200" cy="90" r="3" fill="#1976d2")
              circle(cx="320" cy="60" r="3" fill="#1976d2")
              circle(cx="430" cy="40" r="3" fill="#1976d2")

            //- 左側：房屋與價格標籤
            g(transform="translate(80, 40)")
              //- 房屋主體
              path(d="M40,0 L0,35 L10,35 L10,70 L70,70 L70,35 L80,35 Z" fill="url(#house-grad)" filter="url(#shadow)")
              //- 窗戶
              rect(x="25" y="45" width="10" height="10" fill="#bbdefb")
              rect(x="45" y="45" width="10" height="10" fill="#bbdefb")
              //- 價格標籤
              g(transform="translate(60, 10) rotate(15)")
                path(d="M0,0 L30,0 L40,15 L30,30 L0,30 Z" fill="#ff5722" filter="url(#shadow)")
                circle(cx="5" cy="15" r="2" fill="white")
                text(x="12" y="20" font-size="14" fill="white" font-weight="bold") $
                animateTransform(attributeName="transform" type="rotate" values="15 20 15; 5 20 15; 15 20 15" dur="3s" repeatCount="indefinite")

            //- 中央：文件與放大鏡 (審核意象)
            g(transform="translate(200, 30)")
              //- 文件
              rect(x="0" y="0" width="50" height="70" rx="3" fill="white" stroke="#cfd8dc" stroke-width="2" filter="url(#shadow)")
              line(x1="10" y1="15" x2="40" y2="15" stroke="#b0bec5" stroke-width="2")
              line(x1="10" y1="25" x2="40" y2="25" stroke="#b0bec5" stroke-width="2")
              line(x1="10" y1="35" x2="30" y2="35" stroke="#b0bec5" stroke-width="2")
              //- 放大鏡
              g
                circle(cx="35" cy="45" r="18" fill="none" stroke="#607d8b" stroke-width="4")
                line(x1="48" y1="58" x2="60" y2="70" stroke="#607d8b" stroke-width="4" stroke-linecap="round")
                circle(cx="35" cy="45" r="14" fill="rgba(225,245,254,0.5)")
                //- 放大鏡移動動畫
                animateTransform(attributeName="transform" type="translate" values="0,0; 5,5; 0,0" dur="4s" repeatCount="indefinite")

            //- 右側：堆疊的金幣
            g(transform="translate(320, 60)")
              //- 下層金幣
              g
                ellipse(cx="0" cy="0" rx="20" ry="8" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
                path(d="M-20,0 v10 a20,8 0 0,0 40,0 v-10" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
              //- 中層金幣
              g(transform="translate(0, -12)")
                ellipse(cx="0" cy="0" rx="20" ry="8" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
                path(d="M-20,0 v10 a20,8 0 0,0 40,0 v-10" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
              //- 上層金幣 (浮動動畫)
              g(transform="translate(0, -24)")
                ellipse(cx="0" cy="0" rx="20" ry="8" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
                path(d="M-20,0 v10 a20,8 0 0,0 40,0 v-10" fill="url(#coin-grad)" stroke="#ef6c00" stroke-width="1")
                text(x="-5" y="4" font-size="12" fill="#d84315" font-weight="bold") $
                animateTransform(attributeName="transform" type="translate" values="0,-24; 0,-28; 0,-24" dur="2s" repeatCount="indefinite")

            //- 裝飾性星星
            g(fill="#ffeb3b")
              polygon(points="360,20 363,28 370,28 365,34 367,42 360,36 353,42 355,34 350,28 357,28")
                animate(attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite")
              polygon(points="150,10 152,15 157,15 153,19 154,24 150,20 146,24 147,19 143,15 148,15" transform="scale(0.8)")
                animate(attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite")

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
