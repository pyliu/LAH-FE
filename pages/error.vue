<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">發生錯誤</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'">
        <lah-button block icon="exclamation-circle" variant="danger"> 本頁面將顯示錯誤訊息</lah-button>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak class="main">
      <div class="text-center">
        <lah-fa-icon size="10x" icon="exclamation-circle" variant="danger" class="my-5"/>
        <h1 class="my-5">{{ lastMessage }}</h1>
        <b-link to="/" class="h4 font-weight-bold mt-3">回首頁</b-link>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '發生錯誤-桃園市地政局'
  },
  asyncData ({ store, redirect}) {
    if (store.getters.lastMessage === '') {
      redirect('/')
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
    height: 60vh;
}
</style>
