<template>
  <div v-cloak class="admin-roles-page">
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between align-items-center w-100">
          <div class="d-flex align-items-center">
            <h3 class="my-auto font-weight-bold mb-0">
              <lah-fa-icon icon="users-cog" class="mr-2" />使用者角色管理
            </h3>
            <b-badge variant="primary" pill class="ml-2 py-1 px-2 font-weight-normal">
              共 {{ tableItems.length }} 筆設定
            </b-badge>
            <lah-button
              v-b-modal.help-modal
              icon="info"
              size="lg"
              variant="outline-success"
              no-border
              no-icon-gutter
              title="角色權限說明"
              class="ml-2"
            />
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              icon="sync-alt"
              size="lg"
              variant="outline-secondary"
              no-icon-gutter
              class="border-0"
              title="重新整理資料"
              :disabled="isBusy"
              @click="reload"
            />
            <lah-button
              v-b-modal.add-authority-modal
              icon="user-plus"
              size="lg"
              variant="outline-primary"
              no-icon-gutter
              class="border-0"
              title="新增角色權限"
            >
              新增權限
            </lah-button>
          </b-button-group>
        </div>
      </lah-transition>

      <!-- 角色說明彈窗 -->
      <lah-help-modal :modal-id="'help-modal'" size="lg">
        <h5 class="font-weight-bold text-primary mb-3">
          <lah-fa-icon icon="shield-alt" class="mr-2" />使用者角色權限管理說明
        </h5>
        <p class="text-muted small">
          本系統採用「<strong>電腦 IPv4 位址</strong>」作為角色權限的判定依據。當同仁於該電腦 IP 登入系統時，系統將自動依據此表賦予對應的管理或業務角色權限。
        </p>
        <hr class="my-3">

        <h6 class="font-weight-bold mb-2">
          角色分類與權限職掌：
        </h6>
        <div class="row">
          <div v-for="item in helpRoleList" :key="item.name" class="col-12 col-md-6 mb-2">
            <div class="p-2 border rounded bg-light d-flex align-items-center h-100">
              <b-badge :variant="item.variant" class="p-2 mr-2 text-nowrap" style="min-width: 95px;">
                <lah-fa-icon :icon="item.icon" class="mr-1" />
                {{ item.name }}
              </b-badge>
              <div class="small text-muted">
                {{ item.desc }}
              </div>
            </div>
          </div>
        </div>
      </lah-help-modal>

      <!-- 新增角色權限彈窗 -->
      <b-modal
        id="add-authority-modal"
        ref="addAuthorityModal"
        title="新增角色權限"
        hide-footer
        no-close-on-backdrop
        centered
        @show="initAddModal"
        @hidden="resetAddModal"
      >
        <b-form-group
          label="授權角色："
          label-for="role-select"
          label-cols-sm="3"
        >
          <b-form-select
            id="role-select"
            v-model="addRole"
            :options="addRoleOpts"
            :state="roleOK"
          />
        </b-form-group>

        <!-- 同仁快速選取帶入 -->
        <b-form-group
          label="同仁名單："
          label-for="user-select"
          label-cols-sm="3"
          description="可直接選擇同仁以自動帶入其電腦 IP"
        >
          <b-form-select
            id="user-select"
            v-model="selectedUserForAdd"
            :options="userSelectOpts"
            @change="onUserSelectChange"
          />
        </b-form-group>

        <b-form-group
          label="電腦 IP："
          label-for="ip-input"
          label-cols-sm="3"
        >
          <b-input-group>
            <b-form-input
              id="ip-input"
              v-model="addIp"
              placeholder="例如: 192.168.13.96"
              :state="ipOK"
              trim
            />
            <template #append>
              <b-button
                variant="outline-info"
                title="帶入目前電腦 IP"
                :disabled="!clientIpValid"
                @click="fillMyIp"
              >
                帶入本機
              </b-button>
            </template>
          </b-input-group>
          <b-form-invalid-feedback v-if="addIp && !ipOK">
            請輸入正確的 IPv4 位址格式 (例如: 192.168.1.100)
          </b-form-invalid-feedback>
        </b-form-group>

        <!-- 預覽提示卡片 -->
        <div v-if="roleOK && ipOK" class="mb-3 p-3 bg-light rounded border small">
          <div class="font-weight-bold text-primary mb-1">
            <lah-fa-icon icon="info-circle" class="mr-1" />授權摘要預覽
          </div>
          <div>電腦 IP：<code>{{ addIp }}</code></div>
          <div>
            授予角色：<b-badge :variant="roleVariant(selectedRole)">
              {{ selectedRole }}
            </b-badge>
          </div>
          <div v-if="selectedUserForAdd">
            綁定同仁：{{ selectedUserForAdd.name }} ({{ selectedUserForAdd.id }} - {{ selectedUserForAdd.unit }})
          </div>
        </div>

        <div class="d-flex justify-content-end pt-2 border-top">
          <b-button
            variant="secondary"
            class="mr-2"
            @click="$bvModal.hide('add-authority-modal')"
          >
            取消
          </b-button>
          <lah-button
            icon="user-plus"
            variant="primary"
            :disabled="!(roleOK && ipOK)"
            @click="add"
          >
            確認新增權限
          </lah-button>
        </div>
      </b-modal>
    </lah-header>

    <b-container v-cloak fluid class="py-3">
      <!-- 角色統計快速篩選列 -->
      <div class="role-stat-bar mb-3 p-2 bg-light rounded d-flex flex-wrap align-items-center">
        <span class="small font-weight-bold text-muted mr-2 d-none d-md-inline">
          <lah-fa-icon icon="filter" class="mr-1" />快速篩選：
        </span>
        <b-button
          :variant="selectedRoleFilter === '' ? 'primary' : 'outline-secondary'"
          size="sm"
          class="mr-2 mb-1 px-3 rounded-pill"
          @click="setRoleFilter('')"
        >
          全部 <b-badge variant="light" class="ml-1 text-dark">
            {{ tableItems.length }}
          </b-badge>
        </b-button>
        <b-button
          v-for="role in roleStatList"
          :key="role.name"
          :variant="selectedRoleFilter === role.name ? role.variant : `outline-${role.variant}`"
          size="sm"
          class="mr-2 mb-1 px-2 rounded-pill"
          @click="setRoleFilter(role.name)"
        >
          <lah-fa-icon :icon="role.icon" class="mr-1" size="sm" />
          {{ role.name }}
          <b-badge
            :variant="selectedRoleFilter === role.name ? 'light' : role.variant"
            :class="selectedRoleFilter === role.name ? 'text-dark' : 'text-white'"
            class="ml-1"
          >
            {{ role.count }}
          </b-badge>
        </b-button>
      </div>

      <!-- 篩選與搜尋工具列 -->
      <b-row class="mb-3 align-items-center">
        <b-col cols="12" md="5" class="mb-2 mb-md-0">
          <b-input-group size="sm">
            <template #prepend>
              <b-input-group-text class="bg-white">
                <lah-fa-icon icon="search" />
              </b-input-group-text>
            </template>
            <b-form-input
              v-model="keyword"
              placeholder="搜尋電腦 IP、姓名、帳號、課室、職稱..."
              trim
            />
            <template #append>
              <b-button
                v-if="keyword"
                variant="outline-secondary"
                title="清除關鍵字"
                @click="keyword = ''"
              >
                <lah-fa-icon icon="times" />
              </b-button>
            </template>
          </b-input-group>
        </b-col>

        <b-col cols="6" md="3">
          <b-form-select
            v-model="selectedUnitFilter"
            :options="unitFilterOpts"
            size="sm"
          />
        </b-col>

        <b-col cols="6" md="4" class="text-right d-flex justify-content-end align-items-center">
          <span class="small text-muted mr-2 text-nowrap">
            顯示 {{ filteredItems.length }} 筆 (共 {{ tableItems.length }} 筆)
          </span>
          <b-form-select
            v-model="perPage"
            :options="perPageOpts"
            size="sm"
            style="width: 95px;"
          />
        </b-col>
      </b-row>

      <!-- 角色權限列表表格 -->
      <b-table
        striped
        hover
        responsive="lg"
        head-variant="dark"
        class="text-center mb-3 shadow-sm rounded border bg-white"
        :items="filteredItems"
        :fields="tableFields"
        :busy="isBusy"
        :sticky-header="`${maxHeight}px`"
        :per-page="perPage"
        :current-page="currentPage"
        show-empty
        empty-text="查無符合條件之角色權限資料"
      >
        <template #table-busy>
          <div class="text-center my-4 text-primary">
            <b-spinner class="align-middle mr-2" />
            <strong>讀取資料中...</strong>
          </div>
        </template>

        <!-- 序號 -->
        <template #cell(index)="{ index }">
          {{ (currentPage - 1) * (perPage === 9999 ? 0 : perPage) + index + 1 }}
        </template>

        <!-- 角色權限 -->
        <template #cell(role_name)="{ item }">
          <b-badge
            :variant="roleVariant(item.role_name)"
            class="px-2 py-1 font-weight-normal"
          >
            <lah-fa-icon :icon="roleIcon(item.role_name)" class="mr-1" />
            {{ item.role_name }}
          </b-badge>
        </template>

        <!-- 電腦 IP 位址 -->
        <template #cell(role_ip)="{ item }">
          <div class="d-flex align-items-center justify-content-center">
            <span class="font-monospace mr-2">
              <span class="text-muted">{{ formatIpPrefix(item.role_ip) }}</span>
              <strong class="text-primary">{{ formatIpSuffix(item.role_ip) }}</strong>
            </span>
            <lah-button
              icon="copy"
              regular
              variant="outline-secondary"
              size="sm"
              no-border
              no-icon-gutter
              title="複製 IP"
              @click="copyIp(item.role_ip)"
            />
            <lah-button
              icon="satellite-dish"
              variant="outline-info"
              size="sm"
              no-border
              no-icon-gutter
              title="Ping 測試連線"
              :disabled="pingMap[item.role_ip]?.loading"
              @click="ping(item.role_ip)"
            />
            <b-badge
              v-if="pingMap[item.role_ip] && !pingMap[item.role_ip].loading"
              :variant="pingMap[item.role_ip].isOk ? 'success' : 'danger'"
              class="ml-1"
              :title="`回應時間: ${pingMap[item.role_ip].latency} ms`"
            >
              {{ pingMap[item.role_ip].isOk ? `${pingMap[item.role_ip].latency} ms` : '逾時' }}
            </b-badge>
            <b-spinner
              v-else-if="pingMap[item.role_ip]?.loading"
              small
              variant="info"
              class="ml-1"
            />
          </div>
        </template>

        <!-- 綁定同仁 -->
        <template #cell(user)="{ item }">
          <div v-if="item.id" class="d-flex align-items-center justify-content-center">
            <b-button
              variant="outline-dark"
              size="sm"
              class="d-flex align-items-center py-1 px-2 border-0 bg-transparent"
              title="檢視同仁詳細資訊卡"
              @click="popupUserInfo(item)"
            >
              <lah-avatar :user-data="item" class="mr-2" />
              <span class="font-weight-bold mr-1">{{ item.name }}</span>
              <small class="text-muted">({{ item.id }})</small>
            </b-button>
          </div>
          <b-badge v-else variant="light" class="text-muted border font-weight-normal px-2 py-1">
            <lah-fa-icon icon="server" class="mr-1 text-secondary" />系統預設 / 伺服器
          </b-badge>
        </template>

        <!-- 課室 -->
        <template #cell(unit)="{ item }">
          <b-badge v-if="item.unit" variant="secondary" class="font-weight-normal">
            {{ item.unit }}
          </b-badge>
          <span v-else class="text-muted">-</span>
        </template>

        <!-- 職稱 -->
        <template #cell(title)="{ item }">
          <span>{{ item.title || '-' }}</span>
        </template>

        <!-- 操作 -->
        <template #cell(actions)="{ item }">
          <lah-button
            icon="trash-alt"
            variant="outline-danger"
            size="sm"
            no-icon-gutter
            no-border
            pill
            title="移除此筆角色權限"
            @click="remove(item)"
          />
        </template>
      </b-table>

      <!-- 分頁控制 -->
      <div v-if="filteredItems.length > perPage && perPage !== 9999" class="d-flex justify-content-center mt-3">
        <b-pagination
          v-model="currentPage"
          :total-rows="filteredItems.length"
          :per-page="perPage"
          size="sm"
          align="center"
          first-number
          last-number
        />
      </div>
    </b-container>
  </div>
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
import lahTransition from '~/components/lah-transition.vue'
import dynamicHeight from '~/mixins/dynamic-height-mixin'

// 角色屬性定義
const ROLE_CONFIG = {
  超級管理者: { variant: 'danger', icon: 'user-shield', desc: '最高系統權限，具備所有底層資料庫與後台管理功能。' },
  系統管理者: { variant: 'danger', icon: 'shield-alt', desc: '資訊課系統維護人員，可管理同仁帳號、IP 設定、系統參數與推播。' },
  主管: { variant: 'primary', icon: 'crown', desc: '課室主管，可審核登記案件、調閱同仁工作狀態與各項統計報表。' },
  研考: { variant: 'warning', icon: 'clipboard-check', desc: '研考列管案件追蹤、逾期案件監控與統計報表匯出權限。' },
  總務: { variant: 'info', icon: 'boxes', desc: '總務設備、庫存消耗品及採購資產管理相關權限。' },
  人事: { variant: 'success', icon: 'id-card', desc: '同仁人事差勤、通訊名冊維護與組織編制管理。' },
  會計: { variant: 'dark', icon: 'calculator', desc: '會計帳務、規費查核與各項預算經費執行狀況檢視。' }
}

export default {
  components: {
    // eslint-disable-next-line vue/no-unused-components
    lahUserCard,
    lahTransition
  },
  mixins: [dynamicHeight],
  middleware: ['isAdmin'],
  fetchOnServer: true,
  data: () => ({
    tableItems: [],
    message: '',
    // 搜尋與篩選
    keyword: '',
    selectedRoleFilter: '',
    selectedUnitFilter: '',
    perPage: 20,
    currentPage: 1,
    perPageOpts: [
      { value: 10, text: '每頁 10 筆' },
      { value: 20, text: '每頁 20 筆' },
      { value: 50, text: '每頁 50 筆' },
      { value: 9999, text: '顯示全部' }
    ],
    // Ping 狀態記錄
    pingMap: {},
    // 表格欄位設定
    tableFields: [
      { key: 'index', label: '#', sortable: false, thClass: 'text-center align-middle', tdClass: 'text-center align-middle text-muted small' },
      { key: 'role_name', label: '角色權限', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: 'role_ip', label: '電腦 IP 位址', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: 'user', label: '綁定同仁', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: 'unit', label: '課室', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: 'title', label: '職稱', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: 'actions', label: '操作', sortable: false, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' }
    ],
    // 新增彈窗
    addIp: '',
    addRole: '',
    selectedUserForAdd: null,
    allUsersList: [],
    addRoleOpts: [
      { text: '請選擇授權角色...', value: '' },
      { text: '主管', value: 4 },
      { text: '研考', value: 5 },
      { text: '總務', value: 6 },
      { text: '人事', value: 7 },
      { text: '會計', value: 8 },
      { text: '系統管理者', value: 3 },
      { text: '超級管理者', value: 2 }
    ]
  }),
  async fetch () {
    const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
      type: 'authority_list'
    })
    this.tableItems = data.raw || []
    this.message = data.message || ''
  },
  head: {
    title: '使用者角色管理-桃園市地政局'
  },
  computed: {
    roleOK () {
      return this.addRole > 1
    },
    ipOK () {
      return this.$utils.isIPv4(this.addIp)
    },
    clientIpValid () {
      return this.$utils.isIPv4(this.ip)
    },
    selectedRole () {
      const selected = this.addRoleOpts.find(item => item.value === this.addRole)
      return selected ? selected.text : ''
    },
    filteredItems () {
      let items = this.tableItems || []
      if (this.selectedRoleFilter) {
        items = items.filter(item => item.role_name === this.selectedRoleFilter)
      }
      if (this.selectedUnitFilter) {
        items = items.filter(item => item.unit === this.selectedUnitFilter)
      }
      if (this.keyword && this.keyword.trim()) {
        const kw = this.keyword.trim().toLowerCase()
        items = items.filter((item) => {
          return (item.role_ip && item.role_ip.toLowerCase().includes(kw)) ||
            (item.id && item.id.toLowerCase().includes(kw)) ||
            (item.name && item.name.toLowerCase().includes(kw)) ||
            (item.unit && item.unit.toLowerCase().includes(kw)) ||
            (item.title && item.title.toLowerCase().includes(kw)) ||
            (item.role_name && item.role_name.toLowerCase().includes(kw))
        })
      }
      return items
    },
    availableUnits () {
      const units = new Set()
      this.tableItems.forEach((item) => {
        if (item.unit) { units.add(item.unit) }
      })
      return Array.from(units).sort()
    },
    unitFilterOpts () {
      const opts = [{ value: '', text: '全部課室' }]
      this.availableUnits.forEach((u) => {
        opts.push({ value: u, text: u })
      })
      return opts
    },
    roleStatList () {
      const counts = {}
      this.tableItems.forEach((item) => {
        counts[item.role_name] = (counts[item.role_name] || 0) + 1
      })
      return Object.keys(ROLE_CONFIG).map((name) => {
        return {
          name,
          count: counts[name] || 0,
          variant: ROLE_CONFIG[name].variant,
          icon: ROLE_CONFIG[name].icon
        }
      }).filter(r => r.count > 0)
    },
    helpRoleList () {
      return Object.keys(ROLE_CONFIG).map((name) => {
        return {
          name,
          variant: ROLE_CONFIG[name].variant,
          icon: ROLE_CONFIG[name].icon,
          desc: ROLE_CONFIG[name].desc
        }
      })
    },
    userSelectOpts () {
      const opts = [{ value: null, text: '請選擇同仁以自動填入 IP (選填)' }]
      this.allUsersList.forEach((u) => {
        const ipLabel = u.ip ? `IP: ${u.ip}` : '未設 IP'
        opts.push({
          value: u,
          text: `${u.unit || '其他'} - ${u.name} (${u.id}) [${ipLabel}]`
        })
      })
      return opts
    }
  },
  watch: {
    keyword () {
      this.currentPage = 1
    },
    selectedRoleFilter () {
      this.currentPage = 1
    },
    selectedUnitFilter () {
      this.currentPage = 1
    }
  },
  methods: {
    reload () {
      this.isBusy = true
      this.$fetch().then(() => {
        this.notify('角色資料已重新整理', { type: 'success' })
      }).catch((e) => {
        this.$utils.error(e)
      }).finally(() => {
        this.isBusy = false
      })
    },
    setRoleFilter (roleName) {
      if (this.selectedRoleFilter === roleName) {
        this.selectedRoleFilter = ''
      } else {
        this.selectedRoleFilter = roleName
      }
    },
    roleVariant (roleName) {
      return ROLE_CONFIG[roleName]?.variant || 'secondary'
    },
    roleIcon (roleName) {
      return ROLE_CONFIG[roleName]?.icon || 'user-tag'
    },
    formatIpPrefix (ip) {
      if (!ip) { return '' }
      const parts = ip.split('.')
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.`
      }
      return ''
    },
    formatIpSuffix (ip) {
      if (!ip) { return '' }
      const parts = ip.split('.')
      if (parts.length === 4) {
        return `${parts[2]}.${parts[3]}`
      }
      return ip
    },
    copyIp (ip) {
      if (!ip) { return }
      this.copyToClipboard(ip, `已複製 IP: ${ip}`)
    },
    ping (ip) {
      if (!this.$utils.isIPv4(ip)) { return }
      this.$set(this.pingMap, ip, { isOk: false, latency: 0, loading: true })
      this.post(this.$consts.API.JSON.QUERY, {
        type: 'ping',
        ip
      }).then((data) => {
        const isOk = this.$utils.statusCheck(data.status)
        const latency = data.raw?.latency || 0
        this.$set(this.pingMap, ip, {
          isOk,
          latency,
          loading: false
        })
      }).catch(() => {
        this.$set(this.pingMap, ip, {
          isOk: false,
          latency: 0,
          loading: false
        })
      })
    },
    initAddModal () {
      if (this.allUsersList.length === 0) {
        this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'all_users'
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
            this.allUsersList = data.raw.filter(u => !u.offboard_date)
          }
        }).catch((e) => {
          this.$utils.error(e)
        })
      }
    },
    resetAddModal () {
      this.addIp = ''
      this.addRole = ''
      this.selectedUserForAdd = null
    },
    onUserSelectChange (user) {
      if (user && user.ip && this.$utils.isIPv4(user.ip)) {
        this.addIp = user.ip
      }
    },
    fillMyIp () {
      if (this.clientIpValid) {
        this.addIp = this.ip
      }
    },
    add () {
      if (!(this.roleOK && this.ipOK)) {
        this.notify('請確認已選擇角色並輸入合法的 IPv4 位址', { type: 'warning' })
        return
      }
      this.confirm(`請確認要新增 ${this.addIp} 的「${this.selectedRole}」權限？`)
        .then((answer) => {
          if (answer) {
            this.$axios.post(this.$consts.API.JSON.USER, {
              type: 'add_authority',
              role_id: this.addRole,
              ip: this.addIp
            }).then(({ data }) => {
              const opts = { type: 'warning' }
              if (this.$utils.statusCheck(data.status)) {
                opts.type = 'success'
                this.resetAddModal()
                this.$fetch()
                this.clearCache()
                this.hideModalById('add-authority-modal')
              }
              this.notify(data.message, opts)
            }).catch((err) => {
              this.$utils.error(err)
            })
          }
        })
    },
    remove (userData) {
      const userDesc = userData.name ? `${userData.name} (${userData.id || ''})` : '該 IP'
      this.confirm(`請確認要刪除 ${userData.role_ip} 的「${userData.role_name}」權限？\n綁定對象：${userDesc}`)
        .then((answer) => {
          if (answer) {
            this.$axios.post(this.$consts.API.JSON.USER, {
              type: 'remove_authority',
              user: userData
            }).then(({ data }) => {
              const opts = { type: 'warning' }
              if (this.$utils.statusCheck(data.status)) {
                opts.type = 'success'
                this.tableItems = this.$utils.reject(this.tableItems, {
                  role_id: userData.role_id,
                  role_ip: userData.role_ip
                })
                this.clearCache()
              }
              this.notify(data.message, opts)
            }).catch((err) => {
              this.$utils.error(err)
            })
          }
        })
    },
    popupUserInfo (data) {
      if (!this.$utils.empty(data)) {
        const obj = Array.isArray(data) ? data[0] : data
        if (obj.id) {
          this.modal(this.$createElement(lahUserCard, { props: { raw: [obj] } }), {
            title: `${obj.id} ${obj.name} 人員詳細資訊`
          })
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.admin-roles-page {
  min-width: 1024px;
}
.font-monospace {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.role-stat-bar {
  border: 1px solid #e2e8f0;
}
</style>
