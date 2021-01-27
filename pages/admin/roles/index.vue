<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者角色管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        本系統使用IP位址來管理使用者角色，請利用本頁面之介面進行操作
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak class="center">
      {{result}}
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '使用者角色管理-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
  data: () => ({
    result: '未查詢'
  }),
  fetchOnServer: true,
  async fetch () {
    const { data } = await this.$axios.post('/api/user_json_api.php', {
      type: 'all_role_list'
    })
    this.result = data
  },
  created () {
  }
}
</script>

<style lang="scss" scoped>
</style>
