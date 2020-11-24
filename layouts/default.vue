<template>
  <b-container v-cloak fluid>
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      class="bars-button"
      variant="outline-dark"
      title="開啟選單"
      v-b-toggle.lah-sidebar
    />
    <lah-button
      icon="home"
      size="lg"
      action="ld-jump"
      class="home-button"
      variant="outline-dark"
      title="回到首頁"
    />
    <Nuxt />
    <lah-footer />
    <lah-sidebar />
  </b-container>
</template>

<script>
export default {
}
</script>

<style lang="scss" scoped>
@mixin fix() {
  position: fixed;
  width: 3.5rem;
  background-color: #EFEFEF;
}

.bars-button {
  @include fix();
  left: 1rem;
  top: 10px;
}

.home-button {
  @include fix();
  right: 1rem;
  top: 10px;
}
</style>
