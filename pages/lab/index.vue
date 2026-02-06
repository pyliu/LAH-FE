<template lang="pug">
//- 外層維持 overflow-hidden，確保沒有全頁捲軸
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
          //- SVG Banner: 實驗室主題
          svg.mb-2.slogan-img(
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 140"
            preserveAspectRatio="xMidYMid meet"
            style="max-height: 22.5vh; width: 22.5vw; max-width: 600px;"
          )
            defs
              linearGradient#lab-grad(x1="0%" y1="0%" x2="100%" y2="100%")
                stop(offset="0%" stop-color="#6610f2")
                stop(offset="100%" stop-color="#6f42c1")
              filter#glow
                feGaussianBlur(stdDeviation="2.5" result="coloredBlur")
                feMerge
                  feMergeNode(in="coloredBlur")
                  feMergeNode(in="SourceGraphic")

            //- 背景裝飾
            circle(cx="50" cy="70" r="20" fill="#e9ecef" opacity="0.5")
            circle(cx="350" cy="40" r="30" fill="#e9ecef" opacity="0.5")
            path(d="M0,130 Q100,110 200,130 T400,130" fill="none" stroke="#dee2e6" stroke-width="2")

            //- 中央圖示：燒杯與數據
            g(transform="translate(160, 20)")
              //- 燒杯本體
              path(
                d="M30,10 L30,30 L10,80 C5,90 15,95 25,95 L55,95 C65,95 75,90 70,80 L50,30 L50,10"
                fill="url(#lab-grad)"
                opacity="0.9"
                filter="url(#glow)"
              )
              //- 瓶口
              rect(x="25" y="5" width="30" height="5" rx="1" fill="#4a148c")

              //- 氣泡動畫
              circle(cx="40" cy="70" r="3" fill="white" opacity="0.6")
                animate(attributeName="cy" values="70;40" dur="2s" repeatCount="indefinite")
                animate(attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite")
              circle(cx="50" cy="80" r="2" fill="white" opacity="0.6")
                animate(attributeName="cy" values="80;50" dur="2.5s" repeatCount="indefinite")
                animate(attributeName="opacity" values="0.6;0" dur="2.5s" repeatCount="indefinite")

              //- 右側數據線條
              path(d="M85,45 L95,35 L105,55 L115,25" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round")

              //- 左側程式碼符號
              text(x="-10" y="50" fill="#6c757d" font-family="monospace" font-weight="bold" font-size="20") &lt;/&gt;

            //- 科技元素裝飾方塊
            rect(x="120" y="50" width="8" height="8" rx="2" fill="#17a2b8" opacity="0.8")
            rect(x="270" y="80" width="8" height="8" rx="2" fill="#ffc107" opacity="0.8")

          h1.font-weight-bold.text-dark.lah-shadow.text-nowrap 地政資訊實驗室
          p.text-muted.h4.mt-1 創新功能與測試區域

        //- 下方連結區域
        b-row.justify-content-center.px-3
          //- 1. 謄本調閱紀錄檢索
          //- xl="2" 代表 12/2 = 6，即一排 6 個
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/cusmm").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="file-invoice", variant="primary", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 謄本調閱
                  .text-muted.small 調閱紀錄檢索

          //- 2. 跨縣市ONLINE即時通
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/inf/xap/xbroken_display").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-success-light.mb-3
                    lah-fa-icon(icon="tv", variant="success", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 跨縣市監控
                  .text-muted.small ONLINE 即時通

          //- 3. 簡訊紀錄查詢
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/sms").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-info-light.mb-3
                    lah-fa-icon(icon="comment-sms", variant="info", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 簡訊紀錄
                  .text-muted.small 發送紀錄查詢

          //- 4. 分時案件統計
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/stats").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-warning-light.mb-3
                    lah-fa-icon(icon="chart-line", variant="dark", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 分時統計
                  .text-muted.small 案件量統計分析

          //- 5. 簡易案件異動追蹤
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/tracking").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-danger-light.mb-3
                    lah-fa-icon(icon="clock", regular, variant="danger", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 案件追蹤
                  .text-muted.small 簡易異動追蹤

          //- 6. 全國地所伺服器監控
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/inf/xap/broken_cached").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-dark-light.mb-3
                    lah-fa-icon(icon="heart-pulse", variant="dark", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 全國監控
                  .text-muted.small 跨域主機狀態

          //- 7. 每月案件統計
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/stats/monthly").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-primary-light.mb-3
                    lah-fa-icon(icon="calendar-days", variant="primary", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 每月統計
                  .text-muted.small 月份案件量分析

          //- 8. 年度案件統計
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/lab/yearly").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-success-light.mb-3
                    lah-fa-icon(icon="calendar-check", variant="success", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 年度統計
                  .text-muted.small 年度案件量分析

          //- 9. 土地標示部綜合查詢
          b-col(cols="12" sm="6" md="4" lg="3" xl="2").mb-3
            nuxt-link(to="/reg/ralid").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-info-light.mb-3
                    lah-fa-icon(icon="panorama", variant="info", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 標示部查詢
                  .text-muted.small 綜合土地標示檢索

          //- 10. 檔案應用預約申請 (權限控制)
          b-col(cols="12" sm="6" md="4" lg="3" xl="2" v-if="isAdm || isInf || authority.isAdmin").mb-3
            nuxt-link(to="/adm/file").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-warning-light.mb-3
                    lah-fa-icon(icon="file-contract", variant="dark", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 檔案應用
                  .text-muted.small 預約申請管理

          //- 11. 監控輪播 (權限控制)
          b-col(cols="12" sm="6" md="4" lg="3" xl="2" v-if="isInf || authority.isAdmin").mb-3
            nuxt-link(to="/bureau").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-danger-light.mb-3
                    lah-fa-icon(icon="landmark-flag", variant="danger", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 監控輪播
                  .text-muted.small {{ site }} 儀表板輪播

          //- 12. 機房天氣圖 (權限控制)
          b-col(cols="12" sm="6" md="4" lg="3" xl="2" v-if="isInf || authority.isAdmin").mb-3
            nuxt-link(to="/inf/weather/").text-decoration-none
              b-card.modern-card.border-0.shadow-sm
                b-card-body.d-flex.flex-column.align-items-center.text-center.p-3
                  .icon-box.bg-purple-light.mb-3
                    lah-fa-icon(icon="cloud-sun-rain", variant="dark", size="3x")
                  h4.font-weight-bold.text-dark.mb-1 機房天氣圖
                  .text-muted.small {{ site }} 環境監控

</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧控管系統實驗室'
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

  // 移除固定寬度，讓 Grid 系統控制寬度
  height: auto;
  min-height: 260px; // 稍微降低最小高度以適應密集排列

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12) !important;

    .icon-box {
      transform: scale(1.1) rotate(3deg);
    }
  }
}

.icon-box {
  width: 100px;  // 稍微縮小圖示區域以適應密集排列
  height: 100px;
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
.bg-dark-light    { background-color: rgba(52, 58, 64, 0.1); }
.bg-purple-light  { background-color: rgba(111, 66, 193, 0.1); }

a:hover {
  text-decoration: none;
}

// 響應式隱藏 Slogan 圖片
// 在螢幕高度不足時隱藏圖片，保留空間給卡片
@media (max-height: 800px) {
  .slogan-img {
    display: none !important;
  }
}
</style>
