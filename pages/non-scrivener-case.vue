<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">
          <lah-fa-icon icon="user-tag" variant="secondary" append>非專業代理人案件檢索</lah-fa-icon>
        </div>
        <client-only>
          <div class="d-flex">
            <b-datepicker
              value-as-date
              v-model="startDateObj"
              placeholder="開始日期"
              boundary="viewport"
              size="sm"
              :date-format-options="{ weekday: 'narrow' }"
              :max="yesterday || new Date(new Date().setDate(new Date().getDate()-1))"
              hide-header
              dropleft
            />
            <div class="my-auto">～</div>
            <b-datepicker
              value-as-date
              v-model="endDateObj"
              placeholder="截止日期"
              boundary="viewport"
              class="mr-1"
              size="sm"
              dark
              :date-format-options="{ weekday: 'narrow' }"
              :max="today || new Date()"
              :min="startDateObj || new Date(new Date().setDate(new Date().getDate()-1))"
              hide-header
            />
            <lah-button
              icon="search"
              size="lg"
              @click="$fetch"
              :disabled="isBusy"
              :busy="isBusy"
              title="搜尋"
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
              variant="outline-secondary"
              badge-variant="secondary"
              title="強制重新搜尋"
              no-badge
            />
          </div>
        </client-only>
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
          class="my-auto mr-2"
        />
        <b-input-group size="sm" prepend="忽略" class="tags-input">
          <b-form-tags
            input-id="tags"
            v-model="ignoreTags"
            separator=" ,;"
            remove-on-delete
            tag-variant="primary"
            tag-pills
            placeholder="輸入想要忽略的統編 ... "
          />
          <b-input-group-append>
            <b-button variant="outline-primary" @click="ignoreTyoffices">桃園各事務所</b-button>
            <b-button variant="outline-success" @click="ignoreTags = []">清除</b-button>
          </b-input-group-append>
        </b-input-group>
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
    ignoreTags: ['45000808', '43717356', '43504044', '43501004', '44039876', '95924138', '95920288', '50634177'],
    bakedData: [],
    fields: [
      {
        key: "收件字號",
        sortable: true
      },
      {
        key: "收件日期",
        sortable: true
      },
      {
        key: "登記原因",
        sortable: true
      },
      {
        key: "AB01",
        label: "非專代統編",
        sortable: true
      },
      {
        key: "AB02",
        label: "非專代名稱",
        sortable: true
      },
      {
        key: "AB03",
        label: "非專代住址",
        sortable: true
      },
      {
        key: "AB04_NON_SCRIVENER_TEL",
        label: "非專代電話",
        sortable: true
      },
      {
        key: "AB13",
        label: "當年案件量",
        sortable: true
      },
      {
        key: "AB23",
        label: "累計案件量(同機關)",
        sortable: true
      },
      {
        key: "權利人姓名",
        sortable: true
      },
      {
        key: "權利人住址",
        sortable: true
      },
      {
        key: "義務人姓名",
        sortable: true
      },
      {
        key: "義務人住址",
        sortable: true
      },
      {
        key: "區名稱",
        sortable: true
      },
      {
        key: "段小段",
        sortable: true
      },
      {
        key: "RM12_C",
        label: "地號",
        sortable: true
      },
      {
        key: "RM15_C",
        label: "建號",
        sortable: true
      }
    ],
    currentPage: 1,
    perPage: 25
  }),
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}_${this.ignoreTags.join('')}`)
    },
    cacheKey () { return `non_scrivener_case_${this.md5Hash}` },
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
    },
    ignoreTyoffices () {
      this.ignoreTags = ['45000808', '43717356', '43504044', '43501004', '44039876', '95924138', '95920288', '50634177']
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
            type: `reg_non_scrivener_web_case`,
            start_date: this.startDate,
            end_date: this.endDate,
            reload: this.forceReload,
            ignore: this.ignoreTags
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
  max-height: calc(100% - 135px);
}
.tags-input {
  width: 100vw;
}
</style>
