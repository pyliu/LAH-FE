<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者資訊管理</div>
            <lah-button
              icon="question"
              variant="outline-success"
              no-border
              no-icon-gutter
              @click="$bvModal.show('help-modal')"
              title="說明"
            />
            <lah-help-modal :modal-id="'help-modal'" size="lg">
              <ul>
                <li>
                  <div class="d-inline-flex justify-content-around">
                    選取編輯好的XLSX檔案，點擊 <lah-button icon="upload" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 上傳更新本地資料庫(dimension.db, user表格)
                  </div>
                </li>
                <li>
                  <div class="d-inline-flex justify-content-around">
                    亦可利用下方 <lah-button icon="user-plus" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 新增或其他按鍵編輯使用者。
                  </div>
                </li>
              </ul>
              <hr/>
              <div class="mx-2 my-1"><b-button variant="outline-success" size="sm">{{site}}XXXX 我ＯＯ</b-button> 在職使用者</div>
              <div class="mx-2 my-1"><b-button variant="secondary" size="sm">{{site}}XXXX 不ＯＯ</b-button> 離職使用者</div>
              <div class="mx-2 my-1"><b-button variant="danger" size="sm">{{site}}XXXX 要ＯＯ</b-button> 超級管理者</div>
              <div class="mx-2 my-1"><b-button variant="outline-danger" size="sm">{{site}}XXXX 豬ＯＯ</b-button> 系統管理者</div>
              <div class="mx-2 my-1"><b-button variant="primary" size="sm">{{site}}XXXX 羊ＯＯ</b-button> 主管</div>
              <div class="mx-2 my-1"><b-button variant="warning" size="sm">{{site}}XXXX 變ＯＯ</b-button> 研考</div>
              <div class="mx-2 my-1"><b-button variant="info" size="sm">{{site}}XXXX 色ＯＯ</b-button> 總務</div>
            </lah-help-modal>
          </div>
          <div></div>
        </div>
      </lah-transition>
    </lah-header>

    <section>
      <hr/>
      <h5 class="font-weight-bold text-right">
        <lah-fa-icon icon="exclamation-circle" variant="warning" action="breath">
          重複資料會被更新，<b-link href="/xlsx/user_import.tpl.xlsx" target="_blank">範例檔點此下載</b-link>
        </lah-fa-icon>
      </h5>
      <div>
        <b-form-group label="匯入使用者檔案" label-for="file-land_data_upload" label-cols-sm="2" label-size="md" title="*.xlsx">
          <b-input-group id="file-land_data_upload" size="md">
            <b-file ref="file-land_data_upload" v-model="userXlsx" placeholder="請選擇XLSX檔案" drop-placeholder="放開以設定上傳檔案" accept=".xlsx, .XLSX">
              <template slot="file-name" slot-scope="{ names }">
                <b-badge variant="dark">{{ names[0] }}</b-badge>
                <b-badge v-if="names.length > 1" variant="dark" class="ml-1">
                  + {{ names.length - 1 }} More files
                </b-badge>
              </template>
            </b-file>
            <template #append>
              <lah-button icon="upload" variant="outline-primary" @click="upload" title="上傳" :disabled="$utils.empty(userXlsx)"/>
            </template>
          </b-input-group>
        </b-form-group>
      </div>
      <hr class="mt-4" />
      <div class="d-flex justify-content-between mb-2">
        <lah-button icon="user-plus" variant="outline-primary" @click="add">新增使用者</lah-button>
        <span class="text-muted">找到 {{users.length}} 個使用者</span>
        <b-form-checkbox-group
          v-model="filter"
          :options="filterOptions"
        />
      </div>
      <section v-if="found">
        <b-button
          v-for="user in users"
          :key="user['id']"
          :data-id="user['id']"
          :data-name="user['name']"
          size="sm"
          class="mx-1 my-1"
          @click="edit(user)"
          :variant="variant(user)"
          v-b-popover.hover.top.html="role(user)"
        >
          {{user['id'].padStart(6, '&ensp')}}
          {{user['name'].padEnd(3, '　')}}
        </b-button>
      </section>
      <hr class="my-5" />
    </section>
  </div>
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
import lahUserEditCard from '~/components/lah-user-edit-card.vue'
import lahUserAddCard from '~/components/lah-user-add-card.vue'
export default {
  head: {
    title: "使用者資訊管理-桃園市地政局",
  },
  fetchOnServer: false,
  components: { lahUserCard, lahUserEditCard, lahUserAddCard },
  data: () => ({
    userXlsx: null,
    uploadPercentage: 0,
    responseData: undefined,
    keyword: '',
    users: [],
    filter: ['on'],
    filterOptions: [
      { text: '在職', value: 'on' },
      { text: '離職', value: 'off' }
    ]
  }),
  computed: {
    type () {
      if (this.filter.length === 2) return 'all_users'
      if (this.filter.includes('on')) return 'on_board_users'
      if (this.filter.includes('off')) return 'off_board_users'
      return ''
    },
    found () {
      return this.users.length > 0
    },
    site () {
      if (this.svr) {
        return this.svr.config.site
      }
      return 'HB'
    }
  },
  watch: {
    type (val) {
      if (val === '') {
        this.users = []
      } else {
        this.$fetch()
      }
    }
  },
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: this.type
    }).then(res => {
      if (this.$utils.statusCheck(res.data.status)) {
        this.users = res.data.raw
      } else {
        this.notify(res.data.message, { type: 'warning' })
      }
    }).catch(err => {
      this.$utils.error(err)
    }).finally(() => {
        this.isBusy = false
    })
  },
  methods: {
    upload () {
      if (this.$utils.empty(this.userXlsx)) {
        this.alert("請先選擇一個符合格式的XLSX檔")
      } else {
        this.$utils.log(this.userXlsx)
        this.isBusy = true
        this.uploadPercentage = 0
        let formData = new FormData()
        formData.append("file", this.userXlsx)
        this.$axios.post("api/import_user_xlsx.php", formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then((res) => {
          this.responseData = res.data
          this.$utils.log(this.responseData)
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.uploadPercentage = 0
        })
      }
    },
    add () {
      this.modal(this.$createElement('lah-user-add-card', {
        on: {
          added: (event) => {
            this.added(event.detail)
          }
        }
      }), {
        title: `新增使用者`,
        size: 'lg'
      })
    },
    added (userData) {
      this.users.unshift(userData)
    },
    update (userData) {
      // update the cached user data
      let foundIdx = undefined
      const user = this.users.find((item, idx, array) => {
        if (item['id'] === userData['id']) {
          foundIdx = idx
        }
        return item['id'] === userData['id']
      })
      if (foundIdx !== undefined) {
        this.users[foundIdx] = Object.assign(user, userData)
      }
    },
    edit (user) {
      this.modal(this.$createElement('lah-user-edit-card', {
        props: { raw: [user] },
        on: {
          saved: (event) => {
            this.update(event.detail)
          }
        }
      }), {
        title: `編輯 ${user['id']} ${user['name']} 資訊`,
        size: 'lg'
      })
    },
    variant (user) {
      if (!this.$utils.empty(user['offboard_date'])) return 'secondary'
      const auth = this.getAuthority(user)
      if (auth.isSuper) return 'danger'
      if (auth.isAdmin) return 'outline-danger'
      if (auth.isChief) return 'primary'
      if (auth.isRAE) return 'warning'
      if (auth.isGA) return 'info'
      return 'outline-success'
    },
    role (user) {
      if (!this.$utils.empty(user['offboard_date'])) return ''
      const auth = this.getAuthority(user)
      if (auth.isSuper) return '程式開發者'
      if (auth.isAdmin) return '系統管理者'
      if (auth.isChief) return '主管'
      if (auth.isRAE) return '研考'
      if (auth.isGA) return '總務'
      return ''
    },
    getAuthority (user) {
      const authorityMap = {
        isAdmin: false,
        isChief: false,
        isGA: false,
        isRAE: false,
        isSuper: false
      }
      if (this.svr && this.svr.config.ip_maps) {
        const mappings = this.svr.config.ip_maps
        const ip = user['ip']
        authorityMap.isAdmin = mappings.admin.includes(ip)
        authorityMap.isChief = mappings.chief.includes(ip)
        authorityMap.isSuper = mappings.super.includes(ip)
        authorityMap.isRAE = mappings.rae.includes(ip)
        authorityMap.isGA = mappings.ga.includes(ip)
      }
      return authorityMap
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
