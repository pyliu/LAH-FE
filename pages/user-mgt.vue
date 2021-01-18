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
                    亦可利用下方 <lah-button icon="search" variant="outline-primary" class="mx-1 mt-n1" no-icon-gutter /> 方式編輯或新增。
                  </div>
                </li>
              </ul>
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
      <hr class="my-5" />
        <b-form-group label="搜尋" label-for="input-keyword" label-cols-sm="2" label-size="lg">
          <b-input-group id="input-keyword" size="lg">
            <b-form-input
              v-model="keyword"
              type="text"
            />
            <template #append>
              <lah-button icon="search" variant="outline-primary" @click="search" title="搜尋"/>
            </template>
          </b-input-group>
        </b-form-group>
        <section>
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
    users: []
  }),
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
        type: 'all_users'
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
    search () {

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
