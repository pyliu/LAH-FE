<template lang="pug">
.h-100
  lah-header
    lah-fa-icon.h1.my-auto(
      icon="people-roof"
    )
      span.ml-1 {{ office }} 地政事務所入口網
  lah-transition(appear, speed="fast"): .container.d-flex
    .vh-full.col-md-6
      .h1
        .mb-5(v-if="isInf || authority.isAdmin"): nuxt-link(to="/inf"): .d-flex.align-items-center
          b-img.brand.lah-shadow(src="~/assets/img/MONITOR.jpg")
          .lah-shadow.ml-4 資訊系統監控
        .mb-5: nuxt-link(to="/reg"): .d-flex.align-items-center
          b-img.brand.lah-shadow(src="~/assets/img/REG.jpg")
          .lah-shadow.ml-4 智慧控管系統
        .mb-5: nuxt-link(to="/prc"): .d-flex.align-items-center
          b-img.brand.lah-shadow(src="~/assets/img/VAL.jpg")
          .lah-shadow.ml-4 地價小幫手
        .mb-5: nuxt-link(to="/sur"): .d-flex.align-items-center
          b-img.brand.lah-shadow(src="~/assets/img/SUR.jpg")
          .lah-shadow.ml-4 測量小幫手
        .mb-5: nuxt-link(to="/lab"): .d-flex.align-items-center
          b-img.brand.lah-shadow(src="~/assets/img/INF.jpg")
          .lah-shadow.ml-4 資訊實驗室

    .vh-full.col-md-6(v-if="displayAnnouncement")
      lah-fa-icon.h4(
        icon="bullhorn",
        style="text-decoration: underline",
        variant="info"
      ) 最新即時通公告
      lah-timeline-announcement.timeline-height(
        open-first,
        no-border,
        :init-count="5",
        :load-count="3",
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

.timeline-height {
  height: calc(100vh - 200px) !important;
}

.brand {
  max-width: 256px;
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
