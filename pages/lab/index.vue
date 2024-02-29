<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-lab.mvh
      h3.title.lah-shadow.text-nowrap 地政資訊實驗室
    section.b-card-container
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(
          v-if="isAdm || isInf || authority.isAdmin",
          :icon="['fas', 'file-contract']",
          to="/adm/file"
        ) 檔案應用預約申請
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'chart-line']" to="/reg/stats") 分時案件統計
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'calculator']" to="/reg/stats/monthly") 案件統計資訊
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'heart-pulse']" to="/inf/xap/broken_cached") 全國地所伺服器監控
        lah-index-card-link.fix-card-dimension(
          :icon="['fas', 'tv']",
          to="/inf/xap/xbroken_display"
        ) 跨域ONLINE即時通
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'comment-sms']" to="/reg/sms") 簡訊紀錄查詢
        //- lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧控管系統實驗室'
  }
}
</script>

<style lang="scss" scoped>
.container {
  margin-top: -40px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.fixed-title-height {
  height: 40vh;
}

.fix-card-dimension {
  width: 156px;
  height: 156px;
}

.b-card-container {
  display: flex;
  flex-wrap: wrap;
  height: 35vh;
  align-content: flex-start;
  margin-top: 2rem;
  margin-bottom: 1rem;
  .b-card-group {
    height: 45%;
  }
}
.mvh {
  max-height: 35vh;
}
</style>
