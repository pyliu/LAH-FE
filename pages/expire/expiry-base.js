export default {
  name: 'expiryBase',
  fetchOnServer: false,
  data: () => ({
    queriedJson: undefined,
    isOverdueMode: false,
    forceReload: false,
    milliseconds: 15 * 60 * 1000,
    committed: false
  }),
  computed: {
    cacheKey () { return this.isOverdueMode ? 'already-expired-all' : 'about-to-expire-all' },
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
            (remainMs) => {
              this.$refs.countdown.setCountdown(remainMs)
              this.$refs.countdown.startCountdown()
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remainMs / 1000).toFixed(1)} 秒後到期。`)
            }
          )
        }
      }
    },
    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    }
  },
  created () {
    this.isOverdueMode = this.$store.getters['expiry/is_overdue_mode']
  },
  fetch () {
    this.committed = false
    this.getCache(this.cacheKey).then((jsonObj) => {
      if (jsonObj === false) {
        this.isBusy = true
        // always get all results and cache it at FE
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: this.queryType,
          reload: this.forceReload
        }).then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            const serverCacheTime = data.cache_remaining_time * 1000
            if (this.setCache(this.cacheKey, data, serverCacheTime)) {
              this.commit(data)
            }
          } else {
            this.removeCache(this.cacheKey)
            this.warning(data.message)
          }
        }).catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
          this.forceReload = false
        })
      } else {
        // cache hit!
        this.commit(jsonObj)
      }
    })
  }
}
