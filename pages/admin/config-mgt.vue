<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">系統設定管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div>右側選單區域</div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <lah-button icon="exclamation-circle" variant="danger"></lah-button>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak class="center">
      <div>
        <h3 class="title">
          樣板
        </h3>
        <div>
          some text goes here ...
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '系統設定管理-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
</style>
