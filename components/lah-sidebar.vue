<template>
  <b-sidebar
    id="lah-sidebar"
    title="選單"
    bg-variant="dark"
    text-variant="light"
    backdrop
    shadow
  >
    <ul>
      <li><hr/></li>
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['fas', 'home']" pull="left" size="lg" />
          首頁
        </NuxtLink>
      </li>
      <li><hr/></li>
      <li>
        <NuxtLink to="/expire">
          <font-awesome-icon :icon="['far', 'calendar-check']" size="lg" />
          即將逾期案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/expiry-of-announcement">
          <font-awesome-icon :icon="['fa', 'sticky-note']" size="lg" />
          公告期滿案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/ask-for-instructions">
          <font-awesome-icon :icon="['fas', 'user-tie']" size="lg" />
          請示未結案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/trust-case">
          <font-awesome-icon :icon="['fas', 'money-check-alt']" size="lg" />
          信託案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/non-scrivener-case">
          <font-awesome-icon :icon="['fas', 'user-tag']" size="lg" />
          非專業代理人案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/foreigner-case">
          <font-awesome-icon :icon="['fas', 'user-astronaut']" size="lg" />
          外人地權案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/agriculture-375-change">
          <font-awesome-icon :icon="['fas', 'border-all']" size="lg" />
          三七五租約異動
        </NuxtLink>
      </li>
      <!-- <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['far', 'times-circle']" size="lg" />
          未辦標的註記異動
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['far', 'times-circle']" size="lg" />
          參考資訊檔異動通知書產製
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['far', 'times-circle']" size="lg" />
          逾期未駁回案件
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['far', 'times-circle']" size="lg" />
          辦畢通知查詢
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['far', 'times-circle']" size="lg" />
          領狀管控查詢
        </NuxtLink>
      </li> -->
      <li v-if="isAuthorized"><hr/></li>
      <li v-if="isAuthorized">
        <NuxtLink to="/admin">
          <font-awesome-icon :icon="['fas', 'cogs']" size="lg" />
          系統管理
        </NuxtLink>
      </li>
      <li v-if="isAuthorized">
        <NuxtLink to="/stats">
          <font-awesome-icon :icon="['fas', 'calculator']" size="lg" />
          統計看板
        </NuxtLink>
      </li>
      <li v-if="isAuthorized">
        <NuxtLink to="/playground">
          <font-awesome-icon :icon="['fas', 'charging-station']" size="lg" />
          測試
        </NuxtLink>
      </li>
      <li><hr/></li>
      <li>
        <a :href="serverUrl" target="_blank" rel="noopener noreferrer">
          <font-awesome-icon :icon="['fas', 'history']" pull="left" size="lg" />
          先前版本
        </a>
      </li>
      <li>
        <a
          href="https://github.com/pyliu/LAH-NUXTJS"
          target="_blank"
          rel="noopener noreferrer"
        >
          <font-awesome-icon :icon="['fab', 'github']" pull="left" size="lg" />
          原始碼
        </a>
      </li>
      <li>
        <b-link @click="clearFECache">
          <font-awesome-icon :icon="['fas', 'hand-sparkles']" size="lg" />
          清除瀏覽器端快取資料
        </b-link>
      </li>
      <li><hr/></li>
      <li class="text-right">
        <b-link href="mailto:pangyu.liu@gmail.com" class="justify-content-between">
          <span></span>
          <lah-fa-icon icon="copyright" title="寄信給 LIU, PANG-YU" class="s-75 text-muted">
            LIU, PANG-YU
          </lah-fa-icon>
        </b-link>
      </li>
    </ul>
  </b-sidebar>
</template>

<script>
export default {
  fetchOnServer: false,
  computed: {
    isAuthorized () {
      return this.authority.isSuper || this.authority.isAdmin
    },
    serverUrl () {
      if (this.svr && Array.isArray(this.svr.ips) && this.svr.ips.length > 0) {
        return `http://${this.svr.ips[0]}`
      }
      return `http://127.0.0.1`
    }
  },
  methods: {
    clearFECache () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        ans && this.clearCache() && this.notify('清除完成，3秒後自動整理頁面。') && this.timeout(() => location.reload(), 3000)
      })
    }
  },
  async fetch () {
    if (this.$utils.empty(this.svr)) {
      this.getCache('server-info').then((json) => {
        if (json === false) {
          if (this.ip === '0.0.0.0') {
            this.$utils.warning('client ip is not ready ... wait 200ms to retry.')
            // give a chance to wait ip ready in $store
            this.timeout(() => this.$fetch(), 200)
          } else {
            this.isBusy = true
            this.$axios.post(this.$consts.API.JSON.QUERY, {
              type: 'svr',
              client_ip: this.ip
            }).then((res) => {
              this.$store.commit('svr', res.data)
              this.setCache('server-info', res.data, 86400000) // cache for a day
            }).catch((err) => {
              this.$utils.error(err)
            }).finally(() => {
              this.isBusy = false
            })
          }
        } else {
          this.$store.commit('svr', json)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
#lah-sidebar {
  a {
    font-size: 1rem;
    display: flex;
    text-decoration: none;
    &:hover {
      font-weight: bold;
      font-size: 1.1rem;
    }
    &:active {
      font-weight: bold;
      font-size: 1.2rem;
    }
    &.nuxt-link-exact-active {
      @extend :active;
      color: rgb(255, 255, 255) !important;
    }
    svg {
      margin-right: .4rem;
    }
  }
  ul {
    list-style-type: none;
    padding: 0;
    li {
      margin: 8px 16px;
      a {
        color: rgb(187, 184, 184);
      }
    }
  }
  hr {
    border: 1px solid rgb(138, 135, 135);
    border-radius: 2px;
  }
}
</style>
