<template lang="pug">
//- 外層維持 overflow-hidden
div.h-100.d-flex.flex-column.bg-light.overflow-hidden
  //- 移除標題文字
  lah-header

  //- 內容區域佔滿剩餘空間
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      //- 維持 main-container 限制高度與置中
      b-container.main-container.h-100.d-flex.flex-column.justify-content-center(fluid)

        //- 上方 Slogan 區域
        .text-center.mb-3.anim-appear-1s
          //- 修改: 加入 slogan-img 類別以控制隱藏
          lah-logo-monitoring.mb-2.slogan-img(style="max-height: 35vh;")
          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 智慧監控系統
          p.text-muted.h4.mt-1 全方位系統運作狀態儀表板

        //- 下方連結區域
        b-row.justify-content-center.px-3
          //- 1. 系統管理面板
          //- 修改: mb-2 -> mb-4，增加垂直間距以匹配左右間隔
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/mgt").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="person-chalkboard", variant="primary", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 系統管理面板
                  .text-muted.small 參數設定、權限管理與系統維護設定

          //- 2. 監控儀表板
          b-col(cols="auto").mb-4
            nuxt-link(:to="isDevOffice ? '/inf/dashboard/HA' : '/inf/dashboard/HX'").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-success-light.mb-3
                    lah-fa-icon(icon="desktop", variant="success", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 {{ siteName }}監控儀表板
                  .text-muted.small 本所即時監控燈號與狀態總覽

          //- 3. 跨域伺服器監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/xap").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-info-light.mb-3
                    lah-fa-icon(icon="server", variant="info", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 跨域伺服器監控
                  .text-muted.small 跨域主機服務狀態與連線檢測

          //- 4. 同步異動監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/lxhweb").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-warning-light.mb-3
                    lah-fa-icon(icon="database", variant="dark", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 同步異動監控
                  .text-muted.small 資料庫同步作業與異動歷程查詢

          //- 5. 即時全國跨域主機監控
          b-col(cols="auto").mb-4
            nuxt-link(to="/inf/xap/connectivity").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-danger-light.mb-3
                    lah-fa-icon(icon="wave-square", variant="danger", size="4x")
                  h3.font-weight-bold.text-dark.mb-1 全國連線監控
                  .text-muted.small 全國各所跨域主機即時連線狀態

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
// 修改: 移除捲動設定，確保內容適應高度
.main-container {
  overflow: hidden;
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
