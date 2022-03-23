<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex.align-items-center
        .my-auto.mr-1 測量案件
        b-badge.mr-2.my-auto(pill, variant="info") {{ queryCount }} 件
        b-form-radio-group.my-auto(
          v-model="fetchMode",
          size="lg",
          :options="fetchModeOpts"
        )
        lah-button.my-auto(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 案件搜尋說明
          ul
            li 全部未結案的案件：只顯示未結案案件(MOICAS.CMSMS的MM23「結案已否」為空值表示尚未結案)【排除收件字ST的案件】。
            li 即將逾期案件：逾期日期 #[b.text-danger 3日] 內的案件 (MOICAS.CMSMS的MM21_1逾期日期)。
            li 已逾期案件：未結案案件且應結日期已逾今天。

      .d-flex.small
        lah-button.mr-1(
          icon="file-excel",
          size="lg",
          title="匯出EXCEL",
          variant="outline-success",
          action="move-fade-ltr",
          regular,
          no-icon-gutter,
          :disabled="!dataReady",
          @click="xlsx"
        )
        lah-countdown-button(
          ref="countdown",
          title="立即重新讀取",
          variant="outline-secondary",
          badge-variant="secondary",
          icon="sync-alt",
          action="ld-cycle",
          size="lg",
          :milliseconds="cachedMs",
          :disabled="isBusy",
          :busy="isBusy",
          @end="reload",
          @click="reload",
          auto-start,
          end-attention
        )

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center(
      v-if="committed"
      id="land-ref-table"
      ref="table"
      caption-top
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="rows"
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
      :fields="fields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...
      template(v-slot:cell(#)="{ item, index, rowSelected }")
        template(v-if="rowSelected")
          span(aria-hidden="true") &check;
          span.sr-only 勾選
        template(v-else)
          span(aria-hidden="true") &nbsp;
          span.sr-only 無勾選
        span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
      template(#cell(MM01)="{ item: { MM01, MM02, MM02_CHT, MM03 } }"): .text-nowrap(:title="MM02_CHT") {{ MM01 }}-{{ MM02 }}-{{ MM03 }}
      template(#cell(MM06)="{ item: { MM06, MM06_CHT } }"): .text-nowrap {{ MM06 }} : {{ MM06_CHT }}
      template(#cell(M22)="{ item: { MM22, MM22_CHT } }"): .text-nowrap {{ MM22 }} : {{ MM22_CHT }}
      template(#cell(MD04)="{ item: { MD04, MD04_CHT } }"): .text-nowrap {{ MD04 }} : {{ MD04_CHT }}
      template(#cell(MM04_1)="{ item: { MM04_1, MM04_2 } }"): span {{ MM04_1 }} {{ MM04_2 }}
      template(#cell(MD05_1)="{ item: { MD05_1, MD05_2, MD13_1, MD13_2 } }")
        div.p-1.m-1(
          v-if="!$utils.empty(MD13_1) && MD13_1 > MD05_1",
          style="border: 2px dashed red",
          title="延期複丈"
        ) {{ MD13_1 }} {{ MD13_2 }}
        span(v-else) {{ MD05_1 }} {{ MD05_2 }}
      template(#cell(MD06_1)="{ item: { MD06_1, MD06_2 } }"): span {{ MD06_1 }} {{ MD06_2 }}
      template(#cell(MM22_1)="{ item: { MM22_1, MM22_2 } }"): span {{ MM22_1 }} {{ MM22_2 }}
      template(#cell(note)="{ item: { MD09, MD10 } }")
        .flex-column
          div(v-if="!$utils.empty(MD09)") 通知補正：{{ MD09 }}
          div(v-if="!$utils.empty(MD10)") 補正期滿：{{ MD10 }}
  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedId) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:case-id="clickedId" @ready="modalLoading = !$event.detail")
</template>

<script>
export default {
  data: () => ({
    cachedMs: 15 * 60 * 1000,
    modalLoading: true,
    clickedId: undefined,
    rows: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    fields: [
      '#',
      {
        key: 'MM01',
        label: '收件字號',
        sortable: true
      },
      // {
      //   key: 'MM02',
      //   label: '收件字',
      //   sortable: true
      // },
      // {
      //   key: 'MM03',
      //   label: '收件號',
      //   sortable: true
      // },
      {
        key: 'MM06',
        label: '複丈原因',
        sortable: true
      },
      {
        key: 'MM22',
        label: '辦理情形',
        sortable: true
      },
      {
        key: 'MD04',
        label: '測量員',
        sortable: true
      },
      {
        key: 'MM04_1',
        label: '收件時間',
        sortable: true
      },
      {
        key: 'MD05_1',
        label: '複丈時間',
        sortable: true
      },
      {
        key: 'MD06_1',
        label: '結案時間',
        sortable: true
      },
      {
        key: 'MM21_1',
        label: '逾期時間',
        sortable: true
      },
      {
        key: 'note',
        label: '備註',
        sortable: true
      }
    ],
    maxHeight: 600,
    fetchMode: 'overdue',
    fetchModeOpts: [
      { text: '逾期', value: 'overdue' },
      { text: '即將逾期', value: 'near' },
      { text: '未結案', value: 'notyet' }
    ]
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetchOnServer: false,
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中請稍後 ... ')
    } else {
      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload !== true && json) {
          this.rows = json.raw
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.resetCountdown(remaining)
            this.notify(`查詢成功，找到 ${this.rows.length} 筆資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: this.queryType,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              this.resetCountdown(remainMs)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      })
    }
  },
  head: {
    title: '測量案件查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    cacheKey () { return `query_sur_case_${this.fetchMode}` },
    queryCount () { return this.rows.length },
    queryText () { return this.fetchModeOpts.find(opt => opt.value === this.fetchMode)?.text },
    queryType () { return this.fetchMode === 'overdue' ? 'sur_overdue_case' : this.fetchMode === 'near' ? 'sur_near_case' : 'sur_not_close_case' },
    foundText () { return `找到 ${this.queryCount} 筆「${this.queryText}」測量案件資料` }
  },
  watch: {
    fetchMode (dontcare) {
      this.$fetch()
    },
    rows (val) {
      console.warn(val)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    resetCountdown (ms) {
      this.$refs.countdown?.setCountdown(ms)
      this.$refs.countdown?.startCountdown()
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data.RM01}${data.RM02}${data.RM03}`
      this.$refs.caseDetail.show()
    },
    landNumber (item) {
      const val = item.AA49
      if (val) {
        const mainNumber = val.substring(0, 4)
        const subNumber = val.substring(4)
        return this.$utils.empty(subNumber) ? mainNumber : `${mainNumber}-${subNumber}`
      }
      return ''
    },
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    xlsx () {
      // const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.rows.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          // if (fieldKeys.includes(key)) {
          //   obj[this.getLabel(key)] = value
          // }
          obj[key] = value
        }
        return obj
      })
      this.downloadXlsx(`測量${this.queryText}案件查詢`, jsons)
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
