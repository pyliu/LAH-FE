<template>
  <h3 class="d-flex justify-content-between py-3">
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      variant="dark"
      title="開啟選單"
      class="bars-button mr-1"
      v-b-toggle.lah-sidebar
    />
    <slot></slot>
    <lah-transition>
      <lah-button
        v-if="$route.path !== '/'"
        icon="home"
        size="lg"
        action="ld-breath"
        variant="light"
        title="回到首頁"
        to="/"
        class="home-button ml-1"
      />
    </lah-transition>
    <lah-sidebar />
  </h3>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@mixin common() {
  width: 3.4rem;
  border-radius: 10px;
  z-index: 1030;
}

.bars-button {
  @include common();
}

.home-button {
  @include common();
  border: 1px solid gray;
}
</style>
