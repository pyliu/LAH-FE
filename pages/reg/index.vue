<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo.mvh
      .title.lah-shadow.text-nowrap 桃園市地政智慧控管系統
    section.b-card-container
      b-card-group(deck)
        //- lah-index-card-link.fix-card-dimension(v-if="isSur", :icon="['far', 'calendar-alt']" to="/reg/reg/expire/sur") 測量逾期#[br]案件
        //- lah-index-card-link.fix-card-dimension(v-else-if="isVal", :icon="['fas', 'receipt']" to="/prc/realprice") 實價登錄#[br]案件控管
        lah-index-card-link.fix-card-dimension(:icon="['far', 'calendar-check']" to="/reg/expire") 即將逾期#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-tie']" to="/reg/ask-for-instructions") 取消請示#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'pager']" to="/reg/reg-fix-case") 補正期滿#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['far', 'sticky-note']" to="/reg/expiry-of-announcement") 公告案件#[br]控管
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'stamp']" to="/reg/reg-untaken-case") 領件控管
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'bullhorn']" to="/reg/reg-not-done-case") 辦畢通知#[br]案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'earth-asia']" to="/reg/foreigner-inheritance-restriction") 外人繼承管制清冊
      b-card-group.my-4(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'money-check-alt']" to="/reg/trust") 信託相關案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'monument']" to="/reg/not-done-change") 未辦標的註記異動
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'landmark']" to="/reg/land-ref-change") 土地參考資訊檔異動
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'border-all']" to="/reg/agriculture-375-change") 375租約異動
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-tag']" to="/reg/non-scrivener-case") 非專業代理人案件
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'user-astronaut']" to="/reg/foreigner-case") 外國人地權案件
        lah-index-card-link.fix-card-dimension(:icon="['far', 'file-pdf']" to="/reg/foreigner") 外國人掃描資料
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(
          :icon="['fas', 'house-circle-check']",
          href="http://220.1.33.80/PcQ.aspx",
          target="_blank"
        ) 私法人購置住宅
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'comment-sms']" to="/reg/sms") 簡訊紀錄查詢
        lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'calculator']" to="/reg/stats/monthly") 案件統計資訊
        lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧控管系統'
  },
  computed: {
    isSur () { return this.myinfo.unit === '測量課' },
    isVal () { return this.myinfo.unit === '地價課' }
  }
}
</script>

<style lang="scss" scoped>
.container {
  margin-top: -80px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.fixed-title-height {
  height: 35vh;
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
.mvh {
  max-height: 30vh;
}
</style>
