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
    <NuxtLink to="/">
      <lah-button
        icon="home"
        size="lg"
        class="home-button pr-1"
        variant="outline-dark"
        title="回到首頁"
      >
      </lah-button>
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

<style lang="scss">
.bars-button {
  position: fixed;
  left: 1rem;
  top: 10px;
  width: 3.5rem;
  background-color: white;
}

.home-button {
  @extend .bars-button;
  right: 1rem;
  left: initial;
  padding: 8px 4px 8px 12px;
}
</style>
