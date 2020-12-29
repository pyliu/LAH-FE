<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header">
        <div class="my-auto">
          <lah-fa-icon icon="user-astronaut" variant="secondary" append>外國人地權案件</lah-fa-icon>
        </div>
        <div class="d-flex">
          <b-input-group size="sm" class="vw-50">
            <template #prepend>
              <b-input-group-text>
                <lah-fa-icon icon="search" action="breath" class="font-weight-bold">
                  {{year}}-{{month}}
                </lah-fa-icon>
              </b-input-group-text>
            </template>
            <b-form-input type="range" v-model="rangeStep" class="my-auto mr-2" min="1" max="24"></b-form-input>
          </b-input-group>
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
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
          />
        </div>
      </h3>
    </lah-transition>
    <lah-transition>
      <div v-if="committed">
        <lah-reg-b-table
          :busy="isBusy"
          :baked-data="bakedData"
          :fields="fields"
          :max-height="maxHeight"
          :per-page="perPage"
          :current-page="currentPage"
          only-popup-detail
        />
      </div>
      <h3 v-else class="text-center"><lah-fa-icon icon="search" action="breath" variant="primary">請滑動月份</lah-fa-icon></h3>
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: '外國人地權案件-桃園市地政局'
  },
  data: () => {
    const now = new Date();
    return {
      forceReload: false,
      year: now.getFullYear() - 1911,
      month: ("0" + now.getMonth()).slice(-2), // set last month as default
      cachedMs: 24 * 60 * 60 * 1000,
      committed: false,
      maxHeight: 300,
      currentPage: 1,
      perPage: 25,
      rangeMax: 24,
      rangeStep: 23,
      rangeBase: (now.getFullYear() - 1911) * 12 + now.getMonth() + 1,
      bakedData: [],
      fields: [
        {
          key: '收件字號',
          sort: true
        },
        {
          key: '登記原因',
          sort: true
        },
        {
          key: '收件日期',
          sort: true
        },
        {
          key: '結案日期',
          sort: true
        },
        {
          key: '權利人統一編號',
          sort: true
        },
        {
          key: '權利人姓名',
          sort: true
        },
        {
          key: '義務人統一編號',
          sort: true
        },
        {
          key: '義務人姓名',
          sort: true
        },
        {
          key: '外國人類別',
          sort: true
        },
        {
          key: '辦理情形',
          sort: true
        },
        {
          key: '結案與否',
          sort: true
        }
      ]
    }
  },
  computed: {
    cacheKey () { return `foreigner-case-${this.year}${this.month}` }
  },
  watch: {
    rangeStep (val) {
      const after = this.rangeBase - this.rangeMax + parseInt(val) - 1
      this.year = parseInt(after / 12)
      this.month = ("0" + (after % 12 + 1)).slice(-2)
      this.reloadDebounced()
    }
  },
  methods: {
    reloadDebounced () {/* placeholder */},
    reload () {
      this.forceReload = true
      this.$fetch()
    }
  },
  fetch () {
    // restore cached data if found
    this.getCache(this.cacheKey).then(json => {
      this.$utils.log(json)
      if (json === false || this.forceReload) {
        if(!this.isBusy) {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: `reg_foreigner_case`,
            year_month: `${this.year}${this.month}`,
            reload: this.forceReload
          }).then((res) => {
            this.bakedData = res.data.baked || []
            this.notify(res.data.message, { type: this.$utils.statusCheck(res.data.status) ? 'info' : 'warning' })
            const remain_ms = res.data.cache_remaining_time // in seconds
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, res.data, remain_ms * 1000)
              if (this.$refs.countdown) {
                this.$refs.countdown.setCountdown(remain_ms * 1000)
                this.$refs.countdown.startCountdown()
              }
            }
          }).catch(err => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        } else {
          this.notify('讀取中 ... 請稍後', { type: 'warning' })
        }
      } else {
        this.bakedData = json.baked
        this.committed = true
        this.currentPage = 1
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆非專業代理人案件。`, { subtitle: this.cacheKey })
        this.getCacheExpireRemainingTime(this.cacheKey).then(remaining => {
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
        })
      }
    })
  },
  created () {
    this.reloadDebounced = this.$utils.debounce(this.$fetch, 1000)
  },
  mounted () {
    this.maxHeight = window.innerHeight - 135
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
</style>
