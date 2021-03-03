<template>
  <div>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">信託案件檢索【八德版】</div>
            <lah-button icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明"/>
            <lah-help-modal :modal-id="'help-modal'">
              <h5>請參照下列步驟搜尋</h5>
              <ol>
                <li>選擇年份</li>
                <li>選擇查詢類別</li>
                <li>點擊 <lah-fa-icon icon="search" variant="primary"/>搜尋</li>
              </ol>
              <hr/>
              <lah-fa-icon icon="lightbulb" regular variant="warning">點擊「收件年字號」開啟案件詳情視窗</lah-fa-icon>
            </lah-help-modal>
          </div>
          <div class="d-flex small">
            <b-pagination
              v-if="!$utils.empty(rows)"
              v-model="currentPage"
              :total-rows="rows.length"
              :per-page="perPage"
              last-number
              first-number
              aria-controls="trust-table"
              class="my-auto mr-1"
            />
            <b-input-group append="年" class="text-nowrap mr-1">
              <b-form-select
                ref="year"
                v-model="year"
                :options="years"
                class="h-100"
                @change="cached"
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
                @change="cached"
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
              class="mr-1"
              no-icon-gutter
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
        </div>
      </lah-transition>
    </lah-header>
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
        caption-top
        :caption="caption"
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"

        sticky-header
        :style="maxHeightStyle"
      >
        <template #table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <template v-slot:cell(序號)="data">
          {{ data.index + 1 }}
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
      <h4 class="text-center text-info my-5" v-if="modalLoading">
        <b-spinner small type="grow" class="my-auto"></b-spinner>
        <strong class="ld-txt">查詢中...</strong>
      </h4>
      <lah-reg-case-detail :case-id="clickedId" @ready="modalLoading = !$event.detail"/>
    </b-modal>
  </div>
</template>

<script>
export default {
  head: {
    title: "信託案件檢索-桃園市地政局",
  },
  fetchOnServer: false,
  data: () => ({
    modalId: 'this should be an uuid',
    modalLoading: true,
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
    perPage: 25,
    currentPage: 1,
    forceReload: false,
    committed: false,
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
    ],
    maxHeight: 600
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
    fields () { return this.qryType === 'B' || this.qryType === 'TB' ? this.landFields : this.buildFields },
    maxHeightStyle () {
       return `max-height: ${this.maxHeight}px`
    }
  },
  methods: {
    cached () {
      this.reset()
      this.getCache(this.cacheKey).then(json => {
        if (json !== false) {
          this.rows = json.raw
          this.committed = true
          this.notify(`查詢成功，找到 ${this.rows.length} 筆信託案件。`, { subtitle: `${this.cacheKey}(快取)` })
        }
      })
    },
    reload () {
      this.forceReload = true
      this.search()
    },
    search () {
      if(!this.isBusy) {
        this.isBusy = true
        this.committed = false
        this.$axios.post(this.$consts.API.JSON.PREFETCH, {
          type: `reg_trust_case`,
          year: this.year,
          query: this.qryType,
          reload: this.forceReload
        }).then(({ data }) => {
          this.rows = data.raw || []
          this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
          const remain_ms = data.cache_remaining_time
          if (remain_ms && remain_ms > 0) {
            this.setCache(this.cacheKey, data, remain_ms)
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
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
      this.forceReload = false
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data['IS03']}${data['IS04_1']}${data['IS04_2']}`
      this.showModalById(this.modalId)
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
    // restore cached data if found
    var d = new Date();
    this.year = (d.getFullYear() - 1911)
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
      this.cached()
    })
    this.modalId = this.$utils.uuid()
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 105)
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
