<template lang="pug">
div
  // 1. 本案初審人員（推薦置頂）
  .alert.alert-success.d-flex.align-items-center.justify-content-between.py-2.px-3.mb-3.shadow-sm(
    v-if="caseReviewerUser"
  )
    .d-flex.align-items-center
      lah-fa-icon(icon="star" variant="warning" size="lg").mr-2
      div
        .small.text-muted 本案初審人員（推薦優先借閱）：
        strong.h6.mb-0.text-success {{ caseReviewerUser.name }}
        span.small.text-muted.ml-2 ({{ caseReviewerUser.id }} / {{ caseReviewerUser.unit }} {{ caseReviewerUser.work || caseReviewerUser.title || '' }})
    b-button(
      variant="success"
      size="sm"
      class="font-weight-bold shadow-sm"
      @click="update(caseReviewerUser.id)"
    )
      lah-fa-icon(icon="check" no-gutter)
      span.ml-1 選擇此人員

  // 2. 搜尋列與清除按鈕
  .d-flex.mb-2
    b-input-group.mr-2
      template(#prepend)
        b-input-group-text.bg-white.text-primary
          lah-fa-icon(icon="search")
      b-input(
        v-model="keyword"
        placeholder="搜尋姓名、代碼、課室或業務 (例如: 歐陽、初審、211)..."
        trim
        @keydown.esc="keyword = ''"
      )
      template(#append)
        b-button(v-if="keyword" variant="outline-secondary" @click="keyword = ''" title="清除關鍵字")
          lah-fa-icon(icon="times" no-gutter)
    lah-button(
      icon="trash-alt"
      variant="outline-danger"
      @click="clean"
      title="清除借閱人設定"
    ) 清除

  // 3. 課室/身分分類頁籤
  .d-flex.align-items-center.mb-3.flex-wrap
    b-button-group(size="sm" class="flex-wrap")
      b-button(
        :variant="activeTab === 'reg_first' ? 'primary' : 'outline-primary'"
        @click="activeTab = 'reg_first'"
        class="font-weight-bold"
      )
        lah-fa-icon(icon="user-check" size="xs").mr-1
        | 登記課初審
        b-badge.ml-1(variant="light") {{ regFirstUsers.length }}
      b-button(
        :variant="activeTab === 'reg_all' ? 'info' : 'outline-info'"
        @click="activeTab = 'reg_all'"
      )
        | 登記課全員
        b-badge.ml-1(variant="light") {{ regAllUsers.length }}
      b-button(
        :variant="activeTab === 'other_dept' ? 'secondary' : 'outline-secondary'"
        @click="activeTab = 'other_dept'"
      )
        | 其他課室
        b-badge.ml-1(variant="light") {{ otherDeptUsers.length }}
      b-button(
        :variant="activeTab === 'all' ? 'dark' : 'outline-dark'"
        @click="activeTab = 'all'"
      )
        | 全部在職同仁
        b-badge.ml-1(variant="light") {{ activeUsers.length }}

  // 4. 人員卡片網格
  div(v-if="isBusy" class="text-center py-4 text-muted")
    b-spinner(small type="grow")
    span.ml-2 載入人員資料中...

  div(v-else-if="displayUsers.length > 0")
    .user-grid
      .user-item-btn(
        v-for="u in displayUsers"
        :key="u.id"
        :class="getUserBtnClass(u)"
        @click="update(u.id)"
        :title="`${u.id} ${u.name} - ${u.unit} ${u.title || ''} ${u.work || ''}`"
      )
        .d-flex.justify-content-between.align-items-center
          .font-weight-bold.text-truncate.name-label {{ u.name }}
          span.badge.badge-pill(
            :class="getWorkBadgeClass(u)"
          ) {{ getWorkLabel(u) }}
        .d-flex.justify-content-between.align-items-center.mt-1.small
          span.text-muted.id-label {{ u.id }}
          span.text-muted.unit-label {{ u.unit }}

  .text-center.py-4.text-muted(v-else)
    lah-fa-icon(icon="exclamation-circle" size="lg" variant="secondary").mb-2
    div 查無符合條件之人員

</template>

<script>
export default {
  props: {
    initKeyword: { type: String, default: '' },
    caseReviewer: { type: String, default: '' },
    defaultDept: { type: String, default: '登記課' }
  },
  data: () => ({
    keyword: '',
    rawUsers: [],
    activeTab: 'reg_first',
    isBusy: false
  }),
  computed: {
    activeUsers () {
      return this.rawUsers.filter((u) => {
        const isOnBoard = !u.offboard_date && (Number(u.authority || 0) & 1) !== 1
        const isValidName = u.name && !u.name.match(/^(登記|地價|測量|資訊|行政|主任|秘書|第|服|會|地|TEST|HH|建|分局)/gi)
        return isOnBoard && isValidName
      })
    },
    caseReviewerUser () {
      if (this.$utils.empty(this.caseReviewer)) { return null }
      const r = this.caseReviewer.trim()
      return this.activeUsers.find(u => u.id === r || u.name === r || r.includes(u.id) || r.includes(u.name))
    },
    regFirstUsers () {
      return this.activeUsers.filter(u =>
        u.unit === '登記課' &&
        (
          (u.work && (u.work.includes('初審') || u.work.includes('審查'))) ||
          (u.title && u.title.includes('初審'))
        )
      )
    },
    regAllUsers () {
      return this.activeUsers.filter(u => u.unit === '登記課')
    },
    otherDeptUsers () {
      return this.activeUsers.filter(u => u.unit !== '登記課')
    },
    displayUsers () {
      let list = []

      if (!this.$utils.empty(this.keyword)) {
        const kw = this.keyword.trim().toUpperCase()
        list = this.activeUsers.filter((u) => {
          const matchId = u.id && u.id.toUpperCase().includes(kw)
          const matchName = u.name && u.name.includes(kw)
          const matchUnit = u.unit && u.unit.includes(kw)
          const matchWork = u.work && u.work.includes(kw)
          const matchTitle = u.title && u.title.includes(kw)
          return matchId || matchName || matchUnit || matchWork || matchTitle
        })
      } else if (this.activeTab === 'reg_first') {
        list = [...this.regFirstUsers]
      } else if (this.activeTab === 'reg_all') {
        list = [...this.regAllUsers]
      } else if (this.activeTab === 'other_dept') {
        list = [...this.otherDeptUsers]
      } else {
        list = [...this.activeUsers]
      }

      return list.sort((a, b) => {
        const aIsCaseReviewer = this.caseReviewerUser && a.id === this.caseReviewerUser.id ? 1 : 0
        const bIsCaseReviewer = this.caseReviewerUser && b.id === this.caseReviewerUser.id ? 1 : 0
        if (aIsCaseReviewer !== bIsCaseReviewer) { return bIsCaseReviewer - aIsCaseReviewer }

        const aIsRegFirst = a.unit === '登記課' && a.work && a.work.includes('初審') ? 1 : 0
        const bIsRegFirst = b.unit === '登記課' && b.work && b.work.includes('初審') ? 1 : 0
        if (aIsRegFirst !== bIsRegFirst) { return bIsRegFirst - aIsRegFirst }

        const aIsReg = a.unit === '登記課' ? 1 : 0
        const bIsReg = b.unit === '登記課' ? 1 : 0
        if (aIsReg !== bIsReg) { return bIsReg - aIsReg }

        return a.id.localeCompare(b.id)
      })
    }
  },
  created () {
    this.keyword = this.initKeyword || ''
  },
  mounted () {
    this.fetchUsers()
  },
  methods: {
    async fetchUsers () {
      this.isBusy = true
      try {
        const cached = await this.getCache('lah-user-select-users-v2')
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.rawUsers = cached
        } else {
          const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'department_users',
            valid: true,
            department: 'all'
          })
          if (this.$utils.statusCheck(data.status)) {
            this.rawUsers = data.raw || []
            this.setCache('lah-user-select-users-v2', this.rawUsers, 86400 * 1000)
          } else {
            this.notify(data.message, { type: 'warning' })
          }
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    getWorkLabel (u) {
      if (u.work) {
        if (u.work.includes('初審')) { return '初審' }
        if (u.work.includes('複審')) { return '複審' }
        if (u.work.includes('登簿')) { return '登簿' }
        if (u.work.includes('校對')) { return '校對' }
        if (u.work.includes('發狀')) { return '發狀' }
        if (u.work.includes('櫃台') || u.work.includes('櫃臺')) { return '櫃台' }
        return u.work.slice(0, 4)
      }
      return u.title || u.unit || '同仁'
    },
    getWorkBadgeClass (u) {
      if (u.work && u.work.includes('初審')) { return 'badge-success' }
      if (u.work && u.work.includes('複審')) { return 'badge-primary' }
      if (u.unit === '登記課') { return 'badge-info' }
      return 'badge-secondary'
    },
    getUserBtnClass (u) {
      const classes = []
      if (this.caseReviewerUser && u.id === this.caseReviewerUser.id) {
        classes.push('is-active-case-reviewer')
      } else if (u.unit === '登記課' && u.work && u.work.includes('初審')) {
        classes.push('is-reg-first')
      }
      return classes.join(' ')
    },
    update (id) {
      this.trigger('update', id)
      this.keyword = id
    },
    clean () {
      this.trigger('clean')
      this.keyword = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
  padding: 4px;
}
.user-item-btn {
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 8px 10px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.18s ease-in-out;
  user-select: none;

  &:hover {
    border-color: #007bff;
    background-color: #f0f7ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 123, 255, 0.15);
  }
}
.user-item-btn.is-reg-first {
  border-color: #b8daff;
  background-color: #f8fbff;
  &:hover {
    background-color: #e8f4ff;
    border-color: #007bff;
  }
}
.user-item-btn.is-active-case-reviewer {
  border: 2px solid #28a745;
  background-color: #eafaf1;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.25);
}
</style>
