<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 管理主面版
          lah-button(icon="info" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明")
        div
    lah-help-modal(:modal-id="'help-modal'" size="md")
      | 請選擇各功能區塊進行管理
  b-container(fluid v-cloak)
    b-card-group.row(deck)
      lah-index-card-link(:icon="['fas', 'note-sticky']" icon-variant="success" no-body size="5x" to="/notification" action="metronome") 公告訊息發布管理
      lah-index-card-link(:icon="['fas', 'people-roof']" to="/admin/users" no-body size="5x" icon-variant="primary" action="rubber-h") 使用者資訊管理
      lah-index-card-link(:icon="['fas', 'network-wired']" icon-variant="dark" no-body size="5x" to="/admin/ip" action="jelly") IP對應名稱設定管理
    b-card-group.row(deck)
      lah-index-card-link(:icon="['fas', 'traffic-light']" to="/inf/dashboard" no-body size="5x" icon-variant="danger" action="breath") {{ site }} 智慧監控儀表板
      lah-index-card-link(:icon="['fas', 'database']" to="/inf/lxhweb" no-body size="5x" icon-variant="info" action="flip-h") 同步異動監控
      lah-index-card-link(:icon="['fas', 'server']" to="/inf/xap" no-body size="5x" icon-variant="warning" action="bounceAlt") 跨縣市AP監控
    b-card-group.row(deck)
      //- lah-index-card-link(:icon="['fas', 'person-chalkboard']" to="/legacy/dashboard.html" no-body size="5x" icon-variant="secondary") 系管面板
      lah-index-card-link(to="/" no-body size="5x" icon-variant="muted" action="damage" title="尚未設定") ...
      lah-index-card-link(to="/" no-body size="5x" icon-variant="muted" action="damage" title="尚未設定") ...
      lah-index-card-link(:icon="['fas', 'tasks']" to="/admin/configs" no-body size="5x" icon-variant="secondary" action="rubber-v") 系統參數設定
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
  height: calc((100vh - 90px) / 3.3);
  margin-bottom: 30px;
  .card:hover {
    background-color: rgb(228, 222, 222)
  }
}
</style>
