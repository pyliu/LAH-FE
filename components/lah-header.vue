<template>
  <div>
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      class="bars-button"
      variant="light"
      title="開啟選單"
      v-b-toggle.lah-sidebar
    />
    <lah-button
      icon="home"
      size="lg"
      action="ld-breath"
      class="home-button"
      variant="light"
      title="回到首頁"
      to="/"
    />
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
@mixin fix() {
  position: fixed;
  width: 3.5rem;
  border: 1px solid gray;
  border-radius: 10px;
  z-index: 1030;
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
