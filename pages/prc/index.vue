<template lang="pug">
.h-100
  lah-header
  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-val.mvh-50
      h3.title.lah-shadow.text-nowrap 地政地價小幫手
    section.b-card-container
      //- b-card-group(deck)
      .d-flex.mx-auto
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'receipt']" to="/prc/realprice") 實價登錄#[br]案件控管
        lah-index-card-link.fix-card-dimension.ml-3(:icon="['fas', 'file-import']" to="/prc/json-converter") 實價登錄#[br]JSON解析
</template>

<script>
export default {
  head: {
    title: '桃園市地政地價小幫手'
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
