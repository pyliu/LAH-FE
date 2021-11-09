<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.w-100
        .d-flex.mr-auto
          lah-button(
            :icon="icon"
            :badgeText="queryCount.toString()"
            :variant="switchButtonVariant"
            :disabled="isBusy"
            :busy="isBusy"
            @click="isOverdueMode = !isOverdueMode"
            size="lg"
            title="按我切換模式"
          )
            strong {{ queryTitle }}
          lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'"): .h6.text-nowrap: ul
            li
              .d-flex
                .my-auto 請使用
                lah-button.mx-2(
                  :icon="icon"
                  :badgeText="queryCount.toString()"
                  :variant="switchButtonVariant"
                  :disabled="isBusy"
                  :busy="isBusy"
                  @click="isOverdueMode = !isOverdueMode"
                  title="按我切換模式"
                )
                  strong {{ queryTitle }}
                .my-auto 切換顯示模式
            li 預定結案時間剩餘4小時內將判定為即將逾期案件
            li #[a(:href="`${this.legacyUrl}/overdue_reg_cases.html`" target="_blank" rel="noreferrer noopener") 切換成舊版本模式]
        //- a.small.my-auto.mr-1(:href="`${this.legacyUrl}/overdue_reg_cases.html`" target="_blank" rel="noreferrer noopener") 舊版本
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          auto-start
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :milliseconds="900000"
          :disabled="isBusy"
          :busy="isBusy"
          @end="$fetch"
          @click="reload"
        )
    lah-transition(fade)
      lah-expiry-b-table(:busy="!committed")
    lah-transition.center.h3
      lah-fa-icon(
        v-cloak
        v-if="queryCount === 0 && committed"
        icon="exclamation-circle"
        prefix="fas"
      ) 無資料
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  // middleware: [ 'expireAuth' ],
  mixins: [expiryBase],
  data: () => ({
    // hostname: location.toString()
  }),
  head: {
    title: '即將(已)逾期案件-桃園市地政局'
  },
  computed: {
    icon () { return this.isOverdueMode ? 'exclamation-triangle' : 'exclamation-circle' }
  }
}
</script>

<style lang="scss" scoped>
</style>
