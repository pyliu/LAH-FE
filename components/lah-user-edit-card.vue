<template lang="pug">
  //- 只有在找到使用者且有權限時才顯示編輯卡片
  b-card(v-if="found && isAuthorized" body-border-variant="danger")

    //- ==========================================
    //- 1. 核心帳號與權限設定區塊
    //- ==========================================
    b-card-group(deck)
      //- 帳號 (唯讀，不可修改)
      b-card.border-0(no-body): b-form-group(
        label="帳號"
        label-for="id-input"
        label-cols-sm="2"
        label-size="md"
      ): b-input(
        id="id-input"
        v-model="userData['id']"
        :formatter="formatter"
        disabled
        trim
      )
      //- 權限 Checkbox Group
      b-card.border-0(no-body)
        b-form-group(
          label="權限"
          label-for="ext-input"
          label-cols-sm="2"
          label-size="md"
        ): b-checkbox-group(
          v-model="authorities"
          :options="authOpts"
        )

    //- ==========================================
    //- 2. 基本資料區塊 (姓名、IP)
    //- ==========================================
    b-card-group(deck)
      //- 姓名 (必填驗證)
      b-card.border-0(no-body): b-form-group(
        label="姓名"
        label-for="name-input"
        label-cols-sm="2"
        label-size="md"
      ): b-input(
        id="name-input"
        v-model="userData['name']"
        :state="checkName"
        :disabled="isDisabled"
        trim
      )
      //- 電腦 IP (格式驗證)
      b-card.border-0(no-body): b-form-group(
        label="電腦"
        label-for="ip-input"
        label-cols-sm="2"
        label-size="md"
      ): b-input(
        id="ip-input"
        v-model="userData['ip']"
        :state="checkIp"
        :disabled="isDisabled"
        trim
      )

    //- ==========================================
    //- 3. 分類資料區塊 (性別、課室)
    //- ==========================================
    b-card-group(deck)
      b-card.border-0(no-body)
        b-form-group(
          label="性別"
          label-for="sex-select"
          label-cols-sm="2"
          label-size="md"
        ): b-select(
          id="sex-select"
          v-model="userData['sex']"
          :options="sexOpts"
          :disabled="isDisabled"
        )
      b-card.border-0(no-body)
        b-form-group(
          label="課室"
          label-for="unit-select"
          label-cols-sm="2"
          label-size="md"
        ): b-select(
          id="unit-select"
          v-model="userData['unit']"
          :options="unitOpts"
          :disabled="isDisabled"
        )

    //- ==========================================
    //- 4. 擴充資訊顯示切換開關
    //- ==========================================
    .d-flex.justify-content-end.mb-2.toogle-block(
      @click="showOthers = !showOthers"
      style="cursor: pointer"
      title="切換其他欄位顯示"
    )
      .mr-1 {{ showOthers ? '隱藏其他資訊欄位' : '顯示其他資訊欄位' }}
      lah-fa-icon(
        :icon="showOthers ? 'angle-double-up' : 'angle-double-down'"
        :action="showOthers ? 'move-fade-btt' : 'move-fade-ttb'"
      )

    //- ==========================================
    //- 5. 擴充資訊區塊 (包含較少更動的欄位)
    //- ==========================================
    lah-transition(zoom): .p-4.optional-border(v-show="showOthers")

      //- 第一列：分機、職稱
      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="分機"
            label-for="ext-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input.border-info(
            id="ext-input"
            v-model="userData['ext']"
            :state="checkExt"
            :disabled="isDisabled"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="職稱"
            label-for="work-title-select"
            label-cols-sm="2"
            label-size="md"
          ): b-select.border-info(
            id="work-title-select"
            v-model="userData['title']"
            :options="workTitleOpts"
            :disabled="isDisabled"
          )

      //- 第二列：工作內容、到職日
      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="工作"
            label-for="work-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input.border-info(
            id="work-input"
            v-model="userData['work']"
            placeholder="範例：資訊系統管理"
            :disabled="isDisabled"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="到職"
            label-for="onboard-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="onboard-input"
            v-model="userData['onboard_date']"
            trim
            :state="checkOnboardDate"
            :disabled="isDisabled"
            placeholder="範例：110/06/01"
          )

      //- 第三列：生日、手機
      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="生日"
            label-for="bd-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="bd-input"
            v-model="userData['birthday']"
            :state="checkBirthday"
            :disabled="isDisabled"
            placeholder="範例：066/05/23"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="手機"
            label-for="cell-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="cell-input"
            v-model="userData['cell']"
            :state="checkCell"
            :disabled="isDisabled"
            trim
          )

      //- 第四列：考試、學歷
      b-card-group(deck)
        b-card.border-0(no-body)
          b-form-group(
            label="考試"
            label-for="exam-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="exam-input"
            v-model="userData['exam']"
            placeholder="範例：107年資訊處理高考三級"
            :disabled="isDisabled"
            trim
          )
        b-card.border-0(no-body)
          b-form-group(
            label="教育"
            label-for="edu-input"
            label-cols-sm="2"
            label-size="md"
          ): b-input(
            id="edu-input"
            v-model="userData['education']"
            placeholder="範例：台北科技大學資訊工程研究所"
            :disabled="isDisabled"
            trim
          )

    hr

    //- ==========================================
    //- 6. 底部操作按鈕區
    //- ==========================================
    b-button-group.d-flex.justify-content-between
      lah-button(
        icon="save"
        :variant="saveButtonVariant"
        @click="save"
        :disabled="saveButtonDisabled"
      ) 儲存變更
      lah-button(
        icon="user-circle"
        regular
        v-if="!isDisabled"
        variant="info"
        v-b-modal.upload-user-img-modal
      ) 上傳圖檔

    hr

    //- 即時預覽卡片
    lah-user-card(
      :raw="[userData]"
      @click="!isDisabled && showModalById('upload-user-img-modal')"
      no-edit-button
    )

    //- ==========================================
    //- 7. 圖片上傳 Modal
    //- ==========================================
    b-modal(
      id="upload-user-img-modal"
      :title="`更新 ${userData.id} ${userData.name} 照片`"
      size="sm"
      centered
      hide-footer
      scrollable
    )
      //- 生活照上傳
      b-form-group(
        label="照片"
        label-for="file-user-photo"
        label-cols-sm="2"
        label-size="md"
        title="*.jpg"
      ): b-input-group(id="file-user-photo" size="md")
        b-file(
          ref="file-user-photo"
          v-model="userPhoto"
          placeholder="*.jpg"
          drop-placeholder="放開以設定上傳檔案"
          accept="image/jpeg"
        ): template(slot="file-name" slot-scope="{ names }"): b-badge(variant="primary") {{ names[0] }}
        template(#append): lah-button(
          icon="upload"
          variant="outline-primary"
          title="上傳"
          @click="uploadPhoto"
          :disabled="$utils.empty(userPhoto)"
        )

      //- 大頭照上傳
      b-form-group(
        label="頭像"
        label-for="file-user-avatar"
        label-cols-sm="2"
        label-size="md"
        title="請用正方形比例之大頭照"
      ): b-input-group(id="file-user-avatar" size="md")
        b-file(
          ref="file-user-avatar"
          v-model="userAvatar"
          placeholder="*.jpg"
          drop-placeholder="放開以設定上傳檔案"
          accept="image/jpeg"
        ): template(slot="file-name" slot-scope="{ names }"): b-badge(variant="secondary") {{ names[0] }}
        template(#append): lah-button(
          icon="upload"
          variant="outline-primary"
          @click="uploadAvatar"
          title="上傳"
          :disabled="$utils.empty(userAvatar)"
        )
</template>

<script>
import userBase from '~/mixins/lah-user-base.js';

/**
 * @component LahUserEditCard
 * @description 使用者資料編輯卡片，提供基本資料修改、權限設定及圖片上傳功能。
 * 繼承自 userBase mixin。
 */
export default {
  name: 'LahUserEditCard',
  mixins: [userBase],
  data: () => ({
    userPhoto: null,
    userAvatar: null,
    showOthers: false, // 控制是否顯示擴充欄位
    authorities: [] // 用於綁定 Checkbox Group 的權限陣列
  }),
  computed: {
    /**
     * 檢查當前使用者是否有編輯權限 (系統管理員或人事管理員)
     */
    isAuthorized () { return this.authority.isAdmin || this.authority.isUserMgtStaff },

    /**
     * 檢查所有必填欄位是否均已合法
     * @returns {Boolean}
     */
    checkRequired () {
      return this.checkName === true &&
             this.checkIp === true &&
             this.checkOnboardDate !== false &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },

    /**
     * 檢查資料是否被修改過
     * @returns {Boolean}
     */
    modified () {
      return !this.$utils.equal(this.userData, this.origUserData)
    },

    // --- 各欄位驗證邏輯 ---

    checkId () {
      if (this.$utils.empty(this.userData.id) || this.userData.id.length < 6) {
        return false
      }
      return true
    },
    checkName () {
      return !this.$utils.empty(this.userData.name) && this.userData.name.length > 1
    },
    checkIp () {
      // 支援 IPv4 格式或 localhost 的 IPv6 表示法
      return this.$utils.isIPv4(this.userData.ip) || this.userData.ip === '::1'
    },
    checkExt () {
      if (this.$utils.empty(this.userData.ext)) {
        return null // 空值不報錯 (選填)
      }
      // 驗證 3-4 位數字
      const regex = new RegExp('^\\d{3,4}$', 'gm')
      return Boolean(this.userData.ext.match(regex))
    },
    checkBirthday () {
      if (this.$utils.empty(this.userData.birthday)) {
        return null
      }
      // 驗證民國格式: 066/05/23
      const regex = new RegExp('^\\d{3,4}/\\d{1,2}/\\d{1,2}$', 'gm')
      return Boolean(this.userData.birthday.match(regex))
    },
    checkCell () {
      if (this.$utils.empty(this.userData.cell)) {
        return null
      }
      // 驗證台灣手機格式 09xxxxxxxx
      const regex = new RegExp('^0\\d{9}$', 'gm')
      return Boolean(this.userData.cell.match(regex))
    },
    checkOnboardDate () {
      if (this.$utils.empty(this.userData.onboard_date)) {
        return null
      }
      const regex = new RegExp('^\\d{3,4}/\\d{1,2}/\\d{1,2}$', 'gm')
      return Boolean(this.userData.onboard_date.match(regex))
    },

    // --- UI 狀態 ---

    saveButtonVariant () {
      return this.saveButtonDisabled ? 'secondary' : 'outline-success'
    },
    saveButtonDisabled () {
      // 只有在資料有變更且通過驗證時才啟用按鈕
      if (this.modified && this.checkRequired) {
        return false
      }
      return true
    },
    uploadUrl () { return `/img${this.$consts.API.FILE.PHOTO}` },

    /**
     * 權限選項定義
     * 注意：'disabled' 屬性會根據當前組件是否唯讀 (isDisabled) 來決定
     */
    authOpts () {
      return [
        { value: this.$consts.AUTHORITY.DISABLED, text: '離職' },
        { value: this.$consts.AUTHORITY.ADMIN, text: '系統管理', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT, text: '訊息管理', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.USER_MANAGEMENT, text: '人員管理', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.CHIEF, text: '主管', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION, text: '研考', disabled: this.isDisabled }
      ]
    }
  },
  watch: {
    /**
     * 當權限複選框變更時，自動計算並更新 userData.authority 的位元遮罩值 (Bitmask)
     */
    authorities (array) {
      this.userData.authority = array.reduce((acc, item) => {
        return acc + item
      }, 0)
    }
  },
  beforeCreate () {
    // 解決組件循環引用問題
    // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
    this.$options.components.LahUserCard = require('~/components/lah-user-card.vue').default
  },
  created () {
    // 建立 userData 的深拷貝，用於比對是否修改 (modified)
    this.origUserData = { ...this.userData }
    // 將 userData 中的位元遮罩轉換回 checkbox 陣列
    this.restoreAuthorities()
  },
  methods: {
    formatter (val) {
      return val.toUpperCase()
    },
    assignUserData (array) {
      // 使用展開運算子確保 Vue 2 的響應式更新
      this.userData = { ...this.userData, ...array }
    },
    // --- 日期格式轉換 (TW <-> AD) ---
    toTWFormat (adDate) {
      let twDate = adDate.replace('/-/g', '/')
      if (twDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        twDate = parseInt(twDate.substring(0, 4)) - 1911 + twDate.substring(4)
      }
      return twDate
    },
    toADFormat (twDate) {
      let adDate = twDate.replace('/-/g', '/')
      if (adDate.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        adDate =
          parseInt(adDate.substring(0, 3)) + 1911 + adDate.substring(3)
      }
      return adDate
    },

    /**
     * 通用的更新請求方法
     * @param {String} prompt - 確認視窗的提示文字
     * @param {Object} config - API 請求的 Payload
     * @returns {Promise}
     */
    update (prompt, config) {
      return new Promise((resolve, reject) => {
        this.confirm(prompt).then((answer) => {
          if (answer) {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.USER, config).then(({ data }) => {
              if (this.$utils.statusCheck(data.status)) {
                this.notify(data.message, { type: 'success' })

                // 特殊處理：入職/離職時自動更新日期欄位
                const today = this.$utils.now().split(' ')[0].replaceAll('-', '/')
                if (config.type === 'user_onboard') {
                  this.userData.offboard_date = ''
                  this.userData.onboard_date = today
                } else if (config.type === 'user_offboard') {
                  this.userData.offboard_date = today
                }

                resolve(this.userData)
              } else {
                this.notify(data.message, { type: 'warning' })
                reject(data.message)
              }
            }).catch((err) => {
              this.$utils.error(err)
              reject(err)
            }).finally(() => {
              this.isBusy = false
            })
          } else {
            reject('user cancelled the confirmation!')
          }
        })
      })
    },

    /**
     * 儲存使用者變更
     */
    save () {
      this.update('確定要更新?', {
        type: 'save_user_info',
        data: this.userData
      }).then((userData) => {
        // 通知父組件並更新原始資料快照
        this.trigger('saved', userData)
        this.origUserData = { ...this.origUserData, ...userData }
      })
    },

    /**
     * 上傳圖片通用邏輯
     * @param {File} file - 檔案物件
     * @param {Boolean} avatar - 是否為大頭照 (true: 大頭照, false: 生活照)
     */
    upload (file, avatar = false) {
      this.isBusy = true
      const formData = new FormData()
      formData.append('file', file)
      formData.append('id', this.userData.id)
      formData.append('name', this.userData.name)
      formData.append('avatar', avatar)

      this.$upload.post(this.uploadUrl, formData).then(({ data }) => {
        const opts = { type: 'warning', title: '上傳圖檔結果通知' }
        if (this.$utils.statusCheck(data.status)) {
          opts.type = 'success'
        }
        this.notify(data.message, opts)
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
        // 更新 Vuex 中的 timestamp 以觸發圖片重新載入
        this.$store.commit('timestamp')
      })
    },

    uploadPhoto () {
      this.upload(this.userPhoto, false)
      this.userPhoto = null
    },

    uploadAvatar () {
      this.upload(this.userAvatar, true)
      this.userAvatar = null
    },

    /**
     * 將整數權限值 (Bitmask) 解析回 Checkbox 陣列
     */
    restoreAuthorities () {
      const authority = this.userData.authority
      // 使用 Bitwise AND (&) 運算檢查權限
      this.$consts.AUTHORITY.DISABLED === (this.$consts.AUTHORITY.DISABLED & authority) && this.authorities.push(this.$consts.AUTHORITY.DISABLED)
      this.$consts.AUTHORITY.ADMIN === (this.$consts.AUTHORITY.ADMIN & authority) && this.authorities.push(this.$consts.AUTHORITY.ADMIN)
      this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT === (this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT & authority) && this.authorities.push(this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT)
      this.$consts.AUTHORITY.USER_MANAGEMENT === (this.$consts.AUTHORITY.USER_MANAGEMENT & authority) && this.authorities.push(this.$consts.AUTHORITY.USER_MANAGEMENT)
      this.$consts.AUTHORITY.CHIEF === (this.$consts.AUTHORITY.CHIEF & authority) && this.authorities.push(this.$consts.AUTHORITY.CHIEF)
      this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION === (this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION & authority) && this.authorities.push(this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION)
    }
  }
}
</script>

<style lang="scss" scoped>
.toogle-block:hover {
  font-weight: bolder;
  text-decoration: underline;
}
.optional-border {
  border-style: dashed;
  border-width: 2px;
  border-radius: .75rem;
  border-color: gray;
}
</style>
