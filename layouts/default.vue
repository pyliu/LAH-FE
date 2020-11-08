<template>
  <b-container v-cloak fluid>
    <lah-button
      icon="bars"
      size="lg"
      action="ld-move-fade-ltr"
      class="sidebar-button"
      variant="outline-dark"
      title="開啟選單"
      v-b-toggle.lah-sidebar
    />
    <Nuxt />
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
          </NuxtLink></li>
        <li>
          <a href="http://220.1.35.84/" target="_blank" rel="noopener noreferrer">
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
      </ul>
    </b-sidebar>
  </b-container>
</template>

<script>
export default {
  methods: {
    test () { this.notify(this.uuid()) }
  }
}
</script>

<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}

.button--green:hover {
  color: #fff;
  background-color: #3b8070;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}

.sidebar-button {
  position: fixed;
  left: 10px;
  top: 10px;
  width: 3.5rem;
}

#lah-sidebar ul {
  list-style-type: none;
  padding: 0;
}

#lah-sidebar ul li {
  margin: 8px 16px;
}

#lah-sidebar ul li a {
  color: rgb(187, 184, 184);
}
</style>
