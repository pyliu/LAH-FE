<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto.d-flex
          .my-auto 傳送公告訊息說明
        //- lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        //- lah-help-modal(:modal-id="'help-modal'"): ol
        //-   li 歷史資料儲存於瀏覽器端，清除瀏覽器快取即可清空
        //-     ul: li 最少顯示 #[b.text-info 3] 筆，最多顯示 #[b.text-info 10] 筆
        //-   li 內容支援 Markdown 語法，請參考 #[a(href="https://bit.ly/mdcheat" target="_blank") #[b https://bit.ly/mdcheat]] 教學
      .d-flex
    b-card.center.text-center.vh-85
      h1 您需要有權限才能發送所內公告，若有需求請洽系統管理者調整。
      h2 傳送個人訊息無權限限制，請至 #[nuxt-link(to="/message") 此頁面] 進行傳送。
      h3 PC端信差即時通請至 #[a(href="http://220.1.34.18:8888/service/section/%E8%B3%87%E8%A8%8A%E8%AA%B2/soft.html" target="_blank") 所內知識網] 下載安裝。
</template>

<script>
export default {
  data: () => ({}),
  head: {
    title: '公告訊息說明 - 桃園地政事務所'
  },
  computed: {
  },
  watch: {
  },
  created () {
    if (this.authority.isAdmin || this.authority.isNotifyMgtStaff) {
      this.$router.push('/notification')
    }
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style>
.vh-85 {
  height: 85vh;
}
</style>
