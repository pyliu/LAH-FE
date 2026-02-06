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
          //- SVG Banner: 資訊監控中心
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 40vh; width: 33vw; max-width: 1000px;"
          )
            defs
              //- 螢幕光暈
              filter#screen-glow
                feGaussianBlur(stdDeviation="1.5" result="coloredBlur")
                feMerge
                  feMergeNode(in="coloredBlur")
                  feMergeNode(in="SourceGraphic")

              //- 漸層：螢幕背景
              linearGradient#monitor-bg(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#263238")
                stop(offset="100%" stop-color="#37474f")

              //- 漸層：機櫃
              linearGradient#rack-grad(x1="0%" y1="0%" x2="100%" y2="0%")
                stop(offset="0%" stop-color="#455a64")
                stop(offset="100%" stop-color="#546e7a")

              //- 漸層：椅子
              linearGradient#chair-grad(x1="0%" y1="0%" x2="100%" y2="0%")
                stop(offset="0%" stop-color="#37474f")
                stop(offset="100%" stop-color="#546e7a")

            //- 1. 背景環境
            //- 地板
            rect(x="0" y="320" width="1000" height="80" fill="#cfd8dc")
            path(d="M0,400 L200,320 M1000,400 L800,320 M500,400 L500,320" stroke="#b0bec5" stroke-width="1")

            //- 伺服器機櫃 (左群)
            g(transform="translate(50, 40)")
              rect(x="0" y="0" width="80" height="280" fill="url(#rack-grad)" rx="4")
              //- 燈號
              g(fill="#00e676")
                circle(cx="15" cy="30" r="2")
                  animate(attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite")
                circle(cx="15" cy="40" r="2")
                  animate(attributeName="opacity" values="1;0.2;1" dur="0.3s" repeatCount="indefinite")
                circle(cx="15" cy="150" r="2")
                  animate(attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite")

            //- 伺服器機櫃 (右群)
            g(transform="translate(870, 40)")
              rect(x="0" y="0" width="80" height="280" fill="url(#rack-grad)" rx="4")
              g(fill="#2979ff")
                circle(cx="65" cy="50" r="2")
                  animate(attributeName="opacity" values="1;0.2;1" dur="0.4s" repeatCount="indefinite")
                circle(cx="65" cy="200" r="2")
                  animate(attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite")

            //- 2. 監控桌與設備
            g(transform="translate(150, 280)")
              //- 桌面
              path(d="M-50,0 L750,0 L720,20 L-20,20 Z" fill="#607d8b")
              rect(x="-20" y="20" width="740" height="10" fill="#455a64")
              //- 桌腳
              rect(x="50" y="30" width="20" height="90" fill="#37474f")
              rect(x="630" y="30" width="20" height="90" fill="#37474f")

            //- 3. 多螢幕儀表板
            g(transform="translate(500, 270)")
              //- 主螢幕 (中) - 系統波形與日誌
              g(transform="translate(-160, -180)")
                //- 支架
                rect(x="140" y="160" width="40" height="40" fill="#212121")
                path(d="M120,200 L200,200 L190,210 L130,210 Z" fill="#212121")
                //- 螢幕框
                rect(x="0" y="0" width="320" height="180" rx="6" fill="#212121" stroke="#37474f" stroke-width="4")
                rect(x="10" y="10" width="300" height="160" fill="url(#monitor-bg)")

                //- 內容：動態波形圖
                path(d="M20,80 Q50,20 80,80 T140,80 T200,80 T260,80" fill="none" stroke="#29b6f6" stroke-width="2" filter="url(#screen-glow)")
                  animate(attributeName="d"
                    values="M20,80 Q50,20 80,80 T140,80 T200,80 T260,80; M20,80 Q50,140 80,80 T140,80 T200,80 T260,80; M20,80 Q50,20 80,80 T140,80 T200,80 T260,80"
                    dur="3s" repeatCount="indefinite")

                //- 內容：系統日誌文字模擬
                g(fill="#00e676" font-family="monospace" font-size="8" opacity="0.8")
                  text(x="20" y="120") [SYSTEM] Service check... OK
                  text(x="20" y="135") [NETWORK] Ping 192.168.1.1... 2ms
                  text(x="20" y="150") [DB] Transaction committed.
                  rect(x="20" y="112" width="200" height="40" fill="url(#monitor-bg)" opacity="0.3")
                    animate(attributeName="y" values="112; 155" dur="2s" repeatCount="indefinite")

              //- 側螢幕 (左) - 圓餅圖
              g(transform="translate(-320, -150) rotate(10)")
                rect(x="0" y="0" width="140" height="120" rx="4" fill="#212121" stroke="#37474f" stroke-width="3")
                rect(x="8" y="8" width="124" height="104" fill="url(#monitor-bg)")
                //- 圓餅圖
                path(d="M62,62 L62,20 A42,42 0 0,1 95,35 Z" fill="#ff7043")
                path(d="M62,62 L95,35 A42,42 0 0,1 95,89 Z" fill="#26c6da")
                path(d="M62,62 L95,89 A42,42 0 1,1 62,20 Z" fill="#7e57c2")

              //- 側螢幕 (右) - 長條圖
              g(transform="translate(180, -130) rotate(-10)")
                rect(x="0" y="0" width="140" height="120" rx="4" fill="#212121" stroke="#37474f" stroke-width="3")
                rect(x="8" y="8" width="124" height="104" fill="url(#monitor-bg)")
                //- 長條圖動畫
                rect(x="20" y="40" width="15" height="60" fill="#66bb6a")
                  animate(attributeName="height" values="60;30;60" dur="2s" repeatCount="indefinite")
                  animate(attributeName="y" values="40;70;40" dur="2s" repeatCount="indefinite")
                rect(x="50" y="20" width="15" height="80" fill="#ffca28")
                  animate(attributeName="height" values="80;50;80" dur="3s" repeatCount="indefinite")
                  animate(attributeName="y" values="20;50;20" dur="3s" repeatCount="indefinite")
                rect(x="80" y="50" width="15" height="50" fill="#42a5f5")
                  animate(attributeName="height" values="50;70;50" dur="2.5s" repeatCount="indefinite")
                  animate(attributeName="y" values="50;30;50" dur="2.5s" repeatCount="indefinite")

            //- 4. 紅綠燈狀態指示板 (懸掛於右側 750位置)
            g(transform="translate(750, 40)")
              //- 懸掛線
              line(x1="25" y1="-40" x2="25" y2="0" stroke="#455a64" stroke-width="2")
              //- 外殼
              rect(x="0" y="0" width="50" height="130" rx="8" fill="#212121" stroke="#455a64" stroke-width="3" filter="url(#screen-glow)")
              //- 遮光罩
              path(d="M5,15 Q25,5 45,15" fill="none" stroke="#37474f" stroke-width="2")
              path(d="M5,55 Q25,45 45,55" fill="none" stroke="#37474f" stroke-width="2")
              path(d="M5,95 Q25,85 45,95" fill="none" stroke="#37474f" stroke-width="2")

              //- 紅燈 (呼吸燈)
              circle(cx="25" cy="25" r="12" fill="#d32f2f" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="0s" repeatCount="indefinite")
                animate(attributeName="fill" values="#d32f2f;#ff1744;#d32f2f" dur="3s" begin="0s" repeatCount="indefinite")
              //- 黃燈 (呼吸燈)
              circle(cx="25" cy="65" r="12" fill="#fbc02d" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="1s" repeatCount="indefinite")
                animate(attributeName="fill" values="#fbc02d;#ffea00;#fbc02d" dur="3s" begin="1s" repeatCount="indefinite")
              //- 綠燈 (呼吸燈)
              circle(cx="25" cy="105" r="12" fill="#388e3c" opacity="0.3")
                animate(attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="2s" repeatCount="indefinite")
                animate(attributeName="fill" values="#388e3c;#00e676;#388e3c" dur="3s" begin="2s" repeatCount="indefinite")

            //- 5. 專業人員 (坐姿背影 - 高清晰度)
            g(transform="translate(500, 380)")
              //- 椅子下半部
              g
                path(d="M0,0 L-40,20 M0,0 L40,20 M0,0 L0,20 M0,0 L-30,-10 M0,0 L30,-10" stroke="#37474f" stroke-width="6" stroke-linecap="round")
                rect(x="-5" y="-40" width="10" height="40" fill="#546e7a")

              //- 椅子與人
              g(transform="translate(0, -35)")
                //- 椅座
                path(d="M-45,0 Q0,10 45,0 L45,-10 L-45,-10 Z" fill="#263238")
                //- 椅背
                path(d="M-35,-10 L-40,-100 Q0,-110 40,-100 L35,-10 Z" fill="url(#chair-grad)")
                rect(x="-20" y="-120" width="40" height="20" rx="5" fill="#263238")

                //- 人物身體
                path(d="M-30,0 L-25,-90 Q0,-100 25,-90 L30,0 Z" fill="#1565c0")
                //- 領口
                path(d="M-25,-90 Q0,-80 25,-90 L25,-85 Q0,-75 -25,-85 Z" fill="#0d47a1")
                //- 脖子
                rect(x="-8" y="-95" width="16" height="15" fill="#ffccbc")
                //- 頭部
                circle(cx="0" cy="-115" r="26" fill="#ffccbc")
                //- 頭髮
                path(d="M-26,-115 Q-28,-150 0,-150 Q28,-150 26,-115 V-110 H-26 Z" fill="#3e2723")
                //- 耳機
                path(d="M-28,-115 A28,28 0 0,1 28,-115" fill="none" stroke="#212121" stroke-width="5")
                rect(x="-32" y="-125" width="10" height="25" rx="2" fill="#212121")
                rect(x="22" y="-125" width="10" height="25" rx="2" fill="#212121")

                //- 右手
                path(d="M25,-50 Q45,-40 60,-10" fill="none" stroke="#1565c0" stroke-width="10" stroke-linecap="round")
                circle(cx="60" cy="-10" r="7" fill="#ffccbc")

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
