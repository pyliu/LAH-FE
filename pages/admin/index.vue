<template lang="pug">
  div(v-cloak)
    lah-header
      lah-transition(appear)
        div(class="d-flex justify-content-between w-100")
          div(class="d-flex")
            div(class="my-auto") 管理主面版
            lah-button(icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
          div
      lah-help-modal(:modal-id="'help-modal'" size="md")
        |請選擇下方功能區塊進行管理
        hr
        b-card-group(deck)
          lah-index-card-link(:icon="['fas', 'users-cog']" to="/admin/users" no-body size="2x" icon-variant="primary" action="rubber-h" class="pt-2") 使用者資訊管理
          lah-index-card-link(:icon="['fas', 'user-tag']" to="/admin/roles" no-body size="2x" icon-variant="success" action="wander-h" class="pt-2") 使用者角色管理
          lah-index-card-link(:icon="['fas', 'tasks']" to="/admin/configs" no-body size="2x" icon-variant="danger" action="rubber-v" class="pt-2") 系統參數設定
        b-card-group(deck style="margin-top: 15px;")
          lah-index-card-link(:icon="['fas', 'tachometer-alt']" to="/admin/lxhweb" no-body size="2x" icon-variant="info" action="measure" class="pt-2") 系統參數設定
          b-card
          b-card
    b-container(fluid v-cloak)
      b-card-group(deck class="row")
        lah-index-card-link(:icon="['fas', 'users-cog']" to="/admin/users" no-body size="5x" icon-variant="primary" action="rubber-h") 使用者資訊管理
        lah-index-card-link(:icon="['fas', 'user-tag']" to="/admin/roles" no-body size="5x" icon-variant="success" action="wander-h") 使用者角色管理
        lah-index-card-link(:icon="['fas', 'tasks']" to="/admin/configs" no-body size="5x" icon-variant="danger" action="rubber-v") 系統參數設定
      b-card-group(deck class="row")
        lah-index-card-link(:icon="['fas', 'tachometer-alt']" to="/admin/lxhweb" no-body size="5x" icon-variant="info" action="measure") 同步異動監控
        lah-index-card-link(icon-variant="muted" action="damage" no-body size="5x" to="/stats") 統計看板
        lah-index-card-link(icon-variant="muted" action="damage" no-body size="5x" to="/playground") 測試
</template>

<script>
export default {
  head: {
    title: '管理主面版-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
  fetchOnServer: false
}
</script>

<style lang="scss" scoped>
.row {
  height: calc((100vh - 90px) / 2.5);
  margin-bottom: 30px;
  .card:hover {
    background-color: rgb(228, 222, 222)
  }
}
</style>
