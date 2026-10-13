<template lang="pug">
  div(v-if="isAuthorized" @keydown.ctrl.s.prevent="handleCtrlS")
    //- 1. 頂部即時名牌預覽列 (Live Mini Card Preview)
    .live-preview-banner.p-3.mb-3.rounded.border.bg-light.d-flex.flex-wrap.justify-content-between.align-items-center
      .d-flex.align-items-center.min-w-0
        b-avatar.mr-3.shadow-sm(
          variant="primary"
          size="3.2rem"
          :text="previewInitial"
        )
        .min-w-0
          .d-flex.align-items-center.flex-wrap
            span.h5.font-weight-bold.mb-0.mr-2(:class="userData.name ? 'text-dark' : 'text-muted'")
              | {{ userData.name || '新進同仁姓名' }}
            b-badge.mr-1.text-monospace(
              :variant="checkId === true ? 'primary' : 'secondary'"
            ) {{ userData.id || `${sitePrefix}XXXXXX` }}
            b-badge.mr-1(
              v-if="userData.unit"
              variant="info"
            ) {{ userData.unit }}
            b-badge.mr-1(
              v-if="userData.title"
              variant="light"
              class="border"
            ) {{ userData.title }}
            b-badge.mr-1(
              v-for="pill in activeRolePills"
              :key="pill.value"
              :variant="pill.variant"
            ) {{ pill.text }}
          .small.text-muted.mt-1.d-flex.align-items-center.flex-wrap
            span.mr-3
              lah-fa-icon.mr-1(icon="briefcase")
              | 職掌：{{ userData.work || '(未填寫)' }}
            span.mr-3
              lah-fa-icon.mr-1(icon="phone")
              | 分機：{{ userData.ext || '411' }}
            span(:class="checkIp === true ? 'text-primary font-weight-bold' : 'text-muted'")
              lah-fa-icon.mr-1(icon="desktop")
              | IP：{{ userData.ip || '尚未設定' }}

      .mt-2.mt-md-0.d-flex.align-items-center
        b-button(
          size="sm"
          variant="outline-secondary"
          title="清空重填所有欄位"
          @click="resetForm(false)"
        )
          lah-fa-icon.mr-1(icon="rotate-left")
          span 清空重填

    //- 2. 核心必填與常用職務區
    .p-3.rounded.border.bg-white.mb-3
      .d-flex.justify-content-between.align-items-center.border-bottom.pb-2.mb-3
        .font-weight-bold.text-primary
          lah-fa-icon.mr-1(icon="user-check")
          span 核心帳號與職務設定
        span.small.text-muted 標註 #[span.text-danger.font-weight-bold *] 為必填項目

      .row
        //- 員工帳號 ID
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label-for="id-input" label-size="sm")
            template(#label)
              span.font-weight-bold.text-secondary 員工帳號 (ID)
              span.text-danger.ml-1 *
            b-input-group(size="sm")
              b-form-input.text-monospace.font-weight-bold(
                id="id-input"
                ref="idInput"
                v-model="userData.id"
                :state="uiIdState"
                :formatter="formatter"
                placeholder="例如：HA100XXXXX"
                trim
                @input="onIdInput"
              )
              b-input-group-append(v-if="!userData.id || !userData.id.startsWith(sitePrefix)")
                b-button(
                  variant="outline-primary"
                  title="一鍵帶入本所站台代碼前綴"
                  @click="fillSitePrefix"
                ) 帶入 {{ sitePrefix }}
          .small.mt-1(v-if="foundUser")
            span.text-danger.font-weight-bold
              lah-fa-icon.mr-1(icon="triangle-exclamation")
              | 此帳號已存在：{{ foundUser.id }} {{ foundUser.name }} ({{ foundUser.unit || '未分配' }}{{ foundUser.offboard_date ? '・已離職' : '' }})
          .small.text-muted.mt-1(v-else) 請輸入至少 4 碼之員工代碼（自動轉大寫）

        //- 員工姓名
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label-for="name-input" label-size="sm")
            template(#label)
              span.font-weight-bold.text-secondary 姓名
              span.text-danger.ml-1 *
            b-form-input(
              id="name-input"
              v-model="userData.name"
              :state="uiNameState"
              placeholder="請輸入真實姓名"
              size="sm"
              trim
              @input="touched.name = true"
            )
          .small.mt-1(v-if="sameNameUser")
            span.text-warning-dark.font-weight-bold
              lah-fa-icon.mr-1(icon="circle-info")
              | 系統內已有同名同仁：{{ sameNameUser.id }} ({{ sameNameUser.unit || '未分配' }})

        //- 性別 (直覺按鈕切換)
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label-size="sm")
            template(#label)
              span.font-weight-bold.text-secondary 性別
              span.text-danger.ml-1 *
            .d-flex
              b-button.flex-fill.mr-1(
                size="sm"
                :variant="userData.sex === 1 ? 'primary' : 'outline-secondary'"
                @click="selectSex(1)"
              )
                lah-fa-icon.mr-1(icon="mars")
                span 男 (1)
              b-button.flex-fill(
                size="sm"
                :variant="userData.sex === 0 ? 'danger' : 'outline-secondary'"
                @click="selectSex(0)"
              )
                lah-fa-icon.mr-1(icon="venus")
                span 女 (0)

        //- 所屬課室
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label-for="unit-select" label-size="sm")
            template(#label)
              span.font-weight-bold.text-secondary 所屬課室
              span.text-danger.ml-1 *
            b-form-select(
              id="unit-select"
              v-model="userData.unit"
              :options="unitOpts"
              :state="uiDeptState"
              size="sm"
              @change="touched.unit = true"
            )
              template(#first)
                b-form-select-option(value="") -- 請選擇課室 --

        //- 職稱 (直接拉出至主面板)
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label="職稱" label-for="work-title-select" label-size="sm" label-class="font-weight-bold text-secondary")
            b-form-select(
              id="work-title-select"
              v-model="userData.title"
              :options="workTitleOpts"
              size="sm"
            )
              template(#first)
                b-form-select-option(value="") -- 請選擇職稱 (選填) --

        //- 分機號碼
        .col-12.col-md-4.mb-2
          b-form-group.mb-1(label="分機號碼 (3~4碼)" label-for="ext-input" label-size="sm" label-class="font-weight-bold text-secondary")
            b-form-input(
              id="ext-input"
              v-model="userData.ext"
              :state="checkExt"
              maxlength="4"
              placeholder="預設：411"
              size="sm"
              trim
            )

        //- 電腦 IP (整合空閒 IP 智慧推薦選單)
        .col-12.col-md-6.mb-2
          b-form-group.mb-1(label-for="ip-input" label-size="sm")
            template(#label)
              .d-flex.justify-content-between.align-items-center
                div
                  span.font-weight-bold.text-secondary 電腦 IP 位址
                  span.text-danger.ml-1 *
                span.small.text-success(v-if="freeIpSuggestions.length > 0")
                  lah-fa-icon.mr-1(icon="wand-magic-sparkles")
                  | 可從右側挑選空閒 IP
            b-input-group(size="sm")
              b-form-input.text-monospace(
                id="ip-input"
                v-model="userData.ip"
                :state="uiIpState"
                placeholder="範例：192.168.11.100"
                trim
                @input="touched.ip = true"
              )
              b-input-group-append(v-if="freeIpSuggestions.length > 0")
                b-dropdown(
                  text="🟢 挑選空閒 IP"
                  variant="outline-success"
                  size="sm"
                  right
                )
                  b-dropdown-header 本所優先網段推薦空閒 IP
                  b-dropdown-item(
                    v-for="freeIp in freeIpSuggestions"
                    :key="freeIp"
                    @click="selectSuggestedIp(freeIp)"
                  )
                    span.text-monospace.font-weight-bold.text-success {{ freeIp }}
                    span.small.text-muted.ml-2 (目前無人使用)
          .small.mt-1(v-if="duplicateIpOwner")
            span.text-warning-dark.font-weight-bold
              lah-fa-icon.mr-1(icon="clone")
              | 注意：此 IP 目前已配發給「{{ duplicateIpOwner.id }} {{ duplicateIpOwner.name }} ({{ duplicateIpOwner.unit }})」

        //- 工作職掌
        .col-12.col-md-6.mb-2
          b-form-group.mb-1(label="工作職掌" label-for="work-input" label-size="sm" label-class="font-weight-bold text-secondary")
            b-form-input(
              id="work-input"
              v-model="userData.work"
              placeholder="範例：初審、全功能櫃檯、測量助理、資訊系統管理"
              size="sm"
              trim
            )

      //- 角色權限膠囊選擇器 (Role Pills)
      .mt-2.pt-2.border-top
        .d-flex.justify-content-between.align-items-center.mb-2
          span.small.font-weight-bold.text-secondary 個人角色權限設定（點擊膠囊切換，可複選）
          span.small.text-muted 預設為一般人員，若有特殊管理身分請點選
        .d-flex.flex-wrap
          .role-pill.mr-2.mb-1(
            v-for="opt in rolePillOpts"
            :key="opt.value"
            :class="[isRoleSelected(opt.value) ? `role-pill-active-${opt.variant}` : 'role-pill-inactive']"
            @click="toggleRole(opt.value)"
          )
            lah-fa-icon.mr-1(:icon="isRoleSelected(opt.value) ? 'check-circle' : opt.icon")
            span {{ opt.text }}

    //- 3. 進階人事檔案區 (可收合)
    .d-flex.justify-content-between.align-items-center.mb-2
      .d-flex.align-items-center.toggle-block.small.text-primary(
        style="cursor: pointer"
        @click="showOthers = !showOthers"
      )
        lah-fa-icon.mr-1(:icon="showOthers ? 'chevron-up' : 'chevron-down'")
        span.font-weight-bold {{ showOthers ? '收合進階人事欄位 (到職日 / 手機 / 生日 / 學歷 / 考試)' : '展開進階人事欄位 (到職日 / 手機 / 生日 / 學歷 / 考試)' }}

    b-collapse(v-model="showOthers")
      .p-3.optional-border.bg-light.mb-3
        .row
          //- 到職日期 (含「今天」一鍵填入)
          .col-12.col-md-4.mb-2
            b-form-group.mb-1(label="到職日期 (民國年)" label-for="onboard-input" label-size="sm" label-class="font-weight-bold text-secondary")
              b-input-group(size="sm")
                b-form-input(
                  id="onboard-input"
                  v-model="userData.onboard_date"
                  :state="checkOnboardDate"
                  placeholder="範例：115/10/13"
                  trim
                )
                b-input-group-append
                  b-button(
                    variant="outline-secondary"
                    title="一鍵填入今日民國日期"
                    @click="fillTodayOnboardDate"
                  ) 今天

          //- 手機號碼
          .col-12.col-md-4.mb-2
            b-form-group.mb-1(label="手機號碼" label-for="cell-input" label-size="sm" label-class="font-weight-bold text-secondary")
              b-form-input(
                id="cell-input"
                v-model="userData.cell"
                :state="checkCell"
                placeholder="範例：0912345678"
                size="sm"
                trim
              )

          //- 生日
          .col-12.col-md-4.mb-2
            b-form-group.mb-1(label="生日 (民國年)" label-for="bd-input" label-size="sm" label-class="font-weight-bold text-secondary")
              b-form-input(
                id="bd-input"
                v-model="userData.birthday"
                :state="checkBirthday"
                placeholder="範例：075/05/23"
                size="sm"
                trim
              )

          //- 教育程度
          .col-12.col-md-6.mb-2
            b-form-group.mb-1(label="最高學歷" label-for="edu-input" label-size="sm" label-class="font-weight-bold text-secondary")
              b-form-input(
                id="edu-input"
                v-model="userData.education"
                placeholder="範例：國立政治大學地政學系"
                size="sm"
                trim
              )

          //- 考試資格
          .col-12.col-md-6.mb-2
            b-form-group.mb-1(label="考試資格" label-for="exam-input" label-size="sm" label-class="font-weight-bold text-secondary")
              b-form-input(
                id="exam-input"
                v-model="userData.exam"
                placeholder="範例：112年地政高考三級"
                size="sm"
                trim
              )

    //- 4. 底部動作列與必填狀態提示
    .d-flex.flex-wrap.justify-content-between.align-items-center.pt-2.border-top
      .small
        template(v-if="missingRequiredLabels.length > 0")
          span.text-muted.mr-1 尚待完成必填：
          b-badge.mr-1(
            v-for="lbl in missingRequiredLabels"
            :key="lbl"
            variant="warning"
          ) {{ lbl }}
        template(v-else)
          span.text-success.font-weight-bold
            lah-fa-icon.mr-1(icon="check-circle")
            | 必填資料齊全，可立即新增（支援 Ctrl + S 快捷存檔）

      .d-flex.align-items-center.mt-2.mt-sm-0
        lah-button.mr-2(
          icon="user-plus"
          variant="outline-info"
          :disabled="!checkRequired || isBusy"
          :busy="isBusy"
          title="儲存此筆員工後保留視窗與課室設定，方便連續新增下一位"
          @click="save(true)"
        ) 新增並繼續下一筆
        lah-button(
          icon="check"
          :variant="checkRequired ? 'success' : 'secondary'"
          :disabled="!checkRequired || isBusy"
          :busy="isBusy"
          title="立即建立此員工帳號 (Ctrl + S)"
          @click="save(false)"
        ) 立即新增員工
</template>

<script>
import userBase from '~/mixins/lah-user-base.js'

export default {
  name: 'LahUserAddCard',
  mixins: [userBase],
  data: () => ({
    users: [],
    foundUser: null,
    showOthers: false,
    authorities: [],
    touched: {
      id: false,
      name: false,
      unit: false,
      ip: false
    }
  }),
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'all_users'
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.users = data.raw || []
        this.ensureDefaultIpPrefix()
      } else {
        this.notify(data.message, { type: 'warning' })
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },
  computed: {
    isAuthorized () {
      return this.authority.isAdmin || this.authority.isUserMgtStaff
    },

    sitePrefix () {
      return (this.site && String(this.site).trim().toUpperCase()) || 'HA'
    },

    previewInitial () {
      const n = String(this.userData.name || '').trim()
      return n ? n.slice(-2) : '新進'
    },

    rolePillOpts () {
      return [
        { value: this.$consts.AUTHORITY.ADMIN, text: '系統管理', variant: 'success', icon: 'user-shield' },
        { value: this.$consts.AUTHORITY.CHIEF, text: '主管', variant: 'primary', icon: 'user-tie' },
        { value: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION, text: '研考', variant: 'warning', icon: 'clipboard-check' },
        { value: this.$consts.AUTHORITY.USER_MANAGEMENT, text: '人員管理', variant: 'info', icon: 'users-cog' },
        { value: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT, text: '訊息管理', variant: 'danger', icon: 'bullhorn' }
      ]
    },

    activeRolePills () {
      return this.rolePillOpts.filter(opt => this.authorities.includes(opt.value))
    },

    checkRequired () {
      return this.checkId === true &&
             this.checkName === true &&
             this.checkDept === true &&
             this.checkSex === true &&
             this.checkIp === true &&
             this.checkOnboardDate !== false &&
             this.checkExt !== false &&
             this.checkBirthday !== false &&
             this.checkCell !== false
    },

    missingRequiredLabels () {
      const list = []
      if (this.checkId !== true) { list.push('員工帳號 ID') }
      if (this.checkName !== true) { list.push('姓名') }
      if (this.checkSex !== true) { list.push('性別') }
      if (this.checkDept !== true) { list.push('所屬課室') }
      if (this.checkIp !== true) { list.push('電腦 IP') }
      return list
    },

    checkSex () {
      return [0, 1].includes(parseInt(this.userData.sex))
    },

    checkDept () {
      return !this.$utils.empty(this.userData.unit)
    },

    checkId () {
      if (this.$utils.empty(this.userData.id) || !this.$utils.empty(this.foundUser) || this.userData.id.length < 4) {
        return false
      }
      return true
    },

    checkName () {
      return !this.$utils.empty(this.userData.name) && this.userData.name.length > 1
    },

    checkIp () {
      return this.$utils.isIPv4(this.userData.ip)
    },

    // --- 友善表單驗證狀態 (未觸碰前不顯示刺眼紅框) ---
    uiIdState () {
      if (!this.touched.id && this.$utils.empty(this.userData.id)) { return null }
      return this.checkId
    },

    uiNameState () {
      if (!this.touched.name && this.$utils.empty(this.userData.name)) { return null }
      return this.checkName
    },

    uiDeptState () {
      if (!this.touched.unit && this.$utils.empty(this.userData.unit)) { return null }
      return this.checkDept
    },

    uiIpState () {
      if (!this.touched.ip && this.$utils.empty(this.userData.ip)) { return null }
      return this.checkIp
    },

    sameNameUser () {
      const n = String(this.userData.name || '').trim()
      if (!n || n.length < 2) { return null }
      return this.users.find(u => u.name === n && u.id !== this.userData.id) || null
    },

    duplicateIpOwner () {
      if (!this.checkIp) { return null }
      return this.users.find(u => !u.offboard_date && u.ip === this.userData.ip) || null
    },

    // 自動計算本所最常使用的優先網段並推薦前 12 個空閒可用 IP
    freeIpSuggestions () {
      if (!Array.isArray(this.users) || this.users.length === 0) { return [] }
      const prefixCounts = {}
      const usedIps = new Set()

      this.users.forEach((u) => {
        if (u.ip && typeof u.ip === 'string') {
          usedIps.add(u.ip.trim())
          const parts = u.ip.trim().split('.')
          if (parts.length === 4 && parts[0] === '192' && parts[1] === '168') {
            const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`
            prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1
          }
        }
      })

      const sortedPrefixes = Object.keys(prefixCounts).sort((a, b) => prefixCounts[b] - prefixCounts[a])
      if (sortedPrefixes.length === 0) { return [] }

      // 若目前使用者已輸入某個網段前綴，優先推薦該網段的空閒 IP
      let targetPrefixes = sortedPrefixes.slice(0, 3)
      const currentParts = String(this.userData.ip || '').split('.')
      if (currentParts.length >= 3 && currentParts[0] === '192' && currentParts[1] === '168' && /^\d+$/.test(currentParts[2])) {
        const typedPrefix = `192.168.${currentParts[2]}`
        targetPrefixes = [typedPrefix, ...targetPrefixes.filter(p => p !== typedPrefix)]
      }

      const suggestions = []
      for (const prefix of targetPrefixes) {
        for (let host = 20; host <= 240; host++) {
          const candidate = `${prefix}.${host}`
          if (!usedIps.has(candidate)) {
            suggestions.push(candidate)
            if (suggestions.length >= 12) { return suggestions }
          }
        }
      }
      return suggestions
    },

    checkExt () {
      if (this.$utils.empty(this.userData.ext)) {
        return null
      }
      return /^\d{3,4}$/gm.test(String(this.userData.ext))
    },

    checkBirthday () {
      if (this.$utils.empty(this.userData.birthday)) {
        return null
      }
      return /^\d{3,4}\/\d{1,2}\/\d{1,2}$/gm.test(String(this.userData.birthday))
    },

    checkCell () {
      if (this.$utils.empty(this.userData.cell)) {
        return null
      }
      return /^0\d{9}$/gm.test(String(this.userData.cell))
    },

    checkOnboardDate () {
      if (this.$utils.empty(this.userData.onboard_date)) {
        return null
      }
      return /^\d{3,4}\/\d{1,2}\/\d{1,2}$/gm.test(String(this.userData.onboard_date))
    }
  },
  watch: {
    authorities (array) {
      this.userData.authority = array.reduce((acc, item) => acc + item, 0)
    }
  },
  created () {
    this.userData.id = this.id || ''
    this.userData.name = this.name || ''
    this.userData.sex = 1
    this.userData.ext = '411'
    this.fillTodayOnboardDate()

    this.findDuplication = this.$utils.debounce(() => {
      if (this.$utils.empty(this.users) || this.$utils.empty(this.userData.id)) {
        this.foundUser = null
      } else {
        this.foundUser = this.users.find(user => this.userData.id === user.id) || null
      }
    }, 200)
  },
  mounted () {
    this.$nextTick(() => {
      if (this.$refs.idInput && this.$refs.idInput.focus) {
        this.$refs.idInput.focus()
      }
    })
  },
  methods: {
    formatter (val) {
      return String(val || '').toUpperCase()
    },

    findDuplication () {},

    onIdInput () {
      this.touched.id = true
      this.findDuplication()
    },

    fillSitePrefix () {
      if (!this.userData.id) {
        this.userData.id = this.sitePrefix
      } else if (!this.userData.id.startsWith(this.sitePrefix)) {
        this.userData.id = `${this.sitePrefix}${this.userData.id}`
      }
      this.touched.id = true
      this.findDuplication()
      if (this.$refs.idInput && this.$refs.idInput.focus) {
        this.$refs.idInput.focus()
      }
    },

    selectSex (val) {
      this.userData.sex = val
    },

    selectSuggestedIp (ip) {
      this.userData.ip = ip
      this.touched.ip = true
    },

    ensureDefaultIpPrefix () {
      if (!this.userData.ip && this.freeIpSuggestions.length > 0) {
        this.userData.ip = this.freeIpSuggestions[0]
      }
    },

    isRoleSelected (roleVal) {
      return this.authorities.includes(roleVal)
    },

    toggleRole (roleVal) {
      const idx = this.authorities.indexOf(roleVal)
      if (idx === -1) {
        this.authorities.push(roleVal)
      } else {
        this.authorities.splice(idx, 1)
      }
    },

    fillTodayOnboardDate () {
      const now = new Date()
      const twYear = String(now.getFullYear() - 1911).padStart(3, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      this.userData.onboard_date = `${twYear}/${month}/${day}`
    },

    resetForm (keepDeptAndPrefix = false) {
      const prevUnit = this.userData.unit
      const prevTitle = this.userData.title
      this.authorities = []
      this.foundUser = null
      this.touched = { id: false, name: false, unit: false, ip: false }
      this.userData = {
        id: keepDeptAndPrefix ? this.sitePrefix : '',
        name: '',
        sex: 1,
        title: keepDeptAndPrefix ? prevTitle : '',
        work: '',
        ext: '411',
        birthday: '',
        unit: keepDeptAndPrefix ? prevUnit : '',
        ip: '',
        education: '',
        exam: '',
        cell: '',
        onboard_date: '',
        authority: 0
      }
      this.fillTodayOnboardDate()
      this.$nextTick(() => {
        this.ensureDefaultIpPrefix()
        if (this.$refs.idInput && this.$refs.idInput.focus) {
          this.$refs.idInput.focus()
        }
      })
    },

    handleCtrlS () {
      if (this.checkRequired && !this.isBusy) {
        this.save(false)
      }
    },

    async save (continueNext = false) {
      this.touched = { id: true, name: true, unit: true, ip: true }
      if (!this.checkRequired || this.isBusy) { return }

      this.isBusy = true
      try {
        const payload = { ...this.userData }
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'add_user',
          data: payload
        })
        if (this.$utils.statusCheck(data.status)) {
          this.users.unshift({ ...payload })
          this.removeCache('user_mapping')
          this.removeCache('user_names')
          if (continueNext) {
            this.trigger('added-continue', { ...payload })
            this.resetForm(true)
          } else {
            this.trigger('added', { ...payload })
            this.resetForm(false)
          }
        } else {
          this.notify(data.message || '新增員工失敗', { type: 'warning' })
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.live-preview-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%);
}

.toggle-block:hover {
  font-weight: bolder;
  text-decoration: underline;
}

.optional-border {
  border: 1px dashed #cbd5e1;
  border-radius: 0.5rem;
}

.text-warning-dark {
  color: #b45309 !important;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 50rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  border: 1px solid #cbd5e1;

  &:hover {
    transform: translateY(-1px);
  }
}

.role-pill-inactive {
  background-color: #f8fafc;
  color: #64748b;
}

.role-pill-active-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.role-pill-active-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.role-pill-active-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.role-pill-active-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
}

.role-pill-active-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}
</style>
