<template lang="pug">
//- 外層維持 overflow-hidden
div.h-100.d-flex.flex-column.overflow-hidden
  //- 移除標題文字，保留 Header 元件
  lah-header

  //- 內容區域佔滿剩餘空間
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      //- 維持 main-container 限制高度與置中
      b-container.main-container.h-100.d-flex.flex-column.justify-content-center(fluid)

        //- 上方 Slogan 區域
        .text-center.mb-3.anim-appear-1s
          //- 重繪版 SVG
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 400"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 40vh; width: 33vw; max-width: 900px;"
          )
            //- 1. 背景：地籍格網與趨勢線
            g.background-layer
              //- 淺色格網 (模擬地籍圖)
              g(stroke="#e0e0e0" stroke-width="1")
                //- 橫線
                line(x1="50" y1="100" x2="750" y2="100")
                line(x1="50" y1="200" x2="750" y2="200")
                line(x1="50" y1="300" x2="750" y2="300")
                //- 直線
                line(x1="200" y1="50" x2="200" y2="350")
                line(x1="400" y1="50" x2="400" y2="350")
                line(x1="600" y1="50" x2="600" y2="350")

              //- 地標定位點 (Land Markers)
              g(fill="#b0bec5")
                circle(cx="200" cy="200" r="4")
                circle(cx="400" cy="300" r="4")
                circle(cx="600" cy="100" r="4")
                circle(cx="600" cy="200" r="4")

              //- 藍色折線 (趨勢)
              polyline(
                points="100,280 200,250 400,260 600,150 700,120"
                fill="none"
                stroke="#bbdefb"
                stroke-width="6"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.6"
              )

            //- 2. 主體：房屋 (左) - 外層定位，內層動畫
            g(transform="translate(150, 130)")
              g.float-item-1
                //- 陰影
                ellipse(cx="60" cy="110" rx="50" ry="10" fill="#000" opacity="0.1")
                //- 房子主體
                path(d="M10,40 L60,-10 L110,40 V100 H10 Z" fill="#4285f4")
                //- 窗戶
                rect(x="35" y="55" width="20" height="20" fill="#90caf9")
                rect(x="65" y="55" width="20" height="20" fill="#90caf9")
                //- 價格標籤
                g(transform="translate(80, 0) rotate(15)")
                  rect(x="0" y="0" width="50" height="30" rx="4" fill="#ff5722")
                  circle(cx="8" cy="15" r="3" fill="white")
                  text(x="18" y="22" font-family="Arial" font-weight="bold" font-size="20" fill="white") $

            //- 3. 主體：文件與審查 (中) - 外層定位，內層動畫
            g(transform="translate(350, 120)")
              g.float-item-2
                //- 陰影
                ellipse(cx="50" cy="120" rx="40" ry="8" fill="#000" opacity="0.1")
                //- 文件紙張
                rect(x="10" y="0" width="80" height="110" rx="5" fill="#fff" stroke="#cfd8dc" stroke-width="2")
                //- 文件內容線條
                g(fill="#cfd8dc")
                  rect(x="25" y="20" width="50" height="6")
                  rect(x="25" y="40" width="50" height="6")
                  rect(x="25" y="60" width="30" height="6")
                //- 放大鏡
                g(transform="translate(50, 60)")
                  circle(cx="0" cy="0" r="25" fill="rgba(255,255,255,0.8)" stroke="#546e7a" stroke-width="4")
                  line(x1="18" y1="18" x2="40" y2="40" stroke="#546e7a" stroke-width="8" stroke-linecap="round")

            //- 4. 主體：地價與數據 (右) - 外層定位，內層動畫
            g(transform="translate(550, 140)")
              g.float-item-3
                //- 陰影
                ellipse(cx="60" cy="100" rx="50" ry="10" fill="#000" opacity="0.1")
                //- 金幣堆疊
                g
                  //- 底層
                  path(d="M30,50 L30,70 A30,10 0 0,0 90,70 L90,50 A30,10 0 0,1 30,50" fill="#ffb300")
                  ellipse(cx="60" cy="50" rx="30" ry="10" fill="#ffca28")
                  //- 中層
                  path(d="M30,25 L30,45 A30,10 0 0,0 90,45 L90,25 A30,10 0 0,1 30,25" fill="#ffb300")
                  ellipse(cx="60" cy="25" rx="30" ry="10" fill="#ffca28")
                  //- 頂層
                  path(d="M30,0 L30,20 A30,10 0 0,0 90,20 L90,0 A30,10 0 0,1 30,0" fill="#ffb300")
                  ellipse(cx="60" cy="0" rx="30" ry="10" fill="#ffe082" stroke="#ffb300" stroke-width="1")
                  text(x="52" y="8" font-family="Arial" font-weight="bold" font-size="24" fill="#bf360c") $

                //- 綠色上升箭頭
                path(d="M100,-20 L120,-40 L140,-20 M120,-40 L120,10" stroke="#4caf50" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none")

          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 地政地價小幫手
          p.text-muted.h4.mt-1 實價登錄與地價作業輔助系統

        //- 下方連結區域 (卡片)
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

/* 動畫定義 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 應用動畫到 SVG 群組，分別設置不同的延遲以製造層次感 */
.float-item-1 {
  animation: float 4s ease-in-out infinite;
}
.float-item-2 {
  animation: float 4.5s ease-in-out infinite;
  animation-delay: 1s;
}
.float-item-3 {
  animation: float 5s ease-in-out infinite;
  animation-delay: 2s;
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

a:hover {
  text-decoration: none;
}

@media (max-width: 768px), (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
