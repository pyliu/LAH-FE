<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
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
            <lah-button icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'">
              <div class="h5 text-nowrap">
                <lah-fa-icon icon="lightbulb" regular variant="warning" class="d-flex">
                  <span class="my-auto mr-1">請使用</span>
                  <lah-button
                    icon="calendar-check"
                    title="按我切換模式"
                    :badgeText="queryCountById.toString()"
                    :variant="switchButtonVariant"
                    @click="isOverdueMode = !isOverdueMode"
                    :disabled="isBusy"
                    :busy="isBusy"
                  >
                    <strong>{{queryTitle}}</strong>
                  </lah-button>
                  <span class="my-auto nl-1">切換顯示模式</span>
                </lah-fa-icon>
              </div>
            </lah-help-modal>
          </div>
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
        </div>
      </lah-transition>
    </lah-header>
    <lah-transition fade>
      <lah-expiry-b-table :busy="isBusy" :reviewer-id="reviewerId" :max-height="maxHeight"></lah-expiry-b-table>
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon v-cloak v-if="queryCountById === 0 && committed" icon="exclamation-circle" prefix="fas"> 無資料</lah-fa-icon>
    </lah-transition>
  </div>
</template>

<script>
import lahHeader from '~/components/lah-header.vue'
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  components: { lahHeader },
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
</style>
