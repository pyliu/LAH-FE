<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">系統參數管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div></div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <lah-button icon="exclamation-circle" variant="danger"></lah-button>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <lah-button
        icon="edit"
        reqular
        block
        @click="update"
        size="lg"
        action="swing"
      >
        更新
      </lah-button>
      <hr/>
      <b-card-group deck>
        <b-card no-body class="border-0 small">
          <b-list-group flush>
            <b-list-group-item v-for="(item, idx) in configLeft" :key="idx">
              <label :for="`input-L-${idx}`" class="font-weight-bold">{{item.key}}</label>
              <b-input :id="`input-L-${idx}`" v-model="configLeft[idx]['value']" trim />
              <!-- <b-form-text :id="`input-L-${idx}-help`">{{configLeft[idx]['key']}}</b-form-text> -->
            </b-list-group-item>
          </b-list-group>
        </b-card>
        <b-card no-body class="border-0 small">
          <b-list-group flush>
            <b-list-group-item v-for="(item, idx) in configRight" :key="idx">
              <label :for="`input-R-${idx}`" class="font-weight-bold">{{item.key}}</label>
              <b-input :id="`input-R-${idx}`" v-model="configRight[idx]['value']" trim />
              <!-- <b-form-text :id="`input-R-${idx}-help`">{{configRight[idx]['key']}}</b-form-text> -->
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </b-card-group>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '系統設定管理-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
  fetchOnServer: true,
  data: () => ({
    configLeft: [],
    configRight: [],
    message: ''
  }),
  computed: {
    configs () {
      return this.configLeft.concat(this.configRight)
    }
  },
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    let insertLeft = true
    data.raw.forEach((item, idx, array) => {
      if (!item['key'].match(/^MS/i) && !item['key'].match(/^.*L.{1}HWEB.*$/i)) {
        if (insertLeft) {
          this.configLeft.push(item)
        } else {
          this.configRight.push(item)
        }
        insertLeft = !insertLeft
      }
    })
    this.message = data.message
  },
  methods: {
    update () {
      this.confirm('確定要更新設定值？')
      .then((answer) => {
        if (answer) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'update_configs',
            configs: this.configs
          }).then(({ data }) => {
            const notifyOpts = { type: 'warning' }
            if (this.$utils.statusCheck(data.status)) {
              notifyOpts.type = 'success'
            }
            this.notify(data.message, notifyOpts)
          }).catch((error) => {
            this.$utils.error(error)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.list-group-item:hover {
  background-color: rgb(37, 233, 125)
}
</style>
