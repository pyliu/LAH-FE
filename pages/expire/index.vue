<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <lah-button
          icon="calendar-check"
          size="lg"
          title="按我切換模式"
          :badgeText="queryCount.toString()"
          :variant="switchButtonVariant"
          @click="isOverdueMode = !isOverdueMode"
          :disabled="isBusy"
          :busy="isBusy"
        >
          <strong>{{queryTitle}}</strong>
        </lah-button>
        <lah-countdown-button
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="900000"
          @end="$fetch"
          @click="reload"
          :disabled="isBusy"
          :busy="isBusy"
          auto-start
          title="立即重新讀取"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition fade>
      <lah-expiry-b-table :busy="!committed" :max-height="maxHeight"></lah-expiry-b-table>
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon
        v-cloak
        v-if="queryCount === 0 && committed" 
        icon="exclamation-circle"
        prefix="fas"
      >
        無資料
      </lah-fa-icon>
    </lah-transition>
  </div>
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  head: {
    title: "即將逾期案件-桃園市地政局"
  },
  mixins: [expiryBase],
  data: () => ({
    maxHeight: 300
  }),
  mounted () {
    this.maxHeight = window.innerHeight - 100
  }
}
</script>

<style lang="scss" scoped>
</style>
