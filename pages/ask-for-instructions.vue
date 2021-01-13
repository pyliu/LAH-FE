<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">取消請示案件</div>
            <lah-button icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="modalById('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'">
              <div class="h5">利用下面介面操作資料搜尋時間：</div>
              <div class="d-flex my-2 text-nowrap">
                <b-form-input type="range" v-model="months" class="my-auto mr-2" min="1" max="12"></b-form-input>
                <span class="my-auto mr-2">{{months}}個月內</span>
              </div>
              <hr/>
              <div class="h5">取消請示案件狀態說明：</div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="danger">有申請取消請示紀錄且<strong class="text-danger">已</strong>逾期案件</lah-fa-icon></div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="warning">有申請取消請示紀錄且於預訂結案日結案之案件</lah-fa-icon></div>
              <div class="mx-2"><lah-fa-icon icon="circle" variant="success">有申請取消請示紀錄且<strong>未</strong>逾期案件</lah-fa-icon></div>
            </lah-help-modal>
          </div>
          <div class="d-flex text-nowrap">
            <b-form-input type="range" v-model="months" class="my-auto mr-2" min="1" max="12"></b-form-input>
            <span class="my-auto mr-2">{{months}}個月內</span>
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
              no-badge
            />
          </div>
        </div>
      </lah-transition>
    </lah-header>
    <lah-transition appear>
      <lah-reg-b-table
        :busy="isBusy"
        :baked-data="bakedData"
        :fields="fields"
        :max-height="maxHeight"
      />
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
export default {
  head: {
    title: "請示未結案件-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    committed: false,
    cachedMs: 60 * 60 * 1000,
    forceReload: false,
    months: 3,
    days: 92,
    fields: [
      {
        key: "請示燈號",
        label: '狀態',
        sortable: true,
      },
      {
        key: "收件字號",
        sortable: true,
      },
      {
        key: "登記原因",
        sortable: true,
      },
      {
        key: "辦理情形",
        sortable: true,
      },
      {
        key: "初審人員",
        sortable: true,
      },
      {
        key: "請示日期",
        sortable: true,
      },
      {
        key: "取消請示日期",
        label: '取消請示',
        sortable: true,
      },
      {
        key: "預定結案日期",
        label: '預定結案',
        sortable: true,
      },
      {
        key: "結案日期",
        sortable: true,
      },
    ],
    maxHeight: 300
  }),
  computed: {
    queryCount() { return this.bakedData.length },
    cacheKey() { return `reg_cancel_ask_case` },
    daysText () { return `${this.days} 天內`}
  },
  watch: {
    months (val) {
      this.days = Math.ceil(365 / 12 * val)
      this.reloadDebounced()
    }
  },
  fetch () {
    this.getCache(this.cacheKey).then((json) => {
      if (json === false) {
        this.isBusy = true
        this.$axios
          .post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_cancel_ask_case',
            reload: this.forceReload,
            days: this.days
          })
          .then((res) => {
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
            this.$refs.countdown.startCountdown()
          })
          .catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          })
          .finally(() => {
            this.isBusy = false
            this.forceReload = false
          })
      } else {
        this.bakedData = json.baked || []
        this.resetCountdown()
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆請示案件資料。`, { subtitle: `${this.cacheKey}(快取)` })
      }
    })
  },
  methods: {
    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then((remain_ms) => {
          if (remain_ms > 0) {
            this.$refs.countdown.setCountdown(remain_ms)
            this.$refs.countdown.startCountdown()
            this.$utils.log(`${this.cacheKey} 快取資料將在 ${(remain_ms / 1000).toFixed(1)} 秒後到期。`)
          }
        })
      }
    },
    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    },
    reloadDebounced () {}
  },
  created () { 
    // wrap the reload function with delay to prevent quick reloading call
    this.reloadDebounced = this.$utils.debounce(this.reload, 1000)
  },
  mounted () {
    this.maxHeight = window.innerHeight - 100
  }
}
</script>

<style lang="scss" scoped>
</style>
