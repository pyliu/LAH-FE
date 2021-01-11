<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">公告期滿案件</div>
            <lah-button icon="question" variant="outline-success" no-border @click="$bvModal.show('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'" size="xl">
              <lah-button icon="exclamation-circle" variant="danger"></lah-button>
            </lah-help-modal>
          </div>
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
      </lah-transition>
    </lah-header>
    <lah-transition appear>
      <lah-reg-b-table :busy="isBusy" :baked-data="bakedData" :fields="fields" :max-height="maxHeight"></lah-reg-b-table>
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
import lahFaIcon from '~/components/lah-fa-icon.vue'
import LahHeader from '~/components/lah-header.vue'
export default {
  components: { lahFaIcon, LahHeader },
  head: {
    title: "公告期滿案件-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 12 * 60 * 60 * 1000,
    forceReload: false,
    fields: [
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
        label:'期滿日期',
        sortable: true
      }
    ],
    maxHeight: 300
  }),
  computed: {
    queryCount () { return this.bakedData.length },
    cacheKey () { return `reg_rm30_H_case` }
  },
  watch: {
    bakedData (val) {
      // this.$utils.log(val)
    }
  },
  fetch () {
    this.getCache(this.cacheKey).then(json => {
      if (json === false) {
        if(!this.isBusy) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_rm30_H_case',
            reload: this.forceReload
          }).then((res) => {
            this.bakedData = res.data.baked || []
            this.notify(res.data.message, { type: this.$utils.statusCheck(res.data.status) ? 'info' : 'warning' })
            const remain_ms = res.data.cache_remaining_time
            if (remain_ms && remain_ms > 0) {
              this.setCache(this.cacheKey, res.data, remain_ms)
              // use server side cache remaining time
              this.$refs.countdown.setCountdown(remain_ms * 1000)
            } else {
              this.$refs.countdown.setCountdown(this.cachedMs)
            }
            this.getCacheExpireRemainingTime(this.cacheKey).then((true_remain_ms) => {
              this.$utils.log(`${this.cacheKey} 快取資料將在 ${(true_remain_ms / 1000).toFixed(1)} 秒後到期。`)
            })
            this.$refs.countdown.startCountdown()
          }).catch(err => {
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
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆公告中資料。`, { subtitle: `${this.cacheKey}(快取)` })
      }
    })
  },
  methods: {
    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then(
          remain_ms => {
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
  },
  mounted () {
    this.maxHeight = window.innerHeight - 100
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
