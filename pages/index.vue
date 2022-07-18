<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo
      h3.title.lah-shadow.text-nowrap 桃園市地政智慧控管系統
    section.b-card-container
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(v-if="isSur", :icon="['far', 'calendar-alt']" to="/expire/sur") 測量逾期#[br]案件
        lah-index-card-link.fix-card-dimension(v-else,:icon="['far', 'calendar-check']" to="/expire") 即將逾期#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-tie']" to="/ask-for-instructions") 取消請示#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'pager']" to="/reg-fix-case") 補正期滿#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['far', 'sticky-note']" to="/expiry-of-announcement") 公告案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'stamp']" to="/reg-untaken-case") 領件管控
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'bullhorn']" to="/reg-not-done-case") 辦畢通知#[br]案件
      b-card-group.my-4(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'money-check-alt']" to="/trust") 信託相關#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'monument']" to="/not-done-change") 未辦繼承標的註記異動
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'landmark']" to="/land-ref-change") 土地參考資訊檔異動
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'border-all']" to="/agriculture-375-change") 375租約異動案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-astronaut']" to="/foreigner-case") 外人地權#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-tag']" to="/non-scrivener-case") 非專業代理人案件
  .version v{{ $config.pkgVersion }}
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧控管系統'
  },
  computed: {
    isSur () { return this.myinfo.unit === '測量課' }
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

.fix-card-dimension {
  width: 156px;
  height: 156px;
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
.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
