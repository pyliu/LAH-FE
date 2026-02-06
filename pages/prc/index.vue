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
          //- SVG Banner: 地價與實價登錄主題 (放大版)
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 40vh; width: 33vw; max-width: 1000px;"
          )
            defs
              //- 濾鏡
              filter#val-glow
                feGaussianBlur(stdDeviation="2" result="coloredBlur")
                feMerge
                  feMergeNode(in="coloredBlur")
                  feMergeNode(in="SourceGraphic")

              //- 漸層：天空
              linearGradient#sky-grad(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#fff3e0")
                stop(offset="100%" stop-color="#ffe0b2")

              //- 漸層：金幣
              linearGradient#coin-grad(x1="0%" y1="0%" x2="100%" y2="100%")
                stop(offset="0%" stop-color="#ffd54f")
                stop(offset="100%" stop-color="#ff6f00")

              //- 漸層：建築物
              linearGradient#building-grad(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#90caf9")
                stop(offset="100%" stop-color="#1565c0")

            //- 1. 背景環境
            //- 天空
            rect(x="0" y="0" width="1000" height="320" fill="url(#sky-grad)" opacity="0.5")
            //- 地面
            rect(x="0" y="320" width="1000" height="80" fill="#cfd8dc")

            //- 城市剪影 (背景)
            g(opacity="0.3" transform="translate(0, 50)")
              path(d="M100,270 L100,150 L180,150 L180,270 M250,270 L250,100 L350,100 L350,270 M500,270 L500,180 L600,180 L600,270" fill="#b0bec5")
              rect(x="650" y="200" width="80" height="70" fill="#b0bec5")

            //- 裝飾性雲朵
            g(opacity="0.6")
              path(d="M150,80 Q180,50 210,80 T270,80 T300,100 H150 Z" fill="white")
                animateTransform(attributeName="transform" type="translate" from="-100,0" to="1100,0" dur="45s" repeatCount="indefinite")
              path(d="M750,50 Q780,20 810,50 T870,50 T900,70 H750 Z" fill="white")
                animateTransform(attributeName="transform" type="translate" from="-200,0" to="800,0" dur="60s" repeatCount="indefinite")

            //- 2. 左側：房屋與價值 (House & Value)
            g(transform="translate(150, 180)")
              //- 房屋
              path(d="M0,0 L60,-60 L120,0 V100 H0 Z" fill="url(#building-grad)" stroke="#0d47a1" stroke-width="2" filter="url(#val-glow)")
              //- 窗戶
              rect(x="20" y="20" width="30" height="30" fill="#e3f2fd")
              rect(x="70" y="20" width="30" height="30" fill="#e3f2fd")
              //- 門
              rect(x="45" y="60" width="30" height="40" fill="#1565c0")

              //- 價格標籤 (浮動)
              g(transform="translate(100, -80)")
                path(d="M0,0 L60,0 L80,30 L60,60 H0 Z" fill="#ff6f00" filter="url(#val-glow)")
                circle(cx="10" cy="30" r="5" fill="white")
                text(x="25" y="42" font-size="28" fill="white" font-weight="bold") $ Price
                animateTransform(attributeName="transform" type="translate" values="100,-80; 100,-90; 100,-80" dur="3s" repeatCount="indefinite")

            //- 3. 中央：數據分析與金幣 (Data & Coin)
            g(transform="translate(450, 250)")
              //- 堆疊金幣
              g
                ellipse(cx="0" cy="0" rx="30" ry="12" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
                path(d="M-30,0 v15 a30,12 0 0,0 60,0 v-15" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
              g(transform="translate(0, -15)")
                ellipse(cx="0" cy="0" rx="30" ry="12" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
                path(d="M-30,0 v15 a30,12 0 0,0 60,0 v-15" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
              g(transform="translate(0, -30)")
                ellipse(cx="0" cy="0" rx="30" ry="12" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
                path(d="M-30,0 v15 a30,12 0 0,0 60,0 v-15" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
                //- 頂層金幣跳動
                g
                  ellipse(cx="0" cy="-15" rx="30" ry="12" fill="url(#coin-grad)" stroke="#e65100" stroke-width="1")
                  text(x="-8" y="-8" font-size="20" fill="#bf360c" font-weight="bold") $
                  animateTransform(attributeName="transform" type="translate" values="0,0; 0,-10; 0,0" dur="1.5s" repeatCount="indefinite")

              //- 上升趨勢線
              g(transform="translate(60, -80)")
                polyline(points="0,80 30,60 60,70 90,20 120,40 150,0" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round")
                circle(cx="150" cy="0" r="5" fill="#2e7d32")

            //- 4. 右側：地價人員 (Appraiser)
            g(transform="translate(800, 320)")
              //- 下半身
              path(d="M-30,0 L-25,-80 L25,-80 L30,0 Z" fill="#37474f")

              //- 上半身 (襯衫)
              path(d="M-35,-80 L-30,-170 Q0,-180 30,-170 L35,-80 Z" fill="#fff")
              path(d="M-30,-170 L0,-140 L30,-170" fill="none" stroke="#cfd8dc" stroke-width="2") //- 領口

              //- 領帶
              path(d="M0,-165 L5,-140 L0,-110 L-5,-140 Z" fill="#d32f2f")

              //- 頭部
              circle(cx="0" cy="-190" r="28" fill="#ffccbc")
              //- 眼鏡
              g(transform="translate(0, -190)")
                line(x1="-25" y1="-5" x2="25" y2="-5" stroke="#333" stroke-width="2")
                circle(cx="-10" cy="-5" r="8" fill="none" stroke="#333" stroke-width="2")
                circle(cx="10" cy="-5" r="8" fill="none" stroke="#333" stroke-width="2")
              //- 頭髮
              path(d="M-28,-190 Q-30,-225 0,-225 Q30,-225 28,-190 V-185 H-28 Z" fill="#3e2723")

              //- 手持平板
              g(transform="translate(-60, -130) rotate(-15)")
                rect(x="0" y="0" width="80" height="60" rx="4" fill="#212121")
                rect(x="5" y="5" width="70" height="50" fill="#e3f2fd")
                //- 平板內容：勾選符號
                path(d="M20,25 L35,40 L60,15" fill="none" stroke="#4caf50" stroke-width="4" stroke-linecap="round")

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
