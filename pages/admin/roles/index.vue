<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者角色管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              icon="user-plus"
              variant="outline-primary"
              title="新增使用者"
              no-icon-gutter
              v-b-modal.add-authority-modal
            />
          </b-button-group>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <h6>本系統使用「IP位址」來管理使用者角色權限，請利用本頁面之介面進行新增或刪除的動作。</h6>
      </lah-help-modal>
      <b-modal
        id="add-authority-modal"
        hide-footer
        no-close-on-backdrop
        scrollable
      >
        <template #modal-title>
          新增角色權限
        </template>
        ...
      </b-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-table
        striped
        hover
        caption-top
        head-variant="dark"
        responsive="lg"
        small
        selectable
        select-mode="single"
        selected-variant="success"
        class="text-center mb-3"
        @row-selected="rowSelected"
        :items="items"
        :fields="fields"
      >
        <template #table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <template #table-caption>
          <span class="lah-shadow">{{message}} <b-badge variant="info" pill>{{items.length}}</b-badge></span>
        </template>
        <template #cell(remove)="{ item }">
          <lah-button @click="remove(item)" icon="times" variant="outline-danger" size="sm" no-icon-gutter no-border pill class="mx-auto" title="刪除本筆資料"/>
        </template>
        <template #cell(id)="{ item }">
          <b-button v-if="!$utils.empty(item['id'])" @click="popupUserInfo(item)" variant="outline-secondary" size="sm">
            <lah-avatar :user-data="item">
              {{ item["id"] }}
              {{ item["name"] }}
            </lah-avatar>
          </b-button>
        </template>
        <template #cell(role_ip)="{ item }">
          {{item['role_ip'].split('.')[0]}}.{{item['role_ip'].split('.')[1]}}.<span class="font-weight-bold text-primary">{{item['role_ip'].split('.')[2]}}.{{item['role_ip'].split('.')[3]}}</span>
        </template>
      </b-table>
      <hr/>
    </b-container>
  </div>
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
export default {
  head: {
    title: '使用者角色管理-桃園市地政局'
  },
  components: { lahUserCard },
  middleware: [ 'isAdmin' ],
  data: () => ({
    items: [],
    fields: [{
        key: 'remove',
        label: '移除'
      }, {
        key: 'role_ip',
        label: '電腦IP位址',
        sortable: true
      }, {
        key: 'id',
        label: '使用者',
        sortable: true
      }, {
        key: 'role_name',
        label: '權限',
        sortable: true
      }, {
        key: 'unit',
        label: '課室',
        sortable: true
      }, {
        key: 'title',
        label: '職稱',
        sortable: true
      }
    ],
    message: ''
  }),
  fetchOnServer: true,
  async fetch () {
    const { data } = await this.$axios.post('/api/user_json_api.php', {
      type: 'authority_list'
    })
    this.items = data.raw
    this.message = data.message
  },
  watch: {
    items (val) {
      // this.$utils.log(val)
    }
  },
  methods: {
    rowSelected (row) {
      this.$utils.log(row)
    },
    add () {

    },
    remove (userData) {
      this.confirm(`請確認要刪除 ${userData['id']} ${userData['name']} ${userData['role_name']} 權限？`)
      .then((answer) => {
        if (answer) {
          // click YES
          this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'remove_authority',
            user: userData,
          }).then(({ data }) => {
            const opts = { type: 'warning' }
            if (this.$utils.statusCheck(data.status)) {
              opts.type = 'success'
              // lodash remove method ... not reactively Orz
              this.items = this.$utils.reject(this.items, { role_id: userData['role_id'], role_ip: userData['role_ip'] })
            }
            this.notify(data.message, opts)
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      })
    },
    popupUserInfo (data) {
      this.modal(this.$createElement('lah-user-card', { props: { raw: [data] } }), {
        title: `${data['id']} ${data['name']} 資訊`
      })
    }
  },
  created () {
  }
}
</script>

<style lang="scss" scoped>
.b-table-select-single {
  background-color: rgb(93, 156, 228)
}
</style>
