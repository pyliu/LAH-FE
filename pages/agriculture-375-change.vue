<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <lah-fa-icon icon="border-all" variant="secondary" append class="my-auto">三七五租約標的異動</lah-fa-icon>
          <div class="d-flex">
            <div>
              <lah-countdown-button
                ref="countdown"
                icon="sync-alt"
                action="ld-cycle"
                size="lg"
                :milliseconds="cachedMs"
                @end="reload"
                @click="reload"
                :disabled="isBusy"
                :busy="isBusy"
                auto-start
                end-attention
                title="立即重新讀取"
                variant="outline-secondary"
                badge-variant="secondary"
                class="mr-2"
                no-badge
              />
            </div>
          </div>
        </div>
      </lah-transition>
    </lah-header>
    <div class="container">
      <div>
        <Logo class="anim-appear-2s" />
        <h3 class="title">
          樣板
        </h3>
        <div>
          some text goes here ...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: '樣板頁面-桃園市地政局'
  },
  data: () => ({
    cachedMs: 12 * 60 * 60 * 1000
  }),
  methods: {
    reload () {
      
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
