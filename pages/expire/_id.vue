<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header padding-override">
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
          :end="load"
          :click="reload"
          :disabled="isBusy"
          :busy="isBusy"
          auto-start
          title="立即重新讀取"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition fade>
      <lah-expiry-b-table :busy="!committed"></lah-expiry-b-table>
    </lah-transition>
  </div>
</template>

<script>
import expiryBase from '~/assets/js/expiry-base.js'
export default {
  head: {
    title: "初審即將逾期案件-桃園市地政局"
  },
  mixins: [expiryBase],
  computed: {
    reviewerId () { return this.$route.params.id ? (this.$route.params.id.split(' ')[1].replace(/[^a-zA-Z0-9]/g, '') || '') : '' },
    reviewerName () { return this.$route.params.id ? (this.$route.params.id.split(' ')[0] || '') : '' },
    cacheKey () { return this.isOverdueMode ? `already-expired${this.reviewerId}` : `about-to-expire${this.reviewerId}` },
    queryTitle () {
      if (this.isBusy) {
        return '讀取中...'
      }
      return (this.isOverdueMode ? `已逾期案件` : `即將逾期案件`) + `(${this.reviewerName} ${this.reviewerId})`
    }
  }
}
</script>

<style lang="scss" scoped>
.padding-override {
  padding: 10px 4rem;
}
</style>
