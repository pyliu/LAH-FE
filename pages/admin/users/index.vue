<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">使用者資訊管理</div>
            <lah-button
              icon="question"
              variant="outline-success"
              no-border
              no-icon-gutter
              v-b-modal.help-modal
              title="說明"
            />
          </div>
          <b-button-group size="lg" class="my-auto">
            <lah-button
              icon="user-plus"
              variant="outline-primary"
              @click="add"
              title="新增使用者"
              no-icon-gutter
            />
            <lah-button
              icon="upload"
              variant="outline-secondary"
              no-icon-gutter
              title="批次檔上傳更新"
              v-b-modal.upload-modal
              class="mx-1"
              action="move-fade-btt"
            />
            <lah-button
              icon="file-excel"
              regular
              @click="exportXlsx"
              title="匯出系統全部使用者"
              variant="outline-success"
              no-icon-gutter
              action="move-fade-ltr"
            />
          </b-button-group>
        </div>
      </lah-transition>
      <lah-help-modal :modal-id="'help-modal'" size="lg">
        <ul>
          <li>
            <div class="d-inline-flex justify-content-around">
              選取編輯好的XLSX檔案，點擊
              <lah-button
                icon="upload"
                variant="outline-secondary"
                class="mx-1 mt-n1"
                no-icon-gutter
                v-b-modal.upload-modal
              />
              上傳更新本地資料庫(dimension.db, user表格)
            </div>
          </li>
          <li class="mt-2">
            <div class="d-inline-flex justify-content-around">
              利用
              <lah-button
                icon="user-plus"
                variant="outline-primary"
                class="mx-1 mt-n1"
                no-icon-gutter
                @click="add"
              />
              新增或
              <b-button
                variant="outline-success"
                class="mx-1 mt-n1"
                size="sm"
              >
                {{site}}ＯＯＯＯ 中壢地政 <b-avatar size="1.5rem"></b-avatar>
              </b-button>
              編輯使用者。
            </div>
          </li>
        </ul>
        <hr />
        <div class="mx-2 my-1">
          <b-button variant="outline-success" size="sm">{{ office }}XXXX 劉ＯＯ</b-button>
          在職使用者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="secondary" size="sm">{{ office }}XXXX 邦ＯＯ</b-button>
          離職使用者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="danger" size="sm">{{ office }}XXXX 渝ＯＯ</b-button>
          超級管理者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="outline-danger" size="sm">{{ office }}XXXX 中ＯＯ</b-button>
          系統管理者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="primary" size="sm">{{ office }}XXXX 壢ＯＯ</b-button>
          主管
        </div>
        <div class="mx-2 my-1">
          <b-button variant="warning" size="sm">{{ office }}XXXX 地ＯＯ</b-button>
          研考
        </div>
        <div class="mx-2 my-1">
          <b-button variant="info" size="sm">{{ office }}XXXX 政ＯＯ</b-button>
          總務
        </div>
      </lah-help-modal>
      <b-modal
        id="upload-modal"
        title="批次檔上傳更新"
        size="lg"
        hide-footer
        scrollable
        no-close-on-backdrop
      >
        <b-button-group size="lg" class="d-flex justify-content-end mb-2">
          <lah-button icon="file-excel" href="/xlsx/user_import.tpl.xlsx" variant="muted" icon-variant="success">匯入範例檔下載</lah-button>
          <lah-button icon="file-excel" regular @click="exportXlsx" variant="muted" icon-variant="success">匯出全部使用者</lah-button>
        </b-button-group>
        <b-form-group
          label="匯入使用者檔案"
          label-for="file-land_data_upload"
          label-cols-sm="2"
          label-size="md"
          title="*.xlsx"
        >
          <b-input-group id="file-land_data_upload" size="md">
            <b-file
              ref="file-land_data_upload"
              v-model="userXlsx"
              placeholder="請選擇XLSX檔案"
              drop-placeholder="放開以設定上傳檔案"
              accept=".xlsx, .XLSX"
            >
              <template slot="file-name" slot-scope="{ names }">
                <b-badge variant="dark">{{ names[0] }}</b-badge>
                <b-badge v-if="names.length > 1" variant="dark" class="ml-1">
                  + {{ names.length - 1 }} More files
                </b-badge>
              </template>
            </b-file>
            <template #append>
              <lah-button
                icon="upload"
                variant="outline-primary"
                @click="upload"
                title="上傳"
                :disabled="$utils.empty(userXlsx)"
              />
            </template>
          </b-input-group>
        </b-form-group>
      </b-modal>
    </lah-header>
    <section>
      <hr/>
      <div class="d-flex justify-content-between mb-2">
        <div class="d-flex">
          <b-form-radio-group
            v-model="selectedGroup"
            :options="groupOptions"
            buttons
            button-variant="outline-dark"
            class="my-auto"
            title="分類"
          />
          <b-form-radio-group
            v-model="sortOrder"
            :options="sortOpts"
            class="ml-3 my-auto"
          />
        </div>
        <span class="text-muted my-auto lah-shadow">找到 <b-badge pill class="my-auto" variant="info">{{ users.length }}</b-badge> 個使用者</span>
        <div class="d-flex my-auto">
          <b-form-checkbox v-model="showAvatar" switch class="mr-3" title="顯示">大頭照</b-form-checkbox>
          <b-form-checkbox v-model="showIp" switch class="mr-3" title="顯示">IP</b-form-checkbox>
          <b-form-checkbox-group v-model="filter" :options="filterOptions" />
        </div>
      </div>
      <hr/>
      <section v-for="category in categories" :key="category.NAME" class="mb-3">
        <h5 class="lah-shadow">
          <lah-fa-icon icon="address-book" regular style="cursor: pointer" v-b-toggle="$utils.md5(category.NAME)">
            {{translateGroupName(category.NAME)}}
            <b-badge pill variant="info">{{ category.LIST.length }}</b-badge>
          </lah-fa-icon>
        </h5>
        <b-collapse visible :id="$utils.md5(category.NAME)">
          <b-button
            v-for="user in category.LIST"
            :key="user['id']"
            :data-id="user['id']"
            :data-name="user['name']"
            size="sm"
            class="mx-1 my-1 shadow"
            @click="edit(user)"
            :variant="variant(user)"
            v-b-popover.hover.top.html="role(user)"
          >
            <b-avatar v-if="showAvatar" button variant="light" :size="'1.5rem'" :src="avatarSrc(user)"/>
            {{ user["id"].padStart(6, "&ensp;") }}
            {{ user["name"].padEnd(3, "　") }}
            <div v-if="showIp" class="text-dark text-center font-weight-bolder">
              {{ ipParts(user)[0] }}.{{ ipParts(user)[1] }}.<span class="text-danger">{{ ipParts(user)[2] }}.{{ ipParts(user)[3] }}</span>
            </div>
          </b-button>
        </b-collapse>
      </section>
      <hr/>
    </section>
  </div>
</template>

<script>
import lahUserCard from "~/components/lah-user-card.vue"
import lahUserEditCard from "~/components/lah-user-edit-card.vue"
import lahUserAddCard from "~/components/lah-user-add-card.vue"
import ip2long from 'locutus/php/network/ip2long'

export default {
  head: {
    title: "使用者資訊管理-桃園市地政局",
  },
  middleware: [ 'isAdmin' ],
  fetchOnServer: false,
  components: { lahUserCard, lahUserEditCard, lahUserAddCard },
  data: () => ({
    selectedGroup: 'unit',
    groupOptions: [
      { text: '部門', value: 'unit' },
      { text: '職稱', value: 'title' },
      { text: '工作', value: 'work' },
      { text: '性別', value: 'sex' },
      { text: 'IP', value: 'ip' },
      { text: '未分類', value: '' }
    ],
    sortOrder: false,
    sortOpts: [
      { html: '<i class="fas fa-sort-amount-down-alt"/>', value: true, disabled: false },
      { html: '<i class="fas fa-sort-amount-down"/>', value: false, disabled: false }
    ],
    showAvatar: false,
    showIp: false,
    userXlsx: null,
    keyword: "",
    users: [],
    filter: ["on"],
    filterOptions: [
      { text: "在職", value: "on" },
      { text: "離職", value: "off" }
    ]
  }),
  computed: {
    type () {
      if (this.filter.length === 2) return "all_users"
      if (this.filter.includes("on")) return "on_board_users"
      if (this.filter.includes("off")) return "off_board_users"
      return ""
    },
    office () {
      if (this.svr) {
        return this.svr.config.site
      }
      return this.site
    },
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
        default:
          return [{ NAME: '未分類', LIST: this.users }]
      }
    },
    importUrl () {
      return `${this.apiSvrHttpUrl}${this.$consts.API.XLSX.USER_IMPORT}`
    },
    exportXlsxUrl () {
      return `${this.apiSvrHttpUrl}${this.$consts.API.FILE.XLSX}?type=all_users_export`
    }
  },
  watch: {
    type(val) {
      if (val === "") {
        this.users = []
      } else {
        this.$fetch()
      }
    }
  },
  methods: {
    exportXlsx () {
      this.$utils.openNewWindow(this.exportXlsxUrl, { target: { title: '下載使用者XLSX清單' } })
    },
    translateGroupName (name) {
      if (name == '1') {
        return '男生'
      }
      if (name == '0') {
        return '女生'
      }
      return name
    },
    groupBy (field) {
      const filtered = []
      this.users.forEach((item, idx, array) => {
        const found = filtered.find((category, d, arr) => {
          return category.NAME === item[field]
        })
        if (found) {
          found.LIST.push(item)
        } else {
          filtered.push({
            NAME: item[field],
            LIST: [item]
          })
        }
      })
      filtered.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return filtered
    },
    sortAsc (a, b) {
      // LIST count is the same, I will use the NAME for sorting
      if ((b.LIST.length - a.LIST.length) === 0) {
        const regex = new RegExp(`^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$`, 'g')
        const bv = Boolean(b.NAME.match(regex)) ? ip2long(b.NAME) : b.NAME
        const av = Boolean(a.NAME.match(regex)) ? ip2long(a.NAME) : a.NAME
        if (bv > av) {
          return 1
        }
        if (bv < av) {
          return -1
        }
        return 0
      }
      return b.LIST.length - a.LIST.length
    },
    sortDesc (a, b) {
      const val = this.sortAsc(a, b)
      if (val > 0) {
        return -1
      }
      if (val < 0) {
        return 1
      }
      return 0
    },
    upload () {
      this.confirm('請確定要上傳更新？').then((answer) => {
        if (answer) {
          if (this.$utils.empty(this.userXlsx)) {
            this.alert("請先選擇一個符合格式的XLSX檔")
          } else {
            this.isBusy = true
            const formData = new FormData()
            formData.append("file", this.userXlsx)
            this.$upload.post(this.importUrl, formData)
            .then(({ data }) => {
              const opts = { type: "warning", title: '匯入使用者資料通知' }
              if (this.$utils.statusCheck(data.status)) {
                opts.type = 'success'
                // refresh all list
                this.$fetch()
              }
              this.notify(data.message, opts)
            })
            .catch((err) => {
              this.$utils.error(err)
            })
            .finally(() => {
              this.isBusy = false
              this.userXlsx = null
            })
          }
        } else {
          this.$utils.warn('cancelled confirmation of uploading user xlsx!')
        }
      })
    },
    add () {
      this.modal(
        this.$createElement("lah-user-add-card", {
          components: { lahUserCard },
          on: {
            added: (event) => {
              this.users.unshift(event.detail)
            },
          },
        }),
        {
          title: `新增使用者`,
          size: "lg",
          noCloseOnBackdrop: true
        }
      )
    },
    update (userData) {
      // update the cached user data
      let foundIdx = undefined
      const user = this.users.find((item, idx, array) => {
        if (item["id"] === userData["id"]) {
          foundIdx = idx
        }
        return item["id"] === userData["id"]
      })
      if (foundIdx !== undefined) {
        this.users[foundIdx] = Object.assign(user, userData)
      }
    },
    edit (user) {
      this.modal(
        this.$createElement("lah-user-edit-card", {
          props: { raw: [user] },
          on: {
            saved: (event) => {
              this.update(event.detail)
            },
          },
        }),
        {
          title: `編輯 ${user["id"]} ${user["name"]} 資訊`,
          size: "lg",
          noCloseOnBackdrop: true
        }
      )
    },
    variant (user) {
      if (!this.$utils.empty(user["offboard_date"])) return "secondary"
      const auth = this.getAuthority(user)
      if (auth.isSuper) return "danger"
      if (auth.isChief) return "primary"
      if (auth.isRAE) return "warning"
      if (auth.isGA) return "info"
      if (auth.isAdmin) return "outline-danger"
      return "outline-success"
    },
    role (user) {
      if (!this.$utils.empty(user["offboard_date"])) return ""
      const auth = this.getAuthority(user)
      if (auth.isSuper) return "程式開發者"
      if (auth.isChief) return "主管"
      if (auth.isRAE) return "研考"
      if (auth.isGA) return "總務"
      if (auth.isAdmin) return "系統管理者"
      return ""
    },
    getAuthority (user) {
      const authorityMap = {
        isAdmin: false,
        isChief: false,
        isGA: false,
        isRAE: false,
        isSuper: false,
      }
      if (this.svr && this.svr.config.ip_maps) {
        const mappings = this.svr.config.ip_maps
        const ip = user["ip"]
        authorityMap.isAdmin = mappings.admin.includes(ip)
        authorityMap.isChief = mappings.chief.includes(ip)
        authorityMap.isSuper = mappings.super.includes(ip)
        authorityMap.isRAE = mappings.rae.includes(ip)
        authorityMap.isGA = mappings.ga.includes(ip)
      }
      return authorityMap
    },
    avatarSrc (user) {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${user['id']}_avatar&name=${user['name']}_avatar`
    },
    ipParts (user) {
      return user["ip"].split('.')
    }
  },
  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: this.type,
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.users = data.raw
      } else {
        this.notify(data.message, { type: "warning" })
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
  }
}
</script>

<style lang="scss" scoped>
</style>
