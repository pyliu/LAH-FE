<template>
  <b-container v-cloak fluid>
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      class="bars-button"
      variant="outline-dark"
      title="開啟選單"
      v-b-toggle.lah-sidebar
    />
    <NuxtLink to="/">
      <lah-button
        icon="home"
        size="lg"
        class="home-button pr-1"
        variant="outline-dark"
        title="回到首頁"
      >
      </lah-button>
    </NuxtLink>
    <Nuxt />
    <lah-footer />
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
            <font-awesome-icon
              :icon="['fas', 'home']"
              pull="left"
              size="lg"
            />
            首頁
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about-to-expire">
            <font-awesome-icon
              :icon="['far', 'calendar-check']"
              size="lg"
            />
            即將逾期案件
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/expiry-of-announcement">
            <font-awesome-icon
              :icon="['fa', 'sticky-note']"
              size="lg"
            />
            公告期滿案件
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/ask-for-instructions">
            <font-awesome-icon
              :icon="['fas', 'user-tie']"
              size="lg"
            />
            請示未結案件
          </NuxtLink>
        </li>
        <li>
          <a href="http://127.0.0.1/" target="_blank" rel="noopener noreferrer">
            <font-awesome-icon
              :icon="['fas', 'history']"
              pull="left"
              size="lg"
            />
            先前版本
          </a>
        </li>
        <li>
          <a href="https://github.com/pyliu/LAH-NUXTJS" target="_blank" rel="noopener noreferrer">
            <font-awesome-icon
              :icon="['fab', 'github']"
              pull="left"
              size="lg"
            />
            原始碼
          </a>
        </li>
        <li>
          <NuxtLink to="/playground">
            <font-awesome-icon
              :icon="['fas', 'leaf']"
              size="lg"
            />
            測試
          </NuxtLink>
        </li>
      </ul>
    </b-sidebar>
  </b-container>
</template>

<script>
export default {
  methods: {
    
  }
}
</script>

<style lang="scss">
.bars-button {
  position: fixed;
  left: 1rem;
  top: 10px;
  width: 3.5rem;
  background-color: white;
}

.home-button {
  @extend .bars-button;
  right: 1rem;
  left: initial;
  padding: 8px 4px 8px 12px;
}

#lah-sidebar {
  a {
    &:hover, &:active {
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
