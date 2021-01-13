<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">非專業代理人案件檢索</div>
            <lah-button icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="modalById('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'">
              <h5>請參照下列步驟搜尋</h5>
              <ol>
                <li>選擇日期區間(預設為目前月份)</li>
                <li>輸入想要忽略之統編(非必要)</li>
                <li>點擊 <lah-fa-icon icon="search" variant="primary" no-gutter /> 搜尋</li>
              </ol>
              <hr/>
              <lah-fa-icon icon="lightbulb" regular variant="warning">點擊「收件字號」開啟案件詳情視窗</lah-fa-icon>
            </lah-help-modal>
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
                :max="yesterday"
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
                :max="today"
                :min="startDateObj"
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
        </div>
      </lah-transition>
    </lah-header>
    <div class="d-flex justify-content-between">
      <b-pagination
        v-if="!$utils.empty(bakedData) && bakedData.length > perPage"
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
          tag-variant="secondary"
          tag-pills
          placeholder="忽略的統編 ... "
          add-button-text="新增"
          add-button-variant="outline-secondary"
        />
        <b-input-group-append>
          <lah-button prefix="far" action="move-fade-rtl" icon="hand-point-left" variant="outline-secondary" @click="ignoreTyoffices" title="桃園市">各事務所</lah-button>
          <lah-button action="swing" icon="broom" variant="outline-success" @click="ignoreTags = []" title="清除忽略標籤">清除</lah-button>
        </b-input-group-append>
      </b-input-group>
    </div>
    <lah-transition>
      <div v-if="committed">
        <lah-reg-b-table
          :busy="isBusy"
          :baked-data="bakedData"
          :fields="fields"
          :max-height="maxHeight"
          :per-page="perPage"
          :current-page="currentPage"
          :caption-append="captionRange"
          only-popup-detail
        />
      </div>
      <h3 v-else class="text-center"><lah-fa-icon icon="search" action="breath" variant="primary">請點擊查詢按鈕</lah-fa-icon></h3>
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
    startDate: '1100101',
    endDateObj: null,
    endDate: '1100131',
    tyOfficeMap: {
      '中壢': 45000808,
      '楊梅':	43717356,
      '桃園': 43504044,
      '大溪': 43501004,
      '蘆竹':	44039876,
      '八德':	95924138,
      '平鎮':	95920288,
      '龜山': 50634177

    },
    ignoreTags: ['中壢', '楊梅', '桃園', '大溪', '蘆竹', '八德', '平鎮', '龜山'],
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
    firstDayofMonth () {
      return new Date(this.today.getFullYear(), this.today.getMonth(), 1)
    },
    lastDayofMonth () {
      return new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0)
    },
    yesterday () { return new Date(new Date().setDate(new Date().getDate()-1)) },
    today () { return new Date() },
    captionRange () {
      return `，【${this.startDate.substring(0, 3)}-${this.startDate.substring(3, 5)}-${this.startDate.substring(5)} ~ ${this.endDate.substring(0, 3)}-${this.endDate.substring(3, 5)}-${this.endDate.substring(5)}】`
    }
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
      this.ignoreTags = ['中壢', '楊梅', '桃園', '大溪', '蘆竹', '八德', '平鎮', '龜山']
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
            ignore: this.ignoreTags.map(tag => this.tyOfficeMap[tag] ? this.tyOfficeMap[tag] : tag)
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
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆非專業代理人案件。`, { subtitle: `${this.cacheKey}(快取)` })
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
    this.startDateObj = this.firstDayofMonth
    this.endDateObj = this.lastDayofMonth
  },
  mounted () {
    this.maxHeight = window.innerHeight - 140
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
