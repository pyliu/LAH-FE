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
  lah-transition: .d-flex
    lah-button.home-button.ml-1(
      v-if="showHome"
      :icon="icon"
      size="lg"
      action="ld-breath"
      :variant="variant"
      :title="title"
      to="/"
      no-icon-gutter
    )
  lah-sidebar-admin(v-if="authority.isAdmin")
  lah-sidebar(v-else)
</template>

<script>
export default {
  computed: {
    showHome () { return this.$route.path !== '/' },
    icon () { return this.systemConfigs.mock ? 'laptop-code' : 'house-chimney' },
    variant () { return this.systemConfigs.mock ? 'success' : 'outline-dark' },
    title () { return this.systemConfigs.mock ? '注意：系統處於模擬模式' : '回到地政事務所入口網' }
  }
}
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
