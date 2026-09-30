<template lang="pug">
b-card.channel-card(no-body)
  template(#header): .d-flex.justify-content-between.align-items-center
    .d-flex.align-items-center.text-truncate
      b-icon.mr-1(icon="people-fill" variant="info")
      span.font-weight-bold 線上使用者
      b-badge.ml-1(pill :variant="connectedUsersBadgeVariant") {{ uniqueConnectedUsersCount }} 人
    .d-flex.align-items-center
      b-button(
        size="sm"
        variant="outline-secondary"
        class="py-0 px-2 s-80"
        :disabled="isRefreshing"
        @click="refresh"
        title="重新整理線上同仁名單"
      )
        b-icon(icon="arrow-clockwise" :animation="isRefreshing ? 'spin' : undefined")

  //- 搜尋與排序過濾列
  .px-2.py-1.bg-light.border-bottom.d-flex.align-items-center
    b-input.mr-2(
      v-model.trim="onlineKeyword"
      placeholder="搜尋姓名或帳號..."
      size="sm"
    )
    b-checkbox.text-nowrap.s-80(
      v-model="onlineAscending"
      v-b-tooltip="'依人數由少至多排序'"
      size="sm"
      switch
    ) 排序

  b-card-body.p-2.d-flex.flex-column.position-relative
    b-overlay(:show="isRefreshing" no-wrap opacity="0.6" spinner-variant="info" rounded="sm")
    .message-scroll-area(ref="scrollArea")
      b-list-group.online-users-list(flush)
        b-list-group-item.px-2.py-2(
          v-for="(deptItem, idx) in onlineUsersByDept"
          :key="`online-dept-${deptItem.id || idx}`"
          v-if="deptItem.users.length > 0"
        ): .d-flex.align-items-start
          .text-nowrap.mr-auto.lah-shadow.my-1
            b-link(
              v-if="isAdmin"
              @click="onDeptClick(deptItem.id)"
              :title="deptItem.id !== 'none' ? `點擊將課室頻道切換至 ${deptItem.text}` : ''"
              class="text-decoration-none"
            )
              span.font-weight-bold.text-dark {{ deptItem.text }}
              b-badge.ml-1(variant="success" pill) {{ deptItem.users.length }}
            span.font-weight-bold.text-dark(v-else)
              span {{ deptItem.text }}
              b-badge.ml-1(variant="success" pill) {{ deptItem.users.length }}

          b-avatar-group(
            size="2.5rem"
            :overlap="overlapRatio(deptItem.users.length)"
          ): transition-group.d-flex.justify-content-end.flex-wrap(name="listY" tag="div"): lah-messenger-user-avatar.shadow.my-1(
            v-for="(user, uidx) in deptItem.users"
            :key="`avatar-${user ? (user.userid || user.id) : 'unknown'}-${uidx}`"
            :user-data="user"
            size="2.5rem"
          )
      .text-center.my-5.text-muted(v-if="uniqueConnectedUsersCount === 0")
        b-icon(icon="person-x" font-scale="2.5" variant="secondary")
        .mt-2 目前無線上使用者
</template>

<script>
import lahMessengerBase from '~/mixins/lah-messenger-base'
import { DEPT_CODE_MAP } from '~/constants/lah-messenger-constants'
import LahMessengerUserAvatar from '~/components/lah-messenger-user-avatar.vue'

export default {
  name: 'LahMessengerOnlineUsers',
  components: {
    LahMessengerUserAvatar
  },
  mixins: [lahMessengerBase],
  data: () => ({
    onlineKeyword: '',
    onlineAscending: false,
    onlineTimer: null,
    isRefreshing: false,
    onlineAvatarsMaxPerLine: 8,
    onlineResizeObserver: null
  }),
  computed: {
    isAdmin () {
      const auth = this.authority || this.$store?.getters?.authority
      return !!auth?.isAdmin
    },
    connectedUsersBadgeVariant () {
      if (this.uniqueConnectedUsersCount > 100) {
        return 'danger'
      }
      if (this.uniqueConnectedUsersCount > 75) {
        return 'warning'
      }
      return 'success'
    },
    onlineUsersByDept () {
      const keyword = this.onlineKeyword
      const filter = [
        { text: '資訊課', users: [], id: 'inf' },
        { text: '登記課', users: [], id: 'reg' },
        { text: '地價課', users: [], id: 'val' },
        { text: '測量課', users: [], id: 'sur' },
        { text: '行政課', users: [], id: 'adm' },
        { text: '人事室', users: [], id: 'hr' },
        { text: '會計室', users: [], id: 'acc' },
        { text: '主任祕書室', users: [], id: 'supervisor' },
        { text: '無歸屬', users: [], id: 'none' }
      ]
      const getDeptKey = (deptStr) => {
        if (!deptStr) {
          return 'none'
        }
        const s = String(deptStr).toLowerCase().trim()
        if (DEPT_CODE_MAP[deptStr]) {
          return DEPT_CODE_MAP[deptStr]
        }
        if (DEPT_CODE_MAP[s]) {
          return DEPT_CODE_MAP[s]
        }
        if (s.includes('資訊') || s === 'inf') {
          return 'inf'
        }
        if (s.includes('登記') || s === 'reg') {
          return 'reg'
        }
        if (s.includes('地價') || s === 'val') {
          return 'val'
        }
        if (s.includes('測量') || s === 'sur') {
          return 'sur'
        }
        if (s.includes('行政') || s === 'adm') {
          return 'adm'
        }
        if (s.includes('人事') || s === 'hr') {
          return 'hr'
        }
        if (s.includes('會計') || s === 'acc') {
          return 'acc'
        }
        if (s.includes('秘') || s.includes('祕') || s === 'supervisor') {
          return 'supervisor'
        }
        return 'none'
      }
      const users = this.uniqueConnectedUsers
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        if (!user) {
          continue
        }
        if (
          this.$utils.empty(keyword) ||
          user.userid?.includes(keyword) ||
          user.username?.includes(keyword)
        ) {
          const deptKey = getDeptKey(user?.dept)
          switch (deptKey) {
            case 'inf': filter[0].users.push(user); break
            case 'reg': filter[1].users.push(user); break
            case 'val': filter[2].users.push(user); break
            case 'sur': filter[3].users.push(user); break
            case 'adm': filter[4].users.push(user); break
            case 'hr': filter[5].users.push(user); break
            case 'acc': filter[6].users.push(user); break
            case 'supervisor': filter[7].users.push(user); break
            default: filter[8].users.push(user)
          }
        }
      }
      return filter.sort((a, b) => {
        if (a.users.length > b.users.length) {
          return this.onlineAscending ? 1 : -1
        }
        if (a.users.length < b.users.length) {
          return this.onlineAscending ? -1 : 1
        }
        return 0
      })
    }
  },
  watch: {
    uniqueConnectedUsersCount () {
      this.updateOnlineAvatarsMaxPerLine()
    }
  },
  mounted () {
    this.queryOnlineUsers()
    clearInterval(this.onlineTimer)
    this.onlineTimer = setInterval(() => {
      this.queryOnlineUsers()
    }, 60 * 1000)

    this.updateOnlineAvatarsMaxPerLine()
    window.addEventListener('resize', this.updateOnlineAvatarsMaxPerLine)
    if (typeof ResizeObserver !== 'undefined' && this.$refs.scrollArea) {
      this.onlineResizeObserver = new ResizeObserver(() => {
        this.updateOnlineAvatarsMaxPerLine()
      })
      this.onlineResizeObserver.observe(this.$refs.scrollArea)
    }
  },
  beforeDestroy () {
    clearInterval(this.onlineTimer)
    window.removeEventListener('resize', this.updateOnlineAvatarsMaxPerLine)
    if (this.onlineResizeObserver) {
      this.onlineResizeObserver.disconnect()
      this.onlineResizeObserver = null
    }
  },
  methods: {
    queryOnlineUsers () {
      if (this.websocket && this.websocket.readyState === 1) {
        this.websocket.send(
          this.packCommand({
            command: 'online',
            channel: 'chat'
          })
        )
      }
    },
    refresh () {
      if (!this.websocket || this.websocket.readyState !== 1) {
        this.warning('即時通未連線，無法重新整理')
        return
      }
      this.isRefreshing = true
      this.queryOnlineUsers()
      setTimeout(() => {
        this.isRefreshing = false
        this.notify('已重新整理線上同仁名單', { variant: 'success' })
      }, 600)
    },
    overlapRatio (count) {
      const maxInRow = this.onlineAvatarsMaxPerLine || 8
      if (count <= maxInRow) {
        return 0.0
      }
      if (count < maxInRow + 2) { return 0.3 }
      if (count < Math.round(maxInRow * 2.5)) { return 0.4 }
      if (count < 64) { return 0.5 }
      return 0.6
    },
    updateOnlineAvatarsMaxPerLine () {
      this.$nextTick(() => {
        const el = this.$refs.scrollArea
        if (el) {
          const width = el.clientWidth
          const available = width - 100
          if (available > 0) {
            this.onlineAvatarsMaxPerLine = Math.max(Math.floor(available / 40), 5)
          }
        }
      })
    },
    onDeptClick (deptId) {
      if (deptId !== 'none') {
        this.$emit('dept-click', deptId)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.channel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  ::v-deep .card-header {
    padding: 0.5rem 0.75rem;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    flex-shrink: 0;
  }

  ::v-deep .card-body {
    padding: 0.5rem;
    flex: 1 1 auto;
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background-color: #fafbfc;
  }
}

.message-scroll-area {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}
</style>
