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
    b-card.center.vh-85
      h1 您需要有公告管理者權限，請洽系統管理者調整。
      h2 您仍可傳送個人訊息，如欲傳送請按 #[nuxt-link(to="/message") 此處] 。
      h3 PC端信差即時通請至知識網下載安裝。
</template>

<script>
export default {
  data: () => ({}),
  head: {
    title: '傳送公告訊息說明 - 桃園地政事務所'
  },
  computed: {
  },
  watch: {
  },
  created () {
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
