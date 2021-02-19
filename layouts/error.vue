<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100.my-auto
      .d-flex.ml-3: lah-fa-icon(append regular icon="comment-dots")
        span.mr-2 #[strong.text-danger {{ error.statusCode }}] 錯誤訊息
      div
    b-container.center.full
        div.text-center
          blockquote.h4(v-if="error.statusCode === 404").
            找不到頁面 {{ decodeURI(error.path) }}
          blockquote.h4(v-else) {{ error.message || '有錯誤發生' }}
          p.mt-3
            lah-fa-icon(icon="lightbulb" regular variant="warning").
              仍然有問題!? 可嘗試
              #[b-link(@click="clear" class="text-primary") #[font-awesome-icon(:icon="['fas', 'hand-sparkles']")] 清除本系統快取資料]
          nuxt-link(to="/")
            lah-fa-icon(icon="home" variant="success") 回首頁
</template>

<script>
export default {
  props: ['error'],
  layout: 'default', // you can set a custom layout for the error page
  methods: {
    clear () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        ans && this.clearCache() && this.notify('清除完成，3秒後自動整理頁面。') && this.timeout(() => location.reload(), 3000)
      })
    }
  },
  mounted () {
    // console.log(this.error)
  }
}
</script>

<style lang="scss" scoped>
html, body {
  background-color: #000;
  color: #FFF;
  font-weight: bold;
}

.full {
  height: 65vh;
}
</style>