<template>
  <div v-cloak class="admin-configs-page">
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between align-items-center w-100">
          <div class="d-flex align-items-center">
            <h3 class="my-auto font-weight-bold">
              系統參數管理<lah-fa-icon icon="sliders-h" class="ml-2" />
            </h3>
            <b-badge variant="primary" pill class="ml-2 py-1 px-2">
              共 35 項設定
            </b-badge>
            <lah-button
              v-b-modal.help-modal
              icon="info"
              variant="outline-success"
              no-border
              no-icon-gutter
              title="使用說明"
              class="ml-2"
            />
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              icon="sync-alt"
              size="lg"
              title="重新整理設定值"
              variant="outline-secondary"
              no-icon-gutter
              class="border-0"
              :disabled="isBusy"
              @click="reloadConfigs"
            />
            <lah-button
              icon="edit"
              regular
              size="lg"
              action="swing"
              title="更新全部 35 項設定"
              variant="outline-primary"
              no-icon-gutter
              class="border-0"
              :disabled="isBusy"
              @click="update"
            />
            <lah-button
              v-b-modal.master-pw-modal
              icon="key"
              title="變更管理者登入密碼"
              variant="outline-danger"
              no-icon-gutter
              class="border-0"
            />
          </b-button-group>
        </div>
      </lah-transition>

      <!-- 說明彈窗 -->
      <lah-help-modal :modal-id="'help-modal'" size="md">
        <div class="d-inline-flex align-items-center">
          ⭐ 按
          <lah-button
            icon="edit"
            regular
            action="swing"
            class="mt-n1 mx-1"
            no-icon-gutter
            @click="update"
          />
          可一次更新所有 35 項系統設定值
        </div>
        <div class="d-inline-flex align-items-center my-2">
          ⭐ 按
          <lah-button
            v-b-modal.master-pw-modal
            icon="key"
            variant="outline-danger"
            class="mt-n1 mx-1"
            no-icon-gutter
          />
          可進行管理者登入密碼變更（送出時自動轉為 MD5 編碼儲存）
        </div>
        <div class="d-inline-flex align-items-center mb-2">
          ⭐ 各細項修改後按
          <lah-button
            icon="pen-square"
            variant="outline-secondary"
            class="mt-n1 mx-1"
            no-icon-gutter
          />
          可進行個別設定快速更新
        </div>
        <div class="d-inline-flex align-items-center text-muted small">
          ℹ️ 管理者密碼預設值為 <code>034917647</code>，雜湊值為 <code>1f7744350d3dd3dc563421582f37f99e</code>
        </div>
      </lah-help-modal>

      <!-- 管理者密碼變更彈窗 -->
      <b-modal
        id="master-pw-modal"
        ref="masterPwModal"
        title="變更管理者登入密碼"
        hide-footer
        centered
        @hidden="resetMasterPwModal"
      >
        <b-alert show variant="info" class="small mb-3">
          <lah-fa-icon icon="info-circle" class="mr-1" />
          管理者密碼於後端是以 <strong>MD5 雜湊編碼</strong>儲存。<br>
          系統預設密碼為：<code>034917647</code>
        </b-alert>

        <b-form-group label="新管理者密碼：" label-for="input-master-pw">
          <b-input-group>
            <b-input
              id="input-master-pw"
              v-model="masterPasswordInput"
              :type="showNewMasterPass ? 'text' : 'password'"
              placeholder="請輸入新管理者密碼"
              trim
              @keyup.enter="focusConfirmPass"
            />
            <template #append>
              <lah-button
                :icon="showNewMasterPass ? 'eye-slash' : 'eye'"
                variant="outline-secondary"
                title="切換密碼顯示"
                no-icon-gutter
                @click="showNewMasterPass = !showNewMasterPass"
              />
            </template>
          </b-input-group>
        </b-form-group>

        <b-form-group label="確認新密碼：" label-for="input-master-pw-confirm">
          <b-input
            id="input-master-pw-confirm"
            ref="inputMasterPwConfirm"
            v-model="masterPasswordConfirm"
            type="password"
            placeholder="請再次輸入新管理者密碼"
            :state="masterPasswordMatchState"
            trim
            @keyup.enter="canSaveMasterPassword && changeMasterPassword()"
          />
          <b-form-invalid-feedback v-if="masterPasswordConfirm && !masterPasswordsMatch">
            兩次輸入的密碼不一致
          </b-form-invalid-feedback>
        </b-form-group>

        <div v-if="masterPasswordInput" class="mb-3 p-2 bg-light rounded small">
          <span class="text-muted">預計儲存之 MD5 雜湊值：</span><br>
          <code class="text-break">{{ newMasterPasswordHash }}</code>
        </div>

        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
          <lah-button
            icon="undo"
            variant="outline-warning"
            size="sm"
            @click="fillDefaultMasterPassword"
          >
            填入預設 (034917647)
          </lah-button>
          <div>
            <lah-button
              variant="secondary"
              size="sm"
              class="mr-2"
              @click="$bvModal.hide('master-pw-modal')"
            >
              取消
            </lah-button>
            <lah-button
              icon="check"
              variant="danger"
              size="sm"
              :disabled="!canSaveMasterPassword"
              @click="changeMasterPassword"
            >
              確認變更
            </lah-button>
          </div>
        </div>
      </b-modal>
    </lah-header>

    <b-container v-cloak fluid class="py-3">
      <b-row>
        <!-- Card 1: 地政 WEB 資料庫連線設定 (9 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="danger"
            header-text-variant="white"
            border-variant="danger"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="database" class="mr-2" />
                地政 WEB 資料庫連線設定
                <b-badge variant="light" class="ml-auto text-danger">
                  9 項
                </b-badge>
              </h6>
            </template>

            <!-- ORA_DB_USER & ORA_DB_PASS -->
            <b-input-group size="sm" prepend="登入帳密" class="mb-2">
              <b-input
                v-model="loadedConfigs['ORA_DB_USER']"
                placeholder="MOIADM"
                title="登入 DB 帳號 (ORA_DB_USER)"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="loadedConfigs['ORA_DB_PASS']"
                :type="showOraDbPass ? 'text' : 'password'"
                placeholder="登入密碼"
                title="登入 DB 密碼 (ORA_DB_PASS)"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  :icon="showOraDbPass ? 'eye-slash' : 'eye'"
                  variant="outline-secondary"
                  title="顯示/隱藏密碼"
                  no-icon-gutter
                  @click="showOraDbPass = !showOraDbPass"
                />
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({ ORA_DB_USER: loadedConfigs['ORA_DB_USER'], ORA_DB_PASS: loadedConfigs['ORA_DB_PASS'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_TARGET -->
            <b-input-group size="sm" prepend="ＤＢ指向" class="mb-2 d-flex align-items-center">
              <b-form-radio-group
                v-model="loadedConfigs['ORA_DB_TARGET']"
                :options="dbTargetOpts"
                class="my-auto ml-2 font-weight-bold"
              />
            </b-input-group>

            <!-- ORA_DB_HXWEB_IP & ORA_DB_HXWEB_PORT -->
            <b-input-group size="sm" prepend="主要ＤＢ" class="mb-2">
              <b-input
                v-model="loadedConfigs['ORA_DB_HXWEB_IP']"
                placeholder="220.1.34.2"
                title="主要資料庫 IP (ORA_DB_HXWEB_IP)"
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
                title="主要資料庫 PORT (ORA_DB_HXWEB_PORT)"
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
                  @click="quick({ ORA_DB_HXWEB_IP: loadedConfigs['ORA_DB_HXWEB_IP'], ORA_DB_HXWEB_PORT: loadedConfigs['ORA_DB_HXWEB_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_BACKUP_IP & ORA_DB_BACKUP_PORT -->
            <b-input-group size="sm" prepend="備份ＤＢ" class="mb-2">
              <b-input
                v-model="loadedConfigs['ORA_DB_BACKUP_IP']"
                placeholder="220.1.34.102"
                title="備份資料庫 IP (ORA_DB_BACKUP_IP)"
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
                title="備份資料庫 PORT (ORA_DB_BACKUP_PORT)"
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
                  @click="quick({ ORA_DB_BACKUP_IP: loadedConfigs['ORA_DB_BACKUP_IP'], ORA_DB_BACKUP_PORT: loadedConfigs['ORA_DB_BACKUP_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_HXT_IP & ORA_DB_HXT_PORT -->
            <b-input-group size="sm" prepend="測試ＤＢ" class="mb-1">
              <b-input
                v-model="loadedConfigs['ORA_DB_HXT_IP']"
                placeholder="192.168.17.2"
                title="測試資料庫 IP (ORA_DB_HXT_IP)"
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
                title="測試資料庫 PORT (ORA_DB_HXT_PORT)"
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
                  @click="quick({ ORA_DB_HXT_IP: loadedConfigs['ORA_DB_HXT_IP'], ORA_DB_HXT_PORT: loadedConfigs['ORA_DB_HXT_PORT'] })"
                />
              </template>
            </b-input-group>
          </b-card>
        </b-col>

        <!-- Card 2: 同步異動資料庫連線設定 (7 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="dark"
            header-text-variant="white"
            border-variant="dark"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="server" class="mr-2" />
                同步異動資料庫連線設定
                <b-badge variant="light" class="ml-auto text-dark">
                  7 項
                </b-badge>
              </h6>
            </template>

            <!-- PING_INTERVAL_SECONDS -->
            <b-input-group size="sm" prepend="輪詢間隔" class="mb-2">
              <b-input
                v-model="loadedConfigs['PING_INTERVAL_SECONDS']"
                type="number"
                min="5"
                placeholder="300"
                title="PING 間隔時間(秒) (PING_INTERVAL_SECONDS)"
                :state="validateNumber(loadedConfigs['PING_INTERVAL_SECONDS'])"
                trim
              />
              <b-input-group-append is-text>
                秒
              </b-input-group-append>
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="numNotOK(loadedConfigs['PING_INTERVAL_SECONDS'])"
                  no-icon-gutter
                  @click="quick({ PING_INTERVAL_SECONDS: loadedConfigs['PING_INTERVAL_SECONDS'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_L1HWEB_IP & ORA_DB_L1HWEB_PORT -->
            <b-input-group size="sm" prepend="Ｌ１ＤＢ" class="mb-2">
              <b-input
                v-model="loadedConfigs['ORA_DB_L1HWEB_IP']"
                placeholder="220.1.33.2"
                title="L1HWEB 一所資料庫 IP (ORA_DB_L1HWEB_IP)"
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
                title="L1HWEB 資料庫 PORT (ORA_DB_L1HWEB_PORT)"
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
                  @click="quick({ ORA_DB_L1HWEB_IP: loadedConfigs['ORA_DB_L1HWEB_IP'], ORA_DB_L1HWEB_PORT: loadedConfigs['ORA_DB_L1HWEB_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_L2HWEB_IP & ORA_DB_L2HWEB_PORT -->
            <b-input-group size="sm" prepend="Ｌ２ＤＢ" class="mb-2">
              <b-input
                v-model="loadedConfigs['ORA_DB_L2HWEB_IP']"
                placeholder="220.1.33.3"
                title="L2HWEB 二所資料庫 IP (ORA_DB_L2HWEB_IP)"
                class="mr-1"
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
                title="L2HWEB 資料庫 PORT (ORA_DB_L2HWEB_PORT)"
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
                  @click="quick({ ORA_DB_L2HWEB_IP: loadedConfigs['ORA_DB_L2HWEB_IP'], ORA_DB_L2HWEB_PORT: loadedConfigs['ORA_DB_L2HWEB_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- ORA_DB_L3HWEB_IP & ORA_DB_L3HWEB_PORT -->
            <b-input-group size="sm" prepend="Ｌ３ＤＢ" class="mb-1">
              <b-input
                v-model="loadedConfigs['ORA_DB_L3HWEB_IP']"
                placeholder="220.1.33.5"
                title="L3HWEB 三所資料庫 IP (ORA_DB_L3HWEB_IP)"
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
                title="L3HWEB 資料庫 PORT (ORA_DB_L3HWEB_PORT)"
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
                  @click="quick({ ORA_DB_L3HWEB_IP: loadedConfigs['ORA_DB_L3HWEB_IP'], ORA_DB_L3HWEB_PORT: loadedConfigs['ORA_DB_L3HWEB_PORT'] })"
                />
              </template>
            </b-input-group>
          </b-card>
        </b-col>

        <!-- Card 3: 事務所與地政 WEB AP 設定 (6 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="primary"
            header-text-variant="white"
            border-variant="primary"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="feather-alt" class="mr-2" />
                事務所與地政 WEB AP 設定
                <b-badge variant="light" class="ml-auto text-primary">
                  6 項
                </b-badge>
              </h6>
            </template>

            <!-- SITE -->
            <b-input-group size="sm" prepend="本所代碼" class="mb-2">
              <b-input
                v-model="loadedConfigs['SITE']"
                v-b-popover.hover.focus.top="site !== loadedConfigs['SITE'] ? `系統偵測到所別為: ${site} (${apiSvrIp})` : ''"
                placeholder="HA"
                title="本所代碼 (SITE)"
                :state="site === loadedConfigs['SITE']"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({ SITE: loadedConfigs['SITE'] })"
                />
              </template>
            </b-input-group>

            <!-- SITE_ID -->
            <b-input-group size="sm" prepend="本所統編" class="mb-2">
              <b-input
                v-model="loadedConfigs['SITE_ID']"
                type="number"
                placeholder="43504044"
                title="本所統一編號 (SITE_ID)"
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
                  @click="quick({ SITE_ID: loadedConfigs['SITE_ID'] })"
                />
              </template>
            </b-input-group>

            <!-- WEBAP_IP -->
            <b-input-group size="sm" prepend="跨所ＡＰ" class="mb-2">
              <b-input
                v-model="loadedConfigs['WEBAP_IP']"
                placeholder="220.1.34.161"
                title="跨縣市地政 WEB 版伺服器 IP (WEBAP_IP)"
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
                  @click="quick({ WEBAP_IP: loadedConfigs['WEBAP_IP'] })"
                />
              </template>
            </b-input-group>

            <!-- WEBAP_POSTFIXES -->
            <b-input-group size="sm" prepend="監控ＡＰ" class="mb-2">
              <b-input
                v-model="loadedConfigs['WEBAP_POSTFIXES']"
                placeholder="輸入 IPv4 最後一碼，逗號分隔 (如: 205,206,207...)"
                title="欲監控之地政 WEB 版 AP IPv4 最後一碼 (WEBAP_POSTFIXES)"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="$utils.empty(loadedConfigs['WEBAP_POSTFIXES'])"
                  no-icon-gutter
                  @click="quick({ WEBAP_POSTFIXES: loadedConfigs['WEBAP_POSTFIXES'] })"
                />
              </template>
            </b-input-group>

            <!-- WEBAP_JNDI_LOCAL -->
            <b-input-group size="sm" prepend="本地JNDI" class="mb-2">
              <b-input
                v-model="loadedConfigs['WEBAP_JNDI_LOCAL']"
                type="number"
                min="1"
                placeholder="3000"
                title="本地 JNDI 連線數門檻 (WEBAP_JNDI_LOCAL)"
                :state="validateNumber(loadedConfigs['WEBAP_JNDI_LOCAL'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="numNotOK(loadedConfigs['WEBAP_JNDI_LOCAL'])"
                  no-icon-gutter
                  @click="quick({ WEBAP_JNDI_LOCAL: loadedConfigs['WEBAP_JNDI_LOCAL'] })"
                />
              </template>
            </b-input-group>

            <!-- WEBAP_JNDI_XALOCAL -->
            <b-input-group size="sm" prepend="跨所JNDI" class="mb-1">
              <b-input
                v-model="loadedConfigs['WEBAP_JNDI_XALOCAL']"
                type="number"
                min="1"
                placeholder="1250"
                title="跨所 JNDI 連線數門檻 (WEBAP_JNDI_XALOCAL)"
                :state="validateNumber(loadedConfigs['WEBAP_JNDI_XALOCAL'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="numNotOK(loadedConfigs['WEBAP_JNDI_XALOCAL'])"
                  no-icon-gutter
                  @click="quick({ WEBAP_JNDI_XALOCAL: loadedConfigs['WEBAP_JNDI_XALOCAL'] })"
                />
              </template>
            </b-input-group>
          </b-card>
        </b-col>

        <!-- Card 4: 本機伺服器與推播服務設定 (5 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="info"
            header-text-variant="white"
            border-variant="info"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="network-wired" class="mr-2" />
                本機伺服器與推播服務設定
                <b-badge variant="light" class="ml-auto text-info">
                  5 項
                </b-badge>
              </h6>
            </template>

            <!-- API_SERVER_IP & API_SERVER_PORT -->
            <b-input-group size="sm" prepend="ＡＰＩ伺服器" class="mb-2">
              <b-input
                v-model="loadedConfigs['API_SERVER_IP']"
                placeholder="220.1.34.75"
                title="API 伺服器 IP (API_SERVER_IP)"
                class="mr-1"
                :state="validateIp(loadedConfigs['API_SERVER_IP'])"
                trim
              />
              :
              <b-input
                v-model="loadedConfigs['API_SERVER_PORT']"
                type="number"
                min="1"
                max="65535"
                placeholder="80"
                title="API 伺服器 PORT (API_SERVER_PORT)"
                class="col-3 ml-1"
                :state="validateNumber(loadedConfigs['API_SERVER_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="ipNotOK(loadedConfigs['API_SERVER_IP']) || numNotOK(loadedConfigs['API_SERVER_PORT'])"
                  no-icon-gutter
                  @click="quick({ API_SERVER_IP: loadedConfigs['API_SERVER_IP'], API_SERVER_PORT: loadedConfigs['API_SERVER_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- WS_SERVER_IP & WS_SERVER_PORT -->
            <b-input-group size="sm" prepend="推播伺服器" class="mb-2">
              <b-input
                v-model="loadedConfigs['WS_SERVER_IP']"
                placeholder="220.1.34.75"
                title="WebSocket 推播伺服器 IP (WS_SERVER_IP)"
                class="mr-1"
                :state="validateIp(loadedConfigs['WS_SERVER_IP'])"
                trim
              />
              :
              <b-input
                v-model="loadedConfigs['WS_SERVER_PORT']"
                type="number"
                min="1"
                max="65535"
                placeholder="8081"
                title="WebSocket 推播伺服器 PORT (WS_SERVER_PORT)"
                class="col-3 ml-1"
                :state="validateNumber(loadedConfigs['WS_SERVER_PORT'])"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="ipNotOK(loadedConfigs['WS_SERVER_IP']) || numNotOK(loadedConfigs['WS_SERVER_PORT'])"
                  no-icon-gutter
                  @click="quick({ WS_SERVER_IP: loadedConfigs['WS_SERVER_IP'], WS_SERVER_PORT: loadedConfigs['WS_SERVER_PORT'] })"
                />
              </template>
            </b-input-group>

            <!-- WS_DB_PATH -->
            <b-input-group size="sm" prepend="即時通ＤＢ" class="mb-1">
              <b-input
                v-model="loadedConfigs['WS_DB_PATH']"
                placeholder="d:\DEV\lah-messenger-server\db"
                title="通知與即時通伺服器 DB 存放路徑 (WS_DB_PATH)"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="$utils.empty(loadedConfigs['WS_DB_PATH'])"
                  no-icon-gutter
                  @click="quick({ WS_DB_PATH: loadedConfigs['WS_DB_PATH'] })"
                />
              </template>
            </b-input-group>
          </b-card>
        </b-col>

        <!-- Card 5: 監控郵件與印表機設定 (6 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="warning"
            header-text-variant="dark"
            border-variant="warning"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="envelope-open-text" class="mr-2" />
                監控郵件與印表機設定
                <b-badge variant="dark" class="ml-auto text-warning">
                  6 項
                </b-badge>
              </h6>
            </template>

            <!-- MONITOR_MAIL_METHOD -->
            <b-input-group size="sm" prepend="收信協定" class="mb-2">
              <b-form-select
                v-model="loadedConfigs['MONITOR_MAIL_METHOD']"
                :options="mailMethodOpts"
                size="sm"
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({ MONITOR_MAIL_METHOD: loadedConfigs['MONITOR_MAIL_METHOD'] })"
                />
              </template>
            </b-input-group>

            <!-- MONITOR_MAIL_HOST -->
            <b-input-group size="sm" prepend="郵件主機" class="mb-2">
              <b-input
                v-model="loadedConfigs['MONITOR_MAIL_HOST']"
                placeholder="220.1.34.50"
                title="郵件主機 IP 或網域名稱 (MONITOR_MAIL_HOST)"
                trim
              />
              <template #append>
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  :disabled="$utils.empty(loadedConfigs['MONITOR_MAIL_HOST'])"
                  no-icon-gutter
                  @click="quick({ MONITOR_MAIL_HOST: loadedConfigs['MONITOR_MAIL_HOST'] })"
                />
              </template>
            </b-input-group>

            <!-- MONITOR_MAIL_ACCOUNT & MONITOR_MAIL_PASSWORD -->
            <b-input-group size="sm" prepend="郵件帳密" class="mb-2">
              <b-input
                v-model="loadedConfigs['MONITOR_MAIL_ACCOUNT']"
                placeholder="hamonitor"
                title="郵件帳號 (MONITOR_MAIL_ACCOUNT)"
                class="mr-1"
                trim
              />
              /
              <b-input
                v-model="loadedConfigs['MONITOR_MAIL_PASSWORD']"
                :type="showMailPass ? 'text' : 'password'"
                placeholder="郵件密碼"
                title="郵件密碼 (MONITOR_MAIL_PASSWORD)"
                class="ml-1"
                trim
              />
              <template #append>
                <lah-button
                  :icon="showMailPass ? 'eye-slash' : 'eye'"
                  variant="outline-secondary"
                  title="顯示/隱藏密碼"
                  no-icon-gutter
                  @click="showMailPass = !showMailPass"
                />
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({ MONITOR_MAIL_ACCOUNT: loadedConfigs['MONITOR_MAIL_ACCOUNT'], MONITOR_MAIL_PASSWORD: loadedConfigs['MONITOR_MAIL_PASSWORD'] })"
                />
              </template>
            </b-input-group>

            <!-- MONITOR_MAIL_SSL -->
            <div class="d-flex align-items-center mb-2 px-1">
              <b-form-checkbox
                v-model="loadedConfigs['MONITOR_MAIL_SSL']"
                value="true"
                unchecked-value="false"
                switch
                class="my-auto font-weight-bold"
                @change="quick({ MONITOR_MAIL_SSL: loadedConfigs['MONITOR_MAIL_SSL'] })"
              >
                啟用郵件 SSL 連線 (MONITOR_MAIL_SSL)
              </b-form-checkbox>
            </div>

            <!-- MONITOR_PRINTERS -->
            <div class="p-2 border rounded bg-light">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="font-weight-bold small text-secondary">
                  <lah-fa-icon icon="print" class="mr-1" />
                  監控印表機節點 ({{ parsedPrinters.length }} 台)
                </span>
                <div>
                  <b-button
                    variant="outline-primary"
                    size="sm"
                    class="py-0 px-2 mr-1"
                    title="開啟視覺化節點設定對話框"
                    @click="openPrinterModal"
                  >
                    <lah-fa-icon icon="cog" size="sm" class="mr-1" />節點管理
                  </b-button>
                  <b-button
                    variant="outline-secondary"
                    size="sm"
                    class="py-0 px-2"
                    title="展開/收合原始 JSON 編輯"
                    @click="showPrinterRawJson = !showPrinterRawJson"
                  >
                    <lah-fa-icon icon="code" size="sm" class="mr-1" />JSON
                  </b-button>
                </div>
              </div>

              <!-- 節點清單徽章 -->
              <div v-if="parsedPrinters.length > 0" class="d-flex flex-wrap pt-1">
                <b-badge
                  v-for="(p, pidx) in parsedPrinters"
                  :key="pidx"
                  variant="info"
                  class="mr-1 mb-1 p-1 font-weight-normal font-monospace"
                >
                  {{ p.ip }}:{{ p.port }}
                </b-badge>
              </div>
              <div v-else class="text-muted small pt-1">
                尚未設定任何監控印表機節點
              </div>

              <!-- 原始 JSON 編輯折疊區 -->
              <b-collapse v-model="showPrinterRawJson" class="mt-2 pt-2 border-top">
                <b-form-textarea
                  v-model="rawPrinterJsonInput"
                  rows="3"
                  size="sm"
                  placeholder="請輸入合法 JSON 陣列字串"
                  class="font-monospace small"
                  :state="validatePrinterJson(rawPrinterJsonInput)"
                />
                <div class="d-flex justify-content-between align-items-center mt-1">
                  <small :class="validatePrinterJson(rawPrinterJsonInput) ? 'text-success' : 'text-danger'">
                    {{ validatePrinterJson(rawPrinterJsonInput) ? '✓ JSON 語法正確' : '✗ JSON 語法錯誤或非陣列' }}
                  </small>
                  <lah-button
                    icon="pen-square"
                    variant="outline-primary"
                    size="sm"
                    :disabled="validatePrinterJson(rawPrinterJsonInput) === false"
                    @click="saveRawPrinterJson"
                  >
                    儲存 JSON
                  </lah-button>
                </div>
              </b-collapse>
            </div>
          </b-card>
        </b-col>

        <!-- Card 6: 系統管理金鑰 (2 項) -->
        <b-col cols="12" md="6" lg="4" class="mb-4">
          <b-card
            header-bg-variant="secondary"
            header-text-variant="white"
            border-variant="secondary"
            class="h-100 shadow-sm"
          >
            <template #header>
              <h6 class="my-auto font-weight-bold d-flex align-items-center">
                <lah-fa-icon icon="shield-alt" class="mr-2" />
                系統管理金鑰
                <b-badge variant="light" class="ml-auto text-secondary">
                  2 項
                </b-badge>
              </h6>
            </template>

            <!-- API_KEY -->
            <b-input-group size="sm" prepend="ＡＰＩ金鑰" class="mb-2">
              <b-input
                v-model="loadedConfigs['API_KEY']"
                placeholder="32 碼 MD5 雜湊金鑰"
                title="API 金鑰 (API_KEY)"
                class="font-monospace"
                trim
              />
              <template #append>
                <lah-button
                  icon="copy"
                  regular
                  variant="outline-secondary"
                  title="複製金鑰"
                  no-icon-gutter
                  @click="copyApiKey"
                />
                <lah-button
                  icon="sync-alt"
                  variant="outline-info"
                  title="重新生成隨機金鑰"
                  no-icon-gutter
                  @click="regenerateApiKey"
                />
                <lah-button
                  icon="pen-square"
                  variant="outline-secondary"
                  title="立即寫入設定"
                  no-icon-gutter
                  @click="quick({ API_KEY: loadedConfigs['API_KEY'] })"
                />
              </template>
            </b-input-group>

            <!-- MASTER_PASSWORD -->
            <b-input-group size="sm" prepend="管理者密碼" class="mb-1">
              <b-input
                :value="masterPasswordDisplayValue"
                readonly
                class="bg-light font-monospace"
                title="管理者密碼雜湊值 (MASTER_PASSWORD)"
              />
              <template #append>
                <lah-button
                  :icon="showMasterPassHash ? 'eye-slash' : 'eye'"
                  variant="outline-secondary"
                  :title="showMasterPassHash ? '隱藏雜湊值' : '檢視完整 MD5 雜湊值'"
                  no-icon-gutter
                  @click="showMasterPassHash = !showMasterPassHash"
                />
                <lah-button
                  v-b-modal.master-pw-modal
                  icon="key"
                  variant="outline-danger"
                  title="變更管理者密碼"
                  no-icon-gutter
                />
                <lah-button
                  v-if="!isDefaultMasterPassword"
                  icon="undo"
                  variant="outline-warning"
                  title="還原為預設密碼 (034917647)"
                  no-icon-gutter
                  @click="resetToDefaultMasterPassword"
                />
              </template>
            </b-input-group>
            <div class="d-flex justify-content-between align-items-center mt-1 px-1">
              <span class="small text-muted">
                狀態：
                <b-badge :variant="isDefaultMasterPassword ? 'success' : 'warning'">
                  {{ isDefaultMasterPassword ? '使用預設密碼 (034917647)' : '已自訂管理者密碼' }}
                </b-badge>
              </span>
              <small class="text-muted">以 MD5 雜湊儲存</small>
            </div>
          </b-card>
        </b-col>
      </b-row>
    </b-container>

    <!-- 視覺化印表機監控節點設定彈窗 -->
    <lah-monitor-board-printer-setup-modal ref="printerSetupModal" />
  </div>
</template>

<script>
import lahTransition from '~/components/lah-transition.vue'
import LahMonitorBoardPrinterSetupModal from '~/components/lah-monitor-board-printer-setup-modal.vue'

// 預設管理者密碼與 MD5 雜湊
const DEFAULT_MASTER_PASSWORD = '034917647'
const DEFAULT_MASTER_PASSWORD_HASH = '1f7744350d3dd3dc563421582f37f99e'

// 指定維護的 35 項設定鍵白名單
const MANAGED_CONFIG_KEYS = [
  'API_KEY',
  'ORA_DB_HXWEB_IP',
  'ORA_DB_HXWEB_PORT',
  'ORA_DB_L3HWEB_IP',
  'ORA_DB_L3HWEB_PORT',
  'ORA_DB_HXT_IP',
  'ORA_DB_HXT_PORT',
  'ORA_DB_L1HWEB_IP',
  'ORA_DB_L1HWEB_PORT',
  'ORA_DB_L2HWEB_IP',
  'ORA_DB_L2HWEB_PORT',
  'ORA_DB_BACKUP_IP',
  'ORA_DB_BACKUP_PORT',
  'MASTER_PASSWORD',
  'PING_INTERVAL_SECONDS',
  'SITE_ID',
  'WEBAP_IP',
  'SITE',
  'API_SERVER_IP',
  'API_SERVER_PORT',
  'WS_SERVER_IP',
  'WS_SERVER_PORT',
  'WEBAP_POSTFIXES',
  'MONITOR_MAIL_METHOD',
  'MONITOR_MAIL_HOST',
  'MONITOR_MAIL_ACCOUNT',
  'MONITOR_MAIL_PASSWORD',
  'MONITOR_MAIL_SSL',
  'ORA_DB_USER',
  'ORA_DB_PASS',
  'WS_DB_PATH',
  'MONITOR_PRINTERS',
  'WEBAP_JNDI_LOCAL',
  'WEBAP_JNDI_XALOCAL',
  'ORA_DB_TARGET'
]

export default {
  components: {
    lahTransition,
    LahMonitorBoardPrinterSetupModal
  },
  middleware: ['isAdmin'],
  fetchOnServer: true,
  data: () => ({
    loadedConfigs: {},
    message: '',
    // 密碼彈窗
    masterPasswordInput: '',
    masterPasswordConfirm: '',
    showNewMasterPass: false,
    // 顯示切換
    showOraDbPass: false,
    showMailPass: false,
    showMasterPassHash: false,
    // 印表機原始 JSON 編輯
    showPrinterRawJson: false,
    rawPrinterJsonInput: '',
    // 下拉選單選項
    dbTargetOpts: [
      { text: '主要 (HXWEB)', value: 'HXWEB' },
      { text: '備份 (BACKUP)', value: 'BACKUP' },
      { text: '測試 (HXT)', value: 'HXT' }
    ],
    mailMethodOpts: [
      { text: 'IMAP', value: 'imap' },
      { text: 'POP3', value: 'pop3' }
    ]
  }),
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
      type: 'configs'
    })
    this.loadedConfigs = { ...data.raw }
    this.rawPrinterJsonInput = this.loadedConfigs.MONITOR_PRINTERS || '[]'
    this.message = data.message
  },
  head: {
    title: '系統設定管理-桃園市地政局'
  },
  computed: {
    isDefaultMasterPassword () {
      return this.loadedConfigs.MASTER_PASSWORD === DEFAULT_MASTER_PASSWORD_HASH
    },
    masterPasswordDisplayValue () {
      if (this.showMasterPassHash) {
        return this.loadedConfigs.MASTER_PASSWORD || ''
      }
      if (this.isDefaultMasterPassword) {
        return `${DEFAULT_MASTER_PASSWORD} (預設密碼)`
      }
      const hash = this.loadedConfigs.MASTER_PASSWORD || ''
      return hash.length > 8 ? `${hash.substring(0, 4)}••••••••••••••••${hash.substring(hash.length - 4)}` : '••••••••'
    },
    newMasterPasswordHash () {
      return this.$utils.empty(this.masterPasswordInput) ? '' : this.$utils.md5(this.masterPasswordInput)
    },
    masterPasswordsMatch () {
      return this.masterPasswordInput === this.masterPasswordConfirm
    },
    masterPasswordMatchState () {
      if (this.$utils.empty(this.masterPasswordConfirm)) {
        return null
      }
      return this.masterPasswordsMatch
    },
    canSaveMasterPassword () {
      return !this.$utils.empty(this.masterPasswordInput) && this.masterPasswordsMatch
    },
    parsedPrinters () {
      try {
        const val = this.loadedConfigs.MONITOR_PRINTERS
        if (!val) { return [] }
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        return []
      }
    }
  },
  watch: {
    'loadedConfigs.ORA_DB_TARGET' (val, oldVal) {
      if (oldVal && val !== oldVal) {
        this.quick({ ORA_DB_TARGET: val }, false)
        this.clearCache()
      }
    },
    '$store.state.systemConfigs.monitor_printers' (val) {
      if (val !== undefined && val !== this.loadedConfigs.MONITOR_PRINTERS) {
        this.$set(this.loadedConfigs, 'MONITOR_PRINTERS', val)
        this.rawPrinterJsonInput = val
      }
    }
  },
  methods: {
    validateIp (ip) {
      return this.$utils.isIPv4(ip) === true ? null : false
    },
    validateNumber (val) {
      const pval = parseInt(val)
      return (!isNaN(pval) && pval > 0) ? null : false
    },
    ipNotOK (ip) {
      return !this.$utils.isIPv4(ip)
    },
    numNotOK (val) {
      const pval = parseInt(val)
      return isNaN(pval) || pval <= 0 || this.$utils.empty(val)
    },
    validatePrinterJson (str) {
      try {
        const parsed = JSON.parse(str)
        return Array.isArray(parsed)
      } catch (e) {
        return false
      }
    },
    reloadConfigs () {
      this.isBusy = true
      this.$fetch().then(() => {
        this.notify('系統設定值重新整理完成', { type: 'success' })
      }).catch((e) => {
        this.$utils.error(e)
      }).finally(() => {
        this.isBusy = false
      })
    },
    update () {
      this.confirm('確定要更新全部 35 項系統設定值？')
        .then((answer) => {
          if (answer) {
            this.isBusy = true
            const payload = {}
            MANAGED_CONFIG_KEYS.forEach((key) => {
              if (this.loadedConfigs[key] !== undefined) {
                payload[key] = this.loadedConfigs[key]
              }
            })
            this.quick(payload)
          }
        })
    },
    quick (configs, notify = true) {
      return this.post(this.$consts.API.JSON.QUERY, {
        type: 'update_configs',
        configs
      }).then((data) => {
        const notifyOpts = { type: 'warning', subtitle: `${Object.keys(configs).length} 筆設定更新` }
        if (this.$utils.statusCheck(data.status)) {
          notifyOpts.type = 'success'
          if (Object.keys(configs).includes('MONITOR_PRINTERS')) {
            const currentConfigs = { ...this.systemConfigs }
            currentConfigs.monitor_printers = configs.MONITOR_PRINTERS
            this.$store.commit('systemConfigs', currentConfigs)
          }
        }
        notify && this.notify(data.message, notifyOpts)
        return data
      }).catch((error) => {
        this.$utils.error(error)
      }).finally(() => {
        this.isBusy = false
      })
    },
    copyApiKey () {
      const key = this.loadedConfigs.API_KEY || ''
      if (this.$utils.empty(key)) {
        this.notify('API 金鑰為空，無法複製', { type: 'warning' })
        return
      }
      this.copyToClipboard(key, '已複製 API 金鑰至剪貼簿').then((ok) => {
        if (!ok) {
          this.notify('瀏覽器不支援自動複製，請手動複製', { type: 'warning' })
        }
      })
    },
    regenerateApiKey () {
      this.confirm('確定要重新生成隨機 API 金鑰？生成後需點擊儲存寫入設定。')
        .then((answer) => {
          if (answer) {
            const seed = `${Date.now()}_${Math.random()}_${this.myid || 'LAH'}`
            this.$set(this.loadedConfigs, 'API_KEY', this.$utils.md5(seed))
            this.notify('已生成新 API 金鑰，請點擊儲存按鈕寫入設定', { type: 'info' })
          }
        })
    },
    resetToDefaultMasterPassword () {
      this.confirm(`確定要將管理者密碼還原為預設值「${DEFAULT_MASTER_PASSWORD}」？`)
        .then((answer) => {
          if (answer) {
            this.$set(this.loadedConfigs, 'MASTER_PASSWORD', DEFAULT_MASTER_PASSWORD_HASH)
            this.quick({ MASTER_PASSWORD: DEFAULT_MASTER_PASSWORD_HASH }).then(() => {
              this.notify(`已還原管理者密碼為預設值「${DEFAULT_MASTER_PASSWORD}」`, { type: 'success' })
            })
          }
        })
    },
    fillDefaultMasterPassword () {
      this.masterPasswordInput = DEFAULT_MASTER_PASSWORD
      this.masterPasswordConfirm = DEFAULT_MASTER_PASSWORD
    },
    focusConfirmPass () {
      this.$refs.inputMasterPwConfirm && this.$refs.inputMasterPwConfirm.focus()
    },
    changeMasterPassword () {
      if (!this.canSaveMasterPassword) {
        this.notify('請輸入完整且相符的管理者密碼', { type: 'warning' })
        return
      }
      const hash = this.newMasterPasswordHash
      this.$set(this.loadedConfigs, 'MASTER_PASSWORD', hash)
      this.quick({ MASTER_PASSWORD: hash }).then(() => {
        this.notify('管理者密碼更新成功', { type: 'success' })
        this.$bvModal.hide('master-pw-modal')
      })
    },
    resetMasterPwModal () {
      this.masterPasswordInput = ''
      this.masterPasswordConfirm = ''
      this.showNewMasterPass = false
    },
    openPrinterModal () {
      this.$refs.printerSetupModal && this.$refs.printerSetupModal.show()
    },
    saveRawPrinterJson () {
      if (!this.validatePrinterJson(this.rawPrinterJsonInput)) {
        this.notify('JSON 格式無效，請輸入合法陣列字串', { type: 'danger' })
        return
      }
      // 壓縮格式化 JSON
      const compactJson = JSON.stringify(JSON.parse(this.rawPrinterJsonInput))
      this.$set(this.loadedConfigs, 'MONITOR_PRINTERS', compactJson)
      this.rawPrinterJsonInput = compactJson
      this.quick({ MONITOR_PRINTERS: compactJson }).then(() => {
        this.showPrinterRawJson = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-configs-page {
  min-width: 1024px;
}
.font-monospace {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.card-header h6 {
  margin-bottom: 0;
}
</style>
