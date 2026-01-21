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
        //- AD 設定按鈕 (動態顏色與提示)
        lah-button.mr-1.text-nowrap(
          icon="cogs"
          :variant="adConfigVariant"
          title="AD 連線設定"
          @click="showAdConfigModal"
          v-b-tooltip.hover
          :title="adConfigTooltip"
        ) AD 設定

        //- IP 列表按鈕
        lah-button.mr-1.text-nowrap(
          icon="list-ul"
          variant="outline-secondary"
          title="檢視目前使用者 IP 清單"
          @click="showIpListModal"
        ) IP 清單

        //- 更新 IP 按鈕
        lah-button.mr-1.text-nowrap(
          icon="network-wired"
          variant="outline-info"
          title="獲取登入紀錄並依權重更新 IP"
          @click="getDynamicIPEntries"
          :disabled="isBusy"
        ) 更新 IP

        lah-button(
          icon="user-plus"
          variant="outline-primary"
          title="新增使用者"
          no-icon-gutter
          @click="add"
        )

  //- 幫助說明 Modal (XL 大小解決排版問題)
  lah-help-modal(:modal-id="'help-modal'" size="xl")
    h5.font-weight-bold.text-primary 💡 操作指南
    ul.pl-4
      li.mb-2
        .d-flex.align-items-center.flex-wrap
          span.font-weight-bold 更新 IP：
          span 點擊
          lah-button(icon="network-wired" variant="outline-info" size="sm" class="mx-1") 更新 IP
          span 系統會抓取最近 7 天的登入紀錄。優先權：符合 #[b 本所內部網段 (依據站點代碼動態計算，排除設備網段)] 者優先。若判定唯一則自動更新；多筆衝突則會提示。

      li.mb-2
        .d-flex.align-items-center.flex-wrap
          span.font-weight-bold IP 清單：
          span 點擊
          lah-button(icon="list-ul" variant="outline-secondary" size="sm" class="mx-1") IP 清單
          span 可查看目前系統內所有使用者的 IP 設定狀況，點擊表格中的任一列即可編輯該使用者資訊。

      li.mb-2
        .d-flex.align-items-center.flex-wrap
          span.font-weight-bold AD 連線設定：
          span 點擊右上角的
          lah-button(icon="cogs" variant="outline-secondary" size="sm" no-icon-gutter class="mx-1") AD 設定
          span 按鈕。若設定不完整會顯示為紅色警示顏色。

      li.mb-2
        .d-flex.align-items-center.flex-wrap
          span.font-weight-bold 警示顯示：
          span 若使用者資料中 #[span.ip-alert-style 無 IP] 或 IP #[b 尾數為 .0]，系統會以亮紅色醒目字體顯示，提醒管理者該人員可能尚未配置或回報電腦位址。

    hr

    h5.font-weight-bold.text-primary 🎨 顯示設定
    ul.pl-4
      li.mb-2
        span.font-weight-bold IP 顯示：
        span 開啟後顯示 IP 位址，系統會依據名牌底色自動切換對比文字顏色（深色底用亮黃，淺色底用深藍）。

    hr

    h5.font-weight-bold.text-primary 🏷️ 角色權限圖例
    .row.no-gutters
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="outline-secondary" size="sm" style="width: 85px; white-space: nowrap") 一般人員
        span.small 預設權限人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="secondary" size="sm" style="width: 85px; white-space: nowrap") 離職
        span.small 已離職人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="outline-success" size="sm" style="width: 85px; white-space: nowrap") 系統管理
        span.small 最高權限管理者
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="primary" size="sm" style="width: 85px; white-space: nowrap") 主管
        span.small 課室主管人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="warning" size="sm" style="width: 85px; white-space: nowrap") 研考
        span.small 研考相關人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="success" size="sm" style="width: 85px; white-space: nowrap") 人員管理
        span.small 人事管理人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-button.mr-2(variant="outline-info" size="sm" style="width: 85px; white-space: nowrap") 公告管理
        span.small 訊息公告發布人員

  hr

  //- 主要控制區塊
  section
    .d-flex.justify-content-between.mb-2
      .d-flex.align-items-center
        b-form-radio-group(
          v-model="selectedGroup"
          :options="groupOptions"
          buttons
          button-variant="outline-dark"
          class="my-auto"
          size="sm"
        )
        b-form-radio-group(
          v-model="sortOrder"
          :options="sortOpts"
          class="ml-3 my-auto"
          size="sm"
        )

      span.text-muted.my-auto.lah-shadow 找到 #[b-badge( pill class="my-auto" variant="info") {{ filteredUsers.length }}] 個使用者

      .d-flex.my-auto.align-items-center
        b-form-checkbox(v-model="showAvatar" switch class="mr-3") 大頭照
        b-form-checkbox(v-model="showIp" switch class="mr-3") IP
        b-form-checkbox-group(v-model="filter" :options="filterOptions")

        b-input.ml-3(
          v-model="keyword"
          placeholder="搜尋姓名、ID 或 IP..."
          size="sm"
          style="width: 220px"
          trim
        )

  hr

  //- 使用者列表區塊
  section.mb-3(v-for="category in categories" :key="category.NAME")
    h5.lah-shadow: lah-fa-icon(v-b-toggle="$utils.md5(category.NAME)" icon="address-book" regular style="cursor: pointer")
      span {{ translateGroupName(category.NAME) }}
      b-badge.ml-1.my-auto(pill variant="info") {{ category.LIST.length }}

    b-collapse(:id="$utils.md5(category.NAME)" visible)
      .d-flex.flex-wrap.align-items-center
        b-button(
          v-for="user in category.LIST"
          :key="user['id']"
          :variant="variant(user)"
          :pill="showAvatar"
          :title="role(user)"
          size="sm"
          class="mx-1 my-1 shadow d-inline-flex align-items-center user-badge"
          @click="edit(user)"
        )
          .mr-2(v-if="showAvatar")
            b-avatar(variant="light" size="3rem" :src="avatarSrc(user)")

          .d-flex.flex-column.align-items-start.justify-content-center
            div
              span.font-weight-bold.mr-1(v-html="highlight(user.id)")
              span(v-html="highlight(user.name)")
            .small.font-weight-bolder(v-if="showIp")
              template(v-if="isValidIp(user)")
                //- 正常 IP 顯示
                span(v-html="highlight(ipParts(user)[0] + '.' + ipParts(user)[1])")
                span(:class="ipClass(user)" v-html="highlight('.' + ipParts(user)[2] + '.' + ipParts(user)[3])")
              template(v-else)
                //- 無 IP 或 IP 尾數為 .0 顯示：套用醒目警示樣式
                span.ip-alert-style {{ user.ip && user.ip.endsWith('.0') ? user.ip : '無 IP' }}

  hr

  //- IP 列表檢視 Modal (加入篩選連動)
  b-modal(
    id="ip-list-modal"
    title="使用者 IP 對應清單"
    size="xl"
    hide-footer
    scrollable
  )
    .d-flex.justify-content-between.mb-3.flex-wrap
      //- 關鍵字搜尋
      b-input-group(size="sm" class="mr-2 mb-2" style="width: 250px")
        b-input-group-prepend(is-text)
          lah-fa-icon(icon="search")
        b-form-input.h-100(v-model="ipListFilter" placeholder="搜尋 ID、姓名、IP...")

      //- 課室篩選
      b-input-group(size="sm" class="mr-2 mb-2" style="width: 200px")
        b-input-group-prepend(is-text) 課室
        b-form-select.h-100(v-model="ipListUnit" :options="unitOptions")
          template(#first)
            b-form-select-option(value="") 全部

      //- 職稱篩選
      b-input-group(size="sm" class="mr-2 mb-2" style="width: 200px")
        b-input-group-prepend(is-text) 職稱
        b-form-select.h-100(v-model="ipListTitle" :options="titleOptions")
          template(#first)
            b-form-select-option(value="") 全部

      //- 匯出按鈕
      div.mb-2
        lah-button(
          icon="file-excel"
          variant="outline-success"
          size="md"
          @click="exportIpList"
          title="匯出篩選結果為 Excel (CSV)"
        ) 匯出

    //- 表格資料改用 filteredIpList
    b-table(
      :items="filteredIpList"
      :fields="ipListFields"
      striped
      hover
      bordered
      responsive
      small
      head-variant="dark"
      :per-page="15"
      :current-page="ipListPage"
      @row-clicked="edit"
      tbody-tr-class="pointer"
    )
      //- 在名字前顯示 Avatar
      template(#cell(name)="{ item }")
        .d-flex.align-items-center
          b-avatar.mr-2(size="sm" :src="avatarSrc(item)" variant="light")
          span {{ item.name }}

      template(#cell(ip)="{ item }")
        div(v-if="isValidIp(item)")
          span.text-primary.font-weight-bold {{ item.ip }}
        div(v-else)
          span.ip-alert-style {{ item.ip || '無' }}

      template(#cell(unit)="{ item }")
        b-badge(variant="light") {{ item.unit }} - {{ item.title }}

    //- 分頁總數連動篩選結果
    b-pagination(
      v-model="ipListPage"
      :total-rows="filteredIpList.length"
      :per-page="15"
      align="center"
      class="mt-3"
    )

  //- 編輯使用者 Modal
  b-modal(id="edit-user-modal" :title="editUserTitle" size="lg" hide-footer scrollable no-close-on-backdrop)
    lah-user-edit-card(:raw="[clickedUser]" @saved="saved($event)")

  b-modal(id="add-user-modal" title="手動新增使用者" size="lg" hide-footer scrollable no-close-on-backdrop)
    lah-user-add-card(@added="added($event)")

  b-modal(id="ad-config-modal" title="AD 連線設定" size="lg" hide-footer no-close-on-backdrop)
    lah-ad-config-card(:init-data="adConfig" @saved="adConfigSaved" @reload="loadAdConfig" @synced="$fetch")

  b-modal(id="ip-conflict-modal" title="IP 更新選擇" size="xl" hide-footer scrollable)
    p.text-muted 偵測到以下人員有多筆符合規則的 IP 紀錄。系統已過濾目前 IP，請點選欲套用的正確地址：
    b-table(:items="ipConflictList" :fields="conflictFields" striped hover bordered responsive)
      template(#cell(candidates)="{ item }")
        b-form-radio-group(v-model="item.selectedIp" stacked)
          b-form-radio(v-for="cand in item.candidates" :value="cand.ip" :key="cand.ip")
            span.mr-2.font-weight-bold {{ cand.ip }}
            span.small.text-muted (最後登入: {{ cand.timestamp }})

      template(#cell(action)="{ item }")
        lah-button(
          icon="check"
          size="sm"
          variant="outline-primary"
          @click="updateUserIp(item.id, item.selectedIp)"
          :disabled="!item.selectedIp"
        ) 套用此 IP
</template>

<script>
import lahAdConfigCard from '~/components/lah-ad-config-card.vue';
import lahUserAddCard from '~/components/lah-user-add-card.vue';
import lahUserEditCard from '~/components/lah-user-edit-card.vue';

export default {
  components: { lahUserEditCard, lahUserAddCard, lahAdConfigCard },
  middleware: ['isAdmin'],

  data: () => ({
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
      { html: '↓', value: true },
      { html: '↑', value: false }
    ],
    showAvatar: true,
    showIp: true,
    keyword: '',
    filter: ['on'],
    filterOptions: [
      { text: '在職', value: 'on' },
      { text: '離職', value: 'off' }
    ],
    users: [],
    clickedUser: { id: '', name: '' },
    adConfig: {},
    dynamicIPEntries: [],
    ipConflictList: [],
    conflictFields: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: '姓名', sortable: true },
      { key: 'currentIp', label: '目前 IP' },
      { key: 'candidates', label: '候選 IP (請點選)' },
      { key: 'action', label: '操作', class: 'text-center' }
    ],
    // IP 列表相關
    ipListFilter: '',
    ipListUnit: '', // 課室篩選
    ipListTitle: '', // 職稱篩選
    ipListPage: 1,
    ipListFields: [
      { key: 'id', label: '帳號', sortable: true },
      { key: 'name', label: '姓名', sortable: true },
      { key: 'unit', label: '單位職稱', sortable: true },
      { key: 'ip', label: 'IP 位址', sortable: true },
      { key: 'ext', label: '分機', sortable: true }
    ]
  }),

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
    this.loadAdConfig()
  },

  head: { title: '員工資訊管理-桃園市地政局' },

  computed: {
    type () {
      if (this.filter.length === 2) { return 'all_users' }
      if (this.filter.includes('on')) { return 'on_board_users' }
      if (this.filter.includes('off')) { return 'off_board_users' }
      return ''
    },
    filteredUsers () {
      if (this.$utils.empty(this.keyword)) { return this.users }
      const k = this.keyword.toLowerCase()
      return this.users.filter((u) => {
        return (u.id && u.id.toLowerCase().includes(k)) ||
               (u.name && u.name.toLowerCase().includes(k)) ||
               (u.ip && u.ip.includes(k))
      })
    },
    categories () {
      switch (this.selectedGroup) {
        case 'unit': return this.groupBy('unit')
        case 'title': return this.groupBy('title')
        case 'work': return this.groupBy('work')
        case 'sex': return this.groupBy('sex')
        case 'ip': return this.groupBy('ip')
        case 'role': return this.groupByRole()
        default: return [{ NAME: '未分類', LIST: this.filteredUsers }]
      }
    },
    usersByIpAsc () {
      return [...this.filteredUsers].sort((a, b) => {
        return this.$utils.ipv4Int(a.ip) - this.$utils.ipv4Int(b.ip)
      })
    },
    usersById () {
      return [...this.filteredUsers].sort((a, b) => a.id.localeCompare(b.id))
    },
    editUserTitle () { return `編輯 ${this.clickedUser.id} ${this.clickedUser.name} 資訊` },
    isAdConfigValid () {
      const c = this.adConfig
      return c.AD_HOST && c.AD_PORT && c.BASE_DN && c.QUERY_USER && c.QUERY_PASSWORD
    },
    adConfigVariant () { return this.isAdConfigValid ? 'outline-secondary' : 'outline-danger' },
    adConfigTooltip () { return this.isAdConfigValid ? 'AD 設定已完成' : 'AD 設定不完整，請點擊更新' },

    // 提取所有不重複的課室
    unitOptions () {
      const units = [...new Set(this.users.map(u => u.unit).filter(Boolean))]
      return units.sort().map(u => ({ value: u, text: u }))
    },
    // 提取所有不重複的職稱
    titleOptions () {
      const titles = [...new Set(this.users.map(u => u.title).filter(Boolean))]
      return titles.sort().map(t => ({ value: t, text: t }))
    },
    // IP 列表綜合篩選邏輯
    filteredIpList () {
      return this.users.filter((user) => {
        // 1. 關鍵字過濾 (ID, Name, IP)
        let keywordMatch = true
        if (this.ipListFilter) {
          const k = this.ipListFilter.toLowerCase()
          keywordMatch = (user.id && user.id.toLowerCase().includes(k)) ||
                         (user.name && user.name.toLowerCase().includes(k)) ||
                         (user.ip && user.ip.includes(k))
        }

        // 2. 課室過濾
        let unitMatch = true
        if (this.ipListUnit) {
          unitMatch = user.unit === this.ipListUnit
        }

        // 3. 職稱過濾
        let titleMatch = true
        if (this.ipListTitle) {
          titleMatch = user.title === this.ipListTitle
        }

        return keywordMatch && unitMatch && titleMatch
      })
    }
  },

  watch: {
    type (val) { this.users = []; if (val !== '') { this.$fetch() } },
    showAvatar (val) { localStorage.setItem('user_mgt_show_avatar', val) },
    showIp (val) { localStorage.setItem('user_mgt_show_ip', val) },
    dynamicIPEntries (val) {
      this.$utils.warn('Dynamic IP entries fetched:', val.length)
    },
    // 當篩選條件變動時，重置分頁回第一頁
    filteredIpList () {
      this.ipListPage = 1
    }
  },

  mounted () {
    const avatar = localStorage.getItem('user_mgt_show_avatar')
    const ip = localStorage.getItem('user_mgt_show_ip')
    if (avatar !== null) { this.showAvatar = avatar === 'true' }
    if (ip !== null) { this.showIp = ip === 'true' }
  },

  methods: {
    // 顯示 IP 列表 Modal
    showIpListModal () {
      this.showModalById('ip-list-modal')
    },

    // 匯出篩選後的 IP 列表
    exportIpList () {
      const csvContent = [
        ['帳號', '姓名', '單位', '職稱', 'IP', '分機'],
        ...this.filteredIpList.map(u => [u.id, u.name, u.unit, u.title, u.ip || '', u.ext || ''])
      ].map(e => e.join(',')).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `ip_list_${this.$utils.now().split(' ')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    highlight (text) {
      if (!text || this.$utils.empty(this.keyword)) { return text }
      const regex = new RegExp(`(${this.keyword})`, 'gi')
      return text.toString().replace(regex, '<span class="bg-warning text-dark font-weight-bold px-1 rounded">$1</span>')
    },

    translateGroupName (name) {
      if (parseInt(name) === 1) { return '男生' }
      if (parseInt(name) === 0) { return '女生' }
      return this.$utils.empty(name) ? '未設定' : name
    },

    groupBy (field) {
      const res = []
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item) => {
        const found = res.find(c => c.NAME === item[field])
        if (found) { found.LIST.push(item) } else { res.push({ NAME: item[field], LIST: [item] }) }
      })
      res.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return res
    },

    groupByRole () {
      const res = [
        { NAME: '系統管理者', LIST: [] }, { NAME: '主管', LIST: [] },
        { NAME: '研考', LIST: [] }, { NAME: '人事管理者', LIST: [] },
        { NAME: '公告管理者', LIST: [] }, { NAME: '一般使用者', LIST: [] }
      ]
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item) => {
        const auth = this.getAuthority(item)
        if (auth.isAdmin) { return res[0].LIST.push(item) }
        if (auth.isChief) { return res[1].LIST.push(item) }
        if (auth.isRAE) { return res[2].LIST.push(item) }
        if (auth.isUserMgtStaff) { return res[3].LIST.push(item) }
        if (auth.isNotifyMgtStaff) { return res[4].LIST.push(item) }
        return res[5].LIST.push(item)
      })
      res.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return res
    },

    sortAsc (a, b) {
      if (a.LIST.length === b.LIST.length) { return a.NAME?.localeCompare(b.NAME) }
      return b.LIST.length - a.LIST.length
    },

    sortDesc (a, b) { return this.sortAsc(b, a) },

    add () { this.showModalById('add-user-modal') },
    added (event) {
      this.users.unshift(event.detail)
      this.hideModalById('add-user-modal')
      this.notify(`新增 ${event.detail.id} 成功`, { type: 'success' })
    },
    edit (user) { this.clickedUser = user; this.showModalById('edit-user-modal') },
    saved (event) {
      this.update(event.detail)
      this.hideModalById('edit-user-modal')
      this.notify(`更新 ${this.clickedUser.id} 完成`, { type: 'success' })
    },
    update (userData) {
      const idx = this.users.findIndex(u => u.id === userData.id)
      if (idx !== -1) { this.users.splice(idx, 1, { ...this.users[idx], ...userData }) }
    },

    showAdConfigModal () { this.loadAdConfig(); this.showModalById('ad-config-modal') },
    loadAdConfig () {
      this.$axios.post(this.$consts.API.JSON.USER, { type: 'ad_config' }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) { this.adConfig = { ...data.raw } }
      }).catch(err => this.$utils.error(err))
    },
    adConfigSaved (newConfig) { this.adConfig = { ...newConfig }; this.hideModalById('ad-config-modal') },

    // --- 更新 IP 核心邏輯 ---
    getDynamicIPEntries () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'dynamic_ip_entries',
        offset: 604800 // 7 days
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.dynamicIPEntries = [...data.raw]
          this.notify('登入紀錄讀取成功，開始權重比對...', { type: 'success' })
          this.checkIpUpdates(this.dynamicIPEntries)
        } else {
          this.notify(data.message, { type: 'warning' })
        }
      }).catch(err => this.$utils.error(err)).finally(() => { this.isBusy = false })
    },

    /**
     * 優先網段定義：根據此站點代碼 (HA~HH) 決定 IP 優先權
     * 計算方式:
     * 1. 取得站點代碼的第二個字元 (A~H)。
     * 2. 利用 ASCII Code 計算對應數值 (A=1, B=2, ... H=8)。
     * 3. 網段第三碼起始值為 (數值 * 10)，例如 HA -> 10, HB -> 20。
     * 4. 有效範圍為 起始值 ~ 起始值+9，例如 HA -> 10~19。
     * 5. 特別排除網段的後三碼 (x7, x8, x9)，視為設備保留區段。
     * 6. [新增] 嚴格排除 192.168.72.x 等不符合計算規則的網段
     *
     * 範例:
     * HA (A=65-64=1) -> 1*10 = 10 -> 範圍 10 ~ 19 -> 排除 17, 18, 19 -> 有效 10 ~ 16
     * HB (B=66-64=2) -> 2*10 = 20 -> 範圍 20 ~ 29 -> 排除 27, 28, 29 -> 有效 20 ~ 26
     */
    isPriorityIp (ip) {
      if (!ip) { return false }
      const parts = ip.split('.').map(Number)
      // 固定網段 192.168
      if (parts[0] !== 192 || parts[1] !== 168) { return false }

      // 取得站點代碼 (e.g. HA, HB...)
      const site = this.site || ''
      // 取第 2 碼 (A..H)
      const code = site.length > 1 ? site.charAt(1).toUpperCase() : ''

      if (code >= 'A' && code <= 'H') {
        // A(65)-64=1 -> 1*10=10 (HA)
        // H(72)-64=8 -> 8*10=80 (HH)
        const idx = code.charCodeAt(0) - 64
        const start = idx * 10
        // 原本範圍是 start ~ start+9
        // 依據需求排除後三碼 (x7, x8, x9)，故結束點為 start + 6
        // 例如 HA: 10 ~ 16 (排除 17, 18, 19)
        const end = start + 6

        // 判斷第三段 IP 是否在範圍內
        return parts[2] >= start && parts[2] <= end
      }

      return false
    },

    async checkIpUpdates (entries) {
      const userMap = {}
      entries.forEach((e) => {
        if (!userMap[e.entry_id]) { userMap[e.entry_id] = [] }
        userMap[e.entry_id].push(e)
      })

      const autoUpdateList = []
      const manualConflictList = []

      this.users.forEach((user) => {
        const records = userMap[user.id]
        if (!records) { return }

        // 過濾出與目前 IP 不同，且符合站點網段的 IP
        // [新增] 強制使用 isPriorityIp 過濾，不符合者直接忽略
        const validDiffIps = [...new Set(records.map(r => r.ip))]
          .filter(ip => ip !== user.ip && this.isPriorityIp(ip))

        if (validDiffIps.length === 0) { return }

        if (validDiffIps.length === 1) {
          // 情況 A：只有一個符合條件的新 IP -> 直接列入自動更新
          autoUpdateList.push({ id: user.id, ip: validDiffIps[0], name: user.name })
        } else {
          // 情況 B：有多個符合條件的新 IP -> 進入手動選擇
          const candidates = validDiffIps.map((ip) => {
            const latest = records.filter(r => r.ip === ip).sort((a, b) => b.timestamp - a.timestamp)[0]
            return { ip, timestamp: this.$utils.phpTsToAdDateStr(latest.timestamp, true) }
          })
          manualConflictList.push({ id: user.id, name: user.name, currentIp: user.ip, candidates, selectedIp: null })
        }
      })

      if (autoUpdateList.length > 0) {
        // 改用客製化 VNode 顯示詳細清單
        const h = this.$createElement
        const messageNode = h('div', [
          h('p', `偵測到 ${autoUpdateList.length} 位人員具備內部網段之 IP 變動，是否執行同步？`),
          h('ul', { class: 'pl-4 text-left', style: { maxHeight: '300px', overflowY: 'auto' } },
            autoUpdateList.map(item => h('li', { class: 'mb-1' }, [
              h('span', { class: 'font-weight-bold mr-2' }, `${item.id} ${item.name}`),
              h('span', { class: 'text-muted' }, '➔'),
              h('span', { class: 'text-primary ml-2 font-weight-bold' }, item.ip)
            ]))
          )
        ])

        const ans = await this.$bvModal.msgBoxConfirm(messageNode, {
          title: 'IP 自動更新確認',
          size: 'md',
          okVariant: 'success',
          okTitle: '確認更新',
          cancelTitle: '取消',
          centered: true
        })

        if (ans) { await this.processUpdatesSequentially(autoUpdateList) }
      }

      if (manualConflictList.length > 0) {
        this.ipConflictList = manualConflictList
        this.showModalById('ip-conflict-modal')
      } else if (autoUpdateList.length === 0) {
        this.notify('目前無符合內部網段規則的 IP 變動。', { type: 'info' })
      }
    },

    async processUpdatesSequentially (list) {
      this.isBusy = true
      let count = 0
      for (const item of list) {
        const res = await this.updateUserIp(item.id, item.ip, true)
        if (res && this.$utils.statusCheck(res.status)) { count++ }
      }
      this.notify(`同步作業結束，共成功更新 ${count} 位人員 IP。`, { type: 'success' })
      this.isBusy = false
    },

    async updateUserIp (id, ip, silent = false) {
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, { type: 'upd_ip', id, ip })
        if (this.$utils.statusCheck(data.status)) {
          if (!silent) { this.notify(`${id} IP 已更新`, { type: 'success' }) }
          this.update({ id, ip })
          if (this.ipConflictList.length > 0) {
            this.ipConflictList = this.ipConflictList.filter(item => item.id !== id)
            if (this.ipConflictList.length === 0) { this.hideModalById('ip-conflict-modal') }
          }
        } else if (!silent) {
          this.warning(`${id} 更新失敗: ${data.message}`)
        }
        return data
      } catch (err) { this.$utils.error(err); return null }
    },

    // --- UI 輔助方法 ---
    variant (user) {
      const auth = this.getAuthority(user)
      if (auth.isDisabled) { return 'secondary' }
      if (auth.isAdmin) { return 'outline-success' }
      if (auth.isChief) { return 'primary' }
      if (auth.isRAE) { return 'warning' }
      if (auth.isUserMgtStaff) { return 'success' }
      if (auth.isNotifyMgtStaff) { return 'outline-info' }
      return 'outline-secondary'
    },
    role (user) {
      const auth = this.getAuthority(user)
      if (auth.isDisabled) { return '已離職' }
      if (auth.isAdmin) { return '系統管理者' }
      if (auth.isChief) { return '主管' }
      if (auth.isRAE) { return '研考' }
      if (auth.isUserMgtStaff) { return '人事管理者' }
      return '一般使用者'
    },
    getAuthority (user) {
      const a = user.authority || 0
      return {
        isAdmin: (a & this.$consts.AUTHORITY.ADMIN) === this.$consts.AUTHORITY.ADMIN,
        isChief: (a & this.$consts.AUTHORITY.CHIEF) === this.$consts.AUTHORITY.CHIEF,
        isDisabled: (a & this.$consts.AUTHORITY.DISABLED) === this.$consts.AUTHORITY.DISABLED || !this.$utils.empty(user.offboard_date),
        isRAE: (a & this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION) === this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION,
        isUserMgtStaff: (a & this.$consts.AUTHORITY.USER_MANAGEMENT) === this.$consts.AUTHORITY.USER_MANAGEMENT,
        isNotifyMgtStaff: (a & this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT) === this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT
      }
    },
    ipClass (user) {
      const v = this.variant(user)
      // 根據 Bootstrap 語意判斷背景深淺
      return ['primary', 'success', 'secondary'].includes(v) ? 'ip-text-light' : 'ip-text-dark'
    },
    avatarSrc (user) { return `/img/get_user_img.php?id=${user.id}_avatar&name=${user.name}_avatar` },

    /**
     * 判定是否為有效的顯示 IP
     * 加入判定：若 IP 尾數為 .0 也視為無效 IP
     */
    isValidIp (user) {
      if (!user.ip || typeof user.ip !== 'string') { return false }
      const parts = user.ip.split('.')
      // 必須有四段且最後一段不為 '0'
      return parts.length === 4 && parts[3] !== '0'
    },
    ipParts (user) { return user.ip.split('.') }
  }
}
</script>

<style lang="scss" scoped>
.user-badge {
  width: 240px;
  justify-content: flex-start !important;
  transition: transform 0.25s ease;
  position: relative;
  &:hover {
    transform: scale(1.25);
    z-index: 10;
  }
  &.btn-outline-dark:hover,
  &.btn-outline-info:hover {
    .ip-text-dark { color: #FFEB3B !important; text-shadow: 1px 1px 1px rgba(0,0,0,0.4); }
  }
}

// 亮黃色高亮樣式 (用於深色底名牌)
.ip-text-light { color: #FFEB3B !important; font-weight: 900; text-shadow: 1px 1px 1px rgba(0,0,0,0.4); }

// 深藍色高亮樣式 (用於淺色底名牌)
.ip-text-dark {
  color: #0033cc !important;
  font-weight: 900;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8), 1px 1px 1px rgba(0, 0, 0, 0.2);
}

// [醒目樣式] 亮紅色、粗體、文字陰影（用於「無 IP」或「尾數 .0」情況）
.ip-alert-style {
  color: #ff3b3b !important;
  font-weight: 900 !important;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8), 1px 1px 1px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

// [新增] 表格行點擊手勢
.pointer {
  cursor: pointer;
}
</style>
