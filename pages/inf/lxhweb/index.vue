<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto
        .d-flex
          .my-auto
            | 同步異動資料庫監控
          lah-button(v-b-modal.help-modal icon="info" variant="outline-success" no-border no-icon-gutter title="說明")
        div
          lah-button(icon="sync-alt" action="ld-cycle" size="lg" :disabled="isBusy" :busy="isBusy" title="全部重新讀取" variant="outline-secondary" no-icon-gutter @click="reload")
    lah-help-modal(:modal-id="'help-modal'" size="md")
      h6.my-2
        i.fa.fa-circle.text-danger.fa-lg
          | 已超過半小時未更新
      h6.my-2
        i.fa.fa-circle.text-warning.fa-lg
          | 已超過15分鐘未更新
      h6.my-2
        i.fa.fa-circle.text-success.fa-lg
          | 15分鐘內更新
  b-container(v-cloak fluid)
    b-card-group.row(deck)
      lah-lxhweb-board(ref="lxhweb1" target-ip="L1HWEB")
        lah-lxhweb-board(ref="lxhweb2" target-ip="L2HWEB")
    b-card-group.row(deck)
      lah-lxhweb-board(ref="lxhweb3" target-ip="L1HWEB_Alt")
        lah-lxhweb-board(ref="lxhweb4" target-ip="L3HWEB")
</template>

<script>
export default {
  head: {
    title: '同步異動資料庫監控-桃園市地政局'
  },
  fetchOnServer: true,
  methods: {
    reload () {
      this.$refs.lxhweb1.ping()
      this.$refs.lxhweb2.ping()
      this.$refs.lxhweb3.ping()
      this.$refs.lxhweb4.ping()
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  height: 42.5vh !important;
}
.card-deck .card {
  margin: 5px;
}
</style>
