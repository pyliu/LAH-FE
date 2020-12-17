<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">請示未結案件</div>
        <lah-countdown-button
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :end="reload"
          :click="reload"
          :disabled="isBusy"
          :busy="isBusy"
          auto-start
          title="立即重新讀取"
        />
      </h3>
    </lah-transition>
    <lah-transition appear>
      <lah-reg-b-table
        v-if="queryCount > 0"
        :baked-data="bakedData"
        :fields="fields"
        :max-height="maxHeight"
      />
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon
        v-cloak
        v-if="queryCount === 0 && !isBusy"
        icon="exclamation-circle"
        prefix="fas"
      >
        無資料
      </lah-fa-icon>
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: "請示未結案件-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 60 * 60 * 1000,
    forceReload: false,
    fields: [
      {
        key: "燈號",
        sortable: true,
      },
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "登記原因",
        sortable: true,
      },
      {
        key: "辦理情形",
        sortable: true,
      },
      {
        key: "初審人員",
        sortable: true,
      },
      {
        key: "請示日期",
        sortable: true,
      },
      {
        key: "預定結案日期",
        sortable: true,
      },
    ],
    maxHeight: 300
  }),
  computed: {
    queryCount() { return this.bakedData.length },
    cacheKey() { return `reg_cancel_ask_case` },
  },
  watch: {
    bakedData(val) {
      // this.$utils.log(val)
    },
  },
  fetch() {
    this.getCache(this.cacheKey).then((json) => {
      if (json === false) {
        this.isBusy = true
        this.$axios
          .post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_cancel_ask_case',
            reload: this.forceReload
          })
          .then((res) => {
            this.bakedData = res.data.baked || []
            this.notify(res.data.message)
            const remain_ms = res.data.cache_remaining_time
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, res.data, remain_ms)
              // use server side cache remaining time
              this.$refs.countdown.setCountdown(remain_ms * 1000)
            } else {
              this.$refs.countdown.setCountdown(this.cachedMs)
            }
            this.$refs.countdown.startCountdown()
          })
          .catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          })
          .finally(() => {
            this.isBusy = false
            this.forceReload = false
          })
      } else {
        this.bakedData = json.baked || []
        this.resetCountdown()
      }
    })
  },
  methods: {
    resetCountdown() {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then((remain_ms) => {
          if (remain_ms > 0) {
            this.$refs.countdown.setCountdown(remain_ms)
            this.$refs.countdown.startCountdown()
            this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remain_ms / 1000).toFixed(1)} 秒後到期。`)
          }
        })
      }
    },
    reload() {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    },
  },
  mounted () {
    this.maxHeight = window.innerHeight - 100
  }
}
</script>

<style lang="scss" scoped>
</style>
