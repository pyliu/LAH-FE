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
          lah-index-card-link(:icon="['fas', 'comment-dots']" icon-variant="warning" no-body size="2x" to="/notification" class="pt-2") 公告訊息發布管理
          lah-index-card-link(:icon="['fas', 'user-tag']" to="/admin/roles" no-body size="2x" icon-variant="success" action="wander-h" class="pt-2") IP角色管理
          lah-index-card-link(:icon="['fas', 'network-wired']" icon-variant="dark" action="breath" no-body size="2x" to="/admin/ip" class="pt-2") IP對應表管理
        b-card-group(deck style="margin-top: 15px;")
          lah-index-card-link(:icon="['fas', 'users-cog']" to="/admin/users" no-body size="2x" icon-variant="primary" action="rubber-h" class="pt-2") 使用者資訊管理
          lah-index-card-link(:icon="['fab', 'watchman-monitoring']" to="/admin/lxhweb" no-body size="2x" icon-variant="info" action="flip-h" class="pt-2") 同步異動監控
          lah-index-card-link(:icon="['fas', 'tasks']" to="/admin/configs" no-body size="2x" icon-variant="danger" action="rubber-v" class="pt-2") 系統參數設定
    b-container(fluid v-cloak)
      b-card-group(deck class="row")
        lah-index-card-link(:icon="['fas', 'comment-dots']" icon-variant="warning" no-body size="5x" to="/notification" action="pulse") 公告訊息發布管理
        lah-index-card-link(:icon="['fas', 'user-tag']" to="/admin/roles" no-body size="5x" icon-variant="success" action="wander-h") IP角色管理
        lah-index-card-link(:icon="['fas', 'network-wired']" icon-variant="dark" no-body size="5x" to="/admin/ip" action="breath") IP對應表管理
      b-card-group(deck class="row")
        lah-index-card-link(:icon="['fas', 'users-cog']" to="/admin/users" no-body size="5x" icon-variant="primary" action="rubber-h") 使用者資訊管理
        lah-index-card-link(:icon="['fab', 'watchman-monitoring']" to="/admin/lxhweb" no-body size="5x" icon-variant="info" action="flip-h") 同步異動監控
        lah-index-card-link(:icon="['fas', 'tasks']" to="/admin/configs" no-body size="5x" icon-variant="danger" action="rubber-v") 系統參數設定
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '管理主面版-桃園市地政局'
  },
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
