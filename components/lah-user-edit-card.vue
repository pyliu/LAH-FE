<template lang="pug">
  //- 只有在找到使用者且有權限時才顯示編輯工作台
  b-card.user-edit-studio.border-0.shadow-sm(
    v-if="found && isAuthorized"
    :class="{ 'is-compact-mode': isCompact }"
    no-body
  )
    b-row.no-gutters
      //- =========================================================
      //- 左側欄：視覺媒體工作坊 (生活照 + 大頭照互動裁切 + AD 操作)
      //- =========================================================
      b-col.studio-left-pane.p-3.border-right(cols="12" lg="5")
        //- 1. 頂部大頭照與個人識別區
        .d-flex.align-items-center.mb-3
          .avatar-drop-zone.mr-3.position-relative(
            :class="{ 'is-dragover': isDraggingAvatar }"
            title="點擊更換大頭照，或直接將圖片拖曳至此"
            @click="!isDisabled && triggerAvatarSelect()"
            @dragover.prevent="isDraggingAvatar = true"
            @dragleave.prevent="isDraggingAvatar = false"
            @drop.prevent="handleDrop($event, 'avatar')"
          )
            b-avatar.shadow-sm(
              variant="light"
              size="5.2rem"
              :src="avatarPreviewUrl || avatarSrc"
            )
            .avatar-edit-overlay(v-if="!isDisabled")
              lah-fa-icon(icon="camera" variant="light")
              span.avatar-overlay-text 換頭像
            b-spinner.avatar-spinner(v-if="uploadingAvatar" small variant="primary")

          .flex-grow-1.min-w-0
            .d-flex.align-items-center.flex-wrap
              span.h5.font-weight-bold.mb-0.mr-2 {{ userData.name || '未填姓名' }}
              b-badge(v-if="isDisabled" variant="danger" pill) 已離職
              b-badge(v-else variant="success" pill) 在職
            .text-monospace.text-muted.small.mt-1
              span {{ userData.id }}
              b-button.p-0.ml-1.text-muted(
                variant="link"
                size="sm"
                title="複製帳號 ID"
                @click="copyText(userData.id, '帳號')"
              )
                lah-fa-icon(icon="copy" size="xs")
            .d-flex.flex-wrap.mt-1
              b-badge.mr-1.mb-1(v-if="userData.unit" variant="info") {{ userData.unit }}
              b-badge.mr-1.mb-1(v-if="userData.title" variant="secondary") {{ userData.title }}
              b-badge.mr-1.mb-1(v-if="birthAge !== false" :variant="birthAgeVariant" pill) {{ birthAge }} 歲
              b-badge.mr-1.mb-1(v-if="workAge !== false" :variant="workAgeVariant" pill) 年資 {{ workAge }} 年

        //- 2. 生活照互動拖放與預覽區 (支援拖曳、點擊、Ctrl+V 貼上、一鍵裁切頭像)
        .photo-studio-card.rounded.border.p-2.bg-white.mb-3(
          :class="{ 'is-dragover': isDraggingPhoto }"
          @dragover.prevent="isDraggingPhoto = true"
          @dragleave.prevent="isDraggingPhoto = false"
          @drop.prevent="handleDrop($event, 'photo')"
        )
          .d-flex.justify-content-between.align-items-center.flex-nowrap.mb-2
            span.small.font-weight-bold.text-muted.text-nowrap.mr-2
              lah-fa-icon.mr-1(icon="image" regular)
              | 員工照片與頭像工作坊
            b-button-group.flex-shrink-0(size="sm" v-if="!isDisabled")
              lah-button.text-nowrap.mr-1(
                icon="upload"
                variant="outline-primary"
                title="選擇照片檔案 (支援 JPG / PNG / WebP 自動轉檔)"
                @click="triggerPhotoSelect()"
                no-icon-gutter
              )
              lah-button.text-nowrap(
                icon="crop-simple"
                variant="outline-info"
                title="從下方照片直接框選裁切正方形大頭照，免另外準備檔案！"
                @click="openCropperFromCurrentPhoto"
                no-icon-gutter
              )

          //- 照片顯示容器
          .photo-preview-container.position-relative.rounded.overflow-hidden.bg-light.text-center(
            @click="!isDisabled && triggerPhotoSelect()"
          )
            img.photo-preview-img(
              ref="currentPhotoImg"
              :key="photoSrc"
              :src="photoPreviewUrl || photoSrc"
              :alt="userData.name"
              crossorigin="anonymous"
              @load="onPhotoLoaded"
            )
            .photo-hover-hint(v-if="!isDisabled")
              lah-fa-icon.mb-1(icon="cloud-arrow-up" size="2x")
              .small.font-weight-bold 點擊選檔、拖曳圖片至此，或按 Ctrl+V 貼上截圖
              .extra-small.text-light 支援 PNG / WebP / JPG 自動最佳化轉檔
            .photo-uploading-mask(v-if="uploadingPhoto")
              b-spinner(variant="light")
              .small.text-white.mt-2 正在上傳照片...

          //- 隱藏的檔案輸入框 (支援所有圖片格式，前端自動透過 Canvas 轉為 JPG)
          input.d-none(
            ref="photoFileInput"
            type="file"
            accept="image/*"
            @change="onFileInputChange($event, 'photo')"
          )
          input.d-none(
            ref="avatarFileInput"
            type="file"
            accept="image/*"
            @change="onFileInputChange($event, 'avatar')"
          )

          .d-flex.justify-content-between.align-items-center.flex-nowrap.mt-2.px-1
            span.extra-small.text-muted.text-nowrap 💡 支援 #[code Ctrl+V] 直接貼上剪貼簿圖片
            b-link.extra-small.font-weight-bold.text-nowrap(
              v-if="!isDisabled"
              href="javascript:void(0)"
              @click="triggerAvatarSelect()"
            ) 單獨上傳頭像檔

        //- 3. AD 帳號管理與密碼重設專區 (取代原生醜陋的 window.prompt)
        .ad-action-box.rounded.border.p-2.bg-white(v-if="!isDisabled")
          .d-flex.justify-content-between.align-items-center.flex-nowrap
            span.small.font-weight-bold.text-muted.text-nowrap.mr-2
              lah-fa-icon.mr-1(icon="shield-halved")
              | AD 網域帳號操作
            .d-flex.flex-nowrap.flex-shrink-0
              lah-button.mr-1.text-nowrap(
                icon="unlock"
                variant="outline-warning"
                size="sm"
                :no-icon-gutter="isCompact"
                title="解除 AD 帳號鎖定"
                @click="unlockAd"
                no-icon-gutter
              )
                span(v-if="!isCompact") 解鎖
              lah-button.text-nowrap(
                icon="key"
                :variant="showAdPwPanel ? 'danger' : 'outline-danger'"
                size="sm"
                :no-icon-gutter="isCompact"
                title="展開/收合 AD 密碼重設面板"
                @click="toggleAdPwPanel"
                no-icon-gutter
              )
                span(v-if="!isCompact") 密碼

          //- 內嵌式 AD 密碼重設面板
          b-collapse(v-model="showAdPwPanel")
            .mt-2.pt-2.border-top
              .small.text-muted.mb-1 設定 #[b {{ userData.id }}] 的新 AD 密碼：
              b-input-group(size="sm")
                b-form-input(
                  v-model="customAdPassword"
                  placeholder="輸入新密碼"
                  trim
                  @keydown.enter.prevent="submitAdPasswordReset"
                )
                b-input-group-append
                  b-button(
                    variant="outline-secondary"
                    title="填入預設密碼 a.000000"
                    @click="customAdPassword = 'a.000000'"
                  )
                    lah-fa-icon(:class="{ 'mr-1': !isCompact }" icon="wand-magic-sparkles")
                    span.btn-label 預設值
                  b-button(
                    variant="danger"
                    :disabled="!customAdPassword || isBusy"
                    title="確認送出並重設 AD 密碼"
                    @click="submitAdPasswordReset"
                  )
                    lah-fa-icon(:class="{ 'mr-1': !isCompact }" icon="check")
                    span.btn-label 確認重設

      //- =========================================================
      //- 右側欄：結構化流暢表單區 (免折疊常用欄位 + 互動式權限膠囊)
      //- =========================================================
      b-col.studio-right-pane.p-3.d-flex.flex-column.justify-content-between(cols="12" lg="7")
        div
          //- 1. 互動式角色權限膠囊區 (Interactive Role Pills)
          .form-section.mb-3.p-3.rounded.border.bg-light-subtle
            .d-flex.justify-content-between.align-items-center.mb-2
              label.font-weight-bold.mb-0.small.text-uppercase.text-secondary
                lah-fa-icon.mr-1(icon="user-tag")
                | 角色與權限設定（點擊膠囊立即切換）
              span.extra-small.text-muted 可複選多重身分

            .d-flex.flex-wrap.role-pill-group
              b-button.role-pill-btn.mr-2.mb-2(
                v-for="opt in rolePillOptions"
                :key="opt.value"
                :variant="hasAuthorityBit(opt.value) ? opt.activeVariant : 'outline-secondary'"
                :disabled="opt.disabled"
                size="sm"
                pill
                @click="toggleAuthorityBit(opt.value)"
              )
                lah-fa-icon.mr-1(:icon="hasAuthorityBit(opt.value) ? 'check-circle' : opt.icon")
                span.font-weight-bold {{ opt.text }}

            //- 部門與角色自動生效權限智慧提示
            .effective-auth-hint.small.text-muted.mt-1
              lah-fa-icon.mr-1.text-info(icon="circle-info")
              span {{ effectiveAuthorityHint }}

          //- 2. 核心常用資料區 (將「分機」與「職稱」直接提上來，免展開即可編輯！)
          .form-section.mb-3
            .row
              //- 姓名
              .col-12.col-sm-6.mb-2
                b-form-group.mb-1(label="姓名 *" label-for="name-input" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-input(
                    id="name-input"
                    v-model="userData.name"
                    :state="checkName"
                    :disabled="isDisabled"
                    size="sm"
                    trim
                  )

              //- 課室
              .col-12.col-sm-6.mb-2
                b-form-group.mb-1(label="課室單位 *" label-for="unit-select" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-select(
                    id="unit-select"
                    v-model="userData.unit"
                    :options="unitOpts"
                    :disabled="isDisabled"
                    size="sm"
                  )

              //- 電腦 IP
              .col-12.col-sm-6.mb-2
                b-form-group.mb-1(label="電腦 IP 位址 *" label-for="ip-input" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-input-group(size="sm")
                    b-form-input.text-monospace(
                      id="ip-input"
                      v-model="userData.ip"
                      :state="checkIp"
                      :disabled="isDisabled"
                      placeholder="192.168.X.X"
                      trim
                    )
                    b-input-group-append(v-if="userData.ip")
                      b-button(
                        variant="outline-secondary"
                        title="複製 IP"
                        @click="copyText(userData.ip, 'IP')"
                      )
                        lah-fa-icon(icon="copy")

              //- 分機 (直接提升至核心區)
              .col-6.col-sm-3.mb-2
                b-form-group.mb-1(label="分機號碼" label-for="ext-input" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-input(
                    id="ext-input"
                    v-model="userData.ext"
                    :state="checkExt"
                    :disabled="isDisabled"
                    placeholder="3~4 碼"
                    size="sm"
                    trim
                  )

              //- 性別
              .col-6.col-sm-3.mb-2
                b-form-group.mb-1(label="性別" label-for="sex-select" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-select(
                    id="sex-select"
                    v-model="userData.sex"
                    :options="sexOpts"
                    :disabled="isDisabled"
                    size="sm"
                  )

              //- 職稱 (直接提升至核心區)
              .col-12.col-sm-6.mb-2
                b-form-group.mb-1(label="職稱" label-for="work-title-select" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-select(
                    id="work-title-select"
                    v-model="userData.title"
                    :options="workTitleOpts"
                    :disabled="isDisabled"
                    size="sm"
                  )

              //- 工作內容 (直接提升至核心區)
              .col-12.col-sm-6.mb-2
                b-form-group.mb-1(label="工作職掌" label-for="work-input" label-size="sm" label-class="font-weight-bold text-secondary")
                  b-form-input(
                    id="work-input"
                    v-model="userData.work"
                    placeholder="範例：資訊系統管理、初審"
                    :disabled="isDisabled"
                    size="sm"
                    trim
                  )

          //- 3. 進階人事檔案區塊 (到職、生日、手機、學歷、考試)
          .d-flex.justify-content-between.align-items-center.mb-2
            .d-flex.align-items-center.toggle-block.small.text-primary(
              style="cursor: pointer"
              @click="showOthers = !showOthers"
            )
              lah-fa-icon.mr-1(:icon="showOthers ? 'chevron-up' : 'chevron-down'")
              span.font-weight-bold {{ showOthers ? '收合進階人事欄位 (到職/生日/手機/學歷/考試)' : '展開進階人事欄位 (到職/生日/手機/學歷/考試)' }}

          b-collapse(v-model="showOthers")
            .p-3.optional-border.mb-2
              .row
                //- 到職日 (附帶「今天」快捷填入)
                .col-12.col-sm-6.mb-2
                  b-form-group.mb-1(label="到職日期 (民國年)" label-for="onboard-input" label-size="sm" label-class="font-weight-bold text-secondary")
                    b-input-group(size="sm")
                      b-form-input(
                        id="onboard-input"
                        v-model="userData.onboard_date"
                        :state="checkOnboardDate"
                        :disabled="isDisabled"
                        placeholder="範例：110/06/01"
                        trim
                      )
                      b-input-group-append(v-if="!isDisabled")
                        b-button(variant="outline-secondary" title="填入今日民國日期" @click="fillTodayOnboard")
                          lah-fa-icon(:class="{ 'mr-1': !isCompact }" icon="calendar-day")
                          span.btn-label 今天

                //- 生日
                .col-12.col-sm-6.mb-2
                  b-form-group.mb-1(label="出生日期 (民國年)" label-for="bd-input" label-size="sm" label-class="font-weight-bold text-secondary")
                    b-form-input(
                      id="bd-input"
                      v-model="userData.birthday"
                      :state="checkBirthday"
                      :disabled="isDisabled"
                      placeholder="範例：066/05/23"
                      size="sm"
                      trim
                    )

                //- 手機
                .col-12.col-sm-6.mb-2
                  b-form-group.mb-1(label="手機號碼" label-for="cell-input" label-size="sm" label-class="font-weight-bold text-secondary")
                    b-form-input(
                      id="cell-input"
                      v-model="userData.cell"
                      :state="checkCell"
                      :disabled="isDisabled"
                      placeholder="範例：0912345678"
                      size="sm"
                      trim
                    )

                //- 考試
                .col-12.col-sm-6.mb-2
                  b-form-group.mb-1(label="考試資格" label-for="exam-input" label-size="sm" label-class="font-weight-bold text-secondary")
                    b-form-input(
                      id="exam-input"
                      v-model="userData.exam"
                      :disabled="isDisabled"
                      placeholder="範例：107年資訊處理高考三級"
                      size="sm"
                      trim
                    )

                //- 教育學歷
                .col-12.mb-1
                  b-form-group.mb-0(label="最高學歷" label-for="edu-input" label-size="sm" label-class="font-weight-bold text-secondary")
                    b-form-input(
                      id="edu-input"
                      v-model="userData.education"
                      :disabled="isDisabled"
                      placeholder="範例：台北科技大學資訊工程研究所"
                      size="sm"
                      trim
                    )

        //- =========================================================
        //- 底部極速儲存工具列 (免除二次確認視窗 + 支援儲存並下一位)
        //- =========================================================
        .studio-footer.pt-3.mt-2.border-top.d-flex.flex-wrap.justify-content-between.align-items-center
          .d-flex.align-items-center.mb-1
            template(v-if="modified")
              b-badge.mr-2(variant="warning" pill) 尚有未儲存變更
              b-button(
                variant="link"
                size="sm"
                class="p-0 text-secondary small"
                title="放棄此次修改，還原為原始內容"
                @click="revertChanges"
              )
                lah-fa-icon(:class="{ 'mr-1': !isCompact }" icon="rotate-left")
                span.btn-label 還原修改
            template(v-else)
              span.small.text-muted
                lah-fa-icon.mr-1.text-success(icon="check-circle")
                span.btn-label 資料已同步（按 #[code Ctrl+S] 可快速存檔）

          .d-flex.align-items-center.mb-1
            //- 儲存並切換下一位按鈕 (當父組件傳入 hasNext 時啟用)
            lah-button.mr-2(
              v-if="hasNext"
              icon="forward-step"
              icon-append
              :variant="saveButtonDisabled ? 'outline-secondary' : 'info'"
              :disabled="saveButtonDisabled || isBusy"
              :no-icon-gutter="isCompact"
              size="md"
              title="直接儲存目前變更並自動切換至下一位員工"
              @click="save(true)"
            )
              span.btn-label 儲存並下一位

            //- 極速儲存按鈕 (免確認彈窗直接儲存)
            lah-button(
              icon="floppy-disk"
              :variant="saveButtonDisabled ? 'secondary' : 'success'"
              :disabled="saveButtonDisabled || isBusy"
              :no-icon-gutter="isCompact"
              size="md"
              title="立即儲存變更 (Ctrl + S)"
              @click="save(false)"
            )
              span.btn-label 儲存變更

    //- =========================================================
    //- 互動式大頭照裁切與雙上傳工作坊 Modal (Interactive Avatar Cropper)
    //- =========================================================
    b-modal(
      ref="cropperModal"
      id="avatar-cropper-modal"
      :title="`頭像裁切與照片工作坊 — ${userData.id} ${userData.name}`"
      size="lg"
      centered
      hide-footer
    )
      .row
        //- 左側：互動式 Canvas 裁切畫布 (可拖曳平移、滑桿縮放)
        .col-12.col-md-7.text-center.border-right
          .small.font-weight-bold.text-secondary.mb-2
            lah-fa-icon.mr-1(icon="hand-pointer" regular)
            | 在下方畫布拖曳調整位置，使用滑桿縮放取景範圍
          .cropper-stage-wrap.d-inline-block.position-relative.rounded.overflow-hidden.border.shadow-sm
            canvas.cropper-canvas(
              ref="cropCanvas"
              width="280"
              height="280"
              @mousedown="startCropDrag"
              @mousemove="onCropDrag"
              @mouseup="endCropDrag"
              @mouseleave="endCropDrag"
              @touchstart.prevent="startCropTouch"
              @touchmove.prevent="onCropTouch"
              @touchend="endCropDrag"
              @wheel.prevent="onCropWheel"
            )
          .d-flex.align-items-center.justify-content-center.mt-2.px-3
            lah-fa-icon.text-muted.mr-2(icon="magnifying-glass-minus")
            b-form-input(
              v-model.number="cropScale"
              type="range"
              :min="cropMinScale"
              :max="cropMaxScale"
              step="0.02"
              style="max-width: 220px"
              @input="drawCropCanvas"
            )
            lah-fa-icon.text-muted.ml-2(icon="magnifying-glass-plus")

        //- 右側：即時圓形/方形大頭照預覽與一鍵上傳選項
        .col-12.col-md-5.d-flex.flex-column.justify-content-between.p-3
          .text-center
            .small.font-weight-bold.text-secondary.mb-2 即時大頭照預覽 (256 × 256)
            .d-flex.justify-content-around.align-items-center.my-3
              div
                b-avatar.shadow(:src="croppedPreviewDataUrl" size="5.5rem" variant="light")
                .extra-small.text-muted.mt-1 名牌圓形頭像
              div
                img.rounded.shadow-sm.border(
                  v-if="croppedPreviewDataUrl"
                  :src="croppedPreviewDataUrl"
                  style="width: 88px; height: 88px; object-fit: cover"
                )
                .extra-small.text-muted.mt-1 正方形頭像

          .mt-3
            b-button.mb-2(
              v-if="pendingPhotoFile"
              variant="primary"
              block
              :disabled="uploadingPhoto || uploadingAvatar"
              @click="uploadBothPhotoAndCroppedAvatar"
            )
              lah-fa-icon.mr-1(icon="wand-magic-sparkles")
              | 同時更新「生活照」與「裁切頭像」

            b-button.mb-2(
              variant="success"
              block
              :disabled="uploadingAvatar"
              @click="uploadCroppedAvatarOnly"
            )
              lah-fa-icon.mr-1(icon="check")
              | 僅將裁切結果設為「大頭照」

            b-button.mb-2(
              v-if="pendingPhotoFile"
              variant="outline-info"
              block
              :disabled="uploadingPhoto"
              @click="uploadPendingPhotoOnly"
            )
              lah-fa-icon.mr-1(icon="image")
              | 僅上傳原圖為「生活照」

            b-button(
              variant="outline-secondary"
              size="sm"
              block
              @click="closeCropperModal"
            ) 取消
</template>

<script>
import userBase from '~/mixins/lah-user-base.js'

/**
 * @component LahUserEditCard
 * @description 升級版使用者資料編輯工作台：整合拖放/貼上圖片、互動式頭像裁切、角色膠囊、極速儲存與上下位連續編輯。
 */
export default {
  name: 'LahUserEditCard',
  mixins: [userBase],
  props: {
    hasNext: { type: Boolean, default: false },
    compact: { type: Boolean, default: false }
  },
  data: () => ({
    isSmallContainer: false,
    showOthers: false,
    authorities: [],

    // 圖片上傳與即時預覽狀態
    isDraggingPhoto: false,
    isDraggingAvatar: false,
    uploadingPhoto: false,
    uploadingAvatar: false,
    photoPreviewUrl: '',
    avatarPreviewUrl: '',
    localImgBust: Date.now(),

    // 互動式頭像裁切器 (Canvas Cropper) 狀態
    pendingPhotoFile: null,
    cropImageObj: null,
    cropScale: 1,
    cropMinScale: 0.2,
    cropMaxScale: 3,
    cropOffsetX: 0,
    cropOffsetY: 0,
    isCropDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    croppedPreviewDataUrl: '',

    // 內嵌式 AD 密碼重設狀態
    showAdPwPanel: false,
    customAdPassword: 'a.000000'
  }),
  computed: {
    isCompact () {
      return this.compact || this.isSmallContainer
    },

    isAuthorized () {
      return this.authority.isAdmin || this.authority.isUserMgtStaff
    },

    checkRequired () {
      return this.checkName === true &&
             this.checkIp === true &&
             this.checkOnboardDate !== false &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },

    modified () {
      return !this.$utils.equal(this.userData, this.origUserData)
    },

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
      return this.$utils.isIPv4(this.userData.ip) || this.userData.ip === '::1'
    },
    checkExt () {
      if (this.$utils.empty(this.userData.ext)) {
        return null
      }
      return Boolean(String(this.userData.ext).match(/^\d{3,4}$/))
    },
    checkBirthday () {
      if (this.$utils.empty(this.userData.birthday)) {
        return null
      }
      return Boolean(String(this.userData.birthday).match(/^\d{3,4}\/\d{1,2}\/\d{1,2}$/))
    },
    checkCell () {
      if (this.$utils.empty(this.userData.cell)) {
        return null
      }
      return Boolean(String(this.userData.cell).match(/^0\d{9}$/))
    },
    checkOnboardDate () {
      if (this.$utils.empty(this.userData.onboard_date)) {
        return null
      }
      return Boolean(String(this.userData.onboard_date).match(/^\d{3,4}\/\d{1,2}\/\d{1,2}$/))
    },

    saveButtonDisabled () {
      return !(this.modified && this.checkRequired)
    },

    uploadUrl () {
      return `/img${this.$consts.API.FILE.PHOTO}`
    },

    photoSrc () {
      return `/img/get_user_img.php?id=${this.userData.id}&name=${this.userData.name}&timestamp=${this.timestamp}_${this.localImgBust}`
    },

    avatarSrc () {
      return `/img/get_user_img.php?id=${this.userData.id}_avatar&name=${this.userData.name}_avatar&timestamp=${this.timestamp}_${this.localImgBust}`
    },

    // 年齡與年資計算 (整合自 LahUserCard)
    birthAge () {
      let birth = this.userData.birthday
      if (birth) {
        const now = new Date()
        birth = this.toADFormat(String(birth))
        const temp = Date.parse(birth)
        if (temp) {
          const born = new Date(temp)
          return ((now - born) / 31536000000).toFixed(1)
        }
      }
      return false
    },
    birthAgeVariant () {
      const a = this.birthAge
      if (a < 30) { return 'success' }
      if (a < 40) { return 'primary' }
      if (a < 50) { return 'warning' }
      if (a < 60) { return 'danger' }
      return 'dark'
    },
    workAge () {
      let onDate = this.userData.onboard_date
      let offDate = this.userData.offboard_date
      if (onDate !== undefined && onDate !== null && onDate !== '') {
        onDate = onDate.date ? onDate.date.split(' ')[0] : String(onDate)
        onDate = this.toADFormat(onDate)
        let temp = Date.parse(onDate)
        if (temp) {
          const on = new Date(temp)
          let now = new Date()
          if (this.isDisabled && offDate) {
            offDate = this.toADFormat(String(offDate))
            temp = Date.parse(offDate)
            if (temp) { now = new Date(temp) }
          }
          return ((now - on) / 31536000000).toFixed(1)
        }
      }
      return false
    },
    workAgeVariant () {
      const w = this.workAge
      if (w < 5) { return 'success' }
      if (w < 10) { return 'primary' }
      if (w < 20) { return 'warning' }
      return 'danger'
    },

    rolePillOptions () {
      return [
        { value: this.$consts.AUTHORITY.ADMIN, text: '系統管理', activeVariant: 'success', icon: 'user-shield', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.CHIEF, text: '主管', activeVariant: 'primary', icon: 'user-tie', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION, text: '研考', activeVariant: 'warning', icon: 'clipboard-check', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.USER_MANAGEMENT, text: '人員管理', activeVariant: 'info', icon: 'users-gear', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT, text: '訊息管理', activeVariant: 'danger', icon: 'bullhorn', disabled: this.isDisabled },
        { value: this.$consts.AUTHORITY.DISABLED, text: '離職停用', activeVariant: 'dark', icon: 'ban', disabled: false }
      ]
    },

    effectiveAuthorityHint () {
      if (this.isDisabled) {
        return '已勾選「離職停用」，此帳號將不套用任何部門或主管預設權限。'
      }
      const autoPerms = []
      if (this.userData.unit === '資訊課') {
        autoPerms.push('系統管理(全部權限)', '發布公告', '管理人員')
      } else if (this.userData.unit === '人事室') {
        autoPerms.push('發布公告', '管理人員')
      }
      if (this.hasAuthorityBit(this.$consts.AUTHORITY.CHIEF) || this.hasAuthorityBit(this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION)) {
        if (!autoPerms.includes('發布公告')) { autoPerms.push('發布公告') }
      }
      if (autoPerms.length > 0) {
        return `依目前課室/角色規則，登入後自動額外享有：【${autoPerms.join('、')}】權限。`
      }
      return '另外，電腦 IP 於「使用者角色管理」設定的角色會一併聯集生效（只增加、不取消）。'
    }
  },
  watch: {
    raw: {
      handler (val) {
        if (Array.isArray(val) && val.length > 0 && val[0]) {
          this.userData = {
            id: '',
            name: '',
            sex: '',
            title: '',
            work: '',
            ext: '411',
            birthday: '',
            unit: '',
            ip: '',
            education: '',
            exam: '',
            cell: '',
            onboard_date: '',
            authority: 0,
            ...val[0]
          }
          this.origUserData = { ...this.userData }
          this.authorities = []
          this.restoreAuthorities()
          this.photoPreviewUrl = ''
          this.avatarPreviewUrl = ''
          this.showAdPwPanel = false
        }
      },
      deep: true
    },
    showOthers (val) {
      localStorage.setItem('user_edit_show_others', val)
    },
    authorities (array) {
      this.userData.authority = array.reduce((acc, item) => acc + item, 0)
    }
  },
  created () {
    this.origUserData = { ...this.userData }
    this.restoreAuthorities()
  },
  mounted () {
    const savedShowOthers = localStorage.getItem('user_edit_show_others')
    if (savedShowOthers !== null) {
      this.showOthers = savedShowOthers === 'true'
    }

    this.$nextTick(() => {
      this.checkContainerSize()
      if (typeof ResizeObserver !== 'undefined' && this.$el) {
        this.resizeObserver = new ResizeObserver(() => {
          this.checkContainerSize()
        })
        this.resizeObserver.observe(this.$el)
      }
    })

    // 支援 Ctrl+S 極速儲存 與 Ctrl+V 直接貼上剪貼簿圖片上傳
    this.handleStudioKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!this.saveButtonDisabled && !this.isBusy) {
          this.save(false)
        }
      }
    }
    this.handleStudioPaste = (e) => {
      if (this.isDisabled) { return }
      const items = e.clipboardData && e.clipboardData.items
      if (!items) { return }
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.includes('image')) {
          const file = items[i].getAsFile()
          if (file) {
            e.preventDefault()
            this.notify('已從剪貼簿讀取圖片，請調整頭像裁切範圍或直接上傳', { type: 'info' })
            this.prepareCropperWithFile(file)
            break
          }
        }
      }
    }
    window.addEventListener('keydown', this.handleStudioKeydown)
    window.addEventListener('paste', this.handleStudioPaste)
  },
  beforeDestroy () {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.handleStudioKeydown) {
      window.removeEventListener('keydown', this.handleStudioKeydown)
    }
    if (this.handleStudioPaste) {
      window.removeEventListener('paste', this.handleStudioPaste)
    }
  },
  methods: {
    checkContainerSize () {
      if (!this.$el) { return }
      const modalDialog = this.$el.closest ? this.$el.closest('.modal-dialog') : null
      if (modalDialog) {
        const isLgOrXl = modalDialog.classList.contains('modal-lg') || modalDialog.classList.contains('modal-xl')
        if (!isLgOrXl) {
          this.isSmallContainer = true
          return
        }
      }
      const width = this.$el.offsetWidth || this.$el.clientWidth || 0
      if (width > 0) {
        this.isSmallContainer = width < 760
      }
    },

    formatter (val) {
      return val.toUpperCase()
    },

    // --- 權限膠囊切換 ---
    hasAuthorityBit (bit) {
      return this.authorities.includes(bit)
    },
    toggleAuthorityBit (bit) {
      const idx = this.authorities.indexOf(bit)
      if (idx === -1) {
        this.authorities.push(bit)
      } else {
        this.authorities.splice(idx, 1)
      }
    },

    restoreAuthorities () {
      const authority = this.userData.authority
      this.$consts.AUTHORITY.DISABLED === (this.$consts.AUTHORITY.DISABLED & authority) && this.authorities.push(this.$consts.AUTHORITY.DISABLED)
      this.$consts.AUTHORITY.ADMIN === (this.$consts.AUTHORITY.ADMIN & authority) && this.authorities.push(this.$consts.AUTHORITY.ADMIN)
      this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT === (this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT & authority) && this.authorities.push(this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT)
      this.$consts.AUTHORITY.USER_MANAGEMENT === (this.$consts.AUTHORITY.USER_MANAGEMENT & authority) && this.authorities.push(this.$consts.AUTHORITY.USER_MANAGEMENT)
      this.$consts.AUTHORITY.CHIEF === (this.$consts.AUTHORITY.CHIEF & authority) && this.authorities.push(this.$consts.AUTHORITY.CHIEF)
      this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION === (this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION & authority) && this.authorities.push(this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION)
    },

    // --- 日期格式與快捷輔助 ---
    toTWFormat (adDate) {
      let twDate = String(adDate || '').replace(/-/g, '/')
      if (twDate.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        twDate = String(parseInt(twDate.substring(0, 4)) - 1911).padStart(3, '0') + twDate.substring(4)
      }
      return twDate
    },
    toADFormat (twDate) {
      let adDate = String(twDate || '').replace(/-/g, '/')
      if (adDate.match(/^\d{3}\/\d{2}\/\d{2}$/)) {
        adDate = (parseInt(adDate.substring(0, 3)) + 1911) + adDate.substring(3)
      }
      return adDate
    },
    fillTodayOnboard () {
      const adToday = this.$utils.now().split(' ')[0].replace(/-/g, '/')
      this.userData.onboard_date = this.toTWFormat(adToday)
    },
    revertChanges () {
      this.userData = { ...this.origUserData }
      this.authorities = []
      this.restoreAuthorities()
      this.notify('已還原未儲存的修改', { type: 'info' })
    },
    copyText (text, label = '內容') {
      if (!text) { return }
      const str = String(text)
      this.copyToClipboard(str, `已複製 ${label}「${str}」`, this.$el).then((success) => {
        if (!success) {
          this.notify(`複製 ${label} 失敗，請手動複製`, { type: 'warning' })
        }
      })
    },

    // --- 極速儲存變更 (免除二次確認視窗) ---
    save (andNext = false) {
      if (this.saveButtonDisabled || this.isBusy) { return }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.USER, {
        type: 'save_user_info',
        data: this.userData
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.origUserData = { ...this.userData }
          if (andNext) {
            this.trigger('save-and-next', { ...this.userData })
          } else {
            this.trigger('saved', { ...this.userData })
          }
        } else {
          this.notify(data.message || '儲存失敗', { type: 'warning' })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },

    // =========================================================
    // 圖片拖曳、點擊、自動轉 JPG 與互動式頭像裁切工作坊
    // =========================================================
    triggerPhotoSelect () {
      if (this.$refs.photoFileInput) {
        this.$refs.photoFileInput.value = ''
        this.$refs.photoFileInput.click()
      }
    },
    triggerAvatarSelect () {
      if (this.$refs.avatarFileInput) {
        this.$refs.avatarFileInput.value = ''
        this.$refs.avatarFileInput.click()
      }
    },
    onPhotoLoaded () {
      // 預留載入完成勾子
    },
    onFileInputChange (e, mode) {
      const file = e.target.files && e.target.files[0]
      if (!file) { return }
      this.processSelectedImage(file, mode)
    },
    handleDrop (e, mode) {
      this.isDraggingPhoto = false
      this.isDraggingAvatar = false
      if (this.isDisabled) { return }
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
      if (!file) { return }
      if (!file.type.startsWith('image/')) {
        this.notify('請拖曳圖片格式檔案 (JPG / PNG / WebP)', { type: 'warning' })
        return
      }
      this.processSelectedImage(file, mode)
    },

    processSelectedImage (file, mode) {
      if (mode === 'avatar') {
        // 單獨選取大頭照時，開啟互動裁切器讓使用者確認正方形範圍（預設只上傳頭像）
        this.prepareCropperWithFile(file, false)
      } else {
        // 選取生活照時，開啟工作坊可一鍵「同時上傳生活照 + 裁切頭像」或「僅上傳生活照」
        this.prepareCropperWithFile(file, true)
      }
    },

    prepareCropperWithFile (file, includePhotoUpload = true) {
      this.pendingPhotoFile = includePhotoUpload ? file : null
      const reader = new FileReader()
      reader.onload = (evt) => {
        this.loadImageIntoCropper(evt.target.result)
      }
      reader.readAsDataURL(file)
    },

    openCropperFromCurrentPhoto () {
      this.pendingPhotoFile = null
      const imgEl = this.$refs.currentPhotoImg
      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        try {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = imgEl.naturalWidth
          tempCanvas.height = imgEl.naturalHeight
          tempCanvas.getContext('2d').drawImage(imgEl, 0, 0)
          const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95)
          this.loadImageIntoCropper(dataUrl)
          return
        } catch (err) {
          // fallback to src
        }
      }
      this.loadImageIntoCropper(this.photoPreviewUrl || this.photoSrc)
    },

    loadImageIntoCropper (src) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.cropImageObj = img
        const canvasSize = 280
        // 計算初始縮放比例，使圖片短邊剛好填滿 280x280 裁切框
        const minDim = Math.min(img.width, img.height) || 280
        const initScale = canvasSize / minDim
        this.cropMinScale = Math.max(0.05, initScale * 0.4)
        this.cropMaxScale = Math.max(3, initScale * 3.5)
        this.cropScale = initScale
        // 預設水平置中、垂直偏上 (人像臉部通常在上方 1/3 處)
        this.cropOffsetX = (canvasSize - img.width * initScale) / 2
        this.cropOffsetY = Math.min(0, (canvasSize - img.height * initScale) * 0.25)

        if (this.$refs.cropperModal) {
          this.$refs.cropperModal.show()
        }
        this.$nextTick(() => {
          setTimeout(() => {
            this.drawCropCanvas()
          }, 60)
        })
      }
      img.onerror = () => {
        this.notify('無法載入圖片進行裁切，請先選擇一張本機圖片', { type: 'warning' })
      }
      img.src = src
    },

    drawCropCanvas () {
      const canvas = this.$refs.cropCanvas
      const img = this.cropImageObj
      if (!canvas || !img) { return }
      const ctx = canvas.getContext('2d')
      const size = canvas.width

      // 背景填充白色（避免透明 PNG 轉 JPG 時變黑底）
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)

      // 繪製縮放與平移後的圖片
      const drawW = img.width * this.cropScale
      const drawH = img.height * this.cropScale
      ctx.drawImage(img, this.cropOffsetX, this.cropOffsetY, drawW, drawH)

      // 產生乾淨的 256x256 裁切輸出供預覽與上傳
      const outCanvas = document.createElement('canvas')
      outCanvas.width = 256
      outCanvas.height = 256
      const outCtx = outCanvas.getContext('2d')
      outCtx.fillStyle = '#ffffff'
      outCtx.fillRect(0, 0, 256, 256)
      const ratio = 256 / size
      outCtx.drawImage(img, this.cropOffsetX * ratio, this.cropOffsetY * ratio, drawW * ratio, drawH * ratio)
      this.croppedPreviewDataUrl = outCanvas.toDataURL('image/jpeg', 0.92)

      // 在操作畫布上繪製圓形參考導引線 (不影響實際輸出)
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    },

    startCropDrag (e) {
      this.isCropDragging = true
      this.dragStartX = e.clientX - this.cropOffsetX
      this.dragStartY = e.clientY - this.cropOffsetY
    },
    onCropDrag (e) {
      if (!this.isCropDragging) { return }
      this.cropOffsetX = e.clientX - this.dragStartX
      this.cropOffsetY = e.clientY - this.dragStartY
      this.drawCropCanvas()
    },
    startCropTouch (e) {
      if (!e.touches || !e.touches[0]) { return }
      this.isCropDragging = true
      this.dragStartX = e.touches[0].clientX - this.cropOffsetX
      this.dragStartY = e.touches[0].clientY - this.cropOffsetY
    },
    onCropTouch (e) {
      if (!this.isCropDragging || !e.touches || !e.touches[0]) { return }
      this.cropOffsetX = e.touches[0].clientX - this.dragStartX
      this.cropOffsetY = e.touches[0].clientY - this.dragStartY
      this.drawCropCanvas()
    },
    endCropDrag () {
      this.isCropDragging = false
    },
    onCropWheel (e) {
      const delta = e.deltaY < 0 ? 0.06 : -0.06
      const next = Math.min(this.cropMaxScale, Math.max(this.cropMinScale, Number(this.cropScale) + delta))
      this.cropScale = Number(next.toFixed(2))
      this.drawCropCanvas()
    },

    closeCropperModal () {
      if (this.$refs.cropperModal) {
        this.$refs.cropperModal.hide()
      }
    },

    // 將任意圖片 File 轉為標準高品質 JPG Blob (解決後端僅收 .jpg 限制)
    convertFileToJpgBlob (file, maxWidth = 1600) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (evt) => {
          const img = new Image()
          img.onload = () => {
            let w = img.width
            let h = img.height
            if (w > maxWidth) {
              h = Math.round((h * maxWidth) / w)
              w = maxWidth
            }
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            canvas.toBlob((blob) => {
              if (blob) {
                resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.92) })
              } else {
                reject(new Error('圖片轉檔失敗'))
              }
            }, 'image/jpeg', 0.92)
          }
          img.onerror = () => reject(new Error('無法解析圖片'))
          img.src = evt.target.result
        }
        reader.onerror = () => reject(new Error('讀取檔案失敗'))
        reader.readAsDataURL(file)
      })
    },

    dataUrlToBlob (dataUrl) {
      const arr = dataUrl.split(',')
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: 'image/jpeg' })
    },

    async uploadBlobToServer (jpgBlob, isAvatar = false) {
      const formData = new FormData()
      const fileName = `${this.userData.id}${isAvatar ? '_avatar' : ''}.jpg`
      formData.append('file', jpgBlob, fileName)
      formData.append('id', this.userData.id)
      formData.append('name', this.userData.name)
      formData.append('avatar', isAvatar)

      const { data } = await this.$upload.post(this.uploadUrl, formData)
      if (!this.$utils.statusCheck(data.status)) {
        throw new Error(data.message || '上傳失敗')
      }
      return data
    },

    async uploadCroppedAvatarOnly () {
      if (!this.croppedPreviewDataUrl) { return }
      this.uploadingAvatar = true
      try {
        const blob = this.dataUrlToBlob(this.croppedPreviewDataUrl)
        await this.uploadBlobToServer(blob, true)
        this.avatarPreviewUrl = this.croppedPreviewDataUrl
        this.localImgBust = Date.now()
        this.$store.commit('timestamp')
        this.notify(`已成功更新 ${this.userData.name} 的大頭照！`, { type: 'success' })
        this.closeCropperModal()
      } catch (err) {
        this.$utils.error(err)
        this.notify(err.message || '上傳大頭照失敗', { type: 'warning' })
      } finally {
        this.uploadingAvatar = false
      }
    },

    async uploadPendingPhotoOnly () {
      if (!this.pendingPhotoFile) { return }
      this.uploadingPhoto = true
      try {
        const { blob, dataUrl } = await this.convertFileToJpgBlob(this.pendingPhotoFile)
        await this.uploadBlobToServer(blob, false)
        this.photoPreviewUrl = dataUrl
        this.localImgBust = Date.now()
        this.$store.commit('timestamp')
        this.notify(`已成功更新 ${this.userData.name} 的生活照！`, { type: 'success' })
        this.closeCropperModal()
      } catch (err) {
        this.$utils.error(err)
        this.notify(err.message || '上傳生活照失敗', { type: 'warning' })
      } finally {
        this.uploadingPhoto = false
      }
    },

    async uploadBothPhotoAndCroppedAvatar () {
      if (!this.pendingPhotoFile || !this.croppedPreviewDataUrl) { return }
      this.uploadingPhoto = true
      this.uploadingAvatar = true
      try {
        const { blob: photoBlob, dataUrl: photoDataUrl } = await this.convertFileToJpgBlob(this.pendingPhotoFile)
        const avatarBlob = this.dataUrlToBlob(this.croppedPreviewDataUrl)

        await this.uploadBlobToServer(photoBlob, false)
        await this.uploadBlobToServer(avatarBlob, true)

        this.photoPreviewUrl = photoDataUrl
        this.avatarPreviewUrl = this.croppedPreviewDataUrl
        this.localImgBust = Date.now()
        this.$store.commit('timestamp')
        this.notify(`已同時更新 ${this.userData.name} 的生活照與大頭照！`, { type: 'success' })
        this.closeCropperModal()
      } catch (err) {
        this.$utils.error(err)
        this.notify(err.message || '上傳圖片失敗', { type: 'warning' })
      } finally {
        this.uploadingPhoto = false
        this.uploadingAvatar = false
      }
    },

    // =========================================================
    // AD 帳號解鎖與內嵌式密碼重設
    // =========================================================
    unlockAd () {
      this.$bvModal.msgBoxConfirm(`確定要解除 ${this.userData.id} (${this.userData.name}) 的 AD 帳號鎖定嗎？`, {
        title: 'AD 解鎖確認',
        size: 'md',
        okVariant: 'warning',
        okTitle: '確定解鎖',
        cancelTitle: '取消',
        centered: true
      }).then((ans) => {
        if (ans) {
          this.$bvModal.msgBoxConfirm(`是否要同時將 ${this.userData.id} 的 AD 密碼重設為預設值 (a.000000)？`, {
            title: '重設密碼選項',
            size: 'md',
            okVariant: 'danger',
            okTitle: '是，同時重設密碼',
            cancelVariant: 'outline-secondary',
            cancelTitle: '否，僅解鎖',
            centered: true
          }).then((resetAns) => {
            this.isBusy = true
            const payload = {
              type: 'ad_user_unlock',
              id: this.userData.id,
              password: resetAns ? 'a.000000' : null
            }
            this.$axios.post(this.$consts.API.JSON.USER, payload).then(({ data }) => {
              if (this.$utils.statusCheck(data.status)) {
                this.notify(data.message, { type: 'success' })
              } else {
                this.notify(data.message, { type: 'warning' })
              }
            }).catch((err) => {
              this.$utils.error(err)
            }).finally(() => {
              this.isBusy = false
            })
          })
        }
      })
    },

    toggleAdPwPanel () {
      this.showAdPwPanel = !this.showAdPwPanel
      if (this.showAdPwPanel && !this.customAdPassword) {
        this.customAdPassword = 'a.000000'
      }
    },

    submitAdPasswordReset () {
      if (this.$utils.empty(this.customAdPassword)) {
        this.notify('密碼不得為空', { type: 'warning' })
        return
      }
      this.$bvModal.msgBoxConfirm(`確定要將 ${this.userData.id} (${this.userData.name}) 的 AD 密碼重設為「${this.customAdPassword}」嗎？`, {
        title: '重設 AD 密碼確認',
        size: 'md',
        okVariant: 'danger',
        okTitle: '確定重設',
        cancelTitle: '取消',
        centered: true
      }).then((ans) => {
        if (!ans) { return }
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'ad_pw_reset',
          id: this.userData.id,
          password: this.customAdPassword
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.notify(data.message, { type: 'success' })
            this.showAdPwPanel = false
          } else {
            this.notify(data.message, { type: 'warning' })
          }
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.studio-left-pane {
  background-color: #f8fafc;
}

.bg-light-subtle {
  background-color: #f8f9fa;
}

// 大頭照互動區
.avatar-drop-zone {
  cursor: pointer;
  border-radius: 50%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &.is-dragover {
    transform: scale(1.04);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.35);

    .avatar-edit-overlay {
      opacity: 1;
    }
  }
}

.avatar-edit-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.52);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.18s ease;
  color: #fff;
}

.avatar-overlay-text {
  font-size: 0.68rem;
  font-weight: 700;
  margin-top: 2px;
}

.avatar-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -0.5rem;
  margin-left: -0.5rem;
}

// 生活照互動工作坊
.photo-studio-card {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &.is-dragover {
    border-color: #007bff !important;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
  }
}

.photo-preview-container {
  cursor: pointer;
  min-height: 220px;
  max-height: 310px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover .photo-hover-hint {
    opacity: 1;
  }
}

.photo-preview-img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.photo-hover-hint {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-uploading-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

// 互動式角色權限膠囊
.role-pill-btn {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
}

// Canvas 裁切畫布
.cropper-canvas {
  cursor: grab;
  display: block;
  background-color: #e9ecef;
  &:active {
    cursor: grabbing;
  }
}

.toggle-block:hover {
  text-decoration: underline;
}

.optional-border {
  border: 1px dashed #cbd5e1;
  border-radius: 0.5rem;
  background-color: #f8fafc;
}

.extra-small {
  font-size: 0.74rem;
}

.min-w-0 {
  min-width: 0;
}

// 支援原生 CSS Container Queries (inline-size)
.user-edit-studio {
  container-type: inline-size;
}

// 當外部 container 寬度小於 760px 時，隱藏按鍵文字以節省空間
@container (max-width: 760px) {
  .btn-label {
    display: none !important;
  }
  .btn .mr-1,
  .btn .ml-1 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

// 緊湊模式類別與行動裝置 fallback
.is-compact-mode {
  .btn-label {
    display: none !important;
  }
  .btn .mr-1,
  .btn .ml-1 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

@media (max-width: 767.98px) {
  .btn-label {
    display: none !important;
  }
  .btn .mr-1,
  .btn .ml-1 {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
</style>

<style lang="scss">
// 當外部 b-modal 之 size 非 lg 以上時 (如 sm 或預設 500px 寬)，將按鍵文字不顯示以節省空間
.modal-dialog:not(.modal-lg):not(.modal-xl) {
  .user-edit-studio {
    .btn-label {
      display: none !important;
    }
    .btn .mr-1,
    .btn .ml-1 {
      margin-left: 0 !important;
      margin-right: 0 !important;
    }
  }
}
</style>
