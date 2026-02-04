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
          //- SVG Banner: 測量外業主題
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 500 160"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 30vh; width: 100%; max-width: 600px;"
          )
            defs
              //- 儀器漸層
              linearGradient#device-grad(x1="0%" y1="0%" x2="100%" y2="0%")
                stop(offset="0%" stop-color="#f57f17")
                stop(offset="100%" stop-color="#ffb74d")
              //- 地圖漸層
              linearGradient#map-grad(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#e1f5fe")
                stop(offset="100%" stop-color="#b3e5fc")
              //- 陰影濾鏡
              filter#shadow(x="-20%" y="-20%" width="140%" height="140%")
                feGaussianBlur(in="SourceAlpha" stdDeviation="2")
                feOffset(dx="1" dy="2" result="offsetblur")
                feComponentTransfer
                  feFuncA(type="linear" slope="0.3")
                feMerge
                  feMergeNode(in="offsetblur")
                  feMergeNode(in="SourceGraphic")

            //- 背景裝飾：等高線/地形
            g(opacity="0.3")
              path(d="M0,140 Q100,100 200,130 T400,120 T500,140 V160 H0 Z" fill="#c8e6c9")
              path(d="M0,160 Q150,130 300,150 T500,150 V160 H0 Z" fill="#81c784")

            //- 左側：地籍圖紙
            g(transform="translate(60, 30) rotate(-5)")
              rect(x="0" y="0" width="80" height="100" rx="2" fill="url(#map-grad)" stroke="#0277bd" stroke-width="2" filter="url(#shadow)")
              //- 圖紙內容：地塊線條
              path(d="M10,10 H70 M10,10 V90 M10,90 H70 M70,10 V90" fill="none" stroke="#0277bd" stroke-width="1" stroke-dasharray="2,2")
              path(d="M20,30 L60,30 L60,70 L40,70 L40,50 L20,50 Z" fill="#fff9c4" stroke="#fbc02d" stroke-width="2")
              //- 紅色界址點
              circle(cx="20" cy="30" r="2" fill="red")
              circle(cx="60" cy="30" r="2" fill="red")
              circle(cx="60" cy="70" r="2" fill="red")
              circle(cx="40" cy="70" r="2" fill="red")
              circle(cx="40" cy="50" r="2" fill="red")
              circle(cx="20" cy="50" r="2" fill="red")

            //- 右側：測量標桿 (稜鏡)
            g(transform="translate(380, 20)")
              //- 桿身
              rect(x="0" y="20" width="6" height="120" fill="#e0e0e0" stroke="#9e9e9e" stroke-width="1")
              //- 紅白相間
              rect(x="0" y="20" width="6" height="20" fill="#d32f2f")
              rect(x="0" y="60" width="6" height="20" fill="#d32f2f")
              rect(x="0" y="100" width="6" height="20" fill="#d32f2f")
              //- 頂部稜鏡圓頭
              circle(cx="3" cy="20" r="12" fill="#29b6f6" stroke="#01579b" stroke-width="2")
              circle(cx="3" cy="20" r="5" fill="#fff")
              //- 標桿跳動動畫
              animateTransform(attributeName="transform" type="translate" values="380,20; 380,15; 380,20" dur="2s" repeatCount="indefinite")

            //- 中央：全站儀 (Total Station)
            g(transform="translate(200, 40)")
              //- 腳架 (Tripod)
              line(x1="50" y1="60" x2="10" y2="120" stroke="#455a64" stroke-width="4" stroke-linecap="round")
              line(x1="50" y1="60" x2="90" y2="120" stroke="#455a64" stroke-width="4" stroke-linecap="round")
              line(x1="50" y1="60" x2="50" y2="115" stroke="#455a64" stroke-width="4" stroke-linecap="round")

              //- 儀器底座
              path(d="M35,60 L65,60 L60,50 L40,50 Z" fill="#37474f")

              //- 儀器主體
              g
                rect(x="30" y="20" width="40" height="30" rx="5" fill="url(#device-grad)" filter="url(#shadow)")
                //- 鏡頭與鏡筒
                circle(cx="30" cy="35" r="12" fill="#263238")
                circle(cx="30" cy="35" r="8" fill="#4fc3f7")
                //- 望遠鏡筒部分
                rect(x="10" y="30" width="20" height="10" fill="#37474f")

                //- 儀器旋轉/掃描動畫
                animateTransform(attributeName="transform" type="rotate" values="0 50 55; -5 50 55; 0 50 55" dur="4s" repeatCount="indefinite")

              //- 雷射測距線 (連接儀器與標桿)
              line(x1="30" y1="35" x2="180" y2="0" stroke="#f44336" stroke-width="2" stroke-dasharray="5,5" opacity="0.6")
                 animate(attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite")

            //- 數據顯示框 (浮動)
            g(transform="translate(280, 40)")
              rect(x="0" y="0" width="60" height="30" rx="4" fill="white" stroke="#90a4ae" stroke-width="1" opacity="0.9")
              text(x="10" y="20" font-family="monospace" font-size="12" fill="#2e7d32" font-weight="bold") 125.4m

          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 地政測量小幫手
          p.text-muted.h4.mt-1 測量案件管理與統計分析系統

        //- 下方連結區域
        b-row.justify-content-center.px-3
          //- 1. 測量逾期案件
          b-col(cols="auto").mb-3
            nuxt-link(to="/sur/expire").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-danger-light.mb-3
                    //- 使用 regular icon (原 far fa-calendar-alt)
                    lah-fa-icon(icon="calendar-alt", regular, variant="danger", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 測量逾期案件
                  .text-muted.small 監控案件辦理期限

          //- 2. 逕辦建物滅失控管
          b-col(cols="auto").mb-3
            nuxt-link(to="/sur/destruction").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-warning-light.mb-3
                    lah-fa-icon(icon="house-chimney-crack", variant="dark", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 建物滅失控管
                  .text-muted.small 逕辦建物滅失案件管理

          //- 3. 分時案件統計
          b-col(cols="auto").mb-3
            nuxt-link(to="/sur/stats").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="chart-line", variant="primary", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 分時案件統計
                  .text-muted.small 各時段案件量統計分析

</template>

<script>
export default {
  head: {
    title: '桃園市地政測量小幫手'
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
// 當視窗高度小於 800px 或寬度小於 992px (因有3個卡片，992px以下可能會擠壓) 時隱藏圖片
@media (max-width: 991.98px), (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
