<template>
  <div v-cloak class="width">
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">系統參數管理</div>
            <lah-button icon="question" variant="outline-success" no-border no-icon-gutter v-b-modal.help-modal title="說明"/>
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              icon="edit"
              reqular
              @click="update"
              size="lg"
              action="swing"
              title="更新全部設定"
              no-icon-gutter
            />
            <lah-button
              icon="key"
              title="變更管理者登入密碼"
              variant="outline-danger"
              no-icon-gutter
              v-b-modal.master-pw-modal
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
            icon="key"
            variant="outline-danger"
            class="mt-n1 mx-1"
            no-icon-gutter
            v-b-modal.master-pw-modal
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
            type="password"
            v-model="masterPassword"
            title="管理者登入密碼"
            @keyup.enter="changeMasterPassword"
            trim
          />
          <template #append>
            <lah-button
              icon="pen-square"
              variant="outline-danger"
              title="更新主密碼"
              :disabled="masterPasswordNotChanged"
              @click="changeMasterPassword"
              no-icon-gutter
            />
          </template>
        </b-input-group>
      </b-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group :deck="!isMockModeEnabled" :columns="isMockModeEnabled">
        <lah-transition>
          <b-card
            v-if="!isMockModeEnabled"
            header-bg-variant="danger"
            header-text-variant="white"
            border-variant="danger"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="database">地政WEB資料庫連線設定</lah-fa-icon></h6>
            </template>
            <b-input-group size="sm" prepend="登入帳密">
              <b-input
                placeholder="MOICAS"
                v-model="loadedConfigs['ORA_DB_USER']"
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                type="password"
                v-model="loadedConfigs['ORA_DB_PASS']"
                title="登入DB密碼"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_USER: loadedConfigs['ORA_DB_USER'], ORA_DB_PASS: loadedConfigs['ORA_DB_PASS']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="主要ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.2"
                v-model="loadedConfigs['ORA_DB_HXWEB_IP']"
                title="主資料庫IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_HXWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_HXWEB_PORT']"
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
                  @click="quick({ORA_DB_HXWEB_IP: loadedConfigs['ORA_DB_HXWEB_IP'], ORA_DB_HXWEB_PORT: loadedConfigs['ORA_DB_HXWEB_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_HXWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_HXWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="備份ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.102"
                v-model="loadedConfigs['ORA_DB_BACKUP_IP']"
                title="備份資料庫IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_BACKUP_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_BACKUP_PORT']"
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
                  @click="quick({ORA_DB_BACKUP_IP: loadedConfigs['ORA_DB_BACKUP_IP'], ORA_DB_BACKUP_PORT: loadedConfigs['ORA_DB_BACKUP_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_BACKUP_IP']) || numNotOK(loadedConfigs['ORA_DB_BACKUP_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="測試ＤＢ" class="my-1">
              <b-input
                placeholder="192.168.27.2"
                v-model="loadedConfigs['ORA_DB_HXT_IP']"
                title="測試資料庫IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_HXT_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_HXT_PORT']"
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
                  @click="quick({ORA_DB_HXT_IP: loadedConfigs['ORA_DB_HXT_IP'], ORA_DB_HXT_PORT: loadedConfigs['ORA_DB_HXT_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_HXT_IP']) || numNotOK(loadedConfigs['ORA_DB_HXT_PORT'])"
                  no-icon-gutter
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
        </lah-transition>
        <lah-transition>
          <b-card
            v-if="!isMockModeEnabled"
            header-bg-variant="dark"
            header-text-variant="white"
            border-variant="dark"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="server">同步異動資料庫連線設定</lah-fa-icon></h6>
            </template>
            <b-input-group size="sm" prepend="輪詢間隔">
              <b-input
                type="number"
                min="5"
                placeholder="300"
                title="PING間隔時間(秒)"
                v-model="loadedConfigs['PING_INTERVAL_SECONDS']"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({PING_INTERVAL_SECONDS: loadedConfigs['PING_INTERVAL_SECONDS']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="Ｌ１ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.33.2"
                v-model="loadedConfigs['ORA_DB_L1HWEB_IP']"
                title="L1HWEB 資料庫IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_L1HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_L1HWEB_PORT']"
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
                  @click="quick({ORA_DB_L1HWEB_IP: loadedConfigs['ORA_DB_L1HWEB_IP'], ORA_DB_L1HWEB_PORT: loadedConfigs['ORA_DB_L1HWEB_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_L1HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L1HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="Ｌ２ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.33.3"
                v-model="loadedConfigs['ORA_DB_L2HWEB_IP']"
                title="L2HWEB 資料庫IP"
                class=" mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_L2HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_L2HWEB_PORT']"
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
                  @click="quick({ORA_DB_L2HWEB_IP: loadedConfigs['ORA_DB_L2HWEB_IP'], ORA_DB_L2HWEB_PORT: loadedConfigs['ORA_DB_L2HWEB_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_L2HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L2HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="Ｌ３ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.33.5"
                v-model="loadedConfigs['ORA_DB_L3HWEB_IP']"
                title="L3HWEB 資料庫IP"
                class="mr-1"
                :state="validateIp(loadedConfigs['ORA_DB_L3HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="loadedConfigs['ORA_DB_L3HWEB_PORT']"
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
                  @click="quick({ORA_DB_L3HWEB_IP: loadedConfigs['ORA_DB_L3HWEB_IP'], ORA_DB_L3HWEB_PORT: loadedConfigs['ORA_DB_L3HWEB_PORT']})"
                  :disabled="ipNotOK(loadedConfigs['ORA_DB_L3HWEB_IP']) || numNotOK(loadedConfigs['ORA_DB_L3HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
        </lah-transition>
        <lah-transition>
          <b-card
            v-if="!isMockModeEnabled"
            header-bg-variant="success"
            header-text-variant="white"
            border-variant="success"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="feather-alt">其他設定</lah-fa-icon></h6>
            </template>
            <b-input-group size="sm" prepend="本所代碼" class="my-1">
              <b-input
                :placeholder="site"
                v-model="loadedConfigs['SITE']"
                :state="site === loadedConfigs['SITE']"
                v-b-popover.hover.focus.top="site !== loadedConfigs['SITE'] ? `系統偵測到所別為: ${site} (${apiSvrIp})` : ''"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({SITE: loadedConfigs['SITE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="本所統編" class="my-1">
              <b-input
                type="number"
                placeholder="45000808"
                title="本所的統一編號"
                v-model="loadedConfigs['SITE_ID']"
                :state="validateNumber(loadedConfigs['SITE_ID'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({SITE_ID: loadedConfigs['SITE_ID']})"
                  :disabled="numNotOK(loadedConfigs['SITE_ID'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="跨所ＡＰ" class="my-1">
              <b-input
                placeholder="220.1.35.123"
                title="任一個地政WEB版伺服器IP"
                v-model="loadedConfigs['WEBAP_IP']"
                :state="validateIp(loadedConfigs['WEBAP_IP'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({WEBAP_IP: loadedConfigs['WEBAP_IP']})"
                  :disabled="ipNotOK(loadedConfigs['WEBAP_IP'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="管理金鑰" class="my-1">
              <b-input
                placeholder="MD5雜湊值"
                title="管理者密碼雜湊值"
                v-model="loadedConfigs['MASTER_PASSWORD']"
                trim
                disabled
              />
            </b-input-group>
          </b-card>
        </lah-transition>
        <lah-transition>
          <b-card
            header-bg-variant="primary"
            header-text-variant="white"
            border-variant="primary"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="toggle-off" size="lg">系統開關設定</lah-fa-icon></h6>
            </template>
            <b-checkbox v-model="loadedConfigs['ENABLE_MOCK_MODE']" switch @change="quick({ENABLE_MOCK_MODE: loadedConfigs['ENABLE_MOCK_MODE']})" title="開發模擬環境模式">啟用模擬模式</b-checkbox>
            <b-input-group size="sm" prepend="快取時間" style="margin-left: 35px; width: 65%;" :disabled="!loadedConfigs['ENABLE_MOCK_MODE']">
              <b-input
                type="number"
                min="5"
                placeholder="15"
                title="模擬模式下回應快取剩餘時間(秒)"
                v-model="loadedConfigs['MOCK_CACHE_SECONDS']"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MOCK_CACHE_SECONDS: loadedConfigs['MOCK_CACHE_SECONDS']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-checkbox v-model="loadedConfigs['ENABLE_MSSQL_CONN']" switch @change="quick({ENABLE_MSSQL_CONN: loadedConfigs['ENABLE_MSSQL_CONN']})">啟用MSSQL外部資料庫</b-checkbox>
            <b-checkbox v-model="loadedConfigs['ENABLE_OFFICE_HOURS']" switch @change="quick({ENABLE_OFFICE_HOURS: loadedConfigs['ENABLE_OFFICE_HOURS']})">啟用辦公時間限制</b-checkbox>
            <b-input-group v-if="false" size="sm" prepend="查詢金鑰" class="my-1">
              <b-input
                placeholder="MD5雜湊值"
                title="API KEY MD5 HASH"
                v-model="loadedConfigs['API_KEY']"
                trim
                disabled
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({API_KEY: loadedConfigs['API_KEY']})"
                  no-icon-gutter
                  disabled
                />
              </template>
            </b-input-group>
            <b-input-group v-show="false" size="sm" prepend="照片路徑" class="my-1">
              <b-input
                placeholder="內網擷取使用者圖片路徑"
                title="內網擷取使用者圖片路徑"
                v-model="loadedConfigs['USER_PHOTO_FOLDER']"
                trim
                disabled
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({USER_PHOTO_FOLDER: loadedConfigs['USER_PHOTO_FOLDER']})"
                  no-icon-gutter
                  disabled
                />
              </template>
            </b-input-group>
          </b-card>
        </lah-transition>
      </b-card-group>
      <lah-transition slideUp>
        <b-card-group v-if="showMSSQLCards" deck class="mt-4">
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="comments">信差資料庫連線設定</lah-fa-icon></h6>
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
                  @click="quick({MS_DB_PWD: loadedConfigs['MS_DB_PWD'], MS_DB_UID: loadedConfigs['MS_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.89"
                v-model="loadedConfigs['MS_DB_SVR']"
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
                  @click="quick({MS_DB_SVR: loadedConfigs['MS_DB_SVR']})"
                  :disabled="ipNotOK(loadedConfigs['MS_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="jungli_in2016"
                v-model="loadedConfigs['MS_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DB_DATABASE: loadedConfigs['MS_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="loadedConfigs['MS_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DB_CHARSET: loadedConfigs['MS_DB_CHARSET']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="hdd" regular>DOC資料庫連線設定</lah-fa-icon></h6>
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
                  @click="quick({MS_DOC_DB_PWD: loadedConfigs['MS_DOC_DB_PWD'], MS_DOC_DB_UID: loadedConfigs['MS_DOC_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.24"
                v-model="loadedConfigs['MS_DOC_DB_SVR']"
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
                  @click="quick({MS_DOC_DB_SVR: loadedConfigs['MS_DOC_DB_SVR']})"
                  :disabled="ipNotOK(loadedConfigs['MS_DOC_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="doc"
                v-model="loadedConfigs['MS_DOC_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DOC_DB_DATABASE: loadedConfigs['MS_DOC_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="loadedConfigs['MS_DOC_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DOC_DB_CHARSET: loadedConfigs['MS_DOC_DB_CHARSET']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
          <b-card>
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="hdd">TDOC資料庫連線設定</lah-fa-icon></h6>
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
                  @click="quick({MS_TDOC_DB_PWD: loadedConfigs['MS_TDOC_DB_PWD'], MS_TDOC_DB_UID: loadedConfigs['MS_TDOC_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.24"
                v-model="loadedConfigs['MS_TDOC_DB_SVR']"
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
                  @click="quick({MS_TDOC_DB_SVR: loadedConfigs['MS_TDOC_DB_SVR']})"
                  :disabled="ipNotOK(loadedConfigs['MS_TDOC_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="tdoc"
                v-model="loadedConfigs['MS_TDOC_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_TDOC_DB_DATABASE: loadedConfigs['MS_TDOC_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="loadedConfigs['MS_TDOC_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_TDOC_DB_CHARSET: loadedConfigs['MS_TDOC_DB_CHARSET']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
        </b-card-group>
      </lah-transition>
      <hr/>
    </b-container>
  </div>
</template>

<script>
import lahTransition from '~/components/lah-transition.vue'
export default {
  components: { lahTransition },
  head: {
    title: '系統設定管理-桃園市地政局'
  },
  middleware: [ 'isAdmin' ],
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
  computed: {
    showMSSQLCards () {
      return this.loadedConfigs && (this.loadedConfigs['ENABLE_MSSQL_CONN'] === 'true' || this.loadedConfigs['ENABLE_MSSQL_CONN'] === true)
    },
    masterPasswordNotChanged () {
      return this.$utils.equal(this.loadedConfigs['MASTER_PASSWORD'], this.origMasterPasswordHash)
    },
    dbPointTarget () {
      return this.loadedConfigs['ORA_DB_TARGET']
    },
    isMockModeEnabled () {
      return this.loadedConfigs['ENABLE_MOCK_MODE'] === true || this.loadedConfigs['ENABLE_MOCK_MODE'] === 'true'
    }
  },
  watch: {
    masterPassword (val) {
      // empty val restore to default pw
      this.loadedConfigs['MASTER_PASSWORD'] = this.$utils.empty(val) ? this.origMasterPasswordHash : this.$utils.md5(val)
    },
    dbPointTarget (val) {
      this.quick({ORA_DB_TARGET: val}, false)
      // clear $localForage cached data
      this.clearCache()
    }
  },
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    this.loadedConfigs = { ...data.raw }
    this.message = data.message
    this.origMasterPasswordHash = this.loadedConfigs['MASTER_PASSWORD']
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
      return pval === NaN || pval <= 0 || this.$utils.empty(val)
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
        configs: configs
      }).then(({ data }) => {
        const notifyOpts = { type: 'warning', subtitle: `${Object.keys(configs).length} 筆更新` }
        if (this.$utils.statusCheck(data.status)) {
          notifyOpts.type = 'success'
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
        this.quick({MASTER_PASSWORD: this.loadedConfigs['MASTER_PASSWORD']})
      }
      this.hideModalById('master-pw-modal')
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
