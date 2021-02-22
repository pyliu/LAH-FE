<template lang="pug">
  .h-100
    lah-header
    .container: div
      section.fixed-title-height.center: .anim-appear-1s
        lah-logo
        h3.title.lah-shadow.text-nowrap 桃園市地政智慧管控系統
      section.b-card-container.anim-appear-1s
        b-card-group.mb-4(deck)
          lah-index-card-link(:icon="['far', 'calendar-check']" to="/expire") 即將逾期案件
          lah-index-card-link(:icon="['far', 'sticky-note']" to="/expiry-of-announcement") 公告期滿案件
          lah-index-card-link(:icon="['fas', 'user-tie']" to="/ask-for-instructions") 取消請示案件
          lah-index-card-link(:icon="['fas', 'money-check-alt']" to="/trust-case") 信託案件
          lah-index-card-link(:icon="['fas', 'user-tag']" to="/non-scrivener-case") 非專業代理人案件
          lah-index-card-link(:icon="['fas', 'user-astronaut']" to="/foreigner-case") 外人地權案件
        b-card-group(deck)
          //- lah-index-card-link(:icon="['fas', 'border-all']" to="/agriculture-375-change") 三七五租約異動
          lah-index-card-link(icon-variant="muted" action="damage") 三七五租約異動
          lah-index-card-link(icon-variant="muted" action="damage") 未辦標的註記異動
          lah-index-card-link(icon-variant="muted" action="damage") 參考資訊檔異動
          lah-index-card-link(icon-variant="muted" action="damage") 逾期未駁回查詢
          lah-index-card-link(icon-variant="muted" action="damage") 辦畢通知查詢
          lah-index-card-link(icon-variant="muted" action="damage") 領狀管控查詢
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧管控系統'
  },
  async asyncData(nuxt) {
    // SSR: returned object will replace the data inside "data" before rendering
  },
  mounted () {
    const ua = window.navigator.userAgent
    if (ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0) {
      document.body.innerHTML = `<h1 style="color: red; text-align: center; font-weight: bold; margin-top: 5rem;">不支援IE瀏覽器，建議使用最新版本 Firefox 或 Chrome。</h1>`
      alert('不支援IE瀏覽器，建議使用最新版本 Firefox 或 Chrome。')
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

.grids {
	display: flex;
	flex-wrap: wrap;
	width: 100%;
  height: 40vh;
  align-content: flex-start;
  .grid-6col-2row {
    width: 15.5%;
    height: 48%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: auto;
    border-radius: 10px;
    border: 1px solid gray;
    margin: 0.5%;
  }
}
</style>
