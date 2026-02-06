<template lang="pug">
div.h-100.d-flex.flex-column.overflow-hidden
  lah-header
    lah-fa-icon.h1.my-auto(icon="people-roof")
      span.ml-1 {{ office }} 地政事務所入口網

  //- 使用 flex-grow-1 佔滿剩餘高度，並在內部處理捲動
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      b-container.h-100.py-3(fluid)
        b-row.h-100
          //- 左側：系統入口 (設定 overflow-auto 讓內容過多時可內部捲動)
          b-col.h-100.overflow-auto(
            cols="12",
            :md="displayAnnouncement ? 8 : 12"
          ).mb-3.mb-md-0.px-xl-5.px-lg-4
            b-row(justify="center")
              //- 智慧監控系統 (權限控制)
              b-col(cols="12" sm="6" xl="4" v-if="isInf || authority.isAdmin").mb-4
                nuxt-link(to="/inf").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm(no-body)
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-center.p-4
                      //- 圖示容器加大，填滿上半部
                      .img-container.mb-3
                        b-img(src="~/assets/img/MONITOR.jpg" fluid alt="智慧監控系統")
                      //- 字體放大
                      h3.font-weight-bold.text-dark.mb-2 智慧監控系統
                      .text-muted.h5.mb-0 即時監控與狀態回報

              //- 智慧控管系統
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/reg").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm(no-body)
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-center.p-4
                      .img-container.mb-3
                        b-img(src="~/assets/img/REG.jpg" fluid alt="智慧控管系統")
                      h3.font-weight-bold.text-dark.mb-2 智慧控管系統
                      .text-muted.h5.mb-0 登記案件與流程管理

              //- 地價小幫手
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/prc").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm(no-body)
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-center.p-4
                      .img-container.mb-3
                        b-img(src="~/assets/img/VAL.jpg" fluid alt="地價小幫手")
                      h3.font-weight-bold.text-dark.mb-2 地價小幫手
                      .text-muted.h5.mb-0 地價計算與查詢工具

              //- 測量小幫手
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/sur").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm(no-body)
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-center.p-4
                      .img-container.mb-3
                        b-img(src="~/assets/img/SUR.jpg" fluid alt="測量小幫手")
                      h3.font-weight-bold.text-dark.mb-2 測量小幫手
                      .text-muted.h5.mb-0 測量案件輔助系統

              //- 資訊實驗室
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/lab").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm(no-body)
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-center.p-4
                      .img-container.mb-3
                        b-img(src="~/assets/img/INF.jpg" fluid alt="資訊實驗室")
                      h3.font-weight-bold.text-dark.mb-2 資訊實驗室
                      .text-muted.h5.mb-0 創新功能與測試區域

          //- 右側：即時通公告 (填滿高度但受 max-height 限制)
          b-col.h-100(
            cols="12",
            md="4",
            v-if="displayAnnouncement"
          )
            b-card.h-100.border-0.shadow.announcement-card(no-body)
              b-card-header.bg-white.border-bottom-0.pt-3.flex-shrink-0
                .d-flex.align-items-center.text-primary
                  lah-fa-icon(icon="bullhorn", size="lg")
                  h5.m-0.ml-2.font-weight-bold 最新即時通公告

              //- 修正：將 overflow-auto 移至 b-card-body，並設定 flex-grow-1 與 min-height: 0
              //- 這能確保捲動條出現在內容區塊，且不會撐爆父容器
              b-card-body.p-0.d-flex.flex-column.overflow-auto.flex-grow-1(style="min-height: 0")
                lah-timeline-announcement.px-3(
                  open-first,
                  no-border,
                  :init-count="10",
                  :load-count="5",
                  :load-button="false",
                  @announcement-count="handleAnnouncementEvent($event)"
                )

</template>

<script>
export default {
  data: () => ({
    displayAnnouncement: true
  }),
  head: {
    title: '地政事務所入口網'
  },
  computed: {
    office () { return this.site }
  },
  methods: {
    handleAnnouncementEvent (payload) {
      if (payload.count && payload.count > 0) {
        this.displayAnnouncement = true
      } else {
        this.displayAnnouncement = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.system-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: #ffffff;
  border-radius: 16px !important;
  min-height: 300px;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.15) !important;
    background-color: #ffffff;

    .img-container {
      transform: scale(1.05);
    }
  }

  .img-container {
    width: 100%;
    height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;

    img {
      max-height: 100%;
      width: auto;
      max-width: 100%;
      object-fit: contain;
    }
  }

  h3 {
    font-size: 1.75rem;
  }
}

.announcement-card {
  border-radius: 16px !important;
  // 限制最大高度為視窗高度減去 130px (保留 header 與 padding)
  max-height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
}

/* 讓連結文字沒有底線 */
a:hover {
  text-decoration: none;
}
</style>
