<template lang="pug">
  div(v-cloak)
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100.my-auto
      .d-flex.ml-3: lah-fa-icon(append regular icon="exclamation-triangle")
        span.mr-2 #[strong.text-danger {{ error.statusCode }}] 錯誤訊息
      div
    .center.full
      div.text-center.mx-auto
          blockquote.h4 {{ message }}
          p.mt-3
            lah-fa-icon(icon="lightbulb" regular variant="warning").
              仍然有問題!? 可嘗試
              #[b-link(@click="clearFECache" class="text-primary") #[font-awesome-icon(:icon="['fas', 'hand-sparkles']")] 清除本系統快取資料]
          nuxt-link(to="/")
            lah-fa-icon(icon="home" variant="success") 回首頁
</template>

<script>
import isEmpty from 'lodash/isEmpty'

export default {
  head: {
    title: '發生錯誤-桃園市地政局'
  },
  asyncData ({ store, redirect, error }) {
    if (isEmpty(store.getters.lastMessage) && isEmpty(error.message)) {
      redirect('/')
    }
    if (isEmpty(error.statusCode)) {
      /*
        HTTP 狀態碼表明一個 HTTP 要求是否已經被完成。回應分為五種：
        資訊回應 (Informational responses, 100–199),
        成功回應 (Successful responses, 200–299),
        重定向 (Redirects, 300–399),
        用戶端錯誤 (Client errors, 400–499),
        伺服器端錯誤 (Server errors, 500–599).
       */
      error.statusCode = 499  // my defined error code
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
