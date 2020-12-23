<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">
          <lah-fa-icon icon="money-check-alt" variant="secondary" append>信託案件檢索</lah-fa-icon>
        </div>
        <div class="d-flex">
          <b-pagination
            v-if="!$utils.empty(rows)"
            v-model="currentPage"
            :total-rows="rows.length"
            :per-page="perPage"
            last-number
            aria-controls="trust-table"
            class="my-auto mr-1"
          ></b-pagination>
          <b-input-group append="年" class="text-nowrap mr-1">
            <b-form-select
              ref="year"
              v-model="year"
              :options="years"
              class="h-100"
              @change="resetCommitted"
            >
              <template v-slot:first>
                <b-form-select-option :value="null" disabled>-- 請選擇年份 --</b-form-select-option>
              </template>
            </b-form-select>
          </b-input-group>
          <b-input-group class="text-nowrap mr-1">
            <b-form-select
              ref="type"
              v-model="qryType"
              :options="qryTypes"
              class="h-100"
              @change="resetCommitted"
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
      <b-table
        id="trust-table"
        v-if="committed"
        :busy="isBusy"
        :items="rows"
        ref="table"
        :responsive="'lg'"
        :striped="true"
        :hover="true"
        :bordered="true"
        :borderless="false"
        :outlined="false"
        :small="true"
        :dark="false"
        :fixed="false"
        :foot-clone="false"
        :no-border-collapse="true"
        :head-variant="'dark'"
        :sticky-header="true"
        caption-top
        :caption="caption"
        :style="style"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
      >
        <template #table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <template #cell(IS48)="{ item }">
          <div class="text-nowrap">{{ item.IS48 }} {{ item.IS48_CHT }}</div>
        </template>
        <template #cell(IS49)="{ item }">
          <div class="text-nowrap">{{ landBuildNumber(item) }}</div>
        </template>
        <template #cell(EE15_1)="{ item }">
          <div class="d-flex justify-content-between" v-if="!($utils.empty(item.EE15_1) && $utils.empty(item.EE15_2) && $utils.empty(item.EE15_3))">
            <strong>{{ item.EE15_1||'' }}</strong> <div class="text-nowrap">{{ item.EE15_3 }}／{{ item.EE15_2 }}</div>
          </div>
        </template>
        <template #cell(BB15_1)="{ item }">
          <div class="d-flex justify-content-between" v-if="!($utils.empty(item.BB15_1) && $utils.empty(item.BB15_2) && $utils.empty(item.BB15_3))">
            <strong>{{ item.BB15_1||'' }}</strong> <div class="text-nowrap">{{ item.BB15_3 }}／{{ item.BB15_2 }}</div>
          </div>
        </template>
        <template #cell(IS03)="{ item }">
          <div class="text-nowrap">
            <b-link @click="popup(item)">{{ item.IS03 }}-{{ item.IS04_1 }}-{{ item.IS04_2 }}</b-link>
          </div>
        </template>
        <template #cell(GG30_2)="{ item }">
          <div v-if="!($utils.empty(item.GG30_1) && $utils.empty(item.GG30_1_CHT) && $utils.empty(item.GG30_2))">
            【{{ item.GG30_1 }}】{{ item.GG30_1_CHT }}{{ item.GG30_2 }}
          </div>
        </template>
      </b-table>
      <h3 v-else class="text-center"><lah-fa-icon action="breath" variant="primary">請點選查詢按鈕</lah-fa-icon></h3>
    </lah-transition>
    <b-modal
      :id="modalId"
      hide-footer
      centered
      no-close-on-backdrop
      size="xl"
      scrollable
    >
      <template #modal-title>
        登記案件詳情 {{$utils.caseId(clickedId)}}
      </template>
      <lah-reg-case-detail :case-id="clickedId"/>
    </b-modal>
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
    modalId: 'this should be an uuid',
    clickedId: undefined,
    year: '',
    years: [],
    qryType: 'B',
    qryTypes: [
      { value: 'B', text: '土地所有權部' },
      { value: 'E', text: '建物所有權部' },
      { value: 'TB', text: '土地例外' },
      { value: 'TE', text: '建物例外' }
    ],
    rows: [],
    perPage: 100,
    currentPage: 0,
    forceReload: false,
    committed: false,
    maxHeight: 300,
    landFields: [
      {
        key: "IS48",
        label: '段代碼/名稱',
        sortable: true,
      },
      {
        key: "IS49",
        label: '地/建號',
        sortable: true,
      },
      {
        key: "IS01",
        label: '登記次序',
        sortable: true,
      },
      {
        key: "IS09",
        label: '統一編號',
        sortable: true,
      },
      {
        key: "ISNAME",
        label: '所有權人',
        sortable: true,
      },
      {
        key: "GG30_2",
        label: '其他登記內容',
        sortable: true,
      },
      {
        key: "BB15_1",
        label: '土地權利範圍',
        sortable: true,
      },
      {
        key: "IS03",
        label: '收件年字號',
        sortable: true,
      },
      {
        key: "IS05",
        label: '登記日期',
        sortable: true,
      },
      {
        key: "BB06_CHT",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "IS_DATE",
        label: '異動日期',
        sortable: true,
      }
    ],
    buildFields: [
      {
        key: "IS48",
        label: '段代碼/名稱',
        sortable: true,
      },
      {
        key: "IS49",
        label: '地/建號',
        sortable: true,
      },
      {
        key: "IS01",
        label: '登記次序',
        sortable: true,
      },
      {
        key: "IS09",
        label: '統一編號',
        sortable: true,
      },
      {
        key: "ISNAME",
        label: '所有權人',
        sortable: true,
      },
      {
        key: "GG30_2",
        label: '其他登記內容',
        sortable: true,
      },
      {
        key: "EE15_1",
        label: '建物權利範圍',
        sortable: true,
      },
      {
        key: "IS03",
        label: '收件年字號',
        sortable: true,
      },
      {
        key: "IS05",
        label: '登記日期',
        sortable: true,
      },
      {
        key: "EE06_CHT",
        label: '登記原因',
        sortable: true,
      },
      {
        key: "IS_DATE",
        label: '異動日期',
        sortable: true,
      }
    ]
  }),
  computed: {
    queryCount () { return this.rows.length },
    qryTypeText () {
      switch (this.qryType) {
        case 'B':
          return '土地所有權部'
        case 'E':
          return '建物所有權部'
        case 'TB':
          return '土地例外'
        case 'TE':
          return '建物例外'
        default:
          return `不支援的型別【${this.qryType}】`
      }
    },
    caption () { return `${this.year}年 共找到 ${this.queryCount} 筆「${this.qryTypeText}」信託資料` },
    cacheKey () { return `reg_trust_case_${this.qryType}_${this.year}` },
    cacheKeyYear () { return `reg_trust_case_years` },
    isValid () { return !this.$utils.empty(this.year) && !this.$utils.empty(this.qryType) },
    style () {
      const parsed = parseInt(this.maxHeight)
      return isNaN(parsed) ? "" : `max-height: ${parsed}px`
    },
    fields () { return this.qryType === 'B' || this.qryType === 'TB' ? this.landFields : this.buildFields }
  },
  watch: {
    rows (val) {
      // this.$utils.log(val)
    }
  },
  methods: {
    search () {
      if(!this.isBusy) {
        this.isBusy = true
        this.committed = false
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: `reg_trust_case`,
          year: this.year,
          query: this.qryType,
          reload: this.forceReload
        }).then((res) => {
          this.rows = res.data.raw || []
          this.notify(res.data.message, { type: this.$utils.statusCheck(res.data.status) ? 'info' : 'warning' })
          const remain_ms = res.data.cache_remaining_time
          if (remain_ms && remain_ms > 0) {
            this.setCache(this.cacheKey, res.data, remain_ms)
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
    },
    resetCommitted () {
      this.committed = false
      this.rows = []
      this.currentPage = 0
    },
    popup (data) {
      this.clickedId = `${data['IS03']}${data['IS04_1']}${data['IS04_2']}`
      this.$bvModal.show(this.modalId)
    },
    landBuildNumber (item) {
      const val = item.IS49
      if (this.qryType === 'B' || this.qryType === 'TB') {
        const mainNumber = val.substring(0, 4).replace(/^[\s0]+/g, '')
        const subNumber = val.substring(4).replace(/^[\s0]+/g, '')
        return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      const mainNumber = val.substring(0, 5).replace(/^[\s0]+/g, '')
      const subNumber = val.substring(5).replace(/^[\s0]+/g, '')
      return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
    }
  },
  created () {
    this.getCache(this.cacheKeyYear).then(years => {
      if (years !== false) {
        this.years = years;
      } else {
        // set year select options
        let len = this.year - 104;
        for (let i = 0; i <= len; i++) {
            this.years.push({value: 104 + i, text: 104 + i});
        }
        this.years.reverse()
        this.setCache(this.cacheKeyYear, this.years, 24 * 60 * 60 * 1000);  // cache for a day
      }
    })
  },
  mounted () {
    this.modalId = this.$utils.uuid()
    this.maxHeight = window.innerHeight - 100
    // restore cached data if found
    var d = new Date();
    this.year = (d.getFullYear() - 1911);
    this.getCache(this.cacheKey).then(json => {
      if (json !== false) {
        this.rows = json.raw
        this.notify(`查詢成功，找到 ${this.rows.length} 筆信託案件。`, { subtitle: this.cacheKey })
      }
    })
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
