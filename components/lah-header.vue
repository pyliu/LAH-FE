<template lang="pug">
  h3.d-flex.justify-content-between.py-3
    lah-button.bars-button.mr-1(
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      variant="outline-dark"
      title="開啟選單"
      no-icon-gutter
      v-b-toggle.lah-sidebar
    )
    client-only: slot
    lah-transition: lah-button.home-button.ml-1(
      v-if="$route.path !== '/'"
      icon="home"
      size="lg"
      action="ld-breath"
      variant="outline-dark"
      title="回到首頁"
      to="/"
      no-icon-gutter
    )
    lah-sidebar
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@mixin common() {
  width: 3.4rem;
  border-radius: 10px;
  z-index: 1030;
  // border: 1px solid gray;
}

.bars-button {
  @include common();
}

.home-button {
  @include common();
}
</style>
