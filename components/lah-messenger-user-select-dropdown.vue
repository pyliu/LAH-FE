<template lang="pug">
b-dropdown.lah-messenger-user-select-dropdown(
  ref="dropdown"
  :size="size"
  :variant="variant"
  no-caret
  menu-class="shadow p-1 user-dropdown-menu"
  :disabled="disabled"
  :dropup="dropup"
)
  template(#button-content)
    .d-flex.align-items-center.text-truncate
      b-avatar.mr-1(
        :src="currentAvatarSrc"
        size="1.25rem"
        variant="light"
      )
      span.font-weight-bold.text-truncate.s-85 {{ currentLabel }}
      b-badge.ml-1.p-1(
        v-if="isCurrentOnline && !isCurrentSelf"
        variant="success"
        dot
        v-b-tooltip.hover="'線上'"
        style="width: 7px; height: 7px; border-radius: 50%; display: inline-block; padding: 0;"
      )
      b-icon.ml-1(icon="chevron-down" font-scale="0.8")

  //- 搜尋過濾列
  b-dropdown-form.p-1(@submit.stop.prevent)
    b-input-group(size="sm")
      template(#prepend)
        b-input-group-text.py-0.px-2
          b-icon(icon="search" font-scale="0.85")
      b-form-input(
        ref="searchInput"
        v-model.trim="keyword"
        size="sm"
        placeholder="搜尋同仁姓名或帳號..."
        @click.stop
        @keydown.stop
      )
      template(#append)
        b-button(
          v-if="keyword"
          size="sm"
          variant="outline-secondary"
          class="py-0 px-2"
          @click.stop="keyword = ''"
        ) ✕

  b-dropdown-divider.my-1

  //- 使用者列表 (滾動區域)
  .user-list-scroll-area
    //- 1. 自己 (個人備忘 / 暫存)
    b-dropdown-item(
      :active="isCurrentSelf"
      @click="selectUser(selfUser)"
      class="user-item-row"
    )
      .d-flex.align-items-center.justify-content-between.w-100
        .d-flex.align-items-center.text-truncate
          b-avatar.mr-2(
            :src="getUserAvatar(userid, username)"
            size="1.5rem"
            variant="light"
          )
          .text-truncate
            span.font-weight-bold 自己
            span.text-muted.s-80.ml-1 ({{ userid }})
        b-badge(variant="secondary" pill class="s-75") 筆記/暫存

    //- 2. 搜尋模式結果
    template(v-if="keyword")
      b-dropdown-header.py-1.s-80.text-muted 搜尋結果 ({{ searchedUsers.length }})
      b-dropdown-item(
        v-for="u in searchedUsers"
        :key="`search-${u.id}`"
        :active="u.id === selectedId"
        @click="selectUser(u)"
        class="user-item-row"
      )
        .d-flex.align-items-center.justify-content-between.w-100
          .d-flex.align-items-center.text-truncate
            b-avatar.mr-2(
              :src="getUserAvatar(u.id, u.name)"
              size="1.5rem"
              variant="light"
            )
            .text-truncate
              span.font-weight-bold {{ u.name }}
              span.text-muted.s-80.ml-1 ({{ u.id }})
          .d-flex.align-items-center
            b-badge.mr-1(
              v-if="u.deptName"
              variant="light"
              class="border s-75"
            ) {{ u.deptName }}
            b-badge(
              :variant="u.isOnline ? 'success' : 'secondary'"
              pill
              class="s-75"
            ) {{ u.isOnline ? '線上' : '離線' }}
      .text-center.py-3.text-muted.s-85(v-if="searchedUsers.length === 0")
        b-icon(icon="person-x" font-scale="1.2" class="mb-1")
        div 查無「{{ keyword }}」相關同仁

    //- 3. 預設分類清單
    template(v-else)
      //- 線上同仁
      template(v-if="onlineUsers.length > 0")
        b-dropdown-divider.my-1
        b-dropdown-header.py-1.s-80.text-success.d-flex.align-items-center
          span.online-indicator.mr-1
          span 線上同仁 ({{ onlineUsers.length }})
        b-dropdown-item(
          v-for="u in onlineUsers"
          :key="`online-${u.id}`"
          :active="u.id === selectedId"
          @click="selectUser(u)"
          class="user-item-row"
        )
          .d-flex.align-items-center.justify-content-between.w-100
            .d-flex.align-items-center.text-truncate
              b-avatar.mr-2(
                :src="getUserAvatar(u.id, u.name)"
                size="1.5rem"
                variant="light"
              )
              .text-truncate
                span.font-weight-bold {{ u.name }}
                span.text-muted.s-80.ml-1 ({{ u.id }})
            b-badge(
              v-if="u.deptName"
              variant="success"
              pill
              class="s-75"
            ) {{ u.deptName }}

      //- 底部友善提示引導搜尋本所其他同仁
      b-dropdown-divider.my-1
      b-dropdown-text.text-muted.text-center.py-1.s-75
        b-icon.mr-1(icon="info-circle" variant="info")
        span 💡 輸入姓名或帳號搜尋其他同仁
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import { DEPT_NAME_MAP, getDepartmentCode } from '~/constants/lah-messenger-constants'

export default {
  name: 'LahMessengerUserSelectDropdown',
  mixins: [lahMessengerBase],
  props: {
    value: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'sm'
    },
    variant: {
      type: String,
      default: 'outline-info'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    dropup: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    keyword: ''
  }),
  computed: {
    selectedId () {
      return (this.value || this.userid || '').toUpperCase()
    },
    isCurrentSelf () {
      return this.selectedId === (this.userid || '').toUpperCase()
    },
    selfUser () {
      return {
        id: this.userid,
        name: this.username || '自己',
        dept: this.userdept || '',
        deptName: DEPT_NAME_MAP[this.userdept] || '',
        isOnline: true,
        isSelf: true
      }
    },
    currentLabel () {
      if (this.isCurrentSelf) {
        return '自己 (個人備忘)'
      }
      const name = this.userMap[this.selectedId] || this.selectedId
      return `${name} (${this.selectedId})`
    },
    currentAvatarSrc () {
      if (this.isCurrentSelf) {
        return this.getUserAvatar(this.userid, this.username)
      }
      const name = this.userMap[this.selectedId] || this.selectedId
      return this.getUserAvatar(this.selectedId, name)
    },
    isCurrentOnline () {
      return this.onlineUsers.some(u => u.id === this.selectedId)
    },
    onlineUsers () {
      const map = new Map()
      const list = Array.isArray(this.uniqueConnectedUsers) ? this.uniqueConnectedUsers : []
      const myId = (this.userid || '').toUpperCase()
      list.forEach((u) => {
        const uid = (u.userid || u.id || '').toUpperCase()
        if (uid && uid !== myId) {
          const dept = getDepartmentCode(u.work || u.dept || '')
          map.set(uid, {
            id: uid,
            name: u.username || u.name || this.userMap[uid] || uid,
            dept,
            deptName: DEPT_NAME_MAP[dept] || u.work || u.dept || '',
            isOnline: true
          })
        }
      })
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'))
    },
    sitePrefix () {
      return (this.site || this.systemConfigs?.site || 'HA').toUpperCase()
    },
    siteUsers () {
      const site = this.sitePrefix
      const onlineIds = new Set(this.onlineUsers.map(u => u.id))
      const result = []
      // 優先讀取 store 中已過濾之本所同仁 (siteUserNames)，若無則從 userMap 挑選
      const source = this.siteUserNames && Object.keys(this.siteUserNames).length > 0
        ? this.siteUserNames
        : (this.userMap || {})
      const myId = (this.userid || '').toUpperCase()
      Object.entries(source).forEach(([id, name]) => {
        const uid = id.toUpperCase()
        if (uid !== myId && uid.startsWith(site)) {
          const isOnline = onlineIds.has(uid)
          result.push({
            id: uid,
            name: name || uid,
            dept: '',
            deptName: '',
            isOnline
          })
        }
      })
      return result
    },
    searchedUsers () {
      const kw = (this.keyword || '').toLowerCase().trim()
      if (!kw) {
        return []
      }
      const combined = new Map()
      // 1. 線上同仁 (包含出差/跨所在線同仁)
      this.onlineUsers.forEach(u => combined.set(u.id, u))
      // 2. 本所同仁 (ID 以 HA/SITE CODE 開頭)
      this.siteUsers.forEach((u) => {
        if (!combined.has(u.id)) {
          combined.set(u.id, u)
        }
      })
      return Array.from(combined.values()).filter((u) => {
        const matchName = u.name.toLowerCase().includes(kw)
        const matchId = u.id.toLowerCase().includes(kw)
        const matchDept = u.deptName && u.deptName.toLowerCase().includes(kw)
        return matchName || matchId || matchDept
      }).sort((a, b) => {
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1
        }
        return a.name.localeCompare(b.name, 'zh-Hant')
      })
    }
  },
  methods: {
    getUserAvatar (id, name) {
      return `${this.apiQueryUrl}/get_user_img.php?id=${id}_avatar&name=${name}_avatar`
    },
    selectUser (u) {
      if (!u || !u.id) { return }
      this.$emit('input', u.id)
      this.$emit('change', u)
      this.keyword = ''
      this.$nextTick(() => {
        this.$refs.dropdown?.hide(true)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-messenger-user-select-dropdown {
  display: inline-block;

  ::v-deep .dropdown-toggle {
    max-width: 100%;
    display: inline-flex;
    align-items: center;
  }

  ::v-deep .dropdown-menu {
    z-index: 1060;
  }
}

.user-list-scroll-area {
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 250px;
}

.online-indicator {
  width: 8px;
  height: 8px;
  background-color: #28a745;
  border-radius: 50%;
  display: inline-block;
}

.user-item-row {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}
</style>
