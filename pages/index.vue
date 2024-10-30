<template lang="pug">
.h-100
  lah-header
    .d-flex.my-auto 業務小幫手-主選單
  lah-transition(appear, speed="fast"): .mx-3.d-flex
    .vh-full
      .d-flex.mb-3(v-if="isInf || authority.isAdmin")
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/inf")
          lah-logo-monitoring.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧監控系統
        b-card.fixed-card-wh-inf.ml-3.center: nuxt-link(to="/reg")
          lah-logo.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管系統
      .d-flex.mb-3(v-else)
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/reg")
          lah-logo.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管系統
        b-card.fixed-card-wh-inf.center.ml-3: nuxt-link(to="/lab")
          lah-logo-lab.h-75.w-100
          h4.lah-shadow.center.mt-2 地政資訊實驗室
      .d-flex
        b-card.fixed-card-wh-inf.mr-3.center: nuxt-link(to="/prc")
          lah-logo-val.h-75.w-100
          h4.lah-shadow.center.mt-2 地價小幫手
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/sur")
          lah-logo-sur.h-75.w-100
          h4.lah-shadow.center.mt-2 測量小幫手
    .vh-full.col-md-4(v-if="displayAnnouncement")
      lah-timeline-announcement(
        load-button,
        :init-count="14",
        :load-count="3",
        @announcement-count="handleAnnouncementEvent($event)"
      )
</template>

<script>
export default {
  data: () => ({
    displayAnnouncement: true
  }),
  head: {
    title: '業務小幫手'
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
@mixin hover-style(
  $width: 1px,
  $style: dashed,
  $color: var(--green),
  $bg_color: var(--light)
) {
  background: {
    color: $bg_color;
  }
  border: {
    color: $color;
    width: $width;
    style: $style;
  }
}

.fixed-card-wh {
  height: 40vh;
  //width: 30vw;
  &:hover {
    @include hover-style(5px);
  }
}

.fixed-card-wh-inf {
  @extend .fixed-card-wh;
  //width: 45vw;
}

.vh-full {
  height: calc(100vh - 100px);
}
.version {
  font-size: .75rem;
  font-weight: 900;
  color: gray;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
