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
          //- SVG Banner: 專業監控中心 (更清晰人物版)
          //- 修改: max-height 40vh, max-width 1000px
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 40vh; width: 33vw;"
          )
            defs
              //- 濾鏡：螢幕光暈
              filter#screen-glow
                feGaussianBlur(stdDeviation="3" result="coloredBlur")
                feMerge
                  feMergeNode(in="coloredBlur")
                  feMergeNode(in="SourceGraphic")

              //- 漸層：螢幕背景
              linearGradient#monitor-bg(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#263238")
                stop(offset="100%" stop-color="#37474f")

              //- 漸層：地板反射
              linearGradient#floor-grad(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#cfd8dc")
                stop(offset="100%" stop-color="#eceff1")

            //- 1. 背景環境
            //- 地板
            rect(x="0" y="350" width="1000" height="50" fill="url(#floor-grad)")

            //- 背景牆伺服器 (左)
            g(transform="translate(100, 50)")
              rect(x="0" y="0" width="100" height="300" rx="4" fill="#455a64" stroke="#263238" stroke-width="2")
              //- 燈號矩陣
              pattern#rack-lights(x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse")
                rect(x="5" y="2" width="90" height="16" rx="2" fill="#37474f")
                circle(cx="20" cy="10" r="2" fill="#00e676")
                circle(cx="30" cy="10" r="2" fill="#2979ff")
              rect(x="0" y="0" width="100" height="300" fill="url(#rack-lights)" opacity="0.4")
              //- 動態閃爍點
              circle(cx="20" cy="40" r="3" fill="#00e676")
                animate(attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite")
              circle(cx="30" cy="120" r="3" fill="#ffeb3b")
                animate(attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite")

            //- 背景牆伺服器 (右)
            g(transform="translate(800, 50)")
              rect(x="0" y="0" width="100" height="300" rx="4" fill="#455a64" stroke="#263238" stroke-width="2")
              rect(x="0" y="0" width="100" height="300" fill="url(#rack-lights)" opacity="0.4")
              circle(cx="80" cy="80" r="3" fill="#ff1744")
                animate(attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite")

            //- 2. 監控工作站 (桌子)
            g(transform="translate(200, 280)")
              //- 桌面板
              path(d="M-50,0 L650,0 L620,20 L-20,20 Z" fill="#607d8b")
              rect(x="-20" y="20" width="640" height="10" fill="#455a64")
              //- 桌腳
              rect(x="50" y="30" width="20" height="70" fill="#37474f")
              rect(x="530" y="30" width="20" height="70" fill="#37474f")

            //- 3. 多螢幕系統
            g(transform="translate(500, 270)")
              //- 主螢幕 (Center)
              g(transform="translate(-150, -160)")
                //- 外框
                rect(x="0" y="0" width="300" height="170" rx="8" fill="#212121" stroke="#37474f" stroke-width="5")
                //- 螢幕內容
                rect(x="10" y="10" width="280" height="150" fill="url(#screen-grad)")
                //- 系統波形圖
                path(d="M20,120 L60,100 L100,130 L140,50 L180,70 L220,40 L260,80" fill="none" stroke="#29b6f6" stroke-width="3" filter="url(#screen-glow)")
                  animate(attributeName="d" values="M20,120 L60,100 L100,130 L140,50 L180,70 L220,40 L260,80; M20,115 L60,105 L100,125 L140,55 L180,75 L220,45 L260,85; M20,120 L60,100 L100,130 L140,50 L180,70 L220,40 L260,80" dur="3s" repeatCount="indefinite")
                //- 網格
                line(x1="20" y1="130" x2="260" y2="130" stroke="#546e7a" stroke-width="0.5")
                line(x1="20" y1="90" x2="260" y2="90" stroke="#546e7a" stroke-width="0.5")
                line(x1="20" y1="50" x2="260" y2="50" stroke="#546e7a" stroke-width="0.5")
                //- 支架
                path(d="M130,170 L170,170 L160,190 L140,190 Z" fill="#212121")
                rect(x="120" y="190" width="60" height="5" rx="2" fill="#212121")

              //- 側螢幕 (Left) - 顯示地圖節點
              g(transform="translate(-320, -140) rotate(10)")
                rect(x="0" y="0" width="160" height="140" rx="5" fill="#212121" stroke="#37474f" stroke-width="4")
                rect(x="8" y="8" width="144" height="124" fill="url(#screen-grad)")
                //- 節點連線
                circle(cx="40" cy="40" r="4" fill="#00e676")
                circle(cx="120" cy="60" r="4" fill="#00e676")
                circle(cx="70" cy="100" r="4" fill="#ffeb3b")
                line(x1="40" y1="40" x2="120" y2="60" stroke="#546e7a" stroke-width="1")
                line(x1="40" y1="40" x2="70" y2="100" stroke="#546e7a" stroke-width="1")
                line(x1="120" y1="60" x2="70" y2="100" stroke="#546e7a" stroke-width="1")
                //- 掃描線
                rect(x="8" y="8" width="144" height="2" fill="#00e676" opacity="0.3")
                  animate(attributeName="y" values="8;132;8" dur="4s" repeatCount="indefinite")

              //- 側螢幕 (Right) - 顯示長條圖
              g(transform="translate(160, -112) rotate(-10)")
                rect(x="0" y="0" width="160" height="140" rx="5" fill="#212121" stroke="#37474f" stroke-width="4")
                rect(x="8" y="8" width="144" height="124" fill="url(#screen-grad)")
                //- 長條圖
                rect(x="20" y="80" width="15" height="40" fill="#7e57c2")
                  animate(attributeName="height" values="40;60;40" dur="2.5s" repeatCount="indefinite")
                  animate(attributeName="y" values="80;60;80" dur="2.5s" repeatCount="indefinite")
                rect(x="50" y="50" width="15" height="70" fill="#26c6da")
                  animate(attributeName="height" values="70;40;70" dur="3s" repeatCount="indefinite")
                  animate(attributeName="y" values="50;80;50" dur="3s" repeatCount="indefinite")
                rect(x="80" y="70" width="15" height="50" fill="#ff7043")
                rect(x="110" y="40" width="15" height="80" fill="#66bb6a")

            //- 4. 紅綠燈狀態指示板 (懸掛於右側空中)
            g(transform="translate(730, 40)")
              //- 線
              line(x1="25" y1="-40" x2="25" y2="0" stroke="#455a64" stroke-width="2")
              //- 外殼
              rect(x="0" y="0" width="50" height="130" rx="10" fill="#263238" stroke="#455a64" stroke-width="3" filter="url(#glow)")
              //- 遮光罩
              path(d="M5,15 Q25,5 45,15" fill="none" stroke="#37474f" stroke-width="2")
              path(d="M5,55 Q25,45 45,55" fill="none" stroke="#37474f" stroke-width="2")
              path(d="M5,95 Q25,85 45,95" fill="none" stroke="#37474f" stroke-width="2")
              //- 紅燈
              circle(cx="25" cy="25" r="14" fill="#d32f2f" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0s" repeatCount="indefinite")
                animate(attributeName="fill" values="#d32f2f;#ff5252;#d32f2f" dur="2s" begin="0s" repeatCount="indefinite")
              //- 黃燈
              circle(cx="25" cy="65" r="14" fill="#fbc02d" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.66s" repeatCount="indefinite")
                animate(attributeName="fill" values="#fbc02d;#ffff00;#fbc02d" dur="2s" begin="0.66s" repeatCount="indefinite")
              //- 綠燈
              circle(cx="25" cy="105" r="14" fill="#388e3c" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="1.33s" repeatCount="indefinite")
                animate(attributeName="fill" values="#388e3c;#69f0ae;#388e3c" dur="2s" begin="1.33s" repeatCount="indefinite")

            //- 5. 專業人員 (坐姿背影 - 清晰版)
            g(transform="translate(500, 380)")
              //- 人體工學椅 (下半部)
              g
                //- 五爪腳架
                path(d="M0,0 L-40,20 M0,0 L40,20 M0,0 L0,20 M0,0 L-30,-10 M0,0 L30,-10" stroke="#37474f" stroke-width="6" stroke-linecap="round")
                //- 氣壓棒
                rect(x="-5" y="-40" width="10" height="40" fill="#546e7a")

              //- 椅子主體與人物 (上半部)
              g(transform="translate(0, -40)")
                //- 椅座
                path(d="M-45,0 Q0,10 45,0 L45,-10 L-45,-10 Z" fill="#263238")
                //- 椅背
                path(d="M-35,-10 L-40,-100 Q0,-110 40,-100 L35,-10 Z" fill="#37474f")
                //- 頭枕
                rect(x="-20" y="-125" width="40" height="20" rx="5" fill="#37474f")

                //- 人物身體 (穿著藍色襯衫)
                path(d="M-30,0 L-25,-90 Q0,-100 25,-90 L30,0 Z" fill="#1565c0")
                //- 領口細節
                path(d="M-25,-90 Q0,-80 25,-90 L25,-85 Q0,-75 -25,-85 Z" fill="#0d47a1")

                //- 脖子
                rect(x="-10" y="-105" width="20" height="15" fill="#ffccbc")

                //- 頭部
                circle(cx="0" cy="-125" r="28" fill="#ffccbc")
                //- 頭髮 (短髮俐落造型)
                path(d="M-28,-125 Q-30,-160 0,-160 Q30,-160 28,-125 V-120 H-28 Z" fill="#3e2723")
                //- 耳機 (Headset)
                path(d="M-30,-125 A30,30 0 0,1 30,-125" fill="none" stroke="#212121" stroke-width="6")
                rect(x="-32" y="-135" width="12" height="25" rx="3" fill="#212121")
                rect(x="20" y="-135" width="12" height="25" rx="3" fill="#212121")

                //- 右手 (操作滑鼠)
                path(d="M25,-60 Q50,-50 60,-10" fill="none" stroke="#1565c0" stroke-width="12" stroke-linecap="round")
                circle(cx="60" cy="-10" r="8" fill="#ffccbc")

          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 智慧監控系統
          p.text-muted.h4.mt-1 全方位系統運作狀態儀表板

        //- 下方連結區域
        b-row.justify-content-center.px-3
          //- 1. 系統管理面板
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/mgt").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4
                  .icon-box.bg-primary-light.mb-4
                    lah-fa-icon(icon="person-chalkboard", variant="primary", size="4x")
                  h4.font-weight-bold.text-dark.mb-2 系統管理面板
                  .text-muted 參數設定、權限管理與系統維護設定

          //- 2. 監控儀表板
          b-col(cols="auto").mb-4
            nuxt-link(:to="isDevOffice ? '/inf/dashboard/HA' : '/inf/dashboard/HX'").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4
                  .icon-box.bg-success-light.mb-4
                    lah-fa-icon(icon="desktop", variant="success", size="4x")
                  h4.font-weight-bold.text-dark.mb-2 {{ siteName }}監控儀表板
                  .text-muted 本所即時監控燈號與狀態總覽

          //- 3. 跨域伺服器監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/xap").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4
                  .icon-box.bg-info-light.mb-4
                    lah-fa-icon(icon="server", variant="info", size="4x")
                  h4.font-weight-bold.text-dark.mb-2 跨域伺服器監控
                  .text-muted 跨域主機服務狀態與連線檢測

          //- 4. 同步異動監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/lxhweb").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4
                  .icon-box.bg-warning-light.mb-4
                    lah-fa-icon(icon="database", variant="dark", size="4x")
                  h4.font-weight-bold.text-dark.mb-2 同步異動監控
                  .text-muted 資料庫同步作業與異動歷程查詢

          //- 5. 即時全國跨域主機監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/xap/connectivity").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4
                  .icon-box.bg-danger-light.mb-4
                    lah-fa-icon(icon="wave-square", variant="danger", size="4x")
                  h4.font-weight-bold.text-dark.mb-2 全國連線監控
                  .text-muted 全國各所跨域主機即時連線狀態

</template>

<script>
export default {
  middleware: ['isInf'],
  head: {
    title: '桃園市地政資訊系統監控'
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
  margin-bottom: 1.5rem;
}

/* 淺色背景色系，用於襯托圖示 */
.bg-primary-light { background-color: rgba(0, 123, 255, 0.1); }
.bg-success-light { background-color: rgba(40, 167, 69, 0.1); }
.bg-info-light    { background-color: rgba(23, 162, 184, 0.1); }
.bg-warning-light { background-color: rgba(255, 193, 7, 0.15); }
.bg-danger-light  { background-color: rgba(220, 53, 69, 0.1); }

a:hover {
  text-decoration: none;
}

// 響應式隱藏 Slogan 圖片
// 當視窗寬度小於 1600px (卡片會換行成兩排時) 或高度小於 800px 時，隱藏圖片
@media (max-width: 1600px), (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
