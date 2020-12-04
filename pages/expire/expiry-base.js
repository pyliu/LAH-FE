export default {
  name: 'expiryBase',
  fetchOnServer: false,
  data: () => ({
    queriedJson: undefined,
    isOverdueMode: false,
    milliseconds: 15 * 60 * 1000,
    committed: false
  }),
  computed: {
    cacheKey () { return this.isOverdueMode ? `already-expired-all` : `about-to-expire-all` },
    badgeVariant () { return this.isOverdueMode ? 'danger' : 'warning' },
    queryType () { return this.isOverdueMode ? 'overdue_reg_cases' : 'almost_overdue_reg_cases' },
    queryTitle () {
      if (this.isBusy) {
        return '讀取中'
      }
      return this.isOverdueMode ? '已逾期案件' : '即將逾期案件'
    },
    queryCount () {
      if (this.isBusy) {
        return '-'
      }
      return this.queriedJson && this.queriedJson.items ? this.queriedJson.items.length : 0
    },
    queryCountById () {
      if (this.reviewerId) {
        if (this.isBusy) {
          return '-'
        }
        return this.queriedJson && this.queriedJson.items_by_id[this.reviewerId] ? this.queriedJson.items_by_id[this.reviewerId].length : 0
      }
      return '-'
    },
    switchButtonVariant () { return this.isOverdueMode ? 'danger' : 'warning' }
  },
  watch: {
    isOverdueMode (val) {
      this.$store.commit('expiry/is_overdue_mode', val)
      this.$fetch()
    }
  },
  methods: {
    commit (json) {
      if (!this.committed) {
        this.queriedJson = json
        this.$store.commit('expiry/list', this.queriedJson.items || [])
        this.$store.commit('expiry/list_by_id', this.queriedJson.items_by_id || {})
        this.committed = true
        if (this.$refs.countdown) {
          this.getCacheExpireRemainingTime(this.cacheKey).then(
            remain_ms => {
              this.$refs.countdown.setCountdown(remain_ms)
              this.$refs.countdown.startCountdown()
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remain_ms / 1000).toFixed(1)} 秒後到期。`)
            }
          )
        }
      }
    },
    reload() {
      this.removeCache(this.cacheKey).then(() => { this.$fetch() })
    }
  },
  created () {
    this.isOverdueMode = this.$store.getters['expiry/is_overdue_mode']
  },
  async fetch () {
    this.committed = false
    this.getCache(this.cacheKey).then(jsonObj => {
      if (jsonObj === false) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: this.queryType
          // always get all results and cache it at FE
          // reviewer_id: this.reviewerId || ''
        }).then(res => {
          this.setCache(this.cacheKey, res.data, this.milliseconds) // expired after 15 mins
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
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        // cache hit!
        this.commit(jsonObj)
      }
    })
  }
}
