<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-monitoring.mvh-50
      h3.title.lah-shadow.text-nowrap 地政資訊系統監控
    section.b-card-container
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'person-chalkboard']" to="/inf/mgt") 系統管理面板
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'desktop']" :to="isHA ? '/inf/dashboard/HA' : '/inf/dashboard/HX'") {{ siteName }}監控儀表板
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'arrows-spin']" to="/inf/dashboard/carousel") 輪播儀表板
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'server']" to="/inf/xap") 跨域伺服器監控
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'database']" to="/inf/lxhweb") 同步異動監控
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'wave-square']" to="/inf/xap/connectivity") 即時全國跨域主機監控
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'people-roof']" to="/admin/users") 使用者管理
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'tasks']" to="/admin/configs") 系統參數設定
</template>

<script>
export default {
  middleware: ['isInf'],
  head: {
    title: '桃園市地政資訊系統監控'
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
  // height: 20vh;
  align-content: flex-start;
  margin-bottom: 1rem;
  margin-top: 5rem;
  // .b-card-group {
  //   height: 45%;
  // }
}

.mvh-50 {
  max-height: 50vh;
}

.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
