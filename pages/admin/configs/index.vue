<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">系統參數管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <div>
            <lah-button
              icon="edit"
              reqular
              @click="update"
              size="lg"
              action="swing"
              title="更新全部設定"
              no-icon-gutter
            />
          </div>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <h5 class="d-flex">
          請按 
          <lah-button
            icon="edit"
            reqular
            action="swing"
            class="mt-n1 mx-1"
            no-icon-gutter
          />
          更新系統設定值
        </h5>
      </lah-help-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group deck>
        <b-card>
          <template #header>
            <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="database">地政WEB資料庫連線設定 - {{site}}</lah-fa-icon></h6>
          </template>
          <b-input-group size="sm" prepend="登入帳密">
            <b-input
              placeholder="MOICAS"
              v-model="configs['ORA_DB_USER']"
              title="登入DB帳號"
              class="mr-1"
              trim
            />
            /
            <b-input
              type="password"
              v-model="configs['ORA_DB_PASS']"
              title="登入DB密碼"
              class="ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_USER: configs['ORA_DB_USER'], ORA_DB_PASS: configs['ORA_DB_PASS']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="主要ＤＢ" class="my-1">
            <b-input
              placeholder="220.1.35.2"
              v-model="configs['ORA_DB_HXWEB_IP']"
              title="主資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_HXWEB_PORT']"
              title="主資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_HXWEB_IP: configs['ORA_DB_HXWEB_IP'], ORA_DB_HXWEB_PORT: configs['ORA_DB_HXWEB_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="備份ＤＢ" class="my-1">
            <b-input
              placeholder="220.1.35.102"
              v-model="configs['ORA_DB_BACKUP_IP']"
              title="備份資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_BACKUP_PORT']"
              title="備份資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_BACKUP_IP: configs['ORA_DB_BACKUP_IP'], ORA_DB_BACKUP_PORT: configs['ORA_DB_BACKUP_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="測試ＤＢ" class="my-1">
            <b-input
              placeholder="192.168.27.2"
              v-model="configs['ORA_DB_HXT_IP']"
              title="測試資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_HXT_PORT']"
              title="測試資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_HXT_IP: configs['ORA_DB_HXT_IP'], ORA_DB_HXT_PORT: configs['ORA_DB_HXT_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
        </b-card>
        <b-card>
          <template #header>
            <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="server">同步異動資料庫連線設定</lah-fa-icon></h6>
          </template>
          <b-input-group size="sm" prepend="登入帳密">
            <b-input
              placeholder=""
              title="登入DB帳號"
              class="mr-1"
              trim
              disabled
            />
            /
            <b-input
              placeholder=""
              type="password"
              title="登入DB密碼"
              class="ml-1"
              trim
              disabled
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                no-icon-gutter
                disabled
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ１ＤＢ" class="my-1">
            <b-input
              placeholder="220.1.33.2"
              v-model="configs['ORA_DB_L1HWEB_IP']"
              title="L1HWEB 資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_L1HWEB_PORT']"
              title="L1HWEB 資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_L1HWEB_IP: configs['ORA_DB_L1HWEB_IP'], ORA_DB_L1HWEB_PORT: configs['ORA_DB_L1HWEB_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ２ＤＢ" class="my-1">
            <b-input
              placeholder="220.1.33.3"
              v-model="configs['ORA_DB_L2HWEB_IP']"
              title="L2HWEB 資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_L2HWEB_PORT']"
              title="L2HWEB 資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_L2HWEB_IP: configs['ORA_DB_L2HWEB_IP'], ORA_DB_L2HWEB_PORT: configs['ORA_DB_L2HWEB_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ３ＤＢ" class="my-1">
            <b-input
              placeholder="220.1.33.5"
              v-model="configs['ORA_DB_L3HWEB_IP']"
              title="L3HWEB 資料庫IP"
              class="col-8 mr-1"
              trim
            />
            :
            <b-input
              placeholder="1521"
              v-model="configs['ORA_DB_L3HWEB_PORT']"
              title="L3HWEB 資料庫PORT"
              class="col-2 ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({ORA_DB_L3HWEB_IP: configs['ORA_DB_L3HWEB_IP'], ORA_DB_L3HWEB_PORT: configs['ORA_DB_L3HWEB_PORT']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
        </b-card>
      </b-card-group>
      <b-card-group deck class="my-3">
        <b-card>
          <template #header>
            <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="toggle-off" size="lg">系統開關設定</lah-fa-icon></h6>
          </template>
          <b-checkbox v-model="configs['ENABLE_MOCK_MODE']" switch @change="quick({ENABLE_MOCK_MODE: configs['ENABLE_MOCK_MODE']})">啟用開發模擬模式</b-checkbox>
          <b-checkbox v-model="configs['ENABLE_MSSQL_CONN']" switch @change="quick({ENABLE_MSSQL_CONN: configs['ENABLE_MSSQL_CONN']})">啟用MSSQL外部資料庫</b-checkbox>
          <b-checkbox v-model="configs['ENABLE_OFFICE_HOURS']" switch @change="quick({ENABLE_OFFICE_HOURS: configs['ENABLE_OFFICE_HOURS']})">啟用辦公時間限制</b-checkbox>
        </b-card>
        <b-card>
          <template #header>
            <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="feather-alt">其他設定</lah-fa-icon></h6>
          </template>
          <b-input-group size="sm" prepend="本所代碼" class="my-1">
            <b-input
              placeholder="HB"
              title="本所代碼"
              v-model="configs['SITE']"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({SITE: configs['SITE']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="本所統編" class="my-1">
            <b-input
              placeholder="45000808"
              title="本所的統一編號"
              v-model="configs['SITE_ID']"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({SITE: configs['SITE_ID']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="跨所ＡＰ" class="my-1">
            <b-input
              placeholder="220.1.35.123"
              title="任一個地政WEB版伺服器IP"
              v-model="configs['WEBAP_IP']"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({SITE: configs['WEBAP_IP']})"
                no-icon-gutter
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="查詢金鑰" class="my-1">
            <b-input
              placeholder="MD5雜湊值"
              title="API KEY MD5 HASH"
              v-model="configs['API_KEY']"
              trim
              disabled
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({SITE: configs['API_KEY']})"
                no-icon-gutter
                disabled
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="照片路徑" class="my-1">
            <b-input
              placeholder="內網擷取使用者圖片路徑"
              title="內網擷取使用者圖片路徑"
              v-model="configs['USER_PHOTO_FOLDER']"
              trim
              disabled
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                @click="quick({SITE: configs['USER_PHOTO_FOLDER']})"
                no-icon-gutter
                disabled
              />
            </template>
          </b-input-group>
        </b-card>
      </b-card-group>
      <hr/>
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
    configs: {},
    message: ''
  }),
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    // Object.assign makes var reactively
    this.configs = Object.assign(this.configs, data.raw)
    this.message = data.message
  },
  methods: {
    update () {
      this.confirm('確定要更新「所有」設定值？')
      .then((answer) => {
        if (answer) {
          this.isBusy = true
          this.quick(this.configs)
        }
      })
    },
    quick (configs) {
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'update_configs',
        configs: configs
      }).then(({ data }) => {
        const notifyOpts = { type: 'warning', subtitle: `${Object.keys(configs).length} 筆更新` }
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
  }
}
</script>

<style lang="scss" scoped>
.list-group-item:hover {
  background-color: rgb(37, 233, 125)
}
</style>
