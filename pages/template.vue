<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header">
        <div>
          <lah-fa-icon icon="question" variant="secondary" append class="my-auto">標題區域</lah-fa-icon>
        </div>
        <div class="d-flex">
          <div>右側選單區域</div>
        </div>
      </h3>
    </lah-transition>
    <div class="container">
      <div>
        <Logo class="anim-appear-2s" />
        <h3 class="title">
          樣板
        </h3>
        <div>
          some text goes here ...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: '樣板頁面-桃園市地政局'
  },
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
</style>
