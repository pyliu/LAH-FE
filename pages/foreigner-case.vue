<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 外國人地權案件
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            .h5 利用下面介面操作資料搜尋時間：
            .d-flex.my-2.text-nowrap
              b-form-input.my-auto(type="range" v-model="rangeStep" min="1" max="24")
              span.my-auto.mr-2 {{ year }}-{{ month }}
        .d-flex
          lah-countdown-button(
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
            class="mr-2"
            :disabled="isBusy"
            :busy="isBusy"
            :milliseconds="cachedMs"
            @end="reload"
            @click="reload"
            auto-start
            end-attention
            no-badge
          )
          b-input-group.vw-50(size="sm")
            template(#prepend): b-input-group-text: lah-fa-icon.font-weight-bold(icon="calendar" regular).
              {{year}}年{{month}}月
            b-form-input.my-auto(type="range" v-model="rangeStep" min="1" max="24")
    lah-transition
      div(v-if="committed"): lah-reg-b-table(
        :busy="isBusy"
        :baked-data="bakedData"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
        only-popup-detail
      )
      h3.text-center(v-else): lah-fa-icon(icon="search" action="breath" variant="primary") 請滑動月份
</template>

<script>
import lahButton from '~/components/lah-button.vue';
export default {
  components: { lahButton },
  head: {
    title: '外國人地權案件-桃園市地政局'
  },
  fetchOnServer: false,
  data: () => {
    const now = new Date()
    let month = now.getMonth()
    let year = now.getFullYear() - 1911
    month === 0 && (month = 12, year--)
    // set last month as default
    const defMonth = ("0" + month).slice(-2)
    const rangeBase = (now.getFullYear() - 1911) * 12 + now.getMonth() + 1
    return {
      forceReload: false,
      year: year,
      month: defMonth,
      cachedMs: 24 * 60 * 60 * 1000,
      committed: false,
      currentPage: 1,
      perPage: 25,
      rangeMax: 24,
      rangeStep: 23,
      rangeBase: rangeBase,
      bakedData: [],
      fields: [
        {
          key: '收件字號',
          sortable: true
        },
        {
          key: '登記原因',
          sortable: true
        },
        {
          key: '收件日期',
          sortable: true
        },
        {
          key: '結案日期',
          sortable: true
        },
        {
          key: '權利人統一編號',
          sortable: true
        },
        {
          key: '權利人姓名',
          sortable: true
        },
        {
          key: '義務人統一編號',
          sortable: true
        },
        {
          key: '義務人姓名',
          sortable: true
        },
        {
          key: '外國人類別',
          sortable: true
        },
        {
          key: '辦理情形',
          sortable: true
        },
        {
          key: '結案與否',
          sortable: true
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
      if (json === false || this.forceReload) {
        if(this.isBusy) {
          this.notify('讀取中 ... 請稍後', { type: 'warning' })
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: `reg_foreigner_case`,
            year_month: `${this.year}${this.month}`,
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            this.notify(data.message, {
              type: this.$utils.statusCheck(data.status) ? 'info' : 'warning',
              subtitle: `${this.year}-${this.month}`
            })
            const remain_ms = data.cache_remaining_time // in seconds
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, data, remain_ms * 1000)
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
        }
      } else {
        this.bakedData = json.baked
        this.committed = true
        this.currentPage = 1
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆外國人地權案件。`, { subtitle: `${this.cacheKey}(快取)` })
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
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
</style>
