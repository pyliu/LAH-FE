<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto.d-flex
          .my-auto 傳送公告訊息說明
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ol
          li 各課室需有授權的人員才發布公告訊息，如需協助請洽系管
          li 如欲傳送所內訊息，請至 #[nuxt-link(to="/message") #[lah-fa-icon(icon="paper-plane" variant="primary") 所內訊息]] 進行傳送
          li 電腦端信差即時通軟體請至 #[a(href="http://220.1.34.18:8888/service/section/%E8%B3%87%E8%A8%8A%E8%AA%B2/soft.html" target="_blank") #[lah-fa-icon(icon="landmark" variant="primary") 知識網]] 下載安裝
      .d-flex
    b-card.text-center.vh-85
      h2 需有權限才能發送公告訊息，若有需求請洽系管調整。
      ul.bottom-right.text-muted
        li 如欲傳送所內訊息，請至 #[nuxt-link(to="/message") #[lah-fa-icon(icon="paper-plane" variant="primary") 所內訊息]] 進行傳送
        li 電腦端信差即時通軟體請至 #[a(href="http://220.1.34.18:8888/service/section/%E8%B3%87%E8%A8%8A%E8%AA%B2/soft.html" target="_blank") #[lah-fa-icon(icon="landmark" variant="primary") 知識網]] 下載安裝
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
    // if (this.authority.isAdmin || this.authority.isNotifyMgtStaff) {
    //   this.$router.push('/notification')
    // }
  },
  mounted () {
  },
  methods: {
  }
}
</script>

<style>
.vh-85 {
  height: calc(100vh - 105px);
}
.bottom-right {
  list-style: none;
  position: absolute;
  right: 15px;
  top: calc(100vh - 160px);
}
</style>
