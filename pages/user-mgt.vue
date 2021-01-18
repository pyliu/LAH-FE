<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者資訊管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter @click="$bvModal.show('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'" size="xl">
              <lah-fa-icon icon="exclamation-circle" variant="danger">使用者資訊管理頁面</lah-fa-icon>
            </lah-help-modal>
          </div>
          <div></div>
        </div>
      </lah-transition>
    </lah-header>
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
