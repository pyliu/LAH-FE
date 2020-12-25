<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">
          <lah-fa-icon icon="user-tag" variant="secondary" append>非專業代理人案件檢索</lah-fa-icon>
        </div>
        <div class="d-flex">
          <b-form-datepicker
            value-as-date
            v-model="startDateObj"
            placeholder="開始日期"
            :max="yesterday"
            boundary="viewport"
          />
          <div class="my-auto">～</div>
          <b-form-datepicker
            value-as-date
            v-model="endDateObj"
            placeholder="截止日期"
            :max="today"
            :min="startDateObj"
            boundary="viewport"
            class="mr-1"
          />
          <lah-countdown-button
            ref="countdown"
            icon="sync-alt"
            action="ld-cycle"
            size="lg"
            :milliseconds="0"
            @end="reload"
            @click="reload"
            :disabled="isBusy"
            :busy="isBusy"
            title="立即重新讀取"
          />
        </div>
      </h3>
    </lah-transition>
    <div>
      <div class="d-flex justify-content-between">
        <b-pagination
          v-if="!$utils.empty(bakedData)"
          v-model="currentPage"
          :total-rows="bakedData.length"
          :per-page="perPage"
          last-number
          first-number
          aria-controls="scrivener-table"
          size="sm"
        />
      </div>
    </div>
    <lah-transition appear>
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
      <h3 v-else class="text-center"><lah-fa-icon action="breath" variant="primary">請點選查詢按鈕</lah-fa-icon></h3>
    </lah-transition>
  </div>
</template>

<script>
export default {
  head: {
    title: "信託案件檢索-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    clickedId: undefined,
    forceReload: false,
    committed: false,
    maxHeight: 300,
    startDateObj: null,
    startDate: '1091201',
    endDateObj: null,
    endDate: '1091225',
    bakedData: [],
    fields: [
      {
        key: "RM01",
        label: "收件字號",
        sortable: true
      },
      {
        key: "RM07_1",
        label: "收件日期",
        sortable: true
      },
      {
        key: "RM09",
        label: "登記原因",
        sortable: true
      },
      {
        key: "辦理情形",
        sortable: true
      },
      {
        key: "代理人統編",
        sortable: true
      },
      {
        key: "代理人姓名",
        sortable: true
      },
      {
        key: "代理人電話",
        sortable: true
      },
      {
        key: "代理人住址",
        sortable: true
      }
    ],
    currentPage: 1,
    perPage: 25
  }),
  computed: {
    cacheKey () { return `non_scrivener_case_${this.startDate}_${this.endDate}` },
    style () {
      const parsed = parseInt(this.maxHeight)
      return isNaN(parsed) ? "" : `max-height: ${parsed}px`
    },
    yesterday () { return new Date(new Date().setDate(new Date().getDate()-1)) },
    today () { return new Date() }
  },
  watch: {
    startDateObj (val) {
      this.startDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`
    },
    endDateObj (val) {
      this.endDate = `${val.getFullYear() - 1911}${("0" + (val.getMonth()+1)).slice(-2)}${("0" + val.getDate()).slice(-2)}`
    },
  },
  methods: {
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    resetCommitted () {
      this.committed = false
      this.bakedData = []
      this.currentPage = 1
    }
  },
  fetch () {
    // restore cached data if found
    this.getCache(this.cacheKey).then(json => {
      if (json === false || this.forceReload) {
        if(!this.isBusy) {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: `reg_non_scrivener_case`,
            start_date: this.startDate,
            end_date: this.endDate,
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
    this.startDateObj = this.yesterday
    this.endDateObj = this.today
  },
  mounted () {
    this.maxHeight = window.innerHeight - 135
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
