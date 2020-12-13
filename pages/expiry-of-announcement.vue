<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">公告期滿案件</div>
        <lah-countdown-button
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :end="$fetch"
          :click="reload"
          :disabled="isBusy"
          :busy="isBusy"
          auto-start
          title="立即重新讀取"
        ></lah-countdown-button>
      </h3>
    </lah-transition>
    <lah-transition appear>
      <lah-reg-b-table v-if="!isBusy" :baked-data="bakedData" :fields="fields" class="move-table-up"></lah-reg-b-table>
    </lah-transition>
    <lah-transition class="center h3">
      <lah-fa-icon
        v-cloak
        v-if="queryCount === 0 && committed"
        action="bounce"
        icon="yahoo"
        prefix="fab"
      >
        無資料</lah-fa-icon
      >
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: "公告期滿案件-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 15 * 60 * 1000,
    fields: [
      {
        key: "燈號",
        sortable: true
      },
      {
        key: "收件字號",
        sortable: true
      },
      {
        key: "登記原因",
        sortable: true
      },
      {
        key: "辦理情形",
        sortable: true
      },
      {
        key: "初審人員",
        sortable: true
      },
      {
        key: "公告日期",
        sortable: true
      },
      {
        key: "公告期滿日期",
        label:"期滿日期",
        sortable: true
      },
      {
        key: "預定結案日期",
        label:"限辦期限",
        sortable: true
      }
    ]
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
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'reg_rm30_H_case'
        }).then((res) => {
          this.setCache(this.cacheKey, res.data, this.cachedMs)
          this.resetCountdown()
          this.bakedData = res.data.baked
          this.notify(res.data.message)
        }).catch(err => {
          this.alert(err.message)
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      } else {
        this.bakedData = json.baked
        this.resetCountdown()
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
      this.removeCache(this.cacheKey).then(() => { this.$fetch() })
    }
  }
}
</script>

<style lang="scss" scoped>
.move-table-up {
  margin-top: -25px;
}
</style>
