<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100 my-auto">
          <div class="d-flex">
            <div>同步異動資料庫監控</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <h6 class="my-2"><i class="fa fa-circle text-danger fa-lg"></i> 已超過半小時未更新</h6>
        <h6 class="my-2"><i class="fa fa-circle text-warning fa-lg"></i> 已超過15分鐘未更新</h6>
        <h6 class="my-2"><i class="fa fa-circle text-success fa-lg"></i> 15分鐘內更新</h6>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group deck class="half-vp mb-4">
        <lah-lxhweb-board server="L1HWEB"/>
        <lah-lxhweb-board server="L2HWEB"/>
      </b-card-group>
      <b-card-group deck class="half-vp">
        <lah-lxhweb-board server="L1HWEB_Alt"/>
        <lah-lxhweb-board server="L3HWEB"/>
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
  fetchOnServer: true
}
</script>

<style lang="scss" scoped>
.half-vp {
    height: 42.5vh !important;
}
</style>
