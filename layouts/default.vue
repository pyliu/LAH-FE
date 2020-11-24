<template>
  <b-container v-cloak fluid>
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      class="bars-button"
      variant="success"
      title="開啟選單"
      v-b-toggle.lah-sidebar
    />
    <NuxtLink to="/">
      <lah-button
        icon="home"
        size="lg"
        action="ld-float"
        class="home-button"
        variant="success"
        title="回到首頁"
      />
    </NuxtLink>
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
