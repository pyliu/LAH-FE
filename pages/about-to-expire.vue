<template>
  <div>
    <lah-transition appear speed="quick">
      <h3 class="text-center mt-2 mb-3 pt-1 text-nowrap font-weight-bold">
        <font-awesome-icon
          :icon="['far', 'calendar-check']"
          size="lg"
          class="mx-auto my-auto"
        ></font-awesome-icon>
        即將逾期案件
        <b-badge v-if="queryCount > 0" :variant="badgeVariant" pill>{{queryCount}}</b-badge>
        <lah-countdown-button
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          :milliseconds="900000"
          :end="load"
          :click="reload"
          :disabled="isBusy"
          auto-start
          title="立即重新讀取"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition appear speed="quick">
      <lah-expiry-b-table v-if="committed"></lah-expiry-b-table>
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: "即將逾期案件-桃園市地政局"
  },
  data: () => ({
    queriedJson: undefined,
    mode: ``,
    reviewerID: '',
    milliseconds: 15 * 60 * 1000,
    committed: false
  }),
  computed: {
    cacheKey () { return this.isOverdueMode ? `already-expired` : `about-to-expire` },
    isOverdueMode () { return this.mode === 'overdue' },
    badgeVariant () { return this.isOverdueMode ? 'danger' : 'warning' },
    queryType () { return this.isOverdueMode ? 'overdue_reg_cases' : 'almost_overdue_reg_cases' },
    queryTitle () { return this.isOverdueMode ? '已逾期模式' : '快逾期模式' },
    queryCount () { return this.queriedJson && this.queriedJson.items ? this.queriedJson.items.length : 0 }
  },
  watch: {
    mode (val) { this.$store.commit('expiry/is_overdue_mode', this.isOverdueMode) }
  },
  methods: {
    commit (json) {
      this.queriedJson = json
      this.$store.commit('expiry/list', this.queriedJson.items || [])
      this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
      this.committed = true
    },
    reload() {
      this.removeCache(this.cacheKey).then(() => { this.load() })
    },
    load () {
      this.getCache(this.cacheKey).then(jsonObj => {
        if (jsonObj === false) {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.API.JSON.QUERY, {
            type: this.queryType,
            reviewer_id: this.reviewerID
          }).then(res => {
            this.setCache(this.cacheKey, res.data, this.milliseconds - 1000) // expired after 14 mins 59 secs
            console.assert(
              res.data.status == this.XHR_STATUS_CODE.SUCCESS_NORMAL ||
              res.data.status == this.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD,
              `查詢登記案件回傳狀態碼有問題【${this.queryTitle}, ${res.data.status}】`
            )
            if (
              res.data.status != this.XHR_STATUS_CODE.SUCCESS_NORMAL &&
              res.data.status != this.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD
            ) {
              this.removeCache(this.cacheKey)
            }
            this.commit(res.data)
            if (this.$refs.countdown) {
              this.$refs.countdown.resetCountdown()
              this.$refs.countdown.startCountdown()
            }
          }).catch(err => {
            this.alert(err.message)
            this.$error(err)
          }).finally(() => {
            this.isBusy = false
          })
        } else {
          // cache hit!
          this.commit(jsonObj)
            if (this.$refs.countdown) {
              this.getCacheExpireRemainingTime(this.cacheKey).then(
                remain_ms => {
                  this.$refs.countdown.setCountdown(remain_ms + 1000)
                  // this.caption = `${jsonObj.data_count} 件，更新時間: ${new Date(
                  //   +new Date() - this.milliseconds + remain_ms - 5000
                  // )}`
                  this.$warn(
                    `快取資料將在 ${(remain_ms / 1000).toFixed(
                      1
                    )} 秒後到期。`
                  )
                }
              )
            }
        }
      })
    }
  },
  created () {
    this.mode = 'almost_overdue'
    this.load()
  }
}
</script>

<style></style>
