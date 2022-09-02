<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-monitoring
      h3.title.lah-shadow.text-nowrap 地政資訊智慧監控系統
    section.b-card-container
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'person-chalkboard']" to="/inf/mgt") 系統管理面板
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'traffic-light']" to="/inf/dashboard") 監控儀錶板
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'server']" to="/inf/xap") 跨域伺服器監控
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'database']" to="/inf/lxhweb") 同步異動監控
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'network-wired']" to="/admin/ip") IP對應表管理
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'people-roof']" to="/admin/users") 使用者管理
        //- lah-index-card-link.fix-card-dimension(:icon="['fas', 'tasks']" to="/admin/configs") 系統參數設定
  .version v{{ $config.pkgVersion }}
</template>

<script>
export default {
  middleware: ['isAdmin'],
  head: {
    title: '桃園市地政智慧監控系統'
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
.version {
  font-weight: 900;
  position: absolute;
  right: 10px;
  bottom: 10px;
}
</style>
