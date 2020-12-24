<template>
  <div>
    <lah-transition appear>
      <h3 class="d-flex justify-content-between page-header page-header-padding-override">
        <div class="my-auto">
          <lah-fa-icon icon="user-tag" variant="secondary" append>非專業代理人案件檢索</lah-fa-icon>
        </div>
      </h3>
    </lah-transition>
    <lah-transition appear>
      <b-table
        v-if="committed"
        id="trust-table"
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
        :style="style"
        :fields="fields"
      >
        <template #table-busy>
          <span class="ld-txt">讀取中...</span>
        </template>
        <!-- <template #cell(GG30_2)="{ item }">
          <div v-if="!($utils.empty(item.GG30_1) && $utils.empty(item.GG30_1_CHT) && $utils.empty(item.GG30_2))">
            【{{ item.GG30_1 }}】{{ item.GG30_1_CHT }}{{ item.GG30_2 }}
          </div>
        </template> -->
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
    forceReload: false,
    committed: false,
    maxHeight: 300,
    year: 109,
    rows: [],
    fields: [
      {
        key: "IS48",
        label: '段代碼/名稱',
        sortable: true,
      }
    ]
  }),
  computed: {
    cacheKey () { return `non_official_proxy_case_${this.year}` },
    style () {
      const parsed = parseInt(this.maxHeight)
      return isNaN(parsed) ? "" : `max-height: ${parsed}px`
    }
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
      this.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
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
  mounted () {
    this.modalId = this.$utils.uuid()
    this.maxHeight = window.innerHeight - 100
    // restore cached data if found
    var d = new Date();
    this.year = (d.getFullYear() - 1911);
    this.getCache(this.cacheKey).then(json => {
      if (json !== false) {
        this.rows = json.raw
        this.committed = true
        this.currentPage = 1
        this.notify(`查詢成功，找到 ${this.rows.length} 筆非專業代理人案件。`, { subtitle: this.cacheKey })
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
