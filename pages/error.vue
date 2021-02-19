<template lang="pug">
  div(v-cloak)
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100.my-auto
      .d-flex: lah-fa-icon(append regular icon="comment-dots" variant="danger") OOPS!
      div
    .center.full
      div.text-center.mx-auto
          h1.text-danger.font-weight-bold.mb-3(v-if="error.statusCode") {{ error.statusCode }}
          h3 {{ message }}
          p.mt-3.
            仍然有問題!? 可嘗試
            #[b-link(@click="clearFECache" class="text-primary") #[font-awesome-icon(:icon="['fas', 'hand-sparkles']")] 清除瀏覽器快取資料]
          nuxt-link(to="/") 回首頁      。
</template>

<script>
import isEmpty from 'lodash/isEmpty'

export default {
  head: {
    title: '發生錯誤-桃園市地政局'
  },
  layout: 'error',
  asyncData ({ store, redirect, error}) {
    if (isEmpty(store.getters.lastMessage) && isEmpty(error.message)) {
      redirect('/')
    }
    if (isEmpty(error.statusCode)) {
      error.statusCode = 599  // my defined error code
    }
    return { error }
  },
  computed: {
    message () {
      return this.lastMessage || this.error.message
    }
  },
  methods: {
    clearFECache () {
      this.confirm('請確認要清除快取資料？').then((ans) => {
        ans && this.clearCache() && this.notify('清除完成，3秒後自動整理頁面。') && this.timeout(() => location.reload(), 3000)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.full {
  height: 65vh;
}
</style>
