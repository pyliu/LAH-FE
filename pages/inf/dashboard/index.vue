<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.align-items-center.w-100
        .d-flex.align-items-center
          .my-auto 智慧監控儀表板
          lah-button(
            v-b-modal.help-modal,
            icon="info",
            variant="outline-success",
            no-border,
            no-icon-gutter,
            title="說明"
          )

        //- .d-flex.align-items-center
        //-   b-checkbox.mr-1.mt-2(
        //-     v-model="col2",
        //-     switch,
        //-     size="lg"
        //-   ) 2欄顯示
        //-   .mr-1 🔴 {{ red }}
        //-   .mr-1 🟡 {{ yellow }}
        //-   .mr-1 🟢 {{ green }}
        //-   b-button-group(size="lg")
        //-     lah-button.mx-1(
        //-       @click="$refs.setupModal.show()",
        //-       icon="cog",
        //-       variant="outline-secondary",
        //-       action="clock",
        //-       no-border,
        //-       no-icon-gutter,
        //-       title="設定EMAIL伺服器"
        //-     )
    //- lah-monitor-board-setup-modal(ref="setupModal")
    lah-help-modal(:modal-id="'help-modal'", size="md")
      ul
        li 提供顯示桃園所及其他所的儀表板
          ul
            li 桃園所-有額外提供本所專屬的伺服器服務狀態監控
            li 其他所-各所共通型項目監控
        li 主要以電子郵件分析為監控方式，部分儀表板須搭配智慧監控API才能正常顯示

  .container: .anim-appear-1s
    section.fixed-title-height.center: div
      lah-logo-monitoring.mvh-40
      h3.title.lah-shadow.text-nowrap 智慧監控儀表板
    section.b-card-container.center
      b-card-group(deck)
        lah-index-card-link.fix-card-dimension(:icon="['fab', 'watchman-monitoring']" to="/inf/dashboard/HA") 桃園所
        lah-index-card-link.fix-card-dimension(:icon="['fas', 'tv']" to="/inf/dashboard/HX") {{ isHA ? '其他所' : siteName }}

</template>

<script>
export default {
  // middleware: ['isInf'], // authority control
  head: {
    title: '智慧監控儀表板-桃園市地政局'
  }
}
</script>

<style lang="scss">
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

.mvh-40 {
  max-height: 40vh;
}
</style>
