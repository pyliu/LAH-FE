<template lang="pug">
//- 外層維持 overflow-hidden
div.h-100.d-flex.flex-column.overflow-hidden(v-cloak)
  //- 標題列
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 管理主面板
          lah-button(
            icon="info"
            variant="outline-success"
            no-border
            no-icon-gutter
            v-b-modal.help-modal
            title="功能說明"
          )
        div
    lah-help-modal(:modal-id="'help-modal'" size="lg")
      .font-weight-bold.text-primary.h5.mb-3
        lah-fa-icon(icon="shield-halved", size="lg").mr-2
        | 管理主面板功能指引
      p.text-muted 彙編系統管理師常用之後台管理功能，涵蓋同仁帳號資料維護、IP 角色權限設定、網路 IP 對應名稱及全域系統參數調整。
      hr.my-2
      ul.pl-3.mb-0
        li.mb-3
          strong.text-primary 員工資訊管理 (/admin/users)：
          .text-secondary.small 管理機關內同仁帳號、姓名、課室職稱、電腦 IP、分機及大頭照；提供 AD 帳號連線設定與資料雙向同步，支援多筆登入記錄之動態 IP 權重比對。
        li.mb-3
          strong.text-success 使用者角色管理 (/admin/roles)：
          .text-secondary.small 以同仁電腦 IP 位址為基礎配置角色權限，包含系統管理者、主管、代主管、研考、總務、協辦及文書等身分，保障系統操作安全性。
        li.mb-3
          strong.text-info IP對應名稱管理 (/admin/ip)：
          .text-secondary.small 建立並維護全所電腦 IP 網段分配與對應名稱、電腦設備位置標籤，方便快速辨識及管理內部網路主機。
        li.mb-2
          strong.text-warning 系統參數管理 (/admin/configs)：
          .text-secondary.small 集中管理全系統 35 項環境設定、站點代碼、API 服務位址、功能開關、逾期閾值及後台管理密碼（支援 MD5 加密保護）。

  //- 內容區域佔滿剩餘空間
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      b-container.main-container.h-100.d-flex.flex-column.justify-content-center(fluid)
        //- 上方 Slogan / Banner 區域
        .text-center.mb-3.anim-appear-1s
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 500 150"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 25vh; width: 33vw; max-width: 500px;"
          )
            defs
              linearGradient#admin-grad-screen(x1="0%" y1="0%" x2="0%" y2="100%")
                stop(offset="0%" stop-color="#263238")
                stop(offset="100%" stop-color="#37474f")
              linearGradient#admin-grad-shield(x1="0%" y1="0%" x2="100%" y2="100%")
                stop(offset="0%" stop-color="#42a5f5")
                stop(offset="100%" stop-color="#1565c0")
              linearGradient#admin-grad-gear(x1="0%" y1="0%" x2="100%" y2="100%")
                stop(offset="0%" stop-color="#ffa726")
                stop(offset="100%" stop-color="#fb8c00")
              filter#admin-shadow(x="-20%" y="-20%" width="140%" height="140%")
                feGaussianBlur(in="SourceAlpha" stdDeviation="3")
                feOffset(dx="1" dy="2" result="offsetblur")
                feComponentTransfer
                  feFuncA(type="linear" slope="0.25")
                feMerge
                  feMergeNode(in="offsetblur")
                  feMergeNode(in="SourceGraphic")

            //- 背景裝飾線
            g(opacity="0.25")
              line(x1="50" y1="75" x2="450" y2="75" stroke="#90a4ae" stroke-width="2" stroke-dasharray="4,4")
              circle(cx="100" cy="75" r="4" fill="#1e88e5")
              circle(cx="400" cy="75" r="4" fill="#fb8c00")

            //- 1. 左側：人員卡片 (Users / Roles)
            g(transform="translate(40, 25)" filter="url(#admin-shadow)")
              rect(x="0" y="0" width="110" height="95" rx="8" fill="#ffffff" stroke="#cfd8dc" stroke-width="1.5")
              rect(x="0" y="0" width="110" height="24" rx="8" fill="#e3f2fd")
              rect(x="0" y="16" width="110" height="8" fill="#e3f2fd")
              circle(cx="20" cy="12" r="5" fill="#1e88e5")
              rect(x="32" y="9" width="50" height="6" rx="3" fill="#90caf9")
              circle(cx="20" cy="40" r="7" fill="#bbdefb")
              rect(x="34" y="37" width="55" height="6" rx="3" fill="#90a4ae")
              circle(cx="20" cy="62" r="7" fill="#c8e6c9")
              rect(x="34" y="59" width="45" height="6" rx="3" fill="#90a4ae")
              circle(cx="20" cy="84" r="7" fill="#ffe0b2")
              rect(x="34" y="81" width="50" height="6" rx="3" fill="#90a4ae")

            //- 2. 中央：管理控制台與防護盾 (Console & Shield)
            g(transform="translate(185, 12)" filter="url(#admin-shadow)")
              rect(x="0" y="0" width="130" height="105" rx="8" fill="url(#admin-grad-screen)" stroke="#455a64" stroke-width="2")
              circle(cx="14" cy="12" r="3.5" fill="#ef5350")
              circle(cx="25" cy="12" r="3.5" fill="#ffca28")
              circle(cx="36" cy="12" r="3.5" fill="#66bb6a")
              line(x1="0" y1="22" x2="130" y2="22" stroke="#455a64" stroke-width="1.5")
              rect(x="15" y="32" width="40" height="6" rx="3" fill="#42a5f5")
              rect(x="15" y="44" width="55" height="5" rx="2" fill="#546e7a")
              rect(x="15" y="54" width="48" height="5" rx="2" fill="#546e7a")
              rect(x="15" y="64" width="52" height="5" rx="2" fill="#546e7a")
              rect(x="15" y="76" width="30" height="12" rx="6" fill="#00e676")
              circle(cx="37" cy="82" r="5" fill="#ffffff")
              g(transform="translate(75, 40)")
                path(d="M20,0 C32,0 40,6 40,16 C40,32 20,44 20,44 C20,44 0,32 0,16 C0,6 8,0 20,0 Z" fill="url(#admin-grad-shield)")
                path(d="M14,18 L18,22 L27,13" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round")
              path(d="M50,105 L45,120 L85,120 L80,105 Z" fill="#37474f")
              rect(x="35" y="120" width="60" height="5" rx="2" fill="#263238")

            //- 3. 右側：齒輪與網路機櫃 (Configs & Network)
            g(transform="translate(350, 25)" filter="url(#admin-shadow)")
              rect(x="0" y="0" width="110" height="95" rx="8" fill="#ffffff" stroke="#cfd8dc" stroke-width="1.5")
              rect(x="0" y="0" width="110" height="24" rx="8" fill="#fff3e0")
              rect(x="0" y="16" width="110" height="8" fill="#fff3e0")
              circle(cx="20" cy="12" r="4" fill="#fb8c00")
              circle(cx="32" cy="12" r="4" fill="#43a047")
              circle(cx="44" cy="12" r="4" fill="#1e88e5")
              rect(x="12" y="32" width="86" height="16" rx="3" fill="#eceff1")
              circle(cx="22" cy="40" r="3" fill="#00e676")
              circle(cx="30" cy="40" r="3" fill="#00e676")
                animate(attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite")
              rect(x="42" y="38" width="46" height="4" rx="2" fill="#b0bec5")
              rect(x="12" y="52" width="86" height="16" rx="3" fill="#eceff1")
              circle(cx="22" cy="60" r="3" fill="#29b6f6")
              circle(cx="30" cy="60" r="3" fill="#29b6f6")
                animate(attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite")
              rect(x="42" y="58" width="38" height="4" rx="2" fill="#b0bec5")
              g(transform="translate(85, 88)")
                g
                  circle(cx="0" cy="0" r="14" fill="url(#admin-grad-gear)")
                  circle(cx="0" cy="0" r="5" fill="#ffffff")
                  path(d="M-3,-18 H3 V-14 H-3 Z M-3,14 H3 V18 H-3 Z M-18,-3 H-14 V3 H-18 Z M14,-3 H18 V3 H14 Z" fill="url(#admin-grad-gear)")
                  animateTransform(attributeName="transform" type="rotate" values="0; 360" dur="8s" repeatCount="indefinite")

          h3.font-weight-bold.text-dark.mb-1 地政系統管理主面板
          .text-muted 集中維護人員資訊、角色權限、網路 IP 及全域系統參數

        //- 下方功能選單卡片區域 (符合 admin 目錄下 4 個子模組)
        b-row.justify-content-center.px-3
          //- 1. 員工資訊管理
          b-col(cols="12" sm="6" lg="3" xl="auto").mb-4
            nuxt-link(to="/admin/users").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4.h-100
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="users-gear", variant="primary", size="4x")
                  b-badge.mb-2.px-2.py-1(variant="primary" pill) 人員與帳號
                  h4.font-weight-bold.text-dark.mb-2 員工資訊管理
                  .text-muted.small.flex-grow-1 管理同仁帳號姓名、課室職稱、電腦 IP、分機大頭照及 AD 帳號連線同步
                  .mt-3.text-primary.font-weight-bold.small
                    span 前往管理
                    lah-fa-icon.ml-1(icon="chevron-right", size="sm")

          //- 2. 使用者角色管理
          b-col(cols="12" sm="6" lg="3" xl="auto").mb-4
            nuxt-link(to="/admin/roles").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4.h-100
                  .icon-box.bg-success-light.mb-3
                    lah-fa-icon(icon="user-shield", variant="success", size="4x")
                  b-badge.mb-2.px-2.py-1(variant="success" pill) 權限與角色
                  h4.font-weight-bold.text-dark.mb-2 使用者角色管理
                  .text-muted.small.flex-grow-1 依電腦 IP 位址配置系統管理者、主管、代主管、研考、總務等角色權限
                  .mt-3.text-success.font-weight-bold.small
                    span 前往管理
                    lah-fa-icon.ml-1(icon="chevron-right", size="sm")

          //- 3. IP對應名稱管理
          b-col(cols="12" sm="6" lg="3" xl="auto").mb-4
            nuxt-link(to="/admin/ip").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4.h-100
                  .icon-box.bg-info-light.mb-3
                    lah-fa-icon(icon="network-wired", variant="info", size="4x")
                  b-badge.mb-2.px-2.py-1(variant="info" pill) 網路與設備
                  h4.font-weight-bold.text-dark.mb-2 IP對應名稱管理
                  .text-muted.small.flex-grow-1 全所電腦 IP 網段分配、位置電腦名稱對應、設備標籤維護與網路位址對照
                  .mt-3.text-info.font-weight-bold.small
                    span 前往管理
                    lah-fa-icon.ml-1(icon="chevron-right", size="sm")

          //- 4. 系統參數管理
          b-col(cols="12" sm="6" lg="3" xl="auto").mb-4
            nuxt-link(to="/admin/configs").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-4.h-100
                  .icon-box.bg-warning-light.mb-3
                    lah-fa-icon(icon="sliders", variant="warning", size="4x")
                  b-badge.mb-2.px-2.py-1(variant="warning" pill) 核心設定
                  h4.font-weight-bold.text-dark.mb-2 系統參數管理
                  .text-muted.small.flex-grow-1 集中維護 35 項系統環境參數、站點連線設定、功能開關與安全管理密碼
                  .mt-3.text-warning.font-weight-bold.small
                    span 前往管理
                    lah-fa-icon.ml-1(icon="chevron-right", size="sm")

</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '管理主面板-桃園市地政局'
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

  width: 18rem;
  max-width: 90vw;

  height: 100%;
  min-height: 330px;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12) !important;

    .icon-box {
      transform: scale(1.08) rotate(3deg);
    }
  }
}

.icon-box {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease;
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
@media (max-width: 1200px), (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
