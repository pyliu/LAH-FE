<template lang="pug">
  div(v-cloak)
    lah-header: lah-transition(appear)
      .d-flex.w-100
        .d-flex.mr-auto
          .my-auto 員工名錄
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
        li 分類顯示，依各個分類項目組合
        li 排序，依數量多寡

    hr
    section
      //- 顯示控制UI
      .d-flex.mb-2.text-nowrap
        .d-flex.align-items-center.flex-nowrap.mr-auto
          h5.my-auto 部門
          b-select.dept-width(v-model="department" :options="deptOpts")
          h5.my-auto 分類顯示
          b-radio-group.mx-1(
            v-model="selectedGroup"
            :options="groupOptions"
            buttons
            button-variant="outline-dark"
          )
          h5.my-auto 排序
          b-radio-group.ml-3.my-auto(
            v-model="sortOrder"
            :options="sortOpts"
          )
        .d-flex.align-items-center.my-auto
          b-checkbox-group(v-model="filter" :options="filterOptions")
        .d-flex.align-items-center.my-auto.text-muted #[b-badge.my-auto.mx-1( pill :variant="filter.includes('off') ? 'secondary' : 'success'") {{ users.length }}] 個使用者

    hr
    //- 卡片顯示區塊
    .mb-3(v-for="category in categories" :key="category.NAME")
      h5.lah-shadow: lah-fa-icon(v-b-toggle="$utils.md5(category.NAME)" icon="address-book" regular style="cursor: pointer")
        span {{ translateGroupName(category.NAME) }}
        b-badge(pill variant="info") {{ category.LIST.length }}

      b-collapse(:id="$utils.md5(category.NAME)" visible)
        b-card-group(columns): transition-group(name="list")
          lah-user-card.max-width(
            v-for="user in category.LIST"
            :key="user.id"
            :raw="[user]"
          )
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
import lahUserEditCard from '~/components/lah-user-edit-card.vue'
import lahUserAddCard from '~/components/lah-user-add-card.vue'

export default {
  components: { lahUserCard, lahUserEditCard, lahUserAddCard },
  data: () => ({
    department: '',
    deptOpts: ['全所', '登記課', '測量課', '行政課', '地價課', '資訊課', '人事室', '會計室', '主任室'],
    selectedGroup: 'title',
    groupOptions: [
      // { text: '部門', value: 'unit' },
      { text: '職稱', value: 'title' },
      { text: '角色', value: 'role' },
      { text: '工作', value: 'work' },
      { text: '性別', value: 'sex' }
      // { text: '電腦', value: 'ip' },
      // { text: '未分類', value: '' }
    ],
    sortOrder: false,
    sortOpts: [
      { html: '<i class="fas fa-sort-amount-down-alt"/>', value: true, disabled: false },
      { html: '<i class="fas fa-sort-amount-down"/>', value: false, disabled: false }
    ],
    showAvatar: false,
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
  // fetch () {
  //   this.isBusy = true
  //   this.$axios.post(this.$consts.API.JSON.USER, {
  //     type: this.type
  //   }).then(({ data }) => {
  //     if (this.$utils.statusCheck(data.status)) {
  //       this.users = data.raw
  //     } else {
  //       this.notify(data.message, { type: 'warning' })
  //     }
  //   }).catch((err) => {
  //     this.$utils.error(err)
  //   }).finally(() => {
  //     this.isBusy = false
  //   })
  // },
  head: {
    title: '員工名錄-桃園市地政局'
  },
  fetchOnServer: true,
  computed: {
    type () {
      if (this.filter.length === 2) { return 'all_users' }
      if (this.filter.includes('on')) { return 'on_board_users' }
      if (this.filter.includes('off')) { return 'off_board_users' }
      return ''
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
    }
  },
  watch: {
    type (val) {
      this.users = []
      if (val !== '') {
        this.fetchUsersByDepartment()
      }
    },
    department (val) {
      this.users = []
      if (val !== '') {
        this.fetchUsersByDepartment()
      }
    }
  },
  mounted () {
    this.department = this.user.unit
    this.fetchUsersByDepartment()
  },
  methods: {
    fetchUsersByDepartment () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.USER, {
        type: 'department_users',
        valid: this.type,
        department: this.department
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
      this.usersById.forEach((item, idx, array) => {
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
      this.usersById.forEach((item, idx, array) => {
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
    }
  }
}
</script>

<style lang="scss" scoped>
.max-width {
  max-width: calc(30vw - 0px);
}
.dept-width {
  max-width: 100px;
}
</style>
