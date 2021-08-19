<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">
              使用者角色管理
            </div>
            <lah-button
              v-b-modal.help-modal
              icon="question"
              variant="outline-success"
              no-border
              no-icon-gutter
              title="說明"
            />
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              v-b-modal.add-authority-modal
              icon="user-plus"
              variant="outline-primary"
              title="新增使用者"
              no-icon-gutter
            />
          </b-button-group>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <h6>本系統使用「IP位址」來管理使用者角色權限，請利用本頁面之介面進行新增或刪除的動作。</h6>
        <hr>
        <div class="mx-2 my-1">
          <b-button variant="danger" size="sm">
            {{ site }}XXXX 劉ＯＯ
          </b-button>
          系統管理者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="outline-danger" size="sm">
            {{ site }}XXXX 邦ＯＯ
          </b-button>
          主管
        </div>
        <div class="mx-2 my-1">
          <b-button variant="primary" size="sm">
            {{ site }}XXXX 渝ＯＯ
          </b-button>
          研考
        </div>
        <div class="mx-2 my-1">
          <b-button variant="warning" size="sm">
            {{ site }}XXXX 桃ＯＯ
          </b-button>
          研考協辦
        </div>
        <div class="mx-2 my-1">
          <b-button variant="info" size="sm">
            {{ site }}XXXX 園ＯＯ
          </b-button>
          總務
        </div>
        <div class="mx-2 my-1">
          <b-button variant="outline-info" size="sm">
            {{ site }}XXXX 地ＯＯ
          </b-button>
          總務協辦
        </div>
        <div class="mx-2 my-1">
          <b-button variant="outline-dark" size="sm">
            {{ site }}XXXX 政ＯＯ
          </b-button>
          ...
        </div>
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
        <b-form-group
          label="權限"
          label-for="role-select"
          label-cols-sm="2"
          label-size="md"
        >
          <b-select
            id="role-select"
            v-model="addRole"
            :options="addRoleOpts"
            :state="roleOK"
          />
        </b-form-group>
        <b-form-group
          label="電腦"
          label-for="ip-input"
          label-cols-sm="2"
          label-size="md"
        >
          <b-input
            id="ip-input"
            v-model="addIp"
            :state="ipOK"
            trim
          />
        </b-form-group>
        <lah-button icon="user-plus" :disabled="!(roleOK && ipOK)" block @click="add">
          新增角色權限
        </lah-button>
      </b-modal>
    </lah-header>
    <b-container v-cloak fluid>
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
        :items="tableItems"
        :fields="tableFields"
        :busy="isBusy"
        sticky-header

        :style="`max-height: ${maxHeight}px`"
        primary-key="序號"

        @row-selected="popupUserInfo"
      >
        <template #table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <template #table-caption>
          <span class="lah-shadow">{{ message }} <b-badge variant="info" pill>{{ tableItems.length }}</b-badge></span>
        </template>
        <template #cell(序號)="data">
          <template v-if="data.rowSelected">
            <span aria-hidden="true">&check;</span>
            <span class="sr-only">Selected</span>
          </template>
          <template v-else>
            <span aria-hidden="true">&nbsp;</span>
            <span class="sr-only">Not selected</span>
          </template>
          {{ data.index + 1 }}
        </template>
        <template #cell(remove)="{ item }">
          <lah-button
            icon="times"
            variant="outline-danger"
            size="sm"
            no-icon-gutter
            no-border
            pill
            class="mx-auto"
            title="刪除本筆資料"
            @click="remove(item)"
          />
        </template>
        <template #cell(id)="{ item }">
          <b-button v-if="!$utils.empty(item['id'])" :variant="variant(item)" size="sm" @click="popupUserInfo(item)">
            <lah-avatar :user-data="item">
              {{ item["id"] }}
              {{ item["name"] }}
            </lah-avatar>
          </b-button>
        </template>
        <template #cell(role_ip)="{ item }">
          {{ item['role_ip'].split('.')[0] }}.{{ item['role_ip'].split('.')[1] }}.<span class="font-weight-bold text-primary">{{ item['role_ip'].split('.')[2] }}.{{ item['role_ip'].split('.')[3] }}</span>
        </template>
      </b-table>
      <hr>
    </b-container>
  </div>
</template>

<script>
export default {
  middleware: ['isAdmin'],
  data: () => ({
    tableItems: [],
    tableFields: [
      '序號', {
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
    message: '',
    addIp: '',
    addRole: '',
    addRoleOpts: [
      { text: '主管', value: 4 },
      { text: '研考', value: 5 },
      { text: '總務', value: 6 },
      { text: '人事', value: 7 },
      { text: '會計', value: 8 },
      { text: '系統管理者', value: 3 },
      { text: '超級管理者', value: 2 }
    ],
    maxHeight: 300
  }),
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'authority_list'
    })
    this.tableItems = data.raw
    this.message = data.message
  },
  head: {
    title: '使用者角色管理-桃園市地政局'
  },
  fetchOnServer: true,
  computed: {
    roleOK () {
      return this.addRole > 1
    },
    ipOK () {
      return this.$utils.isIPv4(this.addIp)
    },
    selectedRole () {
      const selected = this.addRoleOpts.find((item, idx, array) => { return item.value === this.addRole })
      return selected ? selected.text : ''
    }
  },
  mounted () {
    this.maxHeight = window.innerHeight - 115
  },
  methods: {
    add () {
      this.confirm(`請確認要新增 ${this.addIp} ${this.selectedRole} 權限？`)
        .then((answer) => {
          if (answer) {
          // click YES
            this.$axios.post(this.$consts.API.JSON.USER, {
              type: 'add_authority',
              role_id: this.addRole,
              ip: this.addIp
            }).then(({ data }) => {
              const opts = { type: 'warning' }
              if (this.$utils.statusCheck(data.status)) {
                opts.type = 'success'
                this.addRole = ''
                this.addIp = ''
                this.$fetch()
                // clear FE cache
                this.clearCache()
                // close modal
                this.hideModalById('add-authority-modal')
              }
              this.notify(data.message, opts)
            })
          }
        }).catch((err) => {
          this.$utils.error(err)
        })
    },
    remove (userData) {
      this.confirm(`請確認要刪除 ${userData.id || ''} ${userData.name || ''} ${userData.role_name} 權限？`)
        .then((answer) => {
          if (answer) {
          // click YES
            this.$axios.post(this.$consts.API.JSON.USER, {
              type: 'remove_authority',
              user: userData
            }).then(({ data }) => {
              const opts = { type: 'warning' }
              if (this.$utils.statusCheck(data.status)) {
                opts.type = 'success'
                // lodash remove method ... not reactively Orz
                this.tableItems = this.$utils.reject(this.tableItems, { role_id: userData.role_id, role_ip: userData.role_ip })
                // clear FE cache
                this.clearCache()
              }
              this.notify(data.message, opts)
            })
          }
        }).catch((err) => {
          this.$utils.error(err)
        })
    },
    variant (user) {
      if (user.role_name === '超級管理者') { return 'danger' }
      if (user.role_name === '主管') { return 'primary' }
      if (user.role_name === '研考') { return 'warning' }
      if (user.role_name === '總務') { return 'info' }
      if (user.role_name === '系統管理者') { return 'outline-danger' }
      if (user.role_name === '人事') { return 'outline-info' }
      if (user.role_name === '會計') { return 'outline-dark' }
      return 'outline-secondary'
    },
    popupUserInfo (data) {
      if (!this.$utils.empty(data)) {
        const obj = Array.isArray(data) ? data[0] : data
        this.modal(this.$createElement('lah-user-card', { props: { raw: [obj] } }), {
          title: `${obj.id} ${obj.name} 資訊`
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.b-table-select-single {
  background-color: rgb(93, 156, 228)
}
</style>
