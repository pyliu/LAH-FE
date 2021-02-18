<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          lah-button(
            icon="calendar-check"
            size="lg"
            title="按我切換模式"
            :badgeText="queryCountById.toString()"
            :variant="switchButtonVariant"
            :disabled="isBusy"
            :busy="isBusy"
            @click="isOverdueMode = !isOverdueMode"
          ): strong {{ queryTitle }}
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            .h5.text-nowrap
              lah-fa-icon.d-flex(icon="lightbulb" regular variant="warning")
                span.my-auto.mr-1 請使用
                lah-button(
                  icon="calendar-check"
                  title="按我切換模式"
                  :badgeText="queryCountById.toString()"
                  :variant="switchButtonVariant"
                  @click="isOverdueMode = !isOverdueMode"
                  :disabled="isBusy"
                  :busy="isBusy"
                ): strong {{ queryTitle }}
                span.my-auto.nl-1 切換顯示模式
        b-link.small.my-auto(v-if="isAuthorized" to="/expire"): lah-fa-icon(icon="arrow-alt-circle-left" prefix="far") 回全部列表
        lah-countdown-button(
          auto-start
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :milliseconds="900000"
          :disabled="isBusy"
          :busy="isBusy"
          @end="$fetch"
          @click="reload"
        )
    lah-transition(fade): lah-expiry-b-table(:busy="isBusy" :reviewer-id="reviewerId")
    lah-transition.center.h3: lah-fa-icon(v-cloak v-if="queryCountById === 0 && committed" icon="exclamation-circle" prefix="fas") 無資料
</template>

<script>
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  head: {
    title: "初審即將逾期案件-桃園市地政局"
  },
  mixins: [expiryBase],
  computed: {
    isAuthorized () {
      return this.authority.isChief || this.authority.isAdmin || this.authority.isSuper
    },
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
  created () {
    if (this.myinfo.id !== this.reviewerId && !this.isAuthorized) {
      this.$store.commit('lastMessage', `僅有 ${this.reviewerId} 可瀏覽 ${this.$route.path} 頁面。`)
      this.$router.push('/error')
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
