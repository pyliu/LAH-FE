<template lang="pug">
div(v-cloak)
  //- 頁面標題列
  lah-header: lah-transition(appear)
    .d-flex.w-100
      .d-flex.mr-auto
        .my-auto 員工資訊管理
        lah-button(
          v-b-modal.help-modal
          icon="info"
          variant="outline-success"
          no-border
          no-icon-gutter
          title="說明"
        )

      b-button-group.my-auto(size="lg")
        lah-button(
          icon="user-plus"
          variant="outline-primary"
          title="新增使用者"
          no-icon-gutter
          @click="add"
        )

  //- 幫助說明 Modal (優化版)
  lah-help-modal(:modal-id="'help-modal'" size="lg")
    h5.font-weight-bold.text-primary 💡 操作指南
    ul.pl-4
      li.mb-2
        span.font-weight-bold 新增使用者：
        span 點擊右上角的
        lah-button(icon="user-plus" variant="outline-primary" size="sm" no-icon-gutter class="mx-1")
        span 按鈕，填寫必要資訊後即可建立新帳號。

      li.mb-2
        span.font-weight-bold 編輯使用者：
        span 點擊列表中的任一使用者名牌
        b-button(variant="outline-dark" size="sm" class="mx-1") 使用者名牌
        span ，即可修改其詳細資料或權限設定。

      li.mb-2
        span.font-weight-bold 搜尋與篩選：
        span 可利用右側搜尋框輸入
        b-badge(variant="light") 姓名
        span 、
        b-badge(variant="light") ID
        span  或
        b-badge(variant="light") IP
        span  快速查找，系統會自動 <span class="bg-warning text-dark px-1">高亮</span> 比對到的文字；亦可勾選「在職/離職」進行過濾。

    hr

    h5.font-weight-bold.text-primary 🎨 顯示設定
    ul.pl-4
      li.mb-2
        span.font-weight-bold 大頭照開關：
        span 開啟後將顯示使用者頭像，滑鼠懸停於名牌上可放大 1.25 倍檢視。
      li.mb-2
        span.font-weight-bold IP 顯示：
        span 開啟後顯示 IP 位址，深色背景時後兩碼會
        span.ip-text-light.bg-dark.px-1 亮黃顯示
        span ，淺色背景則為
        span.ip-text-dark.bg-light.px-1 深藍色
        span ，方便辨識網段。
      li.mb-2
        span.font-weight-bold 分組排序：
        span 支援按部門、職稱、角色等多種維度分組，並可切換升/降冪排序。

    hr

    h5.font-weight-bold.text-primary 🏷️ 角色權限圖例
    .row.no-gutters
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="outline-dark" size="sm" style="width: 80px; white-space: nowrap") 正常人員
        span.small 一般人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="secondary" size="sm" style="width: 80px; white-space: nowrap") 被停用
        span.small 離職/停用
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="danger" size="sm" style="width: 80px; white-space: nowrap") 系統管理
        span.small 最高權限
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="primary" size="sm" style="width: 80px; white-space: nowrap") 主管
        span.small 主管人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="warning" size="sm" style="width: 80px; white-space: nowrap") 研考
        span.small 研考人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="success" size="sm" style="width: 80px; white-space: nowrap") 人員管理
        span.small 人事管理
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="outline-info" size="sm" style="width: 80px; white-space: nowrap") 公告管理
        span.small 公告發布

  hr

  //- 主要控制區塊：篩選、排序、顯示設定
  section
    .d-flex.justify-content-between.mb-2
      //- 左側：分類與排序
      .d-flex.align-items-center
        b-form-radio-group(
          v-model="selectedGroup"
          :options="groupOptions"
          buttons
          button-variant="outline-dark"
          class="my-auto"
          title="分類"
          size="sm"
        )
        b-form-radio-group(
          v-model="sortOrder"
          :options="sortOpts"
          class="ml-3 my-auto"
          size="sm"
        )

      //- 中間：計數顯示
      span.text-muted.my-auto.lah-shadow 找到 #[b-badge( pill class="my-auto" variant="info") {{ filteredUsers.length }}] 個使用者

      //- 右側：顯示開關與關鍵字搜尋
      .d-flex.my-auto.align-items-center
        //- 預設勾選大頭照與IP
        b-form-checkbox(v-model="showAvatar" switch class="mr-3" title="顯示") 大頭照
        b-form-checkbox(v-model="showIp" switch class="mr-3" title="顯示") IP
        b-form-checkbox-group(v-model="filter" :options="filterOptions")

        b-input.ml-3(
          v-model="keyword"
          placeholder="搜尋姓名、ID 或 IP..."
          size="sm"
          style="width: 220px"
          trim
        )

  hr

  //- 使用者列表區塊 (依照分組顯示)
  section.mb-3(v-for="category in categories" :key="category.NAME")
    h5.lah-shadow: lah-fa-icon(v-b-toggle="$utils.md5(category.NAME)" icon="address-book" regular style="cursor: pointer")
      span {{ translateGroupName(category.NAME) }}
      b-badge.ml-1.my-auto(pill variant="info") {{ category.LIST.length }}

    b-collapse(:id="$utils.md5(category.NAME)" visible)
      //- 使用 flex-wrap 讓固定寬度的名牌自動換行排列
      .d-flex.flex-wrap.align-items-center
        b-button(
          v-for="user in category.LIST"
          :key="user['id']"
          :data-id="user['id']"
          :data-name="user['name']"
          :variant="variant(user)"
          :pill="showAvatar"
          :title="role(user)"
          size="sm"
          class="mx-1 my-1 shadow d-inline-flex align-items-center user-badge"
          @click="edit(user)"
        )
          //- 大頭照區塊
          .mr-2(v-if="showAvatar")
            b-avatar(variant="light" size="3rem" :src="avatarSrc(user)")

          //- 資訊文字區塊
          .d-flex.flex-column.align-items-start.justify-content-center
            div
              //- 使用 v-html 渲染帶有高亮效果的 ID 與 姓名
              span.font-weight-bold.mr-1(v-html="highlight(user.id)")
              span(v-html="highlight(user.name)")
            .small.font-weight-bolder(v-if="showIp")
              //- IP 顯示：保留樣式邏輯，並分別對前後段進行高亮處理
              span(v-html="highlight(ipParts(user)[0] + '.' + ipParts(user)[1])")
              span(:class="ipClass(user)" v-html="highlight('.' + ipParts(user)[2] + '.' + ipParts(user)[3])")

  hr

  //- 編輯使用者 Modal
  b-modal(
    id="edit-user-modal"
    :title="editUserTitle"
    size="lg"
    hide-footer
    scrollable
    no-close-on-backdrop
  )
    lah-user-edit-card(:raw="[clickedUser]" @saved="saved($event)")

  //- 新增使用者 Modal
  b-modal(
    id="add-user-modal"
    title="手動新增使用者"
    size="lg"
    hide-footer
    scrollable
    no-close-on-backdrop
  )
    lah-user-add-card(@added="added($event)")
</template>

<script>
import lahUserAddCard from '~/components/lah-user-add-card.vue';
import lahUserEditCard from '~/components/lah-user-edit-card.vue';

export default {
  components: { lahUserEditCard, lahUserAddCard },
  middleware: ['isAdmin'],

  data: () => ({
    // UI 控制
    selectedGroup: 'unit',
    groupOptions: [
      { text: '部門', value: 'unit' },
      { text: '角色', value: 'role' },
      { text: '職稱', value: 'title' },
      { text: '工作', value: 'work' },
      { text: '性別', value: 'sex' },
      { text: '電腦', value: 'ip' },
      { text: '未分類', value: '' }
    ],
    sortOrder: false,
    sortOpts: [
      { html: '↓', value: true, disabled: false },
      { html: '↑', value: false, disabled: false }
    ],
    // 修改：預設值改為 true
    showAvatar: true,
    showIp: true,

    // 資料篩選與搜尋
    keyword: '',
    // 預設已勾選 "在職" ('on')
    filter: ['on'],
    filterOptions: [
      { text: '在職', value: 'on' },
      { text: '離職', value: 'off' }
    ],

    // 核心資料
    users: [],
    clickedUser: { id: '', name: '' }
  }),

  // Nuxt Fetch Hook
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: this.type
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.users = data.raw
      } else {
        this.notify(data.message, { type: 'warning' })
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  },

  head: {
    title: '員工資訊管理-桃園市地政局'
  },

  fetchOnServer: true,

  computed: {
    // 根據篩選條件決定 API 請求類型
    type () {
      if (this.filter.length === 2) { return 'all_users' }
      if (this.filter.includes('on')) { return 'on_board_users' }
      if (this.filter.includes('off')) { return 'off_board_users' }
      return ''
    },
    // 關鍵字搜尋邏輯
    filteredUsers () {
      if (this.$utils.empty(this.keyword)) {
        return this.users
      }
      const k = this.keyword.toLowerCase()
      return this.users.filter((user) => {
        return (user.id && user.id.toLowerCase().includes(k)) ||
               (user.name && user.name.toLowerCase().includes(k)) ||
               (user.ip && user.ip.includes(k))
      })
    },
    office () {
      if (this.systemConfigs) {
        return this.systemConfigs.site
      }
      return this.site
    },
    // 分組邏輯核心
    categories () {
      switch (this.selectedGroup) {
        case 'unit':
          return this.groupBy('unit')
        case 'title':
          return this.groupBy('title')
        case 'work':
          return this.groupBy('work')
        case 'sex':
          return this.groupBy('sex')
        case 'ip':
          return this.groupBy('ip')
        case 'role':
          return this.groupByRole()
        default:
          return [{ NAME: '未分類', LIST: this.filteredUsers }]
      }
    },
    // 預先排序好的清單，供 groupBy 使用
    usersByIpAsc () {
      return [...this.filteredUsers].sort((a, b) => {
        const bv = this.$utils.ipv4Int(b.ip)
        const av = this.$utils.ipv4Int(a.ip)
        if (bv > av) { return -1 }
        if (bv < av) { return 1 }
        return 0
      })
    },
    usersById () {
      return [...this.filteredUsers].sort(function (a, b) {
        if (b.id > a.id) { return -1 }
        if (b.id < a.id) { return 1 }
        return 0
      })
    },
    editUserTitle () { return `編輯 ${this.clickedUser.id} ${this.clickedUser.name} 資訊` }
  },

  watch: {
    type (val) {
      this.users = []
      if (val !== '') {
        this.$fetch()
      }
    },
    // 記住用戶顯示偏好
    showAvatar (val) { localStorage.setItem('user_mgt_show_avatar', val) },
    showIp (val) { localStorage.setItem('user_mgt_show_ip', val) }
  },

  mounted () {
    // 讀取用戶顯示偏好，若無紀錄則保持 data 內的預設值 (true)
    const cachedAvatar = localStorage.getItem('user_mgt_show_avatar')
    const cachedIp = localStorage.getItem('user_mgt_show_ip')

    if (cachedAvatar !== null) {
      this.showAvatar = cachedAvatar === 'true'
    }

    if (cachedIp !== null) {
      this.showIp = cachedIp === 'true'
    }
  },

  methods: {
    // --- 高亮搜尋文字 ---
    highlight (text) {
      if (!text) { return '' }
      if (this.$utils.empty(this.keyword)) { return text }
      // 使用正則表達式進行全域不分大小寫替換，並加上 Bootstrap 高亮樣式
      const regex = new RegExp(`(${this.keyword})`, 'gi')
      return text.toString().replace(regex, '<span class="bg-warning text-dark font-weight-bold px-1 rounded">$1</span>')
    },
    // --- 資料分組與排序邏輯 ---
    translateGroupName (name) {
      if (parseInt(name) === 1) { return '男生' }
      if (parseInt(name) === 0) { return '女生' }
      return this.$utils.empty(name) ? '未設定' : name
    },
    groupBy (field) {
      const filtered = []
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)

      sortTarget.forEach((item) => {
        const found = filtered.find(category => category.NAME === item[field])
        if (found) {
          found.LIST.push(item)
        } else {
          filtered.push({ NAME: item[field], LIST: [item] })
        }
      })
      filtered.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return filtered
    },
    groupByRole () {
      const filtered = [
        { NAME: '系統管理者', LIST: [] },
        { NAME: '主管', LIST: [] },
        { NAME: '研考', LIST: [] },
        { NAME: '人事管理者', LIST: [] },
        { NAME: '公告管理者', LIST: [] },
        { NAME: '一般使用者', LIST: [] }
      ]
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)

      sortTarget.forEach((item) => {
        const userAuthority = this.getAuthority(item)
        if (userAuthority.isAdmin) { return filtered[0].LIST.push(item) }
        if (userAuthority.isChief) { return filtered[1].LIST.push(item) }
        if (userAuthority.isRAE) { return filtered[2].LIST.push(item) }
        if (userAuthority.isUserMgtStaff) { return filtered[3].LIST.push(item) }
        if (userAuthority.isNotifyMgtStaff) { return filtered[4].LIST.push(item) }
        return filtered[5].LIST.push(item)
      })
      filtered.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return filtered
    },
    sortAsc (a, b) {
      if ((b.LIST.length - a.LIST.length) === 0) {
        const regex = /^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$/g
        const bv = b.NAME.match(regex) ? this.$utils.ipv4Int(b.NAME) : b.NAME
        const av = a.NAME.match(regex) ? this.$utils.ipv4Int(a.NAME) : a.NAME
        if (bv > av) { return 1 }
        if (bv < av) { return -1 }
        return 0
      }
      return b.LIST.length - a.LIST.length
    },
    sortDesc (a, b) {
      const val = this.sortAsc(a, b)
      if (val > 0) { return -1 }
      if (val < 0) { return 1 }
      return 0
    },

    // --- CRUD 操作 ---
    add () {
      this.showModalById('add-user-modal')
    },
    added (event) {
      this.users.unshift(event.detail)
      this.hideModalById('add-user-modal')
      this.notify(`新增 ${event.detail.id} ${event.detail.name} 成功`, { type: 'success' })
    },
    edit (user) {
      this.clickedUser = user
      this.showModalById('edit-user-modal')
    },
    saved (event) {
      this.update(event.detail)
      this.hideModalById('edit-user-modal')
      this.notify(`更新 ${this.clickedUser.id} ${this.clickedUser.name} 完成`, { type: 'success' })
    },
    update (userData) {
      const foundIdx = this.users.findIndex(item => item.id === userData.id)
      if (foundIdx !== -1) {
        // 使用解構更新，觸發 Vue 2 反應性
        this.users.splice(foundIdx, 1, { ...this.users[foundIdx], ...userData })
      }
    },

    // --- 顯示輔助函式 ---
    variant (user) {
      const userAuthority = this.getAuthority(user)
      if (userAuthority.isDisabled || !this.$utils.empty(user.offboard_date)) { return 'secondary' }
      if (userAuthority.isAdmin) { return 'danger' }
      if (userAuthority.isChief) { return 'primary' }
      if (userAuthority.isRAE) { return 'warning' }
      if (userAuthority.isUserMgtStaff) { return 'success' }
      if (userAuthority.isNotifyMgtStaff) { return 'outline-info' }
      return 'outline-dark'
    },
    role (user) {
      const userAuthority = this.getAuthority(user)
      if (userAuthority.isDisabled || !this.$utils.empty(user.offboard_date)) { return '已被停用' }
      if (userAuthority.isAdmin) { return '系統管理者' }
      if (userAuthority.isChief) { return '主管' }
      if (userAuthority.isRAE) { return '研考' }
      if (userAuthority.isUserMgtStaff) { return '人事管理者' }
      if (userAuthority.isNotifyMgtStaff) { return '公告管理者' }
      return ''
    },
    getAuthority (user) {
      const authority = user.authority || 0
      return {
        isAdmin: this.$consts.AUTHORITY.ADMIN === (authority & this.$consts.AUTHORITY.ADMIN),
        isChief: this.$consts.AUTHORITY.CHIEF === (authority & this.$consts.AUTHORITY.CHIEF),
        isDisabled: this.$consts.AUTHORITY.DISABLED === (authority & this.$consts.AUTHORITY.DISABLED) || !this.$utils.empty(user.offboard_date),
        isRAE: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION === (authority & this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION),
        isUserMgtStaff: this.$consts.AUTHORITY.USER_MANAGEMENT === (authority & this.$consts.AUTHORITY.USER_MANAGEMENT),
        isNotifyMgtStaff: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT === (authority & this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT)
      }
    },
    // 根據按鈕背景判斷 IP 後半段的文字顏色 (視覺優化)
    ipClass (user) {
      const v = this.variant(user)
      // 深色背景 (藍、紅、綠、灰) -> 使用亮黃色 + 粗體
      if (['primary', 'danger', 'success', 'secondary'].includes(v)) {
        return 'ip-text-light'
      }
      // 淺色背景 (黃、白) -> 使用深藍色 + 粗體
      return 'ip-text-dark'
    },
    avatarSrc (user) {
      return `/img/get_user_img.php?id=${user.id}_avatar&name=${user.name}_avatar`
    },
    ipParts (user) {
      return user.ip.split('.')
    }
  }
}
</script>

<style lang="scss" scoped>
.user-badge {
  width: 240px;
  justify-content: flex-start !important;
  transition: transform 0.25s ease; // 平滑的放大效果
  position: relative; // 確保 z-index 生效，避免 hover 時被遮擋

  &:hover {
    transform: scale(1.25); // 使用 transform 放大，不會影響文檔流 (不會推擠旁邊的元素)
    z-index: 10; // 確保放大時覆蓋在其他元素之上
  }

  // 修正 outline 樣式在 hover 時，背景變深導致深色文字看不清的問題
  // 針對 outline-dark 和 outline-info，hover 時將 ip-text-dark 轉為 ip-text-light 的樣式
  &.btn-outline-dark:hover,
  &.btn-outline-info:hover {
    .ip-text-dark {
      color: #FFEB3B !important;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
    }
  }
}

/* 深色背景上的高亮顯示：亮黃色 + 粗體 + 微陰影 */
.ip-text-light {
  color: #FFEB3B !important;
  font-weight: 900;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.4);
}

/* 淺色背景上的高亮顯示：深藍色 + 粗體 */
.ip-text-dark {
  color: #0033cc !important;
  font-weight: 900;
}
</style>
