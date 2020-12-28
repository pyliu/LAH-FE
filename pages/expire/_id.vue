<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header padding-override">
        <lah-button
          icon="calendar-check"
          size="lg"
          title="按我切換模式"
          :badgeText="queryCountById.toString()"
          :variant="switchButtonVariant"
          @click="isOverdueMode = !isOverdueMode"
          :disabled="isBusy"
          :busy="isBusy"
        >
          <strong>{{queryTitle}}</strong>
        </lah-button>
        <b-link to="/expire" class="small my-auto"><lah-fa-icon icon="arrow-alt-circle-left" prefix="far">回全部列表</lah-fa-icon></b-link>
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
          variant="outline-secondary"
          badge-variant="secondary"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition fade>
      <lah-expiry-b-table :busy="isBusy" :reviewer-id="reviewerId" :max-height="maxHeight"></lah-expiry-b-table>
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon v-cloak v-if="queryCountById === 0 && committed" icon="exclamation-circle" prefix="fas"> 無資料</lah-fa-icon>
    </lah-transition>
  </div>
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  head: {
    title: "初審即將逾期案件-桃園市地政局"
  },
  mixins: [expiryBase],
  data: () => ({
    maxHeight: 300
  }),
  computed: {
    nameId () {
      if (this.$route.params.id) {
        const array = this.$route.params.id.toUpperCase().split(' ')
        if (array.length === 1) {
          array.unshift('')
        }
        return array
      }
      return ['', '']
    },
    reviewerId () { return this.nameId[1].replace(/[^a-zA-Z0-9]/g, '') },
    reviewerName () { return this.nameId[0] },
    queryTitle () {
      if (this.isBusy) {
        return '讀取中...'
      }
      return (this.isOverdueMode ? `已逾期案件` : `即將逾期案件`) + '(' + this.$utils.trim(`${this.reviewerName} ${this.reviewerId}`) + ')'
    }
  },
  watch: {
    committed (flag) {
      this.isBusy = !flag
    }
  },
  mounted () {
    this.maxHeight = window.innerHeight - 100
  }
}
</script>

<style lang="scss" scoped>
.padding-override {
  padding: 10px 4rem;
}
</style>
