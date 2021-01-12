<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <lah-button
              :icon="icon"
              :badgeText="queryCount.toString()"
              :variant="switchButtonVariant"
              :disabled="isBusy"
              :busy="isBusy"
              @click="isOverdueMode = !isOverdueMode"
              size="lg"
              title="按我切換模式"
            >
              <strong>{{queryTitle}}</strong>
            </lah-button>
            <lah-button icon="question" action="bounce" variant="outline-success" no-border @click="modalById('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'">
              <div class="h5">
                <lah-fa-icon icon="lightbulb" regular variant="warning" class="d-flex">
                  請使用
                  <lah-button
                    :icon="icon"
                    :badgeText="queryCount.toString()"
                    :variant="switchButtonVariant"
                    :disabled="isBusy"
                    :busy="isBusy"
                    @click="isOverdueMode = !isOverdueMode"
                    title="按我切換模式"
                    class="mx-2"
                  >
                    <strong>{{queryTitle}}</strong>
                  </lah-button>
                  切換 逾期/即將逾期 模式</lah-fa-icon>
              </div>
            </lah-help-modal>
          </div>
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
import lahFaIcon from '~/components/lah-fa-icon.vue'
import expiryBase from '~/pages/expire/expiry-base.js'
export default {
  components: { lahFaIcon },
  head: {
    title: "即將逾期案件-桃園市地政局"
  },
  mixins: [expiryBase],
  data: () => ({
    maxHeight: 300
  }),
  computed: {
    icon () { return this.isOverdueMode ? 'exclamation-triangle' : 'exclamation-circle' }
  },
  mounted () {
    this.maxHeight = window.innerHeight - 100
  }
}
</script>

<style lang="scss" scoped>
</style>
