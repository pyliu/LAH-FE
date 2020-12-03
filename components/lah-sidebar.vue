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
      <li>
        <NuxtLink to="/">
          <font-awesome-icon :icon="['fas', 'home']" pull="left" size="lg" />
          首頁
        </NuxtLink>
      </li>
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
        <NuxtLink to="/playground">
          <font-awesome-icon :icon="['fas', 'charging-station']" size="lg" />
          測試
        </NuxtLink>
      </li>
      <li>
        <b-link @click="clearFECache">
          <font-awesome-icon :icon="['fas', 'hand-sparkles']" size="lg" />
          清除瀏覽器端快取資料
        </b-link>
      </li>
    </ul>
  </b-sidebar>
</template>

<script>
export default {
  data: () => ({
    apiServer: undefined
  }),
  computed: {
    serverUrl () {
      if (this.apiServer && Array.isArray(this.apiServer.ips) && this.apiServer.ips.length > 0) {
        return `http://${this.apiServer.ips[0]}`
      }
      return `http://127.0.0.1`
    }
  },
  methods: {
    clearFECache () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        ans && this.clearCache() && this.notify('清除完成，5秒後自動整理頁面。') && this.timeout(() => location.reload(), 5000)
      })
    }
  },
  mounted () {
    this.getCache('server-info').then((json) => {
      if (json === false) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'svr'
        }).then((res) => {
          this.apiServer = res.data
          this.$store.commit('svr', this.apiServer.server)
          this.setCache('server-info', this.apiServer, 86400000) // cache for a day
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.$utils.log('Got API server info.', this.apiServer)
          this.$store.commit('svr', this.apiServer.server)
          this.isBusy = false
        })
      } else {
        this.apiServer = json
        this.$store.commit('svr', this.apiServer.server)
      }
    })
  }
}
</script>

<style lang="scss" scoped>
#lah-sidebar {
  a {
    &:hover,
    &:active {
      font-weight: bold;
      font-size: 1.1rem;
      text-decoration: none;
    }
    &.nuxt-link-exact-active {
      @extend :hover;
      color: rgb(255, 255, 255) !important;
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
}
</style>
