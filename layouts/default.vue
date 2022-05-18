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
  async mounted () {
    const ua = window.navigator.userAgent
    if (!ua.includes('AppleWebKit/') && !ua.includes('Chrome/') && !ua.includes('Safari/') && !ua.includes('Edg/')) {
      document.body.innerHTML = `
        <h1 style="color: red; text-align: center; font-weight: bold; margin-top: 5rem;">不支援此瀏覽器，請嘗試使用其他瀏覽器</h1>
        <h2 style="color: blue; text-align: center; font-weight: bold; margin-top: 5rem;">請將 ${window.location.href} 複製，貼到另一個瀏覽器視窗的網址列</h2>
      `
    }
    // userNames initial value is undefined
    if (this.userNames === undefined && this.userNames !== null) {
      try {
        // flag to ensure doing this task once
        this.$store.commit('userNames', null)
        const json = await this.getCache('userNames')
        if (json !== false) {
          // within a day use the cached data
          this.$store.commit('userNames', json || {})
        } else {
          await this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'user_mapping'
          }).then(({ data }) => {
            const json = data.data
            // one day in milliseconds
            this.setCache && this.setCache('userNames', json, 24 * 60 * 60 * 1000)
            this.$store.commit('userNames', json || {})
          }).catch((err) => {
            console.error(err)
            this.$store.commit('userNames', {})
          })
        }
      } catch (e) {
        console.error('讀取 userNames 失敗', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
