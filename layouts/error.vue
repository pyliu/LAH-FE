<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100.my-auto
      .d-flex: lah-fa-icon(append regular icon="comment-dots" variant="danger") OOPS!
      div
    b-container.center.full
        div.text-center
            h1.text-danger.font-weight-bold {{ error.statusCode }}
            h1(v-if="error.statusCode === 404") 找不到頁面
            h1(v-else) 有錯誤發生
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