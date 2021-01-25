<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">管理主面版</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        請選擇下方功能區塊進行管理
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group deck class="vh-50">
        <lah-index-card-link :icon="['fas', 'users-cog']" to="/admin/user-mgt" no-body size="5x" icon-variant="primary" action="bounce">使用者管理</lah-index-card-link>
        <lah-index-card-link :icon="['fas', 'network-wired']" to="/admin/authority-mgt" no-body size="5x" icon-variant="info" action="jelly">IP權限管理</lah-index-card-link>
        <lah-index-card-link :icon="['fab', 'chrome']" to="/" no-body size="5x" icon-variant="warning" action="spin-fast">...</lah-index-card-link>
      </b-card-group>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '管理主面版-桃園市地政局'
  },
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
.vh-50 {
  height: 50vh;
  margin-top: 20vh;
  .card:hover {
    background-color: rgb(228, 222, 222)
  }
}
</style>
