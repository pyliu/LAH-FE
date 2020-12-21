<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">
          <lah-fa-icon icon="money-check-alt" variant="secondary">信託案件檢索</lah-fa-icon>
        </div>
        <div class="d-flex">
          <b-input-group append="年" class="text-nowrap mr-1">
            <b-form-select
              ref="year"
              v-model="year"
              :options="years"
              class="h-100"
            >
              <template v-slot:first>
                <b-form-select-option :value="null" disabled>-- 請選擇年份 --</b-form-select-option>
              </template>
            </b-form-select>
          </b-input-group>
          <b-input-group class="text-nowrap mr-1">
            <b-form-select
              ref="type"
              v-model="type"
              :options="types"
              class="h-100"
            >
              <template v-slot:first>
                <b-form-select-option :value="null" disabled>-- 請選擇部別 --</b-form-select-option>
              </template>
            </b-form-select>
          </b-input-group>
          <lah-button
            ref="search"
            icon="search"
            size="lg"
            title="搜尋"
            :disabled="isBusy"
            @click="search"
          ></lah-button>
        </div>
      </h3>
    </lah-transition>
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
export default {
  components: { lahFaIcon },
  head: {
    title: "信託案件檢索-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    year: '109',
    years: [],
    type: '0',
    types: [
      { value: '0', text: '土地標示部' },
      { value: '1', text: '土地所有權部' },
      { value: '2', text: '建物標示部' },
      { value: '3', text: '建物所有權部' }
    ],
    bakedData: [],
    cachedMs: 60 * 60 * 1000,
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
    cacheKey () { return `reg_trust_case` },
    cacheKeyYear () { return `${this.cacheKey}_years` }
  },
  watch: {
    bakedData (val) {
      // this.$utils.log(val)
    }
  },
  fetch () {
    // get cached data
    this.getCache(this.cacheKey).then(json => {
      if (json !== false) {
        this.bakedData = json.baked
        this.notify(`查詢成功，找到 ${this.bakedData.length} 筆信託案件。`)
      }
    })
    this.getCache(this.cacheKeyYear).then(years => {
      if (years !== false) {
        this.years = years;
      } else {
        // set year select options
        var d = new Date();
        this.year = (d.getFullYear() - 1911);
        let len = this.year - 104;
        for (let i = 0; i <= len; i++) {
            this.years.push({value: 104 + i, text: 104 + i});
        }
        this.setCache(this.cacheKeyYear, this.years, 24 * 60 * 60 * 1000);  // cache for a day
      }
    });
  },
  methods: {
    search () {
      if(!this.isBusy) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: 'reg_trust_case',
          reload: this.forceReload
        }).then((res) => {
          this.bakedData = res.data.baked || []
          this.notify(res.data.message, { type: this.$utils.statusCheck(res.data.status) ? 'info' : 'warning' })
          const remain_ms = res.data.cache_remaining_time
          if (remain_ms && remain_ms > 0) {
            this.setCache(this.cacheKey, res.data, remain_ms)
          }
          this.getCacheExpireRemainingTime(this.cacheKey).then((true_remain_ms) => {
            this.$utils.log(`${this.cacheKey} 快取資料將在 ${(true_remain_ms / 1000).toFixed(1)} 秒後到期。`)
          })
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
