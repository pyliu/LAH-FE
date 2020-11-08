<template>
  <b-container v-cloak fluid>
    <Nuxt />
    <b-sidebar
      id="lah-sidebar"
      title="快速選單"
      bg-variant="dark"
      text-variant="light"
      backdrop
      shadow
    >
      <ul class="px-3 py-2">
        <li><NuxtLink to="/"> 首頁 </NuxtLink></li>
        <li>
          <a
            href="http://220.1.35.84/"
            target="_blank"
            rel="noopener noreferrer"
            class="button--green"
          >
            中壢所舊版
          </a>
        </li>
        <li>
          <a
            href="https://github.com/pyliu/LAH-NUXTJS"
            target="_blank"
            rel="noopener noreferrer"
            class="button--grey"
          >
            原始碼
          </a>
        </li>
      </ul>
    </b-sidebar>
  </b-container>
</template>

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
  margin-left: 15px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}
</style>
