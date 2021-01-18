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
                    選取編輯好的XLSX檔案，點擊 <lah-button icon="upload" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 上傳更新本地資料庫(dimension.db)
                  </div>
                </li>
                <li>
                  <div class="d-inline-flex justify-content-around">
                    亦可利用下方 <lah-button icon="user-plus" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 新增或其他按鍵編輯使用者。
                  </div>
                </li>
              </ul>
              <hr/>
              <div class="h5">取消請示案件狀態說明：</div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="danger">有申請取消請示紀錄且<strong class="text-danger">已</strong>逾期案件</lah-fa-icon></div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="warning">有申請取消請示紀錄且於預訂結案日結案之案件</lah-fa-icon></div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="success">有申請取消請示紀錄且<strong>未</strong>逾期案件</lah-fa-icon></div>
            </lah-help-modal>
          </div>
          <div></div>
        </div>
      </lah-transition>
    </lah-header>

    <section>
      <hr/>
      <h4 class="font-weight-bold text-right">
        <lah-fa-icon icon="exclamation-circle" variant="warning" action="breath">
          重複資料會被更新，<b-link href="/xlsx/user_import.tpl.xlsx" target="_blank">範例檔點此下載</b-link>
        </lah-fa-icon>
      </h4>
      <div>
        <b-form-group label="匯入使用者檔案" label-for="file-land_data_upload" label-cols-sm="2" label-size="lg" title="*.xlsx">
          <b-input-group id="file-land_data_upload" size="lg">
            <b-form-file ref="file-land_data_upload" v-model="userXlsx" placeholder="請選擇XLSX檔案" drop-placeholder="放開以設定上傳檔案" accept=".xlsx, .XLSX"></b-form-file>
            <template #append>
              <lah-button icon="upload" variant="outline-primary" size="lg" @click="upload" title="上傳"/>
            </template>
          </b-input-group>
        </b-form-group>
      </div>
      <hr class="mt-5" />
      <div class="d-flex flex-row-reverse mb-2">
        <lah-button icon="user-plus" variant="outline-primary" @click="add">新增使用者</lah-button>
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
          @click="click(user)"
          :variant="variant(user)"
        >
          {{user['id']}}
          {{user['name']}}
        </b-button>
      </section>
      <hr class="my-5" />
    </section>
  </div>
</template>

<script>
export default {
  head: {
    title: "樣板頁面-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    userXlsx: null,
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
    });
  },
  methods: {
    upload () {
      
    },
    add () {

    },
    click (user) {
      this.$utils.log(user)
    },
    variant (user) {
      if (!this.$utils.empty(user['offboard_date'])) return 'secondary'
      const auth = this.getAuthority(user)
      if (auth.isSuper) return 'danger'
      if (auth.isAdmin) return 'outline-danger'
      if (auth.isChief) return 'outline-primary'
      if (auth.isRAE) return 'outline-info'
      if (auth.isGA) return 'outline-dark'
      return 'outline-success'
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
        authorityMap.isRA = mappings.ga.includes(ip)
      }
      return authorityMap
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
