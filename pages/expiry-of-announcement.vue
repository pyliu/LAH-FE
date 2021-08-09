<template lang="pug">
  div
    lah-header: lah-transition(appear)
      .d-flex.justify-content-between.w-100
        .d-flex
          .my-auto 公告期滿案件
          lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
          lah-help-modal(:modal-id="'help-modal'")
            .h5 公告中案件狀態說明：
            .mx-2 #[lah-fa-icon(icon="circle" variant="danger") 已到期案件]
            .mx-2 #[lah-fa-icon(icon="circle" variant="warning") 今日到期案件]
            .mx-2 #[lah-fa-icon(icon="circle" variant="success") 公告中案件]
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :milliseconds="cachedMs"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          no-badge
        )

    lah-transition(appear): lah-reg-b-table(:busy="isBusy" :baked-data="bakedData" :fields="fields")
    lah-transition.center.h3: lah-fa-icon(
      v-cloak
      v-if="queryCount === 0 && !isBusy"
      icon="exclamation-circle"
      prefix="fas"
    ) 無資料
</template>

<script>
import lahFaIcon from '~/components/lah-fa-icon.vue'
import LahHeader from '~/components/lah-header.vue'
export default {
  components: { lahFaIcon, LahHeader },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 12 * 60 * 60 * 1000,
    forceReload: false,
    fields: [
      {
        key: '序號',
        sortable: false
      },
      {
        key: '公告燈號',
        label: '狀態',
        sortable: true
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '登記原因',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '公告日期',
        sortable: true
      },
      {
        key: '公告期滿日期',
        label: '期滿日期',
        sortable: true
      }
    ]
  }),
  fetch () {
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (!this.isBusy) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_rm30_H_case',
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remain_s = data.cache_remaining_time
            const remain_ms = remain_s * 1000
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, data, remain_ms)
              // use server side cache remaining time
              this.$refs.countdown && this.$refs.countdown.setCountdown(remain_ms)
            } else {
              this.$refs.countdown && this.$refs.countdown.setCountdown(this.cachedMs)
            }
            this.getCacheExpireRemainingTime(this.cacheKey).then((true_remain_ms) => {
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(true_remain_ms / 1000).toFixed(1)} 秒後到期。`)
            })
            this.$refs.countdown && this.$refs.countdown.startCountdown()
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
          })
        } else {
          this.notify('讀取中 ... 請稍後', { type: 'warning' })
        }
      } else {
        this.bakedData = json.baked
        this.resetCountdown()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.bakedData.length} 筆公告中資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
        })
      }
    })
  },
  head: {
    title: '公告期滿案件-桃園市地政局'
  },
  computed: {
    queryCount () { return this.bakedData.length },
    cacheKey () { return `reg_rm30_H_case` }
  },
  watch: {
    bakedData (val) {
      // this.$utils.log(val)
    }
  },
  methods: {
    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then(
          (remain_ms) => {
            this.$refs.countdown.setCountdown(remain_ms)
            this.$refs.countdown.startCountdown()
            this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remain_ms / 1000).toFixed(1)} 秒後到期。`)
          }
        )
      }
    },
    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.move-table-up {
  margin-top: -25px;
}
.fixed-height-table {
  height: calc(100% - 20px);
}
</style>
