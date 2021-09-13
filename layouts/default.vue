<template lang="pug">
  b-container(v-cloak fluid)
    Nuxt
    lah-footer
</template>

<script>
export default {
  created () {
    // this.$acts.cancel('page cahnged ... previous axios request has been cancelled!')
    this.login()
  },
  mounted () {
    const ua = window.navigator.userAgent
    if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0) {
      document.body.innerHTML = `
        <h1 style="color: red; text-align: center; font-weight: bold; margin-top: 5rem;">不支援IE瀏覽器，請使用最新版本 Chrome 開啟本頁面</h1>
        <h2 style="color: blue; text-align: center; font-weight: bold; margin-top: 5rem;">請將 ${window.location.href} 複製，貼到 CHROME 的網址列</h2>
      `
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
