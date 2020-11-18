<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between header">
        <lah-button
          icon="calendar-check"
          size="lg"
          title="按我切換模式"
          :badgeText="queryCount.toString()"
          :variant="switchButtonVariant"
          @click="isOverdueMode = !isOverdueMode"
          :disabled="isBusy"
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
          auto-start
          title="立即重新讀取"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition fade>
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
    isOverdueMode: undefined,
    reviewerID: '',
    milliseconds: 15 * 60 * 1000,
    committed: false
  }),
  computed: {
    cacheKey () { return this.isOverdueMode ? `already-expired` : `about-to-expire` },
    badgeVariant () { return this.isOverdueMode ? 'danger' : 'warning' },
    queryType () { return this.isOverdueMode ? 'overdue_reg_cases' : 'almost_overdue_reg_cases' },
    queryTitle () { return this.isOverdueMode ? '已逾期案件' : '即將逾期案件' },
    queryCount () { return this.queriedJson && this.queriedJson.items ? this.queriedJson.items.length : 0 },
    switchButtonVariant () { return this.isOverdueMode ? 'danger' : 'warning' }
  },
  watch: {
    isOverdueMode (val) {
      this.$store.commit('expiry/is_overdue_mode', val)
      this.load()
    }
  },
  methods: {
    commit (json) {
      this.queriedJson = json
      this.$store.commit('expiry/list', this.queriedJson.items || [])
      this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
      this.committed = true
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then(
          remain_ms => {
            this.$refs.countdown.setCountdown(remain_ms + 1000)
            // this.$warn(`${this.cacheKey} 快取資料將在 ${(remain_ms / 1000).toFixed(1)} 秒後到期。`)
          }
        ).finally(() => {
          this.$refs.countdown.startCountdown()
        }) 
      }
    },
    reload() {
      this.removeCache(this.cacheKey).then(() => { this.load() })
    },
    load () {
      this.getCache(this.cacheKey).then(jsonObj => {
        if (jsonObj === false) {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: this.queryType,
            reviewer_id: this.reviewerID
          }).then(res => {
            this.setCache(this.cacheKey, res.data, this.milliseconds - 1000) // expired after 14 mins 59 secs
            console.assert(
              res.data.status == this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL ||
              res.data.status == this.$consts.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD,
              `查詢登記案件回傳狀態碼有問題【${this.queryTitle}, ${res.data.status}】`
            )
            if (
              res.data.status != this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL &&
              res.data.status != this.$consts.XHR_STATUS_CODE.SUCCESS_WITH_NO_RECORD
            ) {
              this.removeCache(this.cacheKey)
            }
            if (this.$refs.countdown) {
              this.$refs.countdown.resetCountdown()
            }
            this.commit(res.data)
          }).catch(err => {
            this.alert(err.message)
            this.$error(err)
          }).finally(() => {
            this.isBusy = false
          })
        } else {
          // cache hit!
          this.commit(jsonObj)
        }
      })
    }
  },
  created () {
    this.isOverdueMode = false
    this.load()
  }
}
</script>

<style lang="scss" scoped>
.header {
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display:block;
  padding: 10px 4rem;
}
</style>
