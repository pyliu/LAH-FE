<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100 my-auto">
          <div class="d-flex">
            <div class="my-auto">同步異動資料庫監控</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div>
            <lah-button
              icon="sync-alt"
              action="ld-cycle"
              size="lg"
              @click="reload"
              :disabled="isBusy"
              :busy="isBusy"
              title="全部重新讀取"
              variant="outline-secondary"
              no-icon-gutter
            />
          </div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <h6 class="my-2"><i class="fa fa-circle text-danger fa-lg"></i> 已超過半小時未更新</h6>
        <h6 class="my-2"><i class="fa fa-circle text-warning fa-lg"></i> 已超過15分鐘未更新</h6>
        <h6 class="my-2"><i class="fa fa-circle text-success fa-lg"></i> 15分鐘內更新</h6>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group deck class="row">
        <lah-lxhweb-board ref="lxhweb1" target-ip="L1HWEB"/>
        <lah-lxhweb-board ref="lxhweb2" target-ip="L2HWEB"/>
      </b-card-group>
      <b-card-group deck class="row">
        <lah-lxhweb-board ref="lxhweb3" target-ip="L1HWEB_Alt"/>
        <lah-lxhweb-board ref="lxhweb4" target-ip="L3HWEB"/>
      </b-card-group>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '同步異動資料庫監控-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
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
