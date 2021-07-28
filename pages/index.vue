<template lang="pug">
  .h-100
    lah-header
    .container: .anim-appear-1s
      section.fixed-title-height.center: div
        lah-logo
        h3.title.lah-shadow.text-nowrap 桃園市地政智慧管控系統
      section.b-card-container
        b-card-group.mb-4(deck)
          lah-index-card-link(:icon="['far', 'calendar-check']" to="/expire") 即將逾期案件
          lah-index-card-link(:icon="['far', 'sticky-note']" to="/expiry-of-announcement") 公告期滿案件
          lah-index-card-link(:icon="['fas', 'user-tie']" to="/ask-for-instructions") 取消請示案件
          lah-index-card-link(:icon="['fas', 'money-check-alt']" to="/trust") 信託相關案件
          lah-index-card-link(:icon="['fas', 'user-tag']" to="/non-scrivener-case") 非專業代理人案件
          lah-index-card-link(:icon="['fas', 'user-astronaut']" to="/foreigner-case") 外人地權案件
        b-card-group(deck)
          lah-index-card-link(:icon="['fas', 'border-all']" to="/agriculture-375-change") 375租約異動查詢
          lah-index-card-link(:icon="['fas', 'monument']" to="/not-done-change") 未辦標的註記異動
          lah-index-card-link(:icon="['fas', 'landmark']" to="/land-ref-change") 土地參考資訊檔異動
          lah-index-card-link(:icon="['fas', 'pager']" to="/reg-fix-case") 補正期滿案件查詢
          lah-index-card-link(:icon="['fas', 'bullhorn']" to="/reg-not-done-case") 辦畢通知案件查詢
          lah-index-card-link(:icon="['fas', 'stamp']" icon-variant="muted" action="damage") 案件領狀管控
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧管控系統'
  },
  // async asyncData(nuxt) {
  //   // SSR: returned object will replace the data inside "data" before rendering
  // },
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
.container {
  margin-top: -60px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.fixed-title-height {
  height: 45vh;
}

.b-card-container {
	display: flex;
	flex-wrap: wrap;
  height: 40vh;
  align-content: flex-start;
  margin-bottom: 1rem;
  .b-card-group {
    height: 45%;
  }
}
</style>
