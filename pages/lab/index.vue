<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-lab.mvh-40
      h3.title.lah-shadow.text-nowrap 地政資訊實驗室
    section.b-card-container
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'chart-line']" to="/reg/stats") 分時案件統計
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'calculator']" to="/reg/stats/monthly") 案件統計資訊
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'heart-pulse']" to="/inf/xap/broken_cached") 全國地所伺服器監控
        //- lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        //- lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        //- lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
        //- lah-index-card-link.fix-card-dimension.invisible(:icon="['fas', 'times']" to="/reg/") ...
  .version v{{ $config.pkgVersion }}
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧控管系統實驗室'
  },
  computed: {
    isSur () { return this.myinfo.unit === '測量課' },
    isVal () { return this.myinfo.unit === '地價課' }
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

.mvh-40 {
  max-height: 35vh;
}

.version {
  font-weight: 900;
  position: fixed;
  right: 10px;
  bottom: 10px;
}
</style>
