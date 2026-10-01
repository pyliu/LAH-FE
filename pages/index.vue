<template lang="pug">
div.h-100.d-flex.flex-column.overflow-hidden
  lah-header
    lah-transition(appear): .d-flex.align-items-center.justify-content-between.w-100.my-auto
      .d-flex.align-items-center
        lah-fa-icon.h2.my-auto(icon="people-roof" variant="primary")
        span.h3.font-weight-bold.ml-2.my-auto {{ office }} 地政事務所入口網
      .d-flex.align-items-center
        b-badge.d-none.d-lg-inline-flex.align-items-center.py-1.px-2(variant="light" class="border text-muted mr-2")
          lah-fa-icon(icon="building" class="text-success mr-1")
          span.mr-2 {{ siteName }}
          lah-fa-icon(icon="user" class="text-primary mr-1")
          span {{ userDisplayName }}

  //- 主體區域佔滿剩餘高度，內部處理捲動
  .flex-grow-1.position-relative.overflow-hidden
    lah-transition(appear, speed="fast").h-100
      b-container.h-100.py-3(fluid)
        b-row.h-100
          //- 左側：系統服務入口卡片區
          b-col.h-100.overflow-auto(
            cols="12"
            :md="displayAnnouncement ? 8 : 12"
            class="mb-3 mb-md-0 px-xl-4 px-lg-3 custom-scrollbar"
          )
            b-row(justify="center")
              //- 1. 智慧監控系統 (權限控制)
              b-col(cols="12" sm="6" xl="4" v-if="isInf || authority.isAdmin").mb-4
                nuxt-link(to="/inf").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-inf
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(variant="info" pill class="px-2 py-1")
                          lah-fa-icon(icon="desktop" size="xs").mr-1
                          span 即時監控
                      .img-container.mb-3
                        b-img(src="~/assets/img/MONITOR.jpg" fluid alt="智慧監控工具")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 智慧監控工具
                        p.text-muted.small.mb-2 即時監控與狀態回報
                      .action-indicator.text-info.small.font-weight-bold
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

              //- 2. 智慧控管系統
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/reg").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-reg
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(variant="success" pill class="px-2 py-1")
                          lah-fa-icon(icon="list-check" size="xs").mr-1
                          span 案件流程
                      .img-container.mb-3
                        b-img(src="~/assets/img/REG.jpg" fluid alt="智慧控管工具")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 智慧控管工具
                        p.text-muted.small.mb-2 登記案件與流程管理
                      .action-indicator.text-success.small.font-weight-bold
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

              //- 3. 地價小幫手
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/prc").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-val
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(variant="warning" pill class="px-2 py-1")
                          lah-fa-icon(icon="coins" size="xs").mr-1
                          span 地價試算
                      .img-container.mb-3
                        b-img(src="~/assets/img/VAL.jpg" fluid alt="地價小幫手")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 地價小幫手
                        p.text-muted.small.mb-2 地價計算與查詢工具
                      .action-indicator.text-warning.small.font-weight-bold
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

              //- 4. 測量小幫手
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/sur").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-sur
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(pill class="px-2 py-1 text-white" style="background-color: #6f42c1;")
                          lah-fa-icon(icon="ruler-combined" size="xs").mr-1
                          span 測量圖資
                      .img-container.mb-3
                        b-img(src="~/assets/img/SUR.jpg" fluid alt="測量小幫手")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 測量小幫手
                        p.text-muted.small.mb-2 測量案件輔助系統
                      .action-indicator.small.font-weight-bold(style="color: #6f42c1;")
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

              //- 5. 資訊實驗室
              b-col(cols="12" sm="6" xl="4").mb-4
                nuxt-link(to="/lab").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-lab
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(variant="primary" pill class="px-2 py-1")
                          lah-fa-icon(icon="flask" size="xs").mr-1
                          span 創新研發
                      .img-container.mb-3
                        b-img(src="~/assets/img/INF.jpg" fluid alt="資訊實驗室")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 資訊實驗室
                        p.text-muted.small.mb-2 創新功能與測試區域
                      .action-indicator.text-primary.small.font-weight-bold
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

              //- 6. 系統管理選單 (管理者權限控制)
              b-col(cols="12" sm="6" xl="4" v-if="authority.isAdmin").mb-4
                nuxt-link(to="/admin").text-decoration-none
                  b-card.system-card.h-100.text-center.border-0.shadow-sm.overflow-hidden(no-body)
                    .card-accent.accent-admin
                    b-card-body.d-flex.flex-column.align-items-center.justify-content-between.p-3.p-xl-4
                      .badge-tag.mb-2
                        b-badge(variant="danger" pill class="px-2 py-1")
                          lah-fa-icon(icon="shield-halved" size="xs").mr-1
                          span 管理者專區
                      .img-container.mb-3
                        b-img(src="~/assets/img/ADMIN.jpg" fluid alt="系統管理選單")
                      .card-content.w-100
                        h4.font-weight-bold.text-dark.mb-1 系統管理選單
                        p.text-muted.small.mb-2 後台管理與系統設定
                      .action-indicator.text-danger.small.font-weight-bold
                        span 進入工具
                        lah-fa-icon(icon="arrow-right" size="xs").ml-1.action-arrow

          //- 右側：最新即時通公告
          b-col.h-100(
            cols="12"
            md="4"
            v-if="displayAnnouncement"
          )
            b-card.h-100.border-0.shadow-sm.announcement-card.overflow-hidden(no-body)
              b-card-header.bg-white.border-bottom.py-3.px-3.flex-shrink-0
                .d-flex.align-items-center.justify-content-between
                  .d-flex.align-items-center.text-primary
                    lah-fa-icon(icon="bullhorn" size="lg").mr-2
                    h5.m-0.font-weight-bold.text-dark 最新即時通公告
                  b-badge(variant="primary" pill class="px-2 py-1")
                    lah-fa-icon(icon="bolt" size="xs").mr-1
                    span 即時更新

              b-card-body.p-0.d-flex.flex-column.overflow-auto.flex-grow-1.custom-scrollbar(style="min-height: 0")
                lah-timeline-announcement.px-3.py-2(
                  open-first
                  no-border
                  :init-count="10"
                  :load-count="5"
                  :load-button="false"
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
    office () { return this.site },
    userDisplayName () {
      if (this.myid && this.myname) {
        return `${this.myname} (${this.myid})`
      }
      return this.myname || this.myid || '訪客'
    }
  },
  methods: {
    handleAnnouncementEvent (payload) {
      if (payload && payload.count && payload.count > 0) {
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
  min-height: 310px;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 1rem 2.5rem rgba(0, 0, 0, 0.12) !important;
    background-color: #ffffff;

    .img-container img {
      transform: scale(1.08);
    }

    .action-arrow {
      transform: translateX(4px);
    }
  }

  .card-accent {
    height: 4px;
    width: 100%;

    &.accent-inf { background: linear-gradient(90deg, #0dcaf0, #0aa2c0); }
    &.accent-reg { background: linear-gradient(90deg, #198754, #146c43); }
    &.accent-val { background: linear-gradient(90deg, #fd7e14, #e36209); }
    &.accent-sur { background: linear-gradient(90deg, #6f42c1, #59359a); }
    &.accent-lab { background: linear-gradient(90deg, #0d6efd, #0b5ed7); }
    &.accent-admin { background: linear-gradient(90deg, #dc3545, #b02a37); }
  }

  .img-container {
    width: 100%;
    height: 125px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 10px;
    background-color: #f8f9fa;

    img {
      max-height: 100%;
      width: auto;
      max-width: 100%;
      object-fit: contain;
      transition: transform 0.35s ease;
    }
  }

  .action-arrow {
    transition: transform 0.25s ease;
  }

  h4 {
    font-size: 1.45rem;
  }
}

.announcement-card {
  border-radius: 16px !important;
  max-height: calc(100vh - 130px);
  display: flex;
  flex-direction: column;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
  }
}

/* 讓連結文字沒有底線 */
a:hover {
  text-decoration: none;
}
</style>
