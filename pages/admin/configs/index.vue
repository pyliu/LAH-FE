<template>
  <div v-cloak class="width">
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">
              系統參數管理
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
              icon="edit"
              reqular
              size="lg"
              action="swing"
              title="更新全部設定"
              no-icon-gutter
              @click="update"
            />
            <lah-button
              v-b-modal.master-pw-modal
              icon="key"
              title="變更管理者登入密碼"
              variant="outline-danger"
              no-icon-gutter
            />
          </b-button-group>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <div class="d-inline-flex">
          ★ 按
          <lah-button
            icon="edit"
            reqular
            action="swing"
            class="mt-n1 mx-1"
            no-icon-gutter
            @click="update"
          />
          可一次更新所有系統設定值
        </div>
        <div class="d-inline-flex my-2">
          ★ 按
          <lah-button
            v-b-modal.master-pw-modal
            icon="key"
            variant="outline-danger"
            class="mt-n1 mx-1"
            no-icon-gutter
          />
          可進行管理者密碼更新
        </div>
        <div class="d-inline-flex">
          ★ 各細項修改後按
          <lah-button
            icon="pen-square"
            variant="outline-secondary"
            class="mt-n1 mx-1"
            no-icon-gutter
          />
          可進行個別設定更新
        </div>
      </lah-help-modal>
      <b-modal
        id="master-pw-modal"
        title="變更管理者登入密碼"
        hide-footer
      >
        <b-input-group size="lg">
          <b-input
            v-model="masterPassword"
            type="password"
            title="管理者登入密碼"
            trim
            @keyup.enter="changeMasterPassword"
          />
          <template #append>
            <lah-button
              icon="pen-square"
              variant="outline-danger"
              title="更新主密碼"
              :disabled="masterPasswordNotChanged"
              no-icon-gutter
              @click="changeMasterPassword"
            />
          </template>
        </b-input-group>
      </b-modal>
    </lah-header>
    <b-container v-cloak fluid>
      <b-card-group v-cloak :deck="!isMockModeEnabled" :columns="isMockModeEnabled">
        <b-card
          v-cloak
          v-if="!isMockModeEnabled"
          header-bg-variant="danger"
          header-text-variant="white"
          border-variant="danger"
        >
          <template #header>
            <h6 class="my-auto font-weight-bolder">
              <lah-fa-icon icon="database">
                地政WEB資料庫連線設定
              </lah-fa-icon>
            </h6>
          </template>
          <b-input-group size="sm" prepend="登入帳密">
            <b-input
              v-model="loadedConfigs['ORA_DB_USER']"
              placeholder="MOICAS"
              title="登入DB帳號"
              class="mr-1"
              trim
            />
            /
            <b-input
              v-model="loadedConfigs['ORA_DB_PASS']"
              type="password"
              title="登入DB密碼"
              class="ml-1"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                no-icon-gutter
                @click="quick({ORA_DB_USER: loadedConfigs['ORA_DB_USER'], ORA_DB_PASS: loadedConfigs['ORA_DB_PASS']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="主要ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_HXWEB_IP']"
              placeholder="220.1.35.2"
              title="主資料庫IP"
              class="mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_HXWEB_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_HXWEB_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="主資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_HXWEB_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_HXWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_HXWEB_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_HXWEB_IP: loadedConfigs['ORA_DB_HXWEB_IP'], ORA_DB_HXWEB_PORT: loadedConfigs['ORA_DB_HXWEB_PORT']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="備份ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_BACKUP_IP']"
              placeholder="220.1.35.102"
              title="備份資料庫IP"
              class="mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_BACKUP_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_BACKUP_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="備份資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_BACKUP_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_BACKUP_IP']) || numNotOK(loadedConfigs['ORA_DB_BACKUP_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_BACKUP_IP: loadedConfigs['ORA_DB_BACKUP_IP'], ORA_DB_BACKUP_PORT: loadedConfigs['ORA_DB_BACKUP_PORT']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="測試ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_HXT_IP']"
              placeholder="192.168.27.2"
              title="測試資料庫IP"
              class="mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_HXT_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_HXT_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="測試資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_HXT_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_HXT_IP']) || numNotOK(loadedConfigs['ORA_DB_HXT_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_HXT_IP: loadedConfigs['ORA_DB_HXT_IP'], ORA_DB_HXT_PORT: loadedConfigs['ORA_DB_HXT_PORT']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="ＤＢ指向" class="my-1 d-flex">
            <b-form-radio-group
              v-model="loadedConfigs['ORA_DB_TARGET']"
              :options="dbTargeteOpts"
              class="my-auto ml-2"
            />
          </b-input-group>
        </b-card>
        <b-card
          v-cloak
          v-if="!isMockModeEnabled"
          header-bg-variant="dark"
          header-text-variant="white"
          border-variant="dark"
        >
          <template #header>
            <h6 class="my-auto font-weight-bolder">
              <lah-fa-icon icon="server">
                同步異動資料庫連線設定
              </lah-fa-icon>
            </h6>
          </template>
          <b-input-group size="sm" prepend="輪詢間隔">
            <b-input
              v-model="loadedConfigs['PING_INTERVAL_SECONDS']"
              type="number"
              min="5"
              placeholder="300"
              title="PING間隔時間(秒)"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                no-icon-gutter
                @click="quick({PING_INTERVAL_SECONDS: loadedConfigs['PING_INTERVAL_SECONDS']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ１ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_L1HWEB_IP']"
              placeholder="220.1.33.2"
              title="L1HWEB 資料庫IP"
              class="mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_L1HWEB_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_L1HWEB_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="L1HWEB 資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_L1HWEB_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_L1HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L1HWEB_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_L1HWEB_IP: loadedConfigs['ORA_DB_L1HWEB_IP'], ORA_DB_L1HWEB_PORT: loadedConfigs['ORA_DB_L1HWEB_PORT']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ２ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_L2HWEB_IP']"
              placeholder="220.1.33.3"
              title="L2HWEB 資料庫IP"
              class=" mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_L2HWEB_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_L2HWEB_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="L2HWEB 資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_L2HWEB_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_L2HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L2HWEB_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_L2HWEB_IP: loadedConfigs['ORA_DB_L2HWEB_IP'], ORA_DB_L2HWEB_PORT: loadedConfigs['ORA_DB_L2HWEB_PORT']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="Ｌ３ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['ORA_DB_L3HWEB_IP']"
              placeholder="220.1.33.5"
              title="L3HWEB 資料庫IP"
              class="mr-1"
              :state="validateIp(loadedConfigs['ORA_DB_L3HWEB_IP'])"
              trim
            />
            :
            <b-input
              v-model="loadedConfigs['ORA_DB_L3HWEB_PORT']"
              type="number"
              min="1"
              max="65535"
              placeholder="1521"
              title="L3HWEB 資料庫PORT"
              class="col-3 ml-1"
              :state="validateNumber(loadedConfigs['ORA_DB_L3HWEB_PORT'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['ORA_DB_L3HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L3HWEB_PORT'])"
                no-icon-gutter
                @click="quick({ORA_DB_L3HWEB_IP: loadedConfigs['ORA_DB_L3HWEB_IP'], ORA_DB_L3HWEB_PORT: loadedConfigs['ORA_DB_L3HWEB_PORT']})"
              />
            </template>
          </b-input-group>
        </b-card>
        <b-card
          v-cloak
          v-if="!isMockModeEnabled"
          header-bg-variant="success"
          header-text-variant="white"
          border-variant="success"
        >
          <template #header>
            <h6 class="my-auto font-weight-bolder">
              <lah-fa-icon icon="feather-alt">
                其他設定
              </lah-fa-icon>
            </h6>
          </template>
          <b-input-group size="sm" prepend="本所代碼" class="my-1">
            <b-input
              v-model="loadedConfigs['SITE']"
              v-b-popover.hover.focus.top="site !== loadedConfigs['SITE'] ? `系統偵測到所別為: ${site} (${apiSvrIp})` : ''"
              :placeholder="site"
              :state="site === loadedConfigs['SITE']"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                no-icon-gutter
                @click="quick({SITE: loadedConfigs['SITE']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="本所統編" class="my-1">
            <b-input
              v-model="loadedConfigs['SITE_ID']"
              type="number"
              placeholder="45000808"
              title="本所的統一編號"
              :state="validateNumber(loadedConfigs['SITE_ID'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="numNotOK(loadedConfigs['SITE_ID'])"
                no-icon-gutter
                @click="quick({SITE_ID: loadedConfigs['SITE_ID']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="跨所ＡＰ" class="my-1">
            <b-input
              v-model="loadedConfigs['WEBAP_IP']"
              placeholder="220.1.34.161"
              title="跨縣市地政WEB版伺服器IP"
              :state="validateIp(loadedConfigs['WEBAP_IP'])"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="ipNotOK(loadedConfigs['WEBAP_IP'])"
                no-icon-gutter
                @click="quick({WEBAP_IP: loadedConfigs['WEBAP_IP']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="其他ＡＰ" class="my-1">
            <b-input
              v-model="loadedConfigs['WEBAP_POSTFIXES']"
              placeholder="僅輸入最後一碼，以逗號分隔"
              title="其他地政WEB版AP IP的最後一碼"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="$utils.empty(loadedConfigs['WEBAP_POSTFIXES'])"
                no-icon-gutter
                @click="quick({WEBAP_POSTFIXES: loadedConfigs['WEBAP_POSTFIXES']})"
              />
            </template>
          </b-input-group>
          <b-input-group size="sm" prepend="通知ＤＢ" class="my-1">
            <b-input
              v-model="loadedConfigs['WS_DB_PATH']"
              placeholder="通知伺服器DB存放位置"
              title="e.g. C:\AppServ\nuxtjs\ws\db"
              trim
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                :disabled="$utils.empty(loadedConfigs['WS_DB_PATH'])"
                no-icon-gutter
                @click="quick({WEBAP_POSTFIXES: loadedConfigs['WS_DB_PATH']})"
              />
            </template>
          </b-input-group>
          <b-input-group v-show="false" size="sm" prepend="管理金鑰" class="my-1">
            <b-input
              v-model="loadedConfigs['MASTER_PASSWORD']"
              placeholder="MD5雜湊值"
              title="管理者密碼雜湊值"
              trim
              disabled
            />
          </b-input-group>
        </b-card>
        <b-card
          v-cloak
          header-bg-variant="primary"
          header-text-variant="white"
          border-variant="primary"
        >
          <template #header>
            <h6 class="my-auto font-weight-bolder">
              <lah-fa-icon icon="toggle-off" size="lg">
                系統開關設定
              </lah-fa-icon>
            </h6>
          </template>
          <b-checkbox v-model="loadedConfigs['ENABLE_MSSQL_CONN']" switch @change="quick({ENABLE_MSSQL_CONN: loadedConfigs['ENABLE_MSSQL_CONN']})">
            啟用MSSQL外部資料庫
          </b-checkbox>
          <b-checkbox v-model="loadedConfigs['ENABLE_OFFICE_HOURS']" switch @change="quick({ENABLE_OFFICE_HOURS: loadedConfigs['ENABLE_OFFICE_HOURS']})">
            啟用辦公時間限制
          </b-checkbox>
          <b-checkbox v-model="loadedConfigs['ENABLE_AVATAR']" switch class="text-nowrap" @change="switchAvatar">
            啟用大頭照
          </b-checkbox>
          <b-input-group>
            <b-checkbox v-model="loadedConfigs['ENABLE_MOCK_MODE']" class="my-auto mr-1" switch title="開發模擬環境模式" @change="quick({ENABLE_MOCK_MODE: loadedConfigs['ENABLE_MOCK_MODE']})">
              啟用模擬模式
            </b-checkbox>
            <b-input
              v-model="loadedConfigs['MOCK_CACHE_SECONDS']"
              type="number"
              min="5"
              placeholder="15"
              title="模擬模式下回應快取剩餘時間(秒)"
              trim
              size="sm"
            />
            <template #append>
              <lah-button
                icon="pen-square"
                variant="outline-secondary"
                title="立即寫入設定"
                no-icon-gutter
                :disabled="loadedConfigs['ENABLE_MOCK_MODE'] === false || loadedConfigs['ENABLE_MOCK_MODE'] === 'false'"
                size="sm"
                @click="quick({MOCK_CACHE_SECONDS: loadedConfigs['MOCK_CACHE_SECONDS']})"
              />
            </template>
          </b-input-group>
          <b-input-group v-if="false" size="sm" prepend="查詢金鑰" class="my-1">
            <b-input
              v-model="loadedConfigs['API_KEY']"
              placeholder="MD5雜湊值"
              title="API KEY MD5 HASH"
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
                @click="quick({API_KEY: loadedConfigs['API_KEY']})"
              />
            </template>
          </b-input-group>
          <b-input-group v-show="false" size="sm" prepend="照片路徑" class="my-1">
            <b-input
              v-model="loadedConfigs['USER_PHOTO_FOLDER']"
              placeholder="內網擷取使用者圖片路徑"
              title="內網擷取使用者圖片路徑"
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
                @click="quick({USER_PHOTO_FOLDER: loadedConfigs['USER_PHOTO_FOLDER']})"
              />
            </template>
          </b-input-group>
        </b-card>
      </b-card-group>
      <lah-transition slide-up>
        <b-card-group v-if="showMSSQLCards" v-cloak deck class="mt-4">
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder">
                <lah-fa-icon icon="comments">
                  信差資料庫連線設定
                </lah-fa-icon>
              </h6>
            </template>
            <b-input-group size="sm" prepend="登入帳密">
              <b-input
                v-model="loadedConfigs['MS_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="loadedConfigs['MS_DB_PWD']"
                placeholder=""
                type="password"
                title="登入DB密碼"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DB_PWD: loadedConfigs['MS_DB_PWD'], MS_DB_UID: loadedConfigs['MS_DB_UID']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DB_SVR']"
                placeholder="220.1.35.89"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['MS_DB_SVR'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1433"
                title="連線埠號(PORT)"
                class="col-2 ml-1"
                value="1433"
                disabled
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="ipNotOK(loadedConfigs['MS_DB_SVR'])"
                  no-icon-gutter
                  @click="quick({MS_DB_SVR: loadedConfigs['MS_DB_SVR']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DB_DATABASE']"
                placeholder="jungli_in2016"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DB_DATABASE: loadedConfigs['MS_DB_DATABASE']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DB_CHARSET']"
                placeholder="UTF-8"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DB_CHARSET: loadedConfigs['MS_DB_CHARSET']})"
                />
              </template>
            </b-input-group>
          </b-card>
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder">
                <lah-fa-icon icon="hdd" regular>
                  DOC資料庫連線設定
                </lah-fa-icon>
              </h6>
            </template>
            <b-input-group size="sm" prepend="登入帳密">
              <b-input
                v-model="loadedConfigs['MS_DOC_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="loadedConfigs['MS_DOC_DB_PWD']"
                placeholder=""
                type="password"
                title="登入DB密碼"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DOC_DB_PWD: loadedConfigs['MS_DOC_DB_PWD'], MS_DOC_DB_UID: loadedConfigs['MS_DOC_DB_UID']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DOC_DB_SVR']"
                placeholder="220.1.35.24"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['MS_DOC_DB_SVR'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1433"
                title="連線埠號(PORT)"
                class="col-2 ml-1"
                value="1433"
                disabled
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="ipNotOK(loadedConfigs['MS_DOC_DB_SVR'])"
                  no-icon-gutter
                  @click="quick({MS_DOC_DB_SVR: loadedConfigs['MS_DOC_DB_SVR']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DOC_DB_DATABASE']"
                placeholder="doc"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DOC_DB_DATABASE: loadedConfigs['MS_DOC_DB_DATABASE']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_DOC_DB_CHARSET']"
                placeholder="UTF-8"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_DOC_DB_CHARSET: loadedConfigs['MS_DOC_DB_CHARSET']})"
                />
              </template>
            </b-input-group>
          </b-card>
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder">
                <lah-fa-icon icon="hdd">
                  TDOC資料庫連線設定
                </lah-fa-icon>
              </h6>
            </template>
            <b-input-group size="sm" prepend="登入帳密">
              <b-input
                v-model="loadedConfigs['MS_TDOC_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="loadedConfigs['MS_TDOC_DB_PWD']"
                placeholder=""
                type="password"
                title="登入DB密碼"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_TDOC_DB_PWD: loadedConfigs['MS_TDOC_DB_PWD'], MS_TDOC_DB_UID: loadedConfigs['MS_TDOC_DB_UID']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_TDOC_DB_SVR']"
                placeholder="220.1.35.24"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['MS_TDOC_DB_SVR'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1433"
                title="連線埠號(PORT)"
                class="col-2 ml-1"
                value="1433"
                disabled
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="ipNotOK(loadedConfigs['MS_TDOC_DB_SVR'])"
                  no-icon-gutter
                  @click="quick({MS_TDOC_DB_SVR: loadedConfigs['MS_TDOC_DB_SVR']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_TDOC_DB_DATABASE']"
                placeholder="tdoc"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_TDOC_DB_DATABASE: loadedConfigs['MS_TDOC_DB_DATABASE']})"
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                v-model="loadedConfigs['MS_TDOC_DB_CHARSET']"
                placeholder="UTF-8"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({MS_TDOC_DB_CHARSET: loadedConfigs['MS_TDOC_DB_CHARSET']})"
                />
              </template>
            </b-input-group>
          </b-card>
        </b-card-group>
      </lah-transition>
      <hr>
    </b-container>
  </div>
</template>

<script>
import lahTransition from '~/components/lah-transition.vue'
export default {
  components: { lahTransition },
  middleware: ['isAdmin'],
  fetchOnServer: true,
  data: () => ({
    loadedConfigs: {},
    message: '',
    masterPassword: '',
    origMasterPasswordHash: '1f7744350d3dd3dc563421582f37f99e',
    dbTargeteOpts: [
      { text: '主要', value: 'HXWEB' },
      { text: '備份', value: 'BACKUP' },
      { text: '測試', value: 'HXT' }
    ]
  }),
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    this.loadedConfigs = { ...data.raw }
    this.message = data.message
    this.origMasterPasswordHash = this.loadedConfigs.MASTER_PASSWORD
  },
  head: {
    title: '系統設定管理-桃園市地政局'
  },
  computed: {
    showMSSQLCards () {
      return this.loadedConfigs && (this.loadedConfigs.ENABLE_MSSQL_CONN === 'true' || this.loadedConfigs.ENABLE_MSSQL_CONN === true)
    },
    masterPasswordNotChanged () {
      return this.$utils.equal(this.loadedConfigs.MASTER_PASSWORD, this.origMasterPasswordHash)
    },
    dbPointTarget () {
      return this.loadedConfigs.ORA_DB_TARGET
    },
    isMockModeEnabled () {
      return this.loadedConfigs.ENABLE_MOCK_MODE === true || this.loadedConfigs.ENABLE_MOCK_MODE === 'true'
    }
  },
  watch: {
    masterPassword (val) {
      // empty val restore to default pw
      this.loadedConfigs.MASTER_PASSWORD = this.$utils.empty(val) ? this.origMasterPasswordHash : this.$utils.md5(val)
    },
    dbPointTarget (val) {
      this.quick({ ORA_DB_TARGET: val }, false)
      // clear $localForage cached data
      this.clearCache()
    }
  },
  methods: {
    validateIp (ip) {
      return this.$utils.isIPv4(ip) === true ? null : false
    },
    validateNumber (val) {
      const pval = parseInt(val)
      return (pval !== NaN && pval > 0) ? null : false
    },
    ipNotOK (ip) {
      return !this.$utils.isIPv4(ip)
    },
    numNotOK (val) {
      const pval = parseInt(val)
      return isNaN(pval) || pval <= 0 || this.$utils.empty(val)
    },
    update () {
      this.confirm('確定要更新「所有」設定值？')
        .then((answer) => {
          if (answer) {
            this.isBusy = true
            this.quick(this.loadedConfigs)
          }
        })
    },
    quick (configs, notify = true) {
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'update_configs',
        configs
      }).then(({ data }) => {
        const notifyOpts = { type: 'warning', subtitle: `${Object.keys(configs).length} 筆更新` }
        if (this.$utils.statusCheck(data.status)) {
          notifyOpts.type = 'success'
          if (Object.keys(configs).includes('ENABLE_MOCK_MODE')) {
            this.$store.commit('mock', configs.ENABLE_MOCK_MODE)
          }
        }
        notify && this.notify(data.message, notifyOpts)
      }).catch((error) => {
        this.$utils.error(error)
      }).finally(() => {
        this.isBusy = false
      })
    },
    changeMasterPassword () {
      if (this.masterPasswordNotChanged) {
        this.notify('管理者密碼未變更', { type: 'warning' })
      } else {
        this.quick({ MASTER_PASSWORD: this.loadedConfigs.MASTER_PASSWORD })
      }
      this.hideModalById('master-pw-modal')
    },
    switchAvatar () {
      this.quick({ ENABLE_AVATAR: this.loadedConfigs.ENABLE_AVATAR })
      this.$store.commit('avatar', this.loadedConfigs.ENABLE_AVATAR)
    }
  }
}
</script>

<style lang="scss" scoped>
.width {
  min-width: 1280px !important;
}
.list-group-item:hover {
  background-color: rgb(37, 233, 125)
}
</style>
