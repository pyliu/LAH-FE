<template lang="pug">
b-card(:class="{ 'board-expanded': filteredUsers.length > 0 }")
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="users", size="lg") 使用者查詢
      b-button-group.align-middle.my-auto(size="sm")
        lah-button(
          to="/admin/users",
          variant="outline-primary",
          icon="users-cog",
          no-border,
          no-icon-gutter,
          title="使用者管理"
        )
        lah-button(
          variant="outline-success",
          icon="question",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="搜尋說明"
        )

  lah-help-modal(ref="help", modal-title="使用者查詢說明")
    h5 輸入下列條件查找使用者：
    ul
      li 使用者代碼 (如：HA02、HA10023946)
      li 姓名 (如：庭維、珮慈)
      li 電腦 IP 位址 (如：192.168.13.x)
    hr
    p.text-muted.small 提示：輸入 2 個字元以上即會即時過濾名冊並列出符合人員標籤，點選標籤即可檢視該使用者詳細資訊。按下 Enter 或搜尋鈕亦可向伺服器直接查詢。

  b-input-group(size="sm", prepend="關鍵字")
    b-form-input.no-cache(
      ref="input",
      v-model="input",
      placeholder="🔍 'HA02' 或 '珮慈' 或 '192.168.13.xxx'",
      @keyup.enter="query",
      :state="validateState",
      title="HAXXXX 或 姓名 或 IP"
    )
    template(#append)
      lah-button(
        v-if="input",
        icon="xmark",
        variant="outline-secondary",
        @click="input = ''",
        title="清除"
      )
      //- lah-button(
      //-   icon="magnifying-glass",
      //-   variant="outline-primary",
      //-   @click="query",
      //-   title="搜尋使用者",
      //-   :disabled="!validate",
      //-   :busy="isBusy"
      //- ) 搜尋

  //- 匹配結果標籤清單
  .mt-2(v-if="filteredUsers.length > 0")
    .d-flex.justify-content-between.align-items-center.mb-1.text-muted.small.border-bottom.pb-1
      span
        lah-fa-icon(icon="user-check")
        span.ml-1 符合名冊 (共 {{ filteredUsers.length }} 位)
      span.text-muted 點擊檢視卡片
    .usertag-container.overflow-auto
      .d-flex.flex-wrap.align-items-center
        .m-1.px-2.py-1.rounded.border.d-inline-flex.align-items-center.usercard(
          v-for="userinfo in filteredUsers",
          :key="'usertag_' + userinfo.id",
          @click.stop="popUserCard(userinfo)",
          v-b-popover.hover.html="popover(userinfo)",
          :class="isOffboard(userinfo) ? 'bg-light text-muted border-danger' : 'bg-light text-dark border-secondary'"
        )
          b-avatar.mr-1(
            size="1.3em",
            :src="avatarSrc(userinfo)",
            variant="light"
          )
          span {{ userinfo.id }}: {{ userinfo.name || '無姓名' }}
          b-badge.ml-1(v-if="isOffboard(userinfo)", variant="danger", pill) 離職

  .mt-2.text-muted.small.text-center(v-else-if="validate && !isBusy")
    span 查無符合「{{ input }}」之使用者
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'

export default {
  name: 'LahMgmtBoardUserQuery',
  components: { lahUserCard },
  props: {
    avatar: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    input: '',
    usernames: [],
    isBusy: false
  }),
  computed: {
    validate () {
      return Boolean(this.input && this.input.trim().length > 1)
    },
    validateState () {
      if (!this.input) { return null }
      return this.input.trim().length > 1 ? true : null
    },
    isAuthorized () {
      return Boolean(this.authority?.isAdmin || this.authority?.isUserMgtStaff)
    },
    filteredUsers () {
      const kw = (this.input || '').trim().toLowerCase()
      if (!kw || kw.length < 2) {
        return []
      }
      const matched = this.usernames.filter((u) => {
        return (
          (u.id && u.id.toLowerCase().includes(kw)) ||
          (u.name && u.name.toLowerCase().includes(kw)) ||
          (u.ip && u.ip.includes(kw)) ||
          (u.ext && String(u.ext).includes(kw)) ||
          (u.unit && u.unit.toLowerCase().includes(kw)) ||
          (u.work && u.work.toLowerCase().includes(kw)) ||
          (u.title && u.title.toLowerCase().includes(kw))
        )
      })
      // 已離職者擺在最後面
      return matched.sort((a, b) => {
        const aOff = this.isOffboard(a) ? 1 : 0
        const bOff = this.isOffboard(b) ? 1 : 0
        if (aOff !== bOff) {
          return aOff - bOff
        }
        return (a.id || '').localeCompare(b.id || '')
      })
    }
  },
  mounted () {
    this.loadUsernames()
  },
  methods: {
    avatarSrc (userinfo) {
      return `/img/get_user_img.php?id=${userinfo.id}_avatar&name=${userinfo.name}_avatar`
    },
    isOffboard (userinfo) {
      return Boolean((userinfo.authority & 1) === 1 || userinfo.offboard_date)
    },
    popover (userinfo) {
      const left = this.isOffboard(userinfo)
        ? `<div class="text-danger font-weight-bold">離職：${userinfo.offboard_date || '已離職'} <i class="fa fa-ban text-danger"></i></div>`
        : ''
      let admin = ''
      if (this.isAuthorized) {
        admin = `
          <div>生日：${userinfo.birthday || '未填寫'}</div>
          <div>學歷：${userinfo.education || '未填寫'}</div>
          <div>考試：${userinfo.exam || '未填寫'}</div>
          <div>手機：${userinfo.cell || '未填寫'}</div>
          <div>到職：${userinfo.onboard_date || '未填寫'}</div>
        `
      }
      const html = `<div class="small">
        <div>職稱：${userinfo.title || '無'}</div>
        <div>分機：${userinfo.ext || '無'}</div>
        <div>單位：${userinfo.unit || '無'}</div>
        <div>工作：${userinfo.work || '無'}</div>
        ${admin}
        ${left}
      </div>`
      return {
        title: `${userinfo.id} ${userinfo.name || ''}`,
        content: html,
        html: true,
        trigger: 'hover',
        delay: { show: 300, hide: 100 }
      }
    },
    async loadUsernames () {
      this.isBusy = true
      try {
        const cached = await this.getCache('user_names')
        if (cached && Array.isArray(cached) && cached.length > 0) {
          this.usernames = cached
          return
        }
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'user_names'
        })
        if (this.$utils.statusCheck(data.status)) {
          this.usernames = data.raw || []
          // 緩存 4 小時
          await this.setCache('user_names', this.usernames, 4 * 60 * 60 * 1000)
        } else {
          this.warning(data.message || '無法取得使用者名冊資料')
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    popUserCard (userinfo, optId) {
      if (!userinfo) { return }
      let raw = []
      let id = ''
      let name = ''
      if (typeof userinfo === 'string') {
        name = userinfo
        id = optId || userinfo
      } else if (Array.isArray(userinfo)) {
        raw = userinfo
        id = raw[0]?.id || ''
        name = raw[0]?.name || ''
      } else if (typeof userinfo === 'object') {
        raw = [userinfo]
        id = userinfo.id || ''
        name = userinfo.name || ''
      }
      this.modal(this.$createElement(lahUserCard, {
        props: {
          raw,
          id,
          name,
          noEditButton: !this.isAuthorized
        }
      }), {
        title: `${name || id} 使用者資訊${this.$utils.empty(id) ? '' : ` (${id})`}`,
        size: 'md'
      })
    },
    popUsercard (userinfo, optId) {
      this.popUserCard(userinfo, optId)
    },
    query () {
      const kw = this.input.trim().replace(/\?/g, '')
      if (this.$utils.empty(kw)) {
        this.warning('請輸入查詢關鍵字')
        return
      }
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.USER, {
        type: 'search_user',
        keyword: kw
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          if (Array.isArray(data.raw) && data.raw.length > 0) {
            this.popUserCard(data.raw)
          } else {
            this.warning(`查無 ${kw} 資料。`)
          }
        } else {
          this.warning(data.message || `查無 ${kw} 資料。`)
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.usertag-container {
  max-height: 260px;
}

.usercard {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 0.8rem;
  font-weight: normal;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
}
</style>
