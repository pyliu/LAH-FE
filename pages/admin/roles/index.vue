<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">IP權限管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <lah-button icon="exclamation-circle" variant="danger"></lah-button>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak class="center">
      {{result}}
    </b-container>
  </div>
</template>

<script>
import axios from "axios"
export default {
  head: {
    title: 'IP權限管理-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
  data: () => ({
    result: '未查詢'
  }),
  fetchOnServer: true,
  async fetch () {
    const { data } = await axios.post('https://www.thef2e.com/api/isSignUp', {
      "email": "hexscholl@test.com"
    })
    this.result = data
		// return { result: data }
    // return axios.post('https://www.thef2e.com/api/isSignUp', {
    //         "email": "hexscholl@test.com"
    //     }).then(({ data }) => ({
    //         result: data
    //     }))
  }
}
</script>

<style lang="scss" scoped>
</style>
