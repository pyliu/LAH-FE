<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">標題區域</div>
            <lah-button icon="question" variant="outline-success" no-border @click="$bvModal.show('help-modal')"/>
            <lah-help-modal :modal-id="'help-modal'" size="xl">
              <lah-button icon="exclamation-circle" variant="danger"></lah-button>
            </lah-help-modal>
          </div>
          <div>右側選單區域</div>
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
