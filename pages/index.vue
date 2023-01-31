<template lang="pug">
.h-100
  lah-header
    .d-flex.my-auto 桃園市地政總管家-主選單
  .container: lah-transition(appear, speed="fast")
    .vh-full(v-if="isInf")
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
      .d-flex
        b-card.fixed-card-wh.center: nuxt-link(to="/reg")
          lah-logo.h-75.w-100
          h4.lah-shadow.center.mt-2 智慧控管系統
        b-card.fixed-card-wh.mx-3.center: nuxt-link(to="/prc")
          lah-logo-val.h-75.w-100
          h4.lah-shadow.center.mt-2 地價小幫手
        b-card.fixed-card-wh.center: nuxt-link(to="/sur")
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
$hover_background_color: rgb(216, 220, 218);
$hover_border_color: rgb(3, 125, 13);
@mixin hover-style {
  background-color: $hover_background_color;
  border: 5px dotted $hover_border_color;
}
.fixed-card-wh-inf {
  height: 40vh;
  width: 45vw;
  &:hover {
    @include hover-style;
  }
}
.fixed-card-wh {
  height: 40vh;
  width: 30vw;
  &:hover {
    @include hover-style;
  }
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
