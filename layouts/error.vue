<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100.my-auto
      .d-flex.ml-3: lah-fa-icon(append regular icon="comment-dots" variant="danger")
        span.mr-2 錯誤訊息
      .text-danger.font-weight-bold.mr-3 {{ error.statusCode }}
    b-container.center.full
        div.text-center
            blockquote.h4(v-if="error.statusCode === 404") 找不到頁面
            blockquote.h4(v-else) {{ error.message || '有錯誤發生' }}
            h2  {{ decodeURI(error.path) }}
            nuxt-link(to="/") 回首頁
</template>

<script>
export default {
  props: ['error'],
  layout: 'default', // you can set a custom layout for the error page
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