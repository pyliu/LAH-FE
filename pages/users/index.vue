<template lang="pug">
  div(v-cloak)
    lah-header: lah-transition(appear)
      .d-flex.w-100
        .d-flex.mr-auto
          .my-auto 芳名錄
          lah-button(
            v-b-modal.help-modal
            icon="info"
            variant="outline-success"
            no-border
            no-icon-gutter
            title="說明"
          )

        b-button-group.my-auto(size="lg"): div

    lah-help-modal(:modal-id="'help-modal'" size="lg")
      ul
        li ???

    hr
    section
      //- 顯示控制UI
      .d-flex.justify-content-between.mb-2
        .d-flex
          b-form-radio-group(
            v-model="selectedGroup"
            :options="groupOptions"
            buttons
            button-variant="outline-dark"
            class="my-auto"
            title="分類"
          )
          b-form-radio-group.ml-3.my-auto(
            v-model="sortOrder"
            :options="sortOpts"
          )
        span.text-muted.my-auto.lah-shadow 找到 #[b-badge( pill class="my-auto" variant="info") {{ users.length }}] 個使用者
        .d-flex.my-auto
          b-form-checkbox-group(v-model="filter" :options="filterOptions")

    hr
    //- 名牌顯示區塊
    .mb-3(v-for="category in categories" :key="category.NAME")
      h5.lah-shadow: lah-fa-icon(v-b-toggle="$utils.md5(category.NAME)" icon="address-book" regular style="cursor: pointer")
        span {{ translateGroupName(category.NAME) }}
        b-badge(pill variant="info") {{ category.LIST.length }}

      b-collapse(:id="$utils.md5(category.NAME)" visible)
        b-card-group(columns)
          lah-user-card.max-width(
            v-for="user in category.LIST"
            :key="user.id"
            :raw="[user]"
          )
        //- b-button(
        //-   v-for="user in category.LIST"
        //-   :key="user['id']"
        //-   :data-id="user['id']"
        //-   :data-name="user['name']"
        //-   :variant="variant(user)"
        //-   :pill="showAvatar"
        //-   :title="role(user)"
        //-   size="sm"
        //-   class="mx-1 my-1 shadow"
        //-   @click="edit(user)"
        //- )
        //-   b-avatar(v-if="showAvatar" button variant="light" :size="'1.5rem'" :src="avatarSrc(user)")
        //-   span.ml-1 {{ user["id"].padStart(6, '&ensp;') }}
        //-   span.ml-1 {{ user["name"].padEnd(3, '　') }}
        //-   .text-dark.text-center.font-weight-bolder(v-if="showIp")
        //-     span {{ ipParts(user)[0] }}.{{ ipParts(user)[1] }}
        //-     span.text-info .{{ ipParts(user)[2] }}.{{ ipParts(user)[3] }}
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
import lahUserEditCard from '~/components/lah-user-edit-card.vue'
import lahUserAddCard from '~/components/lah-user-add-card.vue'

export default {
  components: { lahUserCard, lahUserEditCard, lahUserAddCard },
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
      { html: '<i class="fas fa-sort-amount-down-alt"/>', value: true, disabled: false },
      { html: '<i class="fas fa-sort-amount-down"/>', value: false, disabled: false }
    ],
    showAvatar: false,
    showIp: false,
    userXlsx: null,
    keyword: '',
    users: [],
    filter: ['on'],
    filterOptions: [
      { text: '正常', value: 'on' },
      { text: '停用', value: 'off' }
    ],
    clickedUser: { id: '', name: '' }
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
  },
  head: {
    title: '使用者資訊管理-桃園市地政局'
  },
  fetchOnServer: true,
  computed: {
    type () {
      if (this.filter.length === 2) { return 'all_users' }
      if (this.filter.includes('on')) { return 'on_board_users' }
      if (this.filter.includes('off')) { return 'off_board_users' }
      return ''
    },
    office () {
      if (this.systemConfigs) {
        return this.systemConfigs.site
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
        case 'role':
          return this.groupByRole()
        default:
          return [{ NAME: '未分類', LIST: this.users }]
      }
    },
    importUrl () {
      return `${this.apiSvrHttpUrl}${this.$consts.API.XLSX.USER_IMPORT}`
    },
    exportXlsxUrl () {
      return `${this.apiSvrHttpUrl}${this.$consts.API.FILE.XLSX}?type=all_users_export`
    },
    usersByIpAsc () {
      return [...this.users].sort((a, b) => {
        const bv = this.$utils.ipv4Int(b.ip)
        const av = this.$utils.ipv4Int(a.ip)
        if (bv > av) {
          return -1
        }
        if (bv < av) {
          return 1
        }
        return 0
      })
    },
    usersById () {
      return [...this.users].sort(function (a, b) {
        if (b.id > a.id) {
          return -1
        }
        if (b.id < a.id) {
          return 1
        }
        return 0
      })
    },
    L3HWEBIp () {
      if (this.systemConfigs && this.systemConfigs.lxhweb) {
        return this.systemConfigs.lxhweb.ORA_DB_L3HWEB_IP
      }
      return '220.1.33.5'
    },
    L3HWEBPort () {
      if (this.systemConfigs && this.systemConfigs.lxhweb) {
        return this.systemConfigs.lxhweb.ORA_DB_L3HWEB_PORT
      }
      return '1521'
    },
    editUserTitle () { return `編輯 ${this.clickedUser.id} ${this.clickedUser.name} 資訊` }
  },
  watch: {
    type (val) {
      this.users = []
      if (val !== '') {
        this.$fetch()
      }
    }
  },
  methods: {
    exportXlsx () {
      this.$utils.openNewWindow(this.exportXlsxUrl, { target: { title: '下載使用者XLSX清單' } })
    },
    translateGroupName (name) {
      if (parseInt(name) === 1) {
        return '男生'
      }
      if (parseInt(name) === 0) {
        return '女生'
      }
      return name
    },
    groupBy (field) {
      const filtered = []
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item, idx, array) => {
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
    groupByRole () {
      /*
      if (userAuthority.isUserMgtStaff) { return '人事管理者' }
      if (userAuthority.isNotifyMgtStaff) { return '公告管理者' }
      */
      const filtered = [
        { NAME: '系統管理者', LIST: [] },
        { NAME: '主管', LIST: [] },
        { NAME: '研考', LIST: [] },
        { NAME: '人事管理者', LIST: [] },
        { NAME: '公告管理者', LIST: [] },
        { NAME: '一般使用者', LIST: [] }
      ]
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item, idx, array) => {
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
      // LIST count is the same, I will use the NAME for sorting
      if ((b.LIST.length - a.LIST.length) === 0) {
        const regex = /^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$/g
        const bv = b.NAME.match(regex) ? this.$utils.ipv4Int(b.NAME) : b.NAME
        const av = a.NAME.match(regex) ? this.$utils.ipv4Int(a.NAME) : a.NAME
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
            this.alert('請先選擇一個符合格式的XLSX檔')
          } else {
            this.isBusy = true
            const formData = new FormData()
            formData.append('file', this.userXlsx)
            this.$upload.post(this.importUrl, formData)
              .then(({ data }) => {
                const opts = { type: 'warning', title: '匯入使用者資料通知' }
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
      // update the cached user data
      let foundIdx
      const user = this.users.find((item, idx, array) => {
        if (item.id === userData.id) {
          foundIdx = idx
        }
        return item.id === userData.id
      })
      if (foundIdx !== undefined) {
        // refresh current data
        this.users[foundIdx] = { ...user, ...userData }
        this.users = [...this.users]
      }
    },
    variant (user) {
      const userAuthority = this.getAuthority(user)
      if (userAuthority.isDisabled) { return 'secondary' }
      if (userAuthority.isAdmin) { return 'danger' }
      if (userAuthority.isChief) { return 'primary' }
      if (userAuthority.isRAE) { return 'warning' }
      if (userAuthority.isUserMgtStaff) { return 'success' }
      if (userAuthority.isNotifyMgtStaff) { return 'outline-info' }
      return 'outline-dark'
    },
    role (user) {
      const userAuthority = this.getAuthority(user)
      if (userAuthority.isDisabled) { return '已被停用' }
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
        isDisabled: this.$consts.AUTHORITY.DISABLED === (authority & this.$consts.AUTHORITY.DISABLED),
        isRAE: this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION === (authority & this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION),
        isUserMgtStaff: this.$consts.AUTHORITY.USER_MANAGEMENT === (authority & this.$consts.AUTHORITY.USER_MANAGEMENT),
        isNotifyMgtStaff: this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT === (authority & this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT)
      }
    },
    avatarSrc (user) {
      return `${this.apiSvrHttpUrl}/get_user_img.php?id=${user.id}_avatar&name=${user.name}_avatar`
    },
    ipParts (user) {
      return user.ip.split('.')
    }
  }
}
</script>

<style lang="scss" scoped>
.max-width {
  max-width: calc(30vw - 0px);
}
</style>
