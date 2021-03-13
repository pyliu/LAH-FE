<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 外國人地權案件
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            .h5 請利用日期區間搜尋
        .d-flex
          lah-datepicker.mr-1(v-model="dateRange")
          lah-button.mr-1(
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy || isWrongDaysPeriod"
            @click="$fetch"
            no-icon-gutter
          )
          lah-countdown-button(
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            title="立即重新讀取"
            variant="outline-secondary"
            badge-variant="secondary"
            :disabled="isBusy"
            :busy="isBusy"
            :milliseconds="cachedMs"
            @end="reload"
            @click="reload"
            auto-start
            end-attention
            no-badge
          )
    lah-transition
      lah-reg-b-table(
        only-popup-detail
        :busy="isBusy"
        :baked-data="bakedData"
        :fields="fields"
        v-if="committed"
      )
      h3.text-center(v-else): lah-fa-icon(icon="search" action="breath" variant="primary") 請案搜尋按鈕
</template>

<script>
import lahButton from '~/components/lah-button.vue';
export default {
  components: { lahButton },
  head: {
    title: '外國人地權案件-桃園市地政局'
  },
  fetchOnServer: false,
  data: () => ({
    forceReload: false,
    committed: false,
    dateRange: {
      beigh: '',
      end: '',
      days: 0
    },
    cachedMs: 24 * 60 * 60 * 1000,
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
        key: '校對日期',
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
  }),
  computed: {
    cacheKey () { return `foreigner-case-${this.dateRange.begin}-${this.dateRange.end}` },
    isWrongDaysPeriod () { return this.dateRange.days < 1 }
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    }
  },
  fetch () {
    if(this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
    } else {
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
              begin: this.dateRange.begin,
              end: this.dateRange.end,
              reload: this.forceReload
            }).then(({ data }) => {
              this.bakedData = data.baked || []
              this.notify(data.message, {
                type: this.$utils.statusCheck(data.status) ? 'info' : 'warning',
                subtitle: `${this.dateRange.begin}-${this.dateRange.end}`
              })
              const remain_s = data.cache_remaining_time // in seconds
              const remain_ms = remain_s * 1000
              if (remain_ms && remain_ms > 0) {
                this.setCache(this.cacheKey, data, remain_ms)
                if (this.$refs.countdown) {
                  this.$refs.countdown.setCountdown(remain_ms)
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
          this.getCacheExpireRemainingTime(this.cacheKey).then(remaining => {
            if (this.$refs.countdown) {
              this.$refs.countdown.setCountdown(remaining)
              this.$refs.countdown.startCountdown()
            }
            this.notify(`查詢成功，找到 ${this.bakedData.length} 筆外國人地權案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.vw-50 {
  width: 33vw;
}
</style>
