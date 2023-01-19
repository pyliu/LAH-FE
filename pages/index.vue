<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    .d-flex.mb-3
      b-card.fixed-card-wh.mr-3.center: nuxt-link(to="/reg")
        lah-logo.h-75.w-100
        h4.lah-shadow.center.mt-2 智慧控管系統
      b-card.fixed-card-wh.center: nuxt-link(to="/inf")
        lah-logo-monitoring.h-75.w-100
        h4.lah-shadow.center.mt-2 智慧監控系統
    .d-flex
      b-card.fixed-card-wh.mr-3.center: nuxt-link(to="/prc")
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
    title: '桃園市地政智慧控管系統'
  }
}
</script>

<style lang="scss" scoped>
.fixed-card-wh {
  height: 40vh;
  width: 45vw;
  &:hover {
    background-color: aquamarine;
  }
}

.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
