<template lang="pug">
.inf-dashboard-page.min-vh-100.d-flex.flex-column
  //- 頂部統一標準標題列 (與 /reg 及 /admin 風格一致)
  lah-header
    lah-transition(appear): .d-flex.align-items-center.justify-content-between.w-100.my-auto
      .d-flex.align-items-center
        span.h3.font-weight-bold.text-dark.mr-2.my-auto
          span.text-primary 桃園市地政
          span.ml-1 智慧監控系統
        b-badge.py-1.px-2.d-none.d-sm-inline-flex.align-items-center(
          pill
          variant="light"
          class="border text-info font-weight-bold mr-2"
        )
          lah-fa-icon(icon="house-laptop" size="xs").mr-1
          span {{ siteName }} 資訊課
        b-badge.py-1.px-2.d-none.d-md-inline-flex.align-items-center(
          pill
          variant="success"
          class="font-weight-bold text-white shadow-sm"
        )
          span.status-dot.mr-1
          span 全系統運作中
      .d-flex.align-items-center
        lah-button(
          icon="info"
          variant="outline-primary"
          no-border
          no-icon-gutter
          size="lg"
          v-b-modal.inf-help-modal
          title="監控系統功能說明"
        )

  //- 功能說明 Help Modal
  lah-help-modal(:modal-id="'inf-help-modal'" size="lg")
    .font-weight-bold.text-primary.h5.mb-3
      lah-fa-icon(icon="circle-info", size="lg").mr-2
      | 智慧監控系統功能指引
    p.text-muted 整合全所伺服器、資料庫、網路連線與跨機關業務同步之即時監控中樞，提供各項系統運作狀態、警訊警示及管理設定。
    hr.my-2
    ul.pl-3.mb-0
      li.mb-3
        strong.text-primary 系統管理面板 (/inf/mgt)：
        .text-secondary.small 提供監控相關環境參數、系統定時排程、通知規則與資訊課專用權限設定。
      li.mb-3
        strong.text-success {{ siteName }}戰情面板 (/inf/dashboard)：
        .text-secondary.small 本所即時燈號總覽，即時掌握 XAP、SRMAS、PowerHA、DataGuard 等核心伺服器健康狀態。
      li.mb-3
        strong.text-info 跨域伺服器監控 (/inf/xap)：
        .text-secondary.small 全國跨縣市主機服務運行狀況、跨域 API 響應時間與連線檢測。
      li.mb-3
        strong.text-warning 同步異動監控 (/inf/lxhweb)：
        .text-secondary.small 地政資料庫即時同步作業狀態、歷史異動記錄與異常檢索追蹤。
      li.mb-2
        strong.text-danger 全國連線監控 (/inf/xap/connectivity)：
        .text-secondary.small 全國各所主機即時網路連線延遲 (Ping) 與服務可用性偵測儀表板。

  //- 內容主體：左右分割中控台 (Split Hero Layout)
  .flex-grow-1.py-3.py-xl-4.px-3.px-md-4.overflow-auto
    b-container(fluid="xl").h-100
      b-row.align-items-center.h-100
        //- ======================= 左側：視覺英雄區 (Hero Section) =======================
        b-col(cols="12" lg="5" xl="5").mb-4.mb-lg-0.text-center.text-lg-left
          .hero-wrapper.px-2.px-xl-3.anim-appear-1s
            //- 大尺寸科技插圖 (寬高充裕，大氣呈現)
            .svg-container.mb-3.mb-xl-4
              svg.slogan-img(
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1000 400"
                preserveAspectRatio="xMidYMid meet"
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

            //- 英雄區文字與標籤
            .hero-content
              .d-flex.align-items-center.justify-content-center.justify-content-lg-start.flex-wrap.mb-2
                b-badge(variant="info" pill class="py-1 px-3 mr-2 mb-1 shadow-sm font-weight-bold")
                  lah-fa-icon(icon="server" size="xs").mr-1
                  span 即時監控中樞
                b-badge(variant="success" pill class="py-1 px-3 mb-1 shadow-sm font-weight-bold")
                  span.status-dot.mr-1
                  span 服務正常

              h1.hero-title.font-weight-bold.text-dark.mb-2 智慧監控工具
              p.hero-subtitle.text-muted.mb-3 全方位掌握主機、資料庫與跨域連線狀態，保障地政核心系統 7x24 高穩定運作。

              .hero-chips.d-flex.align-items-center.justify-content-center.justify-content-lg-start.flex-wrap
                .chip-item.mr-3.mb-2
                  lah-fa-icon(icon="shield-halved" class="text-primary mr-1")
                  span.text-secondary.small 主動防禦
                .chip-item.mr-3.mb-2
                  lah-fa-icon(icon="bolt" class="text-warning mr-1")
                  span.text-secondary.small 毫秒警示
                .chip-item.mb-2
                  lah-fa-icon(icon="chart-line" class="text-success mr-1")
                  span.text-secondary.small 趨勢分析

        //- ======================= 右側：5 大功能操作卡片區 =======================
        b-col(cols="12" lg="7" xl="7")
          b-row.cards-grid
            //- 1. 系統管理面板
            b-col(cols="12" sm="6").mb-3.mb-xl-4.d-flex
              nuxt-link(to="/inf/mgt").card-link.w-100
                b-card.modern-card.border-0.shadow-sm.h-100(no-body)
                  b-card-body.p-3.p-xl-4.d-flex.flex-column
                    .d-flex.align-items-center.justify-content-between.mb-3
                      .icon-box.bg-primary-light
                        lah-fa-icon(icon="person-chalkboard", variant="primary", size="2x")
                      .arrow-icon
                        lah-fa-icon(icon="chevron-right", variant="muted", size="sm")
                    h4.card-title.font-weight-bold.text-dark.mb-2 系統管理面板
                    p.card-desc.text-muted.mb-0.mt-auto 參數設定、權限管理與系統維護設定

            //- 2. 戰情面板
            b-col(cols="12" sm="6").mb-3.mb-xl-4.d-flex
              nuxt-link(:to="isDevOffice ? '/inf/dashboard/' : '/inf/dashboard/?mode=HX'").card-link.w-100
                b-card.modern-card.border-0.shadow-sm.h-100(no-body)
                  b-card-body.p-3.p-xl-4.d-flex.flex-column
                    .d-flex.align-items-center.justify-content-between.mb-3
                      .icon-box.bg-success-light
                        lah-fa-icon(icon="desktop", variant="success", size="2x")
                      .arrow-icon
                        lah-fa-icon(icon="chevron-right", variant="muted", size="sm")
                    h4.card-title.font-weight-bold.text-dark.mb-2 {{ siteName }}戰情面板
                    p.card-desc.text-muted.mb-0.mt-auto 本所即時監控燈號與狀態總覽

            //- 3. 跨域伺服器監控
            b-col(cols="12" sm="6").mb-3.mb-xl-4.d-flex
              nuxt-link(to="/inf/xap").card-link.w-100
                b-card.modern-card.border-0.shadow-sm.h-100(no-body)
                  b-card-body.p-3.p-xl-4.d-flex.flex-column
                    .d-flex.align-items-center.justify-content-between.mb-3
                      .icon-box.bg-info-light
                        lah-fa-icon(icon="server", variant="info", size="2x")
                      .arrow-icon
                        lah-fa-icon(icon="chevron-right", variant="muted", size="sm")
                    h4.card-title.font-weight-bold.text-dark.mb-2 跨域伺服器監控
                    p.card-desc.text-muted.mb-0.mt-auto 跨域主機服務狀態與連線檢測

            //- 4. 同步異動監控
            b-col(cols="12" sm="6").mb-3.mb-xl-4.d-flex
              nuxt-link(to="/inf/lxhweb").card-link.w-100
                b-card.modern-card.border-0.shadow-sm.h-100(no-body)
                  b-card-body.p-3.p-xl-4.d-flex.flex-column
                    .d-flex.align-items-center.justify-content-between.mb-3
                      .icon-box.bg-warning-light
                        lah-fa-icon(icon="database", variant="dark", size="2x")
                      .arrow-icon
                        lah-fa-icon(icon="chevron-right", variant="muted", size="sm")
                    h4.card-title.font-weight-bold.text-dark.mb-2 同步異動監控
                    p.card-desc.text-muted.mb-0.mt-auto 資料庫同步作業與異動歷程查詢

            //- 5. 全國連線監控 (第 5 項跨滿整列橫卡)
            b-col(cols="12").mb-3.mb-xl-4.d-flex
              nuxt-link(to="/inf/xap/connectivity").card-link.w-100
                b-card.modern-card.featured-card.border-0.shadow-sm.h-100(no-body)
                  b-card-body.p-3.p-xl-4.d-flex.align-items-center.justify-content-between
                    .d-flex.align-items-center
                      .icon-box.bg-danger-light.mr-3.mr-xl-4.mb-0
                        lah-fa-icon(icon="wave-square", variant="danger", size="2x")
                      .card-text-wrapper
                        h4.card-title.font-weight-bold.text-dark.mb-1 全國連線監控
                        p.card-desc.text-muted.mb-0 全國各所跨域主機即時網路連線與服務延遲檢測
                    .arrow-icon.ml-2
                      lah-fa-icon(icon="chevron-right", variant="muted", size="lg")

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
.inf-dashboard-page {
  background-color: #f8fafc;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #00e676;
  box-shadow: 0 0 6px #00e676;
  animation: pulse-dot 2s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.85);
  }
}

.hero-wrapper {
  .svg-container {
    max-width: 520px;
    margin: 0 auto;

    .slogan-img {
      width: 100%;
      height: auto;
      max-height: 280px;
      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.08));
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }
    }
  }

  .hero-title {
    font-size: 2.2rem;
    letter-spacing: -0.5px;
  }

  .hero-subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .chip-item {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
}

.card-link {
  text-decoration: none !important;
  color: inherit;
  display: flex;
  flex-direction: column;
}

.modern-card {
  background-color: #ffffff;
  border-radius: 16px !important;
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;

    .icon-box {
      transform: scale(1.08) rotate(3deg);
    }

    .arrow-icon {
      transform: translateX(4px);
      color: #007bff;
    }
  }

  .card-title {
    font-size: 1.25rem;
  }

  .card-desc {
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .arrow-icon {
    transition: all 0.2s ease-in-out;
    color: #cbd5e1;
  }
}

.icon-box {
  width: 58px;
  height: 58px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

/* 淺色背景色系，用於襯托圖示 */
.bg-primary-light { background-color: rgba(0, 123, 255, 0.12); }
.bg-success-light { background-color: rgba(40, 167, 69, 0.12); }
.bg-info-light    { background-color: rgba(23, 162, 184, 0.12); }
.bg-warning-light { background-color: rgba(255, 193, 7, 0.18); }
.bg-danger-light  { background-color: rgba(220, 53, 69, 0.12); }

.featured-card {
  .icon-box {
    width: 64px;
    height: 64px;
  }
}
</style>
