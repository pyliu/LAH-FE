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
          <b-button variant="outline-success" size="sm"
            >{{ office }}XXXX 劉ＯＯ</b-button
          >
          在職使用者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="secondary" size="sm"
            >{{ office }}XXXX 邦ＯＯ</b-button
          >
          離職使用者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="danger" size="sm"
            >{{ office }}XXXX 渝ＯＯ</b-button
          >
          超級管理者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="outline-danger" size="sm"
            >{{ office }}XXXX 中ＯＯ</b-button
          >
          系統管理者
        </div>
        <div class="mx-2 my-1">
          <b-button variant="primary" size="sm"
            >{{ office }}XXXX 壢ＯＯ</b-button
          >
          主管
        </div>
        <div class="mx-2 my-1">
          <b-button variant="warning" size="sm"
            >{{ office }}XXXX 地ＯＯ</b-button
          >
          研考
        </div>
        <div class="mx-2 my-1">
          <b-button variant="info" size="sm"
            >{{ office }}XXXX 政ＯＯ</b-button
          >
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
        <span class="text-muted">找到 <b-badge pill class="my-auto" variant="info">{{ users.length }}</b-badge> 個使用者</span>
        <b-form-checkbox-group v-model="filter" :options="filterOptions" />
      </div>
      <hr/>
      <section v-for="category in userByUnit" :key="category.UNIT" class="mb-3">
        <h5><lah-fa-icon icon="angle-double-right">{{category.UNIT}} <b-badge pill variant="info">{{ category.LIST.length }}</b-badge></lah-fa-icon></h5>
        <b-button
          v-for="user in category.LIST"
          :key="user['id']"
          :data-id="user['id']"
          :data-name="user['name']"
          size="sm"
          class="mx-1 my-1"
          @click="edit(user)"
          :variant="variant(user)"
          v-b-popover.hover.top.html="role(user)"
        >
          {{ user["id"].padStart(6, "&ensp") }}
          {{ user["name"].padEnd(3, "　") }}
          <b-avatar button variant="light" :size="'1.5rem'" :src="avatarSrc(user)"/>
        </b-button>
      </section>
      <hr/>
    </section>
  </div>
</template>

<script>
import lahUserCard from "~/components/lah-user-card.vue"
import lahUserEditCard from "~/components/lah-user-edit-card.vue"
import lahUserAddCard from "~/components/lah-user-add-card.vue"
export default {
  head: {
    title: "使用者資訊管理-桃園市地政局",
  },
  middleware: [ 'isAdmin' ],
  fetchOnServer: false,
  components: { lahUserCard, lahUserEditCard, lahUserAddCard },
  data: () => ({
    userXlsx: null,
    keyword: "",
    users: [],
    filter: ["on"],
    filterOptions: [
      { text: "在職", value: "on" },
      { text: "離職", value: "off" },
    ],
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
    userByUnit () {
      const hr = this.users.filter(
        (this_record) => this_record["unit"] === "人事室"
      )
      const accounting = this.users.filter(
        (this_record) => this_record["unit"] === "會計室"
      )
      const director = this.users.filter(
        (this_record) => this_record["unit"] === "主任室"
      )
      const secretary = this.users.filter(
        (this_record) => this_record["unit"] === "秘書室"
      )
      const adm = this.users.filter(
        (this_record) => this_record["unit"] === "行政課"
      )
      const reg = this.users.filter(
        (this_record) => this_record["unit"] === "登記課"
      )
      const val = this.users.filter(
        (this_record) => this_record["unit"] === "地價課"
      )
      const sur = this.users.filter(
        (this_record) => this_record["unit"] === "測量課"
      )
      const inf = this.users.filter(
        (this_record) => this_record["unit"] === "資訊課"
      )
      return [
        // {
        //   UNIT: "主任室",
        //   LIST: director,
        // },
        // {
        //   UNIT: "秘書室",
        //   LIST: secretary,
        // },
        // {
        //   UNIT: "人事室",
        //   LIST: hr,
        // },
        // {
        //   UNIT: "會計室",
        //   LIST: accounting,
        // },
        {
          UNIT: "主任室 / 秘書室 / 人事室 / 會計室",
          LIST: director.concat(secretary).concat(hr).concat(accounting),
        },
        {
          UNIT: "行政課",
          LIST: adm,
        },
        {
          UNIT: "登記課",
          LIST: reg,
        },
        {
          UNIT: "地價課",
          LIST: val,
        },
        {
          UNIT: "測量課",
          LIST: sur,
        },
        {
          UNIT: "資訊課",
          LIST: inf,
        },
      ]
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
            .then((res) => {
              const opts = { type: "warning", title: '匯入使用者資料通知' }
              if (this.$utils.statusCheck(res.data.status)) {
                opts.type = 'success'
                // refresh all list
                this.$fetch()
              }
              this.notify(res.data.message, opts)
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
      if (this.svr) {
        return `http://${this.svr.ips[0]}/get_user_img.php?name=${user['name']}_avatar`
      }
    }
  },
  fetch () {
    this.isBusy = true
    this.$axios
      .post(this.$consts.API.JSON.USER, {
        type: this.type,
      })
      .then((res) => {
        if (this.$utils.statusCheck(res.data.status)) {
          this.users = res.data.raw
        } else {
          this.notify(res.data.message, { type: "warning" })
        }
      })
      .catch((err) => {
        this.$utils.error(err)
      })
      .finally(() => {
        this.isBusy = false
      })
  }
}
</script>

<style lang="scss" scoped>
</style>
