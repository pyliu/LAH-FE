<template>
  <div v-cloak>
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
              @click="changeMasterPassword"
              no-icon-gutter
            />
          </template>
        </b-input-group>
      </b-modal>
    </lah-header>
    <b-container fluid v-cloak>
      <b-card-group deck>
        <lah-transition appear>
          <b-card 
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
                class="mr-1"
                :state="validateIp(configs['ORA_DB_HXWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_HXWEB_PORT']"
                title="主資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_HXWEB_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_HXWEB_IP: configs['ORA_DB_HXWEB_IP'], ORA_DB_HXWEB_PORT: configs['ORA_DB_HXWEB_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_HXWEB_IP']) || numNotOK(configs['ORA_DB_HXWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="備份ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.102"
                v-model="configs['ORA_DB_BACKUP_IP']"
                title="備份資料庫IP"
                class="mr-1"
                :state="validateIp(configs['ORA_DB_BACKUP_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_BACKUP_PORT']"
                title="備份資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_BACKUP_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_BACKUP_IP: configs['ORA_DB_BACKUP_IP'], ORA_DB_BACKUP_PORT: configs['ORA_DB_BACKUP_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_BACKUP_IP']) || numNotOK(configs['ORA_DB_BACKUP_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="測試ＤＢ" class="my-1">
              <b-input
                placeholder="192.168.27.2"
                v-model="configs['ORA_DB_HXT_IP']"
                title="測試資料庫IP"
                class="mr-1"
                :state="validateIp(configs['ORA_DB_HXT_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_HXT_PORT']"
                title="測試資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_HXT_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_HXT_IP: configs['ORA_DB_HXT_IP'], ORA_DB_HXT_PORT: configs['ORA_DB_HXT_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_HXT_IP']) || numNotOK(configs['ORA_DB_HXT_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
        </lah-transition>
        <lah-transition appear>
          <b-card
            header-bg-variant="dark"
            header-text-variant="white"
            border-variant="dark"
          >
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
                class="mr-1"
                :state="validateIp(configs['ORA_DB_L1HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_L1HWEB_PORT']"
                title="L1HWEB 資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_L1HWEB_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_L1HWEB_IP: configs['ORA_DB_L1HWEB_IP'], ORA_DB_L1HWEB_PORT: configs['ORA_DB_L1HWEB_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_L1HWEB_IP']) || numNotOK(configs['ORA_DB_L1HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="Ｌ２ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.33.3"
                v-model="configs['ORA_DB_L2HWEB_IP']"
                title="L2HWEB 資料庫IP"
                class=" mr-1"
                :state="validateIp(configs['ORA_DB_L2HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_L2HWEB_PORT']"
                title="L2HWEB 資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_L2HWEB_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_L2HWEB_IP: configs['ORA_DB_L2HWEB_IP'], ORA_DB_L2HWEB_PORT: configs['ORA_DB_L2HWEB_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_L2HWEB_IP']) || numNotOK(configs['ORA_DB_L2HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="Ｌ３ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.33.5"
                v-model="configs['ORA_DB_L3HWEB_IP']"
                title="L3HWEB 資料庫IP"
                class="mr-1"
                :state="validateIp(configs['ORA_DB_L3HWEB_IP'])"
                trim
              />
              :
              <b-input
                type="number"
                min="1"
                max="65535"
                placeholder="1521"
                v-model="configs['ORA_DB_L3HWEB_PORT']"
                title="L3HWEB 資料庫PORT"
                class="col-3 ml-1"
                :state="validateNumber(configs['ORA_DB_L3HWEB_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({ORA_DB_L3HWEB_IP: configs['ORA_DB_L3HWEB_IP'], ORA_DB_L3HWEB_PORT: configs['ORA_DB_L3HWEB_PORT']})"
                  :disabled="ipNotOK(configs['ORA_DB_L3HWEB_IP']) || numNotOK(configs['ORA_DB_L3HWEB_PORT'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
          </b-card>
        </lah-transition>
        <lah-transition appear>
          <b-card
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
                v-model="configs['SITE']"
                :state="site === configs['SITE']"
                v-b-popover.hover.focus.top="site !== configs['SITE'] ? `系統偵測到所別為: ${site} (${apiSvrIp})` : ''"
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
                type="number"
                placeholder="45000808"
                title="本所的統一編號"
                v-model="configs['SITE_ID']"
                :state="validateNumber(configs['SITE_ID'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({SITE_ID: configs['SITE_ID']})"
                  :disabled="numNotOK(configs['SITE_ID'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="跨所ＡＰ" class="my-1">
              <b-input
                placeholder="220.1.35.123"
                title="任一個地政WEB版伺服器IP"
                v-model="configs['WEBAP_IP']"
                :state="validateIp(configs['WEBAP_IP'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({SITE: configs['WEBAP_IP']})"
                  :disabled="ipNotOK(configs['WEBAP_IP'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="管理金鑰" class="my-1">
              <b-input
                placeholder="MD5雜湊值"
                title="管理者密碼雜湊值"
                v-model="configs['MASTER_PASSWORD']"
                trim
                disabled
              />
            </b-input-group>
          </b-card>
        </lah-transition>
        <lah-transition appear>
          <b-card
            header-bg-variant="primary"
            header-text-variant="white"
            border-variant="primary"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="toggle-off" size="lg">系統開關設定</lah-fa-icon></h6>
            </template>
            <b-checkbox v-model="configs['ENABLE_MOCK_MODE']" switch @change="quick({ENABLE_MOCK_MODE: configs['ENABLE_MOCK_MODE']})" title="開發模擬環境模式">啟用模擬模式</b-checkbox>
            <b-input-group size="sm" prepend="快取時間" style="margin-left: 35px; width: 75%;" :disabled="!configs['ENABLE_MOCK_MODE']">
              <b-input
                type="number"
                min="5"
                placeholder="15"
                title="模擬模式下回應快取剩餘時間(秒)"
                v-model="configs['MOCK_CACHE_SECONDS']"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MOCK_CACHE_SECONDS: configs['MOCK_CACHE_SECONDS']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-checkbox v-model="configs['ENABLE_MSSQL_CONN']" switch @change="quick({ENABLE_MSSQL_CONN: configs['ENABLE_MSSQL_CONN']})">啟用MSSQL外部資料庫</b-checkbox>
            <b-checkbox v-model="configs['ENABLE_OFFICE_HOURS']" switch @change="quick({ENABLE_OFFICE_HOURS: configs['ENABLE_OFFICE_HOURS']})">啟用辦公時間限制</b-checkbox>
            <b-input-group v-if="false" size="sm" prepend="查詢金鑰" class="my-1">
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
                  @click="quick({API_KEY: configs['API_KEY']})"
                  no-icon-gutter
                  disabled
                />
              </template>
            </b-input-group>
            <b-input-group v-show="false" size="sm" prepend="照片路徑" class="my-1">
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
                  @click="quick({USER_PHOTO_FOLDER: configs['USER_PHOTO_FOLDER']})"
                  no-icon-gutter
                  disabled
                />
              </template>
            </b-input-group>
          </b-card>
        </lah-transition>
      </b-card-group>
      <lah-transition appear slideUp>
        <b-card-group v-if="showMSSQLCards" deck class="mt-4">
          <b-card 
            header-bg-variant="info"
            header-text-variant="white"
            border-variant="info"
          >
            <template #header>
              <h6 class="my-auto font-weight-bolder"><lah-fa-icon icon="comments">信差資料庫連線設定</lah-fa-icon></h6>
            </template>
            <b-input-group size="sm" prepend="登入帳密">
              <b-input
                v-model="configs['MS_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="configs['MS_DB_PWD']"
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
                  @click="quick({MS_DB_PWD: configs['MS_DB_PWD'], MS_DB_UID: configs['MS_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.89"
                v-model="configs['MS_DB_SVR']"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(configs['MS_DB_SVR'])"
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
                  @click="quick({MS_DB_SVR: configs['MS_DB_SVR']})"
                  :disabled="ipNotOK(configs['MS_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="jungli_in2016"
                v-model="configs['MS_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DB_DATABASE: configs['MS_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="configs['MS_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DB_CHARSET: configs['MS_DB_CHARSET']})"
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
                v-model="configs['MS_DOC_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="configs['MS_DOC_DB_PWD']"
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
                  @click="quick({MS_DOC_DB_PWD: configs['MS_DOC_DB_PWD'], MS_DOC_DB_UID: configs['MS_DOC_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.24"
                v-model="configs['MS_DOC_DB_SVR']"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(configs['MS_DOC_DB_SVR'])"
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
                  @click="quick({MS_DOC_DB_SVR: configs['MS_DOC_DB_SVR']})"
                  :disabled="ipNotOK(configs['MS_DOC_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="doc"
                v-model="configs['MS_DOC_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DOC_DB_DATABASE: configs['MS_DOC_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="configs['MS_DOC_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_DOC_DB_CHARSET: configs['MS_DOC_DB_CHARSET']})"
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
                v-model="configs['MS_TDOC_DB_UID']"
                placeholder=""
                title="登入DB帳號"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="configs['MS_TDOC_DB_PWD']"
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
                  @click="quick({MS_TDOC_DB_PWD: configs['MS_TDOC_DB_PWD'], MS_TDOC_DB_UID: configs['MS_TDOC_DB_UID']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="連線ＤＢ" class="my-1">
              <b-input
                placeholder="220.1.35.24"
                v-model="configs['MS_TDOC_DB_SVR']"
                title="伺服器IP"
                class="mr-1"
                :state="validateIp(configs['MS_TDOC_DB_SVR'])"
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
                  @click="quick({MS_TDOC_DB_SVR: configs['MS_TDOC_DB_SVR']})"
                  :disabled="ipNotOK(configs['MS_TDOC_DB_SVR'])"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="ＤＢ名稱" class="my-1">
              <b-input
                placeholder="tdoc"
                v-model="configs['MS_TDOC_DB_DATABASE']"
                title="資料庫名稱"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_TDOC_DB_DATABASE: configs['MS_TDOC_DB_DATABASE']})"
                  no-icon-gutter
                />
              </template>
            </b-input-group>
            <b-input-group size="sm" prepend="編碼設定" class="my-1">
              <b-input
                placeholder="UTF-8"
                v-model="configs['MS_TDOC_DB_CHARSET']"
                title="資料庫編碼設定"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  @click="quick({MS_TDOC_DB_CHARSET: configs['MS_TDOC_DB_CHARSET']})"
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
    configs: {},
    message: '',
    masterPassword: ''
  }),
  computed: {
    showMSSQLCards () {
      return this.configs && (this.configs['ENABLE_MSSQL_CONN'] === 'true' || this.configs['ENABLE_MSSQL_CONN'] === true)
    }
  },
  watch: {
    masterPassword (val) {
      this.configs['MASTER_PASSWORD'] = this.$utils.md5(val)
    }
  },
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    // Object.assign makes var reactively
    this.configs = Object.assign({}, data.raw)
    this.message = data.message
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
    },
    changeMasterPassword () {
      this.quick({MASTER_PASSWORD: this.configs['MASTER_PASSWORD']})
      this.hideModalById('master-pw-modal')
    }
  }
}
</script>

<style lang="scss" scoped>
.list-group-item:hover {
  background-color: rgb(37, 233, 125)
}
</style>
