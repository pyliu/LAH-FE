<template lang="pug">
.h-100
  lah-header
    .d-flex.my-auto 桃園市地政管家-主選單
  .container: lah-transition(appear, speed="fast")
    .vh-full(v-if="isInf || authority.isAdmin")
      .d-flex.mb-3
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/inf")
          lah-logo-monitoring.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧監控系統
        b-card.fixed-card-wh-inf.ml-3.center: nuxt-link(to="/reg")
          lah-logo.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管系統
      .d-flex
        b-card.fixed-card-wh-inf.mr-3.center: nuxt-link(to="/prc")
          lah-logo-val.h-75.w-100
          h4.lah-shadow.center.mt-2 地價小幫手
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/sur")
          lah-logo-sur.h-75.w-100
          h4.lah-shadow.center.mt-2 測量小幫手
    .vh-full.center(v-else)
      .d-flex.mb-3
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/reg")
          lah-logo.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管系統
        b-card.fixed-card-wh-inf.center.ml-3: nuxt-link(to="/lab")
          lah-logo-lab.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管實驗室
      .d-flex
        b-card.fixed-card-wh-inf.mr-3.center: nuxt-link(to="/prc")
          lah-logo-val.h-75.w-100
          h4.lah-shadow.center.mt-2 地價小幫手
        b-card.fixed-card-wh-inf.center: nuxt-link(to="/sur")
          lah-logo-sur.h-75.w-100
          h4.lah-shadow.center.mt-2 測量小幫手
  .version v{{ $config.pkgVersion }}
</template>

<script>
export default {
  head: {
    title: '桃園市地政總管家系統'
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
  width: 30vw;
  &:hover {
    @include hover-style(5px);
  }
}

.fixed-card-wh-inf {
  @extend .fixed-card-wh;
  width: 45vw;
}

.vh-full {
  height: calc(100vh - 100px);
}
.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
